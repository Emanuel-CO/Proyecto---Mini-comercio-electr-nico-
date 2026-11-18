-- ============================================================================
-- PROYECTO: Mercado Trust — Mini Comercio Electrónico
-- Base de Datos: PostgreSQL 16
-- Archivo: schema.sql
-- ============================================================================

-- 1. Función para actualizar automáticamente el campo updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 2. Tabla: usuarios (Clientes y Administradores)
CREATE TABLE IF NOT EXISTS usuarios (
    id SERIAL PRIMARY KEY,
    rol VARCHAR(20) NOT NULL DEFAULT 'CLIENTE' CHECK (rol IN ('CLIENTE', 'ADMIN')),
    nombres_completos VARCHAR(255) NOT NULL,
    correo VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    telefono VARCHAR(50),
    direccion_envio TEXT,
    acepta_politica_datos BOOLEAN NOT NULL DEFAULT TRUE,
    estado VARCHAR(20) NOT NULL DEFAULT 'ACTIVO' CHECK (estado IN ('ACTIVO', 'INACTIVO', 'SUSPENDIDO')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TRIGGER trg_usuarios_updated_at
BEFORE UPDATE ON usuarios
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 3. Tabla: categorias (Categorías de productos)
CREATE TABLE IF NOT EXISTS categorias (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    descripcion TEXT,
    estado VARCHAR(20) NOT NULL DEFAULT 'ACTIVA' CHECK (estado IN ('ACTIVA', 'INACTIVA')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TRIGGER trg_categorias_updated_at
BEFORE UPDATE ON categorias
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 4. Tabla: productos (Catálogo de artículos con inventario real)
CREATE TABLE IF NOT EXISTS productos (
    id SERIAL PRIMARY KEY,
    categoria_id INTEGER NOT NULL REFERENCES categorias(id) ON DELETE RESTRICT,
    sku VARCHAR(50) UNIQUE NOT NULL,
    nombre VARCHAR(255) NOT NULL,
    descripcion TEXT,
    precio NUMERIC(12, 2) NOT NULL CHECK (precio >= 0),
    stock INTEGER NOT NULL DEFAULT 0 CHECK (stock >= 0),
    imagen_url TEXT,
    estado VARCHAR(20) NOT NULL DEFAULT 'ACTIVO' CHECK (estado IN ('ACTIVO', 'INACTIVO', 'AGOTADO')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TRIGGER trg_productos_updated_at
BEFORE UPDATE ON productos
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 5. Tabla: pedidos (Órdenes transaccionales del comercio)
CREATE TABLE IF NOT EXISTS pedidos (
    id SERIAL PRIMARY KEY,
    codigo_orden VARCHAR(50) UNIQUE NOT NULL,
    usuario_id INTEGER NOT NULL REFERENCES usuarios(id) ON DELETE RESTRICT,
    direccion_entrega TEXT NOT NULL,
    telefono_contacto VARCHAR(50) NOT NULL,
    metodo_pago VARCHAR(50) NOT NULL CHECK (metodo_pago IN ('CONTRAENTREGA', 'TRANSFERENCIA_NEQUI', 'TARJETA_CREDITO_DEMO')),
    subtotal NUMERIC(12, 2) NOT NULL CHECK (subtotal >= 0),
    impuestos NUMERIC(12, 2) NOT NULL DEFAULT 0 CHECK (impuestos >= 0),
    costo_envio NUMERIC(12, 2) NOT NULL DEFAULT 0 CHECK (costo_envio >= 0),
    total NUMERIC(12, 2) NOT NULL CHECK (total >= 0),
    estado VARCHAR(50) NOT NULL DEFAULT 'PENDIENTE' CHECK (estado IN ('PENDIENTE', 'PAGADO', 'EN_PREPARACION', 'ENVIADO', 'ENTREGADO', 'CANCELADO')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TRIGGER trg_pedidos_updated_at
BEFORE UPDATE ON pedidos
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 6. Tabla: detalle_pedidos (Líneas de pedido con precio histórico fijo)
CREATE TABLE IF NOT EXISTS detalle_pedidos (
    id SERIAL PRIMARY KEY,
    pedido_id INTEGER NOT NULL REFERENCES pedidos(id) ON DELETE CASCADE,
    producto_id INTEGER NOT NULL REFERENCES productos(id) ON DELETE RESTRICT,
    producto_nombre VARCHAR(255) NOT NULL,
    producto_sku VARCHAR(50) NOT NULL,
    producto_imagen_url TEXT,
    cantidad INTEGER NOT NULL CHECK (cantidad > 0),
    precio_unitario_historico NUMERIC(12, 2) NOT NULL CHECK (precio_unitario_historico >= 0),
    subtotal_linea NUMERIC(12, 2) NOT NULL CHECK (subtotal_linea >= 0),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 7. Índices para optimización de consultas
CREATE INDEX IF NOT EXISTS idx_usuarios_correo ON usuarios(correo);
CREATE INDEX IF NOT EXISTS idx_productos_categoria ON productos(categoria_id);
CREATE INDEX IF NOT EXISTS idx_productos_sku ON productos(sku);
CREATE INDEX IF NOT EXISTS idx_productos_estado ON productos(estado);
CREATE INDEX IF NOT EXISTS idx_pedidos_usuario ON pedidos(usuario_id);
CREATE INDEX IF NOT EXISTS idx_pedidos_codigo ON pedidos(codigo_orden);
CREATE INDEX IF NOT EXISTS idx_pedidos_estado ON pedidos(estado);
CREATE INDEX IF NOT EXISTS idx_detalle_pedidos_pedido ON detalle_pedidos(pedido_id);
CREATE INDEX IF NOT EXISTS idx_detalle_pedidos_producto ON detalle_pedidos(producto_id);

-- 8. Datos Iniciales (Semillas)
INSERT INTO categorias (id, nombre, descripcion, estado) VALUES
(1, 'Café y Despensa', 'Café de origen especial del Huila y productos artesanales seleccionados.', 'ACTIVA'),
(2, 'Tecnología', 'Audio inalámbrico, iluminación de escritorio y accesorios funcionales.', 'ACTIVA'),
(3, 'Marroquinería', 'Piezas en cuero legítimo colombiano y mochilas tejidas a mano.', 'ACTIVA'),
(4, 'Hogar y Diseño', 'Termos térmicos, lámparas arquitectónicas y artículos cotidianos.', 'ACTIVA'),
(5, 'Cuidado Personal', 'Fórmulas botánicas y bienestar diario sin parabenos.', 'ACTIVA')
ON CONFLICT (id) DO NOTHING;

INSERT INTO productos (id, categoria_id, sku, nombre, descripcion, precio, stock, imagen_url, estado) VALUES
(1, 1, 'CAF-HUI-250', 'Café Especial Origen Huila 250g', 'Grano Arábica lavado cultivado a 1.750 msnm en Pitalito, Huila. Notas a panela, chocolate oscuro y cítricos balanceados.', 38000, 20, '/src/assets/images/product_cafe_huila_1794578223184.jpg', 'ACTIVO'),
(2, 2, 'TEC-AUD-001', 'Audífonos Studio ANC Slate', 'Cancelación activa de ruido híbrida, 40 horas de batería continua, carga rápida USB-C y almohadillas en cuero sintético suave.', 289000, 2, '/src/assets/images/product_audifonos_pro_1794578223194.jpg', 'ACTIVO'),
(3, 3, 'MAR-BIL-012', 'Billetera Cuero Legítimo Coñac', 'Cosida a mano en cuero plena flor colombiano con protección RFID integrada, 6 ranuras para tarjetas y compartimento doble para billetes.', 115000, 14, '/src/assets/images/product_billetera_cuero_1794578224008.jpg', 'ACTIVO'),
(4, 4, 'HOG-TER-750', 'Termo Acero Térmico Esmeralda 750ml', 'Doble pared en acero inoxidable 18/8 libre de BPA. Mantiene bebidas frías por 24 horas y calientes por 12 horas sin condensación.', 68000, 19, '/src/assets/images/product_termo_acero_1794578224139.jpg', 'ACTIVO'),
(5, 4, 'HOG-LAM-004', 'Lámpara Arquitectónica Roble & Aluminio', 'Brazo articulado en aluminio cepillado con base sólida en roble natural. Tres temperaturas de color regulables con control táctil.', 195000, 0, '/src/assets/images/product_lampara_escritorio_1794578225014.jpg', 'ACTIVO'),
(6, 5, 'CUI-KIT-002', 'Kit Hidratación Botánica Facial', 'Sérum concentrado con vitamina C y ácido hialurónico en frasco ámbar de 30ml acompañado de crema hidratante de caléndula 50ml.', 124000, 9, '/src/assets/images/product_kit_skincare_1794578226274.jpg', 'ACTIVO'),
(7, 3, 'MAR-MOC-008', 'Mochila Tote Tejido Artesanal', 'Tejido geométrico de alta resistencia en algodón natural y fibras teñidas con asas en cuero curtido vegetal y bolsillo interno con cierre.', 158000, 0, '/src/assets/images/product_mochila_wayuu_1794578226512.jpg', 'ACTIVO')
ON CONFLICT (id) DO NOTHING;

-- Sincronizar secuencias automáticas tras inserción de semillas
SELECT setval('categorias_id_seq', (SELECT COALESCE(MAX(id), 1) FROM categorias));
SELECT setval('productos_id_seq', (SELECT COALESCE(MAX(id), 1) FROM productos));
SELECT setval('usuarios_id_seq', (SELECT COALESCE(MAX(id), 1) FROM usuarios));
SELECT setval('pedidos_id_seq', (SELECT COALESCE(MAX(id), 1) FROM pedidos));
SELECT setval('detalle_pedidos_id_seq', (SELECT COALESCE(MAX(id), 1) FROM detalle_pedidos));
