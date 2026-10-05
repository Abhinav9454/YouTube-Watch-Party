package com.watchparty.model;

import java.time.Instant;
import java.util.UUID;

public class QueueItem {
    private String id;
    private String videoId;
    private String title;
    private String addedBy;
    private Instant addedAt;

    public QueueItem() {
        this.id = UUID.randomUUID().toString();
        this.addedAt = Instant.now();
    }

    public QueueItem(String videoId, String title, String addedBy) {
        this.id = UUID.randomUUID().toString();
        this.videoId = videoId;
        this.title = title != null && !title.trim().isEmpty() ? title.trim() : "Video (" + videoId + ")";
        this.addedBy = addedBy != null ? addedBy : "Anonymous";
        this.addedAt = Instant.now();
    }

    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public String getVideoId() {
        return videoId;
    }

    public void setVideoId(String videoId) {
        this.videoId = videoId;
    }

    public String getTitle() {
        return title;
    }

    public void setTitle(String title) {
        this.title = title;
    }

    public String getAddedBy() {
        return addedBy;
    }

    public void setAddedBy(String addedBy) {
        this.addedBy = addedBy;
    }

    public Instant getAddedAt() {
        return addedAt;
    }

    public void setAddedAt(Instant addedAt) {
        this.addedAt = addedAt;
    }
}
