package com.mercadotrust.backend.controller;

import com.mercadotrust.backend.dto.CarritoItemDto;
import com.mercadotrust.backend.dto.OrdenCreateDto;
import com.mercadotrust.backend.entity.DetallePedido;
import com.mercadotrust.backend.entity.Pedido;
import com.mercadotrust.backend.entity.Producto;
import com.mercadotrust.backend.entity.Usuario;
import com.mercadotrust.backend.exception.ResourceNotFoundException;
import com.mercadotrust.backend.exception.StockInsuficienteException;
import com.mercadotrust.backend.repository.PedidoRepository;
import com.mercadotrust.backend.repository.ProductoRepository;
import com.mercadotrust.backend.repository.UsuarioRepository;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@Tag(name = "Órdenes", description = "Creación y seguimiento de órdenes para clientes y administración")
@SecurityRequirement(name = "BearerAuth")
public class OrdenController {

    private static final BigDecimal UMBRAL_ENVIO_GRATIS = new BigDecimal("150000");
    private static final BigDecimal TARIFA_ENVIO_ESTANDAR = new BigDecimal("12000");

    private final PedidoRepository pedidoRepository;
    private final ProductoRepository productoRepository;
    private final UsuarioRepository usuarioRepository;

    public OrdenController(
            PedidoRepository pedidoRepository,
            ProductoRepository productoRepository,
            UsuarioRepository usuarioRepository
    ) {
        this.pedidoRepository = pedidoRepository;
        this.productoRepository = productoRepository;
        this.usuarioRepository = usuarioRepository;
    }

    @PostMapping("/api/ordenes")
    @PreAuthorize("hasAnyRole('CLIENTE', 'ADMIN')")
    @Transactional
    @Operation(summary = "Crear y confirmar nueva orden de compra con descuento de inventario atómico")
    public ResponseEntity<?> crearOrden(
            @Valid @RequestBody OrdenCreateDto dto,
            Authentication authentication
    ) {
        String correo = authentication.getName();
        Usuario usuario = usuarioRepository.findByCorreo(correo)
                .orElseThrow(() -> new ResourceNotFoundException("Usuario no autenticado"));

        if (dto.getItems() == null || dto.getItems().isEmpty()) {
            throw new IllegalArgumentException("El carrito no contiene productos");
        }

        Pedido pedido = new Pedido();
        pedido.setUsuario(usuario);
        pedido.setDireccionEntrega(dto.getDireccionEntrega());
        pedido.setTelefonoContacto(dto.getTelefonoContacto());
        pedido.setMetodoPago(dto.getMetodoPago());
        pedido.setEstado("PENDIENTE");

        // Generar código único de orden ej: ORD-20261120-A1B2C3
        String timestamp = LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMMdd"));
        String randomSuffix = UUID.randomUUID().toString().substring(0, 6).toUpperCase();
        pedido.setCodigoOrden("ORD-" + timestamp + "-" + randomSuffix);

        BigDecimal subtotalAcumulado = BigDecimal.ZERO;

        for (CarritoItemDto itemDto : dto.getItems()) {
            Producto producto = productoRepository.findById(itemDto.getProductoId())
                    .orElseThrow(() -> new ResourceNotFoundException("Producto con ID " + itemDto.getProductoId() + " no encontrado"));

            if (producto.getStock() < itemDto.getCantidad()) {
                throw new StockInsuficienteException(
                        "Stock insuficiente para el producto '" + producto.getNombre() +
                        "'. Disponibles: " + producto.getStock() + ", Solicitados: " + itemDto.getCantidad()
                );
            }

            // Descontar inventario
            producto.setStock(producto.getStock() - itemDto.getCantidad());
            if (producto.getStock() == 0) {
                producto.setEstado("AGOTADO");
            }
            productoRepository.save(producto);

            // Crear detalle de pedido
            DetallePedido detalle = new DetallePedido();
            detalle.setPedido(pedido);
            detalle.setProducto(producto);
            detalle.setProductoNombre(producto.getNombre());
            detalle.setProductoSku(producto.getSku());
            detalle.setProductoImagenUrl(producto.getImagenUrl());
            detalle.setCantidad(itemDto.getCantidad());
            detalle.setPrecioUnitarioHistorico(producto.getPrecio());

            BigDecimal subtotalLinea = producto.getPrecio().multiply(BigDecimal.valueOf(itemDto.getCantidad()));
            detalle.setSubtotalLinea(subtotalLinea);
            subtotalAcumulado = subtotalAcumulado.add(subtotalLinea);

            pedido.getDetalles().add(detalle);
        }

        pedido.setSubtotal(subtotalAcumulado);
        pedido.setImpuestos(BigDecimal.ZERO);

        if (subtotalAcumulado.compareTo(UMBRAL_ENVIO_GRATIS) >= 0) {
            pedido.setCostoEnvio(BigDecimal.ZERO);
        } else {
            pedido.setCostoEnvio(TARIFA_ENVIO_ESTANDAR);
        }

        pedido.setTotal(pedido.getSubtotal().add(pedido.getCostoEnvio()));

        Pedido pedidoGuardado = pedidoRepository.save(pedido);

        return ResponseEntity.status(HttpStatus.CREATED).body(pedidoGuardado);
    }

    @GetMapping("/api/ordenes/mis-ordenes")
    @PreAuthorize("hasAnyRole('CLIENTE', 'ADMIN')")
    @Operation(summary = "Historial de órdenes del cliente autenticado")
    public ResponseEntity<List<Pedido>> obtenerMisOrdenes(Authentication authentication) {
        String correo = authentication.getName();
        Usuario usuario = usuarioRepository.findByCorreo(correo)
                .orElseThrow(() -> new ResourceNotFoundException("Usuario no autenticado"));

        List<Pedido> ordenes = pedidoRepository.findByUsuarioIdOrderByCreatedAtDesc(usuario.getId());
        return ResponseEntity.ok(ordenes);
    }

    @GetMapping("/api/ordenes/{id}")
    @PreAuthorize("hasAnyRole('CLIENTE', 'ADMIN')")
    @Operation(summary = "Detalle completo de una orden por ID")
    public ResponseEntity<?> obtenerOrdenPorId(@PathVariable Integer id, Authentication authentication) {
        Pedido pedido = pedidoRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Orden no encontrada con ID: " + id));

        String correo = authentication.getName();
        boolean esAdmin = authentication.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN"));

        if (!esAdmin && !pedido.getUsuario().getCorreo().equalsIgnoreCase(correo)) {
            throw new AccessDeniedException("No tiene permisos para ver esta orden");
        }

        return ResponseEntity.ok(pedido);
    }

    @GetMapping("/api/admin/ordenes")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Listar todas las órdenes registradas en el sistema (Solo Admin)")
    public ResponseEntity<List<Pedido>> listarTodasLasOrdenes() {
        return ResponseEntity.ok(pedidoRepository.findAll());
    }

    @PutMapping("/api/admin/ordenes/{id}/estado")
    @PreAuthorize("hasRole('ADMIN')")
    @Transactional
    @Operation(summary = "Actualizar estado de una orden (Solo Admin)")
    public ResponseEntity<?> actualizarEstadoOrden(
            @PathVariable Integer id,
            @RequestParam String estado
    ) {
        Pedido pedido = pedidoRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Orden no encontrada con ID: " + id));

        String estadoAnterior = pedido.getEstado();
        String nuevoEstado = estado.toUpperCase();
        pedido.setEstado(nuevoEstado);

        // Si se cancela la orden, reincorporar stock de los productos
        if ("CANCELADO".equals(nuevoEstado) && !"CANCELADO".equals(estadoAnterior)) {
            for (DetallePedido detalle : pedido.getDetalles()) {
                Producto p = detalle.getProducto();
                p.setStock(p.getStock() + detalle.getCantidad());
                if ("AGOTADO".equals(p.getEstado()) && p.getStock() > 0) {
                    p.setEstado("ACTIVO");
                }
                productoRepository.save(p);
            }
        }

        pedidoRepository.save(pedido);

        return ResponseEntity.ok(Map.of(
                "mensaje", "Estado de orden actualizado",
                "codigoOrden", pedido.getCodigoOrden(),
                "nuevoEstado", pedido.getEstado()
        ));
    }
}
