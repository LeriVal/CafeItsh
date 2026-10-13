import { Router } from 'express'
import { getPedido, postPagar, postPedido } from '../controllers/pedidos.js'
import { asyncHandler } from '../middlewares/errorHandler.js'
import { requireAuth } from '../middlewares/requireAuth.js'
import { requireRole } from '../middlewares/requireRole.js'

const soloCliente = requireRole('usuario')
const clienteOAdmin = requireRole('usuario', 'administrador')

export const pedidosRouter = Router()

pedidosRouter.post('/', requireAuth, soloCliente, asyncHandler(postPedido))
pedidosRouter.get('/:id', requireAuth, clienteOAdmin, asyncHandler(getPedido))
pedidosRouter.post('/:id/pagar', requireAuth, clienteOAdmin, asyncHandler(postPagar))
