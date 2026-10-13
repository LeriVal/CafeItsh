# Phase 0 Research: Seguimiento y Notificaciones (Sprint 5)

**Feature**: `specs/006-order-tracking-notifications/` | **Date**: 2026-10-13

Rigen la constitución v1.0.0 y lo construido: `transicionarPedido` es la
puerta única de estados, `notificacion` existe (pedido, tipo, canal
correo/push/sms, estado_envío) y `/mis-pedidos` es placeholder.

## R1. Migración 004: columna `leida` en notificacion

- **Decision**: `ALTER TABLE notificacion ADD COLUMN leida BOOLEAN NOT NULL
  DEFAULT FALSE` + índice por pedido. Única migración del sprint.
- **Rationale**: el enum `estado_envio` describe el envío, no la lectura; la
  bandeja necesita "visto" sin tocar el flujo de envío.
- **Alternatives**: inferir visto por otro medio — rechazado (ambiguo).

## R2. Aviso en-app tras interfaz, disparado al llegar a Listo

- **Decision**: `ProveedorAviso` (`avisar(pedidoId, dueñoId)`) con `AvisoEnApp`
  (inserta `tipo='pedido_listo'`, `canal='push'`, `enviada`); `transicionarPedido`
  lo invoca tras el commit solo si el nuevo estado es `Listo`, en
  try/catch que solo registra en log (nunca revierte).
- **Rationale**: "separada de la lógica de pedidos" = módulo y tabla propios
  con contrato; el aviso no puede romper la transición que lo origina.
- **Alternatives**: envío externo real ya — rechazado (sin servicio
  contratado en el MVP); triggers SQL — rechazados (lógica fuera del código
  auditable).

## R3. Listado "mis pedidos" dueño-scoped en backend

- **Decision**: `GET /api/pedidos/mios` (dueño; admin ve los suyos, que no
  existen en la práctica) con resumen + detalle; ruta registrada ANTES de
  `GET /:id` para no colisionar con `id='mios'`.
- **Rationale**: la lista es dato sensible por dueño; el filtro vive en SQL,
  no en el cliente.
- **Alternatives**: filtrar en frontend desde una lista global — rechazado
  (filtra existencia ajena).

## R4. Sondeo 10 s reutilizado

- **Decision**: misma constante `SONDEO_MS` de cocina para `/mis-pedidos`.
- **Rationale**: consistencia y cero decisiones nuevas.
- **Alternatives**: tiempo distinto — sin justificación.

## R5. Pulido acotado: badge de estado + usos

- **Decision**: tokens `status-*` de DESIGN.md al `@theme` + componente
  `StatusBadge`, aplicado en MisPedidos, Cocina y Confirmación. Nada más:
  el resto de la UI ya sigue los tokens.
- **Rationale**: el criterio pide consistencia de estados, no rediseño.
- **Alternatives**: pulido amplio — rechazado (riesgo de regresiones antes de
  la demo).
