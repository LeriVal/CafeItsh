import { Router } from 'express'
import { getMios, getPedido, getPorFolio, postPagar, postPedido } from '../controllers/pedidos.js'
import { asyncHandler } from '../middlewares/errorHandler.js'
import { requireAuth } from '../middlewares/requireAuth.js'
import { requireRole } from '../middlewares/requireRole.js'

const soloCliente = requireRole('usuario')
const clienteOAdmin = requireRole('usuario', 'administrador')
const operativoOCaja = requireRole('usuario', 'cajero', 'administrador')

export const pedidosRouter = Router()

pedidosRouter.post('/', requireAuth, soloCliente, asyncHandler(postPedido))
// '/mios' y '/folio/...' ANTES de '/:id': si no, caerían en el parámetro id.
pedidosRouter.get('/mios', requireAuth, clienteOAdmin, asyncHandler(getMios))
pedidosRouter.get(
  '/folio/:numero',
  requireAuth,
  requireRole('cajero', 'administrador'),
  asyncHandler(getPorFolio),
)
pedidosRouter.get('/:id', requireAuth, operativoOCaja, asyncHandler(getPedido))
pedidosRouter.post('/:id/pagar', requireAuth, clienteOAdmin, asyncHandler(postPagar))
