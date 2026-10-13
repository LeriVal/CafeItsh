import { Router } from 'express'
import { getMios, getPedido, postPagar, postPedido } from '../controllers/pedidos.js'
import { asyncHandler } from '../middlewares/errorHandler.js'
import { requireAuth } from '../middlewares/requireAuth.js'
import { requireRole } from '../middlewares/requireRole.js'

const soloCliente = requireRole('usuario')
const clienteOAdmin = requireRole('usuario', 'administrador')

export const pedidosRouter = Router()

pedidosRouter.post('/', requireAuth, soloCliente, asyncHandler(postPedido))
// '/mios' ANTES de '/:id': si no, 'mios' caería en el parámetro id.
pedidosRouter.get('/mios', requireAuth, clienteOAdmin, asyncHandler(getMios))
pedidosRouter.get('/:id', requireAuth, clienteOAdmin, asyncHandler(getPedido))
pedidosRouter.post('/:id/pagar', requireAuth, clienteOAdmin, asyncHandler(postPagar))
