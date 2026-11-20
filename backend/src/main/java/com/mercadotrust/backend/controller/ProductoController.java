package com.mercadotrust.backend.controller;

import com.mercadotrust.backend.dto.ProductoDto;
import com.mercadotrust.backend.entity.Categoria;
import com.mercadotrust.backend.entity.Producto;
import com.mercadotrust.backend.exception.ConflictException;
import com.mercadotrust.backend.exception.RecursoDuplicadoException;
import com.mercadotrust.backend.exception.ResourceNotFoundException;
import com.mercadotrust.backend.repository.CategoriaRepository;
import com.mercadotrust.backend.repository.DetallePedidoRepository;
import com.mercadotrust.backend.repository.ProductoRepository;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/productos")
@Tag(name = "Productos", description = "Catálogo comercial público y administración de inventario")
public class ProductoController {

    private final ProductoRepository productoRepository;
    private final CategoriaRepository categoriaRepository;
    private final DetallePedidoRepository detallePedidoRepository;

    public ProductoController(
            ProductoRepository productoRepository,
            CategoriaRepository categoriaRepository,
            DetallePedidoRepository detallePedidoRepository
    ) {
        this.productoRepository = productoRepository;
        this.categoriaRepository = categoriaRepository;
        this.detallePedidoRepository = detallePedidoRepository;
    }

    @GetMapping
    @Operation(summary = "Listar catálogo de productos (Público)")
    public ResponseEntity<List<ProductoDto>> listarProductos(
            @RequestParam(required = false) Integer categoriaId,
            @RequestParam(required = false, defaultValue = "ACTIVO") String estado
    ) {
        List<Producto> productos;
        if (categoriaId != null) {
            productos = productoRepository.findByCategoriaIdAndEstado(categoriaId, estado);
        } else {
            productos = productoRepository.findByEstado(estado);
        }

        List<ProductoDto> dtos = productos.stream().map(this::mapToDto).collect(Collectors.toList());
        return ResponseEntity.ok(dtos);
    }

    @GetMapping("/{id}")
    @Operation(summary = "Obtener detalle de un producto por ID (Público)")
    public ResponseEntity<ProductoDto> obtenerProducto(@PathVariable Integer id) {
        Producto producto = productoRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Producto no encontrado con ID: " + id));
        return ResponseEntity.ok(mapToDto(producto));
    }

    @GetMapping("/categorias")
    @Operation(summary = "Listar categorías disponibles (Público)")
    public ResponseEntity<List<Categoria>> listarCategorias() {
        return ResponseEntity.ok(categoriaRepository.findByEstado("ACTIVA"));
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    @SecurityRequirement(name = "BearerAuth")
    @Operation(summary = "Crear nuevo producto (Exclusivo Administrador)")
    public ResponseEntity<ProductoDto> crearProducto(@Valid @RequestBody ProductoDto dto) {
        Categoria categoria = categoriaRepository.findById(dto.getCategoriaId())
                .orElseThrow(() -> new ResourceNotFoundException("Categoría no encontrada con ID: " + dto.getCategoriaId()));

        if (productoRepository.findBySku(dto.getSku()).isPresent()) {
            throw new RecursoDuplicadoException("Ya existe un producto con el SKU: " + dto.getSku());
        }

        Producto producto = new Producto();
        producto.setCategoria(categoria);
        producto.setSku(dto.getSku());
        producto.setNombre(dto.getNombre());
        producto.setDescripcion(dto.getDescripcion());
        producto.setPrecio(dto.getPrecio());
        producto.setStock(dto.getStock());
        producto.setImagenUrl(dto.getImagenUrl());
        producto.setEstado(dto.getEstado() != null ? dto.getEstado() : "ACTIVO");

        Producto guardado = productoRepository.save(producto);
        return ResponseEntity.status(HttpStatus.CREATED).body(mapToDto(guardado));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    @SecurityRequirement(name = "BearerAuth")
    @Operation(summary = "Actualizar producto existente (Exclusivo Administrador)")
    public ResponseEntity<ProductoDto> actualizarProducto(@PathVariable Integer id, @Valid @RequestBody ProductoDto dto) {
        Producto producto = productoRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Producto no encontrado con ID: " + id));

        Categoria categoria = categoriaRepository.findById(dto.getCategoriaId())
                .orElseThrow(() -> new ResourceNotFoundException("Categoría no encontrada con ID: " + dto.getCategoriaId()));

        // Verificar si el SKU fue modificado y ya pertenece a otro producto
        productoRepository.findBySku(dto.getSku()).ifPresent(existente -> {
            if (!existente.getId().equals(id)) {
                throw new RecursoDuplicadoException("Ya existe otro producto con el SKU: " + dto.getSku());
            }
        });

        producto.setCategoria(categoria);
        producto.setNombre(dto.getNombre());
        producto.setDescripcion(dto.getDescripcion());
        producto.setPrecio(dto.getPrecio());
        producto.setStock(dto.getStock());
        producto.setImagenUrl(dto.getImagenUrl());
        if (dto.getEstado() != null) {
            producto.setEstado(dto.getEstado());
        }

        Producto actualizado = productoRepository.save(producto);
        return ResponseEntity.ok(mapToDto(actualizado));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    @SecurityRequirement(name = "BearerAuth")
    @Operation(summary = "Eliminar o desactivar producto (Exclusivo Administrador)")
    public ResponseEntity<?> eliminarProducto(@PathVariable Integer id) {
        Producto producto = productoRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Producto no encontrado con ID: " + id));

        // Validación de conflicto: no se permite eliminar producto con órdenes asociadas
        if (detallePedidoRepository.existsByProductoId(id)) {
            throw new ConflictException("No se puede eliminar el producto '" + producto.getNombre() + "' porque tiene órdenes de compra asociadas en el historial. Puede marcarlo como INACTIVO.");
        }

        producto.setEstado("INACTIVO");
        productoRepository.save(producto);
        return ResponseEntity.ok(Map.of("mensaje", "Producto marcado como inactivo"));
    }

    private ProductoDto mapToDto(Producto p) {
        ProductoDto dto = new ProductoDto();
        dto.setId(p.getId());
        dto.setCategoriaId(p.getCategoria().getId());
        dto.setCategoriaNombre(p.getCategoria().getNombre());
        dto.setSku(p.getSku());
        dto.setNombre(p.getNombre());
        dto.setDescripcion(p.getDescripcion());
        dto.setPrecio(p.getPrecio());
        dto.setStock(p.getStock());
        dto.setImagenUrl(p.getImagenUrl());
        dto.setEstado(p.getEstado());
        return dto;
    }
}
