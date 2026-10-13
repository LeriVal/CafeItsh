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

export function validateNombre(nombre: unknown): string | null {
  if (typeof nombre !== 'string' || nombre.trim().length === 0) {
    return 'El nombre es obligatorio'
  }
  if (nombre.trim().length > 100) {
    return 'El nombre no puede exceder 100 caracteres'
  }
  return null
}

export function validateRolOperativo(rol: unknown): rol is RolNombre {
  return rol === 'cajero' || rol === 'cocinero'
}
