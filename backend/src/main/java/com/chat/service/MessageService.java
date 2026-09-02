package com.chat.service;

import com.chat.model.dto.ChatMessageDto;
import com.chat.model.dto.PageResponse;
import com.chat.model.entity.MessageEntity;
import com.chat.model.entity.UserEntity;
import com.chat.model.enums.MessageType;
import com.chat.repository.MessageRepository;
import com.chat.repository.RoomMemberRepository;
import com.chat.repository.RoomRepository;
import com.chat.repository.UserRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class MessageService {

    private final MessageRepository messageRepository;
    private final RoomMemberRepository roomMemberRepository;
    private final RoomRepository roomRepository;
    private final UserRepository userRepository;
    private final SimpMessagingTemplate messagingTemplate;
    private final RoomService roomService;

    public MessageService(
            MessageRepository messageRepository,
            RoomMemberRepository roomMemberRepository,
            RoomRepository roomRepository,
            UserRepository userRepository,
            SimpMessagingTemplate messagingTemplate,
            RoomService roomService) {
        this.messageRepository = messageRepository;
        this.roomMemberRepository = roomMemberRepository;
        this.roomRepository = roomRepository;
        this.userRepository = userRepository;
        this.messagingTemplate = messagingTemplate;
        this.roomService = roomService;
    }

    @Transactional
    public ChatMessageDto sendRoomMessage(String roomId, String senderId, String senderUsername, String content, MessageType type) {
        if (!roomMemberRepository.existsByRoomIdAndUserId(roomId, senderId)) {
            throw new AccessDeniedException("User is not a member of this room");
        }

        MessageEntity entity = new MessageEntity(
                roomId,
                senderId,
                senderUsername,
                content,
                type != null ? type : MessageType.TEXT
        );

        entity = messageRepository.save(entity);

        ChatMessageDto dto = toDto(entity, null, null);

        // Direct STOMP broadcast to all clients subscribed to /topic/room.{roomId}
        messagingTemplate.convertAndSend("/topic/room." + roomId, dto);

        return dto;
    }

    @Transactional
    public ChatMessageDto sendPrivateMessage(String senderId, String senderUsername, String recipientId, String recipientUsername, String content) {
        UserEntity sender = userRepository.findById(senderId)
                .orElseThrow(() -> new IllegalArgumentException("Sender not found"));
        UserEntity recipient = userRepository.findById(recipientId)
                .orElseThrow(() -> new IllegalArgumentException("Recipient not found"));

        // Ensure 1:1 room exists in MySQL
        var directRoom = roomService.getOrCreateDirectRoom(senderId, recipientId);

        MessageEntity entity = new MessageEntity(
                directRoom.id(),
                senderId,
                senderUsername,
                content,
                MessageType.TEXT
        );

        entity = messageRepository.save(entity);

        ChatMessageDto dto = toDto(entity, recipientId, recipient.getUsername());

        // Deliver to recipient's private user destination (/user/queue/private)
        messagingTemplate.convertAndSendToUser(recipient.getUsername(), "/queue/private", dto);
        // Also echo to sender's private user destination
        messagingTemplate.convertAndSendToUser(senderUsername, "/queue/private", dto);

        // Also broadcast to room topic if room is open
        messagingTemplate.convertAndSend("/topic/room." + directRoom.id(), dto);

        return dto;
    }

    @Transactional(readOnly = true)
    public PageResponse<ChatMessageDto> getRoomMessages(String roomId, String userId, int page, int size) {
        if (!roomMemberRepository.existsByRoomIdAndUserId(roomId, userId)) {
            throw new AccessDeniedException("You are not authorized to view messages in this room");
        }

        Pageable pageable = PageRequest.of(page, size);
        Page<MessageEntity> messagePage = messageRepository.findByRoomIdOrderByCreatedAtDesc(roomId, pageable);

        Page<ChatMessageDto> dtoPage = messagePage.map(m -> toDto(m, null, null));
        return PageResponse.fromPage(dtoPage);
    }

    public ChatMessageDto toDto(MessageEntity entity, String recipientId, String recipientUsername) {
        return new ChatMessageDto(
                entity.getId(),
                entity.getRoomId(),
                entity.getSenderId(),
                entity.getSenderUsername(),
                recipientId,
                recipientUsername,
                entity.getContent(),
                entity.getType(),
                entity.getCreatedAt()
        );
    }
}
