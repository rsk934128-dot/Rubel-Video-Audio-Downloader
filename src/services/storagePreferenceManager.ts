import { StorageConfig, StorageDestination, StorageAccessStatus } from '../types';

const STORAGE_PREF_KEY = 'video_downloader_storage_config_v1';
const MAX_BLOB_RAM_BYTES = 100 * 1024 * 1024; // 100 MB safety ceiling for in-memory Blob verification
const RANGE_PROBE_BYTES = 64 * 1024; // 64 KB initial probe
const RANGE_CHUNK_BYTES = 8 * 1024 * 1024; // 8 MB slice per HTTP request (avoids HTTP/1 proxy caps)

export interface StreamSaveProgress {
  receivedBytes: number;
  totalBytes: number;
  progress: number;
  speedText: string;
  etaText: string;
}

export interface StreamSaveResult {
  mode: 'blob' | 'native';
  url: string;
  blobUrl?: string;
  verifiedBytes: number;
  totalBytes: number;
}

function parseContentRangeTotal(contentRange: string | null): number {
  if (!contentRange) return 0;
  const match = contentRange.match(/\/(\d+)\s*$/);
  return match ? Number(match[1]) : 0;
}

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
  batterySaverMode: false,
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

  public isBatterySaverEnabled(): boolean {
    return Boolean(this.config.batterySaverMode);
  }

  public setBatterySaverMode(enabled: boolean): void {
    this.setConfig({ batterySaverMode: enabled });
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
   * Verified streaming downloader:
   * - Probes with a lightweight Range request first so multi-hundred-MB/GB files never hit HTTP/1 proxy caps
   * - Streams files <= 100 MB in 8 MB verified slices (or full 200 stream) with automatic transient 500/502/503 retries
   * - Automatically hands off files > 100 MB to the browser's native Download Manager with zero RAM buffering
   */
  public async streamAndSaveMedia(
    fileName: string,
    url: string,
    options?: {
      mimeType?: string;
      estimatedBytes?: number;
      signal?: AbortSignal;
      onProgress?: (info: StreamSaveProgress) => void;
    }
  ): Promise<StreamSaveResult> {
    if (!url || typeof url !== 'string' || !url.trim()) {
      throw new Error('ডাউনলোডের জন্য সঠিক মিডিয়া লিঙ্ক পাওয়া যায়নি');
    }

    if (url.startsWith('blob:') || url.startsWith('data:')) {
      this.triggerNativeDownload(fileName, url);
      const est = options?.estimatedBytes || 1024;
      return {
        mode: 'blob',
        url,
        blobUrl: url,
        verifiedBytes: est,
        totalBytes: est,
      };
    }

    const ext = (fileName.split('.').pop() || 'mp4').toLowerCase();
    const isAudio = ext === 'mp3' || ext === 'm4a' || ext === 'aac' || ext === 'opus' || ext === 'wav';
    const defaultMime = isAudio
      ? (ext === 'm4a' ? 'audio/mp4' : 'audio/mpeg')
      : (ext === 'webm' ? 'video/webm' : 'video/mp4');

    const fetchWithTransientRetry = async (reqHeaders: Record<string, string>): Promise<globalThis.Response> => {
      let lastResp: globalThis.Response | null = null;
      for (let attempt = 0; attempt < 3; attempt++) {
        if (options?.signal?.aborted) {
          throw new DOMException('Aborted', 'AbortError');
        }
        try {
          const resp = await fetch(url, {
            credentials: 'same-origin',
            headers: {
              'Accept': 'audio/*, video/*, application/octet-stream, */*',
              ...reqHeaders,
            },
            signal: options?.signal,
          });
          if (resp.status >= 500 && resp.status <= 503 && attempt < 2) {
            lastResp = resp;
            try { await resp.body?.cancel(); } catch {}
            await new Promise((r) => setTimeout(r, 600 * (attempt + 1)));
            continue;
          }
          return resp;
        } catch (err: any) {
          if (err?.name === 'AbortError' || options?.signal?.aborted || attempt === 2) {
            throw err;
          }
          await new Promise((r) => setTimeout(r, 600 * (attempt + 1)));
        }
      }
      return lastResp!;
    };

    const validateAndCheckError = async (resp: globalThis.Response): Promise<void> => {
      if (!resp.ok && resp.status !== 206) {
        let serverMsg = '';
        try {
          const errType = (resp.headers.get('content-type') || '').toLowerCase();
          if (errType.includes('application/json')) {
            const j = await resp.json();
            serverMsg = j?.error || j?.message || '';
          }
        } catch {}
        throw new Error(serverMsg || `সার্ভার থেকে মিডিয়া আনতে সমস্যা হয়েছে (HTTP ${resp.status})`);
      }

      const contentType = (resp.headers.get('content-type') || '').toLowerCase();
      if (contentType.includes('text/html')) {
        const textSample = await resp.text().catch(() => '');
        if (textSample.includes('Cookie check') || textSample.includes('Action required to load your app')) {
          throw new Error('ব্রাউজার সিকিউরিটি কুকি যাচাই প্রয়োজন হয়েছে। পেজ রিফ্রেশ করে আবার চেষ্টা করুন।');
        }
        throw new Error('সার্ভার থেকে অডিও/ভিডিও ফাইলের পরিবর্তে এইচটিএমএল পেজ এসেছে।');
      }

      if (contentType.includes('application/json')) {
        let jsonMsg = 'সার্ভার থেকে অডিও/ভিডিও স্ট্রিমের পরিবর্তে ত্রুটি বার্তা এসেছে।';
        try {
          const j = await resp.json();
          if (j?.error || j?.message) jsonMsg = j.error || j.message;
        } catch {}
        throw new Error(jsonMsg);
      }
    };

    // Step 1: Lightweight 64 KB Range probe (or full response if server doesn't support Range)
    let firstResp = await fetchWithTransientRetry({
      'Range': `bytes=0-${RANGE_PROBE_BYTES - 1}`,
    });

    if (firstResp.status === 416 || firstResp.status === 400) {
      try { await firstResp.body?.cancel(); } catch {}
      firstResp = await fetchWithTransientRetry({});
    }

    await validateAndCheckError(firstResp);

    const contentType = (firstResp.headers.get('content-type') || '').toLowerCase();
    const resolvedMime =
      options?.mimeType ||
      (contentType && !contentType.includes('text/') && !contentType.includes('json')
        ? contentType.split(';')[0].trim()
        : defaultMime);

    const headerLen = Number(firstResp.headers.get('content-length') || '0');
    const contentRangeTotal = parseContentRangeTotal(firstResp.headers.get('content-range'));
    const origSize = Number(firstResp.headers.get('x-original-filesize') || '0');
    const estimated = options?.estimatedBytes || 0;
    const knownTotal = contentRangeTotal > 0 ? contentRangeTotal : (headerLen > 0 ? headerLen : (origSize > 0 ? origSize : estimated));

    // Zero-RAM handoff for large files (> 100 MB) so 200MB - 3GB+ downloads never exceed JS heap memory
    if (
      knownTotal > MAX_BLOB_RAM_BYTES ||
      (contentRangeTotal === 0 && headerLen === 0 && origSize === 0 && estimated > MAX_BLOB_RAM_BYTES)
    ) {
      try {
        await firstResp.body?.cancel();
      } catch {}
      this.triggerNativeDownload(fileName, url);
      return {
        mode: 'native',
        url,
        verifiedBytes: knownTotal,
        totalBytes: knownTotal,
      };
    }

    const startTime = Date.now();
    let lastReportTime = 0;
    const reportIntervalMs = this.isBatterySaverEnabled() ? 350 : 150;

    const reportProgress = (receivedBytes: number, effectiveTotal: number, forceReport = false) => {
      if (!options?.onProgress) return;
      const now = Date.now();
      if (!forceReport && now - lastReportTime < reportIntervalMs) return;
      lastReportTime = now;
      const elapsedSec = Math.max(0.2, (now - startTime) / 1000);
      const bytesPerSec = receivedBytes / elapsedSec;
      const mbPerSec = bytesPerSec / (1024 * 1024);
      const ratio = effectiveTotal > 0 ? Math.min(0.99, receivedBytes / effectiveTotal) : 0.5;
      const remainingBytes = Math.max(0, effectiveTotal - receivedBytes);
      const etaSec = bytesPerSec > 1024 && effectiveTotal > 0 ? Math.max(1, Math.round(remainingBytes / bytesPerSec)) : 0;

      options.onProgress({
        receivedBytes,
        totalBytes: effectiveTotal,
        progress: Math.round(ratio * 100),
        speedText: `${mbPerSec.toFixed(1)} MB/s`,
        etaText: etaSec > 0 ? `${etaSec}s` : 'Streaming...',
      });
    };

    const chunks: Uint8Array[] = [];
    let receivedBytes = 0;

    const consumeResponseStream = async (resp: globalThis.Response, expectedTotal: number): Promise<'ok' | 'overflow'> => {
      if (!resp.body) {
        const ab = await resp.arrayBuffer();
        const bytes = new Uint8Array(ab);
        receivedBytes += bytes.byteLength;
        if (receivedBytes > MAX_BLOB_RAM_BYTES) {
          return 'overflow';
        }
        chunks.push(bytes);
        reportProgress(receivedBytes, expectedTotal);
        return 'ok';
      }

      const reader = resp.body.getReader();
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        if (value && value.byteLength > 0) {
          receivedBytes += value.byteLength;
          if (receivedBytes > MAX_BLOB_RAM_BYTES) {
            chunks.length = 0;
            try { await reader.cancel(); } catch {}
            return 'overflow';
          }
          chunks.push(value);
          const dynamicTotal = expectedTotal > 0 ? expectedTotal : Math.max(knownTotal, Math.round(receivedBytes * 1.15));
          reportProgress(receivedBytes, dynamicTotal);
        }
      }
      return 'ok';
    };

    // Consume first response (either full 200 stream or first 206 Range slice)
    const firstStatus = await consumeResponseStream(firstResp, knownTotal);
    if (firstStatus === 'overflow') {
      chunks.length = 0;
      this.triggerNativeDownload(fileName, url);
      return {
        mode: 'native',
        url,
        verifiedBytes: receivedBytes,
        totalBytes: Math.max(knownTotal, receivedBytes),
      };
    }

    // Step 2: If server returned 206 Partial Content and more bytes remain, fetch remaining in 8 MB slices
    if (firstResp.status === 206 && contentRangeTotal > 0 && receivedBytes < contentRangeTotal) {
      while (receivedBytes < contentRangeTotal) {
        if (options?.signal?.aborted) {
          chunks.length = 0;
          throw new DOMException('Aborted', 'AbortError');
        }
        const rangeStart = receivedBytes;
        const rangeEnd = Math.min(contentRangeTotal - 1, rangeStart + RANGE_CHUNK_BYTES - 1);
        const sliceResp = await fetchWithTransientRetry({
          'Range': `bytes=${rangeStart}-${rangeEnd}`,
        });
        await validateAndCheckError(sliceResp);

        if (sliceResp.status === 200) {
          chunks.length = 0;
          receivedBytes = 0;
          const fullState = await consumeResponseStream(sliceResp, contentRangeTotal);
          if (fullState === 'overflow') {
            chunks.length = 0;
            this.triggerNativeDownload(fileName, url);
            return {
              mode: 'native',
              url,
              verifiedBytes: receivedBytes,
              totalBytes: Math.max(contentRangeTotal, receivedBytes),
            };
          }
          break;
        }

        const beforeSliceBytes = receivedBytes;
        const sliceState = await consumeResponseStream(sliceResp, contentRangeTotal);
        if (sliceState === 'overflow') {
          chunks.length = 0;
          this.triggerNativeDownload(fileName, url);
          return {
            mode: 'native',
            url,
            verifiedBytes: receivedBytes,
            totalBytes: Math.max(contentRangeTotal, receivedBytes),
          };
        }
        if (receivedBytes === beforeSliceBytes) {
          break;
        }
        reportProgress(receivedBytes, contentRangeTotal, true);
      }
    }

    if (receivedBytes < 512) {
      chunks.length = 0;
      throw new Error('ডাউনলোডকৃত ফাইলটি অসম্পূর্ণ বা খালি (0 KB)');
    }

    const blob = new Blob(chunks, { type: resolvedMime });
    chunks.length = 0;

    if (blob.size < 512) {
      throw new Error('ডাউনলোডকৃত ফাইলটি অসম্পূর্ণ বা খালি (0 KB)');
    }

    const blobUrl = URL.createObjectURL(blob);
    this.triggerNativeDownload(fileName, blobUrl);

    return {
      mode: 'blob',
      url,
      blobUrl,
      verifiedBytes: blob.size,
      totalBytes: blob.size,
    };
  }

  /**
   * Save media file to user device with high reliability:
   * 1. If explicit picker requested and supported, opens showSaveFilePicker immediately and streams chunks directly
   * 2. Otherwise triggers native streaming browser download via anchor tag
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
      setTimeout(() => URL.revokeObjectURL(blobUrl), 600000);
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

  // Trigger browser download anchor element reliably (works for blob: and large /api/proxy-download streams)
  public triggerNativeDownload(fileName: string, url: string): void {
    try {
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      a.rel = 'noopener noreferrer';
      a.style.display = 'none';
      document.body.appendChild(a);
      a.click();
      setTimeout(() => {
        if (document.body.contains(a)) {
          document.body.removeChild(a);
        }
      }, 5000);

      // For large (>100MB) non-blob attachment URLs after async conversion in a top-level browser/WebView,
      // also perform a gentle attachment location handoff so Android Download Manager / Mobile Chrome saves it.
      const hasUserActivation =
        typeof navigator !== 'undefined' && 'userActivation' in navigator
          ? Boolean((navigator as any).userActivation?.isActive)
          : true;
      const isBlobOrData = url.startsWith('blob:') || url.startsWith('data:');
      const isServerAttachmentUrl =
        url.startsWith('/api/') ||
        (typeof window !== 'undefined' && url.startsWith(window.location.origin + '/api/'));
      const inIframe = typeof window !== 'undefined' && window.self !== window.top;

      if (!hasUserActivation && !isBlobOrData && isServerAttachmentUrl && !inIframe) {
        setTimeout(() => {
          try {
            window.location.assign(url);
          } catch {}
        }, 180);
      }
    } catch {
      try {
        window.location.assign(url);
      } catch {}
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
