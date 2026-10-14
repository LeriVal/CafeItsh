# Phase 0 Research: Rediseño UI por Rol (Sprint 6)

**Feature**: `specs/007-ui-redesign/` | **Date**: 2026-10-14

Solo frontend salvo C6. Rige la constitución; `desing/` es propuesta.

## R1. Shell compartido con drawer + bottom bar opcional

- **Decision**: `components/AppShell.tsx` (header ☰ + título + usuario, drawer
  overlay/fijo, slot de bottom bar) reemplaza a `RoleLayout`; migran
  admin/caja/cocina/cliente. Cerrar sesión se mueve al drawer. Sin
  dependencias nuevas (Tailwind + Router).
- **Rationale**: un patrón evita 4 navegaciones divergentes.
- **Alternatives**: drawer por rol — rechazado (duplicación).

## R2. Badges con datos existentes

- **Decision**: bottom bar cliente lee avisos sin ver (`misAvisos`, sondeo
  10 s); caja cuenta `Listo` (`listosCaja`, mismo sondeo que entregas).
- **Rationale**: cero endpoints nuevos.
- **Alternatives**: contexto global de avisos — innecesario para 2 usos.

## R3. Carrito persistente en localStorage

- **Decision**: `CartProvider` hidrata de `itsh.cart` y persiste cada cambio
  (try/catch por cuota/privacidad); valida forma al cargar.
- **Rationale**: mejora C5 sin backend; el servidor revalida todo al confirmar.
- **Alternatives**: IndexedDB — sobrado para decenas de líneas.

## R4. Caja en subrutas con captura local

- **Decision**: `/caja/*`: `inicio`, `nuevo` (catálogo + flotante),
  `cobro` (resumen + pago), `entregas`. Estado de captura en
  `CapturaContext` local a caja (no reutilizar el carrito de cliente).
- **Rationale**: espeja el patrón `/admin/*` ya probado; evita fugas entre
  carrito de cliente y captura de caja.
- **Alternatives**: una página con pasos internos — rechazado (rutas
  permiten regreso natural y enlaces directos).

## R5. Búsqueda y chips derivados de datos

- **Decision**: filtro en vivo por nombre + chips de categorías extraídas del
  menú/catálogo (sin fijas); vacío de filtro con mensaje.
- **Rationale**: las categorías las define el catálogo, no el código.
- **Alternatives**: categorías fijas — rechazado (se desincronizan).

## R6. Cocina: hora de recogida desde API (único cambio backend)

- **Decision**: `colaCocina` incluye `fechaRecoleccion` (null en mostrador);
  cliente calcula espera/retraso. Sin migración ni endpoint nuevo.
- **Rationale**: la hora comprometida es dato del pedido, no decoración.
- **Alternatives**: ocultarla — rechazado (los docs la exigen y es barata).

## R7. Pulido sin regresiones

- **Decision**: reutilizar `StatusBadge`, clases y tokens existentes;
  snapshot visual manual en la demo (sin librería de snapshots).
- **Rationale**: consistencia sin nueva infraestructura de test.
