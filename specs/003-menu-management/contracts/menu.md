# Contracts: Platillos y Menú (Sprint 2)

**Feature**: `specs/003-menu-management/` | **Date**: 2026-10-13

Base `/api`, sesión con `Authorization: Bearer`. Mutaciones solo
`administrador` (403 en otro caso, 401 sin sesión). Errores con envelope
`{ error: { code, message } }`.

## GET /api/platillos — catálogo (cualquier sesión)

Query `?activos=true|false` (opcional). 200 →
`{ "platillos": [{ "id": 1, "nombre": "Gordita de chicharrón",
"categoria": "Comida", "descripcion": "...", "activo": true }] }`.

## POST /api/platillos — crear (admin)

Request `{ "nombre", "categoria?", "descripcion?" }`. 201 con el platillo.
400 `VALIDATION_ERROR` (nombre vacío o >100).

## PATCH /api/platillos/:id — editar/desactivar (admin)

Permite `nombre`, `categoria`, `descripcion`, `activo`. 200 con el platillo;
404 `NOT_FOUND` si no existe.

## GET /api/menu — menú de una fecha (cualquier sesión)

Query `?fecha=YYYY-MM-DD` (opcional; defecto hoy Mx). 200 →
`{ "fecha": "2026-10-13", "lineas": [{ "id": 9, "precio": "35.00",
"disponible": true, "especial": true,
"platillo": { "id": 1, "nombre": "...", "categoria": "Comida",
"descripcion": "..." } }] }`. Fecha inválida → 400. Sin líneas → 200 con
`lineas: []` (el frontend muestra el mensaje de "sin menú", FR-008).

## POST /api/menu — agregar línea (admin)

Request `{ "fecha?", "platilloId", "precio", "disponible"?, "especial?" }`.
201 con la línea. 400 (precio ≤ 0, fecha inválida, platillo inactivo o
inexistente); 409 `DUPLICADO` si el platillo ya está esa fecha.

## PATCH /api/menu/:id — modificar línea (admin)

Permite `precio (>0)`, `disponible`, `especial`. 200 con la línea; 404 si no
existe.

## DELETE /api/menu/:id — quitar línea (admin)

204 si se elimina; 404 si no existe; 409 `REFERENCIADO` si un pedido la usa.
