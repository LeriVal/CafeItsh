<!--
Sync Impact Report — Constitución inicial desde docs/reglas (1).md
- Version change: 0.0.0 (scaffold sin ratificar) → 1.0.0
- Modified principles: [PRINCIPLE_1..5 genéricos] → I–VII específicos ITSH (alcance, seguridad, simplicidad, rapidez, trazabilidad, validación, viabilidad)
- Added sections:
  - "Restricciones Tecnológicas y de Arquitectura" (reemplaza [SECTION_2_NAME])
  - "Operación por Roles, Flujo y Calidad" (reemplaza [SECTION_3_NAME])
  - Governance concreta (enmiendas, versionado semántico, compliance, guidance file)
- Removed sections: ninguna (solo placeholders de ejemplo del scaffold)
- Follow-up TODOs: ninguno. Todos los placeholders fueron resueltos.
  Fuente canónica de reglas: `docs/reglas (1).md` (30 secciones). Tokens `.stitch/DESIGN.md` referenciados como base no obligatoria.
-->

# Sistema de Pedidos Anticipados — Cafetería ITSH Constitution

Sistema web de pedidos anticipados para la cafetería del Instituto
Tecnológico Superior de Huauchinango (ITSH): alumnos y docentes consultan
el menú, realizan pedidos y pagos anticipados, y reciben notificación
cuando el pedido está listo, sin interrumpir el servicio de mostrador.

## Core Principles

### I. Alcance MVP Primero (NON-NEGOTIABLE)

Todas las decisiones MUST priorizar el cumplimiento del alcance MVP y
MUST NOT agregar funcionalidades fuera de alcance sin aprobación previa.
El MVP se limita a: gestión de usuarios y roles, gestión y consulta del
menú, gestión de platillos, pedidos anticipados, pedidos de mostrador,
pago anticipado, visualización en cocina, actualización de estados y
notificación de pedido listo.

Rationale: proyecto académico con presupuesto, personal y tiempo
limitados; el desvío de alcance es el principal riesgo de no entrega.

### II. Seguridad por Defecto (NON-NEGOTIABLE)

Todo acceso MUST exigir autenticación por correo y contraseña con JWT y
autorización basada en roles; cada ruta (`/admin`, `/caja`, `/cocina`,
`/menu`, `/mis-pedidos`) MUST exigir sesión activa y el rol
correspondiente. Las contraseñas MUST almacenarse con hash y NUNCA en
texto plano. Secretos (`DATABASE_URL`, `JWT_SECRET`, `PAYMENT_API_KEY`,
`NOTIFICATION_API_KEY`, `NODE_ENV`, `PORT`) MUST vivir en variables de
entorno y NUNCA en código o en el repositorio. La información sensible de
tarjetas NUNCA MUST almacenarse; solo se registra lo necesario para
identificar y validar la transacción. Producción MUST usar HTTPS y todos
los datos de entrada MUST validarse y sanitizarse.

Rationale: se manejan credenciales, pagos y datos de alumnos y docentes;
una filtración compromete la confianza y la operación.

### III. Simplicidad y Mantenibilidad

La arquitectura MUST mantenerse sencilla y organizada por funcionalidad:
`frontend/`, `backend/`, `database/`, `tests/`; backend limitado a
`routes/`, `controllers/`, `services/`, `middlewares/`, `utils/` sin capas
innecesarias. El código MUST estar en TypeScript estrictamente tipado,
con `camelCase` para variables y funciones y `PascalCase` para
componentes, tipos e interfaces; se prefieren funciones pequeñas,
reutilizables y sin duplicación. No se MUST agregar dependencias ni ORMs
innecesarios; antes de incorporar una librería se MUST verificar si se
resuelve con herramientas existentes y su compatibilidad con Node.js LTS.

Rationale: equipo pequeño y rotación académica; lo simple se entiende,
se prueba y se mantiene.

### IV. Rapidez Operativa en Receso

Las pantallas de caja y cocina MUST priorizar la menor cantidad de pasos
posible, con botones de alto contraste y área táctil mínima de 44 px,
información de menú, pedidos y estados presentada de forma clara y sin
elementos visuales innecesarios. La interfaz MUST ser responsiva
(móvil y escritorio), simple, clara y rápida, personalizada con
Tailwind CSS + shadcn/ui a partir de los tokens de `.stitch/DESIGN.md`
como base de referencia no obligatoria al 100 %.

Rationale: los recesos concentran la demanda; cada segundo en caja y
cocina determina si se cumple el objetivo de reducir el tiempo de espera
en 50 %.

### V. Trazabilidad Total del Pedido

Cada pedido MUST mantener un estado explícito dentro del ciclo mínimo:
`Pendiente`, `Pagado`, `En preparación`, `Listo`, `Entregado`,
`Cancelado`. Los pedidos anticipados MUST crearse con al menos 10 minutos
de anticipación. El sistema MUST operar simultáneamente pedidos
anticipados y de mostrador sin que uno bloquee al otro, MUST eliminar
errores de interpretación verbal y MUST permitir al cocinero visualizar la
cola, identificar el orden de preparación y cambiar estados. La aceptación
MUST verificarse contra el flujo completo: consulta → selección →
creación → pago → recepción en cocina → preparación → listo →
notificación → recogida / entrega, validado en demostración funcional por
la patrocinadora.

Rationale: sin estados explícitos y visibles no hay forma de probar el
progreso ni de auditar errores en hora pico.

### VI. Validación Estricta y Errores Seguros (NON-NEGOTIABLE)

Todos los datos MUST validarse en frontend Y en backend; NUNCA se MUST
confiar solo en el cliente y NUNCA se MUST persistir datos inválidos o
incompletos. Toda comunicación frontend-backend MUST realizarse por API
REST con verbos correctos (`GET` consulta, `POST` creación, `PUT`/`PATCH`
modificación, `DELETE` eliminación) y códigos HTTP apropiados. Los errores
NUNCA MUST exponer stack traces ni información interna; MUST mostrar
mensajes claros al usuario y registrarse internamente sin datos sensibles.

Rationale: la doble validación y el manejo seguro de errores son la
frontera entre un fallo menor y una corrupción de datos o una filtración.

### VII. Viabilidad Económica y Despliegue Ligero

El sistema MUST ejecutarse localmente en desarrollo con configuraciones
de desarrollo y producción separadas, y el MVP MUST ser desplegable en
hosting gratuito o de bajo costo considerando conectividad limitada en el
plantel, capacitación mínima del personal y presupuesto académico. Las
consultas de menú MUST estar optimizadas y la gestión de pedidos MUST
evitar retrasos para sostener los objetivos: −50 % de espera en caja en
recesos, 100 % de anticipados con ≥10 min y reducción de errores verbales.

Rationale: si el MVP no es barato de operar y rápido bajo carga, no es
adoptable por la cafetería.

## Restricciones Tecnológicas y de Arquitectura

**Stack obligatorio.** Frontend: React con TypeScript compilado con Vite,
en una sola aplicación web con rutas `/admin`, `/caja`, `/cocina`,
`/menu`, `/mis-pedidos`. Backend: Node.js LTS con Express exponiendo API
REST de usuarios, roles, menú, platillos, pedidos, pagos, estados y
notificaciones. Base de datos: MySQL 8.0 con relaciones e integridad
referencial para usuarios, roles, platillos, menú, pedidos, detalles,
pagos y estados; acceso mediante librería de acceso a datos adecuada, sin
ORMs innecesarios.

**Estructura obligatoria.** Nivel raíz: `frontend/`, `backend/`,
`database/`, `tests/`. Frontend: `frontend/src/pages/admin/`,
`frontend/src/pages/caja/`, `frontend/src/pages/cocina/`,
`frontend/src/pages/clientes/`, `frontend/src/components/ui/` (shadcn/ui
copiado al proyecto), `frontend/src/lib/`.

**Dependencias y entorno.** Git con commits pequeños y descriptivos y
remoto obligatorio; archivos `.env` y credenciales NUNCA en el
repositorio. Variables mínimas: `DATABASE_URL`, `JWT_SECRET`,
`PAYMENT_API_KEY`, `NOTIFICATION_API_KEY`, `NODE_ENV`, `PORT`.

## Operación por Roles, Flujo y Calidad

**Roles y rutas.** Una sola app web; cada rol solo accede a su ruta.
Administrador: gestiona usuarios operativos, menú, platillos, especiales
del día y precios. Cajero: captura pedidos presenciales y gestiona cobros
locales sin interrumpir el mostrador. Cocinero: visualiza entrantes,
consulta productos a preparar y cambia estados. Alumno / Docente:
comparten `/menu` y `/mis-pedidos`; consultan menú, crean pedidos y pagos
anticipados, consultan estado y reciben notificación de listo.

**Menú, pagos y notificaciones.** El administrador MUST poder crear y
modificar menú diario, platillos y precios con reflejo inmediato; platos
no disponibles NUNCA MUST ser seleccionables. El pago en línea MUST ser
parte del flujo del pedido anticipado. Notificaciones (pedido listo) MUST
mantenerse separadas de la lógica de pedidos y MAY usar un servicio
externo.

**Calidad y pruebas.** Pruebas unitarias con Vitest; toda lógica crítica
MUST tener pruebas como mínimo en autenticación, autorización, usuarios,
menú, creación y validación de pedidos, cálculo de totales, cambios de
estado y permisos por rol. No hay cobertura mínima obligatoria, pero las
funcionalidades críticas NUNCA MUST entregarse sin pruebas. Restricciones
operativas: no interrumpir el mostrador actual, asumir internet limitado y
capacitación limitada.

## Governance

La constitución prevalece sobre cualquier otra práctica o convenio
informal del proyecto; en caso de conflicto, rige este documento y su
fuente de detalle `docs/reglas (1).md`.

**Procedimiento de enmienda.** Todo cambio MUST documentarse mediante este
flujo de constitución (principio o sección afectados, justificación y
reporte de impacto de sincronización), versionarse según la política
siguiente y registrarse en el historial del archivo antes de fusionarse.
Cambios fuera de alcance del MVP requieren además aprobación explícita de
la patrocinadora.

**Política de versionado.** Formato semántico `MAJOR.MINOR.PATCH`:
MAJOR por eliminaciones o redefiniciones incompatibles de principios;
MINOR por principios o secciones nuevas o guía materialmente ampliada;
PATCH por clarificaciones, redacción o correcciones no semánticas.

**Revisión de cumplimiento.** Cada especificación, plan y revisión de
código MUST verificar conformidad con los siete principios y con las
restricciones de stack, roles y calidad; la complejidad adicional MUST
justificarse por escrito. La aceptación final requiere demostración del
flujo completo y validación de la patrocinadora.

**Version**: 1.0.0 | **Ratified**: 2026-10-13 | **Last Amended**: 2026-10-13
