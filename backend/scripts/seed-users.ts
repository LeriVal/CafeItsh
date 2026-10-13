/**
 * Crea las cuentas operativas iniciales (admin/cajero/cocinero) desde
 * variables de entorno (R6). Los hashes se generan con bcryptjs; ninguna
 * contraseña vive en SQL ni en el repo.
 *
 * - Si la cuenta ya existe, se conserva intacta (no sobrescribe contraseñas).
 * - Se niega en producción salvo ALLOW_PROD_SEED=true explícito.
 *
 * Uso: npm run db:seed
 */
import 'dotenv/config'
import { pool } from '../src/db/pool.js'
import { hashPassword } from '../src/services/auth.js'
import { normalizeEmail } from '../src/utils/validate.js'
import type { RolNombre } from '../src/types.js'

interface SeedAccount {
  envPrefix: string
  rol: RolNombre
}

const ACCOUNTS: SeedAccount[] = [
  { envPrefix: 'ADMIN', rol: 'administrador' },
  { envPrefix: 'CAJA', rol: 'cajero' },
  { envPrefix: 'COCINA', rol: 'cocinero' },
]

async function main(): Promise<void> {
  if (process.env.NODE_ENV === 'production' && process.env.ALLOW_PROD_SEED !== 'true') {
    throw new Error('Seed bloqueado en producción (define ALLOW_PROD_SEED=true para forzarlo)')
  }
  for (const account of ACCOUNTS) {
    const correo = normalizeEmail(process.env[`${account.envPrefix}_EMAIL`] ?? '')
    const password = process.env[`${account.envPrefix}_PASSWORD`] ?? ''
    const nombre = (process.env[`${account.envPrefix}_NOMBRE`] ?? account.rol).trim()
    if (!correo || !password) {
      console.log(`- ${account.rol}: sin variables ${account.envPrefix}_EMAIL/_PASSWORD, se omite`)
      continue
    }
    const [existing] = await pool.query('SELECT id FROM usuario WHERE correo = ?', [correo])
    if ((existing as unknown[]).length > 0) {
      console.log(`= ${correo} ya existe, se conserva`)
      continue
    }
    const passwordHash = await hashPassword(password)
    await pool.query(
      `INSERT INTO usuario (nombre, correo, password_hash, activo, rol_id)
       VALUES (?, ?, ?, TRUE, (SELECT id FROM rol WHERE nombre = ?))`,
      [nombre, correo, passwordHash, account.rol],
    )
    console.log(`+ ${correo} (${account.rol}) creada`)
  }
  await pool.end()
}

main().catch((err: unknown) => {
  console.error('db:seed falló:', err instanceof Error ? err.message : err)
  process.exit(1)
})
