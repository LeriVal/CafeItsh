# Contracts: Pedidos y Pagos (Sprint 3)

**Feature**: `specs/004-advance-orders-payment/` | **Date**: 2026-10-13

Base `/api`, sesión requerida. Anticipados: dueño (`usuario`) o
`administrador`. Errores con envelope. Cualquier campo de tarjeta
(`tarjeta`, `numeroTarjeta`, `cvv`, `pan`, `vencimiento`) en el body → 400
`CARD_DATA_FORBIDDEN` (FR-006).

## POST /api/pedidos — crear anticipado (usuario)

Request `{ "items": [{ "menuDiaId": 9, "cantidad": 2 }], "fechaRecoleccion":
"2026-10-13T14:30:00" }`.

- 201 → `{ "pedido": { "id", "numero": "A-20261013-0001", "estado":
  "Pendiente", "total": "70.00", "fechaRecoleccion": "...",
  "detalle": [{ "menuDiaId", "nombre", "cantidad", "precioUnitario",
  "subtotal" }] } }`
- 400 `VALIDATION_ERROR` (vacío, cantidad inválida, línea inexistente/no
  disponible, anticipación <10 min, fecha inválida); nunca crea el pedido.

## GET /api/pedidos/:id — detalle (dueño o admin)

- 200 → pedido con detalle, estado, total, recogida y (si hay) referencia de
  pago. Nunca expone datos de otros clientes (403/404 sin distinguir).

## POST /api/pedidos/:id/pagar — pagar (dueño o admin)

Request `{}` (el monto lo determina el servidor).

- 200 → `{ "pedido": { ... "estado": "Pagado" }, "pago":
  { "referencia": "SIM-..." } }`
- 400 pago rechazado por el proveedor (sigue `Pendiente`, reintentable).
- 409 `INVALID_TRANSITION` si ya no está `Pendiente` (doble pago incluido).
- 403/404 si no es suyo.
