package com.chat.security;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;

class JwtTokenProviderTest {

    private JwtTokenProvider jwtTokenProvider;
    private static final String TEST_SECRET = "dGhpcy1pcy1hLXZlcnktc2VjdXJlLWFuZC1sb25nLWp3dC1zZWNyZXQta2V5LWZvci1jaGF0LWFwcGxpY2F0aW9uLTIwMjY=";

    @BeforeEach
    void setUp() {
        jwtTokenProvider = new JwtTokenProvider(TEST_SECRET, 3600000);
    }

    @Test
    void shouldGenerateAndValidateToken() {
        String userId = "user-123";
        String username = "alice";
        String email = "alice@example.com";

        String token = jwtTokenProvider.generateToken(userId, username, email);
        assertNotNull(token);
        assertTrue(jwtTokenProvider.validateToken(token));

        assertEquals(userId, jwtTokenProvider.getUserIdFromToken(token));
        assertEquals(username, jwtTokenProvider.getUsernameFromToken(token));
    }

    @Test
    void shouldRejectInvalidToken() {
        assertFalse(jwtTokenProvider.validateToken("invalid.jwt.token"));
        assertFalse(jwtTokenProvider.validateToken(""));
        assertFalse(jwtTokenProvider.validateToken(null));
    }
}
