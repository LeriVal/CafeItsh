# Trazabilidad — Inicio de sesión (Sprint 1) y Caja (Sprints 4 y 6)

Criterio EARS → commit → prueba. Los criterios están en
`specs/002-foundation-auth/spec.md` y `specs/005-counter-kitchen/spec.md`
(sección «Criterios de aceptación en EARS»). Salidas completas de las pruebas
en `pruebas-backend-vitest.txt` y `pruebas-frontend-vitest.txt`.

## Inicio de sesión (spec 002)

| Criterio | Commit | Prueba |
|---|---|---|
| EARS-001 login válido → 200 + JWT 8 h | c1bf49b | `backend/tests/integration/auth.test.ts` «200 + token con credenciales válidas» |
| EARS-002 401 genérico | c1bf49b | `auth.test.ts` «401 genérico con contraseña errónea» y «…con cuenta inexistente» |
| EARS-003 registro crea rol `usuario` | c1bf49b | `auth.test.ts` «201 crea cliente con rol usuario aunque se pida otro rol» |
| EARS-004 contraseña corta / correo duplicado | c1bf49b | `auth.test.ts` «400 con datos inválidos» y «409 con correo duplicado» |
| EARS-005 sin sesión → /login | 6a51261 | `frontend/tests/protected-route.test.tsx` «sin sesión redirige a /login» |
| EARS-006 rol ajeno → denegado | 6a51261 | `protected-route.test.tsx` «con rol ajeno muestra denegación»; `guardias.test.ts` «403 con rol insuficiente» |
| EARS-007 cuenta deshabilitada o rol cambiado → 401 | c1bf49b | `backend/tests/integration/guardias.test.ts` (2 pruebas T020) |
| CORS solo para el origen del frontend | ed97e69 | `backend/tests/integration/cors.test.ts` |

## Caja (spec 005 y 007)

| Criterio | Commit | Prueba |
|---|---|---|
| EARS-001 pedido de mostrador `Pagado`, folio `M-`, cambio | ca031ca | `mostrador.test.ts` «201 nace Pagado con folio M, pago efectivo y cambio» |
| EARS-002 monto insuficiente → 400 | ca031ca | `mostrador.test.ts` «monto insuficiente 400 sin crear» |
| EARS-003 platillo no disponible → 400 | ca031ca | `mostrador.test.ts` «no disponible 400» |
| EARS-004 cola ordenada, ambos orígenes | ca031ca | `cocina.test.ts` «ambos orígenes ordenados por llegada con detalle; Pendiente excluido» |
| EARS-005 actualización en ≤ 10 s | 7a1c477 | Sin prueba automática; `SONDEO_MS = 10_000` en `frontend/src/lib/operacion.ts` |
| EARS-006 transiciones por rol | ca031ca | `cocina.test.ts` «cocinero no puede entregar (403) y salto se rechaza (409)» |
| EARS-007 entregas con Entregar/Cancelar | ca031ca, d2cc55f | `cocina.test.ts` «cajero entrega Listo y cancela pre-entrega…»; `frontend/tests/caja-nueva.test.tsx` «entregas listan con entregar y cancelar» |
| Catálogo, resumen y ticket (rediseño) | d2cc55f | `caja-nueva.test.tsx` «catálogo filtra…», «resumen desglosa y cobra en un paso con ticket» |
| Búsqueda por folio y detalle | 9395140 | `caja-nueva.test.tsx` «buscar por folio muestra detalle y estado» |
| Subrutas `/caja/*` sin 404 | 3844f19 | `frontend/tests/app-routes.test.tsx` (regresión) |
