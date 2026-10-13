# Quickstart: Fundamentos y Autenticación (Sprint 1)

**Feature**: `specs/002-foundation-auth/` | **Date**: 2026-10-13

## Requisitos

Node.js 20 LTS (verificado `v20.20.2`) y MySQL 8.0 accesible en local.

## 1. Configurar entorno (secretos fuera del repo)

```bash
cp backend/.env.example backend/.env
# Editar backend/.env: DATABASE_URL, JWT_SECRET (cadena larga aleatoria),
# BCRYPT_COST=10, ADMIN_EMAIL/ADMIN_PASSWORD, CAJA_EMAIL/CAJA_PASSWORD,
# COCINA_EMAIL/COCINA_PASSWORD
```

Nunca commitear `backend/.env` (ya ignorado). Los valores por defecto del
`.env.example` son solo para desarrollo local.

## 2. Base de datos

```bash
cd backend
npm install
npm run db:migrate   # aplica migrations/*.sql en orden, idempotente
npm run db:seed      # crea admin/cajero/cocinero desde las variables de entorno
```

## 3. Correr en desarrollo

```bash
npm run dev          # backend con tsx (http://localhost:3000)
cd ../frontend
npm install
npm run dev          # frontend Vite (http://localhost:5173)
```

## 4. Verificación y demo (traza a SC-001…SC-005)

```bash
cd backend && npm test && npm run typecheck
cd ../frontend && npm test && npm run typecheck
```

Demo manual: iniciar sesión con cada cuenta operativa y verificar que llega a
su módulo; abrir un módulo sin sesión (redirige a `/login`); entrar con rol
ajeno (acceso denegado); registrar un cliente y confirmar que solo ve módulos
de cliente; desde admin, crear → editar → deshabilitar un cajero y comprobar
que ya no accede; intentar login con contraseña errónea y confirmar el mensaje
genérico.
