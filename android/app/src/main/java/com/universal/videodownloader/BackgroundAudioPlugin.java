package com.universal.videodownloader;

import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.content.IntentFilter;
import android.os.Build;
import com.getcapacitor.JSArray;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

@CapacitorPlugin(name = "BackgroundAudio")
public class BackgroundAudioPlugin extends Plugin {
    private BroadcastReceiver actionReceiver;

    @Override
    public void load() {
        super.load();
        registerBroadcastReceiver();
    }

    private boolean isPlayableRemoteStream(String url) {
        if (url == null) return false;
        String lower = url.toLowerCase().trim();
        return (lower.startsWith("http://") || lower.startsWith("https://"))
            && !lower.startsWith("https://localhost")
            && !lower.startsWith("http://localhost");
    }

    private void registerBroadcastReceiver() {
        if (actionReceiver == null) {
            actionReceiver = new BroadcastReceiver() {
                @Override
                public void onReceive(Context context, Intent intent) {
                    if (intent == null || !intent.hasExtra("action")) return;
                    String action = intent.getStringExtra("action");

                    if (BackgroundAudioService.ACTION_TRACK_CHANGED.equals(action)) {
                        JSObject data = new JSObject();
                        data.put("trackId", intent.getStringExtra("trackId"));
                        data.put("title", intent.getStringExtra("title"));
                        data.put("artist", intent.getStringExtra("artist"));
                        data.put("index", intent.getIntExtra("index", 0));
                        notifyListeners("onTrackChanged", data);
                        return;
                    }

                    if (BackgroundAudioService.ACTION_PROGRESS.equals(action)) {
                        JSObject data = new JSObject();
                        data.put("currentTime", intent.getIntExtra("currentTime", 0));
                        data.put("duration", intent.getIntExtra("duration", 0));
                        notifyListeners("onProgress", data);
                        return;
                    }

                    if (BackgroundAudioService.ACTION_PLAYBACK_STATE.equals(action)) {
                        JSObject data = new JSObject();
                        data.put("isPlaying", intent.getBooleanExtra("isPlaying", false));
                        data.put("nativePlayback", intent.getBooleanExtra("nativePlayback", false));
                        notifyListeners("onPlaybackState", data);
                        return;
                    }

                    if (BackgroundAudioService.ACTION_NATIVE_ERROR.equals(action)) {
                        JSObject data = new JSObject();
                        data.put("nativePlayback", false);
                        notifyListeners("onPlaybackState", data);
                        return;
                    }

                    JSObject data = new JSObject();
                    if (BackgroundAudioService.ACTION_PLAY.equals(action)) {
                        data.put("action", "play");
                    } else if (BackgroundAudioService.ACTION_PAUSE.equals(action)) {
                        data.put("action", "pause");
                    } else if (BackgroundAudioService.ACTION_NEXT.equals(action)) {
                        data.put("action", "next");
                    } else if (BackgroundAudioService.ACTION_PREV.equals(action)) {
                        data.put("action", "prev");
                    }
                    if (data.has("action")) {
                        notifyListeners("onNotificationAction", data);
                    }
                }
            };

            IntentFilter filter = new IntentFilter(BackgroundAudioService.BROADCAST_ACTION);
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
                getContext().registerReceiver(actionReceiver, filter, Context.RECEIVER_NOT_EXPORTED);
            } else {
                getContext().registerReceiver(actionReceiver, filter);
            }
        }
    }

    @PluginMethod
    public void startForegroundService(PluginCall call) {
        String trackId = call.getString("trackId", "");
        String title = call.getString("title", "গান বাজছে");
        String artist = call.getString("artist", "Universal Downloader");
        String artworkUrl = call.getString("artworkUrl", null);
        String streamUrl = call.getString("streamUrl", null);
        boolean isPlaying = call.getBoolean("isPlaying", true);
        boolean isLooping = call.getBoolean("isLooping", false);
        JSArray playlist = call.getArray("playlist", null);

        Context context = getContext();
        Intent intent = new Intent(context, BackgroundAudioService.class);
        intent.setAction(BackgroundAudioService.ACTION_START);
        if (trackId != null) intent.putExtra("trackId", trackId);
        intent.putExtra("title", title);
        intent.putExtra("artist", artist);
        if (artworkUrl != null) intent.putExtra("artworkUrl", artworkUrl);
        if (streamUrl != null) intent.putExtra("streamUrl", streamUrl);
        if (playlist != null) intent.putExtra("playlistJson", playlist.toString());
        intent.putExtra("isPlaying", isPlaying);
        intent.putExtra("isLooping", isLooping);

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            context.startForegroundService(intent);
        } else {
            context.startService(intent);
        }

        JSObject res = new JSObject();
        res.put("success", true);
        res.put("nativePlayback", isPlayableRemoteStream(streamUrl));
        call.resolve(res);
    }

    @PluginMethod
    public void setPlaylist(PluginCall call) {
        JSArray playlist = call.getArray("playlist", null);
        String trackId = call.getString("trackId", "");

        Context context = getContext();
        Intent intent = new Intent(context, BackgroundAudioService.class);
        intent.setAction(BackgroundAudioService.ACTION_SET_PLAYLIST);
        if (playlist != null) intent.putExtra("playlistJson", playlist.toString());
        if (trackId != null) intent.putExtra("trackId", trackId);

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            context.startForegroundService(intent);
        } else {
            context.startService(intent);
        }

        JSObject res = new JSObject();
        res.put("success", true);
        call.resolve(res);
    }

    @PluginMethod
    public void seekTo(PluginCall call) {
        int seconds = call.getInt("seconds", 0);
        Context context = getContext();
        Intent intent = new Intent(context, BackgroundAudioService.class);
        intent.setAction(BackgroundAudioService.ACTION_SEEK);
        intent.putExtra("seekSeconds", seconds);
        context.startService(intent);

        JSObject res = new JSObject();
        res.put("success", true);
        call.resolve(res);
    }

    @PluginMethod
    public void updateMetadata(PluginCall call) {
        String title = call.getString("title", null);
        String artist = call.getString("artist", null);
        String artworkUrl = call.getString("artworkUrl", null);
        Boolean isPlaying = call.getBoolean("isPlaying", null);
        Boolean isLooping = call.getBoolean("isLooping", null);

        Context context = getContext();
        Intent intent = new Intent(context, BackgroundAudioService.class);
        intent.setAction(BackgroundAudioService.ACTION_UPDATE);
        if (title != null) intent.putExtra("title", title);
        if (artist != null) intent.putExtra("artist", artist);
        if (artworkUrl != null) intent.putExtra("artworkUrl", artworkUrl);
        if (isPlaying != null) intent.putExtra("isPlaying", isPlaying);
        if (isLooping != null) intent.putExtra("isLooping", isLooping);

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            context.startForegroundService(intent);
        } else {
            context.startService(intent);
        }

        JSObject res = new JSObject();
        res.put("success", true);
        call.resolve(res);
    }

    @PluginMethod
    public void stopForegroundService(PluginCall call) {
        Context context = getContext();
        Intent intent = new Intent(context, BackgroundAudioService.class);
        intent.setAction(BackgroundAudioService.ACTION_STOP);
        context.startService(intent);

        JSObject res = new JSObject();
        res.put("success", true);
        call.resolve(res);
    }

    @PluginMethod
    public void isSupported(PluginCall call) {
        JSObject res = new JSObject();
        res.put("supported", true);
        res.put("platform", "android");
        call.resolve(res);
    }

    @Override
    protected void handleOnDestroy() {
        if (actionReceiver != null) {
            try {
                getContext().unregisterReceiver(actionReceiver);
            } catch (Exception ignored) {}
            actionReceiver = null;
        }
        super.handleOnDestroy();
    }
}
