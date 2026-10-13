import { Router } from 'express'
import { getMe, postLogin, postRegister } from '../controllers/auth.js'
import { asyncHandler } from '../middlewares/errorHandler.js'
import { requireAuth } from '../middlewares/requireAuth.js'

export const authRouter = Router()

authRouter.post('/login', asyncHandler(postLogin))
authRouter.post('/register', asyncHandler(postRegister))
authRouter.get('/me', requireAuth, asyncHandler(getMe))
