package com.chat.model.dto;

import java.time.Instant;

public record PresenceDto(
    String userId,
    String username,
    String status, // "ONLINE", "OFFLINE"
    Instant lastSeen
) {}
