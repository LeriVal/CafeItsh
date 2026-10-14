import type { AddressInfo } from 'node:net'
import type { Server } from 'node:http'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { app } from '../../src/app.js'
import { pool } from '../../src/db/pool.js'
import { hashPassword } from '../../src/services/auth.js'

let server: Server
let base = ''
const sufijo = Date.now()
const cocineroCorreo = `coc.cocinero.${sufijo}@itsh.edu.mx`
const cajeroCorreo = `coc.cajero.${sufijo}@itsh.edu.mx`
const adminCorreo = `coc.admin.${sufijo}@itsh.edu.mx`
const clienteCorreo = `coc.cliente.${sufijo}@itsh.edu.mx`
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
    [cocineroCorreo, 'cocinero'],
    [cajeroCorreo, 'cajero'],
    [adminCorreo, 'administrador'],
    [clienteCorreo, 'usuario'],
  ] as const) {
    const hash = await hashPassword('Clave1234')
    await pool.query(
      `INSERT INTO usuario (nombre, correo, password_hash, activo, rol_id)
       VALUES ('Coc', ?, ?, TRUE, (SELECT id FROM rol WHERE nombre = ?))`,
      [correo, hash, rol],
    )
    const res = await fetch(`${base}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ correo, password: 'Clave1234' }),
    })
    tokens[rol] = ((await res.json()) as { token: string }).token
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
  await pool.query('DELETE FROM usuario WHERE correo IN (?, ?, ?, ?)', [
    cocineroCorreo,
    cajeroCorreo,
    adminCorreo,
    clienteCorreo,
  ])
  await pool.end()
  server.close()
})

async function crearAnticipadoPagado(): Promise<number> {
  const creado = await api('/api/pedidos', tokens.usuario, {
    method: 'POST',
    body: JSON.stringify({
      items: [{ menuDiaId: lineaA, cantidad: 1 }],
      fechaRecoleccion: new Date(Date.now() + 3600_000).toISOString(),
    }),
  })
  const id = (creado.body as { pedido: { id: number } }).pedido.id
  creados.push(id)
  await api(`/api/pedidos/${id}/pagar`, tokens.usuario, {
    method: 'POST',
    body: JSON.stringify({}),
  })
  return id
}

async function crearMostrador(): Promise<number> {
  const creado = await api('/api/pedidos/mostrador', tokens.cajero, {
    method: 'POST',
    body: JSON.stringify({ items: [{ menuDiaId: lineaA, cantidad: 1 }], montoRecibido: 100 }),
  })
  const id = (creado.body as { pedido: { id: number } }).pedido.id
  creados.push(id)
  return id
}

async function crearPendiente(): Promise<number> {
  const creado = await api('/api/pedidos', tokens.usuario, {
    method: 'POST',
    body: JSON.stringify({
      items: [{ menuDiaId: lineaA, cantidad: 1 }],
      fechaRecoleccion: new Date(Date.now() + 3600_000).toISOString(),
    }),
  })
  const id = (creado.body as { pedido: { id: number } }).pedido.id
  creados.push(id)
  return id
}

describe('GET /api/cocina/cola', () => {
  it('ambos orígenes ordenados por llegada con detalle; Pendiente excluido', async () => {
    const idAnt = await crearAnticipadoPagado()
    const idMos = await crearMostrador()
    const idPen = await crearPendiente()
    const { status, body } = await api('/api/cocina/cola', tokens.cocinero)
    expect(status).toBe(200)
    const pedidos = (body as { pedidos: Array<Record<string, unknown>> }).pedidos
    const numeros = pedidos.map((p) => p.id as number)
    expect(numeros).toContain(idAnt)
    expect(numeros).toContain(idMos)
    expect(numeros).not.toContain(idPen)
    expect(numeros.indexOf(idAnt)).toBeLessThan(numeros.indexOf(idMos))
    const primero = pedidos[0] as {
      numero: string
      tipo: string
      cliente: string
      esperaMinutos: number
      fechaRecoleccion: string | null
      lineas: Array<{ nombre: string; cantidad: number }>
    }
    expect(primero.numero).toMatch(/^[AM]-/)
    expect(primero.lineas.length).toBeGreaterThan(0)
    expect(typeof primero.esperaMinutos).toBe('number')
    expect(primero.fechaRecoleccion).toMatch(/^\d{4}-\d{2}-\d{2}T/)
  })

  it('cliente y cajero 403', async () => {
    expect((await api('/api/cocina/cola', tokens.usuario)).status).toBe(403)
    expect((await api('/api/cocina/cola', tokens.cajero)).status).toBe(403)
  })
})

describe('PATCH /api/pedidos/:id/estado', () => {
  it('cocinero avanza Pagado→En preparación→Listo', async () => {
    const id = await crearAnticipadoPagado()
    const paso1 = await api(`/api/pedidos/${id}/estado`, tokens.cocinero, {
      method: 'PATCH',
      body: JSON.stringify({ estado: 'En preparación' }),
    })
    expect(paso1.status).toBe(200)
    expect((paso1.body as { pedido: { estado: string } }).pedido.estado).toBe('En preparación')
    const paso2 = await api(`/api/pedidos/${id}/estado`, tokens.cocinero, {
      method: 'PATCH',
      body: JSON.stringify({ estado: 'Listo' }),
    })
    expect(paso2.status).toBe(200)
    expect((paso2.body as { pedido: { estado: string } }).pedido.estado).toBe('Listo')
  })

  it('cocinero no puede entregar (403) y salto se rechaza (409)', async () => {
    const id = await crearAnticipadoPagado()
    const entrega = await api(`/api/pedidos/${id}/estado`, tokens.cocinero, {
      method: 'PATCH',
      body: JSON.stringify({ estado: 'Entregado' }),
    })
    expect(entrega.status).toBe(403)
    const salto = await api(`/api/pedidos/${id}/estado`, tokens.administrador, {
      method: 'PATCH',
      body: JSON.stringify({ estado: 'Listo' }),
    })
    expect(salto.status).toBe(409)
  })

  it('cajero entrega Listo y cancela pre-entrega; cerrado ya no se mueve', async () => {
    const id = await crearAnticipadoPagado()
    await api(`/api/pedidos/${id}/estado`, tokens.cocinero, {
      method: 'PATCH',
      body: JSON.stringify({ estado: 'En preparación' }),
    })
    await api(`/api/pedidos/${id}/estado`, tokens.cocinero, {
      method: 'PATCH',
      body: JSON.stringify({ estado: 'Listo' }),
    })
    const entrega = await api(`/api/pedidos/${id}/estado`, tokens.cajero, {
      method: 'PATCH',
      body: JSON.stringify({ estado: 'Entregado' }),
    })
    expect(entrega.status).toBe(200)
    const mover = await api(`/api/pedidos/${id}/estado`, tokens.administrador, {
      method: 'PATCH',
      body: JSON.stringify({ estado: 'Cancelado' }),
    })
    expect(mover.status).toBe(409)

    const id2 = await crearMostrador()
    const cancela = await api(`/api/pedidos/${id2}/estado`, tokens.cajero, {
      method: 'PATCH',
      body: JSON.stringify({ estado: 'Cancelado' }),
    })
    expect(cancela.status).toBe(200)
  })

  it('cajero no puede poner En preparación (403)', async () => {
    const id = await crearAnticipadoPagado()
    const { status } = await api(`/api/pedidos/${id}/estado`, tokens.cajero, {
      method: 'PATCH',
      body: JSON.stringify({ estado: 'En preparación' }),
    })
    expect(status).toBe(403)
  })
})

describe('GET /api/caja/listos', () => {
  it('solo Listo para cajero/admin; cliente 403', async () => {
    const id = await crearAnticipadoPagado()
    await api(`/api/pedidos/${id}/estado`, tokens.cocinero, {
      method: 'PATCH',
      body: JSON.stringify({ estado: 'En preparación' }),
    })
    await api(`/api/pedidos/${id}/estado`, tokens.cocinero, {
      method: 'PATCH',
      body: JSON.stringify({ estado: 'Listo' }),
    })
    const { status, body } = await api('/api/caja/listos', tokens.cajero)
    expect(status).toBe(200)
    const pedidos = (body as { pedidos: Array<{ id: number; estado: string }> }).pedidos
    expect(pedidos.map((p) => p.id)).toContain(id)
    expect(pedidos.every((p) => p.estado === 'Listo')).toBe(true)
    expect((await api('/api/caja/listos', tokens.usuario)).status).toBe(403)
  })
})
