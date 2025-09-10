package com.library_web.library.exception;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.server.ResponseStatusException;

import java.util.HashMap;
import java.util.Map;
import java.util.NoSuchElementException;
import org.springframework.http.HttpStatus;

@RestControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(MaxBorrowLimitExceededException.class)
    public ResponseEntity<?> handleMaxBorrowLimit(MaxBorrowLimitExceededException ex) {
        Map<String, Object> response = new HashMap<>();
        response.put("message", "Không thể mượn sách");
        response.put("data", Map.of("reason", ex.getMessage()));
        return new ResponseEntity<>(response, HttpStatus.BAD_REQUEST); // 400 thay vì 500
    }


    @ExceptionHandler(ResponseStatusException.class)
    public ResponseEntity<Map<String, Object>> handleResponseStatusException(ResponseStatusException ex) {
        return ResponseEntity.status(ex.getStatusCode()).body(Map.of(
            "message", ex.getReason()
     
        ));
    }

    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<Map<String, Object>> handleBadRequest(IllegalArgumentException ex) {
        return ResponseEntity.badRequest().body(Map.of(
            "message", ex.getMessage()

        ));
    }

    @ExceptionHandler(NoSuchElementException.class)
    public ResponseEntity<Map<String, Object>> handleNotFound(NoSuchElementException ex) {
        return ResponseEntity.status(404).body(Map.of(
            "message", ex.getMessage()
        ));
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<Map<String, Object>> handleServerError(Exception ex) {
        return ResponseEntity.internalServerError().body(Map.of(
            "message", "Lỗi hệ thống",
            "data", Map.of("reason", ex.getMessage())
        ));
    }
}