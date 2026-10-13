# Quickstart: Seguimiento y Notificaciones (Sprint 5)

**Feature**: `specs/006-order-tracking-notifications/` | **Date**: 2026-10-13

Requiere sprints 1–4.

## 1. Migrar

```bash
cd backend
npm run db:migrate   # aplica 004_avisos_leida.sql
```

## 2. Correr

```bash
npm run dev          # http://localhost:3000
cd ../frontend && npm run dev   # http://localhost:5173
```

## 3. Verificación y demo final (traza a SC-001…SC-005)

```bash
cd backend && npm test && npm run typecheck
cd ../frontend && npm test && npm run typecheck
```

Demo final ante la patrocinadora, flujo completo: cliente consulta `/menu` →
arma y paga → confirmación con folio → cocina lo prepara y marca `Listo` →
aviso destacado en `/mis-pedidos` → marcar visto → recoger → cajero marca
`Entregado`. Verificar SC-001 (todo `Listo` con aviso) y suites en verde.
