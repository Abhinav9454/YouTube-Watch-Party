package com.watchparty.controller;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.net.URI;
import java.net.URLEncoder;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.util.*;

@RestController
@RequestMapping("/api/youtube")
@CrossOrigin(origins = "*")
public class YouTubeSearchController {

    private static final Logger log = LoggerFactory.getLogger(YouTubeSearchController.class);
    private final ObjectMapper objectMapper = new ObjectMapper();
    private final HttpClient httpClient = HttpClient.newBuilder()
            .connectTimeout(Duration.ofSeconds(6))
            .build();

    /**
     * Search YouTube videos via official YouTube Data API v3.
     * Uses YOUTUBE_API_KEY from environment or client-supplied apiKey param.
     */
    @GetMapping("/search")
    public ResponseEntity<Map<String, Object>> searchVideos(
            @RequestParam("q") String query,
            @RequestParam(value = "maxResults", defaultValue = "15") int maxResults,
            @RequestParam(value = "key", required = false) String clientKey
    ) {
        if (query == null || query.trim().isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of(
                    "success", false,
                    "error", "Search query 'q' cannot be empty",
                    "results", Collections.emptyList()
            ));
        }

        String apiKey = clientKey != null && !clientKey.trim().isEmpty()
                ? clientKey.trim()
                : System.getenv("YOUTUBE_API_KEY");

        if (apiKey == null || apiKey.trim().isEmpty()) {
            log.warn("YouTube search requested without API key: query='{}'", query);
            return ResponseEntity.ok(Map.of(
                    "success", false,
                    "hasApiKey", false,
                    "message", "No YouTube Data API v3 key configured. Provide an API key or paste video URL directly.",
                    "results", Collections.emptyList()
            ));
        }

        try {
            String encodedQuery = URLEncoder.encode(query.trim(), StandardCharsets.UTF_8);
            String url = String.format(
                    "https://www.googleapis.com/youtube/v3/search?part=snippet&maxResults=%d&type=video&q=%s&key=%s",
                    Math.min(Math.max(1, maxResults), 25),
                    encodedQuery,
                    apiKey.trim()
            );

            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create(url))
                    .timeout(Duration.ofSeconds(8))
                    .header("User-Agent", "SyncWave-WatchParty/1.0")
                    .GET()
                    .build();

            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());

            if (response.statusCode() != 200) {
                log.error("Google YouTube API returned error {}: {}", response.statusCode(), response.body());
                JsonNode errNode = objectMapper.readTree(response.body());
                String errMsg = errNode.has("error") && errNode.get("error").has("message")
                        ? errNode.get("error").get("message").asText()
                        : "YouTube API request failed (HTTP " + response.statusCode() + ")";

                return ResponseEntity.ok(Map.of(
                        "success", false,
                        "hasApiKey", true,
                        "error", errMsg,
                        "results", Collections.emptyList()
                ));
            }

            JsonNode root = objectMapper.readTree(response.body());
            JsonNode items = root.get("items");

            List<Map<String, Object>> results = new ArrayList<>();
            if (items != null && items.isArray()) {
                for (JsonNode item : items) {
                    JsonNode idNode = item.get("id");
                    JsonNode snippet = item.get("snippet");

                    if (idNode != null && idNode.has("videoId") && snippet != null) {
                        String videoId = idNode.get("videoId").asText();
                        String title = snippet.has("title") ? snippet.get("title").asText() : "Untitled";
                        String channel = snippet.has("channelTitle") ? snippet.get("channelTitle").asText() : "Unknown Channel";
                        String description = snippet.has("description") ? snippet.get("description").asText() : "";
                        String publishedAt = snippet.has("publishedAt") ? snippet.get("publishedAt").asText() : "";

                        String thumbnail = String.format("https://i.ytimg.com/vi/%s/mqdefault.jpg", videoId);
                        if (snippet.has("thumbnails") && snippet.get("thumbnails").has("medium")) {
                            thumbnail = snippet.get("thumbnails").get("medium").get("url").asText();
                        }

                        Map<String, Object> videoItem = new HashMap<>();
                        videoItem.put("id", videoId);
                        videoItem.put("title", title);
                        videoItem.put("channel", channel);
                        videoItem.put("thumbnail", thumbnail);
                        videoItem.put("description", description);
                        videoItem.put("publishedAt", publishedAt);
                        videoItem.put("category", "YouTube");

                        results.add(videoItem);
                    }
                }
            }

            return ResponseEntity.ok(Map.of(
                    "success", true,
                    "hasApiKey", true,
                    "query", query,
                    "results", results
            ));

        } catch (Exception e) {
            log.error("Failed to query YouTube API: {}", e.getMessage(), e);
            return ResponseEntity.internalServerError().body(Map.of(
                    "success", false,
                    "error", "Failed to contact YouTube API: " + e.getMessage(),
                    "results", Collections.emptyList()
            ));
        }
    }

    /**
     * Live search autocomplete suggestions via Google's public query suggest endpoint.
     * Requires ZERO API keys, free, instant, and unlimited.
     */
    @GetMapping("/suggest")
    public ResponseEntity<List<String>> getSuggestions(@RequestParam("q") String query) {
        if (query == null || query.trim().length() < 2) {
            return ResponseEntity.ok(Collections.emptyList());
        }

        try {
            String encoded = URLEncoder.encode(query.trim(), StandardCharsets.UTF_8);
            String url = "https://suggestqueries.google.com/complete/search?client=firefox&ds=yt&q=" + encoded;

            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create(url))
                    .timeout(Duration.ofSeconds(3))
                    .header("User-Agent", "Mozilla/5.0")
                    .GET()
                    .build();

            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());

            if (response.statusCode() == 200) {
                JsonNode root = objectMapper.readTree(response.body());
                if (root.isArray() && root.size() >= 2 && root.get(1).isArray()) {
                    List<String> suggestions = new ArrayList<>();
                    for (JsonNode item : root.get(1)) {
                        suggestions.add(item.asText());
                    }
                    return ResponseEntity.ok(suggestions);
                }
            }
        } catch (Exception e) {
            log.debug("Autocomplete suggestion error for '{}': {}", query, e.getMessage());
        }

        return ResponseEntity.ok(Collections.emptyList());
    }

    /**
     * Fetch all items in a YouTube playlist by playlistId or full playlist URL.
     */
    @GetMapping("/playlist")
    public ResponseEntity<Map<String, Object>> getPlaylistItems(
            @RequestParam("playlistId") String rawPlaylistInput,
            @RequestParam(value = "maxResults", defaultValue = "25") int maxResults,
            @RequestParam(value = "key", required = false) String clientKey
    ) {
        if (rawPlaylistInput == null || rawPlaylistInput.trim().isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of(
                    "success", false,
                    "error", "Playlist parameter cannot be empty",
                    "items", Collections.emptyList()
            ));
        }

        // Clean playlist ID if full URL is passed
        String playlistId = rawPlaylistInput.trim();
        if (playlistId.contains("list=")) {
            int idx = playlistId.indexOf("list=");
            playlistId = playlistId.substring(idx + 5);
            int amp = playlistId.indexOf("&");
            if (amp != -1) {
                playlistId = playlistId.substring(0, amp);
            }
        }

        String apiKey = clientKey != null && !clientKey.trim().isEmpty()
                ? clientKey.trim()
                : System.getenv("YOUTUBE_API_KEY");

        if (apiKey == null || apiKey.trim().isEmpty()) {
            return ResponseEntity.ok(Map.of(
                    "success", false,
                    "hasApiKey", false,
                    "playlistId", playlistId,
                    "message", "YOUTUBE_API_KEY not configured on server. Provide a YouTube API key in Settings to import playlists automatically.",
                    "items", Collections.emptyList()
            ));
        }

        try {
            String url = String.format(
                    "https://www.googleapis.com/youtube/v3/playlistItems?part=snippet&maxResults=%d&playlistId=%s&key=%s",
                    Math.min(Math.max(1, maxResults), 50),
                    URLEncoder.encode(playlistId, StandardCharsets.UTF_8),
                    apiKey.trim()
            );

            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create(url))
                    .timeout(Duration.ofSeconds(8))
                    .header("User-Agent", "SyncWave-WatchParty/1.0")
                    .GET()
                    .build();

            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());

            if (response.statusCode() != 200) {
                JsonNode errNode = objectMapper.readTree(response.body());
                String errMsg = errNode.has("error") && errNode.get("error").has("message")
                        ? errNode.get("error").get("message").asText()
                        : "YouTube playlist request failed (HTTP " + response.statusCode() + ")";
                return ResponseEntity.ok(Map.of(
                        "success", false,
                        "hasApiKey", true,
                        "playlistId", playlistId,
                        "error", errMsg,
                        "items", Collections.emptyList()
                ));
            }

            JsonNode root = objectMapper.readTree(response.body());
            JsonNode items = root.get("items");
            List<Map<String, Object>> results = new ArrayList<>();

            if (items != null && items.isArray()) {
                for (JsonNode item : items) {
                    JsonNode snippet = item.get("snippet");
                    if (snippet != null && snippet.has("resourceId")) {
                        JsonNode resId = snippet.get("resourceId");
                        if (resId.has("videoId")) {
                            String videoId = resId.get("videoId").asText();
                            String title = snippet.has("title") ? snippet.get("title").asText() : "Untitled Video";
                            String channel = snippet.has("channelTitle") ? snippet.get("channelTitle").asText() : "";
                            String thumbnail = String.format("https://i.ytimg.com/vi/%s/mqdefault.jpg", videoId);
                            if (snippet.has("thumbnails") && snippet.get("thumbnails").has("medium")) {
                                thumbnail = snippet.get("thumbnails").get("medium").get("url").asText();
                            }

                            Map<String, Object> entry = new HashMap<>();
                            entry.put("videoId", videoId);
                            entry.put("title", title);
                            entry.put("channel", channel);
                            entry.put("thumbnail", thumbnail);
                            results.add(entry);
                        }
                    }
                }
            }

            return ResponseEntity.ok(Map.of(
                    "success", true,
                    "hasApiKey", true,
                    "playlistId", playlistId,
                    "count", results.size(),
                    "items", results
            ));
        } catch (Exception e) {
            log.error("Failed to fetch playlist items for {}: {}", playlistId, e.getMessage(), e);
            return ResponseEntity.ok(Map.of(
                    "success", false,
                    "hasApiKey", true,
                    "error", "Exception fetching playlist: " + e.getMessage(),
                    "items", Collections.emptyList()
            ));
        }
    }
}
