package com.universal.videodownloader;

import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.app.Service;
import android.content.Context;
import android.content.Intent;
import android.content.pm.ServiceInfo;
import android.graphics.Bitmap;
import android.graphics.BitmapFactory;
import android.media.AudioAttributes;
import android.media.AudioFocusRequest;
import android.media.AudioManager;
import android.media.MediaMetadata;
import android.media.MediaPlayer;
import android.media.session.MediaSession;
import android.media.session.PlaybackState;
import android.net.wifi.WifiManager;
import android.os.Build;
import android.os.Handler;
import android.os.IBinder;
import android.os.Looper;
import android.os.PowerManager;
import androidx.annotation.NonNull;
import androidx.annotation.Nullable;

import org.json.JSONArray;
import org.json.JSONObject;

import java.io.InputStream;
import java.net.HttpURLConnection;
import java.net.URL;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

public class BackgroundAudioService extends Service {
    public static final String CHANNEL_ID = "background_audio_playback_channel";
    public static final int NOTIFICATION_ID = 8801;

    public static volatile boolean isServiceRunning = false;

    public static final String ACTION_START = "com.universal.videodownloader.action.START_AUDIO_FOREGROUND";
    public static final String ACTION_UPDATE = "com.universal.videodownloader.action.UPDATE_AUDIO_FOREGROUND";
    public static final String ACTION_SET_PLAYLIST = "com.universal.videodownloader.action.SET_PLAYLIST";
    public static final String ACTION_SEEK = "com.universal.videodownloader.action.SEEK";
    public static final String ACTION_STOP = "com.universal.videodownloader.action.STOP_AUDIO_FOREGROUND";

    public static final String ACTION_PLAY = "com.universal.videodownloader.action.PLAY";
    public static final String ACTION_PAUSE = "com.universal.videodownloader.action.PAUSE";
    public static final String ACTION_NEXT = "com.universal.videodownloader.action.NEXT";
    public static final String ACTION_PREV = "com.universal.videodownloader.action.PREV";
    public static final String ACTION_TRACK_CHANGED = "com.universal.videodownloader.action.TRACK_CHANGED";
    public static final String ACTION_PROGRESS = "com.universal.videodownloader.action.PROGRESS";
    public static final String ACTION_PLAYBACK_STATE = "com.universal.videodownloader.action.PLAYBACK_STATE";
    public static final String ACTION_NATIVE_ERROR = "com.universal.videodownloader.action.NATIVE_ERROR";

    public static final String BROADCAST_ACTION = "com.universal.videodownloader.BROADCAST_AUDIO_ACTION";

    public static class TrackItem {
        public String id;
        public String title;
        public String artist;
        public String artworkUrl;
        public String streamUrl;
    }

    private PowerManager.WakeLock wakeLock;
    private WifiManager.WifiLock wifiLock;
    private AudioManager audioManager;
    private AudioFocusRequest audioFocusRequest;
    private MediaSession mediaSession;
    private MediaPlayer mediaPlayer;

    private final List<TrackItem> playlist = new ArrayList<>();
    private int currentIndex = -1;
    private boolean nativePlaybackActive = false;
    private boolean isMediaPrepared = false;
    private boolean isLooping = false;

    private String currentTrackId = "";
    private String currentTitle = "গানের প্লেয়ার";
    private String currentArtist = "Universal Downloader Pro";
    private String currentArtworkUrl = null;
    private String currentStreamUrl = null;
    private boolean isPlaying = true;
    private Bitmap cachedArtwork = null;

    private final Handler progressHandler = new Handler(Looper.getMainLooper());
    private final Runnable progressRunnable = new Runnable() {
        @Override
        public void run() {
            if (nativePlaybackActive && mediaPlayer != null && isMediaPrepared && isPlaying) {
                try {
                    int posSec = mediaPlayer.getCurrentPosition() / 1000;
                    int durSec = Math.max(1, mediaPlayer.getDuration() / 1000);
                    broadcastProgress(posSec, durSec);
                } catch (Exception ignored) {}
            }
            if (isPlaying) {
                progressHandler.postDelayed(this, 1000);
            }
        }
    };

    private final AudioManager.OnAudioFocusChangeListener audioFocusChangeListener = focusChange -> {
        if (focusChange == AudioManager.AUDIOFOCUS_LOSS_TRANSIENT) {
            if (nativePlaybackActive && mediaPlayer != null && mediaPlayer.isPlaying()) {
                mediaPlayer.pause();
                isPlaying = false;
                updateMediaSessionState();
                updateNotification();
                broadcastPlaybackState(false);
            }
        } else if (focusChange == AudioManager.AUDIOFOCUS_LOSS) {
            if (nativePlaybackActive && mediaPlayer != null && mediaPlayer.isPlaying()) {
                mediaPlayer.pause();
                isPlaying = false;
                updateMediaSessionState();
                updateNotification();
                broadcastPlaybackState(false);
            }
        } else if (focusChange == AudioManager.AUDIOFOCUS_GAIN) {
            if (nativePlaybackActive && mediaPlayer != null && isMediaPrepared && !mediaPlayer.isPlaying()) {
                mediaPlayer.setVolume(1.0f, 1.0f);
                mediaPlayer.start();
                isPlaying = true;
                updateMediaSessionState();
                updateNotification();
                broadcastPlaybackState(true);
            }
        } else if (focusChange == AudioManager.AUDIOFOCUS_LOSS_TRANSIENT_CAN_DUCK) {
            if (nativePlaybackActive && mediaPlayer != null) {
                mediaPlayer.setVolume(0.25f, 0.25f);
            }
        }
    };

    @Override
    public void onCreate() {
        super.onCreate();
        isServiceRunning = true;
        audioManager = (AudioManager) getSystemService(Context.AUDIO_SERVICE);
        createNotificationChannel();
        acquireLocks();
        initMediaSession();
    }

    private void acquireLocks() {
        if (wakeLock == null) {
            PowerManager powerManager = (PowerManager) getSystemService(Context.POWER_SERVICE);
            if (powerManager != null) {
                wakeLock = powerManager.newWakeLock(
                    PowerManager.PARTIAL_WAKE_LOCK,
                    "UniversalDownloader:BackgroundAudioWakeLock"
                );
                wakeLock.setReferenceCounted(false);
                wakeLock.acquire(8 * 60 * 60 * 1000L);
            }
        }
        if (wifiLock == null) {
            try {
                WifiManager wm = (WifiManager) getApplicationContext().getSystemService(Context.WIFI_SERVICE);
                if (wm != null) {
                    int mode = Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q
                        ? WifiManager.WIFI_MODE_FULL_LOW_LATENCY
                        : WifiManager.WIFI_MODE_FULL_HIGH_PERF;
                    wifiLock = wm.createWifiLock(mode, "UniversalDownloader:AudioWifiLock");
                    wifiLock.setReferenceCounted(false);
                    wifiLock.acquire();
                }
            } catch (Exception ignored) {}
        }
    }

    private void releaseLocks() {
        if (wakeLock != null && wakeLock.isHeld()) {
            try { wakeLock.release(); } catch (Exception ignored) {}
            wakeLock = null;
        }
        if (wifiLock != null && wifiLock.isHeld()) {
            try { wifiLock.release(); } catch (Exception ignored) {}
            wifiLock = null;
        }
    }

    private void requestAudioFocus() {
        if (audioManager == null) return;
        try {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                AudioAttributes attrs = new AudioAttributes.Builder()
                    .setUsage(AudioAttributes.USAGE_MEDIA)
                    .setContentType(AudioAttributes.CONTENT_TYPE_MUSIC)
                    .build();
                audioFocusRequest = new AudioFocusRequest.Builder(AudioManager.AUDIOFOCUS_GAIN)
                    .setAudioAttributes(attrs)
                    .setOnAudioFocusChangeListener(audioFocusChangeListener)
                    .setAcceptsDelayedFocusGain(true)
                    .build();
                audioManager.requestAudioFocus(audioFocusRequest);
            } else {
                audioManager.requestAudioFocus(
                    audioFocusChangeListener,
                    AudioManager.STREAM_MUSIC,
                    AudioManager.AUDIOFOCUS_GAIN
                );
            }
        } catch (Exception ignored) {}
    }

    private void abandonAudioFocus() {
        if (audioManager == null) return;
        try {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O && audioFocusRequest != null) {
                audioManager.abandonAudioFocusRequest(audioFocusRequest);
            } else {
                audioManager.abandonAudioFocus(audioFocusChangeListener);
            }
        } catch (Exception ignored) {}
    }

    private void initMediaSession() {
        mediaSession = new MediaSession(this, "UniversalDownloaderAudioSession");
        mediaSession.setCallback(new MediaSession.Callback() {
            @Override
            public void onPlay() {
                handlePlayCommand();
            }

            @Override
            public void onPause() {
                handlePauseCommand();
            }

            @Override
            public void onSkipToNext() {
                handleNextCommand();
            }

            @Override
            public void onSkipToPrevious() {
                handlePrevCommand();
            }

            @Override
            public void onSeekTo(long posMs) {
                if (nativePlaybackActive && mediaPlayer != null && isMediaPrepared) {
                    try {
                        mediaPlayer.seekTo((int) posMs);
                        updateMediaSessionState();
                    } catch (Exception ignored) {}
                }
            }

            @Override
            public void onStop() {
                stopForegroundService();
            }
        });
        mediaSession.setActive(true);
        updateMediaSessionState();
    }

    private void updateMediaSessionMetadata() {
        if (mediaSession == null) return;
        try {
            MediaMetadata.Builder builder = new MediaMetadata.Builder()
                .putString(MediaMetadata.METADATA_KEY_TITLE, currentTitle)
                .putString(MediaMetadata.METADATA_KEY_ARTIST, currentArtist)
                .putString(MediaMetadata.METADATA_KEY_ALBUM, "Universal Downloader Pro");

            if (nativePlaybackActive && mediaPlayer != null && isMediaPrepared) {
                long dur = mediaPlayer.getDuration();
                if (dur > 0) {
                    builder.putLong(MediaMetadata.METADATA_KEY_DURATION, dur);
                }
            }
            if (cachedArtwork != null) {
                builder.putBitmap(MediaMetadata.METADATA_KEY_ALBUM_ART, cachedArtwork);
            }
            mediaSession.setMetadata(builder.build());
        } catch (Exception ignored) {}
    }

    private void updateMediaSessionState() {
        if (mediaSession == null) return;
        try {
            long actions = PlaybackState.ACTION_PLAY
                | PlaybackState.ACTION_PAUSE
                | PlaybackState.ACTION_PLAY_PAUSE
                | PlaybackState.ACTION_SKIP_TO_NEXT
                | PlaybackState.ACTION_SKIP_TO_PREVIOUS
                | PlaybackState.ACTION_SEEK_TO
                | PlaybackState.ACTION_STOP;

            int state = isPlaying ? PlaybackState.STATE_PLAYING : PlaybackState.STATE_PAUSED;
            long position = 0;
            if (nativePlaybackActive && mediaPlayer != null && isMediaPrepared) {
                try {
                    position = mediaPlayer.getCurrentPosition();
                } catch (Exception ignored) {}
            }
            PlaybackState playbackState = new PlaybackState.Builder()
                .setActions(actions)
                .setState(state, position, isPlaying ? 1.0f : 0.0f)
                .build();
            mediaSession.setPlaybackState(playbackState);
        } catch (Exception ignored) {}
    }

    private boolean isPlayableRemoteStream(String url) {
        if (url == null) return false;
        String lower = url.toLowerCase().trim();
        return (lower.startsWith("http://") || lower.startsWith("https://"))
            && !lower.startsWith("https://localhost")
            && !lower.startsWith("http://localhost");
    }

    private void startNativeTrack(final String streamUrl) {
        if (!isPlayableRemoteStream(streamUrl)) {
            nativePlaybackActive = false;
            releaseMediaPlayer();
            return;
        }

        requestAudioFocus();
        nativePlaybackActive = true;
        isMediaPrepared = false;

        try {
            releaseMediaPlayer();
            mediaPlayer = new MediaPlayer();
            mediaPlayer.setAudioAttributes(new AudioAttributes.Builder()
                .setUsage(AudioAttributes.USAGE_MEDIA)
                .setContentType(AudioAttributes.CONTENT_TYPE_MUSIC)
                .build());
            mediaPlayer.setWakeMode(getApplicationContext(), PowerManager.PARTIAL_WAKE_LOCK);
            mediaPlayer.setLooping(isLooping);

            Map<String, String> headers = new HashMap<>();
            headers.put("User-Agent", "Mozilla/5.0 (Linux; Android 13) AppleWebKit/537.36");
            if (streamUrl.contains("etacloud.org")) {
                headers.put("Origin", "https://y2mate.gs");
                headers.put("Referer", "https://y2mate.gs/");
            }

            mediaPlayer.setDataSource(getApplicationContext(), android.net.Uri.parse(streamUrl), headers);
            mediaPlayer.setOnPreparedListener(mp -> {
                isMediaPrepared = true;
                if (isPlaying) {
                    mp.start();
                    progressHandler.removeCallbacks(progressRunnable);
                    progressHandler.post(progressRunnable);
                }
                updateMediaSessionMetadata();
                updateMediaSessionState();
                updateNotification();
                broadcastPlaybackState(isPlaying);
            });

            mediaPlayer.setOnCompletionListener(mp -> {
                if (isLooping) {
                    mp.seekTo(0);
                    mp.start();
                    return;
                }
                if (!playlist.isEmpty()) {
                    advancePlaylist(1);
                } else {
                    isPlaying = false;
                    updateMediaSessionState();
                    updateNotification();
                    broadcastAction(ACTION_NEXT);
                }
            });

            mediaPlayer.setOnErrorListener((mp, what, extra) -> {
                nativePlaybackActive = false;
                isMediaPrepared = false;
                releaseMediaPlayer();
                broadcastAction(ACTION_NATIVE_ERROR);
                return true;
            });

            mediaPlayer.prepareAsync();
        } catch (Exception e) {
            nativePlaybackActive = false;
            isMediaPrepared = false;
            releaseMediaPlayer();
            broadcastAction(ACTION_NATIVE_ERROR);
        }
    }

    private void releaseMediaPlayer() {
        progressHandler.removeCallbacks(progressRunnable);
        if (mediaPlayer != null) {
            try {
                if (mediaPlayer.isPlaying()) mediaPlayer.stop();
            } catch (Exception ignored) {}
            try {
                mediaPlayer.reset();
                mediaPlayer.release();
            } catch (Exception ignored) {}
            mediaPlayer = null;
        }
        isMediaPrepared = false;
    }

    private void advancePlaylist(int delta) {
        if (playlist.isEmpty()) {
            broadcastAction(delta > 0 ? ACTION_NEXT : ACTION_PREV);
            return;
        }
        int nextIdx = currentIndex + delta;
        if (nextIdx >= playlist.size()) nextIdx = 0;
        if (nextIdx < 0) nextIdx = playlist.size() - 1;
        currentIndex = nextIdx;

        TrackItem nextTrack = playlist.get(currentIndex);
        currentTrackId = nextTrack.id;
        currentTitle = nextTrack.title != null ? nextTrack.title : currentTitle;
        currentArtist = nextTrack.artist != null ? nextTrack.artist : currentArtist;
        currentStreamUrl = nextTrack.streamUrl;
        isPlaying = true;

        if (nextTrack.artworkUrl != null && !nextTrack.artworkUrl.equals(currentArtworkUrl)) {
            currentArtworkUrl = nextTrack.artworkUrl;
            loadArtworkAsync(currentArtworkUrl);
        }

        broadcastTrackChanged(nextTrack);
        updateMediaSessionMetadata();
        updateMediaSessionState();
        startOrUpdateForeground();

        if (isPlayableRemoteStream(nextTrack.streamUrl)) {
            startNativeTrack(nextTrack.streamUrl);
        }
    }

    private void handlePlayCommand() {
        isPlaying = true;
        if (nativePlaybackActive && mediaPlayer != null && isMediaPrepared) {
            requestAudioFocus();
            try {
                if (!mediaPlayer.isPlaying()) mediaPlayer.start();
                progressHandler.removeCallbacks(progressRunnable);
                progressHandler.post(progressRunnable);
            } catch (Exception ignored) {}
        }
        broadcastAction(ACTION_PLAY);
        broadcastPlaybackState(true);
        updateMediaSessionState();
        updateNotification();
    }

    private void handlePauseCommand() {
        isPlaying = false;
        if (nativePlaybackActive && mediaPlayer != null) {
            try {
                if (mediaPlayer.isPlaying()) mediaPlayer.pause();
            } catch (Exception ignored) {}
        }
        progressHandler.removeCallbacks(progressRunnable);
        broadcastAction(ACTION_PAUSE);
        broadcastPlaybackState(false);
        updateMediaSessionState();
        updateNotification();
    }

    private void handleNextCommand() {
        if (nativePlaybackActive && !playlist.isEmpty()) {
            advancePlaylist(1);
        } else {
            broadcastAction(ACTION_NEXT);
        }
    }

    private void handlePrevCommand() {
        if (nativePlaybackActive && !playlist.isEmpty()) {
            advancePlaylist(-1);
        } else {
            broadcastAction(ACTION_PREV);
        }
    }

    private void parsePlaylistJson(String jsonStr, String activeTrackId) {
        if (jsonStr == null || jsonStr.isEmpty()) return;
        try {
            JSONArray arr = new JSONArray(jsonStr);
            playlist.clear();
            currentIndex = -1;
            for (int i = 0; i < arr.length(); i++) {
                JSONObject obj = arr.getJSONObject(i);
                TrackItem item = new TrackItem();
                item.id = obj.optString("id", "");
                item.title = obj.optString("title", "Unknown Song");
                item.artist = obj.optString("artist", "Artist");
                item.artworkUrl = obj.optString("artworkUrl", null);
                item.streamUrl = obj.optString("streamUrl", null);
                playlist.add(item);
                if (activeTrackId != null && activeTrackId.equals(item.id)) {
                    currentIndex = i;
                }
            }
            if (currentIndex == -1 && !playlist.isEmpty()) {
                currentIndex = 0;
            }
        } catch (Exception ignored) {}
    }

    @Override
    public int onStartCommand(Intent intent, int flags, int startId) {
        if (intent == null) {
            return START_STICKY;
        }

        String action = intent.getAction();
        if (ACTION_STOP.equals(action)) {
            stopForegroundService();
            return START_NOT_STICKY;
        }

        if (ACTION_PLAY.equals(action)) {
            handlePlayCommand();
            return START_STICKY;
        }
        if (ACTION_PAUSE.equals(action)) {
            handlePauseCommand();
            return START_STICKY;
        }
        if (ACTION_NEXT.equals(action)) {
            handleNextCommand();
            return START_STICKY;
        }
        if (ACTION_PREV.equals(action)) {
            handlePrevCommand();
            return START_STICKY;
        }
        if (ACTION_SEEK.equals(action)) {
            int seekSec = intent.getIntExtra("seekSeconds", 0);
            if (nativePlaybackActive && mediaPlayer != null && isMediaPrepared) {
                try {
                    mediaPlayer.seekTo(Math.max(0, seekSec * 1000));
                    updateMediaSessionState();
                } catch (Exception ignored) {}
            }
            return START_STICKY;
        }
        if (ACTION_SET_PLAYLIST.equals(action)) {
            String playlistJson = intent.getStringExtra("playlistJson");
            String activeId = intent.getStringExtra("trackId");
            if (activeId != null) currentTrackId = activeId;
            parsePlaylistJson(playlistJson, currentTrackId);
            return START_STICKY;
        }

        if (ACTION_START.equals(action) || ACTION_UPDATE.equals(action)) {
            boolean trackChanged = false;
            if (intent.hasExtra("trackId")) {
                String newId = intent.getStringExtra("trackId");
                if (newId != null && !newId.equals(currentTrackId)) {
                    currentTrackId = newId;
                    trackChanged = true;
                }
            }
            if (intent.hasExtra("title")) {
                currentTitle = intent.getStringExtra("title");
            }
            if (intent.hasExtra("artist")) {
                currentArtist = intent.getStringExtra("artist");
            }
            if (intent.hasExtra("artworkUrl")) {
                String newArtwork = intent.getStringExtra("artworkUrl");
                if (newArtwork != null && !newArtwork.equals(currentArtworkUrl)) {
                    currentArtworkUrl = newArtwork;
                    loadArtworkAsync(currentArtworkUrl);
                }
            }
            if (intent.hasExtra("isLooping")) {
                isLooping = intent.getBooleanExtra("isLooping", false);
                if (mediaPlayer != null) {
                    try { mediaPlayer.setLooping(isLooping); } catch (Exception ignored) {}
                }
            }
            if (intent.hasExtra("playlistJson")) {
                parsePlaylistJson(intent.getStringExtra("playlistJson"), currentTrackId);
            }
            if (intent.hasExtra("isPlaying")) {
                isPlaying = intent.getBooleanExtra("isPlaying", true);
            }

            if (intent.hasExtra("streamUrl")) {
                String newStreamUrl = intent.getStringExtra("streamUrl");
                if (newStreamUrl != null && (!newStreamUrl.equals(currentStreamUrl) || trackChanged)) {
                    currentStreamUrl = newStreamUrl;
                    if (isPlayableRemoteStream(newStreamUrl)) {
                        startNativeTrack(newStreamUrl);
                    }
                }
            }

            if (ACTION_UPDATE.equals(action) && nativePlaybackActive && mediaPlayer != null && isMediaPrepared) {
                try {
                    if (isPlaying && !mediaPlayer.isPlaying()) {
                        requestAudioFocus();
                        mediaPlayer.start();
                        progressHandler.removeCallbacks(progressRunnable);
                        progressHandler.post(progressRunnable);
                    } else if (!isPlaying && mediaPlayer.isPlaying()) {
                        mediaPlayer.pause();
                        progressHandler.removeCallbacks(progressRunnable);
                    }
                } catch (Exception ignored) {}
            }

            updateMediaSessionMetadata();
            updateMediaSessionState();
            startOrUpdateForeground();
        }

        return START_STICKY;
    }

    private void broadcastAction(String action) {
        Intent broadcast = new Intent(BROADCAST_ACTION);
        broadcast.setPackage(getPackageName());
        broadcast.putExtra("action", action);
        sendBroadcast(broadcast);
    }

    private void broadcastPlaybackState(boolean playing) {
        Intent broadcast = new Intent(BROADCAST_ACTION);
        broadcast.setPackage(getPackageName());
        broadcast.putExtra("action", ACTION_PLAYBACK_STATE);
        broadcast.putExtra("isPlaying", playing);
        broadcast.putExtra("nativePlayback", nativePlaybackActive);
        sendBroadcast(broadcast);
    }

    private void broadcastProgress(int currentTimeSec, int durationSec) {
        Intent broadcast = new Intent(BROADCAST_ACTION);
        broadcast.setPackage(getPackageName());
        broadcast.putExtra("action", ACTION_PROGRESS);
        broadcast.putExtra("currentTime", currentTimeSec);
        broadcast.putExtra("duration", durationSec);
        sendBroadcast(broadcast);
    }

    private void broadcastTrackChanged(@NonNull TrackItem track) {
        Intent broadcast = new Intent(BROADCAST_ACTION);
        broadcast.setPackage(getPackageName());
        broadcast.putExtra("action", ACTION_TRACK_CHANGED);
        broadcast.putExtra("trackId", track.id);
        broadcast.putExtra("title", track.title);
        broadcast.putExtra("artist", track.artist);
        broadcast.putExtra("index", currentIndex);
        sendBroadcast(broadcast);
    }

    private void startOrUpdateForeground() {
        Notification notification = buildNotification();

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
            int foregroundType = ServiceInfo.FOREGROUND_SERVICE_TYPE_MEDIA_PLAYBACK;
            startForeground(NOTIFICATION_ID, notification, foregroundType);
        } else {
            startForeground(NOTIFICATION_ID, notification);
        }
    }

    private void updateNotification() {
        NotificationManager manager = (NotificationManager) getSystemService(Context.NOTIFICATION_SERVICE);
        if (manager != null) {
            manager.notify(NOTIFICATION_ID, buildNotification());
        }
    }

    private Notification buildNotification() {
        Intent openAppIntent = new Intent(this, MainActivity.class);
        openAppIntent.setFlags(Intent.FLAG_ACTIVITY_SINGLE_TOP | Intent.FLAG_ACTIVITY_CLEAR_TOP);
        PendingIntent contentPendingIntent = PendingIntent.getActivity(
            this,
            0,
            openAppIntent,
            PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE
        );

        PendingIntent prevIntent = getServiceActionIntent(ACTION_PREV, 1);
        PendingIntent playPauseIntent = getServiceActionIntent(isPlaying ? ACTION_PAUSE : ACTION_PLAY, 2);
        PendingIntent nextIntent = getServiceActionIntent(ACTION_NEXT, 3);

        int playPauseIcon = isPlaying ? android.R.drawable.ic_media_pause : android.R.drawable.ic_media_play;
        String playPauseTitle = isPlaying ? "থামান (Pause)" : "চালান (Play)";

        Notification.Builder builder = Build.VERSION.SDK_INT >= Build.VERSION_CODES.O
            ? new Notification.Builder(this, CHANNEL_ID)
            : new Notification.Builder(this);

        builder
            .setSmallIcon(android.R.drawable.ic_media_play)
            .setContentTitle(currentTitle)
            .setContentText(currentArtist + (isPlaying ? " • ব্যাকগ্রাউন্ডে চলছে" : " • বিরতি"))
            .setSubText("অডিও প্লেয়ার")
            .setContentIntent(contentPendingIntent)
            .setOngoing(isPlaying)
            .setAutoCancel(false)
            .setOnlyAlertOnce(true)
            .setVisibility(Notification.VISIBILITY_PUBLIC)
            .addAction(new Notification.Action.Builder(android.R.drawable.ic_media_previous, "আগের গান", prevIntent).build())
            .addAction(new Notification.Action.Builder(playPauseIcon, playPauseTitle, playPauseIntent).build())
            .addAction(new Notification.Action.Builder(android.R.drawable.ic_media_next, "পরের গান", nextIntent).build());

        if (mediaSession != null) {
            Notification.MediaStyle style = new Notification.MediaStyle()
                .setMediaSession(mediaSession.getSessionToken())
                .setShowActionsInCompactView(0, 1, 2);
            builder.setStyle(style);
        }

        if (cachedArtwork != null) {
            builder.setLargeIcon(cachedArtwork);
        }

        return builder.build();
    }

    private PendingIntent getServiceActionIntent(String action, int requestCode) {
        Intent intent = new Intent(this, BackgroundAudioService.class);
        intent.setAction(action);
        return PendingIntent.getService(
            this,
            requestCode,
            intent,
            PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE
        );
    }

    private void createNotificationChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            NotificationChannel channel = new NotificationChannel(
                CHANNEL_ID,
                "ব্যাকগ্রাউন্ড অডিও প্লেয়ার (Audio Playback)",
                NotificationManager.IMPORTANCE_LOW
            );
            channel.setDescription("অ্যাপ মিনিমাইজ বা স্ক্রিন লক থাকলেও গান নিরবচ্ছিন্নভাবে চালু রাখার জন্য ফোরগ্রাউন্ড সার্ভিস");
            channel.setSound(null, null);
            channel.setShowBadge(false);

            NotificationManager manager = (NotificationManager) getSystemService(Context.NOTIFICATION_SERVICE);
            if (manager != null) {
                manager.createNotificationChannel(channel);
            }
        }
    }

    private void loadArtworkAsync(final String urlStr) {
        new Thread(() -> {
            try {
                URL url = new URL(urlStr);
                HttpURLConnection connection = (HttpURLConnection) url.openConnection();
                connection.setDoInput(true);
                connection.setConnectTimeout(4000);
                connection.setReadTimeout(4000);
                connection.connect();
                InputStream input = connection.getInputStream();
                cachedArtwork = BitmapFactory.decodeStream(input);
                updateMediaSessionMetadata();
                updateNotification();
            } catch (Exception ignored) {
                cachedArtwork = null;
            }
        }).start();
    }

    private void stopForegroundService() {
        isServiceRunning = false;
        nativePlaybackActive = false;
        releaseMediaPlayer();
        abandonAudioFocus();
        if (mediaSession != null) {
            try {
                mediaSession.setActive(false);
                mediaSession.release();
            } catch (Exception ignored) {}
            mediaSession = null;
        }
        releaseLocks();
        stopForeground(true);
        stopSelf();
    }

    @Override
    public void onDestroy() {
        isServiceRunning = false;
        releaseMediaPlayer();
        abandonAudioFocus();
        if (mediaSession != null) {
            try {
                mediaSession.setActive(false);
                mediaSession.release();
            } catch (Exception ignored) {}
            mediaSession = null;
        }
        releaseLocks();
        super.onDestroy();
    }

    @Nullable
    @Override
    public IBinder onBind(Intent intent) {
        return null;
    }
}
