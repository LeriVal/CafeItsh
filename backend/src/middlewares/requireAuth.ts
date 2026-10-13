import type { NextFunction, Request, Response } from 'express'
import { pool } from '../db/pool.js'
import { verifyToken } from '../services/auth.js'
import type { RequestUsuario, RolNombre } from '../types.js'
import { AppError } from './errorHandler.js'

interface UsuarioRow {
  id: number
  nombre: string
  correo: string
  rol: RolNombre
  activo: number
}

/**
 * Exige sesión válida. Revalida firma, expiración, cuenta activa y rol vigente
 * en BD en cada petición (un cambio de rol o desactivación invalida el acceso
 * aunque el token siga vigente).
 */
export async function requireAuth(req: Request, _res: Response, next: NextFunction): Promise<void> {
  const header = req.header('Authorization')
  const token = header?.startsWith('Bearer ') ? header.slice(7) : null
  if (!token) {
    throw new AppError(401, 'UNAUTHORIZED', 'Inicia sesión para continuar')
  }
  let claims
  try {
    claims = verifyToken(token)
  } catch {
    throw new AppError(401, 'UNAUTHORIZED', 'Tu sesión expiró o es inválida; inicia sesión de nuevo')
  }
  const [rows] = await pool.query(
    `SELECT u.id, u.nombre, u.correo, r.nombre AS rol, u.activo
     FROM usuario u JOIN rol r ON r.id = u.rol_id
     WHERE u.id = ?`,
    [claims.sub],
  )
  const found = (rows as UsuarioRow[])[0]
  if (!found || found.activo !== 1 || found.rol !== claims.rol) {
    throw new AppError(401, 'UNAUTHORIZED', 'Tu sesión expiró o es inválida; inicia sesión de nuevo')
  }
  const usuario: RequestUsuario = {
    id: found.id,
    nombre: found.nombre,
    correo: found.correo,
    rol: found.rol,
    activo: true,
  }
  req.usuario = usuario
  next()
}
