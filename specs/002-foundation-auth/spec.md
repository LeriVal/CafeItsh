# Feature Specification: Fundamentos y Autenticación (Sprint 1)

**Feature Branch**: `002-foundation-auth`

**Created**: 2026-10-13

**Status**: Draft

**Input**: User description: "Sprint 1 del roadmap docs/sprints.md — base técnica y de seguridad: registro e inicio de sesión por rol, rutas protegidas por módulo (/admin, /caja, /cocina, /menu, /mis-pedidos) y gestión de usuarios operativos por el administrador. Traza a US6 y FR-001…FR-003 de la spec maestra specs/001-pedidos-anticipados-cafeteria/spec.md. No entra menú, pedidos, pagos ni notificaciones."

**Master spec**: [001 — Sistema de Pedidos Anticipados](../001-pedidos-anticipados-cafeteria/spec.md)

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Inicio de sesión por rol (Priority: P1)

Usuario registrado inicia sesión con correo y contraseña y es llevado a su
módulo correspondiente (administrador, cajero, cocinero o alumno/docente).
Con credenciales inválidas ve un mensaje claro que no revela si la cuenta
existe.

**Why this priority**: Sin acceso por rol no existe ningún otro flujo; es
la puerta de todo el sistema.

**Independent Test**: Puede probarse iniciando sesión con una cuenta de cada
rol y verificando la redirección a su módulo, más un intento con contraseña
incorrecta que muestra el mensaje claro.

**Acceptance Scenarios**:

1. **Given** una cuenta válida de cajero, **When** inicia sesión con correo
   y contraseña correctos, **Then** accede a su módulo de caja y no a los
   demás.
2. **Given** cualquier cuenta, **When** intenta iniciar sesión con contraseña
   incorrecta, **Then** ve un mensaje claro de credenciales inválidas que no
   revela si la cuenta existe.
3. **Given** cuentas operativas iniciales (administración, caja, cocina),
   **When** cada una inicia sesión, **Then** cada una llega a su módulo.

---

### User Story 2 - Rutas protegidas por sesión y rol (Priority: P1)

Cada módulo exige sesión activa y el rol correspondiente. Sin sesión, el
acceso redirige al inicio de sesión; con sesión pero rol distinto, el acceso
se deniega con mensaje claro.

**Why this priority**: Es la garantía de seguridad comprometida en la
constitución (principio II); sin ella cualquier rol vería funciones ajenas.

**Independent Test**: Puede probarse accediendo directamente a cada módulo
sin sesión y con sesión de otro rol, verificando redirección y denegación.

**Acceptance Scenarios**:

1. **Given** un visitante sin sesión, **When** intenta abrir cualquier
   módulo directamente, **Then** es redirigido al inicio de sesión.
2. **Given** una sesión de alumno/docente, **When** intenta abrir el módulo
   de administración, caja o cocina, **Then** el acceso se deniega con un
   mensaje claro.
3. **Given** una sesión de cajero, **When** abre su módulo, **Then** accede
   sin fricción y su sesión se mantiene entre pantallas.

---

### User Story 3 - Registro de clientes (Priority: P2)

Alumnos y docentes crean su propia cuenta con correo y contraseña para luego
iniciar sesión como clientes.

**Why this priority**: Habilita la base de usuarios clientes antes de que
existan menú y pedidos (sprints 2–3).

**Independent Test**: Puede probarse registrando una cuenta de cliente nueva
y verificando que luego inicia sesión y accede a los módulos de cliente.

**Acceptance Scenarios**:

1. **Given** un alumno sin cuenta, **When** se registra con correo y
   contraseña válidos, **Then** su cuenta de cliente queda creada y puede
   iniciar sesión.
2. **Given** un registro con correo ya usado o datos inválidos, **When** lo
   intenta, **Then** ve un mensaje claro sin exponer información interna.

---

### User Story 4 - Gestión de usuarios operativos (Priority: P2)

El administrador crea, edita y deshabilita cuentas operativas (cajeros y
cocineros) desde su módulo.

**Why this priority**: El personal de caja y cocina necesita cuentas
gestionadas centralmente antes de operar (sprint 4).

**Independent Test**: Puede probarse creando un cajero desde administración,
verificando su inicio de sesión, editándolo y deshabilitándolo.

**Acceptance Scenarios**:

1. **Given** sesión de administrador, **When** crea un cajero o cocinero,
   **Then** la cuenta queda habilitada con su rol y puede iniciar sesión.
2. **Given** sesión de administrador, **When** deshabilita una cuenta
   operativa, **Then** esa cuenta ya no puede iniciar sesión y ve un mensaje
   claro.

---

### Edge Cases

- ¿Qué ocurre si se intenta registrar un cliente cuando solo un
  administrador debería crear operativos? El registro público solo crea
  cuentas de cliente; nunca de administración, caja o cocina.
- ¿Qué ocurre si una cuenta deshabilitada intenta iniciar sesión? Se rechaza
  con mensaje claro sin revelar detalles internos.
- ¿Qué ocurre si la sesión expira a mitad de uso? La siguiente acción
  protegida redirige al inicio de sesión sin perder al usuario con errores
  técnicos.
- ¿Qué ocurre con credenciales válidas pero rol cambiado recientemente? El
  acceso se evalúa con el rol vigente en cada solicitud.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001** (traza a 001/FR-001): El sistema MUST permitir registro de
  clientes (alumno/docente) e inicio de sesión con correo y contraseña para
  todos los roles.
- **FR-002** (traza a 001/FR-001, 001/FR-002): El sistema MUST asignar un rol
  a cada cuenta y MUST restringir cada módulo a su rol; el registro público
  solo MUST crear cuentas de cliente.
- **FR-003** (traza a 001/FR-002): Sin sesión activa, el sistema MUST
  redirigir al inicio de sesión ante cualquier módulo protegido.
- **FR-004** (traza a 001/FR-002): Con sesión de otro rol, el sistema MUST
  denegar el acceso al módulo ajeno con mensaje claro.
- **FR-005** (traza a 001/FR-003): El administrador MUST poder crear, editar
  y deshabilitar cuentas operativas (cajeros y cocineros) desde su módulo.
- **FR-006**: El sistema MUST disponer cuentas operativas iniciales
  (administración, caja, cocina) listas para el arranque.
- **FR-007** (traza a 001/FR-024, 001/FR-025): El sistema MUST validar los
  datos de registro y acceso antes de procesarlos y MUST mostrar mensajes de
  error claros sin exponer información interna ni revelar si una cuenta
  existe.
- **FR-008**: Las contraseñas NUNCA MUST almacenarse ni transmitirse en texto
  plano.
- **FR-009** (alcance): Esta feature MUST NOT incluir menú, pedidos, pagos ni
  notificaciones.

### Key Entities

- **Usuario**: cuenta con correo, credenciales y un rol; representa a
  administración, caja, cocina y clientes (alumno/docente); puede estar
  habilitada o deshabilitada.
- **Rol**: conjunto de permisos que determina a qué módulo accede cada
  cuenta (administración, caja, cocina, cliente).
- **Sesión**: prueba de identidad vigente tras iniciar sesión; se exige para
  todo módulo protegido y determina la autorización por rol.

## Criterios de aceptación en EARS

Reformulación verificable de FR-001, FR-002, FR-003, FR-004 y FR-007 con la
sintaxis EARS. Complementa (no reemplaza) los escenarios Given/When/Then y
los requisitos anteriores. Casi todos tienen una prueba automática; excepción: la vigencia de 8 h (EARS-001) se define en el servicio de auth.

- **EARS-001** (FR-001, evento): **CUANDO** un usuario envíe correo y
  contraseña válidos, el backend **DEBE** responder 200 con un token JWT de
  8 horas de vigencia.
- **EARS-002** (FR-007, no deseado): **SI** el correo no existe o la
  contraseña es incorrecta, **ENTONCES** el backend **DEBE** responder 401 con
  el mismo mensaje genérico en ambos casos, sin revelar si la cuenta existe.
- **EARS-003** (FR-002, evento): **CUANDO** una persona se registre desde
  "Crear cuenta", el backend **DEBE** crear la cuenta con el rol `usuario`
  aunque la petición indique otro rol.
- **EARS-004** (FR-007, no deseado): **SI** la contraseña tiene menos de 8
  caracteres o el correo ya está registrado, **ENTONCES** el backend **DEBE**
  rechazar el registro (400 o 409) sin crear la cuenta.
- **EARS-005** (FR-003, no deseado): **SI** un visitante sin sesión abre un
  módulo protegido, **ENTONCES** el frontend **DEBE** redirigirlo a `/login`.
- **EARS-006** (FR-004, no deseado): **SI** un usuario con sesión abre un
  módulo de otro rol, **ENTONCES** el frontend **DEBE** mostrar la pantalla
  de acceso denegado y la API **DEBE** responder 403.
- **EARS-007** (FR-002, no deseado): **SI** una cuenta se deshabilita o cambia
  de rol después de firmar su token, **ENTONCES** el backend **DEBE** responder
  401 en la siguiente petición.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Una cuenta válida de cada rol completa el inicio de sesión y
  llega a su módulo en un solo intento, sin ayuda.
- **SC-002**: El 100 % de los accesos directos sin sesión a módulos
  protegidos redirigen al inicio de sesión.
- **SC-003**: El 100 % de los accesos con rol distinto al requerido son
  denegados con mensaje claro.
- **SC-004**: Un administrador crea, edita y deshabilita una cuenta operativa
  de principio a fin sin ayuda, y la cuenta deshabilitada ya no accede.
- **SC-005**: Ningún intento inválido (credenciales incorrectas, datos de
  registro inválidos, cuenta deshabilitada) expone información interna ni
  revela si la cuenta existe.

## Assumptions

- El registro público crea únicamente cuentas de cliente (alumno/docente);
  las cuentas operativas y de administración las gestiona un administrador.
- La distinción alumno/docente no afecta permisos en este sprint; ambos usan
  los módulos de cliente (relevante desde el sprint 2).
- Los mensajes de error de acceso son genéricos a propósito ("credenciales
  inválidas") para no revelar si una cuenta existe.
- La expiración de sesión redirige al inicio de sesión; no se asume duración
  específica en esta spec (se fijará en el plan).
- Esta spec no define menú, pedidos, pagos ni notificaciones; cualquier
  necesidad nueva MUST actualizar primero la spec maestra 001 según las
  reglas de trazabilidad de `docs/sprints.md`.
