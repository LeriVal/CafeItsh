import type { AddressInfo } from 'node:net'
import type { Server } from 'node:http'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { app } from '../../src/app.js'
import { pool } from '../../src/db/pool.js'
import { hashPassword } from '../../src/services/auth.js'

let server: Server
let base = ''
const sufijo = Date.now()
const adminCorreo = `menudia.admin.${sufijo}@itsh.edu.mx`
const clienteCorreo = `menudia.cliente.${sufijo}@itsh.edu.mx`
let adminToken = ''
let clienteToken = ''
let platilloId = 0
const fechaPrueba = '2099-01-15'

async function api(
  path: string,
  token?: string,
  init?: RequestInit,
): Promise<{ status: number; body: unknown }> {
  const res = await fetch(`${base}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(init?.headers ?? {}),
    },
  })
  return { status: res.status, body: await res.json().catch(() => null) }
}

beforeAll(async () => {
  await new Promise<void>((resolve) => {
    server = app.listen(0, () => resolve())
  })
  base = `http://localhost:${(server.address() as AddressInfo).port}`
  for (const [correo, rol] of [
    [adminCorreo, 'administrador'],
    [clienteCorreo, 'usuario'],
  ] as const) {
    const hash = await hashPassword('Clave1234')
    await pool.query(
      `INSERT INTO usuario (nombre, correo, password_hash, activo, rol_id)
       VALUES ('MenuDia', ?, ?, TRUE, (SELECT id FROM rol WHERE nombre = ?))`,
      [correo, hash, rol],
    )
    const res = await fetch(`${base}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ correo, password: 'Clave1234' }),
    })
    const token = ((await res.json()) as { token: string }).token
    if (rol === 'administrador') adminToken = token
    else clienteToken = token
  }
  const [result] = await pool.query(
    "INSERT INTO platillo (nombre, categoria) VALUES ('Prueba MenuDia', 'Comida')",
  )
  platilloId = (result as { insertId: number }).insertId
})

afterAll(async () => {
  await pool.query('DELETE FROM menu_dia WHERE fecha = ?', [fechaPrueba])
  await pool.query('DELETE FROM platillo WHERE nombre = ?', ['Prueba MenuDia'])
  await pool.query('DELETE FROM usuario WHERE correo IN (?, ?)', [adminCorreo, clienteCorreo])
  await pool.end()
  server.close()
})

describe('menú del día', () => {
  it('publicar 201 y reflejo inmediato en GET', async () => {
    const creado = await api('/api/menu', adminToken, {
      method: 'POST',
      body: JSON.stringify({ fecha: fechaPrueba, platilloId, precio: 42.5, especial: true }),
    })
    expect(creado.status).toBe(201)
    const consulta = await api(`/api/menu?fecha=${fechaPrueba}`, clienteToken)
    expect(consulta.status).toBe(200)
    const data = consulta.body as {
      fecha: string
      lineas: Array<{ precio: string; especial: boolean; platillo: { nombre: string } }>
    }
    expect(data.fecha).toBe(fechaPrueba)
    expect(data.lineas).toHaveLength(1)
    expect(data.lineas[0].platillo.nombre).toBe('Prueba MenuDia')
    expect(data.lineas[0].especial).toBe(true)
  })

  it('PATCH precio y disponibilidad se refleja', async () => {
    const consulta = await api(`/api/menu?fecha=${fechaPrueba}`, adminToken)
    const id = (consulta.body as { lineas: Array<{ id: number }> }).lineas[0].id
    const cambio = await api(`/api/menu/${id}`, adminToken, {
      method: 'PATCH',
      body: JSON.stringify({ precio: 50, disponible: false }),
    })
    expect(cambio.status).toBe(200)
    const deNuevo = await api(`/api/menu?fecha=${fechaPrueba}`, clienteToken)
    const linea = (deNuevo.body as { lineas: Array<{ precio: string; disponible: boolean }> }).lineas[0]
    expect(linea.precio).toBe('50.00')
    expect(linea.disponible).toBe(false)
  })

  it('duplicado por fecha 409', async () => {
    const { status, body } = await api('/api/menu', adminToken, {
      method: 'POST',
      body: JSON.stringify({ fecha: fechaPrueba, platilloId, precio: 10 }),
    })
    expect(status).toBe(409)
    expect((body as { error: { code: string } }).error.code).toBe('DUPLICADO')
  })

  it('precio cero 400 y fecha inválida 400', async () => {
    const cero = await api('/api/menu', adminToken, {
      method: 'POST',
      body: JSON.stringify({ fecha: fechaPrueba, platilloId, precio: 0 }),
    })
    expect(cero.status).toBe(400)
    const mala = await api('/api/menu?fecha=15-01-2099', clienteToken)
    expect(mala.status).toBe(400)
  })

  it('platillo inactivo 400', async () => {
    await pool.query('UPDATE platillo SET activo = FALSE WHERE id = ?', [platilloId])
    const { status } = await api('/api/menu', adminToken, {
      method: 'POST',
      body: JSON.stringify({ fecha: '2099-01-16', platilloId, precio: 10 }),
    })
    await pool.query('UPDATE platillo SET activo = TRUE WHERE id = ?', [platilloId])
    expect(status).toBe(400)
  })

  it('DELETE 204 y luego 404; cliente no puede mutar 403', async () => {
    const consulta = await api(`/api/menu?fecha=${fechaPrueba}`, adminToken)
    const id = (consulta.body as { lineas: Array<{ id: number }> }).lineas[0].id
    const borrado = await api(`/api/menu/${id}`, adminToken, { method: 'DELETE' })
    expect(borrado.status).toBe(204)
    const otraVez = await api(`/api/menu/${id}`, adminToken, { method: 'DELETE' })
    expect(otraVez.status).toBe(404)
    const comoCliente = await api('/api/menu', clienteToken, {
      method: 'POST',
      body: JSON.stringify({ fecha: fechaPrueba, platilloId, precio: 10 }),
    })
    expect(comoCliente.status).toBe(403)
  })
})
