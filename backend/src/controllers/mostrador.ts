import type { Request, Response } from 'express'
import { AppError } from '../middlewares/errorHandler.js'
import { crearMostrador } from '../services/mostrador.js'

export async function postMostrador(req: Request, res: Response): Promise<void> {
  const usuario = req.usuario
  if (!usuario) {
    throw new AppError(401, 'UNAUTHORIZED', 'Inicia sesión para continuar')
  }
  const { items, clienteNombre, montoRecibido } = req.body as Record<string, unknown>
  const { pedido, cambio } = await crearMostrador(usuario.id, {
    items,
    clienteNombre,
    montoRecibido,
  })
  res.status(201).json({ pedido, cambio })
}
