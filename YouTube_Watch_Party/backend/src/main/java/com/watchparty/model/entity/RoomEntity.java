package com.watchparty.model.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.time.Instant;

@Entity
@Table(name = "rooms")
public class RoomEntity {

    @Id
    @Column(name = "_id", length = 64, nullable = false)
    private String roomId;

    @Column(name = "name", nullable = false)
    private String name;

    @Column(name = "creator_username")
    private String creatorUsername;

    @Column(name = "current_video_id", length = 64)
    private String currentVideoId;

    @Column(name = "play_state", length = 32)
    private String playState;

    @Column(name = "current_time_sec")
    private double currentTime;

    @Column(name = "playback_speed")
    private double playbackSpeed = 1.0;

    @Column(name = "passcode", length = 64)
    private String passcode;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt;

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    public RoomEntity() {
    }

    public RoomEntity(String roomId, String name, String creatorUsername, String currentVideoId) {
        this.roomId = roomId;
        this.name = name;
        this.creatorUsername = creatorUsername;
        this.currentVideoId = currentVideoId;
        this.playState = "PAUSED";
        this.currentTime = 0.0;
        this.createdAt = Instant.now();
        this.updatedAt = Instant.now();
    }

    public String getRoomId() {
        return roomId;
    }

    public void setRoomId(String roomId) {
        this.roomId = roomId;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getCreatorUsername() {
        return creatorUsername;
    }

    public void setCreatorUsername(String creatorUsername) {
        this.creatorUsername = creatorUsername;
    }

    public String getCurrentVideoId() {
        return currentVideoId;
    }

    public void setCurrentVideoId(String currentVideoId) {
        this.currentVideoId = currentVideoId;
    }

    public String getPlayState() {
        return playState;
    }

    public void setPlayState(String playState) {
        this.playState = playState;
    }

    public double getCurrentTime() {
        return currentTime;
    }

    public void setCurrentTime(double currentTime) {
        this.currentTime = currentTime;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(Instant createdAt) {
        this.createdAt = createdAt;
    }

    public double getPlaybackSpeed() {
        return playbackSpeed;
    }

    public void setPlaybackSpeed(double playbackSpeed) {
        this.playbackSpeed = playbackSpeed;
    }

    public String getPasscode() {
        return passcode;
    }

    public void setPasscode(String passcode) {
        this.passcode = passcode;
    }

    public Instant getUpdatedAt() {
        return updatedAt;
    }

    public void setUpdatedAt(Instant updatedAt) {
        this.updatedAt = updatedAt;
    }
}
