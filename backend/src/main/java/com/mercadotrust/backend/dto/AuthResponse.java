package com.mercadotrust.backend.dto;

public class AuthResponse {

    private String token;
    private String tipo = "Bearer";
    private Integer id;
    private String correo;
    private String nombresCompletos;
    private String rol;

    public AuthResponse() {}

    public AuthResponse(String token, Integer id, String correo, String nombresCompletos, String rol) {
        this.token = token;
        this.id = id;
        this.correo = correo;
        this.nombresCompletos = nombresCompletos;
        this.rol = rol;
    }

    public String getToken() {
        return token;
    }

    public void setToken(String token) {
        this.token = token;
    }

    public String getTipo() {
        return tipo;
    }

    public void setTipo(String tipo) {
        this.tipo = tipo;
    }

    public Integer getId() {
        return id;
    }

    public void setId(Integer id) {
        this.id = id;
    }

    public String getCorreo() {
        return correo;
    }

    public void setCorreo(String correo) {
        this.correo = correo;
    }

    public String getNombresCompletos() {
        return nombresCompletos;
    }

    public void setNombresCompletos(String nombresCompletos) {
        this.nombresCompletos = nombresCompletos;
    }

    public String getRol() {
        return rol;
    }

    public void setRol(String rol) {
        this.rol = rol;
    }
}
