package com.chat.controller;

import com.chat.model.dto.ChatMessageDto;
import com.chat.model.dto.TypingEventDto;
import com.chat.security.StompPrincipal;
import com.chat.service.MessageService;
import com.chat.service.PresenceService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Controller;

import java.security.Principal;

@Controller
public class ChatWebSocketController {

    private static final Logger log = LoggerFactory.getLogger(ChatWebSocketController.class);

    private final MessageService messageService;
    private final PresenceService presenceService;
    private final SimpMessagingTemplate messagingTemplate;

    public ChatWebSocketController(
            MessageService messageService,
            PresenceService presenceService,
            SimpMessagingTemplate messagingTemplate) {
        this.messageService = messageService;
        this.presenceService = presenceService;
        this.messagingTemplate = messagingTemplate;
    }

    @MessageMapping("/chat.send")
    public void handleSendRoomMessage(@Payload ChatMessageDto message, Principal principal) {
        String senderId = resolveUserId(principal, message.senderId());
        String senderUsername = resolveUsername(principal, message.senderUsername());

        log.debug("Received room message for room {} from {}", message.roomId(), senderUsername);

        // Refresh presence on activity
        presenceService.heartbeat(senderId, senderUsername);

        // Save to MySQL and broadcast via STOMP broker
        messageService.sendRoomMessage(
                message.roomId(),
                senderId,
                senderUsername,
                message.content(),
                message.type()
        );
    }

    @MessageMapping("/chat.private")
    public void handleSendPrivateMessage(@Payload ChatMessageDto message, Principal principal) {
        String senderId = resolveUserId(principal, message.senderId());
        String senderUsername = resolveUsername(principal, message.senderUsername());

        log.debug("Received private message from {} to {}", senderUsername, message.recipientUsername());

        // Refresh presence on activity
        presenceService.heartbeat(senderId, senderUsername);

        // Save to MySQL and deliver to user queue
        messageService.sendPrivateMessage(
                senderId,
                senderUsername,
                message.recipientId(),
                message.recipientUsername(),
                message.content()
        );
    }

    @MessageMapping("/chat.typing")
    public void handleTypingEvent(@Payload TypingEventDto typingEvent, Principal principal) {
        String userId = resolveUserId(principal, typingEvent.userId());
        String username = resolveUsername(principal, typingEvent.username());

        TypingEventDto event = new TypingEventDto(
                typingEvent.roomId(),
                userId,
                username,
                typingEvent.isTyping()
        );

        // Refresh presence on typing
        presenceService.heartbeat(userId, username);

        // Broadcast ephemeral typing event to /topic/room.{roomId}.typing
        messagingTemplate.convertAndSend("/topic/room." + typingEvent.roomId() + ".typing", event);
    }

    @MessageMapping("/presence.heartbeat")
    public void handleHeartbeat(Principal principal) {
        if (principal instanceof StompPrincipal stompPrincipal) {
            presenceService.heartbeat(stompPrincipal.getUserId(), stompPrincipal.getName());
        }
    }

    private String resolveUserId(Principal principal, String fallback) {
        if (principal instanceof StompPrincipal stompPrincipal) {
            return stompPrincipal.getUserId();
        }
        return fallback;
    }

    private String resolveUsername(Principal principal, String fallback) {
        if (principal != null) {
            return principal.getName();
        }
        return fallback;
    }
}
