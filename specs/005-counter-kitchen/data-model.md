# Data Model: Mostrador y Cocina (Sprint 4)

**Feature**: `specs/005-counter-kitchen/` | **Date**: 2026-10-13

Sin cambios de esquema. Uso fijado.

## Pedido de mostrador (existente)

`pedido(numero M-AAAAMMDD-NNNN, tipo='mostrador', estado Pagado al nacer,
usuario_id NULL, cliente_nombre opcional ≤100, fecha_recoleccion NULL,
total servidor, creado_por=cajero)` + detalle congelado + `pago(metodo=
'efectivo', monto=total, referencia NULL, registrado_por=cajero)` +
historial `NULL→Pagado`.

## Cola de cocina (lectura)

Filas `Pagado`/`En preparación` de ambos tipos con: folio, tipo, cliente
(`cliente_nombre` o cuenta del dueño), minutos de espera (`ahora-creado_en`),
líneas (nombre, cantidad) y estado. Orden: `creado_en`.

## Entrega (lectura + transición)

Pedidos `Listo` (ambos orígenes) para caja; `Entregado`/`Cancelado` salen de
pantallas activas. Transiciones por `transicionarPedido` (R3) con historial.
