package com.chat.security;

import java.security.Principal;
import java.util.Objects;

public class StompPrincipal implements Principal {

    private final String name; // Holds username or userId for Spring UserDestinationResolver
    private final String userId;

    public StompPrincipal(String name, String userId) {
        this.name = name;
        this.userId = userId;
    }

    @Override
    public String getName() {
        return name;
    }

    public String getUserId() {
        return userId;
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (!(o instanceof StompPrincipal that)) return false;
        return Objects.equals(name, that.name) && Objects.equals(userId, that.userId);
    }

    @Override
    public int hashCode() {
        return Objects.hash(name, userId);
    }

    @Override
    public String toString() {
        return "StompPrincipal{" +
                "name='" + name + '\'' +
                ", userId='" + userId + '\'' +
                '}';
    }
}
