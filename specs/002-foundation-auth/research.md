# Phase 0 Research: Fundamentos y Autenticación (Sprint 1)

**Feature**: `specs/002-foundation-auth/` | **Date**: 2026-10-13

Cada decisión responde a una incógnita real del sprint. Rigen la constitución
v1.0.0 (principios II, III, VII) y la realidad del repo verificada el
2026-10-13: `backend/` vacío (solo `package.json` mínimo), `fronted/` con
scaffold Vite+React en JS plano, `migrations/` con esquema completo y seed sin
cuentas de usuario, Node v20.20.2, sin directorio `.stitch/`.

## R1. Renombrar `fronted/` → `frontend/` en este sprint

- **Decision**: `git mv fronted frontend` como primera tarea del sprint y
  actualizar el nombre del paquete.
- **Rationale**: la constitución exige la estructura `frontend/`; hacerlo ahora
  (antes de que exista código por rol) es barato y evita que cada sprint
  futuro cargue con la desviación.
- **Alternatives**: mantener `fronted/` y documentar excepción — rechazado
  porque normaliza una violación estructural desde el sprint 1.

## R2. TypeScript en backend con `tsx` (sin ORM)

- **Decision**: backend en TypeScript estricto, ejecución dev con `tsx`,
  compilación con `tsc`, acceso a datos con `mysql2/promise`, sin ORM.
- **Rationale**: constitución (TS obligatorio, sin ORMs innecesarios);
  `mysql2` basta para el esquema existente y mantiene la capa de datos fina.
- **Alternatives**: ORM (Prisma/Drizzle) — rechazado por sobreingeniería para
  este tamaño; JS plano — rechazado por la constitución.

## R3. `bcryptjs` en lugar de `bcrypt`

- **Decision**: hash de contraseñas con `bcryptjs` (JS puro), costo 10 en
  desarrollo y 12 en producción (configurable por env).
- **Rationale**: sin compilación nativa; el equipo trabaja en Windows y el
  despliegue objetivo es hosting barato, donde los módulos nativos suelen
  fallar. API compatible con `bcrypt`.
- **Alternatives**: `bcrypt` nativo — rechazado por fricción de instalación;
  `argon2` — rechazado por la misma razón.

## R4. Sesión JWT en `localStorage` + cabecera `Authorization` para el MVP

- **Decision**: el backend firma JWT (`sub`, `rol`, `exp` corta, p. ej. 8 h);
  el frontend lo guarda en `localStorage` y lo envía como
  `Authorization: Bearer`. Cierre de sesión = descarte del token.
- **Rationale**: MVP simple, sin estado de sesión en servidor, funciona igual
  en local y en hosting gratuito; la higiene XSS se cubre no renderizando
  nunca contenido no sanitizado y con mensajes de error genéricos.
- **Alternatives**: cookie httpOnly — más segura contra XSS pero exige
  gestión CSRF y de dominios que el MVP no necesita; se deja como mejora
  documentada post-MVP.

## R5. Corredor de migraciones propio (~40 líneas, sin dependencia)

- **Decision**: `backend/scripts/migrate.ts` aplica en orden los `.sql` de
  `migrations/` y registra cada uno en `schema_migrations`; se ejecuta con
  `npm run db:migrate`.
- **Rationale**: solo hay archivos SQL numerados y una tabla de control por
  crear; añadir `db-migrate`/`knex` violaría el principio de no agregar
  dependencias innecesarias.
- **Alternatives**: librería de migraciones — rechazada por lo anterior.

## R6. Seed de cuentas operativas vía script con variables de entorno

- **Decision**: `backend/scripts/seed-users.ts` crea admin/cajero/cocinero
  leyendo `ADMIN_EMAIL`/`ADMIN_PASSWORD`, etc., con valores de desarrollo por
  defecto claramente marcados; se niega a correr con `NODE_ENV=production`
  salvo confirmación explícita. Los hashes se generan con `bcryptjs`, nunca se
  escriben contraseñas en SQL ni en el repo.
- **Rationale**: MySQL no lee variables de entorno, así que un seed `.sql`
  con contraseñas fijas violaría la constitución; el script mantiene secretos
  fuera del código y es auditable.
- **Alternatives**: seed SQL con hashes fijos — rechazado (secreto en repo).

## R7. Migración JS→TS del frontend dentro del sprint (alcance acotado)

- **Decision**: instalar TypeScript + `react-router-dom` + Tailwind v4
  (`tailwindcss` + `@tailwindcss/vite`), convertir `main.jsx`/`App.jsx` a
  `.tsx` y escribir todo el código nuevo del sprint en `.tsx` estricto.
- **Rationale**: la constitución exige TS y el scaffold actual es JS plano;
  convertir solo el scaffold mínimo + código nuevo evita una reescritura
  grande (no hay más código que el de Vite).
- **Alternatives**: reescaffoldear con `create vite --template react-ts` —
  rechazado porque destruiría el `node_modules` y config ya instalados sin
  beneficio.

## R8. Tailwind v4 ahora; componentes shadcn/ui diferidos al sprint 2

- **Decision**: configurar Tailwind CSS v4 en este sprint para login y layouts;
  copiar componentes shadcn/ui al proyecto recién en el sprint 2, cuando el
  admin de menú los necesite.
- **Rationale**: el sprint 1 solo necesita formularios y layouts simples;
  adelantar la copia de shadcn/ui añadiría archivos sin uso. Tokens de diseño:
  `.stitch/DESIGN.md` **no existe** en el repo, así que se usa un tema mínimo
  local y su definición completa queda para el pulido del sprint 5.
- **Alternatives**: Tailwind v3 — rechazado (v4 es la vía actual con Vite y
  menos configuración); copiar shadcn/ui ya — rechazado por YAGNI.

## R9. Validación manual sin librerías + envelope de errores único

- **Decision**: validación de entrada con funciones propias en
  `backend/src/utils/validate.ts` (correo, longitud mínima de contraseña,
  rol permitido) y envelope `{ "error": { "code": "STRING_SNAKE",
  "message": "texto claro" } }` con códigos HTTP correctos; jamás stack
  traces al cliente, log interno sin datos sensibles.
- **Rationale**: los formularios de auth son pocos campos; `zod`/Joi serían
  dependencia innecesaria. El envelope cumple el principio VI desde el día 1.
- **Alternatives**: `zod` — reconsiderar solo si la validación del sprint 3
  (pedidos) se vuelve compleja; queda registrado.
