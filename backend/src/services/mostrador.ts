import type { RowDataPacket } from 'mysql2/promise'
import { pool } from '../db/pool.js'
import { AppError } from '../middlewares/errorHandler.js'
import { hoyMx } from './menu.js'
import type { PedidoVista } from './pedidos.js'

const MAX_INTENTOS_FOLIO = 3

function aDinero(centavos: number): string {
  return (centavos / 100).toFixed(2)
}

async function generarFolioM(conn: {
  query: (sql: string, params?: unknown[]) => Promise<unknown>
}): Promise<string> {
  const compacto = hoyMx().replace(/-/g, '')
  const [rows] = (await conn.query(
    "SELECT COUNT(*) AS n FROM pedido WHERE numero LIKE CONCAT('M-', ?, '-%')",
    [compacto],
  )) as RowDataPacket[][]
  let seq = ((rows[0] as { n: number }).n ?? 0) + 1
  for (let intento = 0; intento < MAX_INTENTOS_FOLIO; intento += 1) {
    const folio = `M-${compacto}-${String(seq).padStart(4, '0')}`
    const [existe] = (await conn.query('SELECT 1 AS ok FROM pedido WHERE numero = ?', [
      folio,
    ])) as RowDataPacket[][]
    if (existe.length === 0) return folio
    seq += 1
  }
  throw new AppError(500, 'INTERNAL_ERROR', 'Ocurrió un error inesperado')
}

/**
 * Crea un pedido de mostrador con cobro en efectivo en una transacción:
 * pedido + detalle + pago + historial NULL→Pagado. Nace Pagado (R2).
 */
export async function crearMostrador(
  cajeroId: number,
  input: { items: unknown; clienteNombre?: unknown; montoRecibido: unknown },
): Promise<{ pedido: PedidoVista; cambio: string }> {
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

  let clienteNombre: string | null = null
  if (input.clienteNombre !== undefined && input.clienteNombre !== null && input.clienteNombre !== '') {
    if (typeof input.clienteNombre !== 'string' || input.clienteNombre.trim().length > 100) {
      throw new AppError(400, 'VALIDATION_ERROR', 'El nombre del cliente no es válido')
    }
    clienteNombre = input.clienteNombre.trim()
  }

  const recibido =
    typeof input.montoRecibido === 'string' ? Number(input.montoRecibido) : input.montoRecibido
  if (typeof recibido !== 'number' || !Number.isFinite(recibido) || recibido <= 0) {
    throw new AppError(400, 'VALIDATION_ERROR', 'El monto recibido debe ser mayor que cero')
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
    let totalCentavos = 0
    const detalle: Array<{ menuDiaId: number; cantidad: number; precioCentavos: number; nombre: string }> = []
    const mapa = new Map<number, { nombre: string; precioCentavos: number; disponible: boolean }>()
    for (const r of rows as Array<{ menuDiaId: number; nombre: string; precio: string; disponible: number }>) {
      mapa.set(r.menuDiaId, {
        nombre: r.nombre,
        precioCentavos: Math.round(Number(r.precio) * 100),
        disponible: r.disponible === 1,
      })
    }
    for (const it of items) {
      const linea = mapa.get(it.menuDiaId)
      if (!linea) {
        throw new AppError(400, 'VALIDATION_ERROR', 'Hay platillos que ya no están en el menú de hoy')
      }
      if (!linea.disponible) {
        throw new AppError(400, 'VALIDATION_ERROR', `${linea.nombre} ya no está disponible`)
      }
      totalCentavos += linea.precioCentavos * it.cantidad
      detalle.push({ menuDiaId: it.menuDiaId, cantidad: it.cantidad, precioCentavos: linea.precioCentavos, nombre: linea.nombre })
    }
    const recibidoCentavos = Math.round(recibido * 100)
    if (recibidoCentavos < totalCentavos) {
      throw new AppError(400, 'VALIDATION_ERROR', 'El monto recibido es menor que el total')
    }

    const [estados] = await conn.query<RowDataPacket[]>(
      "SELECT id FROM estado_pedido WHERE nombre = 'Pagado'",
    )
    const pagadoId = (estados[0] as { id: number }).id
    const temp = `TMP-${Date.now().toString(36)}${Math.floor(Math.random() * 1296).toString(36)}`
    const [ins] = await conn.query(
      `INSERT INTO pedido (numero, tipo, estado_id, usuario_id, cliente_nombre, total, creado_por)
       VALUES (?, 'mostrador', ?, NULL, ?, ?, ?)`,
      [temp, pagadoId, clienteNombre, aDinero(totalCentavos), cajeroId],
    )
    const pedidoId = (ins as { insertId: number }).insertId
    for (const d of detalle) {
      await conn.query(
        `INSERT INTO pedido_detalle (pedido_id, menu_dia_id, cantidad, precio_unitario, subtotal)
         VALUES (?, ?, ?, ?, ?)`,
        [pedidoId, d.menuDiaId, d.cantidad, aDinero(d.precioCentavos), aDinero(d.precioCentavos * d.cantidad)],
      )
    }
    await conn.query(
      "INSERT INTO pago (pedido_id, metodo, monto, referencia, registrado_por) VALUES (?, 'efectivo', ?, NULL, ?)",
      [pedidoId, aDinero(totalCentavos), cajeroId],
    )
    await conn.query(
      `INSERT INTO pedido_estado_historial (pedido_id, estado_anterior_id, estado_nuevo_id, cambiado_por)
       VALUES (?, NULL, ?, ?)`,
      [pedidoId, pagadoId, cajeroId],
    )
    const folio = await generarFolioM(conn)
    await conn.query('UPDATE pedido SET numero = ? WHERE id = ?', [folio, pedidoId])
    await conn.commit()

    const [lineas] = await conn.query<RowDataPacket[]>(
      `SELECT d.menu_dia_id AS menuDiaId, p.nombre, d.cantidad,
              d.precio_unitario AS precioUnitario, d.subtotal
       FROM pedido_detalle d JOIN menu_dia md ON md.id = d.menu_dia_id
       JOIN platillo p ON p.id = md.platillo_id WHERE d.pedido_id = ?`,
      [pedidoId],
    )
    const pedido: PedidoVista = {
      id: pedidoId,
      numero: folio,
      tipo: 'mostrador',
      estado: 'Pagado',
      total: aDinero(totalCentavos),
      fechaRecoleccion: null,
      detalle: (lineas as Array<{
        menuDiaId: number
        nombre: string
        cantidad: number
        precioUnitario: string
        subtotal: string
      }>).map((d) => ({ ...d, precioUnitario: String(d.precioUnitario), subtotal: String(d.subtotal) })),
      pagoReferencia: null,
    }
    return { pedido, cambio: aDinero(recibidoCentavos - totalCentavos) }
  } catch (err) {
    await conn.rollback()
    throw err
  } finally {
    conn.release()
  }
}
