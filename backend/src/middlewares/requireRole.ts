import type { NextFunction, Request, Response } from 'express'
import type { RolNombre } from '../types.js'
import { AppError } from './errorHandler.js'

/** Exige uno de los roles indicados (usar después de requireAuth). */
export function requireRole(...roles: RolNombre[]) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.usuario || !roles.includes(req.usuario.rol)) {
      throw new AppError(403, 'FORBIDDEN', 'No tienes acceso a esta función')
    }
    next()
  }
}
