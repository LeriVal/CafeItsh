# Quickstart: Pedido Anticipado y Pago (Sprint 3)

**Feature**: `specs/004-advance-orders-payment/` | **Date**: 2026-10-13

Requiere Sprint 2 (menú publicado hoy) y Sprint 1 (sesión).

## 1. Verificar base

```bash
cd backend
npm run db:migrate   # sin pendientes; estados y transiciones ya sembrados
```

## 2. Correr

```bash
npm run dev          # http://localhost:3000
cd ../frontend && npm run dev   # http://localhost:5173
```

## 3. Verificación y demo (traza a SC-001…SC-006)

```bash
cd backend && npm test && npm run typecheck
cd ../frontend && npm test && npm run typecheck
```

Demo manual como cliente: en `/menu` agregar disponibles con cantidades (los
no disponibles no tienen control) → ver total en la barra del carrito →
`/pedido/nuevo`, hora de recogida ≥10 min → pagar → confirmación con folio
`A-...` y estado `Pagado`. Intentos: recogida en 5 min (rechazo), pagar dos
veces (rechazo), otro cliente viendo el pedido (denegado), simulación de
rechazo de pago (sigue `Pendiente`, reintento sin duplicado).
