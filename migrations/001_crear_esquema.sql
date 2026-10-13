-- ============================================================
-- 001_crear_esquema.sql
-- Esquema de la base de datos para el Sistema de Pedidos
-- Anticipados — Cafetería ITSH (MySQL 8.0)
-- Ejecutar en orden: 001_crear_esquema.sql, luego 002_seed_inicial.sql
-- ============================================================

-- ------------------------------------------------------------
-- Catálogo de roles
-- ------------------------------------------------------------
CREATE TABLE rol (
  id          INTEGER AUTO_INCREMENT PRIMARY KEY,
  nombre      VARCHAR(30) NOT NULL UNIQUE,
  creado_en   TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- ------------------------------------------------------------
-- Usuarios del sistema
-- ------------------------------------------------------------
CREATE TABLE usuario (
  id            INTEGER AUTO_INCREMENT PRIMARY KEY,
  nombre        VARCHAR(100) NOT NULL,
  correo        VARCHAR(150) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  activo        BOOLEAN NOT NULL DEFAULT TRUE,
  rol_id        INTEGER NOT NULL,
  creado_en     TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  actualizado_en TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_usuario_rol FOREIGN KEY (rol_id) REFERENCES rol(id)
) ENGINE=InnoDB;

-- ------------------------------------------------------------
-- Catálogo de platillos (historial permanente)
-- ------------------------------------------------------------
CREATE TABLE platillo (
  id          INTEGER AUTO_INCREMENT PRIMARY KEY,
  nombre      VARCHAR(100) NOT NULL,
  categoria   VARCHAR(50),
  descripcion TEXT,
  activo      BOOLEAN NOT NULL DEFAULT TRUE,
  creado_en   TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  actualizado_en TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- ------------------------------------------------------------
-- Menú del día: asocia platillos a una fecha con precio y
-- disponibilidad. El precio se congela al agregarlo al menú
-- para mantener historial. Un platillo solo puede aparecer
-- una vez por fecha.
-- ------------------------------------------------------------
CREATE TABLE menu_dia (
  id          INTEGER AUTO_INCREMENT PRIMARY KEY,
  fecha       DATE NOT NULL,
  platillo_id INTEGER NOT NULL,
  precio      NUMERIC(10,2) NOT NULL CHECK (precio >= 0),
  disponible  BOOLEAN NOT NULL DEFAULT TRUE,
  especial    BOOLEAN NOT NULL DEFAULT FALSE,
  UNIQUE (fecha, platillo_id),
  CONSTRAINT fk_menu_platillo FOREIGN KEY (platillo_id) REFERENCES platillo(id)
) ENGINE=InnoDB;

-- ------------------------------------------------------------
-- Catálogo de estados de pedido
-- ------------------------------------------------------------
CREATE TABLE estado_pedido (
  id      INTEGER AUTO_INCREMENT PRIMARY KEY,
  nombre  VARCHAR(30) NOT NULL UNIQUE,
  orden   INTEGER NOT NULL UNIQUE
) ENGINE=InnoDB;

-- ------------------------------------------------------------
-- Transiciones válidas entre estados (validación por datos)
-- ------------------------------------------------------------
CREATE TABLE transicion_estado (
  desde_id INTEGER NOT NULL,
  hacia_id INTEGER NOT NULL,
  PRIMARY KEY (desde_id, hacia_id),
  CHECK (desde_id <> hacia_id),
  CONSTRAINT fk_trans_desde FOREIGN KEY (desde_id) REFERENCES estado_pedido(id),
  CONSTRAINT fk_trans_hacia FOREIGN KEY (hacia_id) REFERENCES estado_pedido(id)
) ENGINE=InnoDB;

-- ------------------------------------------------------------
-- Pedidos: anticipados (usuario + fecha de recolección) y
-- de mostrador (cliente nombre, opcional). El estado actual
-- siempre vive aquí; el historial queda en su tabla propia.
-- ------------------------------------------------------------
CREATE TABLE pedido (
  id                INTEGER AUTO_INCREMENT PRIMARY KEY,
  numero            VARCHAR(20) NOT NULL UNIQUE,
  tipo              VARCHAR(20) NOT NULL CHECK (tipo IN ('anticipado', 'mostrador')),
  estado_id         INTEGER NOT NULL,
  usuario_id        INTEGER,
  cliente_nombre    VARCHAR(100),
  fecha_recoleccion TIMESTAMP NULL,
  total             NUMERIC(10,2) NOT NULL DEFAULT 0 CHECK (total >= 0),
  creado_por        INTEGER,
  creado_en         TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  actualizado_en    TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CHECK (
    (tipo = 'anticipado' AND usuario_id IS NOT NULL AND fecha_recoleccion IS NOT NULL)
    OR (tipo = 'mostrador')
  ),
  CONSTRAINT fk_pedido_estado FOREIGN KEY (estado_id) REFERENCES estado_pedido(id),
  CONSTRAINT fk_pedido_usuario FOREIGN KEY (usuario_id) REFERENCES usuario(id),
  CONSTRAINT fk_pedido_creador FOREIGN KEY (creado_por) REFERENCES usuario(id)
) ENGINE=InnoDB;

-- ------------------------------------------------------------
-- Detalle de pedidos: platillo del menú, cantidad y precio
-- unitario congelado al momento de crear el pedido.
-- ------------------------------------------------------------
CREATE TABLE pedido_detalle (
  id              INTEGER AUTO_INCREMENT PRIMARY KEY,
  pedido_id       INTEGER NOT NULL,
  menu_dia_id     INTEGER NOT NULL,
  cantidad        INTEGER NOT NULL CHECK (cantidad > 0),
  precio_unitario NUMERIC(10,2) NOT NULL CHECK (precio_unitario >= 0),
  subtotal        NUMERIC(10,2) NOT NULL CHECK (subtotal >= 0),
  CONSTRAINT fk_detalle_pedido FOREIGN KEY (pedido_id) REFERENCES pedido(id) ON DELETE CASCADE,
  CONSTRAINT fk_detalle_menu FOREIGN KEY (menu_dia_id) REFERENCES menu_dia(id)
) ENGINE=InnoDB;

-- ------------------------------------------------------------
-- Historial de cambios de estado de cada pedido
-- ------------------------------------------------------------
CREATE TABLE pedido_estado_historial (
  id                INTEGER AUTO_INCREMENT PRIMARY KEY,
  pedido_id         INTEGER NOT NULL,
  estado_anterior_id INTEGER,
  estado_nuevo_id   INTEGER NOT NULL,
  cambiado_por      INTEGER,
  fecha             TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_hist_pedido FOREIGN KEY (pedido_id) REFERENCES pedido(id) ON DELETE CASCADE,
  CONSTRAINT fk_hist_anterior FOREIGN KEY (estado_anterior_id) REFERENCES estado_pedido(id),
  CONSTRAINT fk_hist_nuevo FOREIGN KEY (estado_nuevo_id) REFERENCES estado_pedido(id),
  CONSTRAINT fk_hist_usuario FOREIGN KEY (cambiado_por) REFERENCES usuario(id)
) ENGINE=InnoDB;

-- ------------------------------------------------------------
-- Pagos: uno por pedido, monto completo. Sin datos de tarjeta.
-- referencia identifica la transacción en la pasarela externa.
-- ------------------------------------------------------------
CREATE TABLE pago (
  id              INTEGER AUTO_INCREMENT PRIMARY KEY,
  pedido_id       INTEGER NOT NULL UNIQUE,
  metodo          VARCHAR(20) NOT NULL CHECK (metodo IN ('online', 'efectivo')),
  monto           NUMERIC(10,2) NOT NULL CHECK (monto > 0),
  referencia      VARCHAR(100),
  registrado_por  INTEGER,
  fecha           TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_pago_pedido FOREIGN KEY (pedido_id) REFERENCES pedido(id),
  CONSTRAINT fk_pago_usuario FOREIGN KEY (registrado_por) REFERENCES usuario(id)
) ENGINE=InnoDB;

-- ------------------------------------------------------------
-- Notificaciones de pedido listo (separadas de la lógica
-- principal de pedidos; soportan reintento y auditoría)
-- ------------------------------------------------------------
CREATE TABLE notificacion (
  id            INTEGER AUTO_INCREMENT PRIMARY KEY,
  pedido_id     INTEGER NOT NULL,
  tipo          VARCHAR(30) NOT NULL,
  canal         VARCHAR(20) NOT NULL CHECK (canal IN ('correo', 'push', 'sms')),
  estado_envio  VARCHAR(20) NOT NULL DEFAULT 'pendiente'
                  CHECK (estado_envio IN ('pendiente', 'enviada', 'fallida')),
  fecha         TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  detalle_error TEXT,
  CONSTRAINT fk_notif_pedido FOREIGN KEY (pedido_id) REFERENCES pedido(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- ============================================================
-- Índices
-- ============================================================
CREATE INDEX idx_usuario_rol ON usuario(rol_id);
CREATE INDEX idx_menu_dia_fecha ON menu_dia(fecha);
CREATE INDEX idx_pedido_estado ON pedido(estado_id);
CREATE INDEX idx_pedido_fecha_recoleccion ON pedido(fecha_recoleccion);
CREATE INDEX idx_pedido_usuario ON pedido(usuario_id);
CREATE INDEX idx_pedido_tipo ON pedido(tipo);
CREATE INDEX idx_pedido_detalle_pedido ON pedido_detalle(pedido_id);
CREATE INDEX idx_historial_pedido ON pedido_estado_historial(pedido_id);
CREATE INDEX idx_pago_pedido ON pago(pedido_id);
CREATE INDEX idx_notificacion_pendiente
  ON notificacion(estado_envio);

-- ============================================================
-- Triggers: mantener actualizado_en al actualizar
-- ============================================================
DROP TRIGGER IF EXISTS trg_usuario_actualizado;
CREATE TRIGGER trg_usuario_actualizado
  BEFORE UPDATE ON usuario
  FOR EACH ROW SET NEW.actualizado_en = CURRENT_TIMESTAMP;

DROP TRIGGER IF EXISTS trg_platillo_actualizado;
CREATE TRIGGER trg_platillo_actualizado
  BEFORE UPDATE ON platillo
  FOR EACH ROW SET NEW.actualizado_en = CURRENT_TIMESTAMP;

DROP TRIGGER IF EXISTS trg_pedido_actualizado;
CREATE TRIGGER trg_pedido_actualizado
  BEFORE UPDATE ON pedido
  FOR EACH ROW SET NEW.actualizado_en = CURRENT_TIMESTAMP;
