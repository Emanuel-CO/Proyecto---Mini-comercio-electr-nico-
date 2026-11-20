# ==============================================================================
# Script Automatizado de Validación de API - Sprint 2
# ==============================================================================

$baseUrl = "http://localhost:8080"
$global:passed = 0
$global:failed = 0

function Assert-Test {
    param(
        [string]$testName,
        [bool]$condition,
        [string]$detail = ""
    )
    if ($condition) {
        Write-Host " [PASS] $testName" -ForegroundColor Green
        $global:passed++
    } else {
        Write-Host " [FAIL] $testName - Detalle: $detail" -ForegroundColor Red
        $global:failed++
    }
}

Write-Host "=== INICIANDO SUITE DE PRUEBAS AUTOMATIZADAS DE API (SPRINT 2) ===" -ForegroundColor Cyan

# ------------------------------------------------------------------------------
# 1. CORS Preflight Check
# ------------------------------------------------------------------------------
try {
    $corsReq = [System.Net.HttpWebRequest]::Create("$baseUrl/api/productos")
    $corsReq.Method = "OPTIONS"
    $corsReq.Headers.Add("Origin", "http://localhost:5173")
    $corsReq.Headers.Add("Access-Control-Request-Method", "GET")
    $corsReq.Headers.Add("Access-Control-Request-Headers", "Authorization")
    $corsResp = $corsReq.GetResponse()
    $allowOrigin = $corsResp.Headers["Access-Control-Allow-Origin"]
    $corsResp.Close()
    Assert-Test "CORS Preflight para http://localhost:5173" ($allowOrigin -eq "http://localhost:5173") "Header Allow-Origin: $allowOrigin"
} catch {
    Assert-Test "CORS Preflight para http://localhost:5173" $false $_.Exception.Message
}

# ------------------------------------------------------------------------------
# 2. Rechazo de acceso sin token (401 Unauthorized)
# ------------------------------------------------------------------------------
try {
    $resp = Invoke-RestMethod -Uri "$baseUrl/api/clientes/perfil" -Method Get -ErrorAction Stop
    Assert-Test "Rechazo sin token en /api/clientes/perfil (401)" $false "Esperaba 401 pero respondió éxito"
} catch {
    $statusCode = [int]$_.Exception.Response.StatusCode
    Assert-Test "Rechazo sin token en /api/clientes/perfil (401)" ($statusCode -eq 401) "Status code: $statusCode"
}

try {
    $resp = Invoke-RestMethod -Uri "$baseUrl/api/ordenes/mis-ordenes" -Method Get -ErrorAction Stop
    Assert-Test "Rechazo sin token en /api/ordenes/mis-ordenes (401)" $false "Esperaba 401 pero respondió éxito"
} catch {
    $statusCode = [int]$_.Exception.Response.StatusCode
    Assert-Test "Rechazo sin token en /api/ordenes/mis-ordenes (401)" ($statusCode -eq 401) "Status code: $statusCode"
}

# ------------------------------------------------------------------------------
# 3. Error de validación en registro (400 Bad Request)
# ------------------------------------------------------------------------------
$invalidUser = @{
    nombresCompletos = ""
    correo = "correo-invalido"
    password = ""
} | ConvertTo-Json

try {
    Invoke-RestMethod -Uri "$baseUrl/api/auth/register" -Method Post -Body $invalidUser -ContentType "application/json" -ErrorAction Stop
    Assert-Test "Error de validación (400 Bad Request)" $false "Esperaba 400"
} catch {
    $statusCode = [int]$_.Exception.Response.StatusCode
    Assert-Test "Error de validación (400 Bad Request)" ($statusCode -eq 400) "Status code: $statusCode"
}

# ------------------------------------------------------------------------------
# 4. Registro de nuevo cliente (201 Created)
# ------------------------------------------------------------------------------
$randomId = Get-Random -Minimum 1000 -Maximum 9999
$clienteEmail = "cliente.test$randomId@mercadotrust.co"
$clientePass = "Password2026*"
$clienteBody = @{
    nombresCompletos = "Cliente Automatizado $randomId"
    correo = $clienteEmail
    password = $clientePass
    telefono = "3101234567"
    direccionEnvio = "Avenida El Dorado # 68-15, Bogota"
    rol = "CLIENTE"
    aceptaPoliticaDatos = $true
} | ConvertTo-Json

$clienteToken = $null
try {
    $regResp = Invoke-RestMethod -Uri "$baseUrl/api/auth/register" -Method Post -Body $clienteBody -ContentType "application/json" -ErrorAction Stop
    $clienteToken = $regResp.token
    Assert-Test "Registro de nuevo cliente (201 Created)" ($regResp.correo -eq $clienteEmail -and $clienteToken.Length -gt 20) "Correo: $($regResp.correo)"
} catch {
    Assert-Test "Registro de nuevo cliente (201 Created)" $false $_.Exception.Message
}

# ------------------------------------------------------------------------------
# 5. Conflicto por correo duplicado (409 Conflict)
# ------------------------------------------------------------------------------
try {
    Invoke-RestMethod -Uri "$baseUrl/api/auth/register" -Method Post -Body $clienteBody -ContentType "application/json" -ErrorAction Stop
    Assert-Test "Conflicto por correo duplicado (409 Conflict)" $false "Esperaba 409"
} catch {
    $statusCode = [int]$_.Exception.Response.StatusCode
    Assert-Test "Conflicto por correo duplicado (409 Conflict)" ($statusCode -eq 409) "Status code: $statusCode"
}

# ------------------------------------------------------------------------------
# 6. Login exitoso y credenciales inválidas (200 OK y 401 Unauthorized)
# ------------------------------------------------------------------------------
# Credenciales inválidas:
$badLogin = @{
    correo = $clienteEmail
    password = "PasswordErrada!"
} | ConvertTo-Json
try {
    Invoke-RestMethod -Uri "$baseUrl/api/auth/login" -Method Post -Body $badLogin -ContentType "application/json" -ErrorAction Stop
    Assert-Test "Login con contraseña inválida (401 Unauthorized)" $false "Esperaba 401"
} catch {
    $statusCode = [int]$_.Exception.Response.StatusCode
    Assert-Test "Login con contraseña inválida (401 Unauthorized)" ($statusCode -eq 401) "Status code: $statusCode"
}

# Login exitoso:
$goodLogin = @{
    correo = $clienteEmail
    password = $clientePass
} | ConvertTo-Json
try {
    $loginResp = Invoke-RestMethod -Uri "$baseUrl/api/auth/login" -Method Post -Body $goodLogin -ContentType "application/json" -ErrorAction Stop
    $clienteToken = $loginResp.token
    Assert-Test "Login exitoso y obtención de JWT (200 OK)" ($clienteToken.Length -gt 20) "Token generado"
} catch {
    Assert-Test "Login exitoso y obtención de JWT (200 OK)" $false $_.Exception.Message
}

$clienteHeaders = @{
    Authorization = "Bearer $clienteToken"
}

# ------------------------------------------------------------------------------
# 7. Acceso a perfil con JWT (200 OK)
# ------------------------------------------------------------------------------
try {
    $perfil = Invoke-RestMethod -Uri "$baseUrl/api/clientes/perfil" -Method Get -Headers $clienteHeaders -ErrorAction Stop
    Assert-Test "Consulta de perfil autenticado con JWT" ($perfil.correo -eq $clienteEmail) "Email: $($perfil.correo)"
} catch {
    Assert-Test "Consulta de perfil autenticado con JWT" $false $_.Exception.Message
}

# ------------------------------------------------------------------------------
# 8. Acceso denegado (403 Forbidden) cuando CLIENTE intenta acceder a ruta ADMIN
# ------------------------------------------------------------------------------
try {
    Invoke-RestMethod -Uri "$baseUrl/api/admin/clientes" -Method Get -Headers $clienteHeaders -ErrorAction Stop
    Assert-Test "Acceso denegado a ruta ADMIN para CLIENTE (403 Forbidden)" $false "Esperaba 403"
} catch {
    $statusCode = [int]$_.Exception.Response.StatusCode
    Assert-Test "Acceso denegado a ruta ADMIN para CLIENTE (403 Forbidden)" ($statusCode -eq 403) "Status code: $statusCode"
}

# ------------------------------------------------------------------------------
# 9. CRUD de Productos
# ------------------------------------------------------------------------------
# 9.1 Catálogo público (200 OK)
$catPublico = Invoke-RestMethod -Uri "$baseUrl/api/productos" -Method Get
Assert-Test "Consulta pública de catálogo de productos (200 OK)" ($catPublico.Count -ge 7) "Productos: $($catPublico.Count)"

# 9.2 Detalle de producto existente (200 OK)
$prod1 = Invoke-RestMethod -Uri "$baseUrl/api/productos/1" -Method Get
Assert-Test "Consulta detalle de producto ID 1 (200 OK)" ($prod1.id -eq 1 -and $prod1.nombre.Length -gt 0) "Nombre: $($prod1.nombre)"

# 9.3 Recurso no encontrado (404 Not Found)
try {
    Invoke-RestMethod -Uri "$baseUrl/api/productos/99999" -Method Get -ErrorAction Stop
    Assert-Test "Producto no encontrado (404 Not Found)" $false "Esperaba 404"
} catch {
    $statusCode = [int]$_.Exception.Response.StatusCode
    Assert-Test "Producto no encontrado (404 Not Found)" ($statusCode -eq 404) "Status code: $statusCode"
}

# ------------------------------------------------------------------------------
# 10. Registro/Login de Administrador para CRUD
# ------------------------------------------------------------------------------
$adminEmail = "admin.test$randomId@mercadotrust.co"
$adminPass = "AdminSecret2026*"
$adminBody = @{
    nombresCompletos = "Admin Automatizado $randomId"
    correo = $adminEmail
    password = $adminPass
    rol = "ADMIN"
    aceptaPoliticaDatos = $true
} | ConvertTo-Json

$adminToken = $null
try {
    $adminReg = Invoke-RestMethod -Uri "$baseUrl/api/auth/register" -Method Post -Body $adminBody -ContentType "application/json" -ErrorAction Stop
    $adminToken = $adminReg.token
    Assert-Test "Registro de usuario ADMIN (201 Created)" ($adminReg.rol -eq "ADMIN") "Rol: $($adminReg.rol)"
} catch {
    Assert-Test "Registro de usuario ADMIN (201 Created)" $false $_.Exception.Message
}

$adminHeaders = @{
    Authorization = "Bearer $adminToken"
}

# 10.1 Crear producto como ADMIN (201 Created)
$nuevoProd = @{
    categoriaId = 1
    sku = "TEST-PROD-$randomId"
    nombre = "Producto Test Suite $randomId"
    descripcion = "Descripcion producto test"
    precio = 45000.00
    stock = 10
    imagenUrl = "https://images.unsplash.com/photo-1559056199-641a0ac8b55e"
    estado = "ACTIVO"
} | ConvertTo-Json

$createdProdId = $null
try {
    $createdProd = Invoke-RestMethod -Uri "$baseUrl/api/productos" -Method Post -Body ([System.Text.Encoding]::UTF8.GetBytes($nuevoProd)) -ContentType "application/json; charset=utf-8" -Headers $adminHeaders -ErrorAction Stop
    $createdProdId = $createdProd.id
    Assert-Test "Crear producto como ADMIN (201 Created)" ($createdProd.sku -eq "TEST-PROD-$randomId") "ID: $createdProdId"
} catch {
    $errDetail = $_.Exception.Message
    if ($_.Exception.Response) {
        $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
        $errDetail += " -> " + $reader.ReadToEnd()
    }
    Assert-Test "Crear producto como ADMIN (201 Created)" $false $errDetail
}

# 10.2 Actualizar producto como ADMIN (200 OK)
$updateProd = @{
    categoriaId = 1
    sku = "TEST-PROD-$randomId"
    nombre = "Producto Test Suite $randomId (Actualizado)"
    descripcion = "Descripcion producto test modificada"
    precio = 49000.00
    stock = 8
    imagenUrl = "https://images.unsplash.com/photo-1559056199-641a0ac8b55e"
    estado = "ACTIVO"
} | ConvertTo-Json

try {
    $updatedProd = Invoke-RestMethod -Uri "$baseUrl/api/productos/$createdProdId" -Method Put -Body ([System.Text.Encoding]::UTF8.GetBytes($updateProd)) -ContentType "application/json; charset=utf-8" -Headers $adminHeaders -ErrorAction Stop
    Assert-Test "Actualizar producto como ADMIN (200 OK)" ($updatedProd.precio -eq 49000.00) "Precio: $($updatedProd.precio)"
} catch {
    Assert-Test "Actualizar producto como ADMIN (200 OK)" $false $_.Exception.Message
}

# ------------------------------------------------------------------------------
# 11. Cálculo de carrito con inventario y regla de envío gratis
# ------------------------------------------------------------------------------
$carritoItems = @(
    @{
        productoId = 1
        cantidad = 2
    },
    @{
        productoId = 3
        cantidad = 1
    }
) | ConvertTo-Json

try {
    $calcResp = Invoke-RestMethod -Uri "$baseUrl/api/carrito/calcular" -Method Post -Body $carritoItems -ContentType "application/json" -Headers $clienteHeaders -ErrorAction Stop
    $subtotalValido = $calcResp.subtotal -gt 0
    $envioValido = ($calcResp.subtotal -ge 150000 -and $calcResp.costoEnvio -eq 0) -or ($calcResp.subtotal -lt 150000 -and $calcResp.costoEnvio -gt 0)
    Assert-Test "Cálculo de carrito y reglas de envío gratis" ($subtotalValido -and $envioValido) "Subtotal: $($calcResp.subtotal), Envío: $($calcResp.costoEnvio)"
} catch {
    Assert-Test "Cálculo de carrito y reglas de envío gratis" $false $_.Exception.Message
}

# ------------------------------------------------------------------------------
# 12. Creación de orden con descuento de stock atómico
# ------------------------------------------------------------------------------
# Consultar stock inicial de producto 1:
$prodAntes = Invoke-RestMethod -Uri "$baseUrl/api/productos/1" -Method Get
$stockAntes = $prodAntes.stock

$ordenReq = @{
    items = @(
        @{
            productoId = 1
            cantidad = 1
        }
    )
    direccionEntrega = "Avenida El Dorado # 68-15, Bogota"
    telefonoContacto = "3101234567"
    metodoPago = "CONTRAENTREGA"
} | ConvertTo-Json

try {
    $ordenCreada = Invoke-RestMethod -Uri "$baseUrl/api/ordenes" -Method Post -Body $ordenReq -ContentType "application/json" -Headers $clienteHeaders -ErrorAction Stop
    $codigoOrden = $ordenCreada.codigoOrden
    
    # Consultar stock posterior del producto 1:
    $prodDespues = Invoke-RestMethod -Uri "$baseUrl/api/productos/1" -Method Get
    $stockDespues = $prodDespues.stock
    $descuentoCorrecto = ($stockDespues -eq ($stockAntes - 1))

    Assert-Test "Creación de orden y descuento de stock atómico" ($codigoOrden.StartsWith("ORD-") -and $descuentoCorrecto) "Antes: $stockAntes, Después: $stockDespues, Orden: $codigoOrden"
} catch {
    Assert-Test "Creación de orden y descuento de stock atómico" $false $_.Exception.Message
}

# ------------------------------------------------------------------------------
# 13. Conflicto por stock insuficiente en orden (409 Conflict)
# ------------------------------------------------------------------------------
$ordenExceso = @{
    items = @(
        @{
            productoId = 1
            cantidad = 99999
        }
    )
    direccionEntrega = "Avenida El Dorado # 68-15, Bogota"
    telefonoContacto = "3101234567"
    metodoPago = "CONTRAENTREGA"
} | ConvertTo-Json

try {
    Invoke-RestMethod -Uri "$baseUrl/api/ordenes" -Method Post -Body $ordenExceso -ContentType "application/json" -Headers $clienteHeaders -ErrorAction Stop
    Assert-Test "Conflicto por stock insuficiente al crear orden (409 Conflict)" $false "Esperaba 409"
} catch {
    $statusCode = [int]$_.Exception.Response.StatusCode
    Assert-Test "Conflicto por stock insuficiente al crear orden (409 Conflict)" ($statusCode -eq 409) "Status code: $statusCode"
}

# ------------------------------------------------------------------------------
# 14. Conflicto al intentar eliminar producto con órdenes asociadas (409 Conflict)
# ------------------------------------------------------------------------------
try {
    Invoke-RestMethod -Uri "$baseUrl/api/productos/1" -Method Delete -Headers $adminHeaders -ErrorAction Stop
    Assert-Test "Conflicto al eliminar producto con órdenes asociadas (409 Conflict)" $false "Esperaba 409"
} catch {
    $statusCode = [int]$_.Exception.Response.StatusCode
    Assert-Test "Conflicto al eliminar producto con órdenes asociadas (409 Conflict)" ($statusCode -eq 409) "Status code: $statusCode"
}

# ------------------------------------------------------------------------------
# Resumen Final
# ------------------------------------------------------------------------------
Write-Host "`n=== RESULTADOS DE LA SUITE DE PRUEBAS ===" -ForegroundColor Cyan
Write-Host " Pruebas Exitosas: $global:passed" -ForegroundColor Green
Write-Host " Pruebas Fallidas: $global:failed" -ForegroundColor $(if ($global:failed -eq 0) { "Green" } else { "Red" })

if ($global:failed -gt 0) {
    exit 1
} else {
    exit 0
}
