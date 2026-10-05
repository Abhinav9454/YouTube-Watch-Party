package com.watchparty.dto;

import com.watchparty.model.Participant;
import com.watchparty.model.PlayState;
import com.watchparty.model.QueueItem;

import java.util.Collection;
import java.util.List;

public class RoomResponse {
    private String roomId;
    private String name;
    private String videoId;
    private PlayState playState;
    private double currentTime;
    private double playbackSpeed = 1.0;
    private boolean hasPasscode = false;
    private String hostId;
    private Collection<Participant> participants;
    private List<QueueItem> playlist;

    public RoomResponse() {
    }

    public RoomResponse(String roomId, String name, String videoId, PlayState playState, double currentTime, double playbackSpeed, boolean hasPasscode, String hostId, Collection<Participant> participants, List<QueueItem> playlist) {
        this.roomId = roomId;
        this.name = name;
        this.videoId = videoId;
        this.playState = playState;
        this.currentTime = currentTime;
        this.playbackSpeed = playbackSpeed;
        this.hasPasscode = hasPasscode;
        this.hostId = hostId;
        this.participants = participants;
        this.playlist = playlist;
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

    public String getVideoId() {
        return videoId;
    }

    public void setVideoId(String videoId) {
        this.videoId = videoId;
    }

    public PlayState getPlayState() {
        return playState;
    }

    public void setPlayState(PlayState playState) {
        this.playState = playState;
    }

    public double getCurrentTime() {
        return currentTime;
    }

    public void setCurrentTime(double currentTime) {
        this.currentTime = currentTime;
    }

    public String getHostId() {
        return hostId;
    }

    public void setHostId(String hostId) {
        this.hostId = hostId;
    }

    public Collection<Participant> getParticipants() {
        return participants;
    }

    public void setParticipants(Collection<Participant> participants) {
        this.participants = participants;
    }

    public double getPlaybackSpeed() {
        return playbackSpeed;
    }

    public void setPlaybackSpeed(double playbackSpeed) {
        this.playbackSpeed = playbackSpeed;
    }

    public boolean isHasPasscode() {
        return hasPasscode;
    }

    public void setHasPasscode(boolean hasPasscode) {
        this.hasPasscode = hasPasscode;
    }

    public List<QueueItem> getPlaylist() {
        return playlist;
    }

    public void setPlaylist(List<QueueItem> playlist) {
        this.playlist = playlist;
    }
}
