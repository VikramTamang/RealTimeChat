package com.chat.model.dto;

import java.time.Instant;
import java.util.List;

public record RoomDto(
    String id,
    String name,
    String description,
    boolean isGroup,
    String createdBy,
    Instant createdAt,
    long memberCount,
    ChatMessageDto lastMessage,
    List<UserDto> members
) {}
