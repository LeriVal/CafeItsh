import type { AddressInfo } from 'node:net'
import type { Server } from 'node:http'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { app } from '../../src/app.js'
import { pool } from '../../src/db/pool.js'
import { hashPassword } from '../../src/services/auth.js'

let server: Server
let base = ''
const sufijo = Date.now()
const clienteCorreo = `avi.cliente.${sufijo}@itsh.edu.mx`
const otroCorreo = `avi.otro.${sufijo}@itsh.edu.mx`
const adminCorreo = `avi.admin.${sufijo}@itsh.edu.mx`
const tokens: Record<string, string> = {}
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
    [clienteCorreo, 'usuario'],
    [otroCorreo, 'usuario'],
    [adminCorreo, 'administrador'],
  ] as const) {
    const hash = await hashPassword('Clave1234')
    await pool.query(
      `INSERT INTO usuario (nombre, correo, password_hash, activo, rol_id)
       VALUES ('Avi', ?, ?, TRUE, (SELECT id FROM rol WHERE nombre = ?))`,
      [correo, hash, rol],
    )
    const res = await fetch(`${base}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ correo, password: 'Clave1234' }),
    })
    tokens[correo] = ((await res.json()) as { token: string }).token
  }
  const [rows] = await pool.query(
    'SELECT md.id FROM menu_dia md WHERE md.fecha = CURRENT_DATE AND md.disponible = TRUE ORDER BY md.id LIMIT 1',
  )
  lineaA = (rows as Array<{ id: number }>)[0].id
})

afterAll(async () => {
  if (creados.length > 0) {
    await pool.query('DELETE FROM notificacion WHERE pedido_id IN (?)', [creados])
    await pool.query('DELETE FROM pago WHERE pedido_id IN (?)', [creados])
    await pool.query('DELETE FROM pedido WHERE id IN (?)', [creados])
  }
  await pool.query('DELETE FROM usuario WHERE correo IN (?, ?, ?)', [
    clienteCorreo,
    otroCorreo,
    adminCorreo,
  ])
  await pool.end()
  server.close()
})

async function crearPagado(): Promise<number> {
  const creado = await api('/api/pedidos', tokens[clienteCorreo], {
    method: 'POST',
    body: JSON.stringify({
      items: [{ menuDiaId: lineaA, cantidad: 1 }],
      fechaRecoleccion: new Date(Date.now() + 3600_000).toISOString(),
    }),
  })
  const id = (creado.body as { pedido: { id: number } }).pedido.id
  creados.push(id)
  await api(`/api/pedidos/${id}/pagar`, tokens[clienteCorreo], {
    method: 'POST',
    body: JSON.stringify({}),
  })
  return id
}

async function llevarAListo(id: number): Promise<void> {
  // Transición vía admin (permiso total) para aislar el aviso del rol.
  await api(`/api/pedidos/${id}/estado`, tokens[adminCorreo], {
    method: 'PATCH',
    body: JSON.stringify({ estado: 'En preparación' }),
  })
  await api(`/api/pedidos/${id}/estado`, tokens[adminCorreo], {
    method: 'PATCH',
    body: JSON.stringify({ estado: 'Listo' }),
  })
}

describe('GET /api/pedidos/mios', () => {
  it('lista solo propios recientes-primero con detalle', async () => {
    const id1 = await crearPagado()
    const id2 = await crearPagado()
    const { status, body } = await api('/api/pedidos/mios', tokens[clienteCorreo])
    expect(status).toBe(200)
    const pedidos = (
      body as {
        pedidos: Array<{ id: number; numero: string; estado: string; detalle: Array<{ nombre: string }> }>
      }
    ).pedidos
    const ids = pedidos.map((p) => p.id)
    expect(ids).toContain(id1)
    expect(ids).toContain(id2)
    expect(ids.indexOf(id2)).toBeLessThan(ids.indexOf(id1))
    expect(pedidos[0].detalle.length).toBeGreaterThan(0)
    const ajenos = await api('/api/pedidos/mios', tokens[otroCorreo])
    const idsAjenos = (
      ajenos.body as { pedidos: Array<{ id: number }> }
    ).pedidos.map((p) => p.id)
    expect(idsAjenos).not.toContain(id1)
  })

  it('/mios no colisiona con /:id', async () => {
    const { status } = await api('/api/pedidos/mios', tokens[clienteCorreo])
    expect(status).toBe(200)
  })
})

describe('avisos de pedido listo', () => {
  it('llegar a Listo genera un aviso; otros estados no', async () => {
    const id = await crearPagado()
    let avisos: Array<{ pedidoId: number; leida: boolean }>
    avisos = (
      (await api('/api/avisos', tokens[clienteCorreo])).body as {
        avisos: Array<{ pedidoId: number; leida: boolean }>
      }
    ).avisos
    expect(avisos.map((a) => a.pedidoId)).not.toContain(id)
    await llevarAListo(id)
    avisos = (
      (await api('/api/avisos', tokens[clienteCorreo])).body as {
        avisos: Array<{ pedidoId: number; leida: boolean }>
      }
    ).avisos
    const aviso = avisos.find((a) => a.pedidoId === id)
    expect(aviso).toBeDefined()
    expect(aviso?.leida).toBe(false)
  })

  it('marcar visto propio 200; ajeno 404', async () => {
    const id = await crearPagado()
    await llevarAListo(id)
    const lista = await api('/api/avisos', tokens[clienteCorreo])
    const aviso = (
      lista.body as { avisos: Array<{ id: number; pedidoId: number }> }
    ).avisos.find((a) => a.pedidoId === id)
    expect(aviso).toBeDefined()
    const marcado = await api(`/api/avisos/${aviso?.id}/leida`, tokens[clienteCorreo], {
      method: 'PATCH',
    })
    expect(marcado.status).toBe(200)
    expect((marcado.body as { aviso: { leida: boolean } }).aviso.leida).toBe(true)
    const ajeno = await api(`/api/avisos/${aviso?.id}/leida`, tokens[otroCorreo], {
      method: 'PATCH',
    })
    expect(ajeno.status).toBe(404)
  })
})
