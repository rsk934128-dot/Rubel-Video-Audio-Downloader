import { registerPlugin, Capacitor } from '@capacitor/core';

export interface BackgroundAudioPluginInterface {
  startForegroundService(options: {
    title: string;
    artist: string;
    artworkUrl?: string;
    isPlaying: boolean;
  }): Promise<{ success: boolean }>;

  updateMetadata(options: {
    title?: string;
    artist?: string;
    artworkUrl?: string;
    isPlaying?: boolean;
  }): Promise<{ success: boolean }>;

  stopForegroundService(): Promise<{ success: boolean }>;

  isSupported(): Promise<{ supported: boolean; platform: string }>;

  addListener(
    eventName: 'onNotificationAction',
    listenerFunc: (data: { action: 'play' | 'pause' | 'next' | 'prev' }) => void
  ): Promise<any>;
}

const BackgroundAudioPlugin = registerPlugin<BackgroundAudioPluginInterface>('BackgroundAudio');

class AndroidBackgroundAudioService {
  private isNative: boolean = Capacitor.isNativePlatform();
  private isForegroundRunning: boolean = false;
  private actionListeners: Set<(action: 'play' | 'pause' | 'next' | 'prev') => void> = new Set();

  constructor() {
    if (this.isNative) {
      try {
        BackgroundAudioPlugin.addListener('onNotificationAction', (data) => {
          if (data && data.action) {
            this.actionListeners.forEach((fn) => fn(data.action));
          }
        });
      } catch (err) {
        console.warn('BackgroundAudioPlugin listener registration skipped:', err);
      }
    }
  }

  public isSupported(): boolean {
    return this.isNative;
  }

  public async startForeground(params: {
    title: string;
    artist: string;
    artworkUrl?: string;
    isPlaying: boolean;
  }): Promise<boolean> {
    if (!this.isNative) return false;
    try {
      await BackgroundAudioPlugin.startForegroundService(params);
      this.isForegroundRunning = true;
      return true;
    } catch (err) {
      console.warn('Failed to start Android Foreground Audio Service:', err);
      return false;
    }
  }

  public async updateMetadata(params: {
    title?: string;
    artist?: string;
    artworkUrl?: string;
    isPlaying?: boolean;
  }): Promise<boolean> {
    if (!this.isNative || !this.isForegroundRunning) return false;
    try {
      await BackgroundAudioPlugin.updateMetadata(params);
      return true;
    } catch (err) {
      console.warn('Failed to update Android Foreground Audio Service metadata:', err);
      return false;
    }
  }

  public async stopForeground(): Promise<boolean> {
    if (!this.isNative || !this.isForegroundRunning) return false;
    try {
      await BackgroundAudioPlugin.stopForegroundService();
      this.isForegroundRunning = false;
      return true;
    } catch (err) {
      console.warn('Failed to stop Android Foreground Audio Service:', err);
      return false;
    }
  }

  public onAction(callback: (action: 'play' | 'pause' | 'next' | 'prev') => void): () => void {
    this.actionListeners.add(callback);
    return () => this.actionListeners.delete(callback);
  }
}

export const androidBackgroundAudio = new AndroidBackgroundAudioService();
