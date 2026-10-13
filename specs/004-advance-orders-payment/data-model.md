# Data Model: Pedido Anticipado y Pago (Sprint 3)

**Feature**: `specs/004-advance-orders-payment/` | **Date**: 2026-10-13

Sin cambios de esquema. Uso fijado para este sprint.

## Pedido anticipado (existente)

`pedido(id, numero UNIQUE, tipo='anticipado', estado_id, usuario_id NOT NULL,
cliente_nombre NULL, fecha_recoleccion NOT NULL ≥ ahora+10min, total
congelado, creado_por=usuario_id, creado_en, actualizado_en)`.

- `numero`: `A-AAAAMMDD-NNNN` (R6), generado tras el INSERT (update en la
  misma transacción).
- `total`: suma de subtotales con aritmética de centavos (R3).
- Nace en `Pendiente`; solo `Pagado` lo habilita para cocina (sprint 4).

## Detalle (existente)

`pedido_detalle(pedido_id, menu_dia_id, cantidad 1–20, precio_unitario
congelado de la línea, subtotal)`. Una fila por línea del menú (sin
duplicados en el mismo pedido).

## Pago (existente)

`pago(pedido_id UNIQUE, metodo='online', monto=total, referencia única del
proveedor, registrado_por=cliente, fecha)`. Uno por pedido: el UNIQUE impide
doble cobro a nivel de datos además del lock (R5).

## Estados y transiciones (existente, por datos)

`estado_pedido` + `transicion_estado` (sprint: `Pendiente→Pagado`) +
`pedido_estado_historial` (quién/cuándo/cambio). `cambiarEstado` valida la
transición y rechaza terminales (`Entregado`, `Cancelado`) y saltos.
