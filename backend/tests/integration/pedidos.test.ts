import type { AddressInfo } from 'node:net'
import type { Server } from 'node:http'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { app } from '../../src/app.js'
import { pool } from '../../src/db/pool.js'
import { cambiarEstado } from '../../src/services/pedidos.js'
import { ProveedorRechazo, pagarPedido } from '../../src/services/pagos.js'
import { hashPassword } from '../../src/services/auth.js'

let server: Server
let base = ''
const sufijo = Date.now()
const adminCorreo = `ped.admin.${sufijo}@itsh.edu.mx`
const clienteCorreo = `ped.cliente.${sufijo}@itsh.edu.mx`
const otroCorreo = `ped.otro.${sufijo}@itsh.edu.mx`
let adminToken = ''
let clienteToken = ''
let otroToken = ''
let lineaA = 0
let lineaB = 0
let precioA = '0'
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

async function crearUsuario(correo: string, rol: string): Promise<void> {
  const hash = await hashPassword('Clave1234')
  await pool.query(
    `INSERT INTO usuario (nombre, correo, password_hash, activo, rol_id)
     VALUES ('Ped', ?, ?, TRUE, (SELECT id FROM rol WHERE nombre = ?))`,
    [correo, hash, rol],
  )
}

async function login(correo: string): Promise<string> {
  const res = await fetch(`${base}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ correo, password: 'Clave1234' }),
  })
  return ((await res.json()) as { token: string }).token
}

/**
 * Los archivos de test corren en paralelo sobre la misma BD y
 * usuarios.test.ts desactiva momentáneamente a los demás admins para probar
 * la regla del último administrador. Se reintenta ante ese 401 transitorio.
 */
async function loginRobusto(correo: string, intentos = 15): Promise<string> {
  for (let i = 0; i < intentos; i += 1) {
    const token = await login(correo).catch(() => '')
    if (token) return token
    await new Promise((r) => setTimeout(r, 100))
  }
  throw new Error(`sin token para ${correo}`)
}

async function estadoAdminPedido(id: number, intentos = 15): Promise<number> {
  let status = 0
  for (let i = 0; i < intentos && status !== 200; i += 1) {
    status = (await api(`/api/pedidos/${id}`, adminToken)).status
    if (status !== 200) await new Promise((r) => setTimeout(r, 100))
  }
  return status
}

function recogidaEn(minutos: number): string {
  return new Date(Date.now() + minutos * 60 * 1000).toISOString()
}

beforeAll(async () => {
  await new Promise<void>((resolve) => {
    server = app.listen(0, () => resolve())
  })
  base = `http://localhost:${(server.address() as AddressInfo).port}`
  await crearUsuario(adminCorreo, 'administrador')
  await crearUsuario(clienteCorreo, 'usuario')
  await crearUsuario(otroCorreo, 'usuario')
  adminToken = await loginRobusto(adminCorreo)
  clienteToken = await loginRobusto(clienteCorreo)
  otroToken = await loginRobusto(otroCorreo)
  const [rows] = await pool.query(
    `SELECT md.id, md.precio FROM menu_dia md
     WHERE md.fecha = CURRENT_DATE AND md.disponible = TRUE ORDER BY md.id LIMIT 2`,
  )
  const lineas = rows as Array<{ id: number; precio: string }>
  lineaA = lineas[0].id
  lineaB = lineas[1].id
  precioA = String(lineas[0].precio)
})

afterAll(async () => {
  if (creados.length > 0) {
    await pool.query('DELETE FROM pago WHERE pedido_id IN (?)', [creados])
    await pool.query('DELETE FROM pedido WHERE id IN (?)', [creados])
  }
  await pool.query('DELETE FROM usuario WHERE correo IN (?, ?, ?)', [
    adminCorreo,
    clienteCorreo,
    otroCorreo,
  ])
  await pool.end()
  server.close()
})

describe('POST /api/pedidos', () => {
  it('201 con folio, total y detalle congelado en Pendiente', async () => {
    const { status, body } = await api('/api/pedidos', clienteToken, {
      method: 'POST',
      body: JSON.stringify({
        items: [
          { menuDiaId: lineaA, cantidad: 2 },
          { menuDiaId: lineaB, cantidad: 1 },
        ],
        fechaRecoleccion: recogidaEn(30),
      }),
    })
    expect(status).toBe(201)
    const pedido = (body as { pedido: Record<string, unknown> }).pedido as {
      id: number
      numero: string
      estado: string
      total: string
      detalle: Array<{ cantidad: number; precioUnitario: string; subtotal: string }>
    }
    creados.push(pedido.id)
    expect(pedido.numero).toMatch(/^A-\d{8}-\d{4}$/)
    expect(pedido.estado).toBe('Pendiente')
    const esperado = (Number(precioA) * 2 + Number((await precioDe(lineaB))) * 1).toFixed(2)
    expect(pedido.total).toBe(esperado)
    expect(pedido.detalle).toHaveLength(2)
  })

  it('<10 minutos 400 sin crear pedido', async () => {
    const antes = await contarPedidos()
    const { status, body } = await api('/api/pedidos', clienteToken, {
      method: 'POST',
      body: JSON.stringify({
        items: [{ menuDiaId: lineaA, cantidad: 1 }],
        fechaRecoleccion: recogidaEn(5),
      }),
    })
    expect(status).toBe(400)
    expect((body as { error: { code: string } }).error.code).toBe('VALIDATION_ERROR')
    expect(await contarPedidos()).toBe(antes)
  })

  it('línea no disponible 400', async () => {
    await pool.query('UPDATE menu_dia SET disponible = FALSE WHERE id = ?', [lineaB])
    const { status } = await api('/api/pedidos', clienteToken, {
      method: 'POST',
      body: JSON.stringify({
        items: [{ menuDiaId: lineaB, cantidad: 1 }],
        fechaRecoleccion: recogidaEn(30),
      }),
    })
    await pool.query('UPDATE menu_dia SET disponible = TRUE WHERE id = ?', [lineaB])
    expect(status).toBe(400)
  })

  it('vacío y cantidades inválidas 400', async () => {
    const vacio = await api('/api/pedidos', clienteToken, {
      method: 'POST',
      body: JSON.stringify({ items: [], fechaRecoleccion: recogidaEn(30) }),
    })
    expect(vacio.status).toBe(400)
    const cero = await api('/api/pedidos', clienteToken, {
      method: 'POST',
      body: JSON.stringify({
        items: [{ menuDiaId: lineaA, cantidad: 0 }],
        fechaRecoleccion: recogidaEn(30),
      }),
    })
    expect(cero.status).toBe(400)
  })

  it('campos de tarjeta 400 dedicado', async () => {
    const { status, body } = await api('/api/pedidos', clienteToken, {
      method: 'POST',
      body: JSON.stringify({
        items: [{ menuDiaId: lineaA, cantidad: 1 }],
        fechaRecoleccion: recogidaEn(30),
        tarjeta: '4111111111111111',
        cvv: '123',
      }),
    })
    expect(status).toBe(400)
    expect((body as { error: { code: string } }).error.code).toBe('CARD_DATA_FORBIDDEN')
  })
})

describe('GET /api/pedidos/:id', () => {
  it('dueño y admin ven; otro cliente no distingue (404)', async () => {
    const creado = await api('/api/pedidos', clienteToken, {
      method: 'POST',
      body: JSON.stringify({
        items: [{ menuDiaId: lineaA, cantidad: 1 }],
        fechaRecoleccion: recogidaEn(30),
      }),
    })
    const id = (creado.body as { pedido: { id: number } }).pedido.id
    creados.push(id)
    expect((await api(`/api/pedidos/${id}`, clienteToken)).status).toBe(200)
    expect(await estadoAdminPedido(id)).toBe(200)
    const ajeno = await api(`/api/pedidos/${id}`, otroToken)
    expect(ajeno.status).toBe(404)
  })
})

describe('máquina de estados por datos', () => {
  it('salto Pendiente→Listo rechazado', async () => {
    const creado = await api('/api/pedidos', clienteToken, {
      method: 'POST',
      body: JSON.stringify({
        items: [{ menuDiaId: lineaA, cantidad: 1 }],
        fechaRecoleccion: recogidaEn(30),
      }),
    })
    const id = (creado.body as { pedido: { id: number } }).pedido.id
    creados.push(id)
    const conn = await pool.getConnection()
    await expect(cambiarEstado(conn, id, 'Listo', null)).rejects.toMatchObject({
      code: 'INVALID_TRANSITION',
    })
    conn.release()
  })
})

describe('POST /api/pedidos/:id/pagar', () => {
  async function crearPendiente(): Promise<number> {
    const creado = await api('/api/pedidos', clienteToken, {
      method: 'POST',
      body: JSON.stringify({
        items: [{ menuDiaId: lineaA, cantidad: 1 }],
        fechaRecoleccion: recogidaEn(30),
      }),
    })
    const id = (creado.body as { pedido: { id: number } }).pedido.id
    creados.push(id)
    return id
  }

  it('200 pasa a Pagado con referencia y fila de pago', async () => {
    const id = await crearPendiente()
    const { status, body } = await api(`/api/pedidos/${id}/pagar`, clienteToken, {
      method: 'POST',
      body: JSON.stringify({}),
    })
    expect(status).toBe(200)
    const data = body as { pedido: { estado: string; total: string }; pago: { referencia: string } }
    expect(data.pedido.estado).toBe('Pagado')
    expect(data.pago.referencia).toMatch(/^SIM-/)
    const [rows] = await pool.query('SELECT monto FROM pago WHERE pedido_id = ?', [id])
    expect(String((rows as Array<{ monto: string }>)[0].monto)).toBe(data.pedido.total)
  })

  it('segundo pago 409 sin duplicar pago', async () => {
    const id = await crearPendiente()
    await api(`/api/pedidos/${id}/pagar`, clienteToken, {
      method: 'POST',
      body: JSON.stringify({}),
    })
    const { status, body } = await api(`/api/pedidos/${id}/pagar`, clienteToken, {
      method: 'POST',
      body: JSON.stringify({}),
    })
    expect(status).toBe(409)
    expect((body as { error: { code: string } }).error.code).toBe('INVALID_TRANSITION')
    const [rows] = await pool.query('SELECT COUNT(*) AS n FROM pago WHERE pedido_id = ?', [id])
    expect((rows as Array<{ n: number }>)[0].n).toBe(1)
  })

  it('otro cliente no puede pagar (404)', async () => {
    const id = await crearPendiente()
    const { status } = await api(`/api/pedidos/${id}/pagar`, otroToken, {
      method: 'POST',
      body: JSON.stringify({}),
    })
    expect(status).toBe(404)
  })

  it('campos de tarjeta 400 dedicado', async () => {
    const id = await crearPendiente()
    const { status, body } = await api(`/api/pedidos/${id}/pagar`, clienteToken, {
      method: 'POST',
      body: JSON.stringify({ numeroTarjeta: '4111111111111111' }),
    })
    expect(status).toBe(400)
    expect((body as { error: { code: string } }).error.code).toBe('CARD_DATA_FORBIDDEN')
  })

  it('rechazo del proveedor deja Pendiente y permite reintento (servicio)', async () => {
    const id = await crearPendiente()
    const [usuarios] = await pool.query(
      'SELECT id FROM usuario WHERE correo = ?',
      [clienteCorreo],
    )
    const clienteId = (usuarios as Array<{ id: number }>)[0].id
    await expect(
      pagarPedido(id, { id: clienteId, rol: 'usuario' }, { simularRechazo: true }),
    ).rejects.toBeInstanceOf(ProveedorRechazo)
    const { status, body } = await api(`/api/pedidos/${id}`, clienteToken)
    expect(status).toBe(200)
    expect((body as { pedido: { estado: string } }).pedido.estado).toBe('Pendiente')
    const reintento = await api(`/api/pedidos/${id}/pagar`, clienteToken, {
      method: 'POST',
      body: JSON.stringify({}),
    })
    expect(reintento.status).toBe(200)
    expect(
      (reintento.body as { pedido: { estado: string } }).pedido.estado,
    ).toBe('Pagado')
  })
})

async function precioDe(menuDiaId: number): Promise<string> {
  const [rows] = await pool.query('SELECT precio FROM menu_dia WHERE id = ?', [menuDiaId])
  return String((rows as Array<{ precio: string }>)[0].precio)
}

async function contarPedidos(): Promise<number> {
  const [rows] = await pool.query('SELECT COUNT(*) AS n FROM pedido')
  return (rows as Array<{ n: number }>)[0].n
}
