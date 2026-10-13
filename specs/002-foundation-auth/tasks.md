# Tasks: Fundamentos y Autenticación (Sprint 1)

**Input**: Design documents from `/specs/002-foundation-auth/` (plan.md,
spec.md, research.md, data-model.md, contracts/, quickstart.md)

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/

**Tests**: Incluidas (la constitución exige pruebas en autenticación/autorización
y los criterios del sprint piden `npm test` en verde). Enfoque TDD: cada tarea
de test se escribe primero y MUST fallar antes de implementar.

**Organization**: Tareas agrupadas por historia de usuario (US1–US4 de la spec
del sprint) para implementación y demo independientes.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: paralelizable (archivos distintos, sin dependencias)
- **[Story]**: historia a la que pertenece (US1–US4); Setup/Foundation sin etiqueta

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Renombrado a estructura canónica e inicialización TS de ambos lados

- [ ] T001 Renombrar `fronted/` → `frontend/` con `git mv`, actualizar `name`
  en `frontend/package.json` y verificar `npm run dev` sigue arrancando (R1)
- [ ] T002 [P] Inicializar backend TS: instalar `express mysql2 jsonwebtoken
  bcryptjs dotenv` + dev `typescript tsx vitest @types/express
  @types/jsonwebtoken @types/bcryptjs @types/node`; crear `backend/tsconfig.json`
  y scripts `dev/build/start/test/typecheck/db:migrate/db:seed`
- [ ] T003 [P] Inicializar frontend TS+router+Tailwind: instalar
  `react-router-dom tailwindcss @tailwindcss/vite` + dev `typescript vitest`;
  crear `frontend/tsconfig.json`, pasar `vite.config.js` → `vite.config.ts`
  con plugin Tailwind, convertir `src/main.jsx`→`main.tsx` y `src/App.jsx`→
  `App.tsx`, importar Tailwind en `src/index.css`
- [ ] T004 [P] Crear `backend/.env.example` (DATABASE_URL, JWT_SECRET,
  JWT_EXPIRES_IN, BCRYPT_COST, credenciales seed) y verificar `.gitignore`
  ignora `backend/.env` en ambos paquetes
- [ ] T005 Crear `migrations/003_schema_migrations.sql` y
  `backend/scripts/migrate.ts`; verificar `npm run db:migrate` aplica
  001→003 sobre BD limpia y es idempotente en segunda corrida (R5)

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Base de datos, auth framework y manejo de errores antes de
cualquier historia

**CRITICAL**: Ninguna historia inicia hasta completar esta fase

- [ ] T006 Crear `backend/src/db/pool.ts` (pool `mysql2/promise` desde
  `DATABASE_URL`, error claro si falta la variable)
- [ ] T007 Crear `backend/src/utils/validate.ts` (correo, contraseña ≥8,
  nombre no vacío, rol permitido) + `backend/src/middlewares/errorHandler.ts`
  (envelope `{error:{code,message}}`, sin stack traces) (R9)
- [ ] T008 [P] Implementar `backend/src/services/auth.ts` (hash/compare
  bcryptjs, `signToken`/`verifyToken` con `sub/rol/exp`) (R3, R4)
- [ ] T009 [P] Implementar `backend/src/middlewares/requireAuth.ts`
  (401 sin token/inválido/expirado/usuario inactivo) y
  `requireRole.ts` (403 rol insuficiente)
- [ ] T010 Crear `backend/scripts/seed-users.ts` (crea admin/cajero/cocinero
  desde env, hashes bcryptjs, se niega en producción sin confirmación) y
  verificar `npm run db:seed` + login posterior (R6)
- [ ] T011 Crear `backend/src/app.ts` (express, JSON, `/api/health`, montaje
  de rutas, errorHandler al final) verificable con `npm run dev`

**Checkpoint**: Foundation lista — historias US1–US4 pueden implementarse en
orden de prioridad (o en paralelo si hay capacidad)

---

## Phase 3: User Story 1 - Inicio de sesión por rol (Priority: P1) — MVP

**Goal**: Login con redirección a su módulo por rol y consulta de sesión

**Independent Test**: login de cada rol llega a su módulo; contraseña errónea
muestra mensaje genérico (SC-001, SC-005)

### Tests for User Story 1

> Escribir primero; verificar que FALLAN antes de implementar.

- [ ] T012 [P] [US1] Test unitario `backend/tests/unit/auth.test.ts`
  (hash/verify, claims `sub/rol/exp`, token expirado rechazado)
- [ ] T013 [P] [US1] Test integración `backend/tests/integration/auth.test.ts`
  (login 200 + token, credenciales erróneas 401 genérico, `GET /api/auth/me`
  200/401)

### Implementation for User Story 1

- [ ] T014 [US1] Implementar `backend/src/services/auth.ts` (login: buscar por
  correo, comparar hash, validar activo) + `controllers/auth.ts` +
  `routes/auth.ts` (`POST /login`, `GET /me`) y montar en `app.ts`
  (depende de T012, T013)
- [ ] T015 [US1] Frontend `frontend/src/lib/auth.tsx` (AuthContext, guardado de
  token, cliente API con `Authorization`) + `pages/auth/Login.tsx` con
  redirección por rol (`administrador`→`/admin`, `cajero`→`/caja`,
  `cocinero`→`/cocina`, `usuario`→`/menu`)
- [ ] T016 [US1] Layouts por rol + esqueleto de rutas en `App.tsx`
  (`/login`, `/admin`, `/caja`, `/cocina`, `/menu`, `/mis-pedidos`; módulos
  fuera del sprint con placeholder "Disponible en próximos sprints")

**Checkpoint**: US1 funcional y testeable de extremo a extremo sin lo demás

---

## Phase 4: User Story 2 - Rutas protegidas por sesión y rol (Priority: P1)

**Goal**: Sin sesión → `/login`; con otro rol → denegado con mensaje claro

**Independent Test**: acceso directo sin sesión y con rol ajeno (SC-002, SC-003)

### Tests for User Story 2

- [ ] T017 [P] [US2] Tests contrato 401/403 en
  `backend/tests/integration/auth.test.ts` (ruta protegida sin token → 401,
  con rol insuficiente → 403, envelope sin detalles internos)
- [ ] T018 [P] [US2] Test frontend `frontend/tests/protected-route.test.ts`
  (sin sesión redirige a `/login`; rol ajeno muestra denegación)

### Implementation for User Story 2

- [ ] T019 [US2] Crear `frontend/src/components/ProtectedRoute.tsx` +
  `pages/auth/AccessDenied.tsx` y envolver las 5 rutas de rol en `App.tsx`
  (depende de T018)
- [ ] T020 [US2] Verificar expiración/desactivación: backend revalida
  `activo` y rol en cada petición (data-model) + prueba manual de quickstart
  §4 con token expirado y cuenta deshabilitada

**Checkpoint**: US1 + US2 verificadas; la seguridad del sprint queda cerrada

---

## Phase 5: User Story 3 - Registro de clientes (Priority: P2)

**Goal**: Alumnos/docentes se autorregistran como `usuario` e inician sesión

**Independent Test**: registro válido → login → solo módulos cliente; correo
duplicado o rol inyectado se rechazan (spec US3)

### Tests for User Story 3

- [ ] T021 [P] [US3] Tests integración registro en
  `backend/tests/integration/auth.test.ts` (201 + rol forzado a `usuario`
  aunque se envíe otro, 409 duplicado, 400 datos inválidos)

### Implementation for User Story 3

- [ ] T022 [US3] Implementar `POST /api/auth/register` (normaliza correo,
  hash, rol forzado `usuario`, ignora+loguea rol inyectado) (depende de T021)
- [ ] T023 [US3] Crear `frontend/src/pages/auth/Register.tsx` (formulario,
  mensajes claro de duplicado/inválido, redirección a `/login` tras éxito)

**Checkpoint**: US3 independiente; base de clientes lista para sprint 2

---

## Phase 6: User Story 4 - Gestión de usuarios operativos (Priority: P2)

**Goal**: Admin crea, edita y deshabilita cajeros/cocineros

**Independent Test**: crear → login del operativo → editar → deshabilitar →
ya no accede (SC-004)

### Tests for User Story 4

- [ ] T024 [P] [US4] Tests integración en
  `backend/tests/integration/usuarios.test.ts` (admin lista/crea/edita/
  deshabilita; no-admin → 403; crear con rol `administrador` → 400;
  autodesactivación del último admin → 400)

### Implementation for User Story 4

- [ ] T025 [US4] Implementar `backend/src/services/usuarios.ts` +
  `controllers/usuarios.ts` + `routes/usuarios.ts` (`GET/POST/PATCH
  /api/usuarios`, respuestas sin `password_hash`, regla último-admin)
  (depende de T024)
- [ ] T026 [US4] Crear `frontend/src/pages/admin/Usuarios.tsx` (tabla con
  filtro por rol/estado, crear, editar rol, habilitar/deshabilitar) enlazada
  desde el layout de `/admin`

**Checkpoint**: Todas las historias funcionalmente independientes

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: Verde total, demo y cierre del sprint

- [ ] T027 [P] Dejar `npm test` y `npm run typecheck` en verde en backend y
  frontend; corregir o justificar cada fallo
- [ ] T028 Ejecutar `quickstart.md` §4 completo (BD limpia → migrate → seed →
  dev → demo manual SC-001…SC-005) y corregir desvíos
- [ ] T029 Auto-revisión de seguridad: grep de secretos en el código,
  respuestas sin `password_hash`, mensajes genéricos, costo bcrypt por env,
  `NODE_ENV=production` bloquea seed (R6)
- [ ] T030 Marcar Sprint 1 como completado en `docs/sprints.md` solo tras demo
  aprobada por la patrocinadora

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: sin dependencias; T001 primero (el resto asume
  `frontend/`). T002–T004 en paralelo tras T001; T005 tras T002.
- **Foundational (Phase 2)**: tras Setup; BLOQUEA todas las historias.
  T008/T009 en paralelo; T010 tras T006+T008; T011 tras T006+T007.
- **User Stories (Phases 3–6)**: tras Foundation; orden recomendado
  US1 → US2 → US3 → US4 (P1 antes que P2). US3/US4 podrían paralelizarse con
  US1/US2 si hay capacidad, pues tocan archivos distintos.
- **Polish (Phase 7)**: tras completar las 4 historias.

### Within Each User Story

- Tests primero y en rojo antes de implementar (T012/T013 → T014, etc.).
- Servicios antes que controladores/rutas; backend antes que integración
  frontend de la misma historia.

### Parallel Opportunities

- T002, T003, T004 entre sí; T008 con T009; T012 con T013; T017 con T018;
  T021 con T024 (distintos archivos de test); T027 con T029.

---

## Implementation Strategy

### MVP First (US1 + US2)

1. Completar Setup + Foundational. 2. Completar US1 → validar login por rol.
3. Completar US2 → validar protección. 4. **STOP y DEMO parcial de seguridad**.

### Incremental Delivery

Foundation → US1 (MVP auth) → US2 (cierre seguridad) → US3 (clientes) →
US4 (operativos) → Polish → **demo del sprint** (criterios de `docs/sprints.md`
Sprint 1) → marcar completado.

### Scope Guard

Si surge menú/pedidos/pagos/notificaciones durante la implementación: NO
implementar; anotar como intent diferido y actualizar primero la spec maestra
001 según reglas de trazabilidad.
