package com.chat.security;

import org.springframework.http.server.ServerHttpRequest;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.WebSocketHandler;
import org.springframework.web.socket.server.support.DefaultHandshakeHandler;

import java.security.Principal;
import java.util.Map;

@Component
public class CustomHandshakeHandler extends DefaultHandshakeHandler {

    @Override
    protected Principal determineUser(ServerHttpRequest request, WebSocketHandler wsHandler, Map<String, Object> attributes) {
        Principal principal = (Principal) attributes.get("principal");
        if (principal != null) {
            return principal;
        }

        String username = (String) attributes.get("username");
        String userId = (String) attributes.get("userId");
        if (username != null) {
            return new StompPrincipal(username, userId != null ? userId : username);
        }

        return super.determineUser(request, wsHandler, attributes);
    }
}
