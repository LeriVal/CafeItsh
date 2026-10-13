import type { PoolConnection, RowDataPacket } from 'mysql2/promise'
import { pool } from '../db/pool.js'
import { AppError } from '../middlewares/errorHandler.js'
import { hoyMx } from './menu.js'

export interface DetalleVista {
  menuDiaId: number
  nombre: string
  cantidad: number
  precioUnitario: string
  subtotal: string
}

export interface PedidoVista {
  id: number
  numero: string
  tipo: string
  estado: string
  total: string
  fechaRecoleccion: string | null
  detalle: DetalleVista[]
  pagoReferencia: string | null
}

const ESTADOS_FINALES = ['Entregado', 'Cancelado']
const MAX_INTENTOS_FOLIO = 3

function aDinero(centavos: number): string {
  return (centavos / 100).toFixed(2)
}

function aMysqlDatetime(d: Date): string {
  return d.toISOString().slice(0, 19).replace('T', ' ')
}

async function estadoId(
  conn: PoolConnection,
  nombre: string,
): Promise<number> {
  const [rows] = await conn.query<RowDataPacket[]>(
    'SELECT id FROM estado_pedido WHERE nombre = ?',
    [nombre],
  )
  const found = rows[0] as { id: number } | undefined
  if (!found) throw new AppError(500, 'INTERNAL_ERROR', 'Ocurrió un error inesperado')
  return found.id
}

/**
 * Cambia el estado validando contra transicion_estado y rechazando mover
 * estados finales. Escribe el historial. Debe llamarse dentro de una
 * transacción con la fila del pedido bloqueada.
 */
export async function cambiarEstado(
  conn: PoolConnection,
  pedidoId: number,
  nuevoEstado: string,
  actorId: number | null,
): Promise<void> {
  const [rows] = await conn.query<RowDataPacket[]>(
    `SELECT p.estado_id, e.nombre AS estado FROM pedido p
     JOIN estado_pedido e ON e.id = p.estado_id WHERE p.id = ?`,
    [pedidoId],
  )
  const actual = rows[0] as { estado_id: number; estado: string } | undefined
  if (!actual) {
    throw new AppError(404, 'NOT_FOUND', 'Pedido no encontrado')
  }
  if (ESTADOS_FINALES.includes(actual.estado)) {
    throw new AppError(409, 'INVALID_TRANSITION', 'Ese pedido ya está cerrado')
  }
  const nuevoId = await estadoId(conn, nuevoEstado)
  const [trans] = await conn.query<RowDataPacket[]>(
    'SELECT 1 AS ok FROM transicion_estado WHERE desde_id = ? AND hacia_id = ?',
    [actual.estado_id, nuevoId],
  )
  if (trans.length === 0) {
    throw new AppError(
      409,
      'INVALID_TRANSITION',
      `No se puede pasar de ${actual.estado} a ${nuevoEstado}`,
    )
  }
  await conn.query('UPDATE pedido SET estado_id = ? WHERE id = ?', [nuevoId, pedidoId])
  await conn.query(
    `INSERT INTO pedido_estado_historial (pedido_id, estado_anterior_id, estado_nuevo_id, cambiado_por)
     VALUES (?, ?, ?, ?)`,
    [pedidoId, actual.estado_id, nuevoId, actorId],
  )
}

async function generarFolio(conn: PoolConnection, dia: string): Promise<string> {
  const compacto = dia.replace(/-/g, '')
  const [rows] = await conn.query<RowDataPacket[]>(
    "SELECT COUNT(*) AS n FROM pedido WHERE numero LIKE CONCAT('A-', ?, '-%')",
    [compacto],
  )
  let seq = ((rows[0] as { n: number }).n ?? 0) + 1
  for (let intento = 0; intento < MAX_INTENTOS_FOLIO; intento += 1) {
    const folio = `A-${compacto}-${String(seq).padStart(4, '0')}`
    const [existe] = await conn.query<RowDataPacket[]>(
      'SELECT 1 AS ok FROM pedido WHERE numero = ?',
      [folio],
    )
    if (existe.length === 0) return folio
    seq += 1
  }
  throw new AppError(500, 'INTERNAL_ERROR', 'Ocurrió un error inesperado')
}

interface LineaCargada {
  menuDiaId: number
  nombre: string
  precioCentavos: number
  disponible: boolean
}

export async function crearAnticipado(
  usuarioId: number,
  input: { items: unknown; fechaRecoleccion: unknown },
): Promise<PedidoVista> {
  if (!Array.isArray(input.items) || input.items.length === 0) {
    throw new AppError(400, 'VALIDATION_ERROR', 'El pedido debe tener al menos un platillo')
  }
  const vistos = new Set<number>()
  const items: Array<{ menuDiaId: number; cantidad: number }> = []
  for (const crudo of input.items) {
    const it = crudo as { menuDiaId?: unknown; cantidad?: unknown }
    if (typeof it.menuDiaId !== 'number' || !Number.isInteger(it.menuDiaId)) {
      throw new AppError(400, 'VALIDATION_ERROR', 'Hay líneas del pedido no válidas')
    }
    if (typeof it.cantidad !== 'number' || !Number.isInteger(it.cantidad) || it.cantidad < 1 || it.cantidad > 20) {
      throw new AppError(400, 'VALIDATION_ERROR', 'La cantidad debe ser un entero entre 1 y 20')
    }
    if (vistos.has(it.menuDiaId)) {
      throw new AppError(400, 'VALIDATION_ERROR', 'Hay platillos repetidos en el pedido')
    }
    vistos.add(it.menuDiaId)
    items.push({ menuDiaId: it.menuDiaId, cantidad: it.cantidad })
  }

  if (typeof input.fechaRecoleccion !== 'string') {
    throw new AppError(400, 'VALIDATION_ERROR', 'La hora de recogida no es válida')
  }
  const recogida = new Date(input.fechaRecoleccion)
  if (Number.isNaN(recogida.getTime())) {
    throw new AppError(400, 'VALIDATION_ERROR', 'La hora de recogida no es válida')
  }
  if (recogida.getTime() < Date.now() + 10 * 60 * 1000) {
    throw new AppError(
      400,
      'VALIDATION_ERROR',
      'El pedido anticipado requiere al menos 10 minutos de anticipación',
    )
  }

  const conn = await pool.getConnection()
  try {
    await conn.beginTransaction()
    const hoy = hoyMx()
    const ids = items.map((i) => i.menuDiaId)
    const [rows] = await conn.query<RowDataPacket[]>(
      `SELECT md.id AS menuDiaId, p.nombre, md.precio, md.disponible
       FROM menu_dia md JOIN platillo p ON p.id = md.platillo_id
       WHERE md.id IN (?) AND md.fecha = ? FOR UPDATE`,
      [ids, hoy],
    )
    const mapa = new Map<number, LineaCargada>()
    for (const r of rows as Array<{
      menuDiaId: number
      nombre: string
      precio: string
      disponible: number
    }>) {
      mapa.set(r.menuDiaId, {
        menuDiaId: r.menuDiaId,
        nombre: r.nombre,
        precioCentavos: Math.round(Number(r.precio) * 100),
        disponible: r.disponible === 1,
      })
    }
    let totalCentavos = 0
    const detalle: Array<LineaCargada & { cantidad: number; subtotalCentavos: number }> = []
    for (const it of items) {
      const linea = mapa.get(it.menuDiaId)
      if (!linea) {
        throw new AppError(400, 'VALIDATION_ERROR', 'Hay platillos que ya no están en el menú de hoy')
      }
      if (!linea.disponible) {
        throw new AppError(400, 'VALIDATION_ERROR', `${linea.nombre} ya no está disponible`)
      }
      const subtotal = linea.precioCentavos * it.cantidad
      totalCentavos += subtotal
      detalle.push({ ...linea, cantidad: it.cantidad, subtotalCentavos: subtotal })
    }

    const pendienteId = await estadoId(conn, 'Pendiente')
    const temp = `TMP-${Date.now().toString(36)}${Math.floor(Math.random() * 1296).toString(36)}`
    const [ins] = await conn.query(
      `INSERT INTO pedido (numero, tipo, estado_id, usuario_id, fecha_recoleccion, total, creado_por)
       VALUES (?, 'anticipado', ?, ?, ?, ?, ?)`,
      [temp, pendienteId, usuarioId, aMysqlDatetime(recogida), aDinero(totalCentavos), usuarioId],
    )
    const pedidoId = (ins as { insertId: number }).insertId
    for (const d of detalle) {
      await conn.query(
        `INSERT INTO pedido_detalle (pedido_id, menu_dia_id, cantidad, precio_unitario, subtotal)
         VALUES (?, ?, ?, ?, ?)`,
        [pedidoId, d.menuDiaId, d.cantidad, aDinero(d.precioCentavos), aDinero(d.subtotalCentavos)],
      )
    }
    await conn.query(
      `INSERT INTO pedido_estado_historial (pedido_id, estado_anterior_id, estado_nuevo_id, cambiado_por)
       VALUES (?, NULL, ?, ?)`,
      [pedidoId, pendienteId, usuarioId],
    )
    const folio = await generarFolio(conn, hoy)
    await conn.query('UPDATE pedido SET numero = ? WHERE id = ?', [folio, pedidoId])
    await conn.commit()
    const vista = await leerPedido(conn, pedidoId)
    if (!vista) throw new AppError(500, 'INTERNAL_ERROR', 'Ocurrió un error inesperado')
    return vista
  } catch (err) {
    await conn.rollback()
    throw err
  } finally {
    conn.release()
  }
}

async function leerPedido(
  conn: PoolConnection,
  pedidoId: number,
): Promise<PedidoVista | null> {
  const [rows] = await conn.query<RowDataPacket[]>(
    `SELECT p.id, p.numero, p.tipo, e.nombre AS estado, p.total, p.fecha_recoleccion
     FROM pedido p JOIN estado_pedido e ON e.id = p.estado_id WHERE p.id = ?`,
    [pedidoId],
  )
  const base = rows[0] as
    | { id: number; numero: string; tipo: string; estado: string; total: string; fecha_recoleccion: Date | string }
    | undefined
  if (!base) return null
  const [det] = await conn.query<RowDataPacket[]>(
    `SELECT d.menu_dia_id AS menuDiaId, p.nombre, d.cantidad, d.precio_unitario AS precioUnitario, d.subtotal
     FROM pedido_detalle d JOIN menu_dia md ON md.id = d.menu_dia_id
     JOIN platillo p ON p.id = md.platillo_id WHERE d.pedido_id = ?`,
    [pedidoId],
  )
  const [pagos] = await conn.query<RowDataPacket[]>(
    'SELECT referencia FROM pago WHERE pedido_id = ?',
    [pedidoId],
  )
  const fecha =
    base.fecha_recoleccion instanceof Date
      ? base.fecha_recoleccion.toISOString()
      : `${String(base.fecha_recoleccion).replace(' ', 'T')}Z`
  return {
    id: base.id,
    numero: base.numero,
    tipo: base.tipo,
    estado: base.estado,
    total: String(base.total),
    fechaRecoleccion: fecha,
    detalle: (det as Array<{
      menuDiaId: number
      nombre: string
      cantidad: number
      precioUnitario: string
      subtotal: string
    }>).map((d) => ({
      menuDiaId: d.menuDiaId,
      nombre: d.nombre,
      cantidad: d.cantidad,
      precioUnitario: String(d.precioUnitario),
      subtotal: String(d.subtotal),
    })),
    pagoReferencia: (pagos[0] as { referencia: string } | undefined)?.referencia ?? null,
  }
}

/** Dueño o administrador; 404 sin distinguir para no filtrar existencia. */
export async function obtenerPedido(
  pedidoId: number,
  solicitante: { id: number; rol: string },
): Promise<PedidoVista> {
  const conn = await pool.getConnection()
  try {
    const [rows] = await conn.query<RowDataPacket[]>(
      'SELECT usuario_id AS duenio FROM pedido WHERE id = ?',
      [pedidoId],
    )
    const fila = rows[0] as { duenio: number | null } | undefined
    if (!fila) {
      throw new AppError(404, 'NOT_FOUND', 'Pedido no encontrado')
    }
    if (solicitante.rol !== 'administrador' && fila.duenio !== solicitante.id) {
      throw new AppError(404, 'NOT_FOUND', 'Pedido no encontrado')
    }
    const vista = await leerPedido(conn, pedidoId)
    if (!vista) throw new AppError(404, 'NOT_FOUND', 'Pedido no encontrado')
    return vista
  } finally {
    conn.release()
  }
}
