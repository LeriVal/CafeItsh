import { Router } from 'express'
import { getListos } from '../controllers/operacion.js'
import { asyncHandler } from '../middlewares/errorHandler.js'
import { requireAuth } from '../middlewares/requireAuth.js'
import { requireRole } from '../middlewares/requireRole.js'

export const cajaRouter = Router()

cajaRouter.get(
  '/listos',
  requireAuth,
  requireRole('cajero', 'administrador'),
  asyncHandler(getListos),
)
