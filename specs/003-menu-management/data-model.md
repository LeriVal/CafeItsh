# Data Model: Gestión y Consulta de Menú (Sprint 2)

**Feature**: `specs/003-menu-management/` | **Date**: 2026-10-13

Sin cambios de esquema (R1). Uso fijado para las tablas existentes.

## Platillo (existente; escritura: admin)

`platillo(id, nombre, categoria, descripcion, activo, creado_en,
actualizado_en)`.

- `nombre` obligatorio (≤100), `categoria` opcional (≤50).
- Desactivar (`activo=FALSE`) impide agregarlo a menús nuevos; lo ya creado
  se conserva. Sin DELETE físico (R3).
- Respuestas nunca exponen columnas internas más allá de estos campos.

## Línea de menú (existente; escritura: admin)

`menu_dia(id, fecha DATE, platillo_id → platillo, precio NUMERIC(10,2),
disponible, especial)`, UNIQUE `(fecha, platillo_id)`.

- `precio > 0` (R4); se congela al crear la línea (historial por fecha).
- `disponible=FALSE` → visible como no disponible, no seleccionable.
- `especial=TRUE` → distintivo de especial del día.
- Duplicado (misma fecha+platillo) → 409 con mensaje claro.
- `platillo_id` de platillo inactivo → 400.
- DELETE: 204 si no hay referencias; 409 si un pedido la referencia (R3,
  vigente desde el sprint 3).

## Menú del día (lectura)

Vista lógica: líneas de una fecha con datos del platillo
`{ id, fecha, platillo: { id, nombre, categoria, descripcion },
precio, disponible, especial }`, ordenadas por `especial DESC, nombre`.

- Fecha por defecto: hoy en `America/Mexico_City` (R2); `?fecha=` explícita
  validada (`YYYY-MM-DD` real).
- La respuesta incluye `fecha` para anclar lo que ve el cliente (R6).
