package com.chat.service;

import com.chat.model.dto.PresenceDto;
import com.chat.model.entity.UserEntity;
import com.chat.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.messaging.simp.SimpMessagingTemplate;

import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class PresenceServiceTest {

    @Mock
    private UserRepository userRepository;
    @Mock
    private SimpMessagingTemplate messagingTemplate;

    private PresenceService presenceService;

    @BeforeEach
    void setUp() {
        presenceService = new PresenceService(userRepository, messagingTemplate, 30);
    }

    @Test
    void shouldRefreshHeartbeatAndUpdateUser() {
        String userId = "user-alice";
        String username = "alice";

        UserEntity user = new UserEntity(username, "alice@test.com", "hash");
        user.setId(userId);
        when(userRepository.findById(userId)).thenReturn(Optional.of(user));

        presenceService.heartbeat(userId, username);

        assertTrue(user.isOnline());
        assertNotNull(user.getLastSeen());
        verify(userRepository).save(user);
        verify(messagingTemplate).convertAndSend(eq("/topic/presence"), any(PresenceDto.class));
    }

    @Test
    void shouldCheckOnlineStatus() {
        String userId = "user-bob";
        UserEntity user = new UserEntity("bob", "bob@test.com", "hash");
        user.setId(userId);
        user.setOnline(true);
        user.setLastSeen(Instant.now());

        when(userRepository.findById(userId)).thenReturn(Optional.of(user));

        assertTrue(presenceService.isOnline(userId));
    }

    @Test
    void shouldMarkOffline() {
        String userId = "user-carol";
        String username = "carol";

        UserEntity user = new UserEntity(username, "carol@test.com", "hash");
        user.setId(userId);
        user.setOnline(true);
        when(userRepository.findById(userId)).thenReturn(Optional.of(user));

        presenceService.markOffline(userId, username);

        assertFalse(user.isOnline());
        verify(userRepository).save(user);
        verify(messagingTemplate).convertAndSend(eq("/topic/presence"), any(PresenceDto.class));
    }
}
