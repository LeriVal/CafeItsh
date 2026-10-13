import type { Request, Response } from 'express'
import { AppError } from '../middlewares/errorHandler.js'
import { login, register } from '../services/auth.js'
import { validateEmail, validateNombre, validatePassword } from '../utils/validate.js'

export async function postLogin(req: Request, res: Response): Promise<void> {
  const { correo, password } = req.body as { correo?: unknown; password?: unknown }
  const emailError = validateEmail(correo)
  if (emailError) {
    throw new AppError(400, 'VALIDATION_ERROR', emailError)
  }
  // En login no se revela el motivo: formato de contraseña inválido también
  // responde como credenciales inválidas.
  if (validatePassword(password)) {
    throw new AppError(401, 'INVALID_CREDENTIALS', 'Correo o contraseña inválidos')
  }
  const result = await login(correo as string, password as string)
  res.json(result)
}

export async function getMe(req: Request, res: Response): Promise<void> {
  res.json({ usuario: req.usuario })
}

export async function postRegister(req: Request, res: Response): Promise<void> {
  const { nombre, correo, password, rol } = req.body as {
    nombre?: unknown
    correo?: unknown
    password?: unknown
    rol?: unknown
  }
  const nombreError = validateNombre(nombre)
  if (nombreError) {
    throw new AppError(400, 'VALIDATION_ERROR', nombreError)
  }
  const emailError = validateEmail(correo)
  if (emailError) {
    throw new AppError(400, 'VALIDATION_ERROR', emailError)
  }
  const passwordError = validatePassword(password)
  if (passwordError) {
    throw new AppError(400, 'VALIDATION_ERROR', passwordError)
  }
  const usuario = await register(nombre as string, correo as string, password as string, rol)
  res.status(201).json({ usuario })
}
