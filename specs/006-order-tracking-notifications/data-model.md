# Data Model: Seguimiento y Notificaciones (Sprint 5)

**Feature**: `specs/006-order-tracking-notifications/` | **Date**: 2026-10-13

Un cambio de esquema (migración 004); el resto es lectura.

## Aviso (tabla existente + `leida` nueva)

`notificacion(id, pedido_id → pedido, tipo='pedido_listo', canal='push',
estado_envio='enviada', leida BOOLEAN DEFAULT FALSE, fecha, detalle_error)`.

- Uno por llegada a `Listo` (la transición es única por estado: sin duplicados
  posibles).
- `leida` solo la mueve el dueño (o admin).

## Mis pedidos (lectura)

Pedidos del dueño (`usuario_id`) con folio, estado, total, recogida y detalle
completo, ordenados por creación descendente (lo reciente primero).
