# Contracts: Seguimiento y Avisos (Sprint 5)

**Feature**: `specs/006-order-tracking-notifications/` | **Date**: 2026-10-13

Base `/api`, sesión requerida. Errores con envelope.

## GET /api/pedidos/mios — mis pedidos (usuario, admin)

- 200 → `{ "pedidos": [{ "id", "numero", "tipo", "estado", "total",
  "fechaRecoleccion", "detalle": [{ "nombre", "cantidad", "subtotal" }] }] }`
  solo del dueño, recientes primero.

## GET /api/avisos — mis avisos (usuario, admin)

- 200 → `{ "avisos": [{ "id", "pedidoId", "numero", "tipo": "pedido_listo",
  "leida", "fecha" }] }` no leídos primero.

## PATCH /api/avisos/:id/leida — marcar visto (dueño o admin)

- 200 → `{ "aviso": { ..., "leida": true } }`. 404 si no existe o no es suyo
  (sin distinguir).
