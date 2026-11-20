package com.mercadotrust.backend.entity;

import com.fasterxml.jackson.annotation.JsonBackReference;
import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.OffsetDateTime;

@Entity
@Table(name = "detalle_pedidos")
public class DetallePedido {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "pedido_id", nullable = false)
    @JsonBackReference
    private Pedido pedido;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "producto_id", nullable = false)
    private Producto producto;

    @Column(name = "producto_nombre", nullable = false)
    private String productoNombre;

    @Column(name = "producto_sku", nullable = false, length = 50)
    private String productoSku;

    @Column(name = "producto_imagen_url", columnDefinition = "TEXT")
    private String productoImagenUrl;

    @Column(nullable = false)
    private Integer cantidad;

    @Column(name = "precio_unitario_historico", nullable = false, precision = 12, scale = 2)
    private BigDecimal precioUnitarioHistorico;

    @Column(name = "subtotal_linea", nullable = false, precision = 12, scale = 2)
    private BigDecimal subtotalLinea;

    @Column(name = "created_at")
    private OffsetDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        if (createdAt == null) {
            createdAt = OffsetDateTime.now();
        }
    }

    public DetallePedido() {}

    public Integer getId() {
        return id;
    }

    public void setId(Integer id) {
        this.id = id;
    }

    public Pedido getPedido() {
        return pedido;
    }

    public void setPedido(Pedido pedido) {
        this.pedido = pedido;
    }

    public Producto getProducto() {
        return producto;
    }

    public void setProducto(Producto producto) {
        this.producto = producto;
    }

    public String getProductoNombre() {
        return productoNombre;
    }

    public void setProductoNombre(String productoNombre) {
        this.productoNombre = productoNombre;
    }

    public String getProductoSku() {
        return productoSku;
    }

    public void setProductoSku(String productoSku) {
        this.productoSku = productoSku;
    }

    public String getProductoImagenUrl() {
        return productoImagenUrl;
    }

    public void setProductoImagenUrl(String productoImagenUrl) {
        this.productoImagenUrl = productoImagenUrl;
    }

    public Integer getCantidad() {
        return cantidad;
    }

    public void setCantidad(Integer cantidad) {
        this.cantidad = cantidad;
    }

    public BigDecimal getPrecioUnitarioHistorico() {
        return precioUnitarioHistorico;
    }

    public void setPrecioUnitarioHistorico(BigDecimal precioUnitarioHistorico) {
        this.precioUnitarioHistorico = precioUnitarioHistorico;
    }

    public BigDecimal getSubtotalLinea() {
        return subtotalLinea;
    }

    public void setSubtotalLinea(BigDecimal subtotalLinea) {
        this.subtotalLinea = subtotalLinea;
    }

    public OffsetDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(OffsetDateTime createdAt) {
        this.createdAt = createdAt;
    }
}
