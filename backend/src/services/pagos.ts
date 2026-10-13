import type { RowDataPacket } from 'mysql2/promise'
import { pool } from '../db/pool.js'
import { AppError } from '../middlewares/errorHandler.js'
import { cambiarEstado, obtenerPedido } from './pedidos.js'
import type { PedidoVista } from './pedidos.js'

/** Rechazo del proveedor (el pedido sigue Pendiente y puede reintentarse). */
export class ProveedorRechazo extends Error {
  constructor(message = 'El pago fue rechazado; intenta de nuevo') {
    super(message)
  }
}

export interface Cobro {
  referencia: string
}

export interface ProveedorPago {
  readonly nombre: string
  cobrar(monto: number, folio: string): Promise<Cobro>
}

/** Simulador del servicio de pago externo (R2): aprueba y genera referencia. */
export class SimuladorPago implements ProveedorPago {
  readonly nombre = 'simulado'

  async cobrar(_monto: number, folio: string): Promise<Cobro> {
    const referencia = `SIM-${folio}-${Date.now().toString(36).toUpperCase()}`
    return { referencia }
  }
}

function proveedor(): ProveedorPago {
  return new SimuladorPago()
}

/**
 * Cobra un pedido anticipado en transacción con bloqueo de fila: solo uno de
 * dos cobros concurrentes prospera. Inserta el pago y pasa a Pagado.
 */
export async function pagarPedido(
  pedidoId: number,
  solicitante: { id: number; rol: string },
  opts?: { simularRechazo?: boolean },
): Promise<{ pedido: PedidoVista; referencia: string }> {
  const conn = await pool.getConnection()
  try {
    await conn.beginTransaction()
    const [rows] = await conn.query<RowDataPacket[]>(
      `SELECT p.id, p.numero, p.tipo, p.total, p.usuario_id AS duenio, e.nombre AS estado
       FROM pedido p JOIN estado_pedido e ON e.id = p.estado_id
       WHERE p.id = ? FOR UPDATE`,
      [pedidoId],
    )
    const fila = rows[0] as
      | { id: number; numero: string; tipo: string; total: string; duenio: number | null; estado: string }
      | undefined
    if (!fila) {
      throw new AppError(404, 'NOT_FOUND', 'Pedido no encontrado')
    }
    if (solicitante.rol !== 'administrador' && fila.duenio !== solicitante.id) {
      throw new AppError(404, 'NOT_FOUND', 'Pedido no encontrado')
    }
    if (fila.tipo !== 'anticipado') {
      throw new AppError(400, 'VALIDATION_ERROR', 'Ese pedido no es anticipado')
    }
    if (fila.estado !== 'Pendiente') {
      throw new AppError(409, 'INVALID_TRANSITION', 'Ese pedido ya no está pendiente de pago')
    }
    if (opts?.simularRechazo) {
      throw new ProveedorRechazo()
    }
    const { referencia } = await proveedor().cobrar(Number(fila.total), fila.numero)
    await conn.query(
      'INSERT INTO pago (pedido_id, metodo, monto, referencia, registrado_por) VALUES (?, \'online\', ?, ?, ?)',
      [pedidoId, fila.total, referencia, solicitante.id],
    )
    await cambiarEstado(conn, pedidoId, 'Pagado', solicitante.id)
    await conn.commit()
    const pedido = await obtenerPedido(pedidoId, solicitante)
    return { pedido, referencia }
  } catch (err) {
    await conn.rollback()
    throw err
  } finally {
    conn.release()
  }
}
