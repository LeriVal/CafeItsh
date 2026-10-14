import 'dotenv/config'
import { pool } from '../src/db/pool.js'

/**
 * Los tests operan sobre el menú de hoy; si la BD solo trae menús de días
 * pasados (p. ej. al día siguiente del seed), se replica el más reciente
 * para hoy. Idempotente (INSERT IGNORE + UNIQUE por fecha+platillo).
 */
async function asegurarMenuHoy(): Promise<void> {
  await pool.query(
    `INSERT IGNORE INTO menu_dia (fecha, platillo_id, precio, disponible, especial)
     SELECT CURRENT_DATE, platillo_id, precio, disponible, especial
     FROM menu_dia WHERE fecha = (SELECT MAX(fecha) FROM menu_dia)`,
  )
  // Sin pool.end(): el pool es compartido y cada archivo lo cierra en afterAll.
}

await asegurarMenuHoy()
