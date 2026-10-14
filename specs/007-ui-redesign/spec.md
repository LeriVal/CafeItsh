# Feature Specification: Rediseño UI por Rol (Sprint 6)

**Feature Branch**: `007-ui-redesign`

**Created**: 2026-10-14

**Status**: Draft

**Input**: User description: "Sprint 6 — aplicar los diseños de desing/ (cliente, cocina, operativo) como rediseño solo-frontend conciliado con el código real y la constitución. Sin backend nuevo salvo exponer la hora de recogida en la cola de cocina (campo de lectura). Nada fuera del MVP."

**Docs base**: `desing/diseño-cliente.md`, `desing/diseño-cocina.md`, `desing/diseño-operativo.md` (propuestas; manda la constitución en conflicto).

## Decisiones de conciliación (doc-vs-código, manda el código)

- **C1**: Cantidad máxima por línea: 20 (código y validación backend), no 99.
- **C2**: Sondeo: 10 s (código probado), no 4 s.
- **C3**: Rutas actuales se conservan (`/pedido/nuevo`, `/pedido/:id`); el rediseño adapta visuales y pasos, no renombra rutas.
- **C4**: Sin "Pendiente tras cobro fallido" ni "Cancelar pedido" de cliente: incompatibles con la creación transaccional; fuera de alcance.
- **C5**: Carrito persistente en dispositivo: se adopta (mejora sin backend).
- **C6**: Hora de recogida en cola de cocina: se expone como campo de lectura (único cambio backend, sin migración ni endpoint nuevo).

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Navegación por rol (Priority: P1)

Cada rol navega con drawer lateral (móvil overlay, escritorio fijo) y, donde
aplica, bottom bar móvil: cliente (Menú, Mis pedidos con badge de `Listo`) y
caja (Caja, Entregas con contador). Admin y cocina usan drawer. Cerrar sesión
vive en el drawer. Nada cambia en permisos ni rutas protegidas.

**Why this priority**: Es la estructura que sostiene todo el rediseño.

**Independent Test**: Navegar por rol verificando drawer, bottom bar,
badges/contadores y cierre de sesión, en móvil y escritorio.

**Acceptance Scenarios**:

1. **Given** sesión cliente, **When** abre la app en móvil, **Then** ve bottom
   bar con Menú y Mis pedidos; con un `Listo`, hay badge.
2. **Given** cualquier rol, **When** abre el drawer, **Then** ve sus secciones
   y Cerrar sesión, que cierra y redirige a `/login`.
3. **Given** escritorio, **When** navega, **Then** el drawer es panel fijo y
   el contenido usa el resto.

---

### User Story 2 - Caja rediseñada (Priority: P1)

El cajero tiene inicio con acciones rápidas (Capturar pedido, Entregas con
contador), catálogo con búsqueda en vivo, chips por categoría y stepper,
barra flotante con total, resumen de cobro con desglose y un solo botón de
cobro, ticket con folio y cambio, y entregas con Entregar/Cancelar. Captura +
cobro siguen siendo un paso efectivo.

**Why this priority**: Es la pantalla del receso; cada paso de más cuesta fila.

**Independent Test**: Captura completa con búsqueda y stepper hasta ticket,
más entregas, sin ayuda.

**Acceptance Scenarios**:

1. **Given** cajero en catálogo, **When** busca y usa el stepper, **Then** la
   barra flotante muestra N y total, y el cobro confirma con folio y cambio.
2. **Given** monto insuficiente, **When** intenta cobrar, **Then** mensaje
   claro sin crear pedido.
3. **Given** pedidos `Listo`, **When** abre entregas, **Then** los ve por
   llegada con Entregar/Cancelar y el contador cuadra.

---

### User Story 3 - Cliente rediseñado (Priority: P2)

Menú con bienvenida, búsqueda y chips por categoría (derivadas del catálogo),
stepper y barra flotante; checkout con desglose, hora mínima visible y error
inline si <10 min; confirmación con folio grande y CTAs a mis pedidos y menú;
mis pedidos con contador de activos y CTA de nuevo pedido; carrito persistente
entre pantallas.

**Why this priority**: Reduce fricción del flujo que más vende.

**Independent Test**: Recorrido menú → checkout → confirmación → mis pedidos
verificando cada pieza.

**Acceptance Scenarios**:

1. **Given** menú con varias categorías, **When** filtra o busca, **Then** la
   lista se reduce en vivo y el vacío de filtro es claro.
2. **Given** carrito con items, **When** recarga o cambia de pantalla,
   **Then** el carrito se conserva.
3. **Given** hora <10 min, **When** la elige, **Then** ve el error inline con
   la hora mínima antes de enviar.
4. **Given** pago confirmado, **When** ve la confirmación, **Then** hay folio
   grande, estado y ambos CTAs.

---

### User Story 4 - Cocina enriquecida (Priority: P2)

Tablero de una sola pantalla con header (contador + última actualización),
tarjetas con folio grande, chip de origen, hora de registro y de recogida,
tiempo de espera con alerta de retraso, partidas legibles, CTA único por
estado y estado visible para `Listo` en espera de caja; vacíos, errores y
conflictos definidos; sondeo sin recarga manual.

**Why this priority**: Legibilidad a distancia en hora pico.

**Independent Test**: Cola con ambos orígenes verificando cada elemento y el
comportamiento ante errores.

**Acceptance Scenarios**:

1. **Given** pedidos activos, **When** abre cocina, **Then** ve folio, origen,
   horas, espera y partidas con CTA único según estado.
2. **Given** recogida pasada, **When** se muestra, **Then** hay alerta de
   retraso.
3. **Given** fallo de red, **When** ocurre, **Then** hay aviso con reintento y
   el sondeo continúa.

---

### User Story 5 - Admin con landing (Priority: P2)

El admin entra a un inicio con fecha, acciones rápidas con conteos (usuarios
activos, platillos, menú de hoy) y resumen del menú con especiales y no
disponibles; las tres secciones conservan su funcionalidad con mejor
jerarquía, buscadores y filas altas. Sin funcionalidad nueva.

**Why this priority**: Detección de huecos del día de un vistazo.

**Independent Test**: Entrar como admin y verificar landing, conteos y
navegación a las tres secciones sin perder funcionalidad.

**Acceptance Scenarios**:

1. **Given** admin, **When** entra a `/admin`, **Then** ve fecha, acciones
   con conteos y resumen del menú de hoy.
2. **Given** cada sección, **When** la usa, **Then** conserva crear, editar,
   activar/desactivar, precios y disponibilidad como antes.

---

### Edge Cases

- ¿Qué ocurre sin conexión en pantallas con sondeo? Se muestra lo último con
  aviso y reintento, sin bloquear.
- ¿Qué ocurre con categorías nuevas en el catálogo? Los chips se derivan de
  los datos; aparecen solos.
- ¿Qué ocurre con pedidos sin hora de recogida en cocina (mostrador)? Se
  muestra sin hora comprometida, sin alerta de retraso.
- ¿Qué ocurre con un badge de `Listo` y 0 avisos? El badge desaparece.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: Cada rol MUST navegar con drawer (móvil overlay, escritorio
  fijo) con sus secciones y cierre de sesión; cliente y caja MUST tener
  bottom bar móvil con contadores/badges.
- **FR-002**: La caja MUST ofrecer inicio con acciones, catálogo con búsqueda,
  chips y stepper, barra flotante, resumen con un solo botón de cobro, ticket
  con folio/cambio y entregas con Entregar/Cancelar.
- **FR-003**: El cliente MUST tener búsqueda/filtros en vivo, carrito
  persistente, hora mínima visible con error inline, confirmación con folio
  grande y ambos CTAs, y mis pedidos con contador y CTA de nuevo pedido.
- **FR-004**: Cocina MUST mostrar en una pantalla folio, origen, registro,
  recogida, espera con alerta de retraso, partidas, CTA único, estado `Listo`
  visible, vacíos/errores/conflictos y sondeo con feedback.
- **FR-005**: Admin MUST tener landing con fecha, conteos y resumen del menú,
  conservando toda la funcionalidad actual de sus secciones.
- **FR-006**: Todo control interactivo MUST medir ≥44 px; cifras y folios en
  tipografía destacada; estados con `StatusBadge`.
- **FR-007**: Único cambio backend permitido: exponer `fechaRecoleccion` de
  lectura en `GET /api/cocina/cola`. Nada más.
- **FR-008**: Nada marcado [Fuera de alcance] en `desing/` MUST implementarse
  (imágenes, push, pagos con tarjeta, descuentos, historial, métricas,
  favoritos, sonidos, impresión).

### Key Entities

- **Navegación por rol**: drawer + bottom bar con badges derivados de datos
  existentes (avisos sin ver, `Listo` por entregar).
- **Catálogo operable**: menú de hoy con búsqueda, categorías derivadas y
  stepper (caja y cliente).
- **Tarjeta KDS**: folio, origen, horas, espera, partidas y CTA único.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Un cajero captura y cobra sin ayuda en no más pasos que hoy.
- **SC-002**: Un cliente completa el flujo rediseñado sin ayuda en móvil.
- **SC-003**: Cocina legible: folio, horas y partidas identificables con sus
  CTA únicos; sondeo con feedback visible.
- **SC-004**: Auditoría de 44 px y contraste superada en las pantallas
  tocadas; suites en verde sin regresiones.
- **SC-005**: Cero elementos [Fuera de alcance] implementados.

## Assumptions

- La conciliación C1–C6 es definitiva para este sprint; reabrirla requiere
  justificación.
- Los conteos del drawer/badges usan endpoints existentes.
- `desing/` queda como propuesta histórica; no se edita en este sprint.
