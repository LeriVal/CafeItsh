# REGISTRO DE EVIDENCIAS Y REPORTE INDIVIDUAL — SDD CON SPEC KIT

> **Borrador generado a partir del repositorio.** Los datos salen del código, los specs y el historial de git (rama `main`, 18 commits, todos de `LeriVal`). Lo marcado con **⚠️ COMPLETAR** necesita algo que solo tú tienes: capturas, enlaces de Jira o tus propias palabras.
>
> El documento junta dos entregables que se solapan:
> - **Parte I**: bloques C, D, E y F del *Registro de Evidencias*. Los bloques A y B ya los tienes llenos en tu .docx.
> - **Parte II**: apartados 0 a 7 de la *Guía de Reporte* (entrega **lunes 19 de octubre, antes de las 14:00 h**).

---

## Datos de la entrega

| Campo | Mi respuesta |
|---|---|
| Alumno | Valeria Herrera Juarez |
| Equipo y proyecto | Sistema de Pedidos Anticipados — Cafetería ITSH (equipo de 5; ver el Registro) |
| Enlace al repositorio | https://github.com/LeriVal/CafeItsh.git |
| Nombre de la rama con todo el proceso | `main` (única rama; 18 commits sin squash ni force-push) ⚠️ ver nota 1 |
| Agente o herramienta de IA que usé | ⚠️ COMPLETAR. En el repo hay comandos de Spec Kit para **opencode** (`.opencode/commands/speckit.*.md`) y trabajaste con Claude Code. Pon las herramientas que de verdad usaste. |

**Notas importantes antes de entregar**

1. **Rama única.** La guía pide "una sola rama con todo el proceso". Tú trabajaste en `main`, así que el requisito se cumple. Pon `main` y verifica que el remoto tenga los 18 commits con `git log origin/main --oneline`.
2. **`tasks.md` sin marcar.** Los 6 `tasks.md` tienen **0 tareas `[x]`**: todas están en `[ ]`, aunque el trabajo está hecho. La guía pide "tareas marcadas conforme las avanzaste". Esto te cuesta puntos en el apartado 5. La solución es un commit nuevo (`docs: marca tareas completadas`) que marque lo hecho. No reescribas historia. Puedo hacerlo cuando quieras.
3. **Nunca se corrió `/speckit.clarify`.** No hay sección *Clarifications* en ningún spec. Para el apartado 2 usa como "ambigüedades resueltas" la conciliación C1–C6 del spec 007 (ver Apartado 2).
4. **Desviaciones de la constitution.** Ya existen en el código; menciónalas tú con honestidad, porque suman:
   - Dice shadcn/ui y `components/ui/`, pero no se usa shadcn. Todo está en Tailwind v4 puro.
   - Dice estructura `database/` y `tests/` en la raíz, pero el proyecto usa `migrations/` y tests dentro de `backend/tests` y `frontend/tests`.
   - Dice `.stitch/DESIGN.md`, pero el archivo real es `docs/DESIGN.md`.

---
---

# PARTE I — Registro de Evidencias (bloques C a F)

> **Mi porción del MVP: Inicio de sesión (US6, Sprint 1) + Caja (US4, Sprints 4 y 6).** La cocina y el menú no son mi porción; solo aparecen como contexto cuando la caja depende de ellos. Las capturas salen de `docs/Proyecto (1).pdf`.

## Bloque C — Spec del proyecto y del MVP (25 pts)

### C1. Historia de mi porción con criterios EARS verificables (10 pts)

**Historia (US6, spec `001`)**: *Como usuario del sistema, quiero iniciar sesión con correo y contraseña y entrar solo a las funciones de mi rol, para que cada persona vea únicamente lo que le corresponde.*

**Historia (US4, spec `001`)**: *Como cajero, quiero capturar pedidos presenciales con cobro en pocos pasos, mientras los pedidos anticipados siguen fluyendo, para no interrumpir el mostrador en el receso.*

| # | Criterio EARS | Dato medible |
|---|---|---|
| E1 | **Cuando** un usuario envíe credenciales válidas, **el sistema debe** iniciar sesión y devolver un token JWT con vigencia de **8 h**, dirigiéndolo a la pantalla de su rol. | HTTP 200 + token; cajero → `/caja`, cocinero → `/cocina`, admin → `/admin`, cliente → `/menu`. |
| E2 | **Si** el correo no existe o la contraseña es incorrecta, **entonces el sistema debe** rechazar el acceso con HTTP 401 y un mensaje genérico que no revele si la cuenta existe. | Mismo mensaje y código en ambos casos (2 tests). |
| E3 | **Cuando** una persona se registre desde "Crear cuenta", **el sistema debe** crear la cuenta con rol `usuario` aunque la petición pida otro rol, exigiendo una contraseña de **mínimo 8 caracteres**. | 201 con rol `usuario`; contraseña < 8 → 400. |
| E4 | **Si** un usuario sin sesión o con rol ajeno abre una ruta protegida, **entonces el sistema debe** redirigirlo a `/login` o mostrar denegación de acceso. | Sin sesión → `/login`; rol ajeno → pantalla "sin acceso"; 401/403 en la API. |
| E5 | **Cuando** el cajero confirme un pedido de mostrador con efectivo mayor o igual al total, **el sistema debe** crear el pedido en estado `Pagado` con folio `M-AAAAMMDD-NNNN` y mostrar el ticket con el cambio. | Folio `M-` + fecha + 4 dígitos (p. ej. `M-20261014-0001`); `cambio = monto − total`; total calculado por el servidor. |
| E6 | **Si** el monto en efectivo es menor que el total, **entonces el sistema debe** rechazar el cobro con HTTP 400 y no crear ningún pedido. | 0 filas nuevas en `pedido`. |
| E7 | **Mientras** existan pedidos en estado `Listo`, **el sistema debe** mostrarlos en Entregas de caja, ordenados por llegada, con las acciones Entregar y Cancelar y un contador. | Contador "Entregas (N)" = N pedidos `Listo`; búsqueda por folio. |
| E8 | **El sistema debe** presentar todo control interactivo de caja con un área táctil de al menos **44 px**. | ≥ 44 px (FR-006 del spec 007). |

> Honestidad: estos E1–E8 están **deducidos del spec y del código**, no escritos así en el spec original. Ver C4 y el Apartado 7: es justo el cambio que propones para el siguiente avance.

### C2. Límites para la IA (5 pts)

| Siempre | Preguntar primero | Nunca |
|---|---|---|
| Leer `constitution.md` y el `spec.md` del sprint antes de codificar | Agregar una dependencia nueva o cambiar el stack | Commitear `backend/.env` ni secretos |
| TDD: escribir el test (rojo) antes de la implementación | Cambiar el esquema de BD o crear una migración | Guardar datos de tarjeta (`CARD_DATA_FORBIDDEN`) |
| Validar entradas en frontend **y** backend | Agregar funcionalidad fuera del MVP (reseñas, inventario, lealtad) | Hacer squash, `push --force` o reescribir historia |
| Errores con el envelope `{ error: { code, message } }` | Cambiar el flujo de estados (`transicion_estado`) | Exponer stack traces al cliente |
| Commits pequeños por capa: `feat(sprintN): …` | Renombrar rutas o endpoints existentes | Hardcodear transiciones de estado en el código |
| Correr `typecheck → test → build` antes de cerrar | Marcar un sprint como ✅ (requiere demo aprobada) | Re-ejecutar `002_seed_inicial.sql` a ciegas (duplica platillos) |
| | | Usar extensión `.ts` en imports; revivir `fronted/` |

*Evidencia: `AGENTS.md` y `.specify/memory/constitution.md` en la raíz del repo.*

### C3. Brief de diseño concreto (5 pts)

Fuente: `docs/DESIGN.md` (tokens) y `desing/diseño-cliente.md`, `diseño-cocina.md`, `diseño-operativo.md`, `diseño-conceptual.md`.

| Elemento | Decisión |
|---|---|
| **Referencias** | Propuestas de diseño por rol en `desing/` (cliente, cocina, operativo), conciliadas con el código en el spec 007. |
| **Paleta** | Fondo `#F6F1E9` (crema), texto `#1C1917`, primario verde `#1E7A46`, secundario `#8A6A4F`, error `#B91C1C`. Estados: Pendiente `#9A3412`, Pagado `#1E7A46`, En preparación `#B45309`, Listo `#0369A1`, Entregado `#166534`, Cancelado `#B91C1C`. |
| **Tipografía** | Plus Jakarta Sans: display 40 px/800, headline 28 px y 20 px/700, más escalas `title`, `body` y `label`. |
| **Componentes** | `AppShell`, `Drawer` (móvil overlay, escritorio fijo), `BottomBar` (cliente y caja, con badges), `StatusBadge`, `ProtectedRoute`; stepper de cantidad, chips de categoría, barra flotante con total. |
| **Estados** | Cargando, vacío, error con reintento, conflicto (409) y retraso en cocina (alerta si pasó la hora de recogida). Los seis estados del pedido se muestran con `StatusBadge`. |
| **Accesibilidad** | Área táctil ≥ 44 px, alto contraste, folios y cifras en tipografía destacada. |

⚠️ Si tu equipo tiene un diseño en Figma o Stitch, agrega el enlace como referencia.

### C4. Spec versionado (5 pts)

| Versión | Qué contiene | Evidencia |
|---|---|---|
| **v1: spec maestra** (13-oct) | 6 historias, 29 FRs, 8 criterios de éxito, bordes y supuestos. Sin Clarifications. | `specs/001-…/spec.md`, commit `bfbb2bf` |
| **v2: specs por sprint** (13-oct) | Cada sprint recorta la maestra con trazabilidad (002 a 006). Sprint 4 = `005-counter-kitchen`. | commits `2cb5a5c`, `5db6d23`, `191b74a` |
| **v3: spec 007** (14-oct) | Añade las **decisiones de conciliación C1–C6** frente a `desing/` (ver abajo). | commit `d2cc55f` |

**Lo que cambió en v3 (doc contra código):**
- C1: cantidad máxima por línea **20**, no 99.
- C2: sondeo cada **10 s**, no 4 s.
- C3: se conservan las rutas actuales.
- C4: sin "cancelar pedido" de cliente.
- C5: carrito persistente (nuevo).
- C6: se expone la hora de recogida en la cola de cocina (único cambio backend).

La constitution sigue en v1.0.0 (ratificada 2026-10-13).

---

## Bloque D — Implementación del MVP (30 pts)

### D1. MVP funcionando (12 pts)

**Capturas de mi porción** (archivos en `docs/evidencias/`; ya están insertadas abajo):

| Captura | Archivo | Criterio que demuestra |
|---|---|---|
| Inicio de sesión: «Cafetería ITSH», correo, contraseña, *Entrar* y «¿Eres alumno o docente? Crea tu cuenta» | `captura-login.png` | E1, E2, E4 |
| Crear cuenta: nombre, correo, «Contraseña (mínimo 8 caracteres)» | `captura-registro.png` | E3 |
| Inicio de Caja: *Capturar pedido* y *Entregas (3 por entregar)*, con el drawer | `captura-caja-inicio.png` | E7, E8 |
| Nuevo pedido: buscador, chips y catálogo con precios y *Especial* | `captura-caja-nuevo-pedido.png` | E5 (captura) |
| Entregas (3): búsqueda por folio, `A-…` y `M-20261014-0001`, con *Entregar* y *Cancelar* | `captura-caja-entregas.png` | E5, E7 |
| Cocina con el pedido `M-20261014-0001` (origen *Mostrador*) | `captura-cocina-pedido-mostrador.png` | Contexto: el pedido capturado en caja llega a cocina |

![Inicio de sesión](evidencias/captura-login.png)
![Crear cuenta](evidencias/captura-registro.png)
![Inicio de caja](evidencias/captura-caja-inicio.png)
![Nuevo pedido](evidencias/captura-caja-nuevo-pedido.png)
![Entregas](evidencias/captura-caja-entregas.png)
![Cocina](evidencias/captura-cocina-pedido-mostrador.png)

**Estado verificado hoy (18-oct-2026):**

| Suite | Resultado |
|---|---|
| Backend `npm test` | **12 archivos, 77 tests: todos pasan** |
| Frontend `npm test` | **10 archivos, 32 tests: todos pasan** |
| `npm run typecheck` (ambos) | Sin errores |

⚠️ **Falta una captura**: el **resumen de cobro** y el **ticket con folio y cambio** (E5), y el rechazo por monto insuficiente (E6). Ya hay platillos en el menú de hoy, así que: entra como `caja@itsh.edu.mx`, agrega platillos, cobra con efectivo mayor al total y toma la captura del ticket; después prueba con un monto menor.

### D2. Commits atómicos (6 pts)

Enlace al historial filtrado: `https://github.com/LeriVal/CafeItsh/commits/main/?author=LeriVal`

**Commits de mi porción:**

| Commit | Qué hace | Porción |
|---|---|---|
| `c1bf49b` | feat(sprint1): backend auth con JWT, usuarios operativos y corredor de migraciones | Inicio de sesión (back) |
| `6a51261` | feat(sprint1): frontend con login, rutas por rol y admin de operativos | Inicio de sesión (front) |
| `ed97e69` | fix(sprint1): CORS solo para el origen del frontend | Inicio de sesión (el login fallaba sin esto) |
| `ca031ca` | feat(sprint4): mostrador, cola de cocina, entregas y matriz de permisos | Caja (back) |
| `7a1c477` | feat(sprint4): páginas de caja y cocina con sondeo | Caja (front) |
| `d2cc55f` | feat(sprint6): rediseño UI por rol con drawer, bottom bar y caja en subrutas | Caja rediseñada |
| `9395140` | feat(caja): buscar por folio, detalle en entregas, quitar en resumen y avisos | Caja |
| `3844f19` | fix(caja): subrutas `/caja/*` resolvían a 404 + test de regresión | Caja |

Otros commits del proyecto: `1976cc7` y `523881f` (menú), `89c6fc7` y `9367c41` (pedido y pago), `f9dc931` (seguimiento y avisos).

Los commits están por **capa y sprint** (backend / frontend / docs), no uno por tarea. Dilo así en el reporte y no lo presentes como "un commit por tarea". Con `tasks.md` marcado (nota 2) el mapeo mejora.

### D3. Bitácora de prompts (6 pts)

⚠️ **Ajusta cada prompt a lo que realmente pediste.** No hay bitácora en el repo; esta tabla está reconstruida con el historial.

| Tarea | Prompt resumido | ¿Funcionó? |
|---|---|---|
| Spec y plan del Sprint 1 (auth) | "Especifica login por rol, registro de clientes y usuarios operativos, a partir de la spec maestra" | Sí (`bfbb2bf`) |
| Backend de autenticación | "Implementa login con JWT + bcrypt, `requireAuth` y `requireRole`, con tests primero" | Sí (`c1bf49b`) |
| Frontend de login y rutas por rol | "Crea login, registro y rutas protegidas por rol con React Router" | Sí (`6a51261`) |
| El login fallaba desde el navegador | "El login da error de red aunque la API está sana" → se añadió CORS con allowlist | Sí, tras iteración (`ed97e69`) |
| Spec del Sprint 4 (mostrador) | "Especifica la captura de mostrador y cobro recortando la spec maestra" | Sí (`191b74a`) |
| Pedido de mostrador, cobro y entregas | "Implementa mostrador con folio `M-`, efectivo con cambio y entregas, tests primero" | Sí (`ca031ca`) |
| Página de caja | "Crea la pantalla de caja con captura y cobro" | Sí (`7a1c477`) |
| Rediseño de caja (Sprint 6) | "Aplica el diseño operativo: inicio, catálogo con búsqueda y stepper, resumen y ticket" | Sí (`d2cc55f`) |
| Búsqueda por folio y detalle en entregas | "Agrega búsqueda por folio y partidas en Entregas" | Sí (`9395140`) |
| Las subrutas de caja daban 404 | "Las rutas `/caja/*` fallan, corrige y agrega test" | Sí, tras iteración (`3844f19`) |

### D4. Verificación contra el spec (6 pts)

| Criterio | ¿Cumple? | Evidencia |
|---|---|---|
| E1: credenciales válidas → 200 + JWT; redirección por rol | **Sí** | `backend/tests/integration/auth.test.ts` → *"200 + token con credenciales válidas"*; captura de login (PDF p. 3) |
| E2: 401 genérico con contraseña errónea o cuenta inexistente | **Sí** | `auth.test.ts` → *"401 genérico con contraseña errónea"* y *"…con cuenta inexistente"* |
| E3: registro crea rol `usuario` aunque se pida otro; contraseña ≥ 8 | **Sí** | `auth.test.ts` → *"201 crea cliente con rol usuario aunque se pida otro rol"* y *"400 con datos inválidos"*; captura de Crear cuenta |
| E4: sin sesión → `/login`; rol ajeno → denegación | **Sí** | `frontend/tests/protected-route.test.tsx` (3 tests); `guardias.test.ts` (401/403, cuenta deshabilitada o rol cambiado) |
| E5: pedido de mostrador nace `Pagado`, folio `M-`, cambio | **Sí** | `mostrador.test.ts` → *"201 nace Pagado con folio M, pago efectivo y cambio"*; `caja-nueva.test.tsx` → *"resumen desglosa y cobra en un paso con ticket"*; folio `M-20261014-0001` visible en el PDF |
| E6: monto insuficiente → 400 y sin crear | **Sí** | `mostrador.test.ts` → *"monto insuficiente 400 sin crear"* |
| E7: Entregas lista solo `Listo`, con Entregar/Cancelar y contador | **Sí** | `caja-nueva.test.tsx` → *"entregas listan con entregar y cancelar"*, *"inicio con acciones y contador de entregas"*, *"buscar por folio…"*; captura "Entregas (2)" |
| E8: controles ≥ 44 px | **Parcial** | Clases `min-h-11` en `AppShell`, `Drawer` y `BottomBar`. No hay medición automatizada ni auditoría completa. |

**Pendiente o no cumplido (dilo así en el reporte):**
- Las capturas de login/registro/caja no muestran aún el flujo completo de cobro con platillos (el menú de hoy estaba vacío); falta la captura del ticket.
- **SC-001** (−50 % de espera en caja): no medido, no hay línea base.
- **Pago**: el de mostrador es efectivo; el online es un `SimuladorPago`, no mueve dinero.
- **Demo con la patrocinadora del Sprint 6**: `docs/sprints.md` no lo marca ✅ todavía.
- El login falló al inicio por CORS (corregido en `ed97e69`), y las subrutas de caja daban 404 (corregido en `3844f19`).

---

## Bloque E — Gestión en Jira (10 pts)

Tablero: espacio **CafeITSH1** (Jira). Capturas en `docs/evidencias/`:

![Timeline](evidencias/jira-timeline-sprints.png)
![Backlog sprints 1 a 3](evidencias/jira-backlog-sprints-1-3.png)
![Backlog sprints 3 a 6](evidencias/jira-backlog-sprints-3-6.png)
![Checkpoints](evidencias/jira-backlog-checkpoints.png)

- **E1. Historias a mi cargo (5 pts):** CFITSH-34 *Fundamentos y autenticación* (asignada a Valeria, estado *Listo*), y en el backlog las historias con mi avatar: CFITSH-12 *Setup de pagos* y CFITSH-16 *Polish y cierre* (Sprint 3, *En curso*) y CFITSH-26 *Rediseño caja (US1)* (Sprint 6, *Por hacer*).
  ⚠️ La guía pide la captura **filtrada por tu usuario** y con **tiempo asignado**: usa el filtro de persona en el tablero y registra una estimación en cada historia (hoy todas muestran `-`).
- **E2. Tablero del equipo al día (5 pts):** ⚠️ **Hoy no refleja el avance real.** Jira marca *Por hacer* en «Mostrador (cajero) y cocina» (CFITSH-37), «Seguimiento, notificaciones y pulido» (CFITSH-38) y «Rediseño de interfaz por rol» (CFITSH-39), y los sprints 4 a 6 en *Por hacer*, pero en el repo ya están implementados (commits `ca031ca`, `7a1c477`, `f9dc931`, `d2cc55f`). Con la rúbrica («el tablero debe mostrar el avance real, no uno armado para la entrega») esto puede bajar la calificación a *Parcial*.
  **Recomendación:** pasa a *Listo* lo que ya está hecho (CFITSH-18 captura y cobro, CFITSH-19 cocina, sprint 5 y CFITSH-26 caja salvo el cierre), deja abiertos los *checkpoints* (CFITSH-30 a 33) y el *Polish y cierre*, y toma las capturas de nuevo. Puedo hacerlo yo si me lo autorizas.

## Bloque F — Reflexión individual (10 pts)

> Es un borrador para que lo reescribas **con tus palabras**; el bloque se califica como personal y no debe copiarse.

**F1. Qué le faltó a mi spec y qué cambié (5 pts)**
Mi spec pedía "mínimos pasos" en caja y un acceso "solo a su módulo" en el login, pero sin cifras ni mensajes concretos. Una ambigüedad real: no decía qué mostrar cuando el correo o la contraseña fallaban, y un mensaje distinto revelaría si la cuenta existe. Lo corregí con un criterio medible (E2): mismo 401 y mensaje genérico en ambos casos, y la contraseña mínima de 8 caracteres (E3). En caja fijé el criterio de cobro con folio `M-…` y cambio calculado por el servidor, y 44 px como área táctil mínima.

**F2. Mi siguiente paso (5 pts)**
Cerrar el Sprint 6 con la demo a la patrocinadora y marcarlo ✅ en `docs/sprints.md`. Después, medir la línea base de espera en caja para comprobar SC-001, porque hoy no sé cuánto se reduce el tiempo. También quiero probar la caja con un menú real publicado, ya que mi captura actual tenía el menú vacío.

---

## Lista de verificación antes de entregar
- [ ] Cada elemento tiene enlace, captura o ubicación con mi nombre visible.
- [ ] Los enlaces abren sin pedir permisos (Drive, GitHub y Jira en público o "cualquiera con el enlace").
- [ ] Probé el MVP contra E1–E6.
- [ ] La reflexión del bloque F está escrita con mis palabras.
- [ ] Un compañero revisó mis evidencias y yo las suyas.

---
---

# PARTE II — Reporte individual SDD con Spec Kit

## Apartado 0 — Índice de evidencias (5 pts)

Repositorio: https://github.com/LeriVal/CafeItsh.git · Rama: `main`

| Apartado | Archivo en la rama / commit |
|---|---|
| 1. Contexto y constitution | `.specify/memory/constitution.md` · commit `bfbb2bf` |
| 2. Spec | `specs/001-pedidos-anticipados-cafeteria/spec.md` (`bfbb2bf`) · `specs/007-ui-redesign/spec.md` (`d2cc55f`) |
| 3. Plan técnico | `specs/00N-*/plan.md` y `research.md` (N = 2…7); p. ej. `specs/004-advance-orders-payment/research.md` (`5db6d23`) |
| 4. Base de datos | `migrations/001_crear_esquema.sql`, `003_…`, `004_avisos_leida.sql` · `specs/00N-*/data-model.md` · `c1bf49b` (corredor) |
| 5. Tareas | `specs/00N-*/tasks.md` (⚠️ pendiente de marcar, ver nota 2) |
| 6. Implementación y verificación | `git log` (18 commits) · `backend/tests/`, `frontend/tests/` · `docs/sprints.md` |
| 7. EARS y reflexión | Este documento, Apartado 7 |

Historial: 18 commits lineales, sin merges, squash ni force-push (`git log --oneline` en `main`).

## Apartado 1 — Contexto y constitution (10 pts)

**Proyecto.** Sistema web de pedidos anticipados para la cafetería del Instituto Tecnológico Superior de Huauchinango (ITSH). Resuelve las filas largas y los errores de comunicación verbal en los recesos. Alumnos y docentes consultan el menú, piden y pagan por adelantado (≥ 10 min de anticipación) y reciben aviso cuando su pedido está listo. Cajeros, cocineros y administradores operan el mostrador, la cocina y el menú. No reemplaza el mostrador actual.

**Principios de la constitution (v1.0.0, ratificada 2026-10-13):**

| # | Principio | Por qué |
|---|---|---|
| I | **Alcance MVP primero** (no negociable) | Proyecto académico con tiempo y presupuesto limitados; el desvío de alcance es el mayor riesgo de no entrega. |
| II | **Seguridad por defecto** (no negociable): JWT + roles, hash de contraseñas, secretos en variables de entorno, nunca datos de tarjeta | Se manejan credenciales, pagos y datos de alumnos y docentes. |
| III | **Simplicidad y mantenibilidad**: TypeScript estricto, `routes → controllers → services`, sin ORM | Equipo pequeño con rotación; lo simple se prueba y se mantiene. |
| IV | **Rapidez operativa en receso**: pocos pasos, área táctil ≥ 44 px, alto contraste | Los recesos concentran la demanda; cada segundo en caja y cocina cuenta. |
| V | **Trazabilidad total del pedido**: 6 estados explícitos y anticipación ≥ 10 min | Sin estados visibles no se puede auditar ni probar el progreso. |
| VI | **Validación estricta y errores seguros** (no negociable): validar en front **y** back, sin stack traces | Frontera entre un fallo menor y una corrupción de datos o filtración. |
| VII | **Viabilidad económica**: ejecución local y hosting gratuito o barato | Si no es barato ni rápido, no es adoptable. |

**Stack obligatorio.** React + TypeScript + Vite; Node.js + Express; MySQL 8.0 con integridad referencial; pruebas con Vitest.

**Cumplimiento y desviaciones** (ver nota 4): el stack, la seguridad, los estados y las pruebas se cumplen. No se usa shadcn/ui, y la estructura real (`migrations/`, `backend/tests`) difiere de `database/` y `tests/` de la raíz.

**Evidencia:** `.specify/memory/constitution.md` (194 líneas) y commit `bfbb2bf`.

## Apartado 2 — Spec (15 pts)

**Qué y por qué (spec maestra `001`, sin tecnología):**
- 6 historias: US1 pedido anticipado con pago (P1), US2 seguimiento y aviso de listo (P1), US3 cocina (P1), US4 caja en paralelo (P2), US5 administración de menú (P2), US6 acceso por rol (P3).
- 29 requisitos funcionales (FR-001…029) y 8 criterios de éxito medibles (p. ej. SC-001: −50 % de espera; SC-002: 100 % de anticipados con ≥ 10 min).
- 6 casos límite: pago fallido, platillo agotado entre consulta y confirmación, transición inválida, cancelación tardía, conectividad intermitente, operadores concurrentes.
- Los criterios son escenarios *Given/When/Then* comprobables, y cada sprint los referencia (`docs/sprints.md`).

**Ambigüedades resueltas.** No se usó `/speckit.clarify`. Las resolví a mano en dos momentos:
1. En los specs por sprint: la hora de recogida se mide entre la confirmación y el momento de recogida; un anticipado pide sobre el **menú de hoy** (`004/research.md` R4).
2. En el spec 007, la conciliación **C1–C6** (ver Bloque C4), por ejemplo "cantidad máxima 20, no 99" y "sondeo 10 s, no 4 s".

**Evidencia:** `specs/001-pedidos-anticipados-cafeteria/spec.md` (`bfbb2bf`), `specs/007-ui-redesign/spec.md` (`d2cc55f`) y sus `checklists/requirements.md`.

## Apartado 3 — Plan técnico (15 pts)

**Arquitectura.** Monorepo con `frontend/` (SPA React 19 + Tailwind v4 + React Router 7) y `backend/` (Express 5 + `mysql2/promise`, capas `routes → controllers → services → middlewares/utils`). Auth con JWT (8 h) revalidado en cada petición (`requireAuth`, `requireRole`). CORS con allowlist.

**Decisiones y alternativas descartadas** (de `research.md` de los sprints; ejemplos del Sprint 3):

| Decisión | Alternativa descartada | Por qué |
|---|---|---|
| Sin migración nueva; el esquema ya existía (R1) | Tabla de carritos persistidos | El carrito es estado efímero; persistirlo añade sincronización inútil. |
| Pago tras la interfaz `ProveedorPago` con `SimuladorPago` (R2) | Integrar pasarela real | Cuentas, comisiones y PCI fuera del alcance y del presupuesto. |
| El servidor calcula el total, en centavos enteros (R3) | Aceptar el total del cliente | Riesgo de fraude o error; viola el principio VI. |
| Anticipados sobre el menú de hoy (R4) | Elegir fecha de menú | Fuera del MVP. |
| Estados validados por datos (`transicion_estado`) + `SELECT … FOR UPDATE` al pagar (R5) | `switch` en código; idempotencia sola | El `switch` duplica la tabla y se desincroniza; el lock evita el doble pago. |
| Folio `A-/M-AAAAMMDD-NNNN` con reintento ante colisión (R6) | — | Identificación legible y única. |

Otras decisiones:
- Sondeo cada 10 s en vez de WebSockets, por simplicidad (principio III).
- `mysql2` sin ORM.

**Coherencia con la constitution:** cada plan incluye su *Constitution Check*. **Evidencia:** `specs/00N-*/plan.md` y `research.md`.

## Apartado 4 — Base de datos (15 pts)

**Motor:** MySQL 8.0, `utf8mb4`. Migraciones con corredor idempotente (`npm run db:migrate`, tabla `schema_migrations`).

| Entidad (tabla) | Campos clave y restricciones | Requisito que cubre |
|---|---|---|
| `rol` | `id`, `nombre` (administrador, cajero, cocinero, usuario) | FR-002 |
| `usuario` | `correo` UNIQUE, `password_hash` (bcrypt), `activo`, `rol_id → rol` | FR-001, FR-003 |
| `platillo` | `nombre`, `categoria`, `descripcion`, `activo` | FR-004, FR-005 |
| `menu_dia` | `fecha`, `platillo_id → platillo`, `precio > 0`, `disponible`, `especial`; UNIQUE `(fecha, platillo_id)` | FR-004…008 |
| `estado_pedido` | Catálogo de 6 estados | FR-014 |
| `transicion_estado` | Matriz de transiciones permitidas (por rol) | FR-015, FR-016 |
| `pedido` | `numero` UNIQUE (folio), `tipo` CHECK anticipado/mostrador, `estado_id`, `usuario_id` (NULL en mostrador), `cliente_nombre`, `fecha_recoleccion` (≥ ahora + 10 min), `total`, `creado_por` | FR-009, FR-010, FR-018, FR-019 |
| `pedido_detalle` | `pedido_id`, `menu_dia_id`, `cantidad` 1–20, `precio_unitario` congelado, `subtotal` | FR-009 |
| `pedido_estado_historial` | Quién, cuándo y qué cambio de estado | FR-014 (auditoría) |
| `pago` | `pedido_id` UNIQUE, `metodo` (online/efectivo), `monto`, `referencia` única; sin datos de tarjeta | FR-011, FR-012, FR-013 |
| `notificacion` | `pedido_id`, `tipo='pedido_listo'`, `canal`, `estado_envio`, `leida` (mig. 004) | FR-023 |
| `schema_migrations` | Registro de migraciones aplicadas | Infraestructura (principio III) |

**Evidencia:**
- `migrations/001_crear_esquema.sql`, `002_seed_inicial.sql`, `003_schema_migrations.sql` y `004_avisos_leida.sql`.
- `specs/00N-*/data-model.md`.
- Commits `c1bf49b` (corredor de migraciones) y `f9dc931` (migración 004).

⚠️ **COMPLETAR (opcional pero suma):** un diagrama ER. Lo más rápido es generarlo desde MySQL Workbench (*Database → Reverse Engineer*) sobre `cafe_itsh`. También puedo hacerte uno en Mermaid.

## Apartado 5 — Tareas (10 pts)

Cada sprint tiene su `tasks.md` con fases (Setup → Foundational → una fase por historia), tareas con ID (T001…), marca `[P]` de paralelizable, etiqueta de historia `[US#]`, ruta de archivo y dependencias (p. ej. T005 *"depende de T004"*). Los tests van primero (rojo) en cada historia.

| Sprint | `tasks.md` | Tareas |
|---|---|---|
| 1 | `specs/002-foundation-auth/` | 30 |
| 2 | `specs/003-menu-management/` | 16 |
| 3 | `specs/004-advance-orders-payment/` | 15 |
| 4 | `specs/005-counter-kitchen/` | 15 |
| 5 | `specs/006-order-tracking-notifications/` | 12 |
| 6 | `specs/007-ui-redesign/` | 13 |

⚠️ **Hueco a cerrar:** las 101 tareas están en `[ ]`, ninguna en `[x]` (nota 2). Haz un commit que las marque antes de entregar.

⚠️ **Análisis de consistencia:** no encontré evidencia de que se haya corrido `/speckit.analyze`. Si lo corriste, pon qué encontró; si no, no lo afirmes.

## Apartado 6 — Implementación y verificación (20 pts)

**De tareas a código.** Cada sprint sigue el ciclo *docs (spec, plan, tareas) → feat backend → feat frontend → sprint marcado ✅*:

| Sprint | Docs | Implementación |
|---|---|---|
| 1 Auth | `bfbb2bf` | `c1bf49b` (backend), `6a51261` (frontend), `ed97e69` (fix CORS) |
| 2 Menú | `2cb5a5c` | `1976cc7` (API), `523881f` (admin + consulta) |
| 3 Pedido y pago | `5db6d23` | `89c6fc7` (backend), `9367c41` (front) |
| 4 Caja y cocina | `191b74a` | `ca031ca` (backend), `7a1c477` (front) |
| 5 Seguimiento | — | `f9dc931` |
| 6 Rediseño | en `d2cc55f` | `d2cc55f`, `9395140`, `3844f19` (fix) |

**Verificación (corrida el 18-oct-2026):**
- Backend: 77/77 tests, 12 archivos (auth, avisos, cocina, CORS, folio, guardias, menú, mostrador, pedidos, platillos, usuarios).
- Frontend: 32/32 tests, 10 archivos.
- `typecheck` limpio en ambos.
- Las demos de los Sprints 1–5 están marcadas ✅ el 2026-10-13 en `docs/sprints.md`.
- ⚠️ Adjunta capturas de la salida de `npm test` y de la demo (ver Bloque D1).

**Lo que todavía no cumple:**
- Demo del Sprint 6 aún sin aprobar.
- SC-001 sin medir.
- Pago simulado.
- Aviso solo dentro de la app.
- 44 px sin auditoría automatizada.
- `tasks.md` sin marcar.
- Un bug real: las subrutas `/caja/*` daban 404 y se corrigió después (`3844f19`), con un test de regresión.

## Apartado 7 — EARS y reflexión (10 pts + 5 de bono)

**(a) Qué es EARS (con mis palabras).** EARS (*Easy Approach to Requirements Syntax*) es una forma de redactar requisitos con plantillas fijas para que no sean ambiguos. Cada requisito responde cuándo se activa, quién actúa y qué debe pasar. Tiene cinco patrones:
- **Ubicuo**: "El sistema debe…".
- **Por evento**: "Cuando…, el sistema debe…".
- **Por estado**: "Mientras…, el sistema debe…".
- **Comportamiento no deseado**: "Si…, entonces el sistema debe…".
- **Opcional**: "Donde…, el sistema debe…".

Con esto cada requisito se puede convertir directamente en un test.

**(b) Dos requisitos reescritos**

| Antes (spec) | Después (EARS) |
|---|---|
| FR-001/US6: *"El sistema MUST permitir registro e inicio de sesión con correo electrónico y contraseña."* y *"Credenciales inválidas muestran mensaje claro sin revelar si la cuenta existe."* | **Si** el correo no existe o la contraseña es incorrecta, **entonces el sistema debe** responder HTTP 401 con el mismo mensaje genérico en ambos casos, sin revelar si la cuenta existe. |
| FR-018: *"El cajero MUST poder capturar pedidos presenciales y registrar/gestionar su cobro en el mínimo de pasos."* | **Cuando** el cajero confirme un pedido de mostrador con efectivo mayor o igual al total, **el sistema debe** crear el pedido en estado `Pagado` con folio `M-AAAAMMDD-NNNN` y mostrar el ticket con el cambio, en un solo paso de cobro. |

**(c) Dónde y cuándo lo aplicaré.** En la sección *Acceptance Scenarios* y en los FRs de las specs `002-foundation-auth` (inicio de sesión) y `005-counter-kitchen` / `007-ui-redesign` (caja), que es donde están mis criterios. Lo haré en el siguiente avance, antes de marcar el Sprint 6 como completo: primero reescribo los criterios, luego ajusto los tests para que cada uno apunte a un criterio EARS. ⚠️ Pon la fecha real que te comprometas a cumplir.

**(d) Reflexión.** ⚠️ **Reescribe con tus palabras.** Base:
- *Qué cambié:* la spec maestra era buena en el *qué*, pero débil en lo medible. Cosas como "mínimos pasos" en caja o "mensaje claro" en el login no tenían un número. El rediseño del Sprint 6 me obligó a conciliar el documento de diseño con el código real (C1–C6), y ahí vi que una spec sin cifras deja que cada fuente diga algo distinto.
- *Qué me dejó trabajar la IA:* avanzar los 6 sprints en 2 días con tests primero y trazabilidad spec → plan → tareas → código. Lo que no hizo sola: marcar las tareas, usar `/speckit.clarify` ni medir la línea base. Eso fue disciplina de proceso que me faltó y que ahora corrijo.

**Bono EARS (hasta +5):** hoy **no hay criterios en EARS en el repo** (grep sin resultados), así que no aplica todavía. Si reescribes los criterios en `002`, `005` o `007` y haces un commit **antes del lunes 14:00**, puedes citarlo aquí y reclamar el bono. Puedo hacerlo ahora mismo.

---

## Qué necesito de ti

1. **Una captura más de caja**: catálogo con platillos, resumen y ticket con folio y cambio (pasos en D1). El PDF actual muestra el menú vacío.
2. **Jira**: las dos capturas del Bloque E.
3. **Tus prompts reales** (D3) y qué IA o herramientas usaste.
4. **Decidir si hago estos commits**, que solo tocan documentación (specs y `tasks.md`) y no el código ni los tests, así que no pueden romper la compilación:
   - (a) marcar `[x]` en los 6 `tasks.md`;
   - (b) reescribir criterios en EARS en los specs 002 y 005 (bono);
   - (c) añadir un diagrama ER en Mermaid a `data-model.md`.
