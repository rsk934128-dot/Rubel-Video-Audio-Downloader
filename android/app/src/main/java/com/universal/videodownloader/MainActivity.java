package com.universal.videodownloader;

import android.content.Intent;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.os.Environment;
import android.provider.Settings;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        registerPlugin(BackgroundAudioPlugin.class);
        super.onCreate(savedInstanceState);
    }

    /**
     * Helper method to verify if MANAGE_EXTERNAL_STORAGE is granted (Android 11+ / API 30+)
     */
    public boolean checkManageExternalStoragePermission() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) {
            return Environment.isExternalStorageManager();
        }
        return true;
    }

    /**
     * Request MANAGE_EXTERNAL_STORAGE by redirecting user to system App All Files Access settings
     */
    public void requestManageExternalStoragePermission() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) {
            try {
                Intent intent = new Intent(Settings.ACTION_MANAGE_APP_ALL_FILES_ACCESS_PERMISSION);
                intent.addCategory("android.intent.category.DEFAULT");
                intent.setData(Uri.parse(String.format("package:%s", getPackageName())));
                startActivity(intent);
            } catch (Exception e) {
                Intent intent = new Intent(Settings.ACTION_MANAGE_ALL_FILES_ACCESS_PERMISSION);
                startActivity(intent);
            }
        }
    }

    /**
     * Helper method to verify if SYSTEM_ALERT_WINDOW (Display over other apps) is granted
     */
    public boolean checkOverlayPermission() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            return Settings.canDrawOverlays(this);
        }
        return true;
    }

    /**
     * Request SYSTEM_ALERT_WINDOW by redirecting user to system Draw Over Other Apps settings
     */
    public void requestOverlayPermission() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            Intent intent = new Intent(
                Settings.ACTION_MANAGE_OVERLAY_PERMISSION,
                Uri.parse("package:" + getPackageName())
            );
            startActivity(intent);
        }
    }

    /**
     * Helper method to verify if REQUEST_INSTALL_PACKAGES is allowed (Android 8.0+ / API 26+)
     */
    public boolean checkInstallPackagesPermission() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            return getPackageManager().canRequestPackageInstalls();
        }
        return true;
    }

    /**
     * Request REQUEST_INSTALL_PACKAGES by redirecting user to Unknown App Sources settings
     */
    public void requestInstallPackagesPermission() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            Intent intent = new Intent(
                Settings.ACTION_MANAGE_UNKNOWN_APP_SOURCES,
                Uri.parse("package:" + getPackageName())
            );
            startActivity(intent);
        }
    }
}
