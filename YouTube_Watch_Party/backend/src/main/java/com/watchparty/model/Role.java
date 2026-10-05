package com.watchparty.model;

public enum Role {
    HOST,
    MODERATOR,
    PARTICIPANT;

    public boolean canControlPlayback() {
        return this == HOST || this == MODERATOR;
    }

    public boolean canManageRoom() {
        return this == HOST;
    }
}
