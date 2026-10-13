import express from 'express'
import { errorHandler } from './middlewares/errorHandler.js'
import { authRouter } from './routes/auth.js'
import { usuariosRouter } from './routes/usuarios.js'

export const app = express()

app.use(express.json({ limit: '100kb' }))

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok' })
})

app.use('/api/auth', authRouter)
app.use('/api/usuarios', usuariosRouter)

app.use((_req, res) => {
  res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Recurso no encontrado' } })
})

app.use(errorHandler)
