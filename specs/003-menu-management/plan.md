# Implementation Plan: Gestión y Consulta de Menú (Sprint 2)

**Branch**: `003-menu-management` | **Date**: 2026-10-13 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `/specs/003-menu-management/spec.md`
(trazable a US5 y consulta de US1, FR-004…FR-008 de la spec maestra
`../001-pedidos-anticipados-cafeteria/spec.md`).

**Note**: Diseño en `research.md`, `data-model.md`, `contracts/` y
`quickstart.md`; implementación en `tasks.md`.

## Summary

El administrador gestiona el catálogo de platillos y publica el menú del día
(precio, disponibilidad, especiales) con reflejo inmediato; los clientes lo
consultan rápido desde el móvil. Enfoque (de `research.md`): sin migraciones
(el esquema 001 ya cubre todo), "hoy" en `America/Mexico_City`, desactivar en
vez de borrar, precio > 0, lectura con sesión y mutación solo admin, sin caché,
y `/admin` reorganizado en subrutas con navegación.

## Technical Context

**Language/Version**: TypeScript 5.x estricto, Node.js 20 LTS.

**Primary Dependencies**: las del Sprint 1 (express, mysql2, jsonwebtoken,
bcryptjs, react-router-dom, tailwindcss v4); sin dependencias nuevas.

**Storage**: MySQL 8.0, tablas existentes `platillo` y `menu_dia`; sin
migraciones nuevas (verificación con `db:migrate`).

**Testing**: Vitest + `tsc --noEmit` en ambos lados, como en el Sprint 1.

**Target Platform**: web responsiva, con énfasis en móvil para `/menu`.

**Project Type**: web application (frontend + backend).

**Performance Goals**: apertura del menú sin espera perceptible en receso;
consultas por índice de fecha ya existente.

**Constraints**: mutaciones solo `administrador`; precio > 0; UNIQUE
(fecha, platillo); sin borrar platillos; envelope de errores.

**Scale/Scope**: un menú por día (decenas de líneas), cientos de consultas en
receso; sin pedidos/pagos/notificaciones.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- **I. Alcance**: solo US5 + consulta (FR-004…FR-008); pedidos/carrito/pagos
  explícitamente fuera (FR-010) → PASS.
- **II. Seguridad**: mutaciones tras `requireAuth`+`requireRole
  ('administrador')`; lectura con sesión; validación backend → PASS.
- **III. Simplicidad**: dos servicios (`platillos`, `menu`), sin
  dependencias nuevas, sin migraciones → PASS.
- **IV. Rapidez**: lectura directa por fecha indexada, UI móvil-first con
  tarjetas → PASS.
- **V. Trazabilidad**: sin pedidos aún; precio congelado por línea anticipa
  historial → PASS.
- **VI. Validación y errores**: validación backend + envelope; 400/404/409
  con mensajes claros → PASS.
- **VII. Viabilidad**: cero costo adicional → PASS.

Re-chequeo post-Phase 1: sin cambios que afecten gates.

## Project Structure

### Documentation (this feature)

```text
specs/003-menu-management/
  plan.md
  research.md
  data-model.md
  quickstart.md
  contracts/
  tasks.md             # Phase 2 output (/speckit.tasks command)
```

### Source Code (repository root)

```text
backend/
  src/
    routes/platillos.ts      # GET (sesión) + POST/PATCH (admin)
    routes/menu.ts           # GET (sesión) + POST/PATCH/DELETE (admin)
    controllers/platillos.ts
    controllers/menu.ts
    services/platillos.ts
    services/menu.ts         # fecha Mx, UNIQUE, FK 1451 → 409
  tests/integration/platillos.test.ts
  tests/integration/menu.test.ts

frontend/
  src/
    pages/admin/Platillos.tsx   # catálogo + activo/inactivo
    pages/admin/MenuDia.tsx     # menú por fecha + líneas
    pages/admin/AdminNav.tsx    # navegación Usuarios|Platillos|Menú
    pages/clientes/Menu.tsx     # /menu: tarjetas, especial, no disponible
    lib/menu.ts                 # cliente API + tipos
    App.tsx                     # /admin/* con subrutas
  tests/menu.test.tsx           # estados: carga, vacío, líneas, especial
```

**Structure Decision**: se extiende la estructura del Sprint 1 sin cambios;
`/admin` pasa de página única a layout con subrutas (R7).

## Complexity Tracking

Sin violaciones; nada que justificar.
