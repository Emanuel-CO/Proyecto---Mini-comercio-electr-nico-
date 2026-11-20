package com.mercadotrust.backend.controller;

import com.mercadotrust.backend.dto.CarritoCalculoDto;
import com.mercadotrust.backend.dto.CarritoItemDto;
import com.mercadotrust.backend.entity.Producto;
import com.mercadotrust.backend.repository.ProductoRepository;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/carrito")
@Tag(name = "Carrito", description = "Cálculo y validación en tiempo real del carrito de compras")
@SecurityRequirement(name = "BearerAuth")
public class CarritoController {

    private static final BigDecimal UMBRAL_ENVIO_GRATIS = new BigDecimal("150000");
    private static final BigDecimal TARIFA_ENVIO_ESTANDAR = new BigDecimal("12000");

    private final ProductoRepository productoRepository;

    public CarritoController(ProductoRepository productoRepository) {
        this.productoRepository = productoRepository;
    }

    @PostMapping("/calcular")
    @PreAuthorize("hasAnyRole('CLIENTE', 'ADMIN')")
    @Operation(summary = "Calcular subtotales, verificar inventario y reglas de envío gratis")
    public ResponseEntity<CarritoCalculoDto> calcularCarrito(@RequestBody List<CarritoItemDto> itemsSolicitados) {
        CarritoCalculoDto respuesta = new CarritoCalculoDto();
        List<CarritoItemDto> itemsCalculados = new ArrayList<>();
        BigDecimal subtotalAcumulado = BigDecimal.ZERO;
        boolean problemaStock = false;

        for (CarritoItemDto itemReq : itemsSolicitados) {
            CarritoItemDto itemResp = new CarritoItemDto();
            itemResp.setProductoId(itemReq.getProductoId());
            itemResp.setCantidad(itemReq.getCantidad());

            Optional<Producto> productoOpt = productoRepository.findById(itemReq.getProductoId());
            if (productoOpt.isEmpty()) {
                itemResp.setTieneStockSuficiente(false);
                itemResp.setAdvertencia("El producto ya no existe en el catálogo");
                problemaStock = true;
                itemsCalculados.add(itemResp);
                continue;
            }

            Producto producto = productoOpt.get();
            itemResp.setNombre(producto.getNombre());
            itemResp.setSku(producto.getSku());
            itemResp.setImagenUrl(producto.getImagenUrl());
            itemResp.setPrecioUnitario(producto.getPrecio());
            itemResp.setStockDisponible(producto.getStock());

            if (producto.getStock() < itemReq.getCantidad()) {
                itemResp.setTieneStockSuficiente(false);
                itemResp.setAdvertencia("Stock insuficiente. Solo quedan " + producto.getStock() + " unidades disponibles.");
                problemaStock = true;
            } else {
                itemResp.setTieneStockSuficiente(true);
            }

            BigDecimal linea = producto.getPrecio().multiply(BigDecimal.valueOf(itemReq.getCantidad()));
            itemResp.setSubtotalLinea(linea);
            subtotalAcumulado = subtotalAcumulado.add(linea);

            itemsCalculados.add(itemResp);
        }

        respuesta.setItems(itemsCalculados);
        respuesta.setSubtotal(subtotalAcumulado);
        respuesta.setTieneProblemasStock(problemaStock);
        respuesta.setUmbralEnvioGratis(UMBRAL_ENVIO_GRATIS);

        if (subtotalAcumulado.compareTo(BigDecimal.ZERO) > 0 && subtotalAcumulado.compareTo(UMBRAL_ENVIO_GRATIS) >= 0) {
            respuesta.setCostoEnvio(BigDecimal.ZERO);
        } else if (subtotalAcumulado.compareTo(BigDecimal.ZERO) > 0) {
            respuesta.setCostoEnvio(TARIFA_ENVIO_ESTANDAR);
        } else {
            respuesta.setCostoEnvio(BigDecimal.ZERO);
        }

        respuesta.setTotal(respuesta.getSubtotal().add(respuesta.getCostoEnvio()));

        return ResponseEntity.ok(respuesta);
    }

    @GetMapping("/validar-stock/{productoId}")
    @PreAuthorize("hasAnyRole('CLIENTE', 'ADMIN')")
    @Operation(summary = "Verificar disponibilidad rápida de inventario de un producto")
    public ResponseEntity<?> validarStock(
            @PathVariable Integer productoId,
            @RequestParam(defaultValue = "1") Integer cantidad
    ) {
        return productoRepository.findById(productoId)
                .map(p -> {
                    boolean disponible = p.getStock() >= cantidad;
                    return ResponseEntity.ok(Map.of(
                            "productoId", p.getId(),
                            "nombre", p.getNombre(),
                            "stockDisponible", p.getStock(),
                            "cantidadSolicitada", cantidad,
                            "disponible", disponible,
                            "mensaje", disponible ? "Stock suficiente" : "Stock insuficiente (disponibles: " + p.getStock() + ")"
                    ));
                })
                .orElse(ResponseEntity.notFound().build());
    }
}
