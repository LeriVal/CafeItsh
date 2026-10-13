import type { Request, Response } from 'express'
import {
  agregarLinea,
  modificarLinea,
  obtenerMenu,
  quitarLinea,
} from '../services/menu.js'

export async function getMenu(req: Request, res: Response): Promise<void> {
  const fecha = typeof req.query.fecha === 'string' ? req.query.fecha : undefined
  const menu = await obtenerMenu(fecha)
  res.json(menu)
}

export async function postLinea(req: Request, res: Response): Promise<void> {
  const { fecha, platilloId, precio, disponible, especial } = req.body as Record<string, unknown>
  const linea = await agregarLinea({ fecha, platilloId, precio, disponible, especial })
  res.status(201).json({ linea })
}

export async function patchLinea(req: Request, res: Response): Promise<void> {
  const id = Number(req.params.id)
  const { precio, disponible, especial } = req.body as Record<string, unknown>
  const linea = await modificarLinea(id, { precio, disponible, especial })
  res.json({ linea })
}

export async function deleteLinea(req: Request, res: Response): Promise<void> {
  const id = Number(req.params.id)
  await quitarLinea(id)
  res.status(204).end()
}
