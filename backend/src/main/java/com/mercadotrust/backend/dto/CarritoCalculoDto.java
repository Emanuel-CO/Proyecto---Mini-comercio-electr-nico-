package com.mercadotrust.backend.dto;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;

public class CarritoCalculoDto {

    private List<CarritoItemDto> items = new ArrayList<>();
    private BigDecimal subtotal = BigDecimal.ZERO;
    private BigDecimal impuestos = BigDecimal.ZERO;
    private BigDecimal costoEnvio = BigDecimal.ZERO;
    private BigDecimal total = BigDecimal.ZERO;
    private Boolean tieneProblemasStock = false;
    private BigDecimal umbralEnvioGratis = new BigDecimal("150000");

    public CarritoCalculoDto() {}

    public List<CarritoItemDto> getItems() {
        return items;
    }

    public void setItems(List<CarritoItemDto> items) {
        this.items = items;
    }

    public BigDecimal getSubtotal() {
        return subtotal;
    }

    public void setSubtotal(BigDecimal subtotal) {
        this.subtotal = subtotal;
    }

    public BigDecimal getImpuestos() {
        return impuestos;
    }

    public void setImpuestos(BigDecimal impuestos) {
        this.impuestos = impuestos;
    }

    public BigDecimal getCostoEnvio() {
        return costoEnvio;
    }

    public void setCostoEnvio(BigDecimal costoEnvio) {
        this.costoEnvio = costoEnvio;
    }

    public BigDecimal getTotal() {
        return total;
    }

    public void setTotal(BigDecimal total) {
        this.total = total;
    }

    public Boolean getTieneProblemasStock() {
        return tieneProblemasStock;
    }

    public void setTieneProblemasStock(Boolean tieneProblemasStock) {
        this.tieneProblemasStock = tieneProblemasStock;
    }

    public BigDecimal getUmbralEnvioGratis() {
        return umbralEnvioGratis;
    }

    public void setUmbralEnvioGratis(BigDecimal umbralEnvioGratis) {
        this.umbralEnvioGratis = umbralEnvioGratis;
    }
}
