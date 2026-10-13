import { Router } from 'express'
import { getAvisos, patchLeida } from '../controllers/avisos.js'
import { asyncHandler } from '../middlewares/errorHandler.js'
import { requireAuth } from '../middlewares/requireAuth.js'
import { requireRole } from '../middlewares/requireRole.js'

export const avisosRouter = Router()

avisosRouter.get(
  '/',
  requireAuth,
  requireRole('usuario', 'administrador'),
  asyncHandler(getAvisos),
)
avisosRouter.patch(
  '/:id/leida',
  requireAuth,
  requireRole('usuario', 'administrador'),
  asyncHandler(patchLeida),
)
