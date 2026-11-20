package com.mercadotrust.backend.dto;

import jakarta.validation.constraints.NotBlank;

public class ClienteUpdateDto {

    @NotBlank(message = "El nombre completo es obligatorio")
    private String nombresCompletos;

    private String telefono;
    private String direccionEnvio;
    private String passwordActual;
    private String passwordNueva;

    public ClienteUpdateDto() {}

    public String getNombresCompletos() {
        return nombresCompletos;
    }

    public void setNombresCompletos(String nombresCompletos) {
        this.nombresCompletos = nombresCompletos;
    }

    public String getTelefono() {
        return telefono;
    }

    public void setTelefono(String telefono) {
        this.telefono = telefono;
    }

    public String getDireccionEnvio() {
        return direccionEnvio;
    }

    public void setDireccionEnvio(String direccionEnvio) {
        this.direccionEnvio = direccionEnvio;
    }

    public String getPasswordActual() {
        return passwordActual;
    }

    public void setPasswordActual(String passwordActual) {
        this.passwordActual = passwordActual;
    }

    public String getPasswordNueva() {
        return passwordNueva;
    }

    public void setPasswordNueva(String passwordNueva) {
        this.passwordNueva = passwordNueva;
    }
}
