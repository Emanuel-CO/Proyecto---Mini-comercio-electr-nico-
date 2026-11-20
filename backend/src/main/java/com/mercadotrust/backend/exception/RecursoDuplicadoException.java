package com.mercadotrust.backend.exception;

public class RecursoDuplicadoException extends ConflictException {
    public RecursoDuplicadoException(String message) {
        super(message);
    }
}
