package com.mercadotrust.backend.repository;

import com.mercadotrust.backend.entity.Categoria;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface CategoriaRepository extends JpaRepository<Categoria, Integer> {
    List<Categoria> findByEstado(String estado);
}
