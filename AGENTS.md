# AGENTS.md — Cafetería ITSH (pedidos anticipados)

## Shell

- Windows + PowerShell 5: no existe `&&` ni `head`. Encadenar con `;`.
- El frontend vive en `frontend/` (el viejo `fronted/` ya se renombró; no revivirlo).

## Comandos (desde su paquete)

- Backend (`backend/`): `npm run dev` (:3000), `npm test`, `npm run typecheck`, `npm run build`.
- Frontend (`frontend/`): `npm run dev` (:5173), `npm test`, `npm run typecheck`, `npm run build`.
- Orden de verificación: `typecheck` → `test` → `build`.
- Un solo archivo de test: `npm test -- <ruta>` (vitest filtra por nombre).
- `.env` solo se carga si el CWD es `backend/` (`import 'dotenv/config'`); `tsx -e` no lo carga.

## Base de datos

- MySQL 8.0 local: servicio `MySQL80`, `cafe_admin` / `cafeContra`, BD `cafe_itsh` (ver `docs/ejecutar-migraciones.md`).
- Migraciones: `npm run db:migrate` (idempotente, registra en `schema_migrations`). Cuentas operativas: `npm run db:seed` (lee `ADMIN_/CAJA_/COCINA_EMAIL|PASSWORD` del env, no sobrescribe, se niega en producción).
- Todo (pool, runner, CLI manual) en `utf8mb4`: sin esto, `En preparación` y acentos se corrompen y las transiciones devuelven 500. En CLI usar `--default-character-set=utf8mb4`.
- `002_seed_inicial.sql` NO es re-ejecutable: duplica `platillo` (sin UNIQUE en nombre). No correrlo a ciegas; si hay duplicados, conservar `MIN(id)` por nombre.
- Cuentas seed: `admin@` / `caja@` / `cocina@itsh.edu.mx` (`Admin123*`, `Caja123*`, `Cocina123*`). Nunca commitear `backend/.env` (ignorado).

## Backend (`backend/src`)

- Express + `mysql2/promise`, sin ORM. Estructura: `routes/` → `controllers/` → `services/` → `middlewares/`, `utils/`, `db/pool.ts`.
- Importar rutas/módulos SIN extensión (`.ts`/`.tsx` rompe `tsc` con `NodeNext`/`bundler`).
- Errores: siempre envelope `{ error: { code, message } }` vía `AppError`; jamás stack traces al cliente.
- Auth: JWT (`sub`, `rol`, 8 h) + `requireAuth` (revalida firma, expiración, `activo` y rol en cada petición) + `requireRole`. CORS allowlist en `FRONTEND_URL` (coma-separada); sin esto el navegador falla aunque la API esté sana.
- Estados de pedido se validan contra la tabla `transicion_estado` (`cambiarEstado`/`transicionarPedido` con matriz por rol); no hardcodear flujos.
- Pagos: proveedor simulado tras interfaz `ProveedorPago` (sin dinero real); la API rechaza cualquier campo de tarjeta con `CARD_DATA_FORBIDDEN`.
- Tests: `fileParallelism: false` a propósito (un solo MySQL compartido; en paralelo hay interferencia entre archivos). Cada archivo crea sus filas y las borra en `afterAll`. "Hoy" del menú = `America/Mexico_City` en backend.

## Frontend (`frontend/src`)

- React 19 + TS estricto (`noUnusedLocals`), Tailwind v4 (`@theme` en `index.css` con tokens de `docs/DESIGN.md`), React Router. API base: `VITE_API_URL` (defecto `http://localhost:3000`).
- Rutas por rol: `/admin/*` (admin, subrutas `platillos|menu|usuarios`), `/caja`, `/cocina`, `/menu` + `/pedido/*`, `/mis-pedidos` (cliente `usuario`). Proteger con `ProtectedRoute`; redirigir por rol con `ROL_HOME`.
- Tests (Vitest + jsdom): sin `globals: true`, llamar `cleanup()` en `afterEach`; no usar `waitFor` con fake timers; matchers tolerantes a texto dividido en nodos.

## Flujo de trabajo (Spec Kit)

- Fuente de verdad: `.specify/memory/constitution.md` > `docs/sprints.md` > `docs/reglas (1).md`. Specs en `specs/00N-*/` (maestra `001-*`); cada sprint referencia historias/FRs de la maestra, sin funcionalidad nueva sin actualizarla.
- `.specify/feature.json` apunta al sprint activo. Avanzar de sprint implica demo aprobada del anterior (marcar ✅ en `docs/sprints.md`).
- Commits pequeños por capa (`feat(sprintN): ...`); lockfiles SÍ se versionan, `node_modules/` y `.env*` no.
