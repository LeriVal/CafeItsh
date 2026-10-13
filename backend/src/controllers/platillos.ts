import type { Request, Response } from 'express'
import {
  actualizarPlatillo,
  crearPlatillo,
  listarPlatillos,
} from '../services/platillos.js'

export async function getPlatillos(req: Request, res: Response): Promise<void> {
  const soloActivos = req.query.activos === 'true'
  const platillos = await listarPlatillos(soloActivos || undefined)
  res.json({ platillos })
}

export async function postPlatillo(req: Request, res: Response): Promise<void> {
  const { nombre, categoria, descripcion } = req.body as Record<string, unknown>
  const platillo = await crearPlatillo({ nombre, categoria, descripcion })
  res.status(201).json({ platillo })
}

export async function patchPlatillo(req: Request, res: Response): Promise<void> {
  const id = Number(req.params.id)
  const { nombre, categoria, descripcion, activo } = req.body as Record<string, unknown>
  const platillo = await actualizarPlatillo(id, { nombre, categoria, descripcion, activo })
  res.json({ platillo })
}
