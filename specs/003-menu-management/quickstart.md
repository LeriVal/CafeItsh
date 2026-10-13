# Quickstart: Gestión y Consulta de Menú (Sprint 2)

**Feature**: `specs/003-menu-management/` | **Date**: 2026-10-13

Requiere el Sprint 1 corriendo (sesión, roles, BD migrada).

## 1. Verificar base

```bash
cd backend
npm run db:migrate   # 001–003 ya aplicadas, sin pendientes
```

El seed 002 ya dejó platillos de ejemplo y menú de hoy.

## 2. Correr

```bash
npm run dev          # http://localhost:3000
cd ../frontend && npm run dev   # http://localhost:5173
```

## 3. Verificación y demo (traza a SC-001…SC-005)

```bash
cd backend && npm test && npm run typecheck
cd ../frontend && npm test && npm run typecheck
```

Demo manual: como admin, crear un platillo, agregarlo al menú de hoy con
precio y especial, cambiar su precio y marcarlo no disponible; como cliente,
abrir `/menu` y comprobar reflejo inmediato, distintivo de especial y estilo
no seleccionable; intentar duplicar la línea y usar precio 0 (rechazos
claros); consultar un día sin menú (mensaje claro); intentar gestionar como
cliente (403).
