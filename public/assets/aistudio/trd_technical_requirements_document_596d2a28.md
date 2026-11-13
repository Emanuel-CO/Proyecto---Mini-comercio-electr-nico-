# TRD: Documento de Requisitos Técnicos (Technical Requirements Document)
**Proyecto:** Sistema de Mini Comercio Electrónico (Mini E-Commerce)  
**Arquitectura:** Tres Capas (API REST Backend + Web Frontend Responsivo + Motor Relacional MySQL)  
**Entorno de Ejecución:** Contenedorizado vía Docker Compose  

---

## 1. Stack Tecnológico y Patrón de Arquitectura

### 1.1 Diagrama de Arquitectura de Tres Capas
```
+--------------------------------------------------------------------------+
|                       CAPA DE PRESENTACIÓN (CLIENTE)                     |
|  - HTML5 Semántico + JavaScript Moderno (ES6+ Modular / Fetch API)       |
|  - Bootstrap 5.3 / Tailwind CSS (Diseño Responsivo 360px - 1920px)        |
|  - Gestión de Estado: LocalStorage / SessionStorage (Carrito y JWT)      |
+--------------------------------------------------------------------------+
                                     │  HTTP/HTTPS (JSON)
                                     │  Cabecera: Authorization: Bearer <JWT>
                                     ▼
+--------------------------------------------------------------------------+
|                  CAPA DE LÓGICA DE NEGOCIO (SPRING BOOT 3.x)             |
|  - Controlador REST (@RestController, @RequestMapping)                   |
|  - Filtro de Seguridad (Spring Security 6 - JwtAuthenticationFilter)     |
|  - Capa de Servicios (@Service, @Transactional ACID)                     |
|  - Validadores (Jakarta Bean Validation / @Valid)                        |
|  - Manejador Global de Excepciones (@RestControllerAdvice)               |
+--------------------------------------------------------------------------+
                                     │  JPA / Hibernate (Dialecto MySQL 8)
                                     │  HikariCP Connection Pool
                                     ▼
+--------------------------------------------------------------------------+
|                       CAPA DE PERSISTENCIA (MYSQL 8.4)                   |
|  - Motor de Almacenamiento: InnoDB (Transacciones ACID)                  |
|  - Integridad Referencial (Claves Foráneas ON DELETE RESTRICT)           |
|  - Índices B-Tree en FKs y Estados | Restricciones CHECK                 |
+--------------------------------------------------------------------------+
```

### 1.2 Componentes del Stack
- **Backend:** Java 17/21 (LTS), Spring Boot 3.x (`spring-boot-starter-web`, `spring-boot-starter-data-jpa`, `spring-boot-starter-security`, `spring-boot-starter-validation`).
- **Seguridad Criptográfica:** Spring Security 6, `BCryptPasswordEncoder` (coste 10), librería `java-jwt` (Auth0) o `jjwt` para tokens HMAC-SHA256.
- **Frontend:** HTML5, CSS3 (Bootstrap 5.3 o Tailwind), Vanilla JS ES6+ estructurado modularmente con Fetch API y `SessionStorage` / `LocalStorage`.
- **Persistencia:** MySQL 8.4 Community Edition con motor transaccional InnoDB, conector `mysql-connector-j`.
- **Infraestructura:** Docker Compose (multi-container), Dockerfile multi-stage (Maven build + JRE 21 runtime).

---

## 2. Modelo de Datos y Persistencia (ERD y DDL)

### 2.1 Diagrama Entidad-Relación (ERD) Lógico
```
 [ROLES] 1 ────< N [USUARIOS] 1 ────< N [PEDIDOS] 1 ────< N [DETALLE_PEDIDOS]
                                                                    │
 [CATEGORIAS] 1 ────< N [PRODUCTOS] 1 ──────────────────────────────┘
```

### 2.2 Especificación Detallada de Tablas y Restricciones (DDL)

```sql
-- Creación de Base de Datos y Configuración
CREATE DATABASE IF NOT EXISTS mini_ecommerce CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE mini_ecommerce;

-- 1. Tabla de Roles (RBAC)
CREATE TABLE roles (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(30) NOT NULL UNIQUE
) ENGINE=InnoDB;

-- 2. Tabla de Usuarios
CREATE TABLE usuarios (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    rol_id BIGINT UNSIGNED NOT NULL,
    nombres_completos VARCHAR(150) NOT NULL,
    correo VARCHAR(150) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    telefono VARCHAR(20) NOT NULL,
    direccion_envio VARCHAR(255) NOT NULL,
    acepta_politica_datos TINYINT(1) NOT NULL DEFAULT 1,
    estado ENUM('ACTIVO', 'INACTIVO') NOT NULL DEFAULT 'ACTIVO',
    fecha_registro DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_usuarios_roles FOREIGN KEY (rol_id) REFERENCES roles(id) ON DELETE RESTRICT
) ENGINE=InnoDB;

-- 3. Tabla de Categorías
CREATE TABLE categorias (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL UNIQUE,
    descripcion VARCHAR(255) NULL,
    estado ENUM('ACTIVA', 'INACTIVA') NOT NULL DEFAULT 'ACTIVA',
    INDEX idx_categorias_estado (estado)
) ENGINE=InnoDB;

-- 4. Tabla de Productos
CREATE TABLE productos (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    categoria_id BIGINT UNSIGNED NOT NULL,
    sku VARCHAR(50) NOT NULL UNIQUE,
    nombre VARCHAR(150) NOT NULL,
    descripcion TEXT NULL,
    precio DECIMAL(12,2) NOT NULL,
    stock INT NOT NULL,
    imagen_url VARCHAR(255) NOT NULL,
    estado ENUM('ACTIVO', 'INACTIVO') NOT NULL DEFAULT 'ACTIVO',
    CONSTRAINT fk_productos_categorias FOREIGN KEY (categoria_id) REFERENCES categorias(id) ON DELETE RESTRICT,
    CONSTRAINT chk_productos_precio CHECK (precio > 0),
    CONSTRAINT chk_productos_stock CHECK (stock >= 0),
    INDEX idx_productos_categoria (categoria_id),
    INDEX idx_productos_estado (estado),
    INDEX idx_productos_nombre (nombre)
) ENGINE=InnoDB;

-- 5. Tabla de Pedidos (Encabezado Transaccional)
CREATE TABLE pedidos (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    codigo_orden VARCHAR(30) NOT NULL UNIQUE,
    usuario_id BIGINT UNSIGNED NOT NULL,
    fecha_pedido DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    direccion_entrega VARCHAR(255) NOT NULL,
    telefono_contacto VARCHAR(20) NOT NULL,
    metodo_pago ENUM('CONTRAENTREGA', 'TRANSFERENCIA_NEQUI_PSE', 'TARJETA_DEMO') NOT NULL,
    subtotal DECIMAL(12,2) NOT NULL,
    impuestos DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    costo_envio DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    total DECIMAL(12,2) NOT NULL,
    estado ENUM('PENDIENTE', 'PAGADO', 'ENVIADO', 'ENTREGADO', 'CANCELADO') NOT NULL DEFAULT 'PENDIENTE',
    CONSTRAINT fk_pedidos_usuarios FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE RESTRICT,
    INDEX idx_pedidos_usuario (usuario_id),
    INDEX idx_pedidos_fecha (fecha_pedido),
    INDEX idx_pedidos_estado (estado)
) ENGINE=InnoDB;

-- 6. Tabla de Detalle de Pedidos (Inmutabilidad Histórica)
CREATE TABLE detalle_pedidos (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    pedido_id BIGINT UNSIGNED NOT NULL,
    producto_id BIGINT UNSIGNED NOT NULL,
    cantidad INT NOT NULL,
    precio_unitario_historico DECIMAL(12,2) NOT NULL,
    subtotal_linea DECIMAL(12,2) NOT NULL,
    CONSTRAINT fk_detalle_pedidos FOREIGN KEY (pedido_id) REFERENCES pedidos(id) ON DELETE RESTRICT,
    CONSTRAINT fk_detalle_productos FOREIGN KEY (producto_id) REFERENCES productos(id) ON DELETE RESTRICT,
    CONSTRAINT chk_detalle_cantidad CHECK (cantidad > 0),
    INDEX idx_detalle_pedido (pedido_id),
    INDEX idx_detalle_producto (producto_id)
) ENGINE=InnoDB;
```

### 2.3 Estrategia de Migración y Validación JPA
- **Modo Validación:** En `application.properties`, configurar:
  ```properties
  spring.jpa.hibernate.ddl-auto=validate
  spring.jpa.properties.hibernate.dialect=org.hibernate.dialect.MySQLDialect
  ```
- **Aprovisionamiento Semilla:** Ejecución declarativa de `init.sql` y `seed.sql` montados en `/docker-entrypoint-initdb.d/` para garantizar la persistencia del entorno limpio en Docker.

---

## 3. Integración de APIs, Seguridad y Regla del "Cliente Limpio"

### 3.1 Matriz de Endpoints RESTful (`/api/v1/...`)

| Endpoint | Método | Acceso RBAC | Descripción Técnica |
| :--- | :---: | :---: | :--- |
| `/api/v1/auth/register` | POST | Público | Registro de usuario, validación de Ley 1581 y hash bcrypt. |
| `/api/v1/auth/login` | POST | Público | Verificación de credenciales y retorno de token JWT firmado. |
| `/api/v1/usuarios/perfil` | PUT | `CLIENTE` | Actualización de dirección predeterminada, teléfono y clave. |
| `/api/v1/catalogo/productos` | GET | Público | Listado paginado/filtrado de productos activos con categoría activa. |
| `/api/v1/catalogo/productos/{id}` | GET | Público | Detalle de producto y consulta de unidades disponibles en stock. |
| `/api/v1/catalogo/categorias` | GET | Público | Listado de categorías en estado Activa para filtros. |
| `/api/v1/carrito/calcular` | POST | Público / Auth | Recibe `[{productoId, cantidad}]`, valida existencias y recalcula en COP. |
| `/api/v1/pedidos/checkout` | POST | `CLIENTE` | **Transacción ACID:** Recalcula precios en BD, descuenta stock y crea orden. |
| `/api/v1/pedidos/mis-pedidos` | GET | `CLIENTE` | Historial de pedidos propios del usuario ordenados por fecha descendente. |
| `/api/v1/pedidos/{id}/comprobante` | GET | `CLIENTE`/`ADMIN`| Consulta comprobante digital. Retorna HTTP 403 si pertenece a otro cliente. |
| `/api/v1/pedidos/{id}/cancelar` | PATCH | `CLIENTE` | Cancelación de pedido propio (solo en *Pendiente*) con restitución de stock. |
| `/api/v1/admin/categorias` | CRUD | `ADMIN` | CRUD de categorías; bloquea borrado físico con productos vinculados. |
| `/api/v1/admin/productos` | CRUD | `ADMIN` | CRUD de productos, subida de imagen ($\le 2$ MB) y alertas de bajo stock ($\le 5$). |
| `/api/v1/admin/pedidos` | GET/PATCH | `ADMIN` | Gestión de estados de órdenes; reintegra stock al pasar a *Cancelado*. |
| `/api/v1/admin/dashboard/kpis` | GET | `ADMIN` | KPIs financieros (ingresos sin cancelados, conteo de estados, Top 5). |

### 3.2 La Regla del "Cliente Limpio" y Transacciones ACID
- **Cálculo Financiero:** El frontend solo envía identificadores y cantidades. El backend recupera el precio unitario vigente desde la base de datos para calcular el subtotal, aplica la tarifa fija de envío local y totaliza la transacción.
- **Atomicidad Transaccional:** El servicio `@Service` implementa:
  ```java
  @Transactional(rollbackFor = Exception.class)
  public PedidoResponseDTO procesarCheckout(Long usuarioId, CheckoutRequestDTO dto) {
      // 1. Validar y bloquear stock con bloqueo pesimista/optimista
      // 2. Descontar existencias en la tabla productos
      // 3. Insertar registro en tabla pedidos
      // 4. Insertar líneas en detalle_pedidos con precio histórico inmutable
      // En caso de fallo o stock insuficiente -> ROLLBACK automático
  }
  ```

### 3.3 Gestión de Secretos y Seguridad de Cabeceras
- Claves sensibles (`DB_PASSWORD`, `JWT_SECRET`, `JWT_EXPIRATION_MS`) inyectadas exclusivamente por variables de entorno vía Docker Compose y archivo `.env`.
- El cliente almacena el JWT en `sessionStorage` y lo adjunta en cada petición mediante `Authorization: Bearer <token>`.
- Al invocar "Cerrar sesión", el frontend destruye el token en almacenamiento local, impidiendo la navegación histórica con el botón "Atrás".

---

## 4. Estrategia de Pruebas y Validación de Datos

### 4.1 Contratos de Validación (DTOs de Entrada)
- **RegistroUsuarioRequestDTO:**
  - `nombresCompletos`, `telefono`, `direccionEnvio`: `@NotBlank`
  - `correo`: `@NotBlank`, `@Email(regexp = "^[A-Za-z0-9+_.-]+@[A-Za-z0-9.-]+\\.[A-Za-z]{2,}$")`
  - `password`: `@NotBlank`, `@Size(min = 8)`
  - `aceptaPoliticaDatos`: `@AssertTrue`
- **ProductoRequestDTO:**
  - `sku`, `nombre`: `@NotBlank`
  - `categoriaId`: `@NotNull`
  - `precio`: `@NotNull`, `@DecimalMin(value = "0.01")`
  - `stock`: `@NotNull`, `@Min(value = 0)`
- **CheckoutRequestDTO:**
  - `items`: `@NotEmpty`
  - `direccionEntrega`, `telefonoContacto`: `@NotBlank`
  - `metodoPago`: `@NotNull` (Valores: `CONTRAENTREGA`, `TRANSFERENCIA_NEQUI_PSE`, `TARJETA_DEMO`)
  - *Nota:* Omite deliberadamente campos monetarios para evitar manipulación en cliente.

### 4.2 Pirámide de Pruebas para Sustentación
1. **JUnit 5 + Mockito:** Pruebas unitarias de servicios de negocio (recálculo de precios, alertas de bajo stock $\le 5$, y máquina de estados de pedidos).
2. **`@SpringBootTest` + MockMvc:** Pruebas de integración transaccional para verificar ROLLBACK ante stock insuficiente y validación de filtros RBAC (HTTP 403 ante accesos no autorizados a `/api/v1/admin/**`).
3. **Colección Postman / Newman:** Suite automatizada de pruebas HTTP para verificar contratos de API, códigos de respuesta (200, 201, 400, 403) y tiempo de ejecución $\le 2000$ ms.

---

## 5. DevOps, Despliegue y Observabilidad

### 5.1 Orquestación con Docker Compose (`docker-compose.yml`)
```yaml
version: '3.8'

services:
  db:
    image: mysql:8.4
    container_name: ecommerce-mysql
    restart: always
    environment:
      MYSQL_DATABASE: mini_ecommerce
      MYSQL_ROOT_PASSWORD: ${DB_ROOT_PASSWORD}
      MYSQL_USER: ${DB_USER}
      MYSQL_PASSWORD: ${DB_PASSWORD}
    ports:
      - "3306:3306"
    volumes:
      - mysql_data:/var/lib/mysql
      - ./sql/init.sql:/docker-entrypoint-initdb.d/01_init.sql
      - ./sql/seed.sql:/docker-entrypoint-initdb.d/02_seed.sql
    healthcheck:
      test: ["CMD", "mysqladmin", "ping", "-h", "localhost"]
      interval: 5s
      timeout: 5s
      retries: 10
    networks:
      - ecommerce-net

  app:
    build:
      context: .
      dockerfile: Dockerfile
    container_name: ecommerce-app
    restart: always
    depends_on:
      db:
        condition: service_healthy
    environment:
      SPRING_DATASOURCE_URL: jdbc:mysql://db:3306/mini_ecommerce?useSSL=false&serverTimezone=UTC&allowPublicKeyRetrieval=true
      SPRING_DATASOURCE_USERNAME: ${DB_USER}
      SPRING_DATASOURCE_PASSWORD: ${DB_PASSWORD}
      JWT_SECRET: ${JWT_SECRET}
      JWT_EXPIRATION_MS: ${JWT_EXPIRATION_MS}
    ports:
      - "8080:8080"
    volumes:
      - ./uploads:/app/uploads
      - ./logs:/app/logs
    networks:
      - ecommerce-net

volumes:
  mysql_data:

networks:
  ecommerce-net:
    driver: bridge
```

### 5.2 Observabilidad, Logging y Auditoría
- **SLF4J + Logback:** Logs estructurados en archivo rotativo (`logs/mini-ecommerce.log`) y salida estándar. Traza explícita en nivel `INFO` de pedidos creados y unidades descontadas; nivel `WARN` para stock insuficiente y ROLLBACK.
- **Manejador Global `@RestControllerAdvice`:** Captura de excepciones de negocio (`StockInsuficienteException`, `RecursoDuplicadoException`) y traducción automática a JSON estructurado en lenguaje natural.
- **Filtro de Rendimiento:** `OncePerRequestFilter` registrando la cabecera `X-Response-Time-Ms` con alerta en consola ante peticiones que superen los 2000 ms (RNF-01).
- **Spring Boot Actuator:** Endpoint `/actuator/health` expuesto para monitorear el estado del pool de base de datos HikariCP y la salud general de la aplicación.