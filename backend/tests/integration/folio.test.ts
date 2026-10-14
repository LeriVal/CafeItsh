import type { AddressInfo } from 'node:net'
import type { Server } from 'node:http'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { app } from '../../src/app.js'
import { pool } from '../../src/db/pool.js'
import { hashPassword } from '../../src/services/auth.js'

let server: Server
let base = ''
const sufijo = Date.now()
const cajeroCorreo = `fol.cajero.${sufijo}@itsh.edu.mx`
const adminCorreo = `fol.admin.${sufijo}@itsh.edu.mx`
const clienteCorreo = `fol.cliente.${sufijo}@itsh.edu.mx`
const otroCorreo = `fol.otro.${sufijo}@itsh.edu.mx`
const tokens: Record<string, string> = {}
let lineaA = 0
let folio = ''
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
  const claves: Record<string, string> = {
    [cajeroCorreo]: 'cajero',
    [adminCorreo]: 'administrador',
    [clienteCorreo]: 'cliente',
    [otroCorreo]: 'otro',
  }
  for (const [correo, rol] of [
    [cajeroCorreo, 'cajero'],
    [adminCorreo, 'administrador'],
    [clienteCorreo, 'usuario'],
    [otroCorreo, 'usuario'],
  ] as const) {
    const hash = await hashPassword('Clave1234')
    await pool.query(
      `INSERT INTO usuario (nombre, correo, password_hash, activo, rol_id)
       VALUES ('Fol', ?, ?, TRUE, (SELECT id FROM rol WHERE nombre = ?))`,
      [correo, hash, rol],
    )
    const res = await fetch(`${base}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ correo, password: 'Clave1234' }),
    })
    tokens[claves[correo]] = ((await res.json()) as { token: string }).token
  }
  const [rows] = await pool.query(
    'SELECT md.id FROM menu_dia md WHERE md.fecha = CURRENT_DATE AND md.disponible = TRUE ORDER BY md.id LIMIT 1',
  )
  lineaA = (rows as Array<{ id: number }>)[0].id
  const creado = await api('/api/pedidos', tokens.cliente, {
    method: 'POST',
    body: JSON.stringify({
      items: [{ menuDiaId: lineaA, cantidad: 1 }],
      fechaRecoleccion: new Date(Date.now() + 3600_000).toISOString(),
    }),
  })
  const pedido = (creado.body as { pedido: { id: number; numero: string } }).pedido
  creados.push(pedido.id)
  folio = pedido.numero
})

afterAll(async () => {
  if (creados.length > 0) {
    await pool.query('DELETE FROM pago WHERE pedido_id IN (?)', [creados])
    await pool.query('DELETE FROM pedido WHERE id IN (?)', [creados])
  }
  await pool.query('DELETE FROM usuario WHERE correo IN (?, ?, ?, ?)', [
    cajeroCorreo,
    adminCorreo,
    clienteCorreo,
    otroCorreo,
  ])
  await pool.end()
  server.close()
})

describe('lectura operativa de caja', () => {
  it('cajero busca por folio (insensible a minúsculas)', async () => {
    const { status, body } = await api(
      `/api/pedidos/folio/${folio.toLowerCase()}`,
      tokens.cajero,
    )
    expect(status).toBe(200)
    const pedido = (body as { pedido: { numero: string; detalle: unknown[] } }).pedido
    expect(pedido.numero).toBe(folio)
    expect(pedido.detalle.length).toBeGreaterThan(0)
  })

  it('folio inexistente 404 sin distinguir', async () => {
    const { status, body } = await api('/api/pedidos/folio/A-20990101-9999', tokens.cajero)
    expect(status).toBe(404)
    expect((body as { error: { code: string } }).error.code).toBe('NOT_FOUND')
  })

  it('cliente 403 en folio (rol) y admin sí', async () => {
    expect((await api(`/api/pedidos/folio/${folio}`, tokens.cliente)).status).toBe(403)
    expect((await api(`/api/pedidos/folio/${folio}`, tokens.administrador)).status).toBe(200)
  })

  it('cajero ve cualquier pedido por id; otro cliente no', async () => {
    const id = creados[0]
    const { status, body } = await api(`/api/pedidos/${id}`, tokens.cajero)
    expect(status).toBe(200)
    expect((body as { pedido: { numero: string } }).pedido.numero).toBe(folio)
    expect((await api(`/api/pedidos/${id}`, tokens.otro)).status).toBe(404)
  })
})
