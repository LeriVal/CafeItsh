# Implementation Plan: Fundamentos y Autenticación (Sprint 1)

**Branch**: `002-foundation-auth` | **Date**: 2026-10-13 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `/specs/002-foundation-auth/spec.md`
(trazable a US6 y FR-001…FR-003 de la spec maestra
`../001-pedidos-anticipados-cafeteria/spec.md`).

**Note**: Este plan se generó con `/speckit.plan`; el diseño detallado vive en
`research.md`, `data-model.md`, `contracts/` y `quickstart.md`. Las tareas de
implementación viven en `tasks.md` (generado con `/speckit.tasks`).

## Summary

Implementar registro e inicio de sesión con correo/contraseña, protección de
rutas por sesión y rol, y gestión de usuarios operativos por el administrador,
sobre la base existente (esquema MySQL completo, backend vacío, scaffold
Vite+React en JS). Enfoque técnico (de `research.md`): renombrar `fronted/` →
`frontend/`, TypeScript estricto en ambos lados con `tsx`, `mysql2` sin ORM,
`bcryptjs`, JWT en `localStorage` para el MVP, corredor de migraciones y seed
de operativos propios, Tailwind v4 ahora y shadcn/ui diferido al sprint 2.

## Technical Context

**Language/Version**: TypeScript 5.x estricto (frontend y backend), Node.js 20
LTS (verificado v20.20.2 en la máquina de desarrollo).

**Primary Dependencies**: backend: `express`, `mysql2`, `jsonwebtoken`,
`bcryptjs`, `dotenv`, `tsx`; frontend: `react 19`, `react-router-dom`,
`tailwindcss` + `@tailwindcss/vite`; dev en ambos: `typescript`, `vitest`.

**Storage**: MySQL 8.0. Esquema existente en `migrations/` (tablas `rol`,
`usuario` ya cubren este sprint) + tabla nueva `schema_migrations` para el
corredor propio (`backend/scripts/migrate.ts`); cuentas operativas vía
`backend/scripts/seed-users.ts` con variables de entorno.

**Testing**: Vitest (unitarias + integración) y `tsc --noEmit` como
`typecheck` en backend y frontend.

**Target Platform**: web responsiva (móvil y escritorio) en local durante el
desarrollo; backend desplegable en hosting gratuito o de bajo costo.

**Project Type**: web application (frontend + backend).

**Performance Goals**: inicio de sesión y navegación entre módulos sin esperas
perceptibles en horario de receso; carga operativa de un plantel (cientos de
clientes, un puñado de operativos concurrentes).

**Constraints**: contraseñas solo como hash; secretos solo en variables de
entorno; sin datos de tarjeta (no aplica aún); errores al cliente con envelope
y mensajes claros, jamás stack traces; cada ruta exige sesión y rol.

**Scale/Scope**: 1 plantel, 4 roles, 6 rutas (`/login`, `/admin`, `/caja`,
`/cocina`, `/menu`, `/mis-pedidos`); sin menú/pedidos/pagos/notificaciones.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- **I. Alcance MVP**: solo US6 + infraestructura auth; menú/pedidos/pagos/notif
  explícitamente fuera (FR-009 de la spec) → PASS.
- **II. Seguridad**: bcrypt, JWT con expiración, `requireAuth`+`requireRole`,
  secretos en env, mensajes genéricos, HTTPS en producción (nota de despliegue)
  → PASS por diseño (verificar en demo SC-005).
- **III. Simplicidad**: estructura plana `routes/controllers/services/
  middlewares/utils`, `mysql2` sin ORM, corredor y seed propios en lugar de
  dependencias, validación manual → PASS; sin capas extra.
- **IV. Rapidez**: login y layouts mínimos con Tailwind base, mínimo de pasos
  → PASS.
- **V. Trazabilidad**: sin pedidos en este sprint → N/A.
- **VI. Validación y errores**: validación backend obligatoria + envelope único
  (R9) → PASS.
- **VII. Viabilidad**: cero costo adicional, todo corre en local → PASS.

**Desviaciones del repo detectadas (hallazgos, se corrigen en este sprint, no
son violaciones del plan)**: carpeta `fronted/` en vez de `frontend/`;
frontend en JS plano sin TS/router/Tailwind; backend sin código; archivo
`.stitch/DESIGN.md` inexistente (tema mínimo local; diseño completo en el
pulido del sprint 5). Re-chequeo post-Phase 1: sin cambios que afecten gates.

## Project Structure

### Documentation (this feature)

```text
specs/002-foundation-auth/
  plan.md              # This file (/speckit.plan command output)
  research.md          # Phase 0 output (/speckit.plan command)
  data-model.md        # Phase 1 output (/speckit.plan command)
  quickstart.md        # Phase 1 output (/speckit.plan command)
  contracts/           # Phase 1 output (/speckit.plan command)
  tasks.md             # Phase 2 output (/speckit.tasks command)
```

### Source Code (repository root)

```text
backend/
  src/
    app.ts                 # express app, /api/health, montaje de rutas, handler de errores
    db/pool.ts             # pool mysql2/promise desde DATABASE_URL
    routes/auth.ts         # /auth/login, /auth/register, /auth/me
    routes/usuarios.ts     # /usuarios (solo administrador)
    controllers/auth.ts
    controllers/usuarios.ts
    services/auth.ts       # hash/compare, sign/verify, registro, login
    services/usuarios.ts   # CRUD operativo, regla último-admin
    middlewares/requireAuth.ts
    middlewares/requireRole.ts
    middlewares/errorHandler.ts
    utils/validate.ts      # validación manual (R9)
  scripts/migrate.ts       # corredor de migraciones (R5)
  scripts/seed-users.ts    # cuentas operativas desde env (R6)
  tests/unit/auth.test.ts
  tests/integration/auth.test.ts
  tests/integration/usuarios.test.ts
  .env.example

migrations/
  003_schema_migrations.sql  # tabla de control del corredor

frontend/                    # renombrado desde fronted/ (R1)
  src/
    pages/auth/Login.tsx
    pages/auth/Register.tsx
    pages/auth/AccessDenied.tsx
    pages/admin/Usuarios.tsx
    pages/caja/Placeholder.tsx | cocina/Placeholder.tsx
    pages/clientes/Placeholder.tsx
    components/ProtectedRoute.tsx
    lib/auth.tsx              # AuthContext, token, cliente API
  tests/                      # login, rutas protegidas

tests/                        # raíz reservada por constitución (sin uso este sprint)
```

**Structure Decision**: Option 2 (web application) del template; se eliminan
las opciones 1 y 3. Única salvedad: el frontend vive hoy en `fronted/` y la
tarea T001 lo renombra a `frontend/` antes de cualquier otro cambio. El
directorio `tests/` raíz se reserva sin uso hasta que un sprint lo necesite.

## Complexity Tracking

Sin violaciones al Constitution Check; nada que justificar.
