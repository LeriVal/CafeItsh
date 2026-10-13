import { pool } from '../db/pool.js'
import { AppError } from '../middlewares/errorHandler.js'
import { hashPassword } from './auth.js'
import type { RolNombre, UsuarioPublico } from '../types.js'
import { normalizeEmail, validateEmail, validateNombre, validatePassword, validateRolOperativo } from '../utils/validate.js'

interface UsuarioRow {
  id: number
  nombre: string
  correo: string
  rol: RolNombre
  activo: number
}

function toPublic(row: UsuarioRow): UsuarioPublico {
  return {
    id: row.id,
    nombre: row.nombre,
    correo: row.correo,
    rol: row.rol,
    activo: row.activo === 1,
  }
}

export async function listarUsuarios(filtros?: {
  rol?: string
  soloActivos?: boolean
}): Promise<UsuarioPublico[]> {
  const condiciones: string[] = []
  const params: unknown[] = []
  if (filtros?.rol) {
    condiciones.push('r.nombre = ?')
    params.push(filtros.rol)
  }
  if (filtros?.soloActivos) {
    condiciones.push('u.activo = TRUE')
  }
  const where = condiciones.length > 0 ? `WHERE ${condiciones.join(' AND ')}` : ''
  const [rows] = await pool.query(
    `SELECT u.id, u.nombre, u.correo, r.nombre AS rol, u.activo
     FROM usuario u JOIN rol r ON r.id = u.rol_id
     ${where}
     ORDER BY u.id`,
    params,
  )
  return (rows as UsuarioRow[]).map(toPublic)
}

export async function crearOperativo(input: {
  nombre: unknown
  correo: unknown
  password: unknown
  rol: unknown
}): Promise<UsuarioPublico> {
  const nombreError = validateNombre(input.nombre)
  if (nombreError) {
    throw new AppError(400, 'VALIDATION_ERROR', nombreError)
  }
  const emailError = validateEmail(input.correo)
  if (emailError) {
    throw new AppError(400, 'VALIDATION_ERROR', emailError)
  }
  const passwordError = validatePassword(input.password)
  if (passwordError) {
    throw new AppError(400, 'VALIDATION_ERROR', passwordError)
  }
  if (!validateRolOperativo(input.rol)) {
    throw new AppError(
      400,
      'VALIDATION_ERROR',
      'El rol debe ser cajero o cocinero',
    )
  }
  const email = normalizeEmail(input.correo as string)
  const [existing] = await pool.query('SELECT id FROM usuario WHERE correo = ?', [email])
  if ((existing as unknown[]).length > 0) {
    throw new AppError(409, 'EMAIL_TAKEN', 'Ese correo ya está registrado')
  }
  const passwordHash = await hashPassword(input.password as string)
  const [result] = await pool.query(
    `INSERT INTO usuario (nombre, correo, password_hash, activo, rol_id)
     VALUES (?, ?, ?, TRUE, (SELECT id FROM rol WHERE nombre = ?))`,
    [(input.nombre as string).trim(), email, passwordHash, input.rol],
  )
  const id = (result as { insertId: number }).insertId
  const [rows] = await pool.query(
    `SELECT u.id, u.nombre, u.correo, r.nombre AS rol, u.activo
     FROM usuario u JOIN rol r ON r.id = u.rol_id WHERE u.id = ?`,
    [id],
  )
  return toPublic((rows as UsuarioRow[])[0])
}

async function otrosAdminsActivos(exceptoId: number): Promise<number> {
  const [rows] = await pool.query(
    `SELECT COUNT(*) AS n FROM usuario u JOIN rol r ON r.id = u.rol_id
     WHERE r.nombre = 'administrador' AND u.activo = TRUE AND u.id <> ?`,
    [exceptoId],
  )
  return (rows as Array<{ n: number }>)[0].n
}

export async function actualizarOperativo(
  id: number,
  cambios: { nombre?: unknown; rol?: unknown; activo?: unknown },
): Promise<UsuarioPublico> {
  const [rows] = await pool.query(
    `SELECT u.id, u.nombre, u.correo, r.nombre AS rol, u.activo
     FROM usuario u JOIN rol r ON r.id = u.rol_id WHERE u.id = ?`,
    [id],
  )
  const actual = (rows as UsuarioRow[])[0]
  if (!actual) {
    throw new AppError(404, 'NOT_FOUND', 'Usuario no encontrado')
  }

  let nuevoNombre = actual.nombre
  let nuevoRol: RolNombre = actual.rol
  let nuevoActivo = actual.activo === 1

  if (cambios.nombre !== undefined) {
    const nombreError = validateNombre(cambios.nombre)
    if (nombreError) {
      throw new AppError(400, 'VALIDATION_ERROR', nombreError)
    }
    nuevoNombre = (cambios.nombre as string).trim()
  }
  if (cambios.rol !== undefined) {
    if (!validateRolOperativo(cambios.rol) && cambios.rol !== 'administrador') {
      throw new AppError(400, 'VALIDATION_ERROR', 'El rol no es válido')
    }
    nuevoRol = cambios.rol as RolNombre
  }
  if (cambios.activo !== undefined) {
    if (typeof cambios.activo !== 'boolean') {
      throw new AppError(400, 'VALIDATION_ERROR', 'El estado activo debe ser verdadero o falso')
    }
    nuevoActivo = cambios.activo
  }

  const eraAdminActivo = actual.rol === 'administrador' && actual.activo === 1
  const sigueAdminActivo = nuevoRol === 'administrador' && nuevoActivo
  if (eraAdminActivo && !sigueAdminActivo && (await otrosAdminsActivos(id)) === 0) {
    throw new AppError(
      400,
      'VALIDATION_ERROR',
      'No puedes deshabilitar al último administrador activo',
    )
  }

  await pool.query(
    `UPDATE usuario SET nombre = ?, rol_id = (SELECT id FROM rol WHERE nombre = ?), activo = ?
     WHERE id = ?`,
    [nuevoNombre, nuevoRol, nuevoActivo, id],
  )
  return { id, nombre: nuevoNombre, correo: actual.correo, rol: nuevoRol, activo: nuevoActivo }
}
