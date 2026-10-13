import { Router } from 'express'
import { getCola } from '../controllers/operacion.js'
import { asyncHandler } from '../middlewares/errorHandler.js'
import { requireAuth } from '../middlewares/requireAuth.js'
import { requireRole } from '../middlewares/requireRole.js'

export const cocinaRouter = Router()

cocinaRouter.get(
  '/cola',
  requireAuth,
  requireRole('cocinero', 'administrador'),
  asyncHandler(getCola),
)
