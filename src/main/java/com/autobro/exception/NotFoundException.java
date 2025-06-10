package com.autobro.exception;

public class NotFoundException extends RuntimeException {
    public NotFoundException(String message) {
        super(message);
    }

    public NotFoundException(String entityName, Long id) {
        super(String.format("%s not found with id: %d", entityName, id));
    }

    public NotFoundException(String entityName, String value) {
        super(String.format("%s not found with value: %s", entityName, value));
    }
} 