# Implementation Plan: Pedido Anticipado y Pago (Sprint 3)

**Branch**: `004-advance-orders-payment` | **Date**: 2026-10-13 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `/specs/004-advance-orders-payment/spec.md`
(trazable a US1, FR-006 y FR-009…FR-017 de la spec maestra
`../001-pedidos-anticipados-cafeteria/spec.md`).

**Note**: Diseño en `research.md`, `data-model.md`, `contracts/` y
`quickstart.md`; implementación en `tasks.md`.

## Summary

El cliente arma su pedido desde el menú, lo confirma con ≥10 min de
anticipación y lo paga en línea; nace `Pendiente` y solo el pago confirmado
lo pasa a `Pagado` con folio y referencia. Enfoque (de `research.md`): sin
migraciones, proveedor simulado tras interfaz, total calculado en servidor,
anticipados sobre el menú de hoy, transiciones por datos con lock al pagar,
folio `A-AAAAMMDD-NNNN`, checkout en páginas propias con tope de 20 por línea.

## Technical Context

**Language/Version**: TypeScript 5.x estricto, Node.js 20 LTS.

**Primary Dependencies**: las acumuladas (express, mysql2, JWT, router,
Tailwind); `PAYMENT_API_KEY` reservada en entorno; sin dependencias nuevas.

**Storage**: MySQL 8.0, tablas existentes `pedido`, `pedido_detalle`,
`pago`, `estado_pedido`, `transicion_estado`, `pedido_estado_historial`;
transacciones con `SELECT ... FOR UPDATE` en creación/cobro.

**Testing**: Vitest + `tsc --noEmit` en ambos lados.

**Target Platform**: web responsiva (móvil primero para el flujo de compra).

**Project Type**: web application (frontend + backend).

**Performance Goals**: confirmación y pago sin esperas perceptibles; un
pedido = 1 transacción corta.

**Constraints**: anticipación ≥10 min; precio > 0 y total servidor;
UNIQUE (numero) y (pago.pedido_id); sin datos de tarjeta (400 dedicado);
dueño o admin.

**Scale/Scope**: decenas de pedidos por receso; sin mostrador/cocina/listas/
notificaciones.

## Constitution Check

- **I. Alcance**: solo US1 + pago (FR-001…FR-011 de la spec); listas,
  mostrador, cocina, notificaciones fuera → PASS.
- **II. Seguridad**: dueño o admin por pedido; sin tarjetas; secretos en env;
  lock anti-doble-pago → PASS.
- **III. Simplicidad**: dos servicios (`pedidos`, `pagos`), proveedor
  simulado ~20 líneas, sin dependencias ni migraciones → PASS.
- **IV. Rapidez**: 2 pasos + confirmación, transacción corta → PASS.
- **V. Trazabilidad**: folio legible, estados por datos, historial auditable
  → PASS.
- **VI. Validación y errores**: revalidación total al confirmar/pagar +
  envelope; 400/403/404/409 claros → PASS.
- **VII. Viabilidad**: cero costo (simulador) → PASS.

Re-chequeo post-Phase 1: sin cambios que afecten gates.

## Project Structure

### Documentation (this feature)

```text
specs/004-advance-orders-payment/
  plan.md  research.md  data-model.md  quickstart.md  contracts/  tasks.md
```

### Source Code (repository root)

```text
backend/
  src/
    routes/pedidos.ts        # POST / (usuario), GET /:id, POST /:id/pagar
    controllers/pedidos.ts   # rechaza campos de tarjeta (400 dedicado)
    services/pedidos.ts      # crearAnticipado, cambiarEstado, obtenerPedido, folio
    services/pagos.ts        # ProveedorPago, SimuladorPago, pagarPedido
  tests/integration/pedidos.test.ts

frontend/
  src/
    lib/carrito.tsx          # CartContext efímero + total informativo
    pages/clientes/Menu.tsx  # + steppers y barra de carrito (extiende)
    pages/clientes/Checkout.tsx  # /pedido/nuevo
    pages/clientes/Confirmacion.tsx  # /pedido/:id
    App.tsx                  # rutas de cliente
  tests/carrito.test.tsx     # carrito + checkout + confirmación (mock)
```

**Structure Decision**: se extiende la estructura existente; el carrito vive
solo en frontend (R1).

## Complexity Tracking

Sin violaciones; nada que justificar.
