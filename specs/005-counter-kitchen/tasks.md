# Tasks: Mostrador y Cocina (Sprint 4)

**Input**: Design documents from `/specs/005-counter-kitchen/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/

**Tests**: Incluidas. TDD en rojo.

**Organization**: Por historia (US1 caja, US2 cocina, US3 entrega).

## Phase 1: Setup

- [x] T001 Verificar `db:migrate` sin pendientes

---

## Phase 2: Foundational

**CRITICAL**: Bloquea las historias.

- [x] T002 Extender `services/pedidos.ts` con `transicionarPedido(id, nuevo,
  actor)` (flujo por datos + matriz R3 + historial + 403/404/409) y crear
  `services/mostrador.ts` (`crearMostrador`: valida, total servidor, folio M,
  pago efectivo, historial, transaccional) + `services/cocina.ts`
  (`colaCocina`, `listosParaEntrega`)

**Checkpoint**: Servicios sin rutas

---

## Phase 3: User Story 1 - Mostrador (Priority: P1)

### Tests (rojo primero)

- [x] T003 [P] [US1] `tests/integration/mostrador.test.ts`: crear 201
  (`Pagado`, folio M, cambio correcto, pago efectivo), monto insuficiente 400
  sin crear, no disponible 400, cliente (usuario) 403, admin puede crear

### Implementation

- [x] T004 [US1] `controllers/mostrador.ts` + `routes/mostrador.ts`
  (`POST /api/pedidos/mostrador`, cajero/admin) y montar (depende de T003)

**Checkpoint**: Mostrador por API sin interferir anticipados

---

## Phase 4: User Story 2 - Cocina (Priority: P1)

### Tests (rojo primero)

- [x] T005 [P] [US2] `tests/integration/cocina.test.ts`: cola con ambos
  orígenes ordenada por llegada (con folio, espera, líneas), `Pendiente`
  excluido, 403 cliente/cajero; transiciones cocinero OK; cocinero→Entregado
  403; salto 409; cerrado 409
- [x] T006 [P] [US2] `frontend/tests/operacion.test.tsx`: cocina renderiza
  tarjetas con folio/espera/líneas y botones según estado; auto-refresh
  re-consulta (temporizadores simulados)

### Implementation

- [x] T007 [US2] `controllers/cocina.ts` + `controllers/transiciones.ts` +
  `routes/cocina.ts` (`GET /api/cocina/cola`) + `routes/transiciones.ts`
  (`PATCH /api/pedidos/:id/estado`) y montar (depende de T005)
- [x] T008 [US2] `lib/operacion.ts` + `pages/cocina/Cocina.tsx` (tarjetas alto
  contraste, folio grande, espera, botones Iniciar/Marcar listo, sondeo 10 s +
  refresco manual + hora de actualización + aviso de error) y ruta `/cocina`
  (depende de T006)

**Checkpoint**: Cocina opera ambos orígenes

---

## Phase 5: User Story 3 - Caja entrega (Priority: P2)

### Tests (rojo primero)

- [x] T009 [P] [US3] extender `cocina.test.ts` o nuevo bloque: `GET
  /api/caja/listos` solo `Listo`; cajero entrega 200 (sale de activos);
  cancela pre-entrega 200; admin transiciona; cajero→`En preparación` 403

### Implementation

- [x] T010 [US3] `routes/caja.ts` (`GET /api/caja/listos`, cajero/admin) y
  montar (depende de T009)
- [x] T011 [US3] `pages/caja/Caja.tsx` (captura rápida + monto/cambio +
  bloque entrega con Entregar/Cancelar) y ruta `/caja` (depende de T006 para
  patrones; puede ir en paralelo con T008)

**Checkpoint**: Ciclo completo hasta Entregado

---

## Phase 6: Polish

- [x] T012 [P] `npm test` + `typecheck` en verde (ambos)
- [x] T013 Ejecutar `quickstart.md` §3 (demo SC-001…SC-005)
- [x] T014 Auto-revisión: simultaneidad, folios únicos, historial completo,
  mensajes claros, sin `Pendiente` en cocina
- [x] T015 Marcar Sprint 4 en `docs/sprints.md` solo tras demo aprobada

## Dependencies & Execution Order

- T001 → T002 → US1 (T003→T004) → US2 (T005+T006→T007+T008) → US3
  (T009→T010+T011) → Polish. T008/T011 en paralelo posible.
