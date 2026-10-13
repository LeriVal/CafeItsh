import { Router } from 'express'
import { patchEstado } from '../controllers/transiciones.js'
import { asyncHandler } from '../middlewares/errorHandler.js'
import { requireAuth } from '../middlewares/requireAuth.js'
import { requireRole } from '../middlewares/requireRole.js'

export const transicionesRouter = Router()

transicionesRouter.patch(
  '/:id/estado',
  requireAuth,
  requireRole('cocinero', 'cajero', 'administrador'),
  asyncHandler(patchEstado),
)
