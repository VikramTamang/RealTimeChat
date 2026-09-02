package com.chat.model.dto;

public record AuthResponse(
    String token,
    String tokenType,
    long expiresIn,
    UserDto user
) {
    public AuthResponse(String token, long expiresIn, UserDto user) {
        this(token, "Bearer", expiresIn, user);
    }
}
