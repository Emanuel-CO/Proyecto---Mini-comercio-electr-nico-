# Guía Paso a Paso: Cómo Montar y Ver el Proyecto en Local

Esta guía explica detalladamente cómo levantar el servidor del proyecto **Mercado Trust (Mini Comercio Electrónico)** en Windows y visualizarlo en el navegador web.

---

## 1. Arquitectura y Tecnologías del Proyecto

* **Frontend:** React 19, TypeScript, Tailwind CSS v4, Lucide React, Motion (Framer Motion).
* **Backend:** Node.js, Express 4, TypeScript ejecutado en caliente con `tsx`.
* **Empaquetador y Servidor Dev:** Vite 8 (integrado en modo middleware sobre Express).
* **Base de Datos:** Persistencia en archivo JSON local (`data/store.json`) con inicialización automática (*seed data*) y simulación de transacciones ACID.
* **Autenticación:** Tokens JWT con cifrado de contraseñas (`scryptSync`) y control de acceso basado en roles (`ADMIN` y `CLIENTE`).

---

## 2. Requisitos Previos en Windows

Para ejecutar el proyecto necesitas **Node.js LTS** (versión 20 o superior, recomendada v26.x) y **npm**.

### Verificación:
Abre una terminal (PowerShell o CMD) y escribe:
```powershell
node -v
npm -v
```

### Si no tienes Node.js instalado:
Puedes instalarlo rápidamente mediante `winget` desde PowerShell como Administrador:
```powershell
winget install --id OpenJS.NodeJS.LTS --accept-package-agreements --accept-source-agreements
```
*(O descargando el instalador oficial desde [https://nodejs.org](https://nodejs.org))*.

---

## 3. Configuración del Entorno (`.env`)

En la raíz del proyecto (`Proyecto---Mini-comercio-electr-nico-`), crea o verifica la existencia del archivo `.env`:

```env
PORT=3000
JWT_SECRET="mercado-trust-local-dev-secret-2026-colombia"
APP_URL="http://localhost:3000"
GEMINI_API_KEY=""
```

> **Nota sobre `GEMINI_API_KEY`:**  
> Es opcional para la navegación comercial básica y compras. Solo es requerida si deseas utilizar funcionalidades de asistencia generativa con la API de Google Gemini.

---

## 4. Instalación de Dependencias

Abre PowerShell en la carpeta del repositorio y ejecuta:

```powershell
cd "Proyecto---Mini-comercio-electr-nico-"

# Si PowerShell bloquea scripts por política de ejecución, habilítalo para el proceso:
Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass

# Instalar paquetes (el flag --legacy-peer-deps evita discrepancias entre esbuild y Vite 8):
npm install --legacy-peer-deps
```

---

## 5. Arranque del Servidor

Para iniciar la aplicación en modo desarrollo (Backend Express + Frontend Vite en tiempo real):

```powershell
npm run dev
```

Verás una salida similar a:
```text
Mercado Trust server running at http://localhost:3000
```

---

## 6. URL y Acceso en el Navegador

Una vez arrancado el servidor, abre tu navegador preferido (Chrome, Edge, Firefox, Brave) e ingresa a:

👉 **[http://localhost:3000](http://localhost:3000)**

### Cuentas de Acceso Preconfiguradas (Seed Data)

El sistema viene con una base de datos local preinicializada con productos, categorías y dos tipos de usuarios:

| Rol | Correo Electrónico | Contraseña | Capacidades |
|---|---|---|---|
| **Administrador** | `admin@mercadotrust.co` | `Admin1234!` | Acceso completo al Panel Administrativo, CRUD de productos/categorías, gestión de pedidos y KPIs financieros. |
| **Cliente** | `camila.rojas@correo.co` | `Cliente1234!` | Exploración de vitrina, carrito de compras, Checkout ACID en 4 pasos, comprobantes y pedidos. |
| **Cliente (Alt)** | `mateo.garcia@correo.co` | `Cliente1234!` | Segundo cliente para pruebas de órdenes y pedidos. |

---

## 7. Resolución de Problemas Frecuentes

### 1. Error de ejecución de scripts en PowerShell (`about_Execution_Policies`)
* **Síntoma:** `npm : No se puede cargar el archivo ... npm.ps1 porque la ejecución de scripts está deshabilitada en este sistema.`
* **Solución:** Ejecuta en la misma terminal:
  ```powershell
  Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass
  ```
  o invoca directamente `npm.cmd` en lugar de `npm`.

### 2. Conflicto de resolución de dependencias (`ERESOLVE could not resolve`)
* **Síntoma:** Error de paridad de pares entre `vite` y `esbuild`.
* **Solución:** Ejecuta siempre la instalación con:
  ```powershell
  npm install --legacy-peer-deps
  ```

### 3. El puerto 3000 ya está en uso (`EADDRINUSE: address already in use :::3000`)
* **Solución:**  
  1. Cambia el puerto en el archivo `.env` (por ejemplo, `PORT=3001`) y abre `http://localhost:3001`.  
  2. O libera el puerto 3000 en PowerShell:
     ```powershell
     Get-Process -Id (Get-NetTCPConnection -LocalPort 3000).OwningProcess | Stop-Process -Force
     ```

### 4. Reiniciar la Base de Datos a su estado original
* **Solución:** Si deseas reiniciar todos los pedidos, stock y usuarios de prueba, simplemente elimina el archivo local:
  ```powershell
  Remove-Item -Path "data/store.json" -Force
  ```
  El servidor lo regenerará automáticamente con los datos iniciales al arrancar.
