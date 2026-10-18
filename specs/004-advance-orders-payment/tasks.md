# Tasks: Pedido Anticipado y Pago (Sprint 3)

**Input**: Design documents from `/specs/004-advance-orders-payment/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/

**Tests**: Incluidas (totales, anticipación, pagos, permisos). TDD en rojo.

**Organization**: Por historia (US1 armado, US2 pago, US3 confirmación).

## Phase 1: Setup

- [x] T001 Verificar `db:migrate` sin pendientes y estados/transiciones
  sembrados (`SELECT` a `estado_pedido`/`transicion_estado`)

---

## Phase 2: Foundational

**CRITICAL**: Bloquea las historias.

- [x] T002 Crear `backend/src/services/pedidos.ts`: `hoyMx` reutilizable,
  `cambiarEstado` (valida `transicion_estado`, rechaza terminales y saltos,
  escribe historial), folio `A-AAAAMMDD-NNNN` con reintento, transacción con
  `FOR UPDATE`
- [x] T003 Crear `backend/src/services/pagos.ts`: interfaz `ProveedorPago`,
  `SimuladorPago` (referencia `SIM-…`), `pagarPedido` (solo desde
  `Pendiente`, inserta `pago`, cambia a `Pagado`, todo transaccional;
  `simularRechazo` solo para tests, sin exponer en API)

**Checkpoint**: Servicios sin rutas

---

## Phase 3: User Story 1 - Armar pedido (Priority: P1)

**Goal**: Crear anticipado válido con folio/total/detalle; rechazos claros.

### Tests (rojo primero)

- [x] T004 [P] [US1] `backend/tests/integration/pedidos.test.ts`: crear 201
  (folio, total = suma precios×cant, congelados, `Pendiente`), <10 min 400
  sin crear, no disponible 400, vacío/cantidad inválida 400, otro cliente
  403/404 en GET, saltos de estado rechazados (vía `cambiarEstado`)

### Implementation

- [x] T005 [US1] `controllers/pedidos.ts` (rechazo 400 `CARD_DATA_FORBIDDEN`
  ante campos de tarjeta) + `routes/pedidos.ts` (`POST /`, `GET /:id` con
  dueño o admin) y montar en `app.ts` (depende de T004)

**Checkpoint**: Pedidos `Pendiente` creables por API

---

## Phase 4: User Story 2 - Pago en línea (Priority: P1)

**Goal**: `Pendiente` → `Pagado` solo con cobro confirmado; rechazos sin
duplicar; doble pago imposible.

### Tests (rojo primero)

- [x] T006 [P] [US2] extender `pedidos.test.ts`: pagar 200 (`Pagado` +
  referencia, fila `pago`), rechazo simulado (sigue `Pendiente`, reintento
  posterior OK sin duplicado), segundo pago 409, campos de tarjeta 400

### Implementation

- [x] T007 [US2] `POST /:id/pagar` en controller + ruta (dueño o admin),
  `PAYMENT_API_KEY` reservada en `.env.example` (depende de T006)

**Checkpoint**: Flujo dinero (simulado) cerrado

---

## Phase 5: User Story 3 - Carrito, checkout y confirmación (Priority: P2)

**Goal**: Cliente completa el flujo en móvil: menú → checkout → confirmación.

### Tests (rojo primero)

- [x] T008 [P] [US3] `frontend/tests/carrito.test.tsx` (fetch simulado):
  agregar/quitar con total informativo, no disponible sin control, checkout
  exige recogida ≥10 min (mensaje), confirmación muestra folio/estado/total

### Implementation

- [x] T009 [US3] `lib/carrito.tsx` (CartContext) + steppers y barra en
  `pages/clientes/Menu.tsx` (solo disponibles) (depende de T008)
- [x] T010 [US3] `pages/clientes/Checkout.tsx` (`/pedido/nuevo`: recogida
  `datetime-local` con mínimo +10 min, resumen, pagar, manejo de
  rechazo/reintento) (depende de T008)
- [x] T011 [US3] `pages/clientes/Confirmacion.tsx` (`/pedido/:id`: folio,
  detalle, total, recogida, estado) + rutas en `App.tsx` (depende de T008)

**Checkpoint**: Flujo completo visible

---

## Phase 6: Polish

- [x] T012 [P] `npm test` + `typecheck` en verde (ambos)
- [x] T013 Ejecutar `quickstart.md` §3 (demo manual SC-001…SC-006)
- [x] T014 Auto-revisión: totales servidor, sin tarjetas en logs/respuestas,
  folio único, historial de estados, mensajes claros
- [x] T015 Marcar Sprint 3 en `docs/sprints.md` solo tras demo aprobada

## Dependencies & Execution Order

- T001 → T002+T003 (paralelo) → US1 (T004→T005) → US2 (T006→T007) → US3
  (T008→T009+T010+T011) → Polish. T009/T010/T011 en paralelo tras T008.
