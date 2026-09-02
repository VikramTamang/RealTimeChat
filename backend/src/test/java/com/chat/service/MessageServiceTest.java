package com.chat.service;

import com.chat.model.dto.ChatMessageDto;
import com.chat.model.dto.PageResponse;
import com.chat.model.dto.RoomDto;
import com.chat.model.entity.MessageEntity;
import com.chat.model.entity.UserEntity;
import com.chat.model.enums.MessageType;
import com.chat.repository.MessageRepository;
import com.chat.repository.RoomMemberRepository;
import com.chat.repository.RoomRepository;
import com.chat.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.security.access.AccessDeniedException;

import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class MessageServiceTest {

    @Mock
    private MessageRepository messageRepository;
    @Mock
    private RoomMemberRepository roomMemberRepository;
    @Mock
    private RoomRepository roomRepository;
    @Mock
    private UserRepository userRepository;
    @Mock
    private SimpMessagingTemplate messagingTemplate;
    @Mock
    private RoomService roomService;

    private MessageService messageService;

    @BeforeEach
    void setUp() {
        messageService = new MessageService(
                messageRepository,
                roomMemberRepository,
                roomRepository,
                userRepository,
                messagingTemplate,
                roomService
        );
    }

    @Test
    void shouldSaveAndBroadcastRoomMessage() {
        String roomId = "room-1";
        String senderId = "user-alice";
        String senderUsername = "alice";
        String content = "Hello MySQL chat!";

        when(roomMemberRepository.existsByRoomIdAndUserId(roomId, senderId)).thenReturn(true);

        MessageEntity savedEntity = new MessageEntity(roomId, senderId, senderUsername, content, MessageType.TEXT);
        savedEntity.setId("msg-1");
        when(messageRepository.save(any(MessageEntity.class))).thenReturn(savedEntity);

        ChatMessageDto result = messageService.sendRoomMessage(roomId, senderId, senderUsername, content, MessageType.TEXT);

        assertNotNull(result);
        assertEquals(content, result.content());
        assertEquals(senderUsername, result.senderUsername());

        verify(messageRepository).save(any(MessageEntity.class));
        verify(messagingTemplate).convertAndSend(eq("/topic/room." + roomId), any(ChatMessageDto.class));
    }

    @Test
    void shouldRejectMessageFromNonMember() {
        String roomId = "room-private";
        String senderId = "user-stranger";

        when(roomMemberRepository.existsByRoomIdAndUserId(roomId, senderId)).thenReturn(false);

        assertThrows(AccessDeniedException.class, () ->
                messageService.sendRoomMessage(roomId, senderId, "stranger", "hi", MessageType.TEXT));
    }

    @Test
    void shouldFetchPaginatedMessages() {
        String roomId = "room-1";
        String userId = "user-1";

        when(roomMemberRepository.existsByRoomIdAndUserId(roomId, userId)).thenReturn(true);

        MessageEntity msg1 = new MessageEntity(roomId, userId, "alice", "Msg 1", MessageType.TEXT);
        Page<MessageEntity> page = new PageImpl<>(List.of(msg1));
        when(messageRepository.findByRoomIdOrderByCreatedAtDesc(eq(roomId), any(Pageable.class))).thenReturn(page);

        PageResponse<ChatMessageDto> response = messageService.getRoomMessages(roomId, userId, 0, 10);
        assertNotNull(response);
        assertEquals(1, response.content().size());
        assertEquals("Msg 1", response.content().get(0).content());
    }
}
