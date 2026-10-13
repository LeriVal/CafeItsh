# Feature Specification: Pedido Anticipado y Pago (Sprint 3)

**Feature Branch**: `004-advance-orders-payment`

**Created**: 2026-10-13

**Status**: Draft

**Input**: User description: "Sprint 3 del roadmap docs/sprints.md — el alumno/docente arma su pedido anticipado desde el menú, lo confirma con al menos 10 minutos de anticipación y lo paga en línea como parte del flujo; el pedido nace Pendiente y pasa a Pagado solo con pago confirmado. Traza a US1 (FR-009…FR-014) de la spec maestra specs/001-pedidos-anticipados-cafeteria/spec.md. No entra listado completo de mis pedidos, mostrador ni cocina."

**Master spec**: [001 — Sistema de Pedidos Anticipados](../001-pedidos-anticipados-cafeteria/spec.md)

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Armar pedido anticipado (Priority: P1)

Cliente elige platillos disponibles del menú del día con cantidades, ve el
total antes de confirmar e indica su hora de recogida con al menos 10 minutos
de anticipación. El sistema congela precios y cantidades al crear el pedido y
le asigna un folio. No se admiten platillos no disponibles ni anticipaciones
menores a 10 minutos.

**Why this priority**: Es el corazón del producto; sin pedido válido no hay
pago ni cocina.

**Independent Test**: Puede probarse armando un pedido válido y verificando
folio, total calculado, detalle congelado y estado Pendiente; más intentos
inválidos (sin anticipación, no disponible, vacío) rechazados con mensajes
claros.

**Acceptance Scenarios**:

1. **Given** un menú con disponibles, **When** el cliente confirma líneas con
   cantidades y recogida con ≥10 min, **Then** el pedido se crea en
   `Pendiente` con folio, total correcto y detalle.
2. **Given** una recogida con menos de 10 minutos, **When** se intenta
   confirmar, **Then** se rechaza con mensaje claro y no se crea el pedido.
3. **Given** una línea no disponible, **When** se intenta incluir, **Then** se
   rechaza (en UI ni siquiera es seleccionable para pedir).
4. **Given** un pedido sin líneas o con cantidades no positivas, **When** se
   confirma, **Then** se rechaza con mensaje claro.

---

### User Story 2 - Pago en línea del pedido (Priority: P1)

Como parte del mismo flujo, el cliente paga su pedido Pendiente mediante el
servicio de pago; solo con pago confirmado el pedido pasa a `Pagado` y queda
registrada la referencia de la transacción (sin datos de tarjeta). Un pago
rechazado deja el pedido en `Pendiente` con mensaje claro y opción de
reintentar sin duplicarlo.

**Why this priority**: Sin pago no hay compromiso de preparación; es la
frontera entre intención y pedido real.

**Independent Test**: Puede probarse pagando un pedido (verificar `Pagado` +
referencia), reintentando un rechazo (sigue `Pendiente`, sin duplicado) e
intentando pagar dos veces (rechazado).

**Acceptance Scenarios**:

1. **Given** un pedido `Pendiente`, **When** el pago se confirma, **Then** el
   pedido pasa a `Pagado` con referencia registrada y confirmación con folio.
2. **Given** un pago rechazado, **When** se informa al cliente, **Then** el
   pedido sigue `Pendiente` y puede reintentarse sin crear otro pedido.
3. **Given** un pedido ya `Pagado`, **When** se intenta pagar de nuevo,
   **Then** se rechaza con mensaje claro.
4. **Given** cualquier intento con datos de tarjeta, **When** llega a la API,
   **Then** se rechaza: el sistema nunca recibe ni guarda datos sensibles.

---

### User Story 3 - Confirmación con folio y estado (Priority: P2)

Tras pagar, el cliente ve la confirmación con folio, detalle, total, hora de
recogida y estado actual de su pedido.

**Why this priority**: Cierra el flujo del sprint con la prueba tangible para
el cliente (y el dato que dará en caja al recoger).

**Independent Test**: Puede probarse completando el flujo y verificando que la
confirmación muestra folio, detalle, total y estado `Pagado`.

**Acceptance Scenarios**:

1. **Given** un pago confirmado, **When** se muestra la confirmación,
   **Then** incluye folio, líneas con cantidades, total, recogida y estado.
2. **Given** la confirmación, **When** el cliente la consulta después,
   **Then** los datos coinciden con lo registrado (precios congelados).

---

### Edge Cases

- ¿Qué ocurre si el platillo se agota entre el armado y la confirmación? La
  confirmación revalida disponibilidad y rechaza el pedido completo con
  mensaje claro (sin pedidos parciales).
- ¿Qué ocurre si el precio cambió entre la consulta y la confirmación? El
  total se calcula con el precio vigente al confirmar; el cliente siempre ve
  el total final antes de pagar.
- ¿Qué ocurre si el pago se interrumpe (cierre, red)? El pedido queda
  `Pendiente` y puede pagarse después sin duplicarse.
- ¿Qué ocurre si dos pagos concurrentes tocan el mismo pedido? Solo uno
  prospera; el otro se rechaza porque el pedido ya no está `Pendiente`.
- ¿Qué ocurre si se intenta saltar a `Listo` o mover un `Cancelado`? Las
  transiciones se validan contra el flujo permitido y se rechazan.
- ¿Qué ocurre si otro cliente intenta ver o pagar mi pedido? Se deniega: cada
  pedido pertenece a su dueño (o al administrador).

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001** (traza a 001/FR-009): El cliente MUST poder armar un pedido con
  líneas de platillos disponibles del menú del día y cantidades positivas, y
  MUST ver el total antes de confirmar.
- **FR-002** (traza a 001/FR-010): El pedido MUST exigir recogida con al menos
  10 minutos de anticipación; con menos MUST rechazarse sin crear el pedido.
- **FR-003** (traza a 001/FR-006): Solo líneas disponibles al momento de
  confirmar MUST aceptarse; lo no disponible MUST rechazarse aunque se haya
  visto antes.
- **FR-004**: Al crear el pedido, el sistema MUST congelar precio unitario,
  cantidades y total, asignar folio único y dejarlo en `Pendiente`.
- **FR-005** (traza a 001/FR-011): El pago en línea MUST formar parte del
  flujo mediante un servicio de pago; el pedido MUST pasar a `Pagado` solo con
  pago confirmado.
- **FR-006** (traza a 001/FR-012): El sistema MUST NOT recibir ni almacenar
  datos de tarjetas; solo MUST registrar la referencia de la transacción.
- **FR-007** (traza a 001/FR-014, 001/FR-015, 001/FR-016): Todo cambio de
  estado MUST validarse contra el flujo permitido; los saltos y movimientos
  sobre estados finales MUST rechazarse.
- **FR-008** (traza a 001/FR-013, 001/FR-017 parcial): Tras pagar, el cliente
  MUST ver confirmación con folio, detalle, total, recogida y estado; cada
  pedido MUST pertenecer a su dueño (visible para él y el administrador).
- **FR-009**: Un pago rechazado MUST dejar el pedido en `Pendiente` sin
  duplicarlo; un segundo pago sobre `Pagado` MUST rechazarse.
- **FR-010** (traza a 001/FR-024, 001/FR-025): Validación en backend y
  mensajes claros sin información interna.
- **FR-011** (alcance): Esta feature MUST NOT incluir listado de mis pedidos,
  mostrador, cocina ni notificaciones.

### Key Entities

- **Pedido anticipado**: solicitud del cliente con folio único, líneas,
  total, hora de recogida (≥10 min), origen anticipado y estado actual.
- **Detalle de pedido**: línea congelada (platillo del menú, cantidad, precio
  unitario y subtotal al confirmar).
- **Pago**: confirmación del cobro con referencia externa (sin datos de
  tarjeta); habilita el paso a `Pagado`.
- **Transición de estado**: cambio validado contra el flujo permitido, con
  historial auditable.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Un cliente completa menú → pedido → pago → confirmación con
  folio sin ayuda, en una sola sesión.
- **SC-002**: El 100 % de los intentos con <10 minutos son rechazados sin
  crear pedidos.
- **SC-003**: El 100 % de los pedidos `Pagado` tiene pago confirmado con
  referencia; ningún `Pendiente` muestra `Pagado` sin pago.
- **SC-004**: El total del pedido coincide con la suma de precios vigentes ×
  cantidades en todos los casos probados.
- **SC-005**: Pagos rechazados y dobles se manejan sin duplicar pedidos ni
  estados inválidos.
- **SC-006**: Intentos inválidos y accesos ajenos se rechazan con mensajes
  claros.

## Assumptions

- El pago del MVP usa un proveedor simulado detrás de una interfaz
  intercambiable (sin dinero real); la estructura admite una pasarela real
  sin cambiar el flujo. La clave `PAYMENT_API_KEY` queda reservada en entorno.
- La moneda es MXN; precios con 2 decimales; el total lo calcula el servidor
  (el del cliente es informativo).
- La anticipación se mide entre la confirmación y la hora de recogida
  indicada, en hora del servidor (zona del plantel).
- El folio anticipado tiene forma `A-AAAAMMDD-NNNN` (secuencia por día).
- Un pedido `Pendiente` sin pago no llega a cocina (cocina entra en sprint 4);
  este sprint lo deja listo en `Pagado`.
- Esta spec no define listado de pedidos, mostrador, cocina ni notificaciones.
