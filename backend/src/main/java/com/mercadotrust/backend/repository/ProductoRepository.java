package com.mercadotrust.backend.repository;

import com.mercadotrust.backend.entity.Producto;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ProductoRepository extends JpaRepository<Producto, Integer> {
    List<Producto> findByEstado(String estado);
    List<Producto> findByCategoriaId(Integer categoriaId);
    List<Producto> findByCategoriaIdAndEstado(Integer categoriaId, String estado);
    Optional<Producto> findBySku(String sku);
}
