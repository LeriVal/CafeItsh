import cors from 'cors'
import express from 'express'
import { errorHandler } from './middlewares/errorHandler.js'
import { authRouter } from './routes/auth.js'
import { menuRouter } from './routes/menu.js'
import { pedidosRouter } from './routes/pedidos.js'
import { platillosRouter } from './routes/platillos.js'
import { usuariosRouter } from './routes/usuarios.js'

export const app = express()

/**
 * CORS: solo los orígenes del frontend pueden leer la API desde el
 * navegador. Sin esto, el login y todas las peticiones fallan con error de
 * red aunque el backend esté sano. Orígenes configurables vía FRONTEND_URL
 * (coma-separados para dev + producción); los orígenes ajenos no reciben
 * cabecera ACAO y el navegador bloquea la respuesta.
 */
const allowedOrigins = (process.env.FRONTEND_URL ?? 'http://localhost:5173')
  .split(',')
  .map((s) => s.trim())
  .filter((s) => s.length > 0)

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true)
      } else {
        callback(null, false)
      }
    },
  }),
)

app.use(express.json({ limit: '100kb' }))

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok' })
})

app.use('/api/auth', authRouter)
app.use('/api/usuarios', usuariosRouter)
app.use('/api/platillos', platillosRouter)
app.use('/api/menu', menuRouter)
app.use('/api/pedidos', pedidosRouter)

app.use((_req, res) => {
  res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Recurso no encontrado' } })
})

app.use(errorHandler)
