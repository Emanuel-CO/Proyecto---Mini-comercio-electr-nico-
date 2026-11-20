package com.mercadotrust.backend.controller;

import com.mercadotrust.backend.dto.ProductoDto;
import com.mercadotrust.backend.entity.Categoria;
import com.mercadotrust.backend.entity.Producto;
import com.mercadotrust.backend.repository.CategoriaRepository;
import com.mercadotrust.backend.repository.ProductoRepository;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/productos")
@Tag(name = "Productos", description = "Catálogo comercial público y administración de inventario")
public class ProductoController {

    private final ProductoRepository productoRepository;
    private final CategoriaRepository categoriaRepository;

    public ProductoController(ProductoRepository productoRepository, CategoriaRepository categoriaRepository) {
        this.productoRepository = productoRepository;
        this.categoriaRepository = categoriaRepository;
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
    public ResponseEntity<?> obtenerProducto(@PathVariable Integer id) {
        Optional<Producto> opt = productoRepository.findById(id);
        if (opt.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Map.of("error", "Producto no encontrado"));
        }
        return ResponseEntity.ok(mapToDto(opt.get()));
    }

    @GetMapping("/categorias")
    @Operation(summary = "Listar categorías disponibles (Público)")
    public ResponseEntity<List<Categoria>> listarCategorias() {
        return ResponseEntity.ok(categoriaRepository.findByEstado("ACTIVA"));
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Crear nuevo producto (Exclusivo Administrador)")
    public ResponseEntity<?> crearProducto(@Valid @RequestBody ProductoDto dto) {
        Categoria categoria = categoriaRepository.findById(dto.getCategoriaId())
                .orElse(null);

        if (categoria == null) {
            return ResponseEntity.badRequest().body(Map.of("error", "Categoría no encontrada"));
        }

        if (productoRepository.findBySku(dto.getSku()).isPresent()) {
            return ResponseEntity.badRequest().body(Map.of("error", "Ya existe un producto con el SKU: " + dto.getSku()));
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
    @Operation(summary = "Actualizar producto existente (Exclusivo Administrador)")
    public ResponseEntity<?> actualizarProducto(@PathVariable Integer id, @Valid @RequestBody ProductoDto dto) {
        Producto producto = productoRepository.findById(id).orElse(null);
        if (producto == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", "Producto no encontrado"));
        }

        Categoria categoria = categoriaRepository.findById(dto.getCategoriaId()).orElse(null);
        if (categoria == null) {
            return ResponseEntity.badRequest().body(Map.of("error", "Categoría no encontrada"));
        }

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
    @Operation(summary = "Desactivar/eliminar producto (Exclusivo Administrador)")
    public ResponseEntity<?> eliminarProducto(@PathVariable Integer id) {
        Optional<Producto> opt = productoRepository.findById(id);
        if (opt.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", "Producto no encontrado"));
        }
        Producto p = opt.get();
        p.setEstado("INACTIVO");
        productoRepository.save(p);
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
