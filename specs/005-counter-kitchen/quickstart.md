# Quickstart: Mostrador y Cocina (Sprint 4)

**Feature**: `specs/005-counter-kitchen/` | **Date**: 2026-10-13

Requiere sprints 1–3 (sesión, menú de hoy, anticipados Pagado).

## 1. Verificar base

```bash
cd backend
npm run db:migrate   # sin pendientes
```

## 2. Correr

```bash
npm run dev          # http://localhost:3000
cd ../frontend && npm run dev   # http://localhost:5173
```

## 3. Verificación y demo (traza a SC-001…SC-005)

```bash
cd backend && npm test && npm run typecheck
cd ../frontend && npm test && npm run typecheck
```

Demo: como cajero en `/caja`, capturar mostrador con monto recibido (ver
cambio) mientras un anticipado existe; como cocinero en `/cocina`, ver ambos
ordenados, avanzar a `En preparación` y `Listo` (auto-refresh); como cajero,
entregar desde el bloque de entrega; intentos: monto insuficiente, cocinero
entregando (403), saltos y cerrados (409).
