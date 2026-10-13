import mysql from 'mysql2/promise'

function databaseUrl(): string {
  const url = process.env.DATABASE_URL
  if (!url) {
    throw new Error('Falta DATABASE_URL en el entorno (ver backend/.env.example)')
  }
  return url
}

export const pool = mysql.createPool({
  uri: databaseUrl(),
  waitForConnections: true,
  connectionLimit: 10,
  charset: 'utf8mb4',
})
