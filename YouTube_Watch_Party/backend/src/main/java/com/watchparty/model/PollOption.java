package com.watchparty.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;

public class PollOption {
    private int index;
    private String text;
    @JsonIgnore
    private final Set<String> voterUserIds = ConcurrentHashMap.newKeySet();

    public PollOption() {
    }

    public PollOption(int index, String text) {
        this.index = index;
        this.text = text;
    }

    public int getIndex() {
        return index;
    }

    public void setIndex(int index) {
        this.index = index;
    }

    public String getText() {
        return text;
    }

    public void setText(String text) {
        this.text = text;
    }

    public int getVoteCount() {
        return voterUserIds.size();
    }

    public boolean addVote(String userId) {
        return voterUserIds.add(userId);
    }

    public boolean removeVote(String userId) {
        return voterUserIds.remove(userId);
    }

    public boolean hasVoted(String userId) {
        return voterUserIds.contains(userId);
    }

    public Set<String> getVoterUserIds() {
        return voterUserIds;
    }
}
