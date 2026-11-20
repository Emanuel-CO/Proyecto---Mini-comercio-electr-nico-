package com.mercadotrust.backend.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import java.math.BigDecimal;

public class CarritoItemDto {

    @NotNull(message = "El ID del producto es obligatorio")
    private Integer productoId;

    private String nombre;
    private String sku;
    private String imagenUrl;
    private BigDecimal precioUnitario;

    @NotNull(message = "La cantidad es obligatoria")
    @Min(value = 1, message = "La cantidad debe ser al menos 1")
    private Integer cantidad;

    private Integer stockDisponible;
    private BigDecimal subtotalLinea;
    private Boolean tieneStockSuficiente;
    private String advertencia;

    public CarritoItemDto() {}

    public Integer getProductoId() {
        return productoId;
    }

    public void setProductoId(Integer productoId) {
        this.productoId = productoId;
    }

    public String getNombre() {
        return nombre;
    }

    public void setNombre(String nombre) {
        this.nombre = nombre;
    }

    public String getSku() {
        return sku;
    }

    public void setSku(String sku) {
        this.sku = sku;
    }

    public String getImagenUrl() {
        return imagenUrl;
    }

    public void setImagenUrl(String imagenUrl) {
        this.imagenUrl = imagenUrl;
    }

    public BigDecimal getPrecioUnitario() {
        return precioUnitario;
    }

    public void setPrecioUnitario(BigDecimal precioUnitario) {
        this.precioUnitario = precioUnitario;
    }

    public Integer getCantidad() {
        return cantidad;
    }

    public void setCantidad(Integer cantidad) {
        this.cantidad = cantidad;
    }

    public Integer getStockDisponible() {
        return stockDisponible;
    }

    public void setStockDisponible(Integer stockDisponible) {
        this.stockDisponible = stockDisponible;
    }

    public BigDecimal getSubtotalLinea() {
        return subtotalLinea;
    }

    public void setSubtotalLinea(BigDecimal subtotalLinea) {
        this.subtotalLinea = subtotalLinea;
    }

    public Boolean getTieneStockSuficiente() {
        return tieneStockSuficiente;
    }

    public void setTieneStockSuficiente(Boolean tieneStockSuficiente) {
        this.tieneStockSuficiente = tieneStockSuficiente;
    }

    public String getAdvertencia() {
        return advertencia;
    }

    public void setAdvertencia(String advertencia) {
        this.advertencia = advertencia;
    }
}
