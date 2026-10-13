import type { Request, Response } from 'express'
import { AppError } from '../middlewares/errorHandler.js'
import { transicionarPedido } from '../services/pedidos.js'

const ESTADOS_VALIDOS = ['Pagado', 'En preparación', 'Listo', 'Entregado', 'Cancelado']

export async function patchEstado(req: Request, res: Response): Promise<void> {
  const usuario = req.usuario
  if (!usuario) {
    throw new AppError(401, 'UNAUTHORIZED', 'Inicia sesión para continuar')
  }
  const { estado } = req.body as { estado?: unknown }
  if (typeof estado !== 'string' || !ESTADOS_VALIDOS.includes(estado)) {
    throw new AppError(400, 'VALIDATION_ERROR', 'El estado no es válido')
  }
  const pedido = await transicionarPedido(Number(req.params.id), estado, {
    id: usuario.id,
    rol: usuario.rol,
  })
  res.json({ pedido })
}
