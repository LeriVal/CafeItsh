# Implementation Plan: Seguimiento y Notificaciones (Sprint 5)

**Branch**: `006-order-tracking-notifications` | **Date**: 2026-10-13 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `/specs/006-order-tracking-notifications/spec.md`
(trazable a US2, FR-017 y FR-023 de la spec maestra
`../001-pedidos-anticipados-cafeteria/spec.md`).

**Note**: Diseño en `research.md`, `data-model.md`, `contracts/` y
`quickstart.md`; implementación en `tasks.md`.

## Summary

El cliente sigue sus pedidos con detalle y recibe el aviso al llegar a
`Listo` desde un módulo separado; se cierra el MVP con badge de estados
consistente y demo completa. Enfoque: migración 004 (`leida`), proveedor de
avisos en-app tras interfaz disparado post-commit sin bloquear, listado
dueño-scoped, sondeo reutilizado y pulido acotado al badge.

## Technical Context

**Language/Version**: TypeScript 5.x estricto, Node.js 20 LTS.

**Primary Dependencies**: acumuladas; sin dependencias nuevas.

**Storage**: MySQL 8.0; migración `004_avisos_leida.sql` (columna + índice);
resto lectura de tablas existentes.

**Testing**: Vitest + `tsc --noEmit` en ambos lados.

**Target Platform**: web responsiva (móvil primero).

**Project Type**: web application (frontend + backend).

**Performance Goals**: lista y bandeja instantáneas a volumen de un plantel;
sondeo ligero.

**Constraints**: aviso nunca bloquea transición; dueño-scoped; un aviso por
`Listo`; tokens DESIGN.md.

**Scale/Scope**: cierra el MVP; nada fuera de alcance.

## Constitution Check

- **I. Alcance**: solo US2 + pulido (FR-001…FR-007 de la spec); nada fuera
  del MVP → PASS.
- **II. Seguridad**: dueño-scoped en SQL; aviso sin datos sensibles → PASS.
- **III. Simplicidad**: un servicio (`notificaciones`) + 3 endpoints + 1
  migración + 1 componente → PASS.
- **IV. Rapidez**: sondeo reutilizado; badge CSS puro → PASS.
- **V. Trazabilidad**: aviso ligado a pedido y transición; SC-001 medible → PASS.
- **VI. Validación y errores**: 404 sin distinguir; fallo de aviso solo a
  log → PASS.
- **VII. Viabilidad**: cero costo → PASS.

Re-chequeo post-Phase 1: sin cambios que afecten gates.

## Project Structure

### Documentation (this feature)

```text
specs/006-order-tracking-notifications/
  plan.md  research.md  data-model.md  quickstart.md  contracts/  tasks.md
```

### Source Code (repository root)

```text
migrations/004_avisos_leida.sql

backend/
  src/
    services/notificaciones.ts   # ProveedorAviso, AvisoEnApp, crearAvisoListo
    services/pedidos.ts          # + disparo post-commit en transicionarPedido
    routes/avisos.ts             # GET /api/avisos, PATCH /:id/leida
    routes/pedidos.ts            # + GET /api/pedidos/mios (antes de /:id)
  tests/integration/avisos.test.ts

frontend/
  src/
    components/StatusBadge.tsx   # colores status-* de DESIGN.md
    pages/clientes/MisPedidos.tsx
    lib/seguimiento.ts
  tests/seguimiento.test.tsx
```

**Structure Decision**: se extiende la estructura existente.

## Complexity Tracking

Sin violaciones; nada que justificar.
