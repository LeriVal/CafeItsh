# Cómo ejecutar los scripts de migración

Scripts SQL para crear y sembrar la base de datos del **Sistema de Pedidos Anticipados — Cafetería ITSH** en MySQL 8.0.

## Requisitos

- MySQL 8.0 instalado y el servicio `MySQL80` corriendo.
- Rol `cafe_admin` y base de datos `cafe_itsh` creados (ver abajo si aún no existen).

## Conexión

Los datos de acceso:

| Dato | Valor |
|------|-------|
| Servidor | `127.0.0.1:3306` |
| Base de datos | `cafe_itsh` |
| Usuario | `cafe_admin` |
| Contraseña | `cafeContra` |

Si configuraste un archivo de login (`mysql_config_editor set --login-path=local --host=127.0.0.1 --user=cafe_admin --password`), `mysql` conectará sin pedir la contraseña. Si no, usa `-p` y escríbela cuando la pida.

## Ejecutar los scripts (en orden)

Desde la carpeta del proyecto, en PowerShell o CMD:

```bash
mysql -h 127.0.0.1 --default-character-set=utf8mb4 -u cafe_admin -p cafe_itsh < migrations/001_crear_esquema.sql
mysql -h 127.0.0.1 --default-character-set=utf8mb4 -u cafe_admin -p cafe_itsh < migrations/002_seed_inicial.sql
```

> Sin `--default-character-set=utf8mb4`, los acentos (p. ej. `En preparación`)
> se guardan corruptos y los cambios de estado fallan. El corredor
> `npm run db:migrate` ya fuerza utf8mb4.

**Importante:** ejecutar `001` antes que `002`. El `001` crea las tablas; el `002` inserta los datos base (roles, estados, transiciones, platillos y menú de ejemplo).

Si `mysql` no está en el PATH, usa la ruta completa:

```bash
"C:\Program Files\MySQL\MySQL Server 8.0\bin\mysql.exe" -h 127.0.0.1 -u cafe_admin -p cafe_itsh < migrations/001_crear_esquema.sql
```

## Ejecutar con DBeaver

1. Abre DBeaver y crea una conexión a MySQL con los datos de la tabla de arriba.
2. Abre el archivo `migrations/001_crear_esquema.sql` en un editor SQL.
3. Selecciona toda la consulta y ejecuta (Ctrl+Enter o botón SQL → Execute SQL script).
4. Repite con `migrations/002_seed_inicial.sql`.

## Verificar que todo quedó bien

```bash
mysql -h 127.0.0.1 -u cafe_admin -p cafe_itsh -e "SHOW TABLES;"
```

Debe mostrar 11 tablas: `estado_pedido`, `menu_dia`, `notificacion`, `pago`, `pedido`, `pedido_detalle`, `pedido_estado_historial`, `platillo`, `rol`, `transicion_estado`, `usuario`.

Ver el menú de ejemplo del día:

```bash
mysql -h 127.0.0.1 -u cafe_admin -p cafe_itsh -e "SELECT md.fecha, p.nombre, md.precio, md.especial FROM menu_dia md JOIN platillo p ON p.id = md.platillo_id ORDER BY p.nombre;"
```

## Notas

- Los scripts usan `INSERT IGNORE` en los catálogos, por lo que el `002` es seguro de re-ejecutar. Sin embargo, `001` usa `CREATE TABLE` normal: si las tablas ya existen, fallará con "Table already exists" (esto es esperado; no re-ejecutes `001` sobre una BD ya poblada sin antes limpiar).
- El menú de ejemplo se inserta con la fecha actual (`CURRENT_DATE`). Para tener menú en otro día, ejecuta un `INSERT` manual en `menu_dia` con la fecha deseada.
