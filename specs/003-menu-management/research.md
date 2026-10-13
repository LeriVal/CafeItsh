# Phase 0 Research: Gestión y Consulta de Menú (Sprint 2)

**Feature**: `specs/003-menu-management/` | **Date**: 2026-10-13

Rigen la constitución v1.0.0 y la realidad verificada: `migrations/001`
ya crea `platillo` (con `activo`) y `menu_dia` (fecha, precio congelado,
disponible, especial, UNIQUE por fecha+platillo); el seed 002 deja menú de
ejemplo para hoy; el backend del sprint 1 aporta pool, envelope de errores y
guardias de rol.

## R1. Sin migración nueva

- **Decision**: ninguna migración en este sprint; `npm run db:migrate`
  como verificación de que 001–003 siguen aplicadas.
- **Rationale**: el esquema ya cubre catálogo, líneas, precios congelados,
  disponibilidad y especiales. Añadir migraciones vacías violaría simplicidad.
- **Alternatives**: migración de índices extra — rechazada (`idx_menu_dia_fecha`
  ya existe y el volumen es de un plantel).

## R2. "Hoy" se calcula en America/Mexico_City en el backend

- **Decision**: la fecha por defecto del menú se calcula en el backend con
  zona `America/Mexico_City`; se acepta `?fecha=YYYY-MM-DD` explícita y
  validada para planear otros días.
- **Rationale**: el servidor (local o hosting) puede correr en UTC; el "menú
  de hoy" lo define el plantel, no el huso del servidor.
- **Alternatives**: fecha del cliente — rechazada (relojes manipulables y
  doble fuente de verdad).

## R3. Desactivar platillos; borrar solo líneas sin referencias

- **Decision**: platillos se activan/desactivan (nunca DELETE físico, por FK a
  `menu_dia` e historial de pedidos); líneas de `menu_dia` sí admiten DELETE,
  y si están referenciadas por un pedido el error FK 1451 se traduce a 409
  con mensaje claro.
- **Rationale**: preserva historial y respeta integridad referencial sin
  lógica extra.
- **Alternatives**: borrado en cascada — rechazado (destruiría historial de
  ventas).

## R4. Precio estrictamente mayor que cero

- **Decision**: la API exige `precio > 0` (el CHECK del esquema permite 0,
  pero el negocio no vende gratis).
- **Rationale**: validación de negocio por encima del mínimo del esquema.
- **Alternatives**: permitir 0 para cortesías — rechazado (fuera del MVP;
  reabrir solo con aprobación de alcance).

## R5. Lectura con sesión, mutación solo admin

- **Decision**: `GET /api/menu` y `GET /api/platillos` exigen sesión
  (cualquier rol); `POST/PATCH/DELETE` exigen `administrador`.
- **Rationale**: el menú es dato operativo interno del plantel; la escritura
  es privilegio del administrador (FR-009 de la spec).
- **Alternatives**: menú público sin sesión — rechazado (toda la app exige
  sesión por constitución).

## R6. Sin caché: lectura directa siempre

- **Decision**: cada consulta lee la BD; la respuesta incluye la fecha
  consultada para que el cliente muestre exactamente qué día ve.
- **Rationale**: "reflejo inmediato" sin invalidaciones que mantener; el
  volumen no justifica caché.
- **Alternatives**: caché con TTL — rechazada (riesgo de precio
  desactualizado en receso).

## R7. Admin con subrutas y navegación

- **Decision**: `/admin/*` se reorganiza en `/admin/usuarios`,
  `/admin/platillos`, `/admin/menu` con barra de navegación; `/admin` redirige
  a `/admin/platillos` (tarea más frecuente del rol).
- **Rationale**: tres funciones distintas merecen pantallas propias en lugar
  de una página monolítica.
- **Alternatives**: todo en una página con pestañas — rechazada (rutas
  permiten enlaces directos y crecen mejor).
