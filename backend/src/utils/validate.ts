import type { RolNombre } from '../types.js'

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export function normalizeEmail(correo: string): string {
  return correo.trim().toLowerCase()
}

export function validateEmail(correo: unknown): string | null {
  if (typeof correo !== 'string' || !EMAIL_RE.test(normalizeEmail(correo))) {
    return 'El correo electrónico no es válido'
  }
  return null
}

export function validatePassword(password: unknown): string | null {
  if (typeof password !== 'string' || password.length < 8) {
    return 'La contraseña debe tener al menos 8 caracteres'
  }
  return null
}

export function validateNombre(nombre: unknown, max = 100): string | null {
  if (typeof nombre !== 'string' || nombre.trim().length === 0) {
    return 'El nombre es obligatorio'
  }
  if (nombre.trim().length > max) {
    return `El nombre no puede exceder ${max} caracteres`
  }
  return null
}

export function validateCategoria(categoria: unknown): string | null {
  if (categoria === undefined || categoria === null || categoria === '') {
    return null
  }
  if (typeof categoria !== 'string' || categoria.trim().length > 50) {
    return 'La categoría no puede exceder 50 caracteres'
  }
  return null
}

export function validatePrecio(precio: unknown): string | null {
  const n = typeof precio === 'string' ? Number(precio) : precio
  if (typeof n !== 'number' || !Number.isFinite(n) || n <= 0) {
    return 'El precio debe ser mayor que cero'
  }
  return null
}

const FECHA_RE = /^\d{4}-\d{2}-\d{2}$/

export function validateFecha(fecha: unknown): string | null {
  if (typeof fecha !== 'string' || !FECHA_RE.test(fecha)) {
    return 'La fecha debe tener formato AAAA-MM-DD'
  }
  const [y, m, d] = fecha.split('-').map(Number)
  const dt = new Date(Date.UTC(y, m - 1, d))
  if (dt.getUTCFullYear() !== y || dt.getUTCMonth() !== m - 1 || dt.getUTCDate() !== d) {
    return 'La fecha no es un día válido'
  }
  return null
}

export function validateBooleano(valor: unknown, campo: string): string | null {
  if (typeof valor !== 'boolean') {
    return `El campo ${campo} debe ser verdadero o falso`
  }
  return null
}

export function validateRolOperativo(rol: unknown): rol is RolNombre {
  return rol === 'cajero' || rol === 'cocinero'
}
