# Implementation Plan: Mostrador y Cocina (Sprint 4)

**Branch**: `005-counter-kitchen` | **Date**: 2026-10-13 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `/specs/005-counter-kitchen/spec.md`
(trazable a US4+US3, FR-015, FR-016, FR-018…FR-022 de la spec maestra
`../001-pedidos-anticipados-cafeteria/spec.md`).

**Note**: Diseño en `research.md`, `data-model.md`, `contracts/` y
`quickstart.md`; implementación en `tasks.md`.

## Summary

Cajero captura mostrador con cobro (nace `Pagado`, folio `M-…`) y entrega/
cancela; cocina ve ambos orígenes ordenados por llegada con auto-refresh y
avanza a `En preparación`/`Listo`. Enfoque: sin migraciones, mostrador
transaccional, matriz de permisos centralizada en `transicionarPedido`, cola
por llegada, sondeo 10 s, caja en una página con dos bloques, cambio no
persistido.

## Technical Context

**Language/Version**: TypeScript 5.x estricto, Node.js 20 LTS.

**Primary Dependencies**: acumuladas; sin dependencias nuevas.

**Storage**: MySQL 8.0 existente; transacciones con `FOR UPDATE`; folio con
reintento; historial en cada transición.

**Testing**: Vitest + `tsc --noEmit` en ambos lados.

**Target Platform**: web responsiva; cocina y caja legibles en móvil y
pantalla fija, alto contraste, táctil ≥44px.

**Project Type**: web application (frontend + backend).

**Performance Goals**: captura en el mínimo de pasos; cola legible con
decenas de pedidos; sondeo ligero cada 10 s.

**Constraints**: solo disponibles al confirmar; monto ≥ total; matriz R3;
`Pendiente` no cocina; cerrados fuera.

**Scale/Scope**: operación de un receso; sin notificaciones ni mis pedidos.

## Constitution Check

- **I. Alcance**: solo US4+US3 (FR-001…FR-009 de la spec); notificaciones y
  listas fuera → PASS.
- **II. Seguridad**: cajero/cocinero/admin por puerta; dueño no toca
  mostrador/cocina; validación backend → PASS.
- **III. Simplicidad**: un servicio extendido (`mostrador`) + uno nuevo
  (`cocina` lectura) + `transicionarPedido`; sondeo en vez de sockets → PASS.
- **IV. Rapidez**: captura mínima, tarjetas de alto contraste, 44px → PASS.
- **V. Trazabilidad**: folios M, historial en cada paso, espera visible → PASS.
- **VI. Validación y errores**: revalidación al confirmar, 400/403/404/409
  claros → PASS.
- **VII. Viabilidad**: cero costo → PASS.

Re-chequeo post-Phase 1: sin cambios que afecten gates.

## Project Structure

### Documentation (this feature)

```text
specs/005-counter-kitchen/
  plan.md  research.md  data-model.md  quickstart.md  contracts/  tasks.md
```

### Source Code (repository root)

```text
backend/
  src/
    services/mostrador.ts    # crearMostrador transaccional + folio M
    services/cocina.ts       # cola y listos (lectura)
    services/pedidos.ts      # + transicionarPedido (flujo + matriz R3)
    controllers/mostrador.ts | cocina.ts | transiciones.ts
    routes/mostrador.ts      # POST /api/pedidos/mostrador
    routes/cocina.ts         # GET /api/cocina/cola
    routes/caja.ts           # GET /api/caja/listos
    routes/transiciones.ts   # PATCH /api/pedidos/:id/estado
  tests/integration/mostrador.test.ts
  tests/integration/cocina.test.ts

frontend/
  src/
    pages/caja/Caja.tsx      # captura + entrega
    pages/cocina/Cocina.tsx  # KDS con sondeo 10 s
    lib/operacion.ts         # tipos + llamadas
  tests/operacion.test.tsx   # caja y cocina (mock)
```

**Structure Decision**: se extiende la estructura existente; rutas de lectura
agrupadas por rol (`/api/cocina`, `/api/caja`).

## Complexity Tracking

Sin violaciones; nada que justificar.
