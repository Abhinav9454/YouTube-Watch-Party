package com.watchparty.model;

import java.util.UUID;

public class Bookmark {
    private String id;
    private double time; // in seconds
    private String formattedTime; // e.g. "02:45"
    private String title;
    private String createdBy;
    private long createdAt;

    public Bookmark() {
        this.id = UUID.randomUUID().toString();
        this.createdAt = System.currentTimeMillis();
    }

    public Bookmark(double time, String title, String createdBy) {
        this.id = UUID.randomUUID().toString();
        this.time = Math.max(0.0, time);
        this.title = (title != null && !title.trim().isEmpty()) ? title.trim() : "Saved Moment";
        this.createdBy = createdBy != null ? createdBy : "Guest";
        this.createdAt = System.currentTimeMillis();
        this.formattedTime = formatTime(this.time);
    }

    private static String formatTime(double seconds) {
        int totalSec = (int) Math.floor(seconds);
        int mins = totalSec / 60;
        int secs = totalSec % 60;
        int hours = mins / 60;
        if (hours > 0) {
            return String.format("%d:%02d:%02d", hours, mins % 60, secs);
        }
        return String.format("%02d:%02d", mins, secs);
    }

    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public double getTime() {
        return time;
    }

    public void setTime(double time) {
        this.time = time;
        this.formattedTime = formatTime(time);
    }

    public String getFormattedTime() {
        return formattedTime;
    }

    public void setFormattedTime(String formattedTime) {
        this.formattedTime = formattedTime;
    }

    public String getTitle() {
        return title;
    }

    public void setTitle(String title) {
        this.title = title;
    }

    public String getCreatedBy() {
        return createdBy;
    }

    public void setCreatedBy(String createdBy) {
        this.createdBy = createdBy;
    }

    public long getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(long createdAt) {
        this.createdAt = createdAt;
    }
}
