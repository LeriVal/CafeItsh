import { Router } from 'express'
import { postMostrador } from '../controllers/mostrador.js'
import { asyncHandler } from '../middlewares/errorHandler.js'
import { requireAuth } from '../middlewares/requireAuth.js'
import { requireRole } from '../middlewares/requireRole.js'

export const mostradorRouter = Router()

mostradorRouter.post(
  '/',
  requireAuth,
  requireRole('cajero', 'administrador'),
  asyncHandler(postMostrador),
)
