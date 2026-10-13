import { pool } from '../db/pool.js'
import { AppError } from '../middlewares/errorHandler.js'
import { validateBooleano, validateFecha, validatePrecio } from '../utils/validate.js'

export interface LineaMenu {
  id: number
  fecha: string
  precio: string
  disponible: boolean
  especial: boolean
  platillo: {
    id: number
    nombre: string
    categoria: string | null
    descripcion: string | null
  }
}

interface LineaRow {
  id: number
  fecha: Date | string
  precio: string
  disponible: number
  especial: number
  platillo_id: number
  nombre: string
  categoria: string | null
  descripcion: string | null
}

/** Hoy en el plantel (America/Mexico_City), formato AAAA-MM-DD. */
export function hoyMx(timeZone = 'America/Mexico_City'): string {
  const partes = new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date())
  return partes
}

function aFechaDia(fecha: Date | string): string {
  if (typeof fecha === 'string') return fecha.slice(0, 10)
  return fecha.toISOString().slice(0, 10)
}

function toPublic(row: LineaRow): LineaMenu {
  return {
    id: row.id,
    fecha: aFechaDia(row.fecha),
    precio: String(row.precio),
    disponible: row.disponible === 1,
    especial: row.especial === 1,
    platillo: {
      id: row.platillo_id,
      nombre: row.nombre,
      categoria: row.categoria,
      descripcion: row.descripcion,
    },
  }
}

const SELECT_LINEAS = `SELECT md.id, md.fecha, md.precio, md.disponible, md.especial,
  md.platillo_id, p.nombre, p.categoria, p.descripcion
  FROM menu_dia md JOIN platillo p ON p.id = md.platillo_id`

export async function obtenerMenu(fecha?: string): Promise<{ fecha: string; lineas: LineaMenu[] }> {
  const dia = fecha ?? hoyMx()
  const fechaError = validateFecha(dia)
  if (fechaError) {
    throw new AppError(400, 'VALIDATION_ERROR', fechaError)
  }
  const [rows] = await pool.query(
    `${SELECT_LINEAS} WHERE md.fecha = ? ORDER BY md.especial DESC, p.nombre`,
    [dia],
  )
  return { fecha: dia, lineas: (rows as LineaRow[]).map(toPublic) }
}

function esDuplicado(err: unknown): boolean {
  return typeof err === 'object' && err !== null && 'errno' in err && (err as { errno: number }).errno === 1062
}

function esReferenciado(err: unknown): boolean {
  return typeof err === 'object' && err !== null && 'errno' in err && (err as { errno: number }).errno === 1451
}

export async function agregarLinea(input: {
  fecha?: unknown
  platilloId: unknown
  precio: unknown
  disponible?: unknown
  especial?: unknown
}): Promise<LineaMenu> {
  const dia = input.fecha === undefined ? hoyMx() : input.fecha
  const fechaError = validateFecha(dia)
  if (fechaError) {
    throw new AppError(400, 'VALIDATION_ERROR', fechaError)
  }
  if (typeof input.platilloId !== 'number' || !Number.isInteger(input.platilloId)) {
    throw new AppError(400, 'VALIDATION_ERROR', 'El platillo no es válido')
  }
  const precioError = validatePrecio(input.precio)
  if (precioError) {
    throw new AppError(400, 'VALIDATION_ERROR', precioError)
  }
  const disponible = input.disponible ?? true
  const especial = input.especial ?? false
  for (const [valor, campo] of [
    [disponible, 'disponible'],
    [especial, 'especial'],
  ] as const) {
    const err = validateBooleano(valor, campo)
    if (err) throw new AppError(400, 'VALIDATION_ERROR', err)
  }
  const [plats] = await pool.query('SELECT id, activo FROM platillo WHERE id = ?', [input.platilloId])
  const plat = (plats as Array<{ id: number; activo: number }>)[0]
  if (!plat) {
    throw new AppError(400, 'VALIDATION_ERROR', 'El platillo no existe')
  }
  if (plat.activo !== 1) {
    throw new AppError(400, 'VALIDATION_ERROR', 'El platillo no está disponible para el menú')
  }
  let id: number
  try {
    const [result] = await pool.query(
      'INSERT INTO menu_dia (fecha, platillo_id, precio, disponible, especial) VALUES (?, ?, ?, ?, ?)',
      [dia, input.platilloId, input.precio, disponible, especial],
    )
    id = (result as { insertId: number }).insertId
  } catch (err) {
    if (esDuplicado(err)) {
      throw new AppError(409, 'DUPLICADO', 'Ese platillo ya está en el menú de esa fecha')
    }
    throw err
  }
  const [rows] = await pool.query(`${SELECT_LINEAS} WHERE md.id = ?`, [id])
  return toPublic((rows as LineaRow[])[0])
}

export async function modificarLinea(
  id: number,
  cambios: { precio?: unknown; disponible?: unknown; especial?: unknown },
): Promise<LineaMenu> {
  const [rows] = await pool.query(`${SELECT_LINEAS} WHERE md.id = ?`, [id])
  const actual = (rows as LineaRow[])[0]
  if (!actual) {
    throw new AppError(404, 'NOT_FOUND', 'Línea del menú no encontrada')
  }
  let precio = actual.precio
  let disponible = actual.disponible === 1
  let especial = actual.especial === 1
  if (cambios.precio !== undefined) {
    const err = validatePrecio(cambios.precio)
    if (err) throw new AppError(400, 'VALIDATION_ERROR', err)
    precio = String(cambios.precio)
  }
  if (cambios.disponible !== undefined) {
    const err = validateBooleano(cambios.disponible, 'disponible')
    if (err) throw new AppError(400, 'VALIDATION_ERROR', err)
    disponible = cambios.disponible as boolean
  }
  if (cambios.especial !== undefined) {
    const err = validateBooleano(cambios.especial, 'especial')
    if (err) throw new AppError(400, 'VALIDATION_ERROR', err)
    especial = cambios.especial as boolean
  }
  await pool.query('UPDATE menu_dia SET precio = ?, disponible = ?, especial = ? WHERE id = ?', [
    precio,
    disponible,
    especial,
    id,
  ])
  const [nuevas] = await pool.query(`${SELECT_LINEAS} WHERE md.id = ?`, [id])
  return toPublic((nuevas as LineaRow[])[0])
}

export async function quitarLinea(id: number): Promise<void> {
  try {
    const [result] = await pool.query('DELETE FROM menu_dia WHERE id = ?', [id])
    if ((result as { affectedRows: number }).affectedRows === 0) {
      throw new AppError(404, 'NOT_FOUND', 'Línea del menú no encontrada')
    }
  } catch (err) {
    if (err instanceof AppError) throw err
    if (esReferenciado(err)) {
      throw new AppError(
        409,
        'REFERENCIADO',
        'Esa línea ya tiene pedidos y no se puede quitar; márcala no disponible',
      )
    }
    throw err
  }
}
