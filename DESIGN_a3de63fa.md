# Sistema de Diseño Mercado Trust (DESIGN_a3de63fa.md)

**Versión:** 2.0.0  
**Proyecto:** Mercado Trust — Comercio Local en Colombia  
**Identificador de Diseño:** `DESIGN_a3de63fa`  
**Hoja de Estilos Asociada:** `theme_66c899bc.css`  

---

## 1. Tokens de Tema Globales (`@theme`)

El sistema implementa una paleta de alta conversión y estética refinada inspirada en comercio digital de vanguardia (Shopify / Modern Commerce):

### 1.1 Colores (`Colors`)
```css
--color-canvas-mist: #f2f4f5;      /* Fondo global de lienzo / canvas */
--color-pure-white: #ffffff;       /* Fondo de tarjetas, paneles y navegación */
--color-ink-black: #000000;        /* Contraste absoluto para textos destacados */
--color-faint-border: #ebebeb;     /* Bordes sutiles y divisores estructurales */
--color-muted-gray: #787574;       /* Textos secundarios y metadatos */
--color-cool-stone: #cccccc;       /* Controles inactivos y bordes secundarios */
--color-warm-fog: #acb0aa;         /* Leyendas y estados deshabilitados */
--color-shop-violet: #5433eb;      /* Color primario de conversión / CTAs */
--color-violet-wash: #c0b5f3;      /* Contenedores de éxito, selecciones suaves */
--color-slate-ink: #332f2d;        /* Color principal de lectura del cuerpo */
--color-ash-veil: #665a54;         /* Subtítulos y etiquetas neutrales */
```

### 1.2 Tipografía (`Typography`)
* **Familia Primaria:** `'Shopify Sans', ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`
* **Familia Técnica / Tabular:** `'GT Standard', ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`
* **Escala Tipográfica:**
  * Caption: `11px` (line-height: `1.33`)
  * Body Small: `12px` (line-height: `1.33`)
  * Body: `14px` (line-height: `1.33`)
  * Body Large: `16px` (line-height: `1.33`)

### 1.3 Espaciado (`Spacing`)
`4px`, `6px`, `8px`, `10px`, `11px`, `12px`, `16px`, `20px`, `24px`, `32px`, `38px`, `40px`, `48px`, `64px`.

### 1.4 Radios de Borde (`Border Radius`)
* `radius-md`: `4px`
* `radius-lg`: `8px`
* `radius-xl`: `11.4046px`
* `radius-2xl`: `17.1064px`
* `radius-2xl-2`: `20px`
* `radius-2xl-3`: `22.8092px`
* `radius-3xl`: `28px`
* `radius-3xl-2`: `32px`
* `radius-full`: `9999px`

### 1.5 Sombras y Elevaciones (`Shadows`)
* `shadow-sm`: `rgba(0, 0, 0, 0.06) 0px 2px 8px 0px`
* `shadow-sm-2`: `rgba(0, 0, 0, 0.1) 0px 4px 6px -1px, rgba(0, 0, 0, 0.1) 0px 2px 4px -2px`
* `shadow-lg`: `rgba(0, 0, 0, 0.12) 0px 4px 24px 0px`
* `shadow-lg-2`: `rgba(69, 36, 219, 0.34) 0px 4px 24px 0px`

---

## 2. Aplicación Transversal en las Vistas ("Sitios Web")

El tema está aplicado de manera unificada en todas las interfaces de la plataforma:
1. **Catálogo y Vitrina (`StorefrontView`):** Fondos en `--color-canvas-mist`, tarjetas de productos en `--color-pure-white` con bordes `--color-faint-border` y botones de compra en `--color-shop-violet` con elevación `--shadow-lg-2`.
2. **Navegación (`Navbar`):** Wordmark en `--color-ink-black`, enlaces activos con indicador `--color-shop-violet`, y botón de carrito con badges de conteo.
3. **Flujo de Pago en 4 Pasos (`CheckoutView`):** Círculos activos del stepper en `--color-shop-violet`, pasos completados en `--color-violet-wash`, inputs con foco y sombra suave.
4. **Comprobante Digital (`ReceiptView`):** Resumen transaccional con tipografía tabular para precios en COP, código de barras/código QR y botones de descarga.
5. **Panel Administrativo (`AdminDashboardView`):** Tarjetas de KPIs financieros con `--shadow-sm`, tablas de productos y pedidos con división `--color-faint-border`.
6. **Autenticación y Perfil (`AuthModal`, `ProfileView`, `CustomerOrdersView`):** Modales con backdrop desenfocado y controles ergonómicos adaptados a la nueva escala.
