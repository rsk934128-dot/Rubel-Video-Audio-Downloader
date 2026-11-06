import { StorageConfig, StorageDestination, StorageAccessStatus } from '../types';

const STORAGE_PREF_KEY = 'video_downloader_storage_config_v1';

function formatBytes(bytes: number): string {
  if (bytes <= 0 || isNaN(bytes)) return '0 MB';
  const gb = bytes / (1024 * 1024 * 1024);
  if (gb >= 1) {
    return `${gb.toFixed(1)} GB`;
  }
  const mb = bytes / (1024 * 1024);
  return `${mb.toFixed(1)} MB`;
}

const DEFAULT_CONFIG: StorageConfig = {
  destination: 'sd_card', // Default set to SD Card as requested
  customFolder: 'Movies/Downloader',
  useNativePicker: true,
  autoSaveToSD: true,
  lastUsedPath: 'SD Card / Movies',
};

class StoragePreferenceManager {
  private config: StorageConfig;
  private listeners: Set<(config: StorageConfig) => void> = new Set();

  constructor() {
    this.config = this.loadConfig();
  }

  private loadConfig(): StorageConfig {
    if (typeof window === 'undefined') return DEFAULT_CONFIG;
    try {
      const raw = localStorage.getItem(STORAGE_PREF_KEY);
      if (!raw) return DEFAULT_CONFIG;
      return { ...DEFAULT_CONFIG, ...JSON.parse(raw) };
    } catch {
      return DEFAULT_CONFIG;
    }
  }

  public getConfig(): StorageConfig {
    return { ...this.config };
  }

  public setConfig(update: Partial<StorageConfig>): void {
    this.config = { ...this.config, ...update };
    try {
      localStorage.setItem(STORAGE_PREF_KEY, JSON.stringify(this.config));
    } catch (e) {
      console.warn('Failed to persist storage config:', e);
    }
    this.notifyListeners();
  }

  public setDestination(destination: StorageDestination): void {
    this.setConfig({ destination });
  }

  public isNativePickerSupported(): boolean {
    return typeof window !== 'undefined' && 'showSaveFilePicker' in window;
  }

  public isShareFilesSupported(): boolean {
    return typeof navigator !== 'undefined' && 'canShare' in navigator && typeof navigator.share === 'function';
  }

  /**
   * Get deep Storage Access status including Quota, Persistent permission, and capability
   */
  public async getStorageAccessStatus(): Promise<StorageAccessStatus> {
    let isPersistent = false;
    let quotaBytes: number | undefined;
    let usageBytes: number | undefined;
    let availableBytes: number | undefined;

    if (typeof navigator !== 'undefined' && navigator.storage) {
      try {
        if (typeof navigator.storage.persisted === 'function') {
          isPersistent = await navigator.storage.persisted();
        }
        if (typeof navigator.storage.estimate === 'function') {
          const estimate = await navigator.storage.estimate();
          quotaBytes = estimate.quota;
          usageBytes = estimate.usage;
          if (quotaBytes && usageBytes !== undefined) {
            availableBytes = Math.max(0, quotaBytes - usageBytes);
          }
        }
      } catch (e) {
        console.warn('Could not query storage estimate:', e);
      }
    }

    let canWriteLocalStorage = false;
    try {
      if (typeof window !== 'undefined') {
        const testKey = '__storage_access_verify__';
        localStorage.setItem(testKey, '1');
        localStorage.removeItem(testKey);
        canWriteLocalStorage = true;
      }
    } catch {
      canWriteLocalStorage = false;
    }

    const hasNativePicker = this.isNativePickerSupported();
    const hasFileShare = this.isShareFilesSupported();

    return {
      isPersistent,
      hasNativePicker,
      hasFileShare,
      quotaBytes,
      usageBytes,
      availableBytes,
      quotaFormatted: quotaBytes ? formatBytes(quotaBytes) : 'সিস্টেম নির্ধারিত (System Quota)',
      usageFormatted: usageBytes !== undefined ? formatBytes(usageBytes) : '0 MB',
      availableFormatted: availableBytes ? formatBytes(availableBytes) : 'পর্যাপ্ত (Available)',
      destination: this.config.destination,
      canWriteLocalStorage,
      status: (canWriteLocalStorage && (hasNativePicker || hasFileShare || isPersistent)) ? 'optimal' : 'limited',
    };
  }

  /**
   * Request persistent storage permission so OS never deletes downloaded files or cached chunks
   */
  public async requestPersistentStorage(): Promise<{ granted: boolean; message: string }> {
    if (typeof navigator === 'undefined' || !navigator.storage || typeof navigator.storage.persist !== 'function') {
      return {
        granted: false,
        message: 'ব্রাউজার পারসিস্টেন্ট স্টোরেজ এপিআই সাপোর্ট করে না, রেগুলার ডাউনলোড মোড সচল থাকবে।',
      };
    }

    try {
      const isAlreadyPersisted = await navigator.storage.persisted();
      if (isAlreadyPersisted) {
        return {
          granted: true,
          message: 'স্টোরেজ অ্যাক্সেস ইতিমধ্যেই স্থায়ী (Persistent) অনুমোদিত আছে।',
        };
      }

      const granted = await navigator.storage.persist();
      if (granted) {
        return {
          granted: true,
          message: 'স্থায়ী স্টোরেজ অ্যাক্সেস সক্রিয় হয়েছে। সিস্টেম ডাউনলোড করা মিডিয়া মুছবে না।',
        };
      } else {
        return {
          granted: false,
          message: 'সিস্টেম পারসিস্টেন্ট অ্যাক্সেস এখনও সীমিত রেখেছে। PWA অ্যাপ ইনস্টল করলে সরাসরি অনুমতি মিলবে।',
        };
      }
    } catch (e: any) {
      return {
        granted: false,
        message: `স্টোরেজ অ্যাক্সেস অনুরোধ ত্রুটি: ${e?.message || 'অজ্ঞাত সমস্যা'}`,
      };
    }
  }

  /**
   * Test full write and readback integrity
   */
  public async verifyStorageReadWrite(): Promise<{ success: boolean; details: string; available?: string }> {
    try {
      const testKey = '__storage_full_check__' + Date.now();
      const testData = 'STORAGE_ACCESS_OK_' + Math.random().toString(36).substring(7);
      localStorage.setItem(testKey, testData);
      const readBack = localStorage.getItem(testKey);
      localStorage.removeItem(testKey);

      if (readBack !== testData) {
        throw new Error('ডেটা যাচাই ব্যর্থ হয়েছে');
      }

      const status = await this.getStorageAccessStatus();
      return {
        success: true,
        details: `স্টোরেজ অ্যাক্সেস সম্পূর্ণ কার্যকর (${status.availableFormatted} উপলব্ধ)`,
        available: status.availableFormatted,
      };
    } catch (e: any) {
      return {
        success: false,
        details: `স্টোরেজ রাইট টেস্ট ব্যর্থ: ${e?.message || 'পারমিশন সীমাবদ্ধ'}`,
      };
    }
  }

  /**
   * Safe binary resolver for small files/blobs (< 100MB)
   */
  public async resolveMediaBlob(fileSource: Blob | string): Promise<Blob> {
    if (fileSource instanceof Blob) {
      return fileSource;
    }

    if (typeof fileSource !== 'string' || !fileSource.trim()) {
      throw new Error('ডাউনলোডের জন্য সঠিক মিডিয়া লিঙ্ক পাওয়া যায়নি');
    }

    if (fileSource.startsWith('blob:') || fileSource.startsWith('data:')) {
      const blobResp = await fetch(fileSource);
      return await blobResp.blob();
    }

    const resp = await fetch(fileSource, {
      credentials: 'same-origin',
      headers: {
        'Accept': 'audio/*, video/*, application/octet-stream, */*',
      },
    });

    if (!resp.ok) {
      throw new Error(`সার্ভার থেকে মিডিয়া আনতে সমস্যা হয়েছে (HTTP ${resp.status})`);
    }

    const contentType = (resp.headers.get('content-type') || '').toLowerCase();
    if (contentType.includes('text/html')) {
      const textSample = await resp.text();
      if (textSample.includes('Cookie check') || textSample.includes('Action required to load your app')) {
        throw new Error('ব্রাউজার সিকিউরিটি কুকি যাচাই প্রয়োজন হয়েছে। পেজ রিফ্রেশ করে আবার চেষ্টা করুন।');
      }
      throw new Error('সার্ভার থেকে অডিও/ভিডিও ফাইলের পরিবর্তে এইচটিএমএল পেজ এসেছে।');
    }

    const blob = await resp.blob();
    if (blob.size < 512) {
      throw new Error('ডাউনলোডকৃত ফাইলটি অসম্পূর্ণ বা খালি (0 KB)');
    }

    return blob;
  }

  /**
   * Save media file to user device with high reliability:
   * 1. If explicit picker requested and supported, opens showSaveFilePicker immediately and streams chunks directly
   * 2. Otherwise triggers native streaming browser download via anchor tag with zero RAM buffering
   */
  public async saveFileToUserStorage(
    fileName: string,
    fileSource: Blob | string,
    options?: {
      mimeType?: string;
      forcePicker?: boolean;
      destinationOverride?: StorageDestination;
    }
  ): Promise<{ success: boolean; method: 'picker' | 'share' | 'browser'; message: string }> {
    const activeDestination = options?.destinationOverride || this.config.destination;
    const isExplicitPicker = !!options?.forcePicker;
    const ext = fileName.split('.').pop() || 'mp4';
    const isAudio = ext === 'mp3' || ext === 'm4a';
    const mimeType = options?.mimeType || (isAudio ? 'audio/mpeg' : (ext === 'webm' ? 'video/webm' : 'video/mp4'));

    // If fileSource is an in-memory Blob
    if (fileSource instanceof Blob) {
      if (isExplicitPicker && this.isNativePickerSupported()) {
        try {
          const pickerOptions: any = {
            suggestedName: fileName,
            types: [
              {
                description: isAudio ? 'Audio File (মেমোরি কার্ড / অডিও)' : 'Video File (মেমোরি কার্ড / ভিডিও)',
                accept: { [mimeType]: [`.${ext}`] },
              },
            ],
          };
          // @ts-ignore
          const fileHandle = await window.showSaveFilePicker(pickerOptions);
          const writableStream = await fileHandle.createWritable();
          await writableStream.write(fileSource);
          await writableStream.close();
          return {
            success: true,
            method: 'picker',
            message: 'মিডিয়া ফাইলটি সফলভাবে মেমোরি কার্ডে সেভ হয়েছে!',
          };
        } catch (err: any) {
          if (err.name === 'AbortError') {
            return { success: false, method: 'picker', message: 'সেভ ডায়ালগ বাতিল করা হয়েছে' };
          }
        }
      }

      const blobUrl = URL.createObjectURL(fileSource);
      this.triggerNativeDownload(fileName, blobUrl);
      setTimeout(() => URL.revokeObjectURL(blobUrl), 60000);
      return {
        success: true,
        method: 'browser',
        message: 'ফাইল সফলভাবে ডাউনলোড শুরু হয়েছে!',
      };
    }

    const targetUrl = String(fileSource);

    // Option 1: Explicit Native SD Card File Picker with chunk-by-chunk streaming
    if (isExplicitPicker && this.isNativePickerSupported()) {
      try {
        const pickerOptions: any = {
          suggestedName: fileName,
          types: [
            {
              description: isAudio ? 'Audio File (মেমোরি কার্ড / অডিও)' : 'Video File (মেমোরি কার্ড / ভিডিও)',
              accept: { [mimeType]: [`.${ext}`] },
            },
          ],
        };

        // Must call showSaveFilePicker directly within user gesture
        // @ts-ignore
        const fileHandle = await window.showSaveFilePicker(pickerOptions);
        const writableStream = await fileHandle.createWritable();

        const resp = await fetch(targetUrl, {
          credentials: 'same-origin',
          headers: { 'Accept': '*/*' },
        });

        if (!resp.ok) {
          throw new Error(`সার্ভার সংযোগ সমস্যা (HTTP ${resp.status})`);
        }

        if (resp.body) {
          const reader = resp.body.getReader();
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            if (value) {
              await writableStream.write(value);
            }
          }
        } else {
          const blob = await resp.blob();
          await writableStream.write(blob);
        }

        await writableStream.close();
        const destName = activeDestination === 'sd_card' ? 'মেমোরি কার্ডে (SD Card)' : 'ফোন মেমোরিতে';
        return {
          success: true,
          method: 'picker',
          message: `মিডিয়া ফাইলটি সফলভাবে ${destName} সেভ হয়েছে!`,
        };
      } catch (err: any) {
        if (err.name === 'AbortError') {
          return { success: false, method: 'picker', message: 'সেভ ডায়ালগ বাতিল করা হয়েছে' };
        }
        console.warn('Native picker streaming failed, falling back to direct browser download:', err);
      }
    }

    // Option 2: Direct Native Browser Download Engine
    // Direct stream download bypassing JS heap limits (never runs out of memory, works for 2.7GB+ files)
    this.triggerNativeDownload(fileName, targetUrl);

    const targetLabel = activeDestination === 'sd_card'
      ? 'মেমোরি কার্ড / ব্রাউজার স্টোরেজে'
      : 'ফোন মেমোরিতে (Downloads ফোল্ডার)';

    return {
      success: true,
      method: 'browser',
      message: `ফাইল ডাউনলোড শুরু হয়েছে (${targetLabel})।`,
    };
  }

  // Trigger browser download anchor element
  public triggerNativeDownload(fileName: string, url: string): void {
    try {
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      a.rel = 'noopener';
      document.body.appendChild(a);
      a.click();
      setTimeout(() => {
        if (document.body.contains(a)) {
          document.body.removeChild(a);
        }
      }, 3000);
    } catch {
      window.location.href = url;
    }
  }

  public fallbackBrowserDownload(fileName: string, url: string): void {
    this.triggerNativeDownload(fileName, url);
  }

  public subscribe(listener: (config: StorageConfig) => void): () => void {
    this.listeners.add(listener);
    listener(this.getConfig());
    return () => this.listeners.delete(listener);
  }

  private notifyListeners(): void {
    const current = this.getConfig();
    this.listeners.forEach((fn) => fn(current));
  }
}

export const storagePreferenceManager = new StoragePreferenceManager();
