# Tasks: Gestión y Consulta de Menú (Sprint 2)

**Input**: Design documents from `/specs/003-menu-management/` (plan.md,
spec.md, research.md, data-model.md, contracts/, quickstart.md)

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/

**Tests**: Incluidas (lógica de negocio: precios, disponibilidad, permisos).
TDD: tests primero en rojo.

**Organization**: Por historia (US1 catálogo, US2 publicación, US3 consulta).

## Format: `[ID] [P?] [Story] Description`

## Phase 1: Setup (Shared Infrastructure)

- [x] T001 Verificar `npm run db:migrate` sin pendientes y menú de ejemplo de
  hoy presente (seed 002); si falta, documentar causa (R1)

---

## Phase 2: Foundational (Blocking Prerequisites)

**CRITICAL**: Bloquea todas las historias.

- [x] T002 Crear `backend/src/services/platillos.ts` (listar con filtro
  activos, crear, actualizar incl. `activo`; sin DELETE) + validaciones en
  `utils/validate.ts` (nombre ≤100, categoría ≤50)
- [x] T003 Crear `backend/src/services/menu.ts` (`hoyMx()` con
  America/Mexico_City, `parseFecha`, CRUD de líneas, UNIQUE→409,
  platillo inactivo→400, FK 1451→409 REFERENCIADO)

**Checkpoint**: Servicios listos (sin rutas aún)

---

## Phase 3: User Story 1 - Catálogo de platillos (Priority: P1)

**Goal**: Admin crea/edita/desactiva platillos; otros roles denegados.

**Independent Test**: CRUD + toggle activo + 403 sin rol (SC-005 parcial).

### Tests (primero, en rojo)

- [x] T004 [P] [US1] `backend/tests/integration/platillos.test.ts`: crear 201,
  editar 200, desactivar y verificar exclusión con `?activos=true`, 400 nombre
  vacío, 403 cliente, 401 sin token, 404 inexistente

### Implementation

- [x] T005 [US1] `controllers/platillos.ts` + `routes/platillos.ts`
  (`GET` con sesión, `POST/PATCH` con admin) y montar en `app.ts`
  (depende de T004)
- [x] T006 [US1] `frontend/src/pages/admin/Platillos.tsx`: tabla + crear +
  editar + activar/desactivar con mensajes de error en línea (depende de T005)

**Checkpoint**: US1 cerrada de extremo a extremo

---

## Phase 4: User Story 2 - Publicación del menú (Priority: P1)

**Goal**: Admin arma el menú por fecha con precio/especial/disponibilidad y se
refleja de inmediato.

**Independent Test**: armar hoy + cambiar precio/disponibilidad + duplicado
rechazado (SC-001, SC-002, SC-005).

### Tests (primero, en rojo)

- [x] T007 [P] [US2] `backend/tests/integration/menu.test.ts`: publicar línea
  201, reflejo en GET, PATCH precio/disponibilidad, duplicado 409, precio 0 →
  400, platillo inactivo → 400, DELETE 204 + 404, fecha inválida 400, 403
  cliente en mutación

### Implementation

- [x] T008 [US2] `controllers/menu.ts` + `routes/menu.ts` y montar en `app.ts`
  (depende de T007)
- [x] T009 [US2] `frontend/src/pages/admin/MenuDia.tsx`: selector de fecha
  (hoy por defecto), agregar línea (solo platillos activos), edición en línea
  de precio/disponibilidad/especial, quitar línea (depende de T008)
- [x] T010 [US2] `frontend/src/pages/admin/AdminNav.tsx` + subrutas en
  `App.tsx` (`/admin/usuarios`, `/admin/platillos`, `/admin/menu`;
  `/admin` → `/admin/platillos`) (R7)

**Checkpoint**: US2 cerrada; lo publicado es visible vía API

---

## Phase 5: User Story 3 - Consulta del menú (Priority: P2)

**Goal**: Cliente ve el menú de hoy rápido, con especiales, no disponibles y
mensaje de día sin menú.

**Independent Test**: render de estados + consulta real (SC-003, SC-004).

### Tests (primero, en rojo)

- [x] T011 [P] [US3] `frontend/tests/menu.test.tsx` (fetch simulado): estado
  de carga, día sin líneas (mensaje claro), líneas con precio, distintivo de
  especial y no disponible no seleccionable

### Implementation

- [x] T012 [US3] `frontend/src/lib/menu.ts` (tipos + `fetchMenu(fecha?)`) +
  `frontend/src/pages/clientes/Menu.tsx` (tarjetas móvil-first, badge
  especial, estilo no disponible, mensaje sin menú) y ruta `/menu` a la nueva
  página (depende de T011)

**Checkpoint**: US3 cerrada; `/menu` muestra el menú real del día

---

## Phase 6: Polish & Cross-Cutting Concerns

- [x] T013 [P] `npm test` + `typecheck` en verde (backend y frontend)
- [x] T014 Ejecutar `quickstart.md` §3 completo (incl. demo manual SC-001…005)
  y corregir desvíos
- [x] T015 Auto-revisión: sin secretos, respuestas sin columnas internas,
  mensajes claros, `price` serializado consistente (string NUMERIC de mysql2)
- [x] T016 Marcar Sprint 2 como completado en `docs/sprints.md` solo tras demo
  aprobada

---

## Dependencies & Execution Order

- T001 → T002+T003 (paralelo) → US1 (T004→T005→T006) → US2
  (T007→T008→T009+T010) → US3 (T011→T012) → Polish.
- US1 y US2-backend podrían paralelizarse (archivos distintos) si hay
  capacidad; se recomienda secuencia por claridad.
- T009/T010 en paralelo; T013/T015 en paralelo.

## Implementation Strategy

Foundation (servicios) → US1 → US2 → US3 → Polish → **demo** (criterios Sprint 2
en `docs/sprints.md`) → marcar completado.
