# Feature Specification: Sistema de Pedidos Anticipados — Cafetería ITSH

**Feature Branch**: `001-pedidos-anticipados-cafeteria`

**Created**: 2026-10-13

**Status**: Draft

**Input**: User description: "Construir un sistema web de pedidos anticipados llamado "Sistema de Pedidos Anticipados — Cafetería ITSH" para que alumnos y docentes del Instituto Tecnológico Superior de Huauchinango consulten el menú, hagan pedidos y pagos por adelantado, y reciban una notificación cuando su pedido esté listo, sin interrumpir el servicio actual de mostrador."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Pedido anticipado con pago (Priority: P1)

Alumno o docente consulta el menú del día con precios y disponibilidad,
selecciona platillos y cantidades, ve el total antes de confirmar, crea el
pedido con al menos 10 minutos de anticipación y lo paga en línea como
parte del mismo flujo.

**Why this priority**: Es el valor central del sistema; sin este flujo no
se reducen filas en receso ni errores de comunicación verbal.

**Independent Test**: Puede probarse de extremo a extremo creando un pedido
anticipado válido y verificando que queda registrado con total correcto,
estado posterior al pago y detalle consultable, sin intervención de
caja ni cocina.

**Acceptance Scenarios**:

1. **Given** un menú del día publicado con platillos disponibles, **When**
   el cliente selecciona platillos y cantidades y confirma, **Then** el
   sistema muestra el total correcto y crea el pedido con sus líneas.
2. **Given** un pedido anticipado creado, **When** el cliente completa el
   pago en línea, **Then** el pedido pasa a "Pagado" y registra solo los
   datos necesarios para identificar y validar la transacción.
3. **Given** un intento de pedido con menos de 10 minutos de anticipación,
   **When** se intenta confirmar, **Then** el sistema lo rechaza con un
   mensaje claro.
4. **Given** un platillo marcado no disponible, **When** se intenta incluir
   en un pedido nuevo, **Then** el sistema lo impide y lo muestra como no
   seleccionable.

---

### User Story 2 - Seguimiento y aviso de pedido listo (Priority: P1)

Alumno o docente consulta la lista de sus pedidos con el estado actual y
el detalle de cada uno, y recibe un aviso cuando su pedido pasa a "Listo"
para recogerlo.

**Why this priority**: Cierra el ciclo de valor del pedido anticipado; sin
aviso oportuno el cliente vuelve a formarse a preguntar.

**Independent Test**: Puede probarse marcando un pedido como "Listo" y
verificando que el cliente ve el estado actualizado, el detalle y el aviso
de recogida.

**Acceptance Scenarios**:

1. **Given** un cliente con pedidos existentes, **When** abre "mis
   pedidos", **Then** ve cada pedido con su estado actual y su detalle
   (platillos, cantidades, total).
2. **Given** un pedido en preparación, **When** pasa a "Listo", **Then** el
   cliente recibe el aviso de recogida y el estado visible se actualiza.

---

### User Story 3 - Cocina prepara y actualiza estados (Priority: P1)

Cocinero visualiza en una sola pantalla los pedidos entrantes (anticipados
y de mostrador), con productos y cantidades, identifica el orden de
preparación y cambia el estado a "En preparación" y a "Listo" con el
mínimo de pasos.

**Why this priority**: Sin cocina el flujo se detiene; la rapidez y
claridad aquí determinan el tiempo de entrega en receso.

**Independent Test**: Puede probarse registrando pedidos de ambos orígenes
y verificando que aparecen en la pantalla de cocina con su contenido y que
los cambios de estado se reflejan.

**Acceptance Scenarios**:

1. **Given** pedidos anticipados pagados y pedidos de mostrador activos,
   **When** el cocinero abre su pantalla, **Then** ve ambos en una sola
   lista con productos, cantidades y orden de preparación identificable.
2. **Given** un pedido pagado, **When** el cocinero lo toma, **Then** puede
   pasarlo a "En preparación" y luego a "Listo".
3. **Given** la pantalla de cocina, **When** llegan o cambian pedidos,
   **Then** la lista se actualiza sin necesidad de recarga manual.

---

### User Story 4 - Caja atiende mostrador en paralelo (Priority: P2)

Cajero captura pedidos presenciales con cobro, en pocos pasos, mientras
los pedidos anticipados siguen fluyendo sin bloquearse entre sí.

**Why this priority**: Garantiza la restricción de no interrumpir el
servicio actual de mostrador durante la adopción del sistema.

**Independent Test**: Puede probarse capturando un pedido de mostrador con
cobro y verificando que queda registrado y visible para cocina mientras un
pedido anticipado sigue su curso.

**Acceptance Scenarios**:

1. **Given** un cliente en mostrador, **When** el cajero captura platillos
   y registra el cobro, **Then** el pedido queda registrado y disponible
   para preparación.
2. **Given** pedidos anticipados en curso, **When** se captura un pedido de
   mostrador, **Then** ambos operan simultáneamente sin bloquearse.

---

### User Story 5 - Administración de menú y disponibilidad (Priority: P2)

Administrador crea y modifica el menú diario, gestiona platillos,
especiales del día, precios y disponibilidad, con reflejo inmediato para
los clientes.

**Why this priority**: Sin menú vigente y preciso no hay pedidos válidos;
los cambios deben propagarse antes del receso.

**Independent Test**: Puede probarse modificando precios, disponibilidad y
especiales y verificando que la vista del cliente los refleja de inmediato
y que lo no disponible no es seleccionable.

**Acceptance Scenarios**:

1. **Given** sesión de administrador, **When** crea o modifica el menú del
   día, platillos, especiales y precios, **Then** los clientes ven los
   cambios de inmediato.
2. **Given** un platillo marcado no disponible, **When** un cliente arma un
   pedido nuevo, **Then** no puede seleccionarlo.

---

### User Story 6 - Acceso por rol y gestión de usuarios (Priority: P3)

Usuarios se registran e inician sesión con correo y contraseña; cada uno
solo accede a las funciones de su rol (administrador, cajero, cocinero,
alumno/docente); el administrador gestiona usuarios operativos.

**Why this priority**: Es habilitadora de seguridad y orden operativo,
pero no entrega valor al comensal por sí sola.

**Independent Test**: Puede probarse iniciando sesión con cada rol y
verificando que solo su módulo es accesible y que un rol no autorizado es
rechazado.

**Acceptance Scenarios**:

1. **Given** un usuario registrado con un rol, **When** inicia sesión con
   credenciales válidas, **Then** accede solo a su módulo correspondiente.
2. **Given** un usuario sin el rol requerido, **When** intenta acceder a un
   módulo ajeno, **Then** el acceso es denegado con mensaje claro.
3. **Given** sesión de administrador, **When** crea o edita un usuario
   operativo (cajero, cocinero), **Then** el usuario queda habilitado con
   su rol.

---

### Edge Cases

- ¿Qué ocurre si el pago en línea falla o se interrumpe? El pedido no pasa
  a "Pagado", conserva su estado previo y el cliente recibe un mensaje
  claro con opción de reintentar sin duplicar el pedido.
- ¿Qué ocurre si un platillo se agota entre la consulta y la confirmación?
  La confirmación valida disponibilidad de nuevo y rechaza las líneas no
  disponibles con mensaje claro.
- ¿Qué ocurre si se intenta una transición de estado inválida (saltar
  estados o mover un pedido Entregado/Cancelado)? El sistema la rechaza y
  conserva el estado actual.
- ¿Qué ocurre si se cancela un pedido ya pagado o en preparación? Solo se
  permite cancelar antes de la entrega; el estado pasa a "Cancelado" y ya
  no admite más cambios.
- ¿Qué ocurre con conectividad intermitente en el plantel? Las acciones
  muestran estado y mensajes claros; ninguna operación queda en estado
  ambiguo sin informar al usuario.
- ¿Qué ocurre si dos operadores (caja/cocina) actúan sobre el mismo pedido
  a la vez? El estado final corresponde a una transición válida y
  auditable; las transiciones inválidas concurrentes se rechazan.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: El sistema MUST permitir registro e inicio de sesión con
  correo electrónico y contraseña.
- **FR-002**: El sistema MUST asignar a cada usuario un rol (administrador,
  cajero, cocinero, alumno/docente) y MUST restringir cada módulo a su rol.
- **FR-003**: El administrador MUST poder crear, editar y gestionar
  usuarios operativos (cajeros y cocineros).
- **FR-004**: El administrador MUST poder crear y modificar el menú diario,
  platillos, especiales del día y precios.
- **FR-005**: El administrador MUST poder marcar platillos como no
  disponibles.
- **FR-006**: El sistema MUST impedir seleccionar platillos no disponibles
  en pedidos nuevos.
- **FR-007**: El sistema MUST reflejar los cambios del menú de inmediato
  para los clientes.
- **FR-008**: Clientes MUST poder consultar el menú del día con platillos,
  precios, disponibilidad y especiales del día.
- **FR-009**: Clientes MUST poder armar un pedido con uno o más platillos y
  cantidades, y MUST ver el total antes de confirmar.
- **FR-010**: El sistema MUST exigir al menos 10 minutos de anticipación
  para pedidos anticipados y MUST rechazar los que no la cumplan.
- **FR-011**: El pago en línea MUST formar parte del flujo del pedido
  anticipado a través de un servicio de pago externo.
- **FR-012**: El sistema MUST NOT almacenar datos sensibles de tarjetas;
  solo MUST registrar lo necesario para identificar y validar la
  transacción.
- **FR-013**: Un pedido anticipado MUST pasar a "Pagado" solo cuando el
  pago se confirma.
- **FR-014**: Cada pedido MUST tener siempre un estado válido: Pendiente,
  Pagado, En preparación, Listo, Entregado o Cancelado.
- **FR-015**: El sistema MUST aplicar el flujo Pendiente → Pagado → En
  preparación → Listo → Entregado y MUST permitir Cancelado antes de la
  entrega.
- **FR-016**: El sistema MUST rechazar saltos de estado (p. ej. Pendiente →
  Listo) y cualquier cambio sobre pedidos Entregados o Cancelados.
- **FR-017**: Clientes MUST poder ver su lista de pedidos con estado actual
  y el detalle (platillos, cantidades, total).
- **FR-018**: El cajero MUST poder capturar pedidos presenciales y
  registrar/gestionar su cobro en el mínimo de pasos.
- **FR-019**: El sistema MUST operar pedidos anticipados y de mostrador
  simultáneamente sin bloquearse.
- **FR-020**: Cocina MUST mostrar en una sola pantalla pedidos anticipados
  y de mostrador con productos, cantidades y orden de preparación
  identificable.
- **FR-021**: La pantalla de cocina MUST actualizarse sin recarga manual
  ante pedidos nuevos o cambios.
- **FR-022**: El cocinero MUST poder cambiar el estado a "En preparación" y
  a "Listo".
- **FR-023**: Al pasar a "Listo", el sistema MUST avisar al cliente que
  puede recoger su pedido; la función de avisos MUST estar separada de la
  lógica de pedidos.
- **FR-024**: El sistema MUST validar los datos antes de procesarlos y
  almacenarlos, sin confiar únicamente en validaciones del cliente.
- **FR-025**: El sistema MUST mostrar mensajes de error claros sin exponer
  información interna.
- **FR-026**: El sistema MUST funcionar de forma responsiva en móviles y
  computadoras, con interfaces simples, claras y rápidas.
- **FR-027**: Las pantallas de caja y cocina MUST optimizarse para rapidez
  y legibilidad en recesos (alto contraste, mínimos pasos, información
  clara).
- **FR-028**: El sistema MUST NOT interrumpir ni reemplazar el servicio
  actual de mostrador.
- **FR-029**: El sistema MUST NOT incluir fuera del MVP sin aprobación:
  app móvil nativa, reseñas/lealtad/promociones ni gestión de
  inventario/proveedores.

### Key Entities

- **Usuario**: cuenta con correo, credenciales y un rol; representa a
  administradores, cajeros, cocineros y clientes (alumno/docente).
- **Platillo**: producto ofrecible con nombre, descripción, precio y
  disponibilidad; puede destacarse como especial del día.
- **Menú del día**: conjunto vigente de platillos y especiales con precios;
  sus cambios se reflejan de inmediato.
- **Pedido**: solicitud de uno o más platillos con cantidades, total,
  origen (anticipado/mostrador), anticipación y estado actual.
- **Detalle de pedido**: cada línea del pedido (platillo, cantidad,
  subtotal); base del cálculo del total.
- **Pago / Transacción**: confirmación del cobro con referencia de
  validación (sin datos sensibles de tarjeta); habilita el paso a "Pagado".
- **Aviso de pedido listo**: comunicación al cliente de que su pedido está
  para recogida; separada de la lógica de pedidos.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: El tiempo de espera en caja durante recesos se reduce al
  menos 50 % respecto a la línea base medida antes del sistema.
- **SC-002**: El 100 % de los pedidos anticipados aceptados cumplen la
  anticipación mínima de 10 minutos.
- **SC-003**: Los errores por interpretación verbal de pedidos se reducen
  de forma observable (pedidos registrados en sistema frente a dictados
  verbales) en el periodo de demostración.
- **SC-004**: Los clientes consultan el menú del día y ven cambios
  (precios, disponibilidad, especiales) de inmediato, incluso en horario de
  receso.
- **SC-005**: Un cliente puede completar el flujo consulta → selección →
  pedido → pago → aviso → recogida sin ayuda, en una sola sesión.
- **SC-006**: Cocina identifica el orden de preparación y actualiza estados
  sin recarga manual durante la hora pico.
- **SC-007**: Caja captura un pedido presencial con cobro en el mínimo de
  pasos mientras los anticipados siguen fluyendo.
- **SC-008**: Intentos inválidos (anticipación insuficiente, plato no
  disponible, transición de estado inválida, acceso sin rol) son
  rechazados con mensajes claros.

## Assumptions

- Los usuarios operativos (caja, cocina, administración) cuentan con
  cuentas creadas por un administrador; los clientes se registran por sí
  mismos.
- La anticipación de 10 minutos se mide entre la confirmación del pedido y
  el momento de recogida previsto.
- El pago en línea se procesa mediante un servicio externo; el sistema solo
  guarda la referencia necesaria para validar la transacción.
- El aviso de "Listo" es al menos visible en la vista de pedidos del
  cliente y puede apoyarse en un servicio externo; no se asume un canal
  específico (push/correo/SMS).
- La cancelación se permite solo antes de la entrega; el tratamiento de
  reembolsos sigue la política del medio de pago.
- El menú se publica por día; fuera de horario o sin menú publicado, la
  consulta lo indica con mensaje claro en lugar de mostrar datos vacíos.
- La conectividad del plantel puede ser intermitente; el uso debe seguir
  siendo intuitivo con capacitación mínima.
- Línea base de espera en caja y de errores verbales se mide antes de la
  demostración para verificar SC-001 y SC-003.
