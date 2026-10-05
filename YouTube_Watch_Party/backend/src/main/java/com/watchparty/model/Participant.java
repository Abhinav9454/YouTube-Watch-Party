package com.watchparty.model;

import java.time.Instant;
import java.util.Objects;

public class Participant {
    private String id;
    private String username;
    private Role role;
    private Instant joinedAt;
    private boolean handRaised = false;

    public Participant() {
        this.joinedAt = Instant.now();
    }

    public Participant(String id, String username, Role role) {
        this.id = id;
        this.username = username;
        this.role = role;
        this.joinedAt = Instant.now();
        this.handRaised = false;
    }

    public boolean isHandRaised() {
        return handRaised;
    }

    public void setHandRaised(boolean handRaised) {
        this.handRaised = handRaised;
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

    public Role getRole() {
        return role;
    }

    public void setRole(Role role) {
        this.role = role;
    }

    public Instant getJoinedAt() {
        return joinedAt;
    }

    public void setJoinedAt(Instant joinedAt) {
        this.joinedAt = joinedAt;
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;
        Participant that = (Participant) o;
        return Objects.equals(id, that.id);
    }

    @Override
    public int hashCode() {
        return Objects.hash(id);
    }
}
