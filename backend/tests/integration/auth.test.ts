import type { AddressInfo } from 'node:net'
import type { Server } from 'node:http'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { app } from '../../src/app.js'
import { pool } from '../../src/db/pool.js'
import { hashPassword } from '../../src/services/auth.js'

let server: Server
let base = ''

async function api(path: string, init?: RequestInit): Promise<{ status: number; body: unknown }> {
  const res = await fetch(`${base}${path}`, {
    ...init,
    headers: { 'Content-Type': 'application/json', ...(init?.headers ?? {}) },
  })
  let body: unknown = null
  try {
    body = await res.json()
  } catch {
    body = null
  }
  return { status: res.status, body }
}

const correo = `prueba.login.${Date.now()}@itsh.edu.mx`

beforeAll(async () => {
  await new Promise<void>((resolve) => {
    server = app.listen(0, () => resolve())
  })
  base = `http://localhost:${(server.address() as AddressInfo).port}`
  const hash = await hashPassword('Clave1234')
  await pool.query(
    `INSERT INTO usuario (nombre, correo, password_hash, activo, rol_id)
     VALUES ('Prueba Login', ?, ?, TRUE, (SELECT id FROM rol WHERE nombre = 'cajero'))`,
    [correo, hash],
  )
})

afterAll(async () => {
  await pool.query(
    "DELETE FROM usuario WHERE correo = ? OR correo LIKE 'prueba.registro.%@itsh.edu.mx'",
    [correo],
  )
  await pool.end()
  server.close()
})

describe('POST /api/auth/login', () => {
  it('200 + token con credenciales válidas', async () => {
    const { status, body } = await api('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ correo, password: 'Clave1234' }),
    })
    expect(status).toBe(200)
    const data = body as { token: string; usuario: { rol: string } }
    expect(typeof data.token).toBe('string')
    expect(data.usuario.rol).toBe('cajero')
    expect(body).not.toHaveProperty('password_hash')
  })

  it('401 genérico con contraseña errónea', async () => {
    const { status, body } = await api('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ correo, password: 'Equivocada1' }),
    })
    expect(status).toBe(401)
    expect(body).toEqual({
      error: { code: 'INVALID_CREDENTIALS', message: 'Correo o contraseña inválidos' },
    })
  })

  it('401 genérico con cuenta inexistente', async () => {
    const { status, body } = await api('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ correo: 'nadie@itsh.edu.mx', password: 'Clave1234' }),
    })
    expect(status).toBe(401)
    expect(body).toEqual({
      error: { code: 'INVALID_CREDENTIALS', message: 'Correo o contraseña inválidos' },
    })
  })
})

describe('GET /api/auth/me', () => {  it('200 con token válido', async () => {
    const login = await api('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ correo, password: 'Clave1234' }),
    })
    const token = (login.body as { token: string }).token
    const { status, body } = await api('/api/auth/me', {
      headers: { Authorization: `Bearer ${token}` },
    })
    expect(status).toBe(200)
    expect((body as { usuario: { correo: string } }).usuario.correo).toBe(correo)
  })

  it('401 sin token', async () => {
    const { status, body } = await api('/api/auth/me')
    expect(status).toBe(401)
    expect(body).toEqual({
      error: { code: 'UNAUTHORIZED', message: 'Inicia sesión para continuar' },
    })
  })
})

describe('POST /api/auth/register', () => {
  const nuevo = `prueba.registro.${Date.now()}@itsh.edu.mx`

  it('201 crea cliente con rol usuario aunque se pida otro rol', async () => {
    const { status, body } = await api('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({ nombre: 'Alumna Nueva', correo: nuevo, password: 'Clave1234', rol: 'administrador' }),
    })
    expect(status).toBe(201)
    const data = body as { usuario: { rol: string; correo: string } }
    expect(data.usuario.rol).toBe('usuario')
    expect(data.usuario.correo).toBe(nuevo)
    expect(body).not.toHaveProperty('password_hash')
    expect(JSON.stringify(body)).not.toContain('Clave1234')
  })

  it('la cuenta registrada inicia sesión y es cliente', async () => {
    const { status, body } = await api('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ correo: nuevo, password: 'Clave1234' }),
    })
    expect(status).toBe(200)
    expect((body as { usuario: { rol: string } }).usuario.rol).toBe('usuario')
  })

  it('409 con correo duplicado', async () => {
    const { status, body } = await api('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({ nombre: 'Otra', correo: nuevo, password: 'Clave1234' }),
    })
    expect(status).toBe(409)
    expect(body).toEqual({
      error: { code: 'EMAIL_TAKEN', message: 'Ese correo ya está registrado' },
    })
  })

  it('400 con datos inválidos', async () => {
    const { status } = await api('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({ nombre: '', correo: 'no-es-correo', password: 'corta' }),
    })
    expect(status).toBe(400)
  })
})
