# Contracts: Mostrador, Cocina y Transiciones (Sprint 4)

**Feature**: `specs/005-counter-kitchen/` | **Date**: 2026-10-13

Base `/api`, sesión requerida. Errores con envelope.

## POST /api/pedidos/mostrador — captura con cobro (cajero, admin)

Request `{ "items": [{ "menuDiaId", "cantidad" }], "clienteNombre"?,
"montoRecibido": 100 }`.

- 201 → `{ "pedido": { "id", "numero": "M-20261013-0001", "estado":
  "Pagado", "total": "65.00", "detalle": [...] }, "cambio": "35.00" }`
- 400 (líneas inválidas/no disponibles, monto < total, sin items).

## GET /api/cocina/cola — cola activa (cocinero, admin)

- 200 → `{ "pedidos": [{ "id", "numero", "tipo", "estado", "cliente",
  "esperaMinutos", "creadoEn", "lineas": [{ "nombre", "cantidad }] }] }`
  ordenados por llegada. 403 otros roles.

## GET /api/caja/listos — por entregar (cajero, admin)

- 200 → pedidos `Listo` de ambos orígenes con folio, cliente, total y espera.

## PATCH /api/pedidos/:id/estado — transición (según matriz R3)

Request `{ "estado": "En preparación" | "Listo" | "Entregado" | "Cancelado" }`.

- 200 → pedido actualizado. 403 rol sin permiso; 409 transición inválida o
  pedido cerrado; 404 si no existe o no es visible al rol.
