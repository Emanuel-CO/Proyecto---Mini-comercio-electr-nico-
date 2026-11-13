# PLAN: Hoja de Ruta de Desarrollo (Development Roadmap)
**Proyecto:** Sistema de Mini Comercio Electrónico (Mini E-Commerce)  
**Ciclo:** 1 Mes (4 Semanas de Desarrollo Individual)  
**Metodología:** Cimientos Arquitecturales + *Vertical Slices* Modulares (End-to-End)  
**Capacidad Total:** 12 Historias de Usuario / 39 Puntos de Historia (~28 Tickets Técnicos)  

---

## 1. Definición del MVP vs. Fases Incrementales

```
[SEMANA 1] ────────────────> [SEMANA 2] ────────────────> [SEMANA 3] ────────────────> [SEMANA 4]
Cimientos & Auth RBAC       Catálogo & Vitrina           Carrito & Checkout ACID     Dashboard, Datos & Sustentación
(Esquema, JWT, Roles)       (CRUDs, Stock, Filtros)      (4 Pasos, Transacciones)    (KPIs, seed.sql, Ensayos)
       ▲                            ▲                            ▲                            ▲
   GATE 1 & 2                   GATE 1, 2, 3                 GATE 1, 2, 3, 4              CODE FREEZE & DER
```

- **Fase 1: MVP Crítico (Semanas 1 a 3):**
  - Módulos indispensables: Base de datos relacional, Auth JWT con RBAC, CRUD de categorías y productos, vitrina pública responsiva, carrito con cálculo en servidor, Checkout en 4 pasos bajo transacciones ACID y máquina de estados de pedidos.
- **Fase 2: Trazabilidad y Analítica (Semana 3 a 4):**
  - Comprobante digital exportable a PDF (RF-11), módulo "Mis Pedidos" (RF-13), alertas visuales de stock $\le 5$ (HU-11) y Dashboard con KPIs financieros (RF-15).
- **Fase 3: Cierre y Sustentación (Semana 4):**
  - Perfil de cliente (RF-14), script `seed.sql` para exposición inmediata (RNF-09), manual rápido de despliegue, DER final y congelamiento de código.

---

## 2. Estructura de Hitos Semanales y Desglose de Tickets

### Semana 1: Cimientos de Datos, Arquitectura Modular y Seguridad RBAC
- **Objetivo:** Disponer de los contenedores Docker operativos, esquema de persistencia inicializado y flujo de autenticación seguro implementado.
- **Entregables Técnicos:**
  - `TICK-01`: Definición de `docker-compose.yml`, configuración de MySQL 8.4 y creación del script `init.sql` con las 6 tablas, restricciones CHECK e índices.
  - `TICK-02`: Estructura base de paquetes en capas en Spring Boot 3.x (config, controller, service, repository, model, dto) y configuración de JPA en modo `validate`.
  - `TICK-03`: Módulo Backend de Seguridad: Entidades `Usuario` y `Rol`, `BCryptPasswordEncoder`, utilidades JWT y filtro `JwtAuthenticationFilter`.
  - `TICK-04`: Endpoints REST `POST /api/v1/auth/register` (validando Ley 1581) y `POST /api/v1/auth/login`. Manejo de excepciones de autenticación.
  - `TICK-05`: Frontend Base: Maquetado responsivo de barra de navegación superior fija, formulario de Registro y formulario de Login con almacenamiento seguro del JWT en `sessionStorage`.
  - `TICK-06`: Pruebas de integración MockMvc para validar generación de JWT y retorno de HTTP 403 ante acceso no autenticado a rutas privadas.
- **Criterio de Salida:** Contenedores levantando limpios; usuario creado con clave cifrada en BD; login funcional con token emitido y guardado en sesión.

### Semana 2: Gestión de Catálogo, Control de Inventario y Vitrina Comercial
- **Objetivo:** Backoffice administrativo para gestión de categorías/productos y vitrina pública responsiva con filtros en tiempo real.
- **Entregables Técnicos:**
  - `TICK-07`: Backend CRUD de Categorías (`/api/v1/admin/categorias`): validación de nombres únicos y regla de negocio que prohíbe el borrado físico si tiene productos asociados.
  - `TICK-08`: Backend CRUD de Productos (`/api/v1/admin/productos`): SKU único, validación de precio $> 0$, stock $\ge 0$ y subida de imágenes locales con límite de 2 MB.
  - `TICK-09`: Backend Catálogo Público (`/api/v1/catalogo/**`): Endpoints optimizados con índices SQL para listar solo productos activos de categorías activas y detalle por ID en $< 2$ s.
  - `TICK-10`: Frontend Backoffice: Interfaz administrativa para crear/editar categorías y productos con carga de imágenes y tabla con alerta visual para stock $\le 5$.
  - `TICK-11`: Frontend Storefront: Cuadrícula responsiva de productos con buscador por palabra clave, filtro instantáneo por categoría y etiqueta "Agotado" con botón deshabilitado si stock == 0.
  - `TICK-12`: Pruebas unitarias JUnit 5 sobre validaciones de producto y pruebas de rendimiento visual ($\le 2$ s) en resoluciones móvil (360px) y escritorio.
- **Criterio de Salida:** Productos creados desde el Backoffice visualizados de inmediato en la tienda pública; respuestas del catálogo en menos de 2 segundos.

### Semana 3: Carrito Dinámico, Checkout Transaccional ACID y Ciclo de Pedidos
- **Objetivo:** Cerrar el núcleo transaccional del MVP con cero sobreventa y gestión de estados de las órdenes.
- **Entregables Técnicos:**
  - `TICK-13`: Frontend Carrito de Compras: Manejo dinámico en `localStorage`/`sessionStorage`, adición sin duplicar filas, límite de stock interactivo y visualización de totales en COP.
  - `TICK-14`: Backend Cálculo Seguro (`POST /api/v1/carrito/calcular`): Recalcula subtotales y totales ignorando datos del navegador mediante precios vigentes de la base de datos.
  - `TICK-15`: Backend Checkout Transaccional (`POST /api/v1/pedidos/checkout`): Servicio `@Transactional` con bloqueo de stock, creación de `pedidos` y `detalle_pedidos` con precio histórico inmutable, y descuento de existencias.
  - `TICK-16`: Frontend Checkout en 4 Pasos: Integración con datos precargados del cliente, selección de método de pago declarativo (Contraentrega, Nequi/PSE, Tarjeta Demo) y confirmación con spinner.
  - `TICK-17`: Comprobante Digital (`GET /api/v1/pedidos/{id}/comprobante`): Vista imprimible/exportable a PDF con validación de aislamiento de datos (HTTP 403 si pertenece a otro cliente).
  - `TICK-18`: Backend y Frontend de Ciclo de Estados (`PATCH /api/v1/admin/pedidos`): Actualización de estados por Admin y cancelación por Cliente (solo en *Pendiente*) con restitución atómica de unidades al stock.
  - `TICK-19`: Pruebas de integración `@SpringBootTest`: Simulación de fallo concurrente verificando ROLLBACK transaccional y prueba de reintegro de existencias.
- **Criterio de Salida:** Flujo completo de compra validado en 4 pasos; comprobante PDF generado; cero discrepancias de inventario tras compras y cancelaciones.

### Semana 4: Dashboard de Analítica, Historial de Cliente, Datos Semilla y Sustentación
- **Objetivo:** Trazabilidad, consolidación de métricas de negocio, preparación del entorno de demostración inmutable y sustentación final.
- **Entregables Técnicos:**
  - `TICK-20`: Frontend "Mis Pedidos": Vista cronológica de compras del cliente con insignias de estado y botón de cancelación condicional.
  - `TICK-21`: Edición de Perfil (`PUT /api/v1/usuarios/perfil`): Actualización de dirección y teléfono precargables en Checkout, y cambio de clave validando la actual.
  - `TICK-22`: Backend Dashboard (`GET /api/v1/admin/dashboard/kpis`): Consultas SQL agregadas para calcular total de ingresos en COP (excluyendo cancelados), órdenes por estado y Top 5 más vendidos en el rango de fechas.
  - `TICK-23`: Frontend Dashboard Administrativo: Tarjetas de KPIs, gráficos/tablas de resumen y botón de exportar/imprimir reporte de ventas.
  - `TICK-24`: Script `seed.sql`: Aprovisionamiento completo con usuario Administrador, categorías, productos con imágenes reales y pedidos de prueba históricos.
  - `TICK-25`: Colección Postman final con aserciones automatizadas de códigos HTTP y tiempos de respuesta.
  - `TICK-26`: Validación cruzada multi-navegador (Chrome, Firefox, Edge) y verificación en vivo desde dispositivo móvil vía red local / túnel seguro.
  - `TICK-27`: Congelamiento de Código (*Code Freeze* a 3 días del cierre): Consolidación de documentación (SRS, DER normalizado y Manual Rápido de Despliegue en Docker).
  - `TICK-28`: Ensayo general de la sustentación técnica ante el instructor Javier Huberto Pinto.
- **Criterio de Salida:** Aprobación de todas las puertas de validación; despliegue desde cero con `docker compose up -d --build` y sustentación ejecutada sin fallos.

---

## 3. Puertas de Calidad y Criterios de Parada (Validation Gates)

```
[Código del Ticket] ──> [Gate 1: Maven Compile] ──> [Gate 2: Docker/Actuator] ──> [Gate 3: Tests JUnit] ──> [Gate 4: Postman] ──> [Revisión Humana]
```

1. **Gate 1 (Compilación Limpia):** Ejecución obligatoria de `mvn clean compile`. Cero errores de sintaxis o importaciones rotas.
2. **Gate 2 (Arranque y Persistencia):** `docker compose up -d` exitoso con Hibernate en modo `validate` y `/actuator/health` en estado `UP`.
3. **Gate 3 (Arnés de Pruebas Unitarias y Transaccionales):** `mvn test` en verde. Cobertura de cálculos en COP, transacciones ACID y barreras RBAC.
4. **Gate 4 (Contratos de API y Rendimiento):** Suite Postman ejecutada sin fallos; tiempos de respuesta verificados por debajo de los 2000 ms (RNF-01).
5. **Human-in-the-Loop Checkpoints:**
   - *Semana 1:* Inspección de tablas en DBeaver y verificación de token JWT y bloqueo de rutas.
   - *Semana 2:* Auditoría visual de catálogo responsivo y alertas de stock $\le 5$.
   - *Semana 3:* Prueba de flujo de compra en 4 pasos y validación de comprobante PDF y reintegro de stock.
   - *Semana 4:* Prueba de despliegue desde cero con `seed.sql` limpio y ensayo de sustentación.

---

## 4. Estrategia de Feedback Externo y Triaje de Alcance

Para salvaguardar el cronograma de 4 semanas ante comentarios de evaluadores o pruebas con usuarios de prueba:
- **Pruebas Semanales (Viernes, 30 min):** Despliegue local expuesto por LAN o túnel seguro (Cloudflare Tunnel / Ngrok) para pruebas desde teléfonos reales.
- **Matriz de Triaje:**
  1. *Fallo Crítico / Bug de Regla de Negocio (ACID, cálculos COP, stock):* Se resuelve de forma inmediata el lunes siguiente.
  2. *Ajuste Visual o Mensaje de Error:* Se limita a un bloque de trabajo de máximo 2 horas.
  3. *Funcionalidad Fuera de Alcance (Pasarelas bancarias, transportadoras, chat IA):* Se rechaza formalmente respaldado en la sección Out of Scope (OOS-01 a OOS-07) del SRS.
- **Code Freeze Inamovible:** Tres (3) días antes de la fecha final del mes se congela la adición de funcionalidades para dedicación exclusiva al ensayo de exposición y documentación.