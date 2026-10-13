import { pool } from '../db/pool.js'
import { AppError } from '../middlewares/errorHandler.js'
import { validateCategoria, validateNombre } from '../utils/validate.js'

export interface Platillo {
  id: number
  nombre: string
  categoria: string | null
  descripcion: string | null
  activo: boolean
}

interface PlatilloRow {
  id: number
  nombre: string
  categoria: string | null
  descripcion: string | null
  activo: number
}

function toPublic(row: PlatilloRow): Platillo {
  return {
    id: row.id,
    nombre: row.nombre,
    categoria: row.categoria,
    descripcion: row.descripcion,
    activo: row.activo === 1,
  }
}

export async function listarPlatillos(soloActivos?: boolean): Promise<Platillo[]> {
  const [rows] = await pool.query(
    `SELECT id, nombre, categoria, descripcion, activo FROM platillo
     ${soloActivos ? 'WHERE activo = TRUE' : ''}
     ORDER BY nombre`,
  )
  return (rows as PlatilloRow[]).map(toPublic)
}

export async function crearPlatillo(input: {
  nombre: unknown
  categoria?: unknown
  descripcion?: unknown
}): Promise<Platillo> {
  const nombreError = validateNombre(input.nombre)
  if (nombreError) {
    throw new AppError(400, 'VALIDATION_ERROR', nombreError)
  }
  const categoriaError = validateCategoria(input.categoria)
  if (categoriaError) {
    throw new AppError(400, 'VALIDATION_ERROR', categoriaError)
  }
  let descripcion: string | null = null
  if (input.descripcion !== undefined && input.descripcion !== null && input.descripcion !== '') {
    if (typeof input.descripcion !== 'string') {
      throw new AppError(400, 'VALIDATION_ERROR', 'La descripción debe ser texto')
    }
    descripcion = input.descripcion.trim()
  }
  const nombre = (input.nombre as string).trim()
  const categoria =
    input.categoria === undefined || input.categoria === null || input.categoria === ''
      ? null
      : (input.categoria as string).trim()
  const [result] = await pool.query(
    'INSERT INTO platillo (nombre, categoria, descripcion) VALUES (?, ?, ?)',
    [nombre, categoria, descripcion],
  )
  const id = (result as { insertId: number }).insertId
  return { id, nombre, categoria, descripcion, activo: true }
}

export async function actualizarPlatillo(
  id: number,
  cambios: { nombre?: unknown; categoria?: unknown; descripcion?: unknown; activo?: unknown },
): Promise<Platillo> {
  const [rows] = await pool.query(
    'SELECT id, nombre, categoria, descripcion, activo FROM platillo WHERE id = ?',
    [id],
  )
  const actual = (rows as PlatilloRow[])[0]
  if (!actual) {
    throw new AppError(404, 'NOT_FOUND', 'Platillo no encontrado')
  }
  let nombre = actual.nombre
  let categoria = actual.categoria
  let descripcion = actual.descripcion
  let activo = actual.activo === 1

  if (cambios.nombre !== undefined) {
    const err = validateNombre(cambios.nombre)
    if (err) throw new AppError(400, 'VALIDATION_ERROR', err)
    nombre = (cambios.nombre as string).trim()
  }
  if (cambios.categoria !== undefined) {
    const err = validateCategoria(cambios.categoria)
    if (err) throw new AppError(400, 'VALIDATION_ERROR', err)
    categoria =
      cambios.categoria === null || cambios.categoria === ''
        ? null
        : (cambios.categoria as string).trim()
  }
  if (cambios.descripcion !== undefined) {
    if (
      cambios.descripcion !== null &&
      cambios.descripcion !== '' &&
      typeof cambios.descripcion !== 'string'
    ) {
      throw new AppError(400, 'VALIDATION_ERROR', 'La descripción debe ser texto')
    }
    descripcion =
      cambios.descripcion === null || cambios.descripcion === ''
        ? null
        : (cambios.descripcion as string).trim()
  }
  if (cambios.activo !== undefined) {
    if (typeof cambios.activo !== 'boolean') {
      throw new AppError(400, 'VALIDATION_ERROR', 'El campo activo debe ser verdadero o falso')
    }
    activo = cambios.activo
  }
  await pool.query(
    'UPDATE platillo SET nombre = ?, categoria = ?, descripcion = ?, activo = ? WHERE id = ?',
    [nombre, categoria, descripcion, activo, id],
  )
  return { id, nombre, categoria, descripcion, activo }
}
