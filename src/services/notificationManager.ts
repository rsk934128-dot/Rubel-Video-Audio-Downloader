// Real-time Web & Service Worker Notification Manager

export type NotificationPermissionState = 'default' | 'granted' | 'denied' | 'unsupported';

class NotificationManager {
  private swRegistration: ServiceWorkerRegistration | null = null;
  private isSupported: boolean = false;

  constructor() {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      this.isSupported = true;
      this.initServiceWorker();
    }
  }

  private async initServiceWorker() {
    if ('serviceWorker' in navigator) {
      try {
        const reg = await navigator.serviceWorker.ready;
        this.swRegistration = reg;
      } catch (err) {
        console.warn('Service worker not ready for notifications yet:', err);
      }
    }
  }

  public getPermissionStatus(): NotificationPermissionState {
    if (!this.isSupported) return 'unsupported';
    return Notification.permission as NotificationPermissionState;
  }

  public async requestPermission(): Promise<boolean> {
    if (!this.isSupported) return false;

    try {
      const result = await Notification.requestPermission();
      if (result === 'granted') {
        this.sendNotification({
          title: '🔔 নোটিফিকেশন সক্রিয় হয়েছে!',
          body: 'এখন থেকে অ্যাপ ব্যাকগ্রাউন্ডে বা মিনিমাইজ থাকলেও ডাউনলোড ও লাইভ আপডেট নোটিফিকেশন পাবেন।',
          tag: 'welcome-notification',
        });
        return true;
      }
      return false;
    } catch (e) {
      console.error('Failed to request notification permission:', e);
      return false;
    }
  }

  public async sendNotification(options: {
    title: string;
    body: string;
    tag?: string;
    icon?: string;
    data?: any;
  }): Promise<void> {
    if (!this.isSupported || Notification.permission !== 'granted') {
      return;
    }

    const { title, body, tag = 'downloader-alert', icon = '/pwa-192x192.png', data = { url: '/' } } = options;

    // First choice: Service Worker showNotification (works in background / mobile lockscreen / minimized)
    try {
      if (!this.swRegistration && 'serviceWorker' in navigator) {
        this.swRegistration = await navigator.serviceWorker.ready;
      }

      if (this.swRegistration && typeof this.swRegistration.showNotification === 'function') {
        await this.swRegistration.showNotification(title, {
          body,
          icon,
          badge: '/pwa-192x192.png',
          tag,
          renotify: true,
          vibrate: [200, 100, 200],
          data,
        } as any);
        return;
      }
    } catch (swErr) {
      console.warn('SW notification fallback to window notification:', swErr);
    }

    // Fallback: Standard window Notification
    try {
      new Notification(title, {
        body,
        icon,
        tag,
      });
    } catch (e) {
      console.warn('Window notification failed:', e);
    }
  }

  // Helper for Download Completion
  public notifyDownloadComplete(fileName: string, quality?: string) {
    this.sendNotification({
      title: '✅ ডাউনলোড সম্পন্ন হয়েছে!',
      body: `"${fileName}" সফলভাবে ডাউনলোড হয়েছে।${quality ? ` (${quality})` : ''}`,
      tag: `download-complete-${Date.now()}`,
    });
  }

  // Helper for Download Started
  public notifyDownloadStarted(fileName: string) {
    // Only notify if window is hidden (minimized)
    if (typeof document !== 'undefined' && document.visibilityState === 'hidden') {
      this.sendNotification({
        title: '⏳ ডাউনলোড ব্যাকগ্রাউন্ডে শুরু হয়েছে',
        body: `"${fileName}" প্রক্রিয়াধীন আছে। মিনিমাইজ থাকলেও প্রগ্রেস চলবে।`,
        tag: 'download-start',
      });
    }
  }

  // Helper for Internet Reconnection
  public notifyInternetRestored() {
    this.sendNotification({
      title: '🌐 ইন্টারনেট পুনরায় সংযুক্ত হয়েছে',
      body: 'অ্যাপ ব্যাকগ্রাউন্ডে সক্রিয় এবং রিয়েল-টাইমে আপডেট গ্রহণ করছে।',
      tag: 'network-restored',
    });
  }
}

export const notificationManager = new NotificationManager();
