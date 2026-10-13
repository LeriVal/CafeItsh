# Feature Specification: Gestión y Consulta de Menú (Sprint 2)

**Feature Branch**: `003-menu-management`

**Created**: 2026-10-13

**Status**: Draft

**Input**: User description: "Sprint 2 del roadmap docs/sprints.md — el administrador publica el menú del día (platillos, especiales, precios, disponibilidad) y los alumnos/docentes lo consultan. Traza a US5 y a la parte de consulta de US1 (FR-004…FR-008) de la spec maestra specs/001-pedidos-anticipados-cafeteria/spec.md. No entra pedidos, carrito ni pagos."

**Master spec**: [001 — Sistema de Pedidos Anticipados](../001-pedidos-anticipados-cafeteria/spec.md)

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Administración del catálogo de platillos (Priority: P1)

El administrador crea platillos con nombre, descripción y categoría, los edita
y los desactiva en lugar de eliminarlos (para preservar el historial). Solo los
platillos activos pueden agregarse al menú del día.

**Why this priority**: Sin catálogo no hay menú; es la base de todo lo que
sigue (pedidos en sprint 3).

**Independent Test**: Puede probarse creando, editando y desactivando un
platillo y verificando que el desactivado ya no aparece como agregable al menú
pero su historial se conserva.

**Acceptance Scenarios**:

1. **Given** sesión de administrador, **When** crea un platillo con nombre y
   categoría, **Then** queda disponible para agregarse al menú del día.
2. **Given** un platillo existente, **When** el administrador lo desactiva,
   **Then** ya no puede agregarse a menús nuevos pero su información histórica
   se conserva.
3. **Given** un usuario sin rol de administrador, **When** intenta gestionar
   platillos, **Then** el acceso se deniega con mensaje claro.

---

### User Story 2 - Publicación del menú del día (Priority: P1)

El administrador arma el menú de una fecha (por defecto hoy) agregando
platillos activos con precio, marcando disponibilidad y destacando especiales
del día; puede modificar precios y disponibilidad y quitar líneas. Los cambios
se reflejan de inmediato para los clientes.

**Why this priority**: Es el compromiso visible con la cafetería: lo que se
publica es lo que se vende.

**Independent Test**: Puede probarse armando el menú de hoy, cambiando un
precio y la disponibilidad, y verificando cada cambio en la vista de cliente
sin esperas ni recargas especiales.

**Acceptance Scenarios**:

1. **Given** sesión de administrador, **When** agrega un platillo activo al
   menú de hoy con precio, **Then** los clientes lo ven de inmediato con ese
   precio.
2. **Given** una línea del menú, **When** se cambia su precio o disponibilidad,
   **Then** la vista de cliente muestra el cambio de inmediato.
3. **Given** una línea marcada como especial del día, **When** un cliente
   consulta el menú, **Then** la ve destacada como especial.
4. **Given** un platillo desactivado, **When** se intenta agregar al menú,
   **Then** el sistema lo rechaza con mensaje claro.

---

### User Story 3 - Consulta del menú (Priority: P2)

Alumno o docente consulta el menú del día con platillos, precios,
disponibilidad y especiales, de forma rápida incluso en horario de receso y
desde el móvil. Los platillos no disponibles aparecen identificados como tales
y no se pueden seleccionar. Si no hay menú publicado, se muestra un mensaje
claro en lugar de datos vacíos.

**Why this priority**: Es la pantalla más visitada del sistema y la antesala
del pedido (sprint 3).

**Independent Test**: Puede probarse abriendo el menú como cliente con el menú
publicado, verificando precios, disponibilidad, especiales y el mensaje de
"sin menú" cuando no hay publicación.

**Acceptance Scenarios**:

1. **Given** un menú publicado para hoy, **When** el cliente lo consulta,
   **Then** ve cada platillo con nombre, descripción, precio, disponibilidad y
   distintivo de especial.
2. **Given** un platillo no disponible, **When** se muestra en el menú,
   **Then** aparece identificado como no disponible y no es seleccionable.
3. **Given** un día sin menú publicado, **When** el cliente consulta,
   **Then** ve un mensaje claro en lugar de una lista vacía.

---

### Edge Cases

- ¿Qué ocurre si se intenta agregar dos veces el mismo platillo a la misma
  fecha? Se rechaza el duplicado con mensaje claro (un platillo aparece una
  sola vez por fecha).
- ¿Qué ocurre si se modifica el precio de una línea del menú de hoy? Solo
  afecta a esa fecha; el catálogo no guarda precios (el precio vive en la
  línea del menú).
- ¿Qué ocurre si se desactiva un platillo que ya está en el menú de hoy? Las
  líneas existentes se conservan (historial), pero no se pueden crear líneas
  nuevas con él.
- ¿Qué ocurre si se elimina una línea del menú referenciada por un pedido?
  Se rechaza con mensaje claro para proteger el historial (aplica desde el
  sprint 3; la base ya lo prevé).
- ¿Qué ocurre si el precio es negativo o cero? Se rechaza; el precio debe ser
  mayor que cero para venderse.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001** (traza a 001/FR-004): El administrador MUST poder crear y editar
  platillos (nombre, descripción, categoría).
- **FR-002** (traza a 001/FR-004, 001/FR-005): El administrador MUST poder
  activar y desactivar platillos; NUNCA MUST eliminarlos físicamente.
- **FR-003** (traza a 001/FR-004): El administrador MUST poder armar el menú
  de una fecha agregando platillos activos con precio mayor que cero.
- **FR-004** (traza a 001/FR-004): El administrador MUST poder modificar
  precio, disponibilidad y distintivo de especial de cada línea del menú, y
  MUST poder quitar líneas no referenciadas por pedidos.
- **FR-005** (traza a 001/FR-005, 001/FR-006): Un platillo desactivado NUNCA
  MUST poder agregarse a menús nuevos; las líneas no disponibles MUST
  mostrarse como tales y no ser seleccionables.
- **FR-006** (traza a 001/FR-007): Todo cambio del menú MUST reflejarse de
  inmediato en la consulta de clientes, sin publicación diferida ni caché
  manual.
- **FR-007** (traza a 001/FR-008): Los clientes MUST poder consultar el menú
  de hoy con nombre, descripción, precio, disponibilidad y especiales.
- **FR-008**: Sin menú publicado, la consulta MUST mostrar un mensaje claro
  en lugar de una lista vacía.
- **FR-009** (traza a 001/FR-002): La gestión (crear/editar/desactivar/precios)
  MUST exigir rol de administrador; la consulta MUST exigir sesión activa.
- **FR-010** (alcance): Esta feature MUST NOT incluir pedidos, carrito,
  pagos ni notificaciones.

### Key Entities

- **Platillo**: producto del catálogo con nombre, categoría, descripción y
  estado activo/inactivo; sin precio propio (el precio vive en el menú).
- **Línea de menú**: platillo ofrecido en una fecha con precio congelado,
  disponibilidad y distintivo de especial; un platillo aparece una sola vez
  por fecha.
- **Menú del día**: conjunto de líneas de una fecha; lo que ven los clientes.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Un administrador arma el menú de hoy (agregar, precio,
  especial, disponibilidad) de principio a fin sin ayuda.
- **SC-002**: Cada cambio de precio o disponibilidad es visible para un
  cliente en su siguiente consulta, sin acción de "publicar".
- **SC-003**: Un platillo no disponible se muestra identificado como tal y no
  es seleccionable.
- **SC-004**: La consulta del menú abre sin esperas perceptibles en móvil
  durante el receso.
- **SC-005**: Intentos inválidos (precio no positivo, duplicado por fecha,
  platillo desactivado, acceso sin rol) son rechazados con mensajes claros.

## Assumptions

- La fecha del menú es un día calendario; por defecto hoy; se acepta
  gestionar otras fechas para planear.
- El precio se congela en la línea del menú (ya previsto en el esquema);
  cambiar el precio hoy no altera días anteriores ni pedidos existentes.
- Desactivar un platillo no borra líneas ya creadas (historial intacto).
- La consulta de menú exige sesión (módulo `/menu` ya protegido para rol
  cliente); otros roles autenticados también pueden consultarla vía API.
- La validación de "no vendible" en el pedido llega con el sprint 3; este
  sprint la prepara mostrando disponibilidad y bloqueando selección en UI.
- Esta spec no define pedidos, pagos ni notificaciones; lo nuevo MUST pasar
  primero por la spec maestra 001 según `docs/sprints.md`.
