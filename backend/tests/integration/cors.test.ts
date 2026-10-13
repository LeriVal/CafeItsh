import type { AddressInfo } from 'node:net'
import type { Server } from 'node:http'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { app } from '../../src/app.js'

/** Regresión: el navegador debe poder llamar a la API desde el frontend. */
let server: Server
let base = ''

beforeAll(async () => {
  await new Promise<void>((resolve) => {
    server = app.listen(0, () => resolve())
  })
  base = `http://localhost:${(server.address() as AddressInfo).port}`
})

afterAll(async () => {
  server.close()
})

describe('CORS', () => {
  it('responde ACAO al origen del frontend', async () => {
    const res = await fetch(`${base}/api/health`, {
      headers: { Origin: 'http://localhost:5173' },
    })
    expect(res.status).toBe(200)
    expect(res.headers.get('access-control-allow-origin')).toBe('http://localhost:5173')
  })

  it('preflight OPTIONS habilita POST con JSON', async () => {
    const res = await fetch(`${base}/api/auth/login`, {
      method: 'OPTIONS',
      headers: {
        Origin: 'http://localhost:5173',
        'Access-Control-Request-Method': 'POST',
        'Access-Control-Request-Headers': 'content-type, authorization',
      },
    })
    expect(res.status).toBe(204)
    expect(res.headers.get('access-control-allow-origin')).toBe('http://localhost:5173')
    expect(res.headers.get('access-control-allow-methods')).toContain('POST')
  })

  it('otro origen no recibe ACAO', async () => {
    const res = await fetch(`${base}/api/health`, {
      headers: { Origin: 'http://sitio-ajeno.example' },
    })
    expect(res.status).toBe(200)
    expect(res.headers.get('access-control-allow-origin')).toBeNull()
  })
})
