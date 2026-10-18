# Tasks: Rediseño UI por Rol (Sprint 6)

**Input**: Design documents from `/specs/007-ui-redesign/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/

**Tests**: Incluidas. TDD en rojo donde haya lógica (badges, persistencia,
filtros, horas); el resto con verificación de render.

**Organization**: Por historia (US1 nav, US2 caja, US3 cliente, US4 cocina,
US5 admin).

## Phase 1: Setup

- [x] T001 Backend: `fechaRecoleccion` en `colaCocina` + assert en
  `cocina.test.ts` (único cambio backend)

---

## Phase 2: Foundational

**CRITICAL**: Bloquea las historias de UI.

- [x] T002 `AppShell` + `Drawer` + `BottomBar` (cliente/caja con badges por
  `misAvisos`/`listosCaja` + sondeo) y migrar las 5 áreas, moviendo Salir al
  drawer (tests de navegación: drawer, bottom bar, badges, logout)
- [x] T003 Persistencia del carrito en `localStorage` con validación de forma
  (test: sobrevive recarga simulada; forma corrupta se descarta)

**Checkpoint**: Navegación y carrito listos

---

## Phase 3: User Story 2 - Caja (Priority: P1)

### Tests (rojo primero)

- [x] T004 [P] [US2] `tests/caja-nueva.test.tsx`: inicio con acciones y
  contador; catálogo filtra por texto/categoría con stepper; flotante con
  total; resumen desglosa y cobra en un paso con ticket; entregas listan con
  Entregar/Cancelar

### Implementation

- [x] T005 [US2] `CapturaContext` + `InicioCaja` + `NuevoPedido` (búsqueda,
  chips, stepper, flotante) (depende de T004)
- [x] T006 [US2] `ResumenCobro` (desglose, nombre, monto, un botón, ticket,
  error) + `Entregas` + subrutas `/caja/*` (depende de T004)

**Checkpoint**: Caja rediseñada extremo a extremo

---

## Phase 4: User Story 3 - Cliente (Priority: P2)

### Tests (rojo primero)

- [x] T007 [P] [US3] `tests/cliente-rediseno.test.tsx`: menú filtra/busca y
  vacío de filtro; checkout muestra hora mínima y error inline; confirmación
  con folio y ambos CTAs; mis pedidos con contador y CTA nuevo

### Implementation

- [x] T008 [US3] Menu (bienvenida, búsqueda, chips) + Checkout (hora mínima
  visible) + Confirmación (folio grande + CTAs) + MisPedidos (contador + CTA)
  (depende de T007)

**Checkpoint**: Cliente rediseñado

---

## Phase 5: User Story 4 - Cocina (Priority: P2)

- [x] T009 [US4] Cocina: header (contador + actualizado), chip de origen,
  registro + recogida, retraso en error, partidas ≥20 px, `Listo` visible sin
  CTA, vacíos/errores/conflicto (extender tests de `operacion.test.tsx`)

## Phase 6: User Story 5 - Admin (Priority: P2)

- [x] T010 [US5] `Inicio` admin (fecha, 3 conteos, resumen con especiales/no
  disponibles) como índice de `/admin/*`; jerarquía y buscadores en secciones
  existentes (tests de landing)

## Phase 7: Polish

- [ ] T011 [P] `typecheck` + `test` + `build` en verde (ambos)
- [ ] T012 quickstart §demo por rol + auditoría 44 px + SC-005 (cero fuera de
  alcance)
- [ ] T013 Marcar Sprint 6 en `docs/sprints.md` solo tras demo aprobada

## Dependencies & Execution Order

- T001 → T002+T003 → US2 (T004→T005+T006) → US3 (T007→T008) → US4 (T009) →
  US5 (T010) → Polish. T005/T006 y US3/US4/US5 en paralelo posible.
