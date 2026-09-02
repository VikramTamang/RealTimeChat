package com.chat.security;

import com.chat.repository.RoomMemberRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.messaging.Message;
import org.springframework.messaging.MessageChannel;
import org.springframework.messaging.simp.stomp.StompCommand;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.messaging.support.ChannelInterceptor;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Component;

import java.security.Principal;
import java.util.Map;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Component
public class TopicSubscriptionInterceptor implements ChannelInterceptor {

    private static final Logger log = LoggerFactory.getLogger(TopicSubscriptionInterceptor.class);

    private static final Pattern ROOM_TOPIC_PATTERN = Pattern.compile("^/topic/room\\.([^/.]+)(?:\\.typing)?$");

    private final RoomMemberRepository roomMemberRepository;

    public TopicSubscriptionInterceptor(RoomMemberRepository roomMemberRepository) {
        this.roomMemberRepository = roomMemberRepository;
    }

    @Override
    public Message<?> preSend(Message<?> message, MessageChannel channel) {
        StompHeaderAccessor accessor = StompHeaderAccessor.wrap(message);

        if (StompCommand.SUBSCRIBE.equals(accessor.getCommand())) {
            String destination = accessor.getDestination();
            if (destination != null) {
                Matcher matcher = ROOM_TOPIC_PATTERN.matcher(destination);
                if (matcher.matches()) {
                    String roomId = matcher.group(1);
                    String userId = resolveUserId(accessor);

                    if (userId == null) {
                        log.warn("Subscription rejected: unauthenticated user attempting to subscribe to {}", destination);
                        throw new AccessDeniedException("Unauthenticated user cannot subscribe to " + destination);
                    }

                    boolean isMember = roomMemberRepository.existsByRoomIdAndUserId(roomId, userId);
                    if (!isMember) {
                        log.warn("Subscription rejected: User {} is not an authorized member of room {}", userId, roomId);
                        throw new AccessDeniedException("Access denied: You are not a member of room " + roomId);
                    }

                    log.info("Subscription approved: User {} subscribed to {}", userId, destination);
                }
            }
        }

        return message;
    }

    private String resolveUserId(StompHeaderAccessor accessor) {
        Principal userPrincipal = accessor.getUser();
        if (userPrincipal instanceof StompPrincipal stompPrincipal) {
            return stompPrincipal.getUserId();
        }

        Map<String, Object> sessionAttributes = accessor.getSessionAttributes();
        if (sessionAttributes != null && sessionAttributes.containsKey("userId")) {
            return (String) sessionAttributes.get("userId");
        }

        return null;
    }
}
