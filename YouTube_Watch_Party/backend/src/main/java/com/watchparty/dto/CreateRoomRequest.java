package com.watchparty.dto;

public class CreateRoomRequest {
    private String name;
    private String creatorUsername;
    private String initialVideoId;
    private String passcode;

    public CreateRoomRequest() {
    }

    public CreateRoomRequest(String name, String creatorUsername, String initialVideoId, String passcode) {
        this.name = name;
        this.creatorUsername = creatorUsername;
        this.initialVideoId = initialVideoId;
        this.passcode = passcode;
    }

    public String getPasscode() {
        return passcode;
    }

    public void setPasscode(String passcode) {
        this.passcode = passcode;
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

    public String getInitialVideoId() {
        return initialVideoId;
    }

    public void setInitialVideoId(String initialVideoId) {
        this.initialVideoId = initialVideoId;
    }
}
