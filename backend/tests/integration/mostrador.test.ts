import type { AddressInfo } from 'node:net'
import type { Server } from 'node:http'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { app } from '../../src/app.js'
import { pool } from '../../src/db/pool.js'
import { hashPassword } from '../../src/services/auth.js'

let server: Server
let base = ''
const sufijo = Date.now()
const cajeroCorreo = `mos.cajero.${sufijo}@itsh.edu.mx`
const adminCorreo = `mos.admin.${sufijo}@itsh.edu.mx`
const clienteCorreo = `mos.cliente.${sufijo}@itsh.edu.mx`
let cajeroToken = ''
let adminToken = ''
let clienteToken = ''
let lineaA = 0
const creados: number[] = []

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
    [cajeroCorreo, 'cajero'],
    [adminCorreo, 'administrador'],
    [clienteCorreo, 'usuario'],
  ] as const) {
    const hash = await hashPassword('Clave1234')
    await pool.query(
      `INSERT INTO usuario (nombre, correo, password_hash, activo, rol_id)
       VALUES ('Mos', ?, ?, TRUE, (SELECT id FROM rol WHERE nombre = ?))`,
      [correo, hash, rol],
    )
    const res = await fetch(`${base}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ correo, password: 'Clave1234' }),
    })
    const token = ((await res.json()) as { token: string }).token
    if (rol === 'cajero') cajeroToken = token
    else if (rol === 'administrador') adminToken = token
    else clienteToken = token
  }
  const [rows] = await pool.query(
    'SELECT md.id FROM menu_dia md WHERE md.fecha = CURRENT_DATE AND md.disponible = TRUE ORDER BY md.id LIMIT 1',
  )
  lineaA = (rows as Array<{ id: number }>)[0].id
})

afterAll(async () => {
  if (creados.length > 0) {
    await pool.query('DELETE FROM pago WHERE pedido_id IN (?)', [creados])
    await pool.query('DELETE FROM pedido WHERE id IN (?)', [creados])
  }
  await pool.query('DELETE FROM usuario WHERE correo IN (?, ?, ?)', [
    cajeroCorreo,
    adminCorreo,
    clienteCorreo,
  ])
  await pool.end()
  server.close()
})

describe('POST /api/pedidos/mostrador', () => {
  it('201 nace Pagado con folio M, pago efectivo y cambio', async () => {
    const { status, body } = await api('/api/pedidos/mostrador', cajeroToken, {
      method: 'POST',
      body: JSON.stringify({
        items: [{ menuDiaId: lineaA, cantidad: 2 }],
        clienteNombre: 'Don Juan',
        montoRecibido: 100,
      }),
    })
    expect(status).toBe(201)
    const data = body as {
      pedido: { id: number; numero: string; estado: string; total: string }
      cambio: string
    }
    creados.push(data.pedido.id)
    expect(data.pedido.numero).toMatch(/^M-\d{8}-\d{4}$/)
    expect(data.pedido.estado).toBe('Pagado')
    const [pagos] = await pool.query('SELECT metodo, monto FROM pago WHERE pedido_id = ?', [
      data.pedido.id,
    ])
    const pago = (pagos as Array<{ metodo: string; monto: string }>)[0]
    expect(pago.metodo).toBe('efectivo')
    expect(Number(data.cambio)).toBeCloseTo(100 - Number(data.pedido.total), 2)
  })

  it('monto insuficiente 400 sin crear', async () => {
    const antes = await contar()
    const { status } = await api('/api/pedidos/mostrador', cajeroToken, {
      method: 'POST',
      body: JSON.stringify({ items: [{ menuDiaId: lineaA, cantidad: 1 }], montoRecibido: 1 }),
    })
    expect(status).toBe(400)
    expect(await contar()).toBe(antes)
  })

  it('no disponible 400', async () => {
    await pool.query('UPDATE menu_dia SET disponible = FALSE WHERE id = ?', [lineaA])
    const { status } = await api('/api/pedidos/mostrador', cajeroToken, {
      method: 'POST',
      body: JSON.stringify({ items: [{ menuDiaId: lineaA, cantidad: 1 }], montoRecibido: 100 }),
    })
    await pool.query('UPDATE menu_dia SET disponible = TRUE WHERE id = ?', [lineaA])
    expect(status).toBe(400)
  })

  it('cliente (usuario) 403 y admin puede crear', async () => {
    const comoCliente = await api('/api/pedidos/mostrador', clienteToken, {
      method: 'POST',
      body: JSON.stringify({ items: [{ menuDiaId: lineaA, cantidad: 1 }], montoRecibido: 100 }),
    })
    expect(comoCliente.status).toBe(403)
    const comoAdmin = await api('/api/pedidos/mostrador', adminToken, {
      method: 'POST',
      body: JSON.stringify({ items: [{ menuDiaId: lineaA, cantidad: 1 }], montoRecibido: 100 }),
    })
    expect(comoAdmin.status).toBe(201)
    creados.push((comoAdmin.body as { pedido: { id: number } }).pedido.id)
  })
})

async function contar(): Promise<number> {
  const [rows] = await pool.query("SELECT COUNT(*) AS n FROM pedido WHERE tipo = 'mostrador'")
  return (rows as Array<{ n: number }>)[0].n
}
