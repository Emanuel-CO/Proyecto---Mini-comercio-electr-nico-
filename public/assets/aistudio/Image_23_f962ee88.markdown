---
name: Mercado Trust
colors:
  surface: '#f8f9ff'
  surface-dim: '#cbdbf5'
  surface-bright: '#f8f9ff'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#eff4ff'
  surface-container: '#e5eeff'
  surface-container-high: '#dce9ff'
  surface-container-highest: '#d3e4fe'
  on-surface: '#0b1c30'
  on-surface-variant: '#3d4a42'
  inverse-surface: '#213145'
  inverse-on-surface: '#eaf1ff'
  outline: '#6d7a72'
  outline-variant: '#bccac0'
  surface-tint: '#006c4a'
  primary: '#006948'
  on-primary: '#ffffff'
  primary-container: '#00855d'
  on-primary-container: '#f5fff7'
  inverse-primary: '#68dba9'
  secondary: '#565e74'
  on-secondary: '#ffffff'
  secondary-container: '#dae2fd'
  on-secondary-container: '#5c647a'
  tertiary: '#0051d5'
  on-tertiary: '#ffffff'
  tertiary-container: '#316bf3'
  on-tertiary-container: '#fefcff'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#85f8c4'
  primary-fixed-dim: '#68dba9'
  on-primary-fixed: '#002114'
  on-primary-fixed-variant: '#005137'
  secondary-fixed: '#dae2fd'
  secondary-fixed-dim: '#bec6e0'
  on-secondary-fixed: '#131b2e'
  on-secondary-fixed-variant: '#3f465c'
  tertiary-fixed: '#dbe1ff'
  tertiary-fixed-dim: '#b4c5ff'
  on-tertiary-fixed: '#00174b'
  on-tertiary-fixed-variant: '#003ea8'
  background: '#f8f9ff'
  on-background: '#0b1c30'
  surface-variant: '#d3e4fe'
typography:
  display:
    fontFamily: Plus Jakarta Sans
    fontSize: 36px
    fontWeight: '800'
    lineHeight: 44px
    letterSpacing: -0.02em
  display-mobile:
    fontFamily: Plus Jakarta Sans
    fontSize: 28px
    fontWeight: '800'
    lineHeight: 36px
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 28px
    fontWeight: '700'
    lineHeight: 36px
    letterSpacing: -0.015em
  headline-lg-mobile:
    fontFamily: Plus Jakarta Sans
    fontSize: 22px
    fontWeight: '700'
    lineHeight: 30px
    letterSpacing: -0.01em
  headline-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 20px
    fontWeight: '700'
    lineHeight: 28px
    letterSpacing: -0.01em
  headline-sm:
    fontFamily: Plus Jakarta Sans
    fontSize: 16px
    fontWeight: '600'
    lineHeight: 24px
  body-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 26px
  body-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 22px
  body-sm:
    fontFamily: Plus Jakarta Sans
    fontSize: 12px
    fontWeight: '400'
    lineHeight: 18px
  label-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 14px
    fontWeight: '600'
    lineHeight: 20px
  label-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 12px
    fontWeight: '600'
    lineHeight: 16px
    letterSpacing: 0.01em
  label-sm:
    fontFamily: Plus Jakarta Sans
    fontSize: 11px
    fontWeight: '700'
    lineHeight: 14px
    letterSpacing: 0.03em
  currency-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 24px
    fontWeight: '700'
    lineHeight: 32px
    letterSpacing: -0.02em
  currency-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 16px
    fontWeight: '700'
    lineHeight: 22px
    letterSpacing: -0.01em
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  gutter: 1.5rem
  gutter-mobile: 1rem
  margin: 2rem
  margin-mobile: 1rem
  space-xs: 0.25rem
  space-sm: 0.5rem
  space-md: 1rem
  space-lg: 1.5rem
  space-xl: 2rem
---

## Brand & Style
This design system establishes a high-trust, functional, and hyper-reliable digital commerce environment tailored for Colombian local retail. The aesthetic bridges contemporary financial-grade SaaS with frictionless direct-to-consumer shopping. The tone balances institutional credibility with accessible, local warmth—fostering confidence in payment safety, immediate stock transparency, and clear fulfillment timelines.

The visual style follows modern utilitarian minimalism:
- **Pristine Whitespace & Structural Contrast:** Broad, clean fields offset by deep slate accents to emphasize operational integrity and clear transaction paths.
- **Micro-Interactions & Trust Seals:** Crisp, high-contrast statuses and visual checkpoints that confirm stock levels, order states, and transactional safety at every step.
- **Data Clarity:** Zero ambiguity in Colombian Peso (`COP $`) pricing structures, calculated taxes, and localized logistics statuses.

## Colors
The color system emphasizes financial confidence, commercial immediacy, and regulatory clarity.

- **Primary (`#059669` Emerald):** Represents transaction success, verified status, primary conversion triggers, and immediate inventory readiness.
- **Secondary (`#0F172A` Slate 900):** Anchors high-hierarchy headings, critical infrastructure controls, active states, and dominant layout chrome.
- **Tertiary (`#2563EB` Cobalt Blue):** Dedicated to secondary operational tasks, informational highlights, payment method associations, and administrative drill-downs.
- **Warning & Low-Stock (`#F59E0B` Amber):** Reserved for limited availability warnings (`stock <= 5`), attention requirements, and pending validation states.
- **Critical / Out of Stock (`#EF4444` Coral Red):** Alerts for depleted inventory, payment rejections, and destructive actions.
- **Neutral Canvas & Tiers:** 
  - Base canvas: `#FFFFFF` (Pure white) for transactional cards and primary panels.
  - Page backgrounds: `#F8FAFC` (Slate 50) and `#F1F5F9` (Slate 100) for visual grouping.
  - Borders & Hairlines: `#E2E8F0` (Slate 200) for structural division without optical noise.

## Typography
Plus Jakarta Sans provides high legibility across screens, technical balance, and modern geometric warmth.

- **Currency Treatment (COP):** Always render prices with non-breaking spaces and dot-delimited thousands (e.g., `$ 120.000 COP` or `$ 45.900`). Currency styles require tabular numeric figures (`font-variant-numeric: tabular-nums`) to maintain vertical alignment in product grids, invoices, and administrative tables.
- **Hierarchy Rules:** Headline levels use negative letter spacing to project density and authority. Body copy preserves open line spacing for quick scannability during checkout flows. Labels and badges use semibold and bold weights with slight positive tracking to ensure readability at compact sizes.

## Layout & Spacing
The layout follows a 12-column responsive fluid grid system designed for high density without visual crowding.

- **Breakpoints:**
  - **Mobile (< 768px):** 4 columns, `margin-mobile` (16px), `gutter-mobile` (16px). Bottom sheets replace centered modals; checkouts run full-width single-column.
  - **Tablet (768px – 1024px):** 8 columns, `margin` (32px), `gutter` (24px). Split view for order summary and step details.
  - **Desktop (> 1024px):** 12 columns, max-width `1280px` centered canvas, `margin` (32px), `gutter` (24px). Administrative layouts leverage a persistent 260px sidebar and fluid metric grids.

- **Spacing Cadence:** Vertical spacing within cards and forms strictly uses multiples of 8px (`0.5rem`, `1rem`, `1.5rem`). Micro elements (input icons, badge padding) leverage 4px (`0.25rem`).

## Elevation & Depth
Depth is created through clean tonal layering combined with restrained, crisp outlines rather than heavy drop shadows.

- **Surface Layering:** 
  - Level 0 (Canvas): Background `#F8FAFC`.
  - Level 1 (Resting Cards & Navigation): `#FFFFFF` bound by a solid `1px` border in `#E2E8F0`.
  - Level 2 (Floating Headers & Popovers): `#FFFFFF` accompanied by an ultra-subtle ambient shadow: `0 4px 12px -2px rgba(15, 23, 42, 0.06), 0 2px 4px -2px rgba(15, 23, 42, 0.04)`.
  - Level 3 (Transactional Modals & Drawers): Backed by a backdrop scrim (`#0F172A` at 45% opacity) with a defined structural lift: `0 20px 25px -5px rgba(15, 23, 42, 0.1), 0 8px 10px -6px rgba(15, 23, 42, 0.06)`.
- **Top Navigation Bar:** Sticky at the viewport top, using pure `#FFFFFF` with a crisp `border-b: 1px solid #E2E8F0`.

## Shapes
A balanced medium roundedness (`0.5rem` / `8px` default) delivers a soft yet professional structure.

- **Components (`8px`):** Standard buttons, text fields, cards, tables, and modal dialogs.
- **Nested & Grouped (`rounded-lg` / `16px`):** Large promotional banners, multi-section checkout cards, and mobile bottom sheet containers.
- **Badges & Tags:** Fully pill-shaped (`9999px`) to visually separate operational metadata (e.g., stock levels, order tracking) from interactive rectangular controls.

## Components

### Buttons
- **Primary:** Background `#059669`, text `#FFFFFF`, font-weight `600`, radius `8px`. Hover: `#047857`. Focus: active ring `2px #059669` with `2px` offset.
- **Secondary:** Background `#0F172A`, text `#FFFFFF`. Hover: `#1E293B`.
- **Outline / Ghost:** Border `1px solid #E2E8F0`, background transparent, text `#0F172A`. Hover: background `#F1F5F9`.

### Badges & Stock Chips
- **In Stock:** Text `#065F46`, background `#D1FAE5`, border `1px solid #A7F3D0`.
- **Low Stock (≤ 5 units):** Text `#92400E`, background `#FEF3C7`, border `1px solid #FDE68A`.
- **Out of Stock:** Text `#991B1B`, background `#FEE2E2`, border `1px solid #FECACA`.
- **Style:** Height `24px`, padding `0 10px`, font-size `11px`, font-weight `700`, uppercase, pill-shaped.

### Form Inputs & Selectors
- Standard height `44px` for mobile tap ergonomics.
- Border `1px solid #CBD5E1`, background `#FFFFFF`, text `#0F172A`, radius `8px`.
- Focus: border `#059669`, box-shadow `0 0 0 3px rgba(5, 150, 105, 0.15)`.
- Error state: border `#EF4444`, focus ring `rgba(239, 68, 68, 0.15)`.

### 4-Step Checkout Stepper
- Sequential stages: 1. Carrito, 2. Datos & Envío, 3. Pago (Wompi / PSE / Contra Entrega), 4. Confirmación.
- Active step: solid circle `#059669` with white numeral, text `#0F172A` bold.
- Completed step: `#D1FAE5` with an emerald check icon.
- Inactive step: `#E2E8F0` circle with `#64748B` label.
- Connecting lines: `2px` solid `#E2E8F0` (inactive) or `#059669` (completed).

### Administrative KPI Metric Cards
- Background `#FFFFFF`, border `1px solid #E2E8F0`, padding `20px`, radius `8px`.
- Metric structure: Subdued uppercase label (`12px`, `#64748B`), bold numeric value (`24px`, `#0F172A`), bottom delta indicator (e.g., `+12.5% vs ayer` in emerald or red).

### Administrative Data Tables
- Header: `#F8FAFC`, text `#475569`, font-weight `600`, font-size `12px`, uppercase, bottom border `1px solid #E2E8F0`.
- Rows: `#FFFFFF`, hover row state `#F8FAFC`, height `52px`, vertical text alignment center.
- Monospace/tabular numeric styling for all order IDs, inventory balances, and COP amounts.