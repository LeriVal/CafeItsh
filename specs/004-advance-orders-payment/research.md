# Phase 0 Research: Pedido Anticipado y Pago (Sprint 3)

**Feature**: `specs/004-advance-orders-payment/` | **Date**: 2026-10-13

Rigen la constitución v1.0.0 y la realidad verificada: `migrations/001` ya
crea `pedido` (con CHECK anticipado/mostrador), `pedido_detalle`,
`pago`, `estado_pedido`, `transicion_estado` y `pedido_estado_historial`; el
seed deja los 6 estados y las 8 transiciones cargados.

## R1. Sin migración nueva

- **Decision**: ninguna migración; `db:migrate` como verificación.
- **Rationale**: pedido, detalle, pago, estados, transiciones e historial ya
  existen con sus CHECKs e índices.
- **Alternatives**: tabla de carritos persistidos — rechazada (el carrito es
  estado efímero del frontend; persistirlo añadiría sincronización inútil).

## R2. Proveedor de pago simulado tras interfaz intercambiable

- **Decision**: `ProveedorPago` (`cobrar(monto, folio) → { referencia }`) con
  implementación `SimuladorPago` (aprueba siempre; `referencia` única
  `SIM-...`); la pasarela real se conecta implementando la interfaz sin tocar
  el flujo. `PAYMENT_API_KEY` reservada en entorno desde ahora.
- **Rationale**: el MVP no mueve dinero real; la interfaz deja el cambio a
  pasarela real como trabajo acotado y auditable.
- **Alternatives**: integrar pasarela real ya — rechazado (cuentas, comisiones
  y PCI fuera del alcance del sprint y del presupuesto).

## R3. El servidor calcula el total; el del cliente es informativo

- **Decision**: cantidades y precios se revalidan y el total se computa en el
  backend con centavos enteros; el frontend muestra su propio total solo como
  referencia.
- **Rationale**: nunca confiar en totales del cliente (constitución VI).
- **Alternatives**: aceptar total del cliente — rechazado por fraude/error.

## R4. Anticipados sobre el menú de hoy

- **Decision**: las líneas pedibles son las del menú de la fecha actual del
  plantel; la recogida puede ser hoy o después, siempre ≥10 min.
- **Rationale**: el menú cambia por día; pedir sobre otro día exigiría
  congelar menús futuros, fuera del MVP.
- **Alternatives**: elegir fecha de menú — rechazado por alcance.

## R5. Transiciones validadas por datos + bloqueo de fila al pagar

- **Decision**: `cambiarEstado` valida contra `transicion_estado` y rechaza
  mover `Entregado`/`Cancelado`; el pago usa `SELECT ... FOR UPDATE` en
  transacción para que dos cobros concurrentes no dupliquen el paso a Pagado.
- **Rationale**: la máquina de estados vive en datos (ya sembrada) y el lock
  evita la única carrera real del sprint (doble pago).
- **Alternatives**: validar en código con switch — rechazado (duplica la tabla
  y se desincroniza); idempotencia por referencia — complementaria, no
  sustituta del lock.

## R6. Folio `A-AAAAMMDD-NNNN` con reintento ante colisión

- **Decision**: secuencia por día (conteo + 1, cero-rellenada); ante colisión
  UNIQUE se reintenta (máx. 3). Prefijo `A` = anticipado (`M` reservado para
  mostrador del sprint 4).
- **Rationale**: legible para dictarlo en caja, único y ordenable.
- **Alternatives**: UUID — rechazado (indictable por teléfono).

## R7. Checkout en páginas propias, carrito en contexto efímero

- **Decision**: `CartContext` (sin persistencia), `/menu` con steppers solo en
  disponibles, `/pedido/nuevo` (recogida + resumen + pagar) y `/pedido/:id`
  (confirmación). Tope de 20 unidades por línea contra abuso.
- **Rationale**: flujo guiado en 2 pasos + confirmación; el tope evita errores
  de dedo y pedidos absurdos sin afectar uso real.
- **Alternatives**: drawer lateral único — rechazado (en móvil estrecha la
  consulta del menú).
