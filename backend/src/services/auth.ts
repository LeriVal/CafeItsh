import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { pool } from '../db/pool.js'
import type { AuthClaims, RolNombre, UsuarioPublico } from '../types.js'
import { AppError } from '../middlewares/errorHandler.js'
import { normalizeEmail } from '../utils/validate.js'

function jwtSecret(): string {
  const secret = process.env.JWT_SECRET
  if (!secret || secret.length < 32) {
    throw new Error('JWT_SECRET debe tener al menos 32 caracteres (ver backend/.env.example)')
  }
  return secret
}

function jwtExpiresIn(): string {
  return process.env.JWT_EXPIRES_IN ?? '8h'
}

function bcryptCost(): number {
  const raw = Number(process.env.BCRYPT_COST ?? 10)
  return Number.isInteger(raw) && raw >= 4 && raw <= 14 ? raw : 10
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, bcryptCost())
}

export async function comparePassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash)
}

export function signToken(claims: AuthClaims): string {
  return jwt.sign({ sub: claims.sub, rol: claims.rol }, jwtSecret(), {
    expiresIn: jwtExpiresIn(),
  } as jwt.SignOptions)
}

export function verifyToken(token: string): AuthClaims {
  const payload = jwt.verify(token, jwtSecret()) as Record<string, unknown>
  if (typeof payload.sub !== 'number' || typeof payload.rol !== 'string') {
    throw new Error('Token sin claims válidos')
  }
  return { sub: payload.sub, rol: payload.rol as AuthClaims['rol'] }
}

interface LoginRow {
  id: number
  nombre: string
  correo: string
  password_hash: string
  activo: number
  rol: RolNombre
}

const INVALID_CREDENTIALS = 'Correo o contraseña inválidos'

/**
 * Registra un cliente (alumno/docente). El rol siempre es `usuario`;
 * cualquier rol incluido en la petición se ignora.
 */
export async function register(
  nombre: string,
  correo: string,
  password: string,
  rolSolicitado?: unknown,
): Promise<UsuarioPublico> {
  if (rolSolicitado !== undefined && rolSolicitado !== 'usuario') {
    console.warn('Intento de registro con rol no permitido; se fuerza rol usuario')
  }
  const email = normalizeEmail(correo)
  const [existing] = await pool.query('SELECT id FROM usuario WHERE correo = ?', [email])
  if ((existing as unknown[]).length > 0) {
    throw new AppError(409, 'EMAIL_TAKEN', 'Ese correo ya está registrado')
  }
  const passwordHash = await hashPassword(password)
  const [result] = await pool.query(
    `INSERT INTO usuario (nombre, correo, password_hash, activo, rol_id)
     VALUES (?, ?, ?, TRUE, (SELECT id FROM rol WHERE nombre = 'usuario'))`,
    [nombre.trim(), email, passwordHash],
  )
  const id = (result as { insertId: number }).insertId
  return { id, nombre: nombre.trim(), correo: email, rol: 'usuario', activo: true }
}

/**
 * Autentica por correo/contraseña. El mensaje de error es idéntico para
 * cuenta inexistente, contraseña errónea o cuenta deshabilitada.
 */
export async function login(
  correo: string,
  password: string,
): Promise<{ token: string; usuario: UsuarioPublico }> {
  const [rows] = await pool.query(
    `SELECT u.id, u.nombre, u.correo, u.password_hash, u.activo, r.nombre AS rol
     FROM usuario u JOIN rol r ON r.id = u.rol_id
     WHERE u.correo = ?`,
    [normalizeEmail(correo)],
  )
  const found = (rows as LoginRow[])[0]
  if (!found || found.activo !== 1) {
    throw new AppError(401, 'INVALID_CREDENTIALS', INVALID_CREDENTIALS)
  }
  if (!(await comparePassword(password, found.password_hash))) {
    throw new AppError(401, 'INVALID_CREDENTIALS', INVALID_CREDENTIALS)
  }
  const usuario: UsuarioPublico = {
    id: found.id,
    nombre: found.nombre,
    correo: found.correo,
    rol: found.rol,
    activo: true,
  }
  return { token: signToken({ sub: usuario.id, rol: usuario.rol }), usuario }
}
