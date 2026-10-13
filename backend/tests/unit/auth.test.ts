import { describe, expect, it } from 'vitest'
import {
  comparePassword,
  hashPassword,
  signToken,
  verifyToken,
} from '../../src/services/auth.js'

describe('auth service', () => {
  it('genera un hash distinto a la contraseña y lo verifica', async () => {
    const hash = await hashPassword('Secreta123')
    expect(hash).not.toContain('Secreta123')
    await expect(comparePassword('Secreta123', hash)).resolves.toBe(true)
  })

  it('rechaza una contraseña incorrecta', async () => {
    const hash = await hashPassword('Secreta123')
    await expect(comparePassword('OtraClave9', hash)).resolves.toBe(false)
  })

  it('firma y verifica claims sub/rol', () => {
    const token = signToken({ sub: 42, rol: 'cajero' })
    expect(verifyToken(token)).toEqual({ sub: 42, rol: 'cajero' })
  })

  it('rechaza un token manipulado', () => {
    const token = signToken({ sub: 1, rol: 'cocinero' })
    const manipulado = `${token.slice(0, -2)}xx`
    expect(() => verifyToken(manipulado)).toThrow()
  })

  it('rechaza un token expirado', () => {
    process.env.JWT_EXPIRES_IN = '-10s'
    const token = signToken({ sub: 1, rol: 'usuario' })
    delete process.env.JWT_EXPIRES_IN
    expect(() => verifyToken(token)).toThrow()
  })
})
