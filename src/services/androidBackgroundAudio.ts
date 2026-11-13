import { registerPlugin, Capacitor } from '@capacitor/core';

export interface NativePlaylistTrack {
  id: string;
  title: string;
  artist: string;
  artworkUrl?: string;
  streamUrl?: string;
}

export interface BackgroundAudioPluginInterface {
  startForegroundService(options: {
    trackId?: string;
    title: string;
    artist: string;
    artworkUrl?: string;
    streamUrl?: string;
    isPlaying: boolean;
    isLooping?: boolean;
    playlist?: NativePlaylistTrack[];
  }): Promise<{ success: boolean; nativePlayback?: boolean }>;

  setPlaylist(options: {
    trackId?: string;
    playlist: NativePlaylistTrack[];
  }): Promise<{ success: boolean }>;

  seekTo(options: {
    seconds: number;
  }): Promise<{ success: boolean }>;

  updateMetadata(options: {
    title?: string;
    artist?: string;
    artworkUrl?: string;
    isPlaying?: boolean;
    isLooping?: boolean;
  }): Promise<{ success: boolean }>;

  stopForegroundService(): Promise<{ success: boolean }>;

  isSupported(): Promise<{ supported: boolean; platform: string }>;

  addListener(
    eventName: 'onNotificationAction',
    listenerFunc: (data: { action: 'play' | 'pause' | 'next' | 'prev' }) => void
  ): Promise<any>;

  addListener(
    eventName: 'onTrackChanged',
    listenerFunc: (data: { trackId: string; title: string; artist: string; index: number }) => void
  ): Promise<any>;

  addListener(
    eventName: 'onProgress',
    listenerFunc: (data: { currentTime: number; duration: number }) => void
  ): Promise<any>;

  addListener(
    eventName: 'onPlaybackState',
    listenerFunc: (data: { isPlaying: boolean; nativePlayback: boolean }) => void
  ): Promise<any>;
}

const BackgroundAudioPlugin = registerPlugin<BackgroundAudioPluginInterface>('BackgroundAudio');

class AndroidBackgroundAudioService {
  private isNative: boolean = Capacitor.isNativePlatform();
  private isForegroundRunning: boolean = false;
  private actionListeners: Set<(action: 'play' | 'pause' | 'next' | 'prev') => void> = new Set();
  private trackChangedListeners: Set<(data: { trackId: string; title: string; artist: string; index: number }) => void> = new Set();
  private progressListeners: Set<(data: { currentTime: number; duration: number }) => void> = new Set();
  private stateListeners: Set<(data: { isPlaying: boolean; nativePlayback: boolean }) => void> = new Set();

  constructor() {
    if (this.isNative) {
      try {
        BackgroundAudioPlugin.addListener('onNotificationAction', (data) => {
          if (data && data.action) {
            this.actionListeners.forEach((fn) => fn(data.action));
          }
        });
        BackgroundAudioPlugin.addListener('onTrackChanged', (data) => {
          if (data) {
            this.trackChangedListeners.forEach((fn) => fn(data));
          }
        });
        BackgroundAudioPlugin.addListener('onProgress', (data) => {
          if (data) {
            this.progressListeners.forEach((fn) => fn(data));
          }
        });
        BackgroundAudioPlugin.addListener('onPlaybackState', (data) => {
          if (data) {
            this.stateListeners.forEach((fn) => fn(data));
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
    trackId?: string;
    title: string;
    artist: string;
    artworkUrl?: string;
    streamUrl?: string;
    isPlaying: boolean;
    isLooping?: boolean;
    playlist?: NativePlaylistTrack[];
  }): Promise<{ started: boolean; nativePlayback: boolean }> {
    if (!this.isNative) return { started: false, nativePlayback: false };
    try {
      const res = await BackgroundAudioPlugin.startForegroundService(params);
      this.isForegroundRunning = true;
      return { started: true, nativePlayback: Boolean(res?.nativePlayback) };
    } catch (err) {
      console.warn('Failed to start Android Foreground Audio Service:', err);
      return { started: false, nativePlayback: false };
    }
  }

  public async setPlaylist(trackId: string, playlist: NativePlaylistTrack[]): Promise<boolean> {
    if (!this.isNative) return false;
    try {
      await BackgroundAudioPlugin.setPlaylist({ trackId, playlist });
      return true;
    } catch {
      return false;
    }
  }

  public async seekTo(seconds: number): Promise<boolean> {
    if (!this.isNative || !this.isForegroundRunning) return false;
    try {
      await BackgroundAudioPlugin.seekTo({ seconds: Math.floor(seconds) });
      return true;
    } catch {
      return false;
    }
  }

  public async updateMetadata(params: {
    title?: string;
    artist?: string;
    artworkUrl?: string;
    isPlaying?: boolean;
    isLooping?: boolean;
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

  public onTrackChanged(callback: (data: { trackId: string; title: string; artist: string; index: number }) => void): () => void {
    this.trackChangedListeners.add(callback);
    return () => this.trackChangedListeners.delete(callback);
  }

  public onProgress(callback: (data: { currentTime: number; duration: number }) => void): () => void {
    this.progressListeners.add(callback);
    return () => this.progressListeners.delete(callback);
  }

  public onPlaybackState(callback: (data: { isPlaying: boolean; nativePlayback: boolean }) => void): () => void {
    this.stateListeners.add(callback);
    return () => this.stateListeners.delete(callback);
  }
}

export const androidBackgroundAudio = new AndroidBackgroundAudioService();
