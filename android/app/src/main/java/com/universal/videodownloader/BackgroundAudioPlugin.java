package com.universal.videodownloader;

import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.content.IntentFilter;
import android.os.Build;
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

    private void registerBroadcastReceiver() {
        if (actionReceiver == null) {
            actionReceiver = new BroadcastReceiver() {
                @Override
                public void onReceive(Context context, Intent intent) {
                    if (intent != null && intent.hasExtra("action")) {
                        String action = intent.getStringExtra("action");
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
        String title = call.getString("title", "গান বাজছে");
        String artist = call.getString("artist", "Universal Downloader");
        String artworkUrl = call.getString("artworkUrl", null);
        boolean isPlaying = call.getBoolean("isPlaying", true);

        Context context = getContext();
        Intent intent = new Intent(context, BackgroundAudioService.class);
        intent.setAction(BackgroundAudioService.ACTION_START);
        intent.putExtra("title", title);
        intent.putExtra("artist", artist);
        if (artworkUrl != null) intent.putExtra("artworkUrl", artworkUrl);
        intent.putExtra("isPlaying", isPlaying);

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
    public void updateMetadata(PluginCall call) {
        String title = call.getString("title", null);
        String artist = call.getString("artist", null);
        String artworkUrl = call.getString("artworkUrl", null);
        Boolean isPlaying = call.getBoolean("isPlaying", null);

        Context context = getContext();
        Intent intent = new Intent(context, BackgroundAudioService.class);
        intent.setAction(BackgroundAudioService.ACTION_UPDATE);
        if (title != null) intent.putExtra("title", title);
        if (artist != null) intent.putExtra("artist", artist);
        if (artworkUrl != null) intent.putExtra("artworkUrl", artworkUrl);
        if (isPlaying != null) intent.putExtra("isPlaying", isPlaying);

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
