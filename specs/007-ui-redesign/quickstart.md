# Quickstart: Rediseño UI por Rol (Sprint 6)

**Feature**: `specs/007-ui-redesign/` | **Date**: 2026-10-14

Sin migraciones (solo lectura nueva en endpoint existente).

## Correr

```bash
cd backend && npm run dev      # http://localhost:3000
cd ../frontend && npm run dev  # http://localhost:5173
```

## Verificación y demo (traza a SC-001…SC-005)

```bash
cd backend && npm test && npm run typecheck
cd ../frontend && npm test && npm run typecheck && npm run build
```

Demo por rol: cliente (drawer, bottom bar con badge, búsqueda, carrito que
sobrevive recarga, hora mínima inline, folio grande); caja (inicio, catálogo
con stepper, flotante, resumen, ticket, entregas); cocina (contadores, chips,
recoge-hora, retrasado, `Listo` visible); admin (landing con conteos y
resumen). Auditoría 44 px + suites en verde.
