import type { Request, Response } from 'express'
import { actualizarOperativo, crearOperativo, listarUsuarios } from '../services/usuarios.js'

export async function getUsuarios(req: Request, res: Response): Promise<void> {
  const rol = typeof req.query.rol === 'string' ? req.query.rol : undefined
  const soloActivos = req.query.activos === 'true' || req.query.activo === 'true'
  const usuarios = await listarUsuarios({ rol, soloActivos })
  res.json({ usuarios })
}

export async function postUsuario(req: Request, res: Response): Promise<void> {
  const { nombre, correo, password, rol } = req.body as Record<string, unknown>
  const usuario = await crearOperativo({ nombre, correo, password, rol })
  res.status(201).json({ usuario })
}

export async function patchUsuario(req: Request, res: Response): Promise<void> {
  const id = Number(req.params.id)
  const { nombre, rol, activo } = req.body as Record<string, unknown>
  const usuario = await actualizarOperativo(id, { nombre, rol, activo })
  res.json({ usuario })
}
