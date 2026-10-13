import type { Request, Response } from 'express'
import { colaCocina, listosParaEntrega } from '../services/cocina.js'

export async function getCola(_req: Request, res: Response): Promise<void> {
  const pedidos = await colaCocina()
  res.json({ pedidos })
}

export async function getListos(_req: Request, res: Response): Promise<void> {
  const pedidos = await listosParaEntrega()
  res.json({ pedidos })
}
