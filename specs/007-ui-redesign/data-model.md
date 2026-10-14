# Data Model: Rediseño UI por Rol (Sprint 6)

**Feature**: `specs/007-ui-redesign/` | **Date**: 2026-10-14

Sin cambios de esquema. Único cambio de lectura: `colaCocina` suma
`fechaRecoleccion` (ISO o null).

## Estado local nuevo

- **Carrito persistente**: `CartItem[]` en `localStorage[itsh.cart]` con
  validación de forma al hidratar.
- **Captura de caja**: `CapturaContext` efímero (items, cliente, montos) solo
  bajo `/caja/*`.
- **Filtros**: texto + categoría, estado efímero por pantalla.
- **Drawer**: abierto/cerrado, efímero.
