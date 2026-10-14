import type { RowDataPacket } from 'mysql2/promise'
import { pool } from '../db/pool.js'

export interface PedidoCola {
  id: number
  numero: string
  tipo: string
  estado: string
  cliente: string
  esperaMinutos: number
  creadoEn: string
  total: string
  fechaRecoleccion: string | null
  lineas: Array<{ nombre: string; cantidad: number }>
}

interface ColaRow {
  id: number
  numero: string
  tipo: string
  estado: string
  cliente_nombre: string | null
  duenio_nombre: string | null
  creado_en: Date | string
  total: string
  fecha_recoleccion: Date | string | null
}

async function conDetalle(pedidos: ColaRow[]): Promise<PedidoCola[]> {
  if (pedidos.length === 0) return []
  const ids = pedidos.map((p) => p.id)
  const [det] = await pool.query<RowDataPacket[]>(
    `SELECT d.pedido_id AS pedidoId, p.nombre, d.cantidad
     FROM pedido_detalle d JOIN menu_dia md ON md.id = d.menu_dia_id
     JOIN platillo p ON p.id = md.platillo_id
     WHERE d.pedido_id IN (?) ORDER BY d.id`,
    [ids],
  )
  const porPedido = new Map<number, Array<{ nombre: string; cantidad: number }>>()
  for (const d of det as Array<{ pedidoId: number; nombre: string; cantidad: number }>) {
    const lista = porPedido.get(d.pedidoId) ?? []
    lista.push({ nombre: d.nombre, cantidad: d.cantidad })
    porPedido.set(d.pedidoId, lista)
  }
  const ahora = Date.now()
  return pedidos.map((p) => {
    const creado = p.creado_en instanceof Date ? p.creado_en.getTime() : new Date(String(p.creado_en).replace(' ', 'T') + 'Z').getTime()
    const recogida =
      p.fecha_recoleccion === null || p.fecha_recoleccion === undefined
        ? null
        : p.fecha_recoleccion instanceof Date
          ? p.fecha_recoleccion.toISOString()
          : `${String(p.fecha_recoleccion).replace(' ', 'T')}Z`
    return {
      id: p.id,
      numero: p.numero,
      tipo: p.tipo,
      estado: p.estado,
      cliente: p.cliente_nombre ?? p.duenio_nombre ?? 'Mostrador',
      esperaMinutos: Math.max(0, Math.floor((ahora - creado) / 60000)),
      creadoEn: p.creado_en instanceof Date ? p.creado_en.toISOString() : String(p.creado_en),
      total: String(p.total),
      fechaRecoleccion: recogida,
      lineas: porPedido.get(p.id) ?? [],
    }
  })
}

/** Cola activa de cocina: Pagado + En preparación, ambos orígenes, por llegada. */
export async function colaCocina(): Promise<PedidoCola[]> {
  const [rows] = await pool.query<RowDataPacket[]>(
    `SELECT p.id, p.numero, p.tipo, e.nombre AS estado, p.cliente_nombre,
            du.nombre AS duenio_nombre, p.creado_en, p.total, p.fecha_recoleccion
     FROM pedido p
     JOIN estado_pedido e ON e.id = p.estado_id
     LEFT JOIN usuario du ON du.id = p.usuario_id
     WHERE e.nombre IN ('Pagado', 'En preparación')
     ORDER BY p.creado_en`,
  )
  return conDetalle(rows as ColaRow[])
}

/** Pedidos Listo para entrega en caja, ambos orígenes, por llegada. */
export async function listosParaEntrega(): Promise<PedidoCola[]> {
  const [rows] = await pool.query<RowDataPacket[]>(
    `SELECT p.id, p.numero, p.tipo, e.nombre AS estado, p.cliente_nombre,
            du.nombre AS duenio_nombre, p.creado_en, p.total
     FROM pedido p
     JOIN estado_pedido e ON e.id = p.estado_id
     LEFT JOIN usuario du ON du.id = p.usuario_id
     WHERE e.nombre = 'Listo'
     ORDER BY p.creado_en`,
  )
  return conDetalle(rows as ColaRow[])
}
