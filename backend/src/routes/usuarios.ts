import { Router } from 'express'
import { getUsuarios, patchUsuario, postUsuario } from '../controllers/usuarios.js'
import { asyncHandler } from '../middlewares/errorHandler.js'
import { requireAuth } from '../middlewares/requireAuth.js'
import { requireRole } from '../middlewares/requireRole.js'

export const usuariosRouter = Router()

usuariosRouter.use(requireAuth, requireRole('administrador'))

usuariosRouter.get('/', asyncHandler(getUsuarios))
usuariosRouter.post('/', asyncHandler(postUsuario))
usuariosRouter.patch('/:id', asyncHandler(patchUsuario))
