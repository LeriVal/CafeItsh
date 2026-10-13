/**
 * Corredor de migraciones (R5): aplica en orden los archivos .sql de
 * migrations/ y registra cada uno en schema_migrations. Idempotente.
 *
 * Comportamiento de línea base: si un archivo aún no está registrado pero sus
 * objetos ya existen en la BD (p. ej. 001 aplicado manualmente según
 * docs/ejecutar-migraciones.md), el servidor responde ER_TABLE_EXISTS_ERROR
 * (errno 1050); en ese caso se registra como aplicado con advertencia en
 * lugar de abortar. Los seed con INSERT IGNORE (002) se re-ejecutan sin daño.
 *
 * Uso: npm run db:migrate
 */
import 'dotenv/config'
import { readdir, readFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import mysql from 'mysql2/promise'

const MIGRATIONS_DIR = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '..',
  '..',
  'migrations',
)

function databaseUrl(): string {
  const url = process.env.DATABASE_URL
  if (!url) {
    throw new Error('Falta DATABASE_URL en el entorno (ver backend/.env.example)')
  }
  return url
}

function isAlreadyExists(err: unknown): boolean {
  return (
    typeof err === 'object' &&
    err !== null &&
    'errno' in err &&
    (err as { errno: number }).errno === 1050
  )
}

async function main(): Promise<void> {
  const connection = await mysql.createConnection({
    uri: databaseUrl(),
    multipleStatements: true,
    charset: 'utf8mb4',
  })
  try {
    await connection.query(
      `CREATE TABLE IF NOT EXISTS schema_migrations (
        nombre      VARCHAR(100) NOT NULL PRIMARY KEY,
        aplicado_en TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB`,
    )
    const [rows] = await connection.query('SELECT nombre FROM schema_migrations')
    const applied = new Set((rows as Array<{ nombre: string }>).map((r) => r.nombre))

    const files = (await readdir(MIGRATIONS_DIR))
      .filter((f) => f.endsWith('.sql'))
      .sort()
    let pending = 0
    for (const file of files) {
      if (applied.has(file)) {
        console.log(`= ${file} (ya aplicada)`)
        continue
      }
      pending += 1
      const sql = await readFile(path.join(MIGRATIONS_DIR, file), 'utf8')
      try {
        await connection.query(sql)
        console.log(`+ ${file} aplicada`)
      } catch (err) {
        if (isAlreadyExists(err)) {
          console.warn(
            `~ ${file} ya existía en la BD (línea base manual); se registra como aplicada`,
          )
        } else {
          throw err
        }
      }
      await connection.query('INSERT IGNORE INTO schema_migrations (nombre) VALUES (?)', [
        file,
      ])
    }
    console.log(pending === 0 ? 'Sin migraciones pendientes.' : 'Migraciones al día.')
  } finally {
    await connection.end()
  }
}

main().catch((err: unknown) => {
  console.error('db:migrate falló:', err instanceof Error ? err.message : err)
  process.exit(1)
})
