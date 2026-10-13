# Feature Specification: Mostrador y Cocina (Sprint 4)

**Feature Branch**: `005-counter-kitchen`

**Created**: 2026-10-13

**Status**: Draft

**Input**: User description: "Sprint 4 del roadmap docs/sprints.md — el cajero captura pedidos presenciales con cobro sin interferir con los anticipados, y cocina ve ambos orígenes en una pantalla que se actualiza sola, avanzando estados hasta Listo; caja marca Entregado/Cancelado. Traza a US4+US3 (FR-015, FR-016, FR-018…FR-022) de la spec maestra specs/001-pedidos-anticipados-cafeteria/spec.md. No entra notificaciones ni mis pedidos."

**Master spec**: [001 — Sistema de Pedidos Anticipados](../001-pedidos-anticipados-cafeteria/spec.md)

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Captura de mostrador con cobro (Priority: P1)

El cajero captura un pedido presencial eligiendo platillos disponibles con
cantidades, ve el total, registra el monto recibido y el cambio, y lo confirma
en el mínimo de pasos. El pedido nace directamente `Pagado` (cobro en el
acto) con folio de mostrador y queda visible para cocina. Los anticipados
siguen fluyendo sin interferencia.

**Why this priority**: Es la restricción fundacional (no interrumpir el
mostrador) convertida en flujo digital.

**Independent Test**: Puede probarse capturando un pedido con cobro y
verificando folio, `Pagado`, pago en efectivo registrado, cambio calculado y
visibilidad en cocina mientras un anticipado sigue su curso.

**Acceptance Scenarios**:

1. **Given** sesión de cajero, **When** captura líneas disponibles con
   cantidades e indica monto recibido, **Then** el pedido se crea `Pagado`
   con folio, total y cambio calculado.
2. **Given** un monto recibido menor al total, **When** se intenta confirmar,
   **Then** se rechaza con mensaje claro sin crear el pedido.
3. **Given** pedidos anticipados en curso, **When** se captura en mostrador,
   **Then** ambos operan simultáneamente sin bloquearse.

---

### User Story 2 - Pantalla de cocina (Priority: P1)

El cocinero ve en una sola pantalla los pedidos por preparar (anticipados
`Pagado` y mostrador, ambos orígenes), ordenados por llegada, con folio
grande, tiempo de espera, productos y cantidades. La lista se actualiza sin
recarga manual. Con un toque avanza cada pedido a `En preparación` y luego a
`Listo`.

**Why this priority**: Sin esta pantalla los pedidos `Pagado` nunca se
preparan; es el cuello de botella del receso.

**Independent Test**: Puede probarse registrando pedidos de ambos orígenes y
verificando que aparecen ordenados con su contenido, que la lista se refresca
sola y que los botones avanzan los estados.

**Acceptance Scenarios**:

1. **Given** pedidos `Pagado` anticipados y de mostrador, **When** el cocinero
   abre su pantalla, **Then** ve ambos en una sola lista ordenada por llegada
   con folio, espera, productos y cantidades.
2. **Given** un pedido `Pagado`, **When** el cocinero lo toma, **Then** puede
   pasarlo a `En preparación`.
3. **Given** un pedido `En preparación`, **When** termina, **Then** puede
   marcarlo `Listo`.
4. **Given** la pantalla abierta, **When** llega un pedido nuevo, **Then**
   aparece sin recarga manual.

---

### User Story 3 - Entrega y cancelación en caja (Priority: P2)

El cajero ve los pedidos `Listo` y los marca `Entregado` al recoger, o
`Cancelado` cuando corresponde (antes de la entrega). Las transiciones
inválidas (saltos, mover cerrados, roles sin permiso) se rechazan.

**Why this priority**: Cierra el ciclo operativo; sin entrega registrada los
pedidos quedan colgados en `Listo`.

**Independent Test**: Puede probarse llevando un pedido a `Listo` y
verificándolo entregado, más intentos inválidos rechazados (cocinero
intentando entregar, mover un `Entregado`, saltar estados).

**Acceptance Scenarios**:

1. **Given** un pedido `Listo`, **When** el cajero lo entrega, **Then** pasa a
   `Entregado` y sale de las pantallas activas.
2. **Given** un pedido no entregado, **When** se cancela con permiso,
   **Then** pasa a `Cancelado` y ya no admite cambios.
3. **Given** un cocinero, **When** intenta marcar `Entregado`, **Then** se
   deniega por rol.
4. **Given** un pedido `Entregado` o `Cancelado`, **When** se intenta mover,
   **Then** se rechaza.

---

### Edge Cases

- ¿Qué ocurre si una línea se agota entre la captura y la confirmación en
  caja? Se revalida al confirmar y se rechaza con mensaje claro.
- ¿Qué ocurre si dos cajeros capturan a la vez? Los folios son únicos por
  secuencia con reintento; ningún pedido se pierde ni duplica.
- ¿Qué ocurre si cocina y caja actúan sobre el mismo pedido a la vez? Solo
  prospera la transición válida desde el estado real; la otra se rechaza.
- ¿Qué ocurre si se cae la red en cocina? La pantalla muestra su última
  actualización con la hora y reintenta sola al volver la conexión.
- ¿Qué ocurre con pedidos `Pendiente` (sin pagar)? Cocina no los ve: solo
  `Pagado` y `En preparación` entran a preparación.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001** (traza a 001/FR-018): El cajero MUST poder capturar pedidos
  presenciales con líneas disponibles y cantidades en el mínimo de pasos.
- **FR-002**: Al confirmar con cobro suficiente, el pedido de mostrador MUST
  nacer `Pagado` con folio de mostrador, total servidor y pago en efectivo
  registrado; el cambio MUST calcularse y mostrarse (sin persistir datos
  sensibles, que no existen en efectivo).
- **FR-003** (traza a 001/FR-019): Mostrador y anticipados MUST operar
  simultáneamente sin bloquearse.
- **FR-004** (traza a 001/FR-020, 001/FR-021): Cocina MUST mostrar en una
  sola pantalla los pedidos `Pagado` y `En preparación` de ambos orígenes,
  ordenados por llegada, con folio, espera, productos y cantidades, y MUST
  actualizarse sin recarga manual.
- **FR-005** (traza a 001/FR-022): El cocinero MUST poder avanzar a
  `En preparación` y a `Listo`, y NADA más.
- **FR-006**: El cajero MUST poder marcar `Entregado` (desde `Listo`) y
  `Cancelado` (antes de la entrega); el administrador MUST poder cualquier
  transición válida.
- **FR-007** (traza a 001/FR-015, 001/FR-016): Toda transición MUST validarse
  contra el flujo y el permiso del rol; saltos, finales y roles sin permiso
  MUST rechazarse con mensajes claros.
- **FR-008**: Los pedidos `Pendiente` NUNCA MUST aparecer en cocina; los
  `Entregado`/`Cancelado` MUST salir de las pantallas activas.
- **FR-009** (alcance): Esta feature MUST NOT incluir notificaciones ni
  listado de mis pedidos.

### Key Entities

- **Pedido de mostrador**: pedido presencial con folio `M-…`, cobro en
  efectivo al crear, nombre de cliente opcional y creador cajero.
- **Cola de cocina**: pedidos `Pagado` y `En preparación` de ambos orígenes
  ordenados por llegada, con espera calculada.
- **Transición con permiso**: cambio de estado validado contra flujo + matriz
  de roles (cocinero: preparar/listo; cajero: entregar/cancelar; admin: todo
  lo válido).

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Un cajero captura y cobra un pedido presencial en el mínimo de
  pasos sin ayuda.
- **SC-002**: Cocina muestra ambos orígenes ordenados por llegada y se
  actualiza sin recarga manual.
- **SC-003**: Un pedido recorre `Pagado → En preparación → Listo →
  Entregado` con el rol correcto en cada paso.
- **SC-004**: Anticipados y mostrador operan a la vez sin interferirse.
- **SC-005**: Transiciones inválidas y roles sin permiso se rechazan con
  mensajes claros.

## Assumptions

- El pedido de mostrador cobra el total exacto o con cambio en efectivo al
  momento; no hay crédito ni pago posterior en mostrador.
- El nombre del cliente en mostrador es opcional (agiliza la fila); el folio
  identifica la entrega.
- La actualización "en vivo" de cocina es sondeo cada 10 s (configurable) +
  botón de refresco; sin websockets en el MVP.
- La cancelación no gestiona reembolsos en este sprint (efectivo: devolución
  manual en caja; anticipados: según política del medio de pago en sprint 5).
- `Pendiente` no cocina; `Entregado`/`Cancelado` salen de pantallas activas.
