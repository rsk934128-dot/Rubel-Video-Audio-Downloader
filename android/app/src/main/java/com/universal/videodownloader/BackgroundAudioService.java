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
import android.os.Build;
import android.os.IBinder;
import android.os.PowerManager;
import androidx.annotation.Nullable;
import androidx.core.app.NotificationCompat;

import java.io.InputStream;
import java.net.HttpURLConnection;
import java.net.URL;

public class BackgroundAudioService extends Service {
    public static final String CHANNEL_ID = "background_audio_playback_channel";
    public static final int NOTIFICATION_ID = 8801;

    public static final String ACTION_START = "com.universal.videodownloader.action.START_AUDIO_FOREGROUND";
    public static final String ACTION_UPDATE = "com.universal.videodownloader.action.UPDATE_AUDIO_FOREGROUND";
    public static final String ACTION_STOP = "com.universal.videodownloader.action.STOP_AUDIO_FOREGROUND";

    public static final String ACTION_PLAY = "com.universal.videodownloader.action.PLAY";
    public static final String ACTION_PAUSE = "com.universal.videodownloader.action.PAUSE";
    public static final String ACTION_NEXT = "com.universal.videodownloader.action.NEXT";
    public static final String ACTION_PREV = "com.universal.videodownloader.action.PREV";
    public static final String BROADCAST_ACTION = "com.universal.videodownloader.BROADCAST_AUDIO_ACTION";

    private PowerManager.WakeLock wakeLock;
    private String currentTitle = "গানের প্লেয়ার";
    private String currentArtist = "Universal Downloader Pro";
    private String currentArtworkUrl = null;
    private boolean isPlaying = true;
    private Bitmap cachedArtwork = null;

    @Override
    public void onCreate() {
        super.onCreate();
        createNotificationChannel();
        acquireWakeLock();
    }

    private void acquireWakeLock() {
        if (wakeLock == null) {
            PowerManager powerManager = (PowerManager) getSystemService(Context.POWER_SERVICE);
            if (powerManager != null) {
                wakeLock = powerManager.newWakeLock(
                    PowerManager.PARTIAL_WAKE_LOCK,
                    "UniversalDownloader:BackgroundAudioWakeLock"
                );
                wakeLock.setReferenceCounted(false);
                wakeLock.acquire(4 * 60 * 60 * 1000L); // Max 4 hours safety timeout
            }
        }
    }

    private void releaseWakeLock() {
        if (wakeLock != null && wakeLock.isHeld()) {
            try {
                wakeLock.release();
            } catch (Exception ignored) {}
            wakeLock = null;
        }
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

        // Action from Notification buttons: dispatch broadcast back to Capacitor Plugin
        if (ACTION_PLAY.equals(action) || ACTION_PAUSE.equals(action) || 
            ACTION_NEXT.equals(action) || ACTION_PREV.equals(action)) {
            broadcastAction(action);
            if (ACTION_PLAY.equals(action)) isPlaying = true;
            if (ACTION_PAUSE.equals(action)) isPlaying = false;
            updateNotification();
            return START_STICKY;
        }

        if (ACTION_START.equals(action) || ACTION_UPDATE.equals(action)) {
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
            if (intent.hasExtra("isPlaying")) {
                isPlaying = intent.getBooleanExtra("isPlaying", true);
            }

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
            PendingIntent.FLAG_UPDATE_CURRENT | (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M ? PendingIntent.FLAG_IMMUTABLE : 0)
        );

        // Action Intents
        PendingIntent prevIntent = getServiceActionIntent(ACTION_PREV, 1);
        PendingIntent playPauseIntent = getServiceActionIntent(isPlaying ? ACTION_PAUSE : ACTION_PLAY, 2);
        PendingIntent nextIntent = getServiceActionIntent(ACTION_NEXT, 3);
        PendingIntent stopIntent = getServiceActionIntent(ACTION_STOP, 4);

        int playPauseIcon = isPlaying ? android.R.drawable.ic_media_pause : android.R.drawable.ic_media_play;
        String playPauseTitle = isPlaying ? "থামান (Pause)" : "চালান (Play)";

        NotificationCompat.Builder builder = new NotificationCompat.Builder(this, CHANNEL_ID)
            .setSmallIcon(android.R.drawable.ic_media_play)
            .setContentTitle(currentTitle)
            .setContentText(currentArtist + " • ব্যাকগ্রাউন্ডে চলছে")
            .setSubText("অডিও প্লেয়ার")
            .setContentIntent(contentPendingIntent)
            .setOngoing(isPlaying)
            .setAutoCancel(false)
            .setOnlyAlertOnce(true)
            .setPriority(NotificationCompat.PRIORITY_LOW)
            .setVisibility(NotificationCompat.VISIBILITY_PUBLIC)
            // Actions
            .addAction(android.R.drawable.ic_media_previous, "আগের গান", prevIntent)
            .addAction(playPauseIcon, playPauseTitle, playPauseIntent)
            .addAction(android.R.drawable.ic_media_next, "পরের গান", nextIntent);

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
            PendingIntent.FLAG_UPDATE_CURRENT | (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M ? PendingIntent.FLAG_IMMUTABLE : 0)
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
                updateNotification();
            } catch (Exception ignored) {
                cachedArtwork = null;
            }
        }).start();
    }

    private void stopForegroundService() {
        releaseWakeLock();
        stopForeground(true);
        stopSelf();
    }

    @Override
    public void onDestroy() {
        releaseWakeLock();
        super.onDestroy();
    }

    @Nullable
    @Override
    public IBinder onBind(Intent intent) {
        return null;
    }
}
