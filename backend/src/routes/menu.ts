import { Router } from 'express'
import { deleteLinea, getMenu, patchLinea, postLinea } from '../controllers/menu.js'
import { asyncHandler } from '../middlewares/errorHandler.js'
import { requireAuth } from '../middlewares/requireAuth.js'
import { requireRole } from '../middlewares/requireRole.js'

export const menuRouter = Router()

menuRouter.get('/', requireAuth, asyncHandler(getMenu))
menuRouter.post('/', requireAuth, requireRole('administrador'), asyncHandler(postLinea))
menuRouter.patch(
  '/:id',
  requireAuth,
  requireRole('administrador'),
  asyncHandler(patchLinea),
)
menuRouter.delete(
  '/:id',
  requireAuth,
  requireRole('administrador'),
  asyncHandler(deleteLinea),
)
