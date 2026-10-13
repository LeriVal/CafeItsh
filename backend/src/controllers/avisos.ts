import type { Request, Response } from 'express'
import { AppError } from '../middlewares/errorHandler.js'
import { listarAvisos, marcarLeida } from '../services/notificaciones.js'

export async function getAvisos(req: Request, res: Response): Promise<void> {
  const usuario = req.usuario
  if (!usuario) {
    throw new AppError(401, 'UNAUTHORIZED', 'Inicia sesión para continuar')
  }
  const avisos = await listarAvisos(usuario.id)
  res.json({ avisos })
}

export async function patchLeida(req: Request, res: Response): Promise<void> {
  const usuario = req.usuario
  if (!usuario) {
    throw new AppError(401, 'UNAUTHORIZED', 'Inicia sesión para continuar')
  }
  const aviso = await marcarLeida(Number(req.params.id), usuario.id)
  if (!aviso) {
    throw new AppError(404, 'NOT_FOUND', 'Aviso no encontrado')
  }
  res.json({ aviso })
}
