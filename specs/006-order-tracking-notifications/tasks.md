# Tasks: Seguimiento y Notificaciones (Sprint 5)

**Input**: Design documents from `/specs/006-order-tracking-notifications/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/

**Tests**: Incluidas. TDD en rojo.

**Organization**: Por historia (US1 seguimiento, US2 avisos, US3 pulido/demo).

## Phase 1: Setup

- [x] T001 Crear `migrations/004_avisos_leida.sql` y correr `db:migrate`;
  verificar columna `leida` e índice

---

## Phase 2: Foundational

**CRITICAL**: Bloquea las historias.

- [x] T002 Crear `services/notificaciones.ts` (interfaz `ProveedorAviso`,
  `AvisoEnApp`, `crearAvisoListo`, `listarAvisos`, `marcarLeida` con
  dueño-scoped) y extender `transicionarPedido` con disparo post-commit solo
  a `Listo` en try/catch (nunca revierte)

**Checkpoint**: Avisos sin rutas

---

## Phase 3: User Story 1 - Mis pedidos (Priority: P1)

### Tests (rojo primero)

- [x] T003 [P] [US1] `tests/integration/avisos.test.ts` (sección pedidos):
  `GET /api/pedidos/mios` lista solo propios recientes-primero con detalle;
  otro cliente no los ve; `/mios` no colisiona con `/:id`

### Implementation

- [x] T004 [US1] `GET /api/pedidos/mios` en `routes/pedidos.ts` (ANTES de
  `/:id`, usuario/admin) + servicio `listarMisPedidos` (depende de T003)

**Checkpoint**: Lista por API

---

## Phase 4: User Story 2 - Avisos (Priority: P1)

### Tests (rojo primero)

- [x] T005 [P] [US2] extender `avisos.test.ts`: llegar a `Listo` genera un
  aviso; otros estados no; `GET /api/avisos` no leídos primero; marcar visto
  propio 200; ajeno 404; fallo simulado del proveedor no impide `Listo`
- [x] T006 [P] [US2] `frontend/tests/seguimiento.test.tsx` (mock): lista con
  badges, detalle desplegable, banner de aviso + marcar visto, mensaje sin
  pedidos

### Implementation

- [x] T007 [US2] `routes/avisos.ts` (`GET /`, `PATCH /:id/leida`,
  usuario/admin) y montar en `app.ts` (depende de T005)
- [x] T008 [US2] `lib/seguimiento.ts` + `pages/clientes/MisPedidos.tsx`
  (lista, detalle, badges, banner de avisos, marcar visto, sondeo 10 s,
  vacía con mensaje) y ruta `/mis-pedidos` (depende de T006)

**Checkpoint**: Aviso visible y marcable

---

## Phase 5: User Story 3 - Pulido y demo (Priority: P2)

- [x] T009 [P] [US3] Tokens `status-*` en `@theme` + `StatusBadge.tsx`;
  usarlo en MisPedidos, Cocina y Confirmación (reemplaza textos planos de
  estado)
- [x] T010 Verificar `typecheck` + `test` + `build` en verde (ambos)
- [x] T011 Ejecutar `quickstart.md` §3: demo completa SC-001…SC-005 y conteo
  `Listo` = avisos en BD
- [x] T012 Marcar Sprint 5 y MVP como completados en `docs/sprints.md` solo
  tras demo aprobada por la patrocinadora

## Dependencies & Execution Order

- T001 → T002 → US1 (T003→T004) → US2 (T005+T006→T007+T008) → US3
  (T009→T010→T011→T012).
