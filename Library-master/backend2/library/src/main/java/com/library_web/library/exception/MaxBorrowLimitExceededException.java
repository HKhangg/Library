package com.library_web.library.exception;

public class MaxBorrowLimitExceededException extends RuntimeException {
    public MaxBorrowLimitExceededException(String message) {
        super(message);
    }
}
