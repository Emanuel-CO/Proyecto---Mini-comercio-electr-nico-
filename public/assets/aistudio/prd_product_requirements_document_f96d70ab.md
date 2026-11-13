# PRD: Documento de Requisitos de Producto (Product Requirements Document)
**Proyecto:** Sistema de Mini Comercio Electrónico (Mini E-Commerce)  
**Modalidad:** Single-Vendor | Entrega Individual (1 Mes / 4 Semanas)  
**Autor:** Emanuel Conde Ocampo  
**Evaluador / Contexto Académico:** Instructor Javier Huberto Pinto (SENA)  

---

## 1. El Problema y los Objetivos de Negocio (El "Porqué")

### 1.1 Contexto y Declaración del Problema
Pequeños negocios, tiendas minoristas y emprendimientos locales en ciudades intermedias como Neiva operan la exhibición de su catálogo y la toma de pedidos mediante canales informales y manuales (WhatsApp, llamadas y redes sociales). Esta dinámica introduce ineficiencias críticas:
- **Cuellos de Botella Comerciales:** Los compradores desconocen la disponibilidad real del inventario y los precios vigentes, lo que satura los canales de mensajería con consultas repetitivas, provoca errores de cálculo aritmético manual y genera sobreventa de artículos agotados.
- **Carencia de Control Administrativo:** Falta de trazabilidad en el ciclo de vida de los pedidos, ausencia de inventario centralizado en tiempo real y desconocimiento de indicadores financieros diarios y de rotación de productos.
- **Inviabilidad de Plataformas Externas:** Las alternativas de comercio electrónico a gran escala presentan comisiones recurrentes por transacción, curvas de aprendizaje pronunciadas y funcionalidades desproporcionadas para comercios de un solo vendedor.

### 1.2 Propuesta de Valor y Visión
Aplicación web transaccional ligera, autónoma y sin comisiones por transacción, adaptada al flujo de un único comercio (*Single-Vendor*). Transforma la gestión manual en un circuito digital automatizado de extremo a extremo que integra:
1. **Vitrina Comercial (*Storefront*) y Carrito Dinámico:** Catálogo público con validación de existencias en tiempo real, búsqueda y filtrado ágil, y desglose automático en Pesos Colombianos (COP) sin errores de redondeo.
2. **Cierre de Pedidos (*Checkout*) Seguro y Declarativo:** Formalización de compras con métodos de pago simulados/declarativos (Contraentrega, Transferencia Nequi/PSE y Tarjeta demostrativa), comprobante digital inmediato y descuento atómico de inventario bajo transacciones ACID que elimina la sobreventa.
3. **Panel Administrativo (*Backoffice*):** Control centralizado del catálogo (CRUD de categorías y productos), gestión del ciclo de vida del pedido con restitución automática de existencias al cancelar y supervisión de métricas clave del negocio.

### 1.3 Objetivos de Éxito y KPIs
- **Métricas Comerciales (Dashboard Administrativo - RF-15):**
  - **Ingresos Totales en COP:** Consolidado exacto de ventas confirmadas en un rango temporal, excluyendo pedidos cancelados.
  - **Volumen de Pedidos por Estado:** Conteo de órdenes distribuidas en *Pendiente*, *Pagado*, *Enviado*, *Entregado* y *Cancelado*.
  - **Top 5 de Productos Más Vendidos:** Identificación de artículos de mayor rotación para abastecimiento.
  - **Índice de Alertas de Stock Crítico:** Supervisión de productos con existencias $\le 5$ unidades o agotados ($0$ unidades).
- **Métricas de Integridad Operativa y UX (RNF):**
  - **Cero Inconsistencias de Inventario (0% Sobreventa):** Exactitud del 100% en el descuento atómico de stock y restitución al cancelar (RNF-02).
  - **Conversión de Compra en 4 Pasos:** Completar el flujo desde el catálogo hasta el Checkout en un máximo de 4 pasos sin requerir capacitación previa (RNF-04).
  - **Rendimiento de Interacción:** Tiempos de respuesta visual e interactiva en catálogo y carrito $\le 2$ segundos (RNF-01).

---

## 2. Usuarios, Roles y Permisos (El "Quién")

### 2.1 Usuarios Finales
- **Administrador (Propietario / Operador de Tienda):** Encargado de publicar productos, gestionar existencias, despachar pedidos y monitorear ventas.
- **Cliente Registrado (Comprador Autenticado):** Usuario que gestiona su dirección, formaliza órdenes de compra, descarga comprobantes y consulta su historial.
- **Visitante (Invitado No Autenticado):** Usuario público que explora el catálogo comercial, filtra productos y prepara un carrito temporal.

### 2.2 Matriz de Control de Acceso Basado en Roles (RBAC)

| Módulo / Acción | Visitante (Público) | Cliente Registrado | Administrador |
| :--- | :---: | :---: | :---: |
| Explorar Catálogo y Ver Detalles | Autorizado | Autorizado | Autorizado |
| Búsqueda por Nombre y Filtro por Categoría | Autorizado | Autorizado | Autorizado |
| Gestionar Carrito de Compras en Navegador | Autorizado | Autorizado | N/A (Flujo Operativo) |
| Confirmar Pedido en Checkout | Bloqueado (Exige Login) | Autorizado | N/A |
| Acceso a "Mis Pedidos" y Comprobantes Propios | Bloqueado | Autorizado | N/A |
| Cancelar Pedido Propio (Solo en *Pendiente*) | Bloqueado | Autorizado | Autorizado (Cualquier orden) |
| Edición de Perfil y Dirección de Entrega | Bloqueado | Autorizado | Autorizado |
| CRUD de Categorías y Productos | Bloqueado (HTTP 403) | Bloqueado (HTTP 403) | Autorizado |
| Actualizar Estados del Pedido (*Pagado, Enviado...*) | Bloqueado (HTTP 403) | Bloqueado (HTTP 403) | Autorizado |
| Acceso a Dashboard y KPIs Financieros | Bloqueado (HTTP 403) | Bloqueado (HTTP 403) | Autorizado |

---

## 3. Requerimientos Funcionales y Criterios de Aceptación (El "Qué")

### Módulo 1: Autenticación, Usuarios y Seguridad
- **RF-01: Registro de Usuarios**
  - *Entrada:* Nombres y apellidos, correo, contraseña, teléfono, dirección predeterminada y casilla de aceptación de la Ley 1581 de 2012.
  - *Salida:* Usuario registrado con rol `Cliente` (o `Administrador`), contraseña con hash seguro y confirmación en pantalla.
  - *Criterios:* Contraseña $\ge 8$ caracteres hasheada con bcrypt. Validación regex de correo. Bloqueo estricto del registro si no se acepta la política de datos personales (RNF-08). Error "El correo ingresado ya se encuentra asociado a una cuenta" ante duplicados.
- **RF-02: Inicio de Sesión (Login)**
  - *Entrada:* Correo y contraseña.
  - *Salida:* Token JWT con `id_usuario` y `rol`; redirección diferenciada (Admin $\rightarrow$ Dashboard; Cliente $\rightarrow$ Catálogo/Checkout).
  - *Criterios:* Mensaje genérico "Correo o contraseña incorrectos" ante credenciales inválidas. Bloqueo con mensaje "Cuenta suspendida por el administrador" si la cuenta está inactiva.
- **RF-03: Control RBAC y Cierre de Sesión**
  - *Entrada:* Token en cabeceras HTTP o acción "Cerrar sesión".
  - *Salida:* Autorización/denegación (HTTP 403) y destrucción del token local.
  - *Criterios:* Al cerrar sesión, la destrucción del token impide acceder a vistas privadas usando el botón "Atrás" del navegador. Bloqueo de rutas `/admin` a clientes con mensaje "Acceso no autorizado".
- **RF-14: Edición de Perfil de Cliente**
  - *Entrada:* Nombre, teléfono, dirección de entrega y contraseña actual/nueva.
  - *Salida:* Datos actualizados en BD.
  - *Criterios:* Los datos actualizados se precargan en el siguiente Checkout. Validación obligatoria de la contraseña actual si se desea cambiar.

### Módulo 2: Catálogo e Inventario (Backoffice)
- **RF-04: Gestión de Categorías (CRUD)**
  - *Entrada:* Nombre, descripción, estado (Activa / Inactiva).
  - *Salida:* Registro creado/actualizado.
  - *Criterios:* Solo categorías activas se muestran al público. Prohibición de nombres duplicados. Prohibición de eliminación física si contiene productos asociados, sugiriendo inactivarla.
- **RF-05: Gestión de Productos (CRUD)**
  - *Entrada:* SKU, nombre, descripción, categoría, precio en COP, stock inicial, imagen ($\le 2$ MB), estado.
  - *Salida:* Producto persistido y publicado en vitrina.
  - *Criterios:* Todo producto debe asociarse a una categoría existente. Bloqueo si precio $\le 0$ o stock $< 0$. SKU único. Cambios de precio posteriores no alteran órdenes previas.
- **RF-06: Control de Inventario y Alertas de Stock**
  - *Entrada:* Eventos de compra/cancelación y conteo de existencias.
  - *Salida:* Stock actualizado y alertas operativas.
  - *Criterios:* Si stock llega a 0, mostrar etiqueta "Agotado" y deshabilitar botón de compra. En el Backoffice, productos con stock $\le 5$ se destacan en amarillo/rojo. Bloqueo si cantidad solicitada $>$ stock disponible.

### Módulo 3: Vitrina Comercial (*Storefront*) y Carrito
- **RF-07: Vitrina Comercial y Filtros**
  - *Entrada:* Búsqueda por texto, categoría, orden por precio.
  - *Salida:* Cuadrícula responsiva de productos activos con categoría activa.
  - *Criterios:* Tiempos de respuesta $\le 2$ segundos. Si no hay coincidencias, mostrar mensaje informativo y botón de limpiar filtros.
- **RF-08: Carrito de Compras Dinámico**
  - *Entrada:* Selección de producto, cantidad, incremento/decremento o vaciado.
  - *Salida:* Estado actualizado del carrito en sesión del navegador.
  - *Criterios:* Acumular unidades sobre la misma fila sin duplicarla. Persistencia en `localStorage`/`sessionStorage`. Bloqueo con alerta "Solo quedan X unidades disponibles" al intentar exceder el stock.
- **RF-09: Cálculo Financiero Seguro**
  - *Entrada:* Ítems y cantidades del carrito.
  - *Salida:* Desglose de Subtotal, impuestos, envío y Total en COP.
  - *Criterios:* Cálculo matemático exacto sin errores de redondeo. El backend ignora precios del navegador y recalcula directamente contra la base de datos.

### Módulo 4: Checkout, Pedidos y Comprobantes
- **RF-10: Confirmación de Pedido (Checkout)**
  - *Entrada:* Carrito no vacío, usuario autenticado, dirección, teléfono y método de pago.
  - *Salida:* Orden registrada con código único, stock descontado y carrito vaciado.
  - *Criterios:* Transacción atómica ACID (BEGIN, COMMIT, ROLLBACK). Cero inconsistencias de inventario. Redirección automática al comprobante.
- **RF-11: Comprobante Digital de Compra**
  - *Entrada:* `id_pedido`.
  - *Salida:* Vista imprimible/exportable a PDF con código de orden, ítems, precios históricos y total pagado.
  - *Criterios:* Aislamiento de datos: retorno de HTTP 403 si un cliente intenta consultar la orden de otro comprador.

### Módulo 5: Seguimiento y Métricas
- **RF-12: Gestión de Estados del Pedido y Cancelación**
  - *Entrada:* `id_pedido` y nuevo estado (*Pendiente, Pagado, Enviado, Entregado, Cancelado*).
  - *Salida:* Estado actualizado y restitución de stock si pasa a *Cancelado*.
  - *Criterios:* Cliente solo puede cancelar si la orden está en *Pendiente*. Prohibido cancelar órdenes en *Enviado* o *Entregado*. Bloqueo de reversión a *Pendiente* en pedidos cerrados.
- **RF-13: Historial "Mis Pedidos"**
  - *Entrada:* Solicitud del cliente autenticado.
  - *Salida:* Listado cronológico descendente de sus compras.
  - *Criterios:* Mostrar estado vacío informativo con botón al catálogo si no registra pedidos.
- **RF-15: Dashboard Administrativo y Reportes**
  - *Entrada:* Rango de fechas seleccionado (por defecto: mes actual).
  - *Salida:* Tarjetas de KPIs (Ingresos en COP excluyendo cancelados, órdenes por estado, Top 5 más vendidos y tabla de ventas exportable/imprimible).
  - *Criterios:* Si no hay ventas en el periodo, mostrar valores en \$0 sin fallos visuales ni divisiones por cero.

---

## 4. Restricciones y Exclusiones de Alcance

### 4.1 Requisitos No Funcionales Mandatorios
- **RNF-01 (Rendimiento):** Tiempo de respuesta visual e interactiva $\le 2$ s. Imágenes de producto limitadas a un peso máximo de 2 MB.
- **RNF-02 (Integridad ACID):** Motor relacional MySQL 8.x (InnoDB) con transacciones explícitas para descuento y reintegro de stock.
- **RNF-03 (Seguridad):** Hashing bcrypt para contraseñas, JWT con expiración, y parámetros de consulta protegidos contra inyección SQL.
- **RNF-04 (Usabilidad):** Flujo de compra completado en un máximo de 4 pasos con barra de navegación superior fija y contador de carrito.
- **RNF-05 (Diseño Responsivo):** Adaptabilidad visual garantizada desde 360px (móvil) hasta 1920px (escritorio).
- **RNF-06 (Estándares):** Operación sobre HTML5, CSS3 y JS ES6+ compatible con Chrome, Firefox y Edge sin plugins propietarios.
- **RNF-07 (Mantenibilidad):** Arquitectura en tres capas y patrón MVC/modular desde la Semana 1.
- **RNF-08 (Cumplimiento Legal):** Casilla obligatoria de tratamiento de datos personales conforme a la Ley 1581 de 2012 de Colombia.
- **RNF-09 (Confiabilidad y Datos Semilla):** Archivo `init.sql` / `seed.sql` autocontenido para aprovisionar datos de demostración en Docker Compose.
- **RNF-10 (Plazo Inamovible):** Construcción y sustentación en 1 mes (4 semanas) con entrega única.

### 4.2 Exclusiones de Alcance (*Out of Scope*)
- **OOS-01:** Prohibida la integración de pasarelas bancarias reales (Stripe, Wompi, PayU, MercadoPago) o cumplimiento PCI DSS; pagos 100% declarativos/simulados.
- **OOS-02:** Prohibida la integración de APIs de transportadoras logísticas (Servientrega, Coordinadora) o cotización GPS de fletes.
- **OOS-03:** Prohibido el soporte multi-tienda o marketplace (*Single-Vendor* exclusivo).
- **OOS-04:** Prohibido el desarrollo de aplicaciones móviles nativas (Android/iOS).
- **OOS-05:** Prohibido el módulo de facturación electrónica XML o enlace con la DIAN.
- **OOS-06:** Prohibidos módulos de inteligencia artificial o chats en vivo.
- **OOS-07:** Prohibida la automatización de reembolsos bancarios.

---

## 5. Expectativas de Pruebas y Comportamientos Críticos
1. **Transaccionalidad ACID y Concurrencia:** Verificación de inserción en `pedidos`/`detalle_pedidos` y descuento en `productos` bajo una única transacción. Prueba de ROLLBACK completo ante fallo simulado.
2. **Restitución de Stock:** Comprobación de suma automática de existencias al cambiar pedido a *Cancelado*.
3. **Inmutabilidad Financiera:** Asegurar que modificar el precio de un producto en el catálogo no altere el valor unitario histórico de órdenes confirmadas previamente.
4. **Validaciones RBAC y de Negocio:** Bloqueo HTTP 403 a rutas `/admin` con rol Cliente; aislamiento de comprobantes entre usuarios; rechazo de registro sin aceptar la Ley 1581; y bloqueo de borrado físico en categorías con productos.