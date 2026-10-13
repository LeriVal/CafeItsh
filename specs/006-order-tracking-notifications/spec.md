# Feature Specification: Seguimiento y Notificaciones (Sprint 5)

**Feature Branch**: `006-order-tracking-notifications`

**Created**: 2026-10-13

**Status**: Draft

**Input**: User description: "Sprint 5 del roadmap docs/sprints.md — el cliente ve sus pedidos con estado y detalle, recibe el aviso cuando pasan a Listo (módulo separado de pedidos), y se cierra el MVP con pulido de UI y demo completa. Traza a US2 (FR-017, FR-023…FR-029) de la spec maestra specs/001-pedidos-anticipados-cafeteria/spec.md. No entra nada fuera del MVP."

**Master spec**: [001 — Sistema de Pedidos Anticipados](../001-pedidos-anticipados-cafeteria/spec.md)

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Mis pedidos con estado y detalle (Priority: P1)

El cliente abre `/mis-pedidos` y ve su lista con folio, estado actual, total
y hora de recogida, pudiendo desplegar el detalle (líneas, cantidades,
subtotales). La lista se actualiza sola. Solo ve sus propios pedidos.

**Why this priority**: Es la pantalla que elimina las filas para preguntar
"¿ya está mi pedido?".

**Independent Test**: Puede probarse con pedidos en varios estados
verificando lista, detalle desplegable, actualización y aislamiento entre
clientes.

**Acceptance Scenarios**:

1. **Given** un cliente con pedidos, **When** abre su lista, **Then** ve cada
   uno con folio, estado, total y recogida.
2. **Given** la lista, **When** despliega un pedido, **Then** ve líneas,
   cantidades y subtotales.
3. **Given** un cambio de estado, **When** vuelve la vista, **Then** se
   refleja sin recarga manual.
4. **Given** otro cliente, **When** consulta, **Then** no ve pedidos ajenos.

---

### User Story 2 - Aviso de pedido listo (Priority: P1)

Cuando un pedido pasa a `Listo` se genera un aviso separado de la lógica de
pedidos; el cliente lo ve destacado en su vista y puede marcarlo como visto.
El 100 % de los pedidos que llegan a `Listo` genera su aviso, sin impedir ni
retrasar el cambio de estado si el aviso falla.

**Why this priority**: Es el cierre del ciclo anticipado y el compromiso
medible del proyecto.

**Independent Test**: Puede probarse llevando pedidos a `Listo` y
verificando aviso generado, visible y marcable, más que un fallo del aviso no
rompe la transición.

**Acceptance Scenarios**:

1. **Given** un pedido que pasa a `Listo`, **When** se completa la
   transición, **Then** existe un aviso para su dueño.
2. **Given** avisos sin ver, **When** el cliente abre su vista, **Then** los
   ve destacados y puede marcarlos como vistos.
3. **Given** otros estados, **When** cambian, **Then** no generan aviso.
4. **Given** un fallo al generar el aviso, **When** ocurre, **Then** la
   transición a `Listo` ya quedó registrada.

---

### User Story 3 - Pulido y demo final (Priority: P2)

La UI usa los tokens de diseño (colores de estado, tipografía, táctil ≥44px)
de forma consistente, las pruebas críticas (pagos, estados, permisos) están
en verde y el flujo completo es demostrable de principio a fin ante la
patrocinadora.

**Why this priority**: Es la aceptación formal del MVP.

**Independent Test**: Recorrido completo menú → pedido → pago → cocina →
listo → aviso → recogida/entrega más suites en verde.

**Acceptance Scenarios**:

1. **Given** el flujo completo, **When** se recorre, **Then** cada paso
   muestra estados con el lenguaje visual del diseño.
2. **Given** las suites, **When** corren, **Then** backend y frontend están en
   verde incluyendo pagos, estados y permisos.

---

### Edge Cases

- ¿Qué ocurre si el cliente abre su lista sin pedidos? Mensaje claro en lugar
  de lista vacía.
- ¿Qué ocurre si un pedido llega a `Listo` dos veces (reintento)? Un solo
  aviso: la transición es idempotente por estado (el segundo cambio se
  rechaza).
- ¿Qué ocurre si se marca visto un aviso ajeno? Se deniega sin distinguir.
- ¿Qué ocurre si la vista se abre sin conexión? Muestra lo último conocido
  con aviso de error y reintenta sola.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001** (traza a 001/FR-017): El cliente MUST ver su lista de pedidos
  con folio, estado, total y recogida, y MUST poder desplegar el detalle.
- **FR-002**: La lista MUST actualizarse sin recarga manual y MUST mostrar
  mensaje claro si no hay pedidos.
- **FR-003** (traza a 001/FR-023): Al pasar a `Listo`, el sistema MUST
  generar un aviso para el dueño desde un módulo separado de la lógica de
  pedidos; el aviso NUNCA MUST bloquear ni revertir la transición.
- **FR-004**: El cliente MUST ver sus avisos sin ver destacados y MUST poder
  marcarlos como vistos; otros estados NUNCA MUST generar avisos.
- **FR-005**: Cada pedido y aviso MUST pertenecer a su dueño (o al
  administrador); lo ajeno MUST denegarse sin distinguir.
- **FR-006** (pulido): Los estados MUST mostrarse con los colores y
  tipografía de `docs/DESIGN.md` de forma consistente; las pantallas MUST
  mantener táctil ≥44px y alto contraste.
- **FR-007** (alcance): Esta feature MUST NOT incluir nada fuera del MVP
  (reseñas, lealtad, inventario, app nativa).

### Key Entities

- **Aviso**: generado al llegar a `Listo`, con pedido, tipo, canal, estado de
  envío y marca de visto; vive en módulo propio.
- **Vista de seguimiento**: lista del cliente con pedidos, estados, detalle
  desplegable y avisos destacados.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: El 100 % de los pedidos que llegan a `Listo` genera su aviso.
- **SC-002**: Un cliente consulta estado y detalle de sus pedidos sin ayuda.
- **SC-003**: Flujo completo demostrable: menú → pedido → pago → cocina →
  listo → aviso → recogida/entrega.
- **SC-004**: Suites de pagos, estados y permisos en verde (Vitest, ambos
  lados).
- **SC-005**: Estados con lenguaje visual consistente y táctil ≥44px.

## Assumptions

- El aviso del MVP es en-app (bandeja en la vista de seguimiento) sobre un
  proveedor intercambiable; el canal externo queda como mejora sin cambiar el
  flujo.
- La marca de visto exige una columna nueva (`leida`) vía migración 004.
- El sondeo de seguimiento es cada 10 s como cocina; suficiente para el MVP.
- La demo final usa datos de ejemplo y las cuentas operativas existentes.
