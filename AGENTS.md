# Reglas de Desarrollo y Flujo de Trabajo del Proyecto

## Estructura de Ramas
- `main`: Rama de producción estable.
- `dev`: Rama de desarrollo activo.
- `qa`: Rama de pruebas y control de calidad.

## Flujo Secuencial Obligatorio

1. **Etapa 1 — Desarrollo en `dev`:**
   - Sincronizar `main` con lo más reciente (`git pull`).
   - Sincronizar `dev` con `main`.
   - Desarrollar e implementar los cambios únicamente en `dev`.

2. **Etapa 2 — Paso a `qa`:**
   - Reproducir íntegramente el contenido de `dev` en `qa`.
   - Confirmar paridad exacta (`git diff qa dev` debe retornar 0 diferencias).

3. **Etapa 3 — Pruebas con Composio:**
   - Ejecutar la suite de pruebas y validaciones con la integración de Composio.
   - Si alguna prueba falla, corregir en `dev`, replicar en `qa` y repetir hasta tener todo en verde.
   - No avanzar a `main` si las pruebas no están aprobadas.

4. **Etapa 4 — Paso a `main` y Sincronización con GitHub:**
   - Reproducir el contenido validado de `qa` en `main`.
   - Crear el commit descriptivo en `main`.
   - **Sincronización:** Siempre que las pruebas salgan exitosas y se cree el commit, sincronizar automáticamente todas las ramas con el repositorio remoto en GitHub (`git push`).
