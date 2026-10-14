# Implementation Plan: Rediseño UI por Rol (Sprint 6)

**Branch**: `007-ui-redesign` | **Date**: 2026-10-14 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `/specs/007-ui-redesign/spec.md`
(conciliación C1–C6 de `desing/` con el código; sin funcionalidad fuera del MVP).

**Note**: Diseño en `research.md`, `data-model.md`, `contracts/` y
`quickstart.md`; implementación en `tasks.md`.

## Summary

Navegación unificada (drawer + bottom bar con badges), caja en 4 subrutas con
catálogo operable, cliente con búsqueda/filtros y carrito persistente,
cocina enriquecida con horas y origen, y landing de admin. Enfoque: shell
compartido, badges con datos existentes, captura de caja aislada, filtros
derivados, y un solo campo de lectura nuevo en backend.

## Technical Context

**Language/Version**: TypeScript 5.x estricto, Node.js 20 LTS.

**Primary Dependencies**: acumuladas; sin dependencias nuevas.

**Storage**: sin cambios de esquema; `colaCocina` + `fechaRecoleccion`;
carrito en `localStorage[itsh.cart]`.

**Testing**: Vitest + `tsc --noEmit` en ambos lados.

**Target Platform**: móvil primero, escritorio con drawer fijo.

**Project Type**: web application (frontend + backend).

**Performance Goals**: sondeo 10 s intacto; filtros en vivo instantáneos;
cero llamadas nuevas salvo badges existentes.

**Constraints**: C1–C6; ≥44 px; StatusBadge; nada fuera del MVP.

**Scale/Scope**: 4 roles + cliente; sin backend nuevo salvo un campo.

## Constitution Check

- **I. Alcance**: rediseño de lo existente + C6/C5; nada fuera del MVP → PASS.
- **II. Seguridad**: sin cambios de auth; drawer no expone rutas (guards
  intactos) → PASS.
- **III. Simplicidad**: un shell, contextos acotados, sin dependencias → PASS.
- **IV. Rapidez**: mismos pasos o menos; sondeo intacto → PASS.
- **V. Trazabilidad**: folios/estados intactos → PASS.
- **VI. Validación y errores**: validaciones intactas + hora mínima visible → PASS.
- **VII. Viabilidad**: cero costo → PASS.

Re-chequeo post-Phase 1: sin cambios que afecten gates.

## Project Structure

### Documentation (this feature)

```text
specs/007-ui-redesign/
  plan.md  research.md  data-model.md  quickstart.md  contracts/  tasks.md
```

### Source Code (repository root)

```text
backend/
  src/services/cocina.ts       # + fechaRecoleccion en cola
  tests/integration/cocina.test.ts  # + assert del campo

frontend/
  src/
    components/AppShell.tsx    # header + drawer + bottom bar (reemplaza RoleLayout)
    components/BottomBar.tsx   # cliente y caja
    components/Drawer.tsx
    lib/carrito.tsx            # + persistencia localStorage
    pages/admin/Inicio.tsx     # landing admin
    pages/caja/{InicioCaja,NuevoPedido,ResumenCobro,Entregas,CapturaContext}.tsx
    pages/cocina/Cocina.tsx    # header, chips, horas, retrasado, Listo visible
    pages/clientes/Menu.tsx    # búsqueda, chips, bienvenida
    pages/clientes/Checkout.tsx    # hora mínima visible
    pages/clientes/Confirmacion.tsx # folio grande + CTAs
    pages/clientes/MisPedidos.tsx   # contador + CTA nuevo pedido
  tests/{navegacion,caja-nueva,cliente-rediseno}.test.tsx
```

**Structure Decision**: shell y patrones compartidos; caja espeja `/admin/*`.

## Complexity Tracking

Sin violaciones; nada que justificar.
