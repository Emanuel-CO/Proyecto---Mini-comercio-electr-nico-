package com.mercadotrust.backend.repository;

import com.mercadotrust.backend.entity.Pedido;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface PedidoRepository extends JpaRepository<Pedido, Integer> {
    List<Pedido> findByUsuarioIdOrderByCreatedAtDesc(Integer usuarioId);
    Optional<Pedido> findByCodigoOrden(String codigoOrden);
}
