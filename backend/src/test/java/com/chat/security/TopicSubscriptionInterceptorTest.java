package com.chat.security;

import com.chat.repository.RoomMemberRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.messaging.Message;
import org.springframework.messaging.MessageChannel;
import org.springframework.messaging.simp.stomp.StompCommand;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.messaging.support.MessageBuilder;
import org.springframework.security.access.AccessDeniedException;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class TopicSubscriptionInterceptorTest {

    @Mock
    private RoomMemberRepository roomMemberRepository;

    @Mock
    private MessageChannel messageChannel;

    private TopicSubscriptionInterceptor interceptor;

    @BeforeEach
    void setUp() {
        interceptor = new TopicSubscriptionInterceptor(roomMemberRepository);
    }

    @Test
    void shouldAllowSubscriptionWhenUserIsMember() {
        String roomId = "room-123";
        String userId = "user-1";
        StompPrincipal principal = new StompPrincipal("alice", userId);

        when(roomMemberRepository.existsByRoomIdAndUserId(roomId, userId)).thenReturn(true);

        StompHeaderAccessor accessor = StompHeaderAccessor.create(StompCommand.SUBSCRIBE);
        accessor.setDestination("/topic/room." + roomId);
        accessor.setUser(principal);
        Message<?> message = MessageBuilder.createMessage(new byte[0], accessor.getMessageHeaders());

        Message<?> result = interceptor.preSend(message, messageChannel);
        assertNotNull(result);
        verify(roomMemberRepository).existsByRoomIdAndUserId(roomId, userId);
    }

    @Test
    void shouldRejectSubscriptionWhenUserIsNotMember() {
        String roomId = "room-secret";
        String userId = "user-attacker";
        StompPrincipal principal = new StompPrincipal("attacker", userId);

        when(roomMemberRepository.existsByRoomIdAndUserId(roomId, userId)).thenReturn(false);

        StompHeaderAccessor accessor = StompHeaderAccessor.create(StompCommand.SUBSCRIBE);
        accessor.setDestination("/topic/room." + roomId);
        accessor.setUser(principal);
        Message<?> message = MessageBuilder.createMessage(new byte[0], accessor.getMessageHeaders());

        assertThrows(AccessDeniedException.class, () -> interceptor.preSend(message, messageChannel));
    }
}
