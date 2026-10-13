import { Router } from 'express'
import { getPlatillos, patchPlatillo, postPlatillo } from '../controllers/platillos.js'
import { asyncHandler } from '../middlewares/errorHandler.js'
import { requireAuth } from '../middlewares/requireAuth.js'
import { requireRole } from '../middlewares/requireRole.js'

export const platillosRouter = Router()

platillosRouter.get('/', requireAuth, asyncHandler(getPlatillos))
platillosRouter.post('/', requireAuth, requireRole('administrador'), asyncHandler(postPlatillo))
platillosRouter.patch(
  '/:id',
  requireAuth,
  requireRole('administrador'),
  asyncHandler(patchPlatillo),
)
