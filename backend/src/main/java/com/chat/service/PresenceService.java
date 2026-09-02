package com.chat.service;

import com.chat.model.dto.PresenceDto;
import com.chat.model.entity.UserEntity;
import com.chat.repository.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.time.Instant;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class PresenceService {

    private static final Logger log = LoggerFactory.getLogger(PresenceService.class);

    private final UserRepository userRepository;
    private final SimpMessagingTemplate messagingTemplate;
    private final long ttlSeconds;

    // In-memory quick cache of active timestamps for high performance
    private final Map<String, Instant> activeTimestamps = new ConcurrentHashMap<>();

    public PresenceService(
            UserRepository userRepository,
            SimpMessagingTemplate messagingTemplate,
            @Value("${chat.presence.ttl-seconds:30}") long ttlSeconds) {
        this.userRepository = userRepository;
        this.messagingTemplate = messagingTemplate;
        this.ttlSeconds = ttlSeconds;
    }

    @Transactional
    public void heartbeat(String userId, String username) {
        Instant now = Instant.now();
        Instant prev = activeTimestamps.put(userId, now);
        boolean isNew = (prev == null || Duration.between(prev, now).getSeconds() > ttlSeconds);

        userRepository.findById(userId).ifPresent(user -> {
            user.setOnline(true);
            user.setLastSeen(now);
            userRepository.save(user);
        });

        if (isNew) {
            log.info("User {} ({}) is ONLINE", username, userId);
            PresenceDto presence = new PresenceDto(userId, username, "ONLINE", now);
            messagingTemplate.convertAndSend("/topic/presence", presence);
        }
    }

    @Transactional(readOnly = true)
    public boolean isOnline(String userId) {
        Instant lastActive = activeTimestamps.get(userId);
        if (lastActive != null && Duration.between(lastActive, Instant.now()).getSeconds() <= ttlSeconds) {
            return true;
        }

        return userRepository.findById(userId)
                .map(u -> u.isOnline() && u.getLastSeen() != null &&
                        Duration.between(u.getLastSeen(), Instant.now()).getSeconds() <= ttlSeconds)
                .orElse(false);
    }

    @Transactional(readOnly = true)
    public PresenceDto getPresence(String userId, String username) {
        boolean online = isOnline(userId);
        return new PresenceDto(userId, username, online ? "ONLINE" : "OFFLINE", Instant.now());
    }

    @Transactional(readOnly = true)
    public Map<String, String> getBatchPresence(List<String> userIds) {
        Map<String, String> result = new HashMap<>();
        if (userIds == null || userIds.isEmpty()) {
            return result;
        }

        Instant now = Instant.now();
        for (String id : userIds) {
            Instant lastActive = activeTimestamps.get(id);
            if (lastActive != null && Duration.between(lastActive, now).getSeconds() <= ttlSeconds) {
                result.put(id, "ONLINE");
            } else {
                result.put(id, "OFFLINE");
            }
        }

        return result;
    }

    @Transactional
    public void markOffline(String userId, String username) {
        activeTimestamps.remove(userId);
        userRepository.findById(userId).ifPresent(user -> {
            user.setOnline(false);
            user.setLastSeen(Instant.now());
            userRepository.save(user);
        });

        log.info("User {} ({}) marked OFFLINE", username, userId);
        PresenceDto presence = new PresenceDto(userId, username, "OFFLINE", Instant.now());
        messagingTemplate.convertAndSend("/topic/presence", presence);
    }
}
