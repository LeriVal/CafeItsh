# Contracts: Auth y Usuarios (Sprint 1)

**Feature**: `specs/002-foundation-auth/` | **Date**: 2026-10-13

Base: `/api`. Auth pública sin token; lo demás exige
`Authorization: Bearer <jwt>`. Errores siempre con envelope
`{ "error": { "code": "SNAKE", "message": "texto claro" } }`, sin detalles
internos. Códigos: 200/201 éxito, 400 validación, 401 sin sesión o sesión
inválida, 403 rol insuficiente, 404 inexistente, 409 correo duplicado.

## POST /api/auth/register — registro de clientes (US3)

Request: `{ "nombre": "Ana Pérez", "correo": "ana@itsh.edu.mx",
"password": "mínimo 8 caracteres" }`. El rol se fuerza a `usuario`; si la
petición trae otro rol se ignora (y se registra el intento en el log).

- 201 → `{ "usuario": { "id": 7, "nombre": "Ana Pérez",
  "correo": "ana@itsh.edu.mx", "rol": "usuario" } }`
- 400 `VALIDATION_ERROR` (correo inválido, contraseña corta, nombre vacío)
- 409 `EMAIL_TAKEN` ("Ese correo ya está registrado")

## POST /api/auth/login — inicio de sesión (US1)

Request: `{ "correo": "caja1@itsh.edu.mx", "password": "..." }`.

- 200 → `{ "token": "<jwt>", "usuario": { "id": 2, "nombre": "Caja 1",
  "correo": "caja1@itsh.edu.mx", "rol": "cajero" } }`
- 401 `INVALID_CREDENTIALS` ("Correo o contraseña inválidos") — idéntico para
  cuenta inexistente, contraseña errónea o cuenta deshabilitada.

## GET /api/auth/me — sesión vigente (US1/US2)

- 200 → `{ "usuario": { "id": 2, "nombre": "Caja 1",
  "correo": "caja1@itsh.edu.mx", "rol": "cajero" } }`
- 401 `UNAUTHORIZED` sin token o con token inválido/expirado.

## GET /api/usuarios — listar operativos (US4, solo administrador)

Query opcional `?rol=cajero|cocinero&activos=true`. Respuesta: lista sin
`password_hash`. Otro rol → 403 `FORBIDDEN` ("No tienes acceso a esta función").

## POST /api/usuarios — crear operativo (US4, solo administrador)

Request: `{ "nombre": "...", "correo": "...", "password": "...",
"rol": "cajero | cocinero" }`. Roles `administrador`/`usuario` por esta vía →
400. 201 devuelve el usuario creado (sin hash); 409 si el correo existe.

## PATCH /api/usuarios/:id — editar operativo (US4, solo administrador)

Permite `nombre`, `rol` (cajero/cocinero), `activo`. 200 con el usuario
actualizado; 404 `NOT_FOUND` si no existe; 400 si intenta desactivarse a sí
mismo el último administrador activo (regla de seguridad).
