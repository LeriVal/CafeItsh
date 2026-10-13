import express from 'express'
import type { AddressInfo } from 'node:net'
import type { Server } from 'node:http'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { errorHandler } from '../../src/middlewares/errorHandler.js'
import { requireAuth } from '../../src/middlewares/requireAuth.js'
import { requireRole } from '../../src/middlewares/requireRole.js'
import { pool } from '../../src/db/pool.js'
import { hashPassword, signToken } from '../../src/services/auth.js'

/** App mínima solo para probar el contrato 401/403 de los guardias. */
const probe = express()
probe.use(express.json())
probe.get('/solo-admin', requireAuth, requireRole('administrador'), (_req, res) => {
  res.json({ ok: true })
})
probe.use(errorHandler)

let server: Server
let base = ''
const sufijo = Date.now()
const adminCorreo = `guardia.admin.${sufijo}@itsh.edu.mx`
const clienteCorreo = `guardia.cliente.${sufijo}@itsh.edu.mx`
let adminId = 0
let clienteId = 0

async function crearUsuario(correo: string, rol: string): Promise<number> {
  const hash = await hashPassword('Clave1234')
  const [result] = await pool.query(
    `INSERT INTO usuario (nombre, correo, password_hash, activo, rol_id)
     VALUES ('Guardia', ?, ?, TRUE, (SELECT id FROM rol WHERE nombre = ?))`,
    [correo, hash, rol],
  )
  return (result as { insertId: number }).insertId
}

async function get(path: string, token?: string): Promise<{ status: number; body: unknown }> {
  const res = await fetch(`${base}${path}`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  })
  return { status: res.status, body: await res.json() }
}

beforeAll(async () => {
  await new Promise<void>((resolve) => {
    server = probe.listen(0, () => resolve())
  })
  base = `http://localhost:${(server.address() as AddressInfo).port}`
  adminId = await crearUsuario(adminCorreo, 'administrador')
  clienteId = await crearUsuario(clienteCorreo, 'usuario')
})

afterAll(async () => {
  await pool.query('DELETE FROM usuario WHERE id IN (?, ?)', [adminId, clienteId])
  await pool.end()
  server.close()
})

describe('contrato de guardias 401/403', () => {
  it('401 + envelope sin token', async () => {
    const { status, body } = await get('/solo-admin')
    expect(status).toBe(401)
    expect(body).toEqual({
      error: { code: 'UNAUTHORIZED', message: 'Inicia sesión para continuar' },
    })
  })

  it('401 con token inválido, sin detalles internos', async () => {
    const { status, body } = await get('/solo-admin', 'token-roto')
    expect(status).toBe(401)
    expect(body).toEqual({
      error: {
        code: 'UNAUTHORIZED',
        message: 'Tu sesión expiró o es inválida; inicia sesión de nuevo',
      },
    })
  })

  it('403 con rol insuficiente', async () => {
    const token = signToken({ sub: clienteId, rol: 'usuario' })
    const { status, body } = await get('/solo-admin', token)
    expect(status).toBe(403)
    expect(body).toEqual({
      error: { code: 'FORBIDDEN', message: 'No tienes acceso a esta función' },
    })
  })

  it('200 con el rol requerido', async () => {
    const token = signToken({ sub: adminId, rol: 'administrador' })
    const { status, body } = await get('/solo-admin', token)
    expect(status).toBe(200)
    expect(body).toEqual({ ok: true })
  })

  it('401 si la cuenta se deshabilitó tras firmar el token (T020)', async () => {
    const token = signToken({ sub: clienteId, rol: 'usuario' })
    await pool.query('UPDATE usuario SET activo = FALSE WHERE id = ?', [clienteId])
    const { status } = await get('/solo-admin', token)
    await pool.query('UPDATE usuario SET activo = TRUE WHERE id = ?', [clienteId])
    expect(status).toBe(401)
  })

  it('401 si el rol cambió tras firmar el token (T020)', async () => {
    const token = signToken({ sub: clienteId, rol: 'usuario' })
    await pool.query(
      "UPDATE usuario SET rol_id = (SELECT id FROM rol WHERE nombre = 'cajero') WHERE id = ?",
      [clienteId],
    )
    const { status } = await get('/solo-admin', token)
    await pool.query(
      "UPDATE usuario SET rol_id = (SELECT id FROM rol WHERE nombre = 'usuario') WHERE id = ?",
      [clienteId],
    )
    expect(status).toBe(401)
  })
})
