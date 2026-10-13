# Phase 0 Research: Mostrador y Cocina (Sprint 4)

**Feature**: `specs/005-counter-kitchen/` | **Date**: 2026-10-13

Rigen la constitución v1.0.0 y lo construido: `cambiarEstado` valida por
datos, `pagarPedido` usa lock, folios `A-…`, menú d became e hoy con
disponibilidad.

## R1. Sin migración nueva

- **Decision**: ninguna migración; el esquema ya cubre mostrador
  (`tipo`, `cliente_nombre`, `creado_por`, `metodo='efectivo'`) y la cola.
- **Rationale**: el sprint 3 no añadió tablas; todo lo necesario existe.
- **Alternatives**: tabla de turnos de caja — rechazada (fuera del MVP).

## R2. Mostrador nace Pagado en una transacción

- **Decision**: `POST /api/pedidos/mostrador` crea pedido + detalle + pago en
  efectivo + historial `NULL→Pagado` en una transacción; folio `M-AAAAMMDD-NNNN`
  (misma secuencia con reintento que `A-`).
- **Rationale**: el cobro es en el acto; no existe `Pendiente` en mostrador y
  se evita un estado intermedio sin sentido.
- **Alternatives**: crear Pendiente y pagar después — rechazado (doble paso
  en fila).

## R3. Matriz de permisos por rol para transiciones

- **Decision**: `transicionarPedido(id, nuevo, actor)` centraliza flujo +
  rol: cocinero solo `→En preparación`/`→Listo`; cajero solo
  `→Entregado`/`→Cancelado`; administrador cualquier transición válida;
  otros roles 403. El flujo válido lo sigue decidiendo `transicion_estado`.
- **Rationale**: una sola puerta para cambios de estado evita que cada
  endpoint reinvente permisos.
- **Alternatives**: permisos por endpoint — rechazado (se dispersa la regla).

## R4. Cola de cocina por llegada, solo Pagado/En preparación

- **Decision**: `GET /api/cocina/cola` (cocinero, admin) devuelve ambas en
  `ORDER BY creado_en`, con folio, tipo, cliente (nombre o cuenta), espera en
  minutos, líneas y estado. `Pendiente` excluido; `Entregado`/`Cancelado` fuera.
- **Rationale**: coincide con el criterio (orden de llegada, ambos orígenes).
- **Alternatives**: agrupar por estado — rechazado (el criterio pide llegada).

## R5. Sondeo cada 10 s, sin websockets

- **Decision**: la pantalla re-consulta cada 10 s (constante configurable) +
  botón de refresco + hora de última actualización; ante error de red muestra
  aviso y reintenta sola.
- **Rationale**: suficiente para el volumen, cero infraestructura extra.
- **Alternatives**: websockets/SSE — rechazado por costo/complejidad MVP.

## R6. Caja con captura y entrega en una página, dos bloques

- **Decision**: `/caja` combina captura rápida (líneas + cantidades + nombre
  opcional + monto recibido + cambio) y bloque de entrega (pedidos `Listo`
  con Entregar/Cancelar). Reutiliza `GET /api/menu` y la cola filtrada.
- **Rationale**: el cajero no cambia de pantalla entre cobrar y entregar.
- **Alternatives**: dos rutas — rechazado (más pasos en receso).

## R7. Cambio calculado, no persistido

- **Decision**: `montoRecibido` entra, el servidor valida `≥ total` y devuelve
  `cambio`; no se guarda (el pago registra el total).
- **Rationale**: el cambio es dato efímero de la operación.
- **Alternatives**: persistirlo — rechazado (columna sin uso futuro claro).
