import type { RowDataPacket } from 'mysql2/promise'
import { pool } from '../db/pool.js'

export interface Aviso {
  id: number
  pedidoId: number
  numero: string
  tipo: string
  leida: boolean
  fecha: string
}

export interface ProveedorAviso {
  readonly nombre: string
  avisar(pedidoId: number, duenioId: number): Promise<void>
}

/** Aviso en-app (R2): registra la fila como enviada para la bandeja. */
export class AvisoEnApp implements ProveedorAviso {
  readonly nombre = 'en_app'

  async avisar(pedidoId: number, _duenioId: number): Promise<void> {
    await pool.query(
      `INSERT INTO notificacion (pedido_id, tipo, canal, estado_envio)
       VALUES (?, 'pedido_listo', 'push', 'enviada')`,
      [pedidoId],
    )
  }
}

function proveedor(): ProveedorAviso {
  return new AvisoEnApp()
}

/**
 * Crea el aviso de pedido listo. Nunca lanza a quien lo invoca: un fallo del
 * aviso no puede revertir la transición que lo originó (se registra en log).
 */
export async function crearAvisoListo(pedidoId: number, duenioId: number | null): Promise<void> {
  try {
    if (duenioId === null) return
    await proveedor().avisar(pedidoId, duenioId)
  } catch (err) {
    console.error(
      `Aviso de Listo no generado para pedido ${pedidoId}:`,
      err instanceof Error ? err.message : err,
    )
  }
}

interface AvisoRow {
  id: number
  pedido_id: number
  numero: string
  tipo: string
  leida: number
  fecha: Date | string
}

function toPublic(r: AvisoRow): Aviso {
  return {
    id: r.id,
    pedidoId: r.pedido_id,
    numero: r.numero,
    tipo: r.tipo,
    leida: r.leida === 1,
    fecha: r.fecha instanceof Date ? r.fecha.toISOString() : String(r.fecha),
  }
}

export async function listarAvisos(duenioId: number): Promise<Aviso[]> {
  const [rows] = await pool.query<RowDataPacket[]>(
    `SELECT n.id, n.pedido_id, p.numero, n.tipo, n.leida, n.fecha
     FROM notificacion n JOIN pedido p ON p.id = n.pedido_id
     WHERE p.usuario_id = ?
     ORDER BY n.leida, n.fecha DESC`,
    [duenioId],
  )
  return (rows as AvisoRow[]).map(toPublic)
}

export async function marcarLeida(avisoId: number, duenioId: number): Promise<Aviso | null> {
  const [rows] = await pool.query<RowDataPacket[]>(
    `SELECT n.id, n.pedido_id, p.numero, n.tipo, n.leida, n.fecha
     FROM notificacion n JOIN pedido p ON p.id = n.pedido_id
     WHERE n.id = ? AND p.usuario_id = ?`,
    [avisoId, duenioId],
  )
  const found = (rows as AvisoRow[])[0]
  if (!found) return null
  await pool.query('UPDATE notificacion SET leida = TRUE WHERE id = ?', [avisoId])
  return { ...toPublic(found), leida: true }
}
