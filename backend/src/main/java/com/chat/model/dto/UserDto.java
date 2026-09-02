package com.chat.model.dto;

import java.time.Instant;

public record UserDto(
    String id,
    String username,
    String email,
    String avatarUrl,
    Instant createdAt
) {}
