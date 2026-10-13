-- ============================================================
-- 003_schema_migrations.sql
-- Tabla de control del corredor de migraciones
-- (backend/scripts/migrate.ts). Idempotente.
-- ============================================================

CREATE TABLE IF NOT EXISTS schema_migrations (
  nombre      VARCHAR(100) NOT NULL PRIMARY KEY,
  aplicado_en TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;
