package com.chat.model.dto;

import com.chat.model.enums.MessageType;
import java.time.Instant;

public record ChatMessageDto(
    String id,
    String roomId,
    String senderId,
    String senderUsername,
    String recipientId,
    String recipientUsername,
    String content,
    MessageType type,
    Instant createdAt
) {
    public ChatMessageDto {
        if (createdAt == null) {
            createdAt = Instant.now();
        }
        if (type == null) {
            type = MessageType.TEXT;
        }
    }
}
