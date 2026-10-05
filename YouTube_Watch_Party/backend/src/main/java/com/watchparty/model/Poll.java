package com.watchparty.model;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import java.util.concurrent.CopyOnWriteArrayList;

public class Poll {
    private String id;
    private String question;
    private List<PollOption> options = new CopyOnWriteArrayList<>();
    private String creatorId;
    private String creatorName;
    private boolean active;
    private long createdAt;

    public Poll() {
        this.id = UUID.randomUUID().toString();
        this.createdAt = System.currentTimeMillis();
        this.active = true;
    }

    public Poll(String question, List<String> optionTexts, String creatorId, String creatorName) {
        this.id = UUID.randomUUID().toString();
        this.question = question;
        this.creatorId = creatorId;
        this.creatorName = creatorName;
        this.active = true;
        this.createdAt = System.currentTimeMillis();

        if (optionTexts != null) {
            for (int i = 0; i < optionTexts.size(); i++) {
                this.options.add(new PollOption(i, optionTexts.get(i)));
            }
        }
    }

    public synchronized boolean vote(String userId, int optionIndex) {
        if (!active || optionIndex < 0 || optionIndex >= options.size()) {
            return false;
        }

        // Remove any previous vote from this user across all options
        for (PollOption opt : options) {
            opt.removeVote(userId);
        }

        // Add vote to the selected option
        return options.get(optionIndex).addVote(userId);
    }

    public int getTotalVotes() {
        int total = 0;
        for (PollOption opt : options) {
            total += opt.getVoteCount();
        }
        return total;
    }

    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public String getQuestion() {
        return question;
    }

    public void setQuestion(String question) {
        this.question = question;
    }

    public List<PollOption> getOptions() {
        return options;
    }

    public void setOptions(List<PollOption> options) {
        this.options = options;
    }

    public String getCreatorId() {
        return creatorId;
    }

    public void setCreatorId(String creatorId) {
        this.creatorId = creatorId;
    }

    public String getCreatorName() {
        return creatorName;
    }

    public void setCreatorName(String creatorName) {
        this.creatorName = creatorName;
    }

    public boolean isActive() {
        return active;
    }

    public void setActive(boolean active) {
        this.active = active;
    }

    public long getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(long createdAt) {
        this.createdAt = createdAt;
    }
}
