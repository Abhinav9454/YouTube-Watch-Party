package com.watchparty.dto;

import java.time.Instant;

public class AuthResponse {
    private String token;
    private String id;
    private String username;
    private String email;
    private String avatar;
    private Instant createdAt;

    public AuthResponse() {
    }

    public AuthResponse(String token, String id, String username, String email, String avatar, Instant createdAt) {
        this.token = token;
        this.id = id;
        this.username = username;
        this.email = email;
        this.avatar = avatar;
        this.createdAt = createdAt;
    }

    public String getToken() {
        return token;
    }

    public void setToken(String token) {
        this.token = token;
    }

    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public String getUsername() {
        return username;
    }

    public void setUsername(String username) {
        this.username = username;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public String getAvatar() {
        return avatar;
    }

    public void setAvatar(String avatar) {
        this.avatar = avatar;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(Instant createdAt) {
        this.createdAt = createdAt;
    }
}
