import type { Request, Response } from 'express'
import { AppError } from '../middlewares/errorHandler.js'
import { crearAnticipado, leerPorFolio, listarMisPedidos, obtenerPedido } from '../services/pedidos.js'
import { ProveedorRechazo, pagarPedido } from '../services/pagos.js'

const CAMPOS_TARJETA = ['tarjeta', 'numeroTarjeta', 'numero_tarjeta', 'cvv', 'cvc', 'pan', 'vencimiento']

function rechazarTarjeta(body: Record<string, unknown>): void {
  if (CAMPOS_TARJETA.some((c) => body[c] !== undefined)) {
    throw new AppError(
      400,
      'CARD_DATA_FORBIDDEN',
      'No se aceptan datos de tarjetas; el pago usa el servicio externo',
    )
  }
}

export async function postPedido(req: Request, res: Response): Promise<void> {
  const body = req.body as Record<string, unknown>
  rechazarTarjeta(body)
  const usuario = req.usuario
  if (!usuario) {
    throw new AppError(401, 'UNAUTHORIZED', 'Inicia sesión para continuar')
  }
  const pedido = await crearAnticipado(usuario.id, {
    items: body.items,
    fechaRecoleccion: body.fechaRecoleccion,
  })
  res.status(201).json({ pedido })
}

export async function getPedido(req: Request, res: Response): Promise<void> {
  const usuario = req.usuario
  if (!usuario) {
    throw new AppError(401, 'UNAUTHORIZED', 'Inicia sesión para continuar')
  }
  const pedido = await obtenerPedido(Number(req.params.id), {
    id: usuario.id,
    rol: usuario.rol,
  })
  res.json({ pedido })
}

export async function getMios(req: Request, res: Response): Promise<void> {
  const usuario = req.usuario
  if (!usuario) {
    throw new AppError(401, 'UNAUTHORIZED', 'Inicia sesión para continuar')
  }
  const pedidos = await listarMisPedidos(usuario.id)
  res.json({ pedidos })
}

export async function getPorFolio(req: Request, res: Response): Promise<void> {
  const usuario = req.usuario
  if (!usuario) {
    throw new AppError(401, 'UNAUTHORIZED', 'Inicia sesión para continuar')
  }
  const { numero } = req.params
  if (typeof numero !== 'string') {
    throw new AppError(404, 'NOT_FOUND', 'Pedido no encontrado')
  }
  const pedido = await leerPorFolio(numero, {
    id: usuario.id,
    rol: usuario.rol,
  })
  res.json({ pedido })
}

export async function postPagar(req: Request, res: Response): Promise<void> {
  const body = (req.body ?? {}) as Record<string, unknown>
  rechazarTarjeta(body)
  const usuario = req.usuario
  if (!usuario) {
    throw new AppError(401, 'UNAUTHORIZED', 'Inicia sesión para continuar')
  }
  try {
    const { pedido, referencia } = await pagarPedido(Number(req.params.id), {
      id: usuario.id,
      rol: usuario.rol,
    })
    res.json({ pedido, pago: { referencia } })
  } catch (err) {
    if (err instanceof ProveedorRechazo) {
      throw new AppError(400, 'PAGO_RECHAZADO', err.message)
    }
    throw err
  }
}
