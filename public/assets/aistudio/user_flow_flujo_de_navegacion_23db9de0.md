# USER FLOW: Flujo de Navegación y Experiencia de Usuario

**Proyecto:** Sistema de Mini Comercio Electrónico (Mini E-Commerce)

**Principios de Diseño:** Usabilidad en 4 Pasos (RNF-04) | Respuestas $\le 2$ s (RNF-01) | Mensajes en Lenguaje Natural

## 1. Diagrama de Navegación Global y Puntos de Partida

```
                                  [ INGRESO A LA URL RAÍZ (/) ]
                                                │
                                                ▼
                          +-------------------------------------------+
                          |   VITRINA PÚBLICA (STOREFRONT ACTIVO)     |
                          |  - Barra superior fija con carrito        |
                          |  - Búsqueda por texto y filtro categorías |
                          +-------------------------------------------+
                                                │
                     ┌──────────────────────────┴──────────────────────────┐
                     ▼                                                     ▼
           [ USUARIO NO AUTENTICADO ]                             [ USUARIO AUTENTICADO ]
                     │                                                     │
       ┌─────────────┴─────────────┐                         ┌─────────────┴─────────────┐
       ▼                           ▼                         ▼                           ▼
[Explorar Catálogo]       [Armar Carrito]             [Rol: CLIENTE]              [Rol: ADMIN]
       │                           │                         │                           │
       ▼                           ▼                         ▼                           ▼
[Ver Detalle Prod]        [Intento Checkout]          [Storefront /             [Redirección al
                                   │                   Checkout Directo]         Backoffice /admin]
                                   ▼                         │                           │
                          [INTERCEPCIÓN LOGIN]               ▼                           ▼
                          [Formulario Acceso]         [Mis Pedidos /             [CRUD Catálogo,
                                   │                   Comprobante PDF]           Gestión Órdenes,
                                   ▼                                              Dashboard KPIs]
                          [Token JWT Emitido]
                                   │
                                   ▼
                          [Retorno al Checkout]

```

## 2. El "Happy Path" Paso a Paso

### 2.1 Happy Path del Cliente: Flujo de Compra en 4 Pasos (RNF-04)

```
+---------------------------------------------------------------------------------------------------+
| PASO 1: EXPLORACIÓN EN VITRINA (STOREFRONT)                                                       |
| - Cliente navega en el catálogo público (/), usa el buscador o filtra por categoría activa.       |
| - Visualiza tarjetas de producto con imagen, precio en COP ($ XX.XXX) y existencias disponibles.  |
| - Tiempo de carga / respuesta: < 2 segundos.                                                      |
+---------------------------------------------------------------------------------------------------+
                                                  │
                                                  ▼
+---------------------------------------------------------------------------------------------------+
| PASO 2: ADICIÓN AL CARRITO DINÁMICO                                                               |
| - Cliente presiona "Agregar al carrito" en el producto seleccionado.                              |
| - Sistema valida stock en tiempo real y suma cantidades si ya existía en la lista.                |
| - El contador de la barra superior fija se actualiza y muestra notificación visual de éxito.      |
+---------------------------------------------------------------------------------------------------+
                                                  │
                                                  ▼
+---------------------------------------------------------------------------------------------------+
| PASO 3: REVISIÓN DE CARRITO Y PASO A CAJA                                                         |
| - Cliente abre el carrito desde la barra superior y verifica subtotales por ítem y total en COP.  |
| - Presiona el botón "Proceder al Checkout / Ir a pagar".                                          |
| - Si es Visitante: Se solicita Login/Registro y se le redirige al Checkout conservando el carrito.|
+---------------------------------------------------------------------------------------------------+
                                                  │
                                                  ▼
+---------------------------------------------------------------------------------------------------+
| PASO 4: CONFIRMACIÓN DE CHECKOUT Y OBTENCIÓN DE COMPROBANTE                                       |
| - Formulario con dirección de entrega y teléfono precargados automáticamente.                     |
| - Selección de método de pago declarativo (Contraentrega, Nequi/PSE o Tarjeta Demostrativa).      |
| - Clic en "Confirmar pedido" -> Transacción atómica ACID en backend: recálculo de precios,        |
|   descuento de stock en BD, generación de orden inmutable y vaciado del carrito.                  |
| - Redirección inmediata al Comprobante Digital con opción de imprimir / exportar a PDF.           |
+---------------------------------------------------------------------------------------------------+

```

### 2.2 Happy Path del Administrador: Despacho y Monitoreo

1. **Inicio de Sesión Operativo:** Accede a `/login`, valida credenciales y el token JWT lo redirige de forma automática al Dashboard Administrativo (`/admin`).

2. **Revisión de Alertas y Órdenes:** Visualiza en el panel las alertas en amarillo/rojo de productos con stock $\le 5$ y accede al listado de órdenes en estado *Pendiente*.

3. **Gestión de Ciclo de Pedido:**

   * Comprueba el pago del pedido y actualiza el estado a `PAGADO`.

   * Al despachar la mercancía, actualiza a `ENVIADO` (bloqueando cancelaciones por parte del cliente).

   * Al completarse la entrega física, actualiza a `ENTREGADO` (orden cerrada definitivamente).

4. **Consulta y Exportación de KPIs:** Filtra el Dashboard por el rango del mes actual, evalúa la tarjeta de ingresos netos en COP (excluyendo cancelados), revisa el Top 5 más vendido y exporta o imprime el reporte de ventas para auditoría.

## 3. Bifurcaciones Lógicas y Manejo de Casos Límite (*Edge Cases*)

```
                                  [ EVENTO EN EL FLUJO ]
                                             │
             ┌───────────────────────────────┼───────────────────────────────┐
             ▼                               ▼                               ▼
     [EN EL CARRITO]                 [EN EL CHECKOUT]               [EN EL BACKOFFICE]
             │                               │                               │
 ┌───────────┴───────────┐       ┌───────────┴───────────┐       ┌───────────┴───────────┐
 ▼                       ▼       ▼                       ▼       ▼                       ▼
Cantidad > Stock    Carrito Vacío Stock Agotado      Precio Alterado Borrado Categoría   Reversión Pedido
Alcanzado           Detectado     en Concurrencia    en Navegador    con Productos       Cerrado
 │                       │       │                       │       │                       │
 ▼                       ▼       ▼                       ▼       ▼                       ▼
Bloquear botón +;   Bloquear     Ejecutar ROLLBACK       Backend ignora  Bloquear borrado;   Selector de estado
mostrar: "Solo      acceso a     ACID; mostrar: "Stock   dato de cliente;sugerir cambiar     deshabilitado si
quedan X unidades   Checkout; ir insuficiente para       recalcula desde a estado            es CANCELADO o
disponibles"        a vitrina    completar compra"       BD en COP       INACTIVA            ENTREGADO

```

### 3.1 Reglas Detalladas por Módulo

* **Manipulación de Precios desde el Navegador:** El servidor descarta cualquier total o subtotal enviado por el cliente. Realiza la consulta directa a la tabla `productos` y computa el importe exacto.

* **Acceso Cruzado No Autorizado (RBAC):**

  * Si un usuario con rol `Cliente` intenta ingresar a `/admin` o invocar endpoints administrativos, el sistema responde HTTP 403 y redirige al inicio con el mensaje "Acceso no autorizado".

  * Si un cliente intenta consultar el comprobante digital de otro comprador (`id_pedido` ajeno), el sistema bloquea la respuesta con HTTP 403.

* **Destrucción de Sesión y Botón "Atrás":** Al presionar "Cerrar sesión", el JWT se remueve de `sessionStorage`. Si se intenta navegar con el botón "Atrás" del navegador, las vistas privadas deniegan la carga y redirigen al Login.

* **Reintegro de Inventario por Cancelación:** Si un pedido en estado *Pendiente* es cancelado por el cliente o el administrador, el sistema ejecuta una transacción que incrementa el stock de cada producto con las unidades devueltas y bloquea transiciones posteriores.

## 4. Matriz de Estados de la Interfaz (UI States)

| Pantalla / Componente | Estado de Carga (*Loading*) | Estado Vacío (*Empty State*) | Estado de Error / Validación | 
| ----- | ----- | ----- | ----- | 
| **Vitrina Comercial (*Storefront*)** | *Skeletons* grises en cuadrícula durante la consulta ($\le 2$ s). | Mensaje: *"No se encontraron productos que coincidan con tu búsqueda"* + botón "Limpiar filtros". | Si stock == 0: Etiqueta *"Agotado"* y botón de compra deshabilitado. | 
| **Carrito de Compras** | Indicador de carga breve en subtotales al modificar cantidades. | Mensaje de carrito vacío con botón para volver al catálogo; botón de Checkout deshabilitado. | Toast en $< 2$ s: *"Solo quedan X unidades disponibles"* si se intenta superar el tope. | 
| **Formulario de Checkout** | Botón "Confirmar pedido" deshabilitado con spinner mientras corre la transacción ACID. | No aplica (se bloquea el acceso si el carrito tiene 0 ítems). | Bordes rojos en campos obligatorios faltantes. Ante error ACID: *"Stock insuficiente para completar la compra"*. | 
| **Historial "Mis Pedidos"** | Filas animadas de carga mientras recupera las órdenes. | Contenedor centrado: *"Aún no has realizado ningún pedido"* + botón directo al catálogo. | Si intenta cancelar orden en ruta: *"El pedido ya está en ruta o fue entregado y no puede cancelarse"*. | 
| **Dashboard Administrativo** | Spinners independientes en tarjetas de KPIs y tablas de pedidos. | Periodo sin ventas: Métricas limpias en **\$0 COP** y **0 pedidos** sin errores de división por cero. | Alertas visuales destacadas en amarillo/rojo para productos con existencias $\le 5$ unidades. | 
| **Formulario de Registro/Login** | Spinner en botón de envío mientras se valida hash o token. | Campos limpios con placeholders contextuales. | Alerta: *"El correo ingresado ya se encuentra asociado a una cuenta"* o *"Correo o contraseña incorrectos"*. | 

## 5. Puntos de Salida y Retroalimentación de Cierre (*Loopback*)

### 5.1 Ciclo de Cierre del Cliente

* **Compra Exitosa en Checkout:**

  * *Confirmación:* Vaciado automático del carrito y redirección inmediata a la vista del Comprobante Digital.

  * *Acciones Secundarias (Loopback):*

    1. Botón para Imprimir / Exportar a PDF el comprobante digital de compra.

    2. Enlace hacia "Mis Pedidos" para monitorear el estado de despacho de la orden.

    3. Botón "Volver al catálogo" para reiniciar el ciclo comercial.

* **Cancelación Exitosa de Pedido:**

  * *Confirmación:* La insignia del pedido cambia a *Cancelado* y el stock se restituye en bodega.

  * *Acción Secundaria:* Mensaje informativo con enlace para explorar nuevamente la tienda pública.

* **Actualización de Perfil:**

  * *Efecto Loopback:* Los nuevos datos de dirección de entrega y teléfono se precargan automáticamente en el siguiente formulario de Checkout.

### 5.2 Ciclo de Cierre del Administrador

* **Gestión de Catálogo (Creación/Edición):**

  * *Confirmación:* Cierre de formulario modal y actualización inmediata de la tabla administrativa.

  * *Acción Secundaria:* Opción de previsualizar la publicación en el Storefront público o reabastecer productos en alerta de bajo stock.

* **Actualización de Estado de Orden:**

  * *Confirmación:* La insignia del pedido se actualiza a *Pagado*, *Enviado* o *Entregado*. Si se pasa a *Cancelado*, se confirma la reposición de inventario.

  * *Acción Secundaria:* Regreso al Dashboard para observar el impacto en los ingresos netos del periodo.

* **Consulta de Métricas en Dashboard:**

  * *Acción Secundaria:* Botón para Exportar / Imprimir el informe consolidado de ventas del periodo como soporte formal de evaluación técnica.

### 5.3 Cierre Global de Sesión

* Tanto para el Cliente como para el Administrador, presionar "Cerrar sesión" destruye el token JWT en el cliente, limpia datos de sesión y redirige al Login, impidiendo la navegación retrospectiva hacia vistas privadas.