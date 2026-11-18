# Sistema de Diseño Mercado Trust (DESIGN_a3de63fa.md)

**Versión:** 1.0.0  
**Proyecto:** Mercado Trust — Comercio Local en Colombia  
**Identificador de Diseño:** `DESIGN_a3de63fa`  
**Hoja de Estilos Asociada:** `theme_66c899bc.css`  

---

## 1. Filosofía de Marca y Principios de Diseño

Mercado Trust es una plataforma de comercio local de alta confianza, diseñada con estándares fintech y de comercio electrónico moderno para Colombia. El lenguaje visual balancea solidez institucional y calidez comunitaria, priorizando:

1. **Claridad Transaccional:** Precios transparentes en Pesos Colombianos (`COP $`), cálculo de fletes en tiempo real y flujo de checkout en 4 pasos sin fricciones.
2. **Confianza y Certeza Operativa:** Indicadores visuales claros de disponibilidad de stock (Disponible, Stock Crítico $\le 5$ unidades, Agotado) y comprobantes de compra verificables con trazabilidad.
3. **Ergonomía Responsiva:** Experiencia optimizada para móviles (360px+) con áreas táctiles mínimas de 44px, selectores nativos accesibles y modales inferiores adaptables.
4. **Minimalismo Utilitario:** Superficies limpias, contraste estructurado y jerarquía tipográfica sin ruido visual.

---

## 2. Paleta Cromática y Tokens Semánticos

### 2.1 Colores Principales (Brand & Core)
* **Primario (Emerald - `#006948` / `#059669`):** Acciones de conversión primaria, botones de compra, badges de éxito y confirmación de stock.
* **On-Primary (`#FFFFFF`):** Texto y elementos sobre superficies primarias.
* **Contenedor Primario (`#00855d` / `#D1FAE5`):** Fondos de badges activos y fondos de selección suave.
* **Secundario (Slate - `#0F172A`):** Títulos de máxima jerarquía, textos estructurados y controles administrativos.
* **Terciario (Cobalt Blue - `#0051d5` / `#2563EB`):** Destacados informativos, métodos de pago electrónicos (Wompi, PSE) y enlaces contextuales.

### 2.2 Estados de Alerta e Inventario
* **Stock Disponible (`#059669` / `#D1FAE5`):** Producto listo para despacho inmediato.
* **Stock Crítico (`#D97706` / `#FEF3C7`):** Alerta cuando el inventario es $\le 5$ unidades.
* **Agotado / Error (`#DC2626` / `#FEE2E2`):** Sin disponibilidad o alerta destructiva.

### 2.3 Superficies y Fondos
* **Canvas Base (`#FFFFFF`):** Tarjetas de producto, modales y formularios.
* **Fondo de Página (`#F8FAFC`):** Superficie neutra ultra-clara de descanso visual.
* **Bordes y Delimitadores (`#E2E8F0` / `#CBD5E1`):** Líneas sutiles de estructura sin sobrecarga.

---

## 3. Tipografía

La familia tipográfica oficial es **Plus Jakarta Sans**, combinada con **JetBrains Mono** para cifras numéricas, códigos de orden e importes en moneda.

| Token | Familia | Tamaño | Peso | Interlineado | Tracking | Aplicación |
|---|---|---|---|---|---|---|
| `display` | Plus Jakarta Sans | 36px | 800 (Extra Bold) | 44px | -0.02em | Hero banner y encabezados principales |
| `headline-lg` | Plus Jakarta Sans | 28px | 700 (Bold) | 36px | -0.015em | Títulos de vistas principales |
| `headline-md` | Plus Jakarta Sans | 20px | 700 (Bold) | 28px | -0.01em | Nombres de productos y secciones |
| `headline-sm` | Plus Jakarta Sans | 16px | 600 (Semi Bold) | 24px | 0 | Subtítulos y modales |
| `body-lg` | Plus Jakarta Sans | 16px | 400 (Regular) | 26px | 0 | Textos destacados y descripciones |
| `body-md` | Plus Jakarta Sans | 14px | 400 (Regular) | 22px | 0 | Texto de interfaz estándar |
| `body-sm` | Plus Jakarta Sans | 12px | 400 (Regular) | 18px | 0 | Notas al pie y leyendas |
| `label-sm` | Plus Jakarta Sans | 11px | 700 (Bold) | 14px | +0.03em | Badges de stock (mayúsculas) |
| `currency-lg` | Plus Jakarta Sans | 24px | 700 (Bold) | 32px | -0.02em | Precios principales (`tabular-nums`) |
| `currency-md` | Plus Jakarta Sans | 16px | 700 (Bold) | 22px | -0.01em | Subtotales y líneas de pedido |

---

## 4. Radios de Curvatura (Border Radius)

* `rounded-sm`: `4px` (`0.25rem`) — Etiquetas pequeñas y chips mínimos.
* `rounded-md`: `8px` (`0.5rem`) — **Valor estándar** para botones, inputs, selectores y tarjetas.
* `rounded-lg`: `16px` (`1rem`) — Banners promocionales, contenedores de checkout y modales.
* `rounded-full`: `9999px` — Badges de stock píldora y avatares.

---

## 5. Elevaciones y Sombras

* **Nivel 0 (Plano):** Fondo de página `#F8FAFC`.
* **Nivel 1 (Reposo):** Tarjetas de producto y contenedores: Borde `1px solid #E2E8F0` + sombra sutil `0 1px 3px rgba(15,23,42,0.05)`.
* **Nivel 2 (Flotante / Hover):** Menús desplegables y tarjetas activas: `0 4px 12px -2px rgba(15, 23, 42, 0.06), 0 2px 4px -2px rgba(15, 23, 42, 0.04)`.
* **Nivel 3 (Modales y Drawers):** Modal de checkout, carrito lateral y comprobantes digitales: `0 20px 25px -5px rgba(15, 23, 42, 0.1), 0 8px 10px -6px rgba(15, 23, 42, 0.06)` sobre fondo atenuado (`rgba(15, 23, 42, 0.5)`).

---

## 6. Componentes Clave

1. **Botón Primario:** Fondo verde esmeralda (`#006948` / `#059669`), texto blanco, esquinas de 8px, hover `#047857`, foco accesible con ring exterior.
2. **Botón Secundario:** Fondo pizarra oscura (`#0F172A`), texto blanco, esquinas de 8px.
3. **Chips de Stock:**
   * En stock: `#D1FAE5` con texto `#065F46` y borde `#A7F3D0`.
   * Últimas unidades ($\le 5$): `#FEF3C7` con texto `#92400E` y borde `#FDE68A`.
   * Agotado: `#FEE2E2` con texto `#991B1B` y borde `#FECACA`.
4. **Checkout Transaccional en 4 Pasos:**
   1. Carrito y revisión de ítems.
   2. Datos de cliente y dirección de entrega.
   3. Selección de medio de pago (Wompi, PSE, Contra Entrega).
   4. Confirmación y comprobante con código de orden verificable.
