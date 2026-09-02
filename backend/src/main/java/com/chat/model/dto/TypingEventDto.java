package com.chat.model.dto;

public record TypingEventDto(
    String roomId,
    String userId,
    String username,
    boolean isTyping
) {}
