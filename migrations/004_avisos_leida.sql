-- ============================================================
-- 004_avisos_leida.sql
-- Marca de "visto" para la bandeja de avisos en-app (Sprint 5).
-- Idempotente.
-- ============================================================

ALTER TABLE notificacion ADD COLUMN leida BOOLEAN NOT NULL DEFAULT FALSE;

CREATE INDEX idx_notificacion_pedido ON notificacion(pedido_id);
CREATE INDEX idx_notificacion_leida ON notificacion(leida);
