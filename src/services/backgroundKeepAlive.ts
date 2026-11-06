// Background Keep-Alive & Mobile Lock-Screen Activity Service
import { notificationManager } from './notificationManager';

// Tiny 1-second inaudible WAV base64 string
const SILENT_WAV_BASE64 = 'data:audio/wav;base64,UklGRjIAAABXQVZFZm10IBIAAAABAAEAQB8AAEAfAAABAAgAAABmYWN0BAAAAAAAAABkYXRhEQAAAAAAAAAAAAAAAAAAAAAAAAA=';

interface ActiveDownloadMeta {
  id: string;
  title: string;
  thumbnail?: string;
  progress: number;
  speed: string;
  eta: string;
}

class BackgroundKeepAlive {
  private wakeLockSentinel: any = null;
  private isKeepAliveActive: boolean = false;
  private heartbeatInterval: any = null;
  private silentAudioElement: HTMLAudioElement | null = null;
  private audioContext: AudioContext | null = null;
  private silentOscillator: OscillatorNode | null = null;
  private silentGain: GainNode | null = null;
  private listeners: Set<(isActive: boolean) => void> = new Set();
  private isOnline: boolean = typeof navigator !== 'undefined' ? navigator.onLine : true;
  private activeDownloads: Map<string, ActiveDownloadMeta> = new Map();
  private notificationThrottleTime: number = 0;

  constructor() {
    if (typeof window !== 'undefined') {
      this.initNetworkListeners();
      this.initVisibilityListener();

      // Check if user previously enabled Always-Active mode
      const saved = localStorage.getItem('downloader_always_active');
      if (saved === 'true') {
        this.enable();
      }
    }
  }

  private initNetworkListeners() {
    window.addEventListener('online', () => {
      this.isOnline = true;
      console.log('Mobile network online - re-syncing background tasks');
      notificationManager.notifyInternetRestored();
      this.pingServer();
    });

    window.addEventListener('offline', () => {
      this.isOnline = false;
      console.log('Mobile network offline');
    });
  }

  private initVisibilityListener() {
    document.addEventListener('visibilitychange', async () => {
      if (document.visibilityState === 'hidden') {
        console.log('App minimized/locked. Active downloads count:', this.activeDownloads.size);
        if (this.isKeepAliveActive || this.activeDownloads.size > 0) {
          this.ensureSilentLoopAudio();
          this.ensureSilentHeartbeat();
        }
      } else if (document.visibilityState === 'visible') {
        console.log('App brought back to foreground');
        if (this.isKeepAliveActive || this.activeDownloads.size > 0) {
          await this.requestWakeLock();
        }
      }
    });
  }

  // Request Screen Wake Lock (keeps display active while in view)
  private async requestWakeLock(): Promise<boolean> {
    if (typeof navigator !== 'undefined' && 'wakeLock' in navigator) {
      try {
        // @ts-ignore
        this.wakeLockSentinel = await navigator.wakeLock.request('screen');
        this.wakeLockSentinel.addEventListener('release', () => {
          this.wakeLockSentinel = null;
        });
        return true;
      } catch (err) {
        console.warn('Wake Lock request skipped or unsupported:', err);
      }
    }
    return false;
  }

  private releaseWakeLock() {
    if (this.wakeLockSentinel) {
      try {
        this.wakeLockSentinel.release();
      } catch {}
      this.wakeLockSentinel = null;
    }
  }

  // Dual Silent Keep-Alive Strategy:
  // 1) HTML5 Audio Element playing silent loop (Triggers Android OS Audio Service, bypassing background freezing & screen-lock network cutoff)
  private ensureSilentLoopAudio() {
    if (typeof window === 'undefined') return;

    try {
      if (!this.silentAudioElement) {
        const audio = new Audio(SILENT_WAV_BASE64);
        audio.loop = true;
        audio.volume = 0.001; // Audible to OS audio manager, completely silent to human ear
        (audio as any).playsInline = true;
        this.silentAudioElement = audio;
      }

      if (this.silentAudioElement && this.silentAudioElement.paused) {
        this.silentAudioElement.play().catch(e => {
          console.warn('Silent audio play need user gesture or auto-play rule:', e);
        });
      }
    } catch (e) {
      console.warn('Silent loop audio setup skipped:', e);
    }
  }

  private stopSilentLoopAudio() {
    try {
      if (this.silentAudioElement) {
        this.silentAudioElement.pause();
        this.silentAudioElement.currentTime = 0;
      }
    } catch (e) {
      console.warn('Error pausing silent loop audio:', e);
    }
  }

  // 2) WebAudio API oscillator
  private ensureSilentHeartbeat() {
    try {
      if (!this.audioContext) {
        const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
        if (AudioCtx) {
          this.audioContext = new AudioCtx();
        }
      }

      if (this.audioContext && this.audioContext.state === 'suspended') {
        this.audioContext.resume().catch(() => {});
      }

      if (this.audioContext && !this.silentOscillator) {
        this.silentOscillator = this.audioContext.createOscillator();
        this.silentGain = this.audioContext.createGain();
        this.silentGain.gain.value = 0.00001;
        this.silentOscillator.type = 'sine';
        this.silentOscillator.frequency.value = 20;
        this.silentOscillator.connect(this.silentGain);
        this.silentGain.connect(this.audioContext.destination);
        this.silentOscillator.start();
      }
    } catch (e) {
      console.warn('Silent heartbeat audio initialization bypassed:', e);
    }
  }

  private stopSilentHeartbeat() {
    try {
      if (this.silentOscillator) {
        this.silentOscillator.stop();
        this.silentOscillator.disconnect();
        this.silentOscillator = null;
      }
      if (this.silentGain) {
        this.silentGain.disconnect();
        this.silentGain = null;
      }
      if (this.audioContext && this.audioContext.state !== 'closed') {
        this.audioContext.suspend().catch(() => {});
      }
    } catch (e) {
      console.warn('Error stopping silent heartbeat:', e);
    }
  }

  private async pingServer() {
    try {
      await fetch('/api/health', { cache: 'no-store' });
    } catch {}
  }

  // MediaSession API: displays current download or music status on the Android Lock Screen
  public updateLockScreenMediaSession(title: string, artist: string, artworkUrl?: string) {
    if (typeof navigator !== 'undefined' && 'mediaSession' in navigator) {
      try {
        navigator.mediaSession.metadata = new MediaMetadata({
          title,
          artist,
          album: 'Universal Downloader Pro',
          artwork: artworkUrl ? [
            { src: artworkUrl, sizes: '512x512', type: 'image/jpeg' },
            { src: artworkUrl, sizes: '256x256', type: 'image/jpeg' },
            { src: artworkUrl, sizes: '128x128', type: 'image/jpeg' },
          ] : [
            { src: '/pwa-512x512.png', sizes: '512x512', type: 'image/png' },
          ],
        });
        navigator.mediaSession.playbackState = 'playing';
      } catch (e) {
        console.warn('MediaSession lockscreen update skipped:', e);
      }
    }
  }

  // Register an active download: automatically wakes up lock-screen persistence
  public registerDownload(id: string, title: string, thumbnail?: string) {
    this.activeDownloads.set(id, {
      id,
      title,
      thumbnail,
      progress: 0,
      speed: 'Connecting...',
      eta: 'Calculating...',
    });

    // Auto-enable keep-alive during download
    this.enableBackgroundService();
    this.updateLockScreenMediaSession(`📥 ডাউনলোড চলছে: ${title}`, `প্রস্তুতি নিচ্ছে...`, thumbnail);
  }

  // Update download progress: keep lock screen and service alive
  public updateDownloadProgress(id: string, progress: number, speed: string, eta: string) {
    const item = this.activeDownloads.get(id);
    if (item) {
      item.progress = progress;
      item.speed = speed;
      item.eta = eta;
      this.activeDownloads.set(id, item);

      // Throttled notification updates for lock-screen
      const now = Date.now();
      if (now - this.notificationThrottleTime > 6000 && document.visibilityState === 'hidden') {
        this.notificationThrottleTime = now;
        notificationManager.sendNotification({
          title: `📥 ডাউনলোড চলছে: ${progress}%`,
          body: `"${item.title.slice(0, 35)}" • ${speed} (${eta})`,
          tag: 'download-progress-lock',
        });
      }

      this.updateLockScreenMediaSession(
        `📥 ডাউনলোড ${progress}%: ${item.title.slice(0, 30)}`,
        `${speed} • অবশিষ্ট সময়: ${eta}`,
        item.thumbnail
      );
    }
  }

  // Unregister download when finished or failed
  public unregisterDownload(id: string) {
    this.activeDownloads.delete(id);

    if (this.activeDownloads.size === 0) {
      if (typeof navigator !== 'undefined' && 'mediaSession' in navigator) {
        navigator.mediaSession.playbackState = 'none';
      }
      // If user did not manually turn on Always-Active, shut down keep-alive
      const userAlwaysActive = localStorage.getItem('downloader_always_active') === 'true';
      if (!userAlwaysActive) {
        this.disableBackgroundService();
      }
    }
  }

  private async enableBackgroundService() {
    await this.requestWakeLock();
    this.ensureSilentLoopAudio();
    this.ensureSilentHeartbeat();

    if (!this.heartbeatInterval) {
      this.heartbeatInterval = setInterval(() => {
        this.pingServer();
      }, 15000);
    }
  }

  private disableBackgroundService() {
    this.releaseWakeLock();
    this.stopSilentLoopAudio();
    this.stopSilentHeartbeat();

    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
  }

  // Public Toggle / Control
  public async enable(): Promise<boolean> {
    this.isKeepAliveActive = true;
    localStorage.setItem('downloader_always_active', 'true');
    await this.enableBackgroundService();
    this.notifyListeners();
    return true;
  }

  public disable() {
    this.isKeepAliveActive = false;
    localStorage.setItem('downloader_always_active', 'false');
    if (this.activeDownloads.size === 0) {
      this.disableBackgroundService();
    }
    this.notifyListeners();
  }

  public toggle(): boolean {
    if (this.isKeepAliveActive) {
      this.disable();
      return false;
    } else {
      this.enable();
      return true;
    }
  }

  public isActive(): boolean {
    return this.isKeepAliveActive || this.activeDownloads.size > 0;
  }

  public isManuallyEnabled(): boolean {
    return this.isKeepAliveActive;
  }

  public getActiveDownloadsCount(): number {
    return this.activeDownloads.size;
  }

  public getOnlineStatus(): boolean {
    return this.isOnline;
  }

  public subscribe(listener: (isActive: boolean) => void): () => void {
    this.listeners.add(listener);
    listener(this.isActive());
    return () => this.listeners.delete(listener);
  }

  private notifyListeners() {
    this.listeners.forEach(fn => fn(this.isActive()));
  }
}

export const backgroundKeepAlive = new BackgroundKeepAlive();
