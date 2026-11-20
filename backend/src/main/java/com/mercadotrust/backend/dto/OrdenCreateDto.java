package com.mercadotrust.backend.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import java.util.List;

public class OrdenCreateDto {

    @NotEmpty(message = "El carrito no puede estar vacío")
    private List<CarritoItemDto> items;

    @NotBlank(message = "La dirección de entrega es obligatoria")
    private String direccionEntrega;

    @NotBlank(message = "El teléfono de contacto es obligatorio")
    private String telefonoContacto;

    @NotBlank(message = "El método de pago es obligatorio")
    private String metodoPago; // CONTRAENTREGA, TRANSFERENCIA_NEQUI, TARJETA_CREDITO_DEMO

    public OrdenCreateDto() {}

    public List<CarritoItemDto> getItems() {
        return items;
    }

    public void setItems(List<CarritoItemDto> items) {
        this.items = items;
    }

    public String getDireccionEntrega() {
        return direccionEntrega;
    }

    public void setDireccionEntrega(String direccionEntrega) {
        this.direccionEntrega = direccionEntrega;
    }

    public String getTelefonoContacto() {
        return telefonoContacto;
    }

    public void setTelefonoContacto(String telefonoContacto) {
        this.telefonoContacto = telefonoContacto;
    }

    public String getMetodoPago() {
        return metodoPago;
    }

    public void setMetodoPago(String metodoPago) {
        this.metodoPago = metodoPago;
    }
}
