package com.mercadotrust.backend.exception;

public class StockInsuficienteException extends ConflictException {
    public StockInsuficienteException(String message) {
        super(message);
    }
}
