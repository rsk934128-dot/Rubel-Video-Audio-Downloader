import confetti from 'canvas-confetti';
import { DownloadTask, MediaFormat, VideoMetadata } from '../types';
import { notificationManager } from './notificationManager';
import { storagePreferenceManager } from './storagePreferenceManager';
import { backgroundKeepAlive } from './backgroundKeepAlive';

const STORAGE_KEY = 'video_downloader_history_v1';

// Automated Health Monitor: inspects for '0 MB' or corrupted result states
export function checkStreamResultHealth(task: Partial<DownloadTask>): { isCorrupted: boolean; reason: string } {
  const sizeLower = (task.downloadedSize || '').toLowerCase().trim();
  const totalLower = (task.totalSize || '').toLowerCase().trim();

  // Flag if downloadedSize explicitly indicates 0 MB
  if (sizeLower === '0 mb' || sizeLower === '0.0 mb' || sizeLower === '0 kb' || sizeLower === '0 b') {
    return {
      isCorrupted: true,
      reason: '০ এমবি (0 MB) অসম্পূর্ণ বা ত্রুটিপূর্ণ ফাইল সনাক্ত হয়েছে।',
    };
  }

  // Flag if downloadedBytes is 0 or tiny after completion
  if (task.status === 'completed' && task.downloadedBytes !== undefined && task.downloadedBytes < 1024) {
    return {
      isCorrupted: true,
      reason: 'খালি ডেটা স্ট্রিম (0 Bytes) সনাক্ত হয়েছে।',
    };
  }

  // Check if totalSize is recorded as 0 MB
  if (totalLower === '0 mb' || totalLower === '0.0 mb') {
    return {
      isCorrupted: true,
      reason: 'ত্রুটিপূর্ণ স্ট্রিম সাইজ (0 MB) সনাক্ত হয়েছে।',
    };
  }

  // Flag if marked as corrupted already
  if (task.isCorrupted || task.status === 'corrupted') {
    return {
      isCorrupted: true,
      reason: task.corruptedReason || '০ এমবি অসম্পূর্ণ ফাইল রেকর্ড সনাক্ত হয়েছে।',
    };
  }

  return { isCorrupted: false, reason: '' };
}

// Audit single task and apply corrupted flags if 0 MB or empty
export function auditTaskHealth(task: DownloadTask): DownloadTask {
  const health = checkStreamResultHealth(task);
  if (health.isCorrupted) {
    return {
      ...task,
      status: 'corrupted',
      isCorrupted: true,
      corruptedReason: health.reason,
      error: health.reason,
    };
  }
  return task;
}

// Audit entire history array and flag corrupted items
export function auditAndFlagHistoryHealth(history: DownloadTask[]): { updated: DownloadTask[]; corruptedCount: number } {
  let corruptedCount = 0;
  const updated = history.map(item => {
    const audited = auditTaskHealth(item);
    if (audited.isCorrupted) {
      corruptedCount++;
    }
    return audited;
  });
  return { updated, corruptedCount };
}

// Load history from localStorage and run automated health monitor
export function loadDownloadHistory(): DownloadTask[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed: DownloadTask[] = JSON.parse(raw);
    const { updated } = auditAndFlagHistoryHealth(parsed);
    return updated;
  } catch {
    return [];
  }
}

// Save history to localStorage
export function saveDownloadHistory(history: DownloadTask[]): void {
  try {
    // Keep last 30 items
    const trimmed = history.slice(0, 30).map(item => ({
      ...item,
      // Do not persist huge memory blob URLs across reloads
      fileBlobUrl: undefined,
    }));
    localStorage.setItem(STORAGE_KEY, JSON.stringify(trimmed));
  } catch (e) {
    console.error('Failed to save download history', e);
  }
}

// Trigger real browser download or save directly to SD Card / Phone memory
export function triggerBrowserDownload(fileName: string, targetUrl: string): void {
  storagePreferenceManager.saveFileToUserStorage(fileName, targetUrl).catch((err) => {
    console.warn('Storage save warning:', err);
  });
}

// Sanitize filename for safe OS saving without breaking UTF-16 surrogate pairs
export function sanitizeFilename(name: string, ext: string): string {
  const noSurrogates = String(name || '').replace(
    /[\uD800-\uDBFF](?![\uDC00-\uDFFF])|(?:[^\uD800-\uDBFF]|^)[\uDC00-\uDFFF]/g,
    ''
  );
  const cleaned = noSurrogates.replace(/[\\/:*?"<>|\x00-\x1F\x7F]/g, '_').trim();
  const sliced = Array.from(cleaned).slice(0, 80).join('').trim();
  return `${sliced || 'download'}.${ext}`;
}

// Map internal format to upstream API format parameter
export function getApiFormat(format: MediaFormat): string {
  if (format.id && format.id.startsWith('tiktok-')) {
    return format.id;
  }
  if (format.type === 'audio') {
    if (format.ext === 'm4a') return 'm4a';
    if (format.ext === 'webm') return 'webm';
    return 'mp3';
  }
  const label = (format.label + ' ' + (format.resolution || '')).toLowerCase();
  if (label.includes('1080')) return '1080';
  if (label.includes('720')) return '720';
  if (label.includes('480')) return '480';
  if (label.includes('360')) return '360';
  if (label.includes('4k') || label.includes('2160')) return '4k';
  if (label.includes('1440')) return '1440';
  return '720';
}

// Safely parse total bytes from size string like '2.7 GB', '61.8 MB', '320 KB'
export function parseTotalBytes(sizeStr: string): number {
  if (!sizeStr) return 15 * 1024 * 1024;
  const match = sizeStr.match(/([\d.]+)\s*(GB|MB|KB)?/i);
  if (!match) return 15 * 1024 * 1024;
  const val = parseFloat(match[1]);
  const unit = (match[2] || 'MB').toUpperCase();
  if (unit === 'GB') return Math.round(val * 1024 * 1024 * 1024);
  if (unit === 'KB') return Math.round(val * 1024);
  return Math.round(val * 1024 * 1024);
}

// Format downloaded bytes according to total size display
export function formatDownloadedBytes(bytes: number, totalSizeStr: string): string {
  if (totalSizeStr && totalSizeStr.toUpperCase().includes('GB')) {
    const gb = bytes / (1024 * 1024 * 1024);
    return `${gb.toFixed(2)} GB`;
  }
  const mb = Math.max(0.1, bytes / (1024 * 1024));
  return `${mb.toFixed(1)} MB`;
}

// Download execution engine: performs real server-assisted conversion and verified byte streaming for the user's TARGET URL
export function startDownloadSimulation(
  video: VideoMetadata,
  format: MediaFormat,
  onProgress: (task: DownloadTask) => void,
  onComplete: (task: DownloadTask) => void,
  onError: (taskId: string, error: string) => void
): { cancel: () => void; taskId: string } {
  const taskId = `dl-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
  const cleanTitle = video.title.replace(/[\\/:*?"<>|]/g, ' ').trim();
  const fileName = sanitizeFilename(cleanTitle, format.ext);

  // Parse estimated size with accurate GB/MB multiplier
  const totalBytes = parseTotalBytes(format.estimatedSize);
  const initialBytes = Math.round(totalBytes * 0.05);

  let isCancelled = false;
  let pollingInterval: any = null;
  let completionTriggered = false;
  const abortController = new AbortController();

  // Register task with background keep-alive engine (persists across screen lock and minimized tabs)
  backgroundKeepAlive.registerDownload(taskId, video.title, video.thumbnail);

  const wrappedOnProgress = (t: DownloadTask) => {
    if (isCancelled) return;
    backgroundKeepAlive.updateDownloadProgress(taskId, t.progress, t.speed, t.eta);
    onProgress(t);
  };

  const wrappedOnComplete = (t: DownloadTask) => {
    backgroundKeepAlive.unregisterDownload(taskId);
    if (!isCancelled) {
      onComplete(t);
    }
  };

  const wrappedOnError = (id: string, err: string) => {
    backgroundKeepAlive.unregisterDownload(id);
    onError(id, err);
  };

  const task: DownloadTask = {
    id: taskId,
    videoId: video.id,
    originalUrl: video.originalUrl,
    title: video.title,
    platform: video.platform,
    thumbnail: video.thumbnail,
    format,
    progress: 8,
    speed: 'Connecting...',
    downloadedBytes: initialBytes,
    totalBytes,
    downloadedSize: formatDownloadedBytes(initialBytes, format.estimatedSize),
    totalSize: format.estimatedSize,
    eta: 'Connecting...',
    status: 'extracting',
    createdAt: Date.now(),
    fileName,
  };

  wrappedOnProgress({ ...task });

  const toSameOriginDownloadUrl = (rawUrl: string, resolvedFileName: string): string => {
    if (!rawUrl) return rawUrl;
    if (rawUrl.startsWith('/api/') || rawUrl.startsWith('blob:') || rawUrl.startsWith('data:')) {
      return rawUrl;
    }
    if (typeof window !== 'undefined' && rawUrl.startsWith(window.location.origin + '/api/')) {
      return rawUrl;
    }
    return `/api/proxy-download?url=${encodeURIComponent(rawUrl)}&originUrl=${encodeURIComponent(video.originalUrl)}&filename=${encodeURIComponent(resolvedFileName)}&type=${format.type}&isAudio=${format.type === 'audio'}&stream=true`;
  };

  const fetchWithTimeoutAndAbort = async (input: string, init: RequestInit, timeoutMs: number): Promise<globalThis.Response> => {
    const localController = new AbortController();
    const timeoutId = setTimeout(() => localController.abort(new Error('Request timeout')), timeoutMs);
    const onParentAbort = () => localController.abort(abortController.signal.reason);

    if (abortController.signal.aborted) {
      clearTimeout(timeoutId);
      throw new DOMException('Aborted', 'AbortError');
    }

    abortController.signal.addEventListener('abort', onParentAbort, { once: true });
    try {
      return await fetch(input, { ...init, signal: localController.signal });
    } finally {
      clearTimeout(timeoutId);
      abortController.signal.removeEventListener('abort', onParentAbort);
    }
  };

  const executeVerifiedMediaDownload = async (
    finalName: string,
    rawDownloadUrl: string,
    progressFloor: number
  ): Promise<void> => {
    if (isCancelled) return;

    const downloadEndpoint = toSameOriginDownloadUrl(rawDownloadUrl, finalName);
    const batterySaver = storagePreferenceManager.isBatterySaverEnabled();

    task.status = 'downloading';
    task.fileBlobUrl = downloadEndpoint;
    if (!task.directUrl) {
      task.directUrl = rawDownloadUrl;
    }
    task.progress = Math.max(task.progress, progressFloor);
    task.speed = totalBytes >= 100 * 1024 * 1024 ? 'Direct Stream' : 'Connecting...';
    task.eta = totalBytes >= 100 * 1024 * 1024 ? 'বড় ফাইল ডাউনলোড শুরু...' : 'Streaming...';
    wrappedOnProgress({ ...task });

    const streamResult = await storagePreferenceManager.streamAndSaveMedia(finalName, downloadEndpoint, {
      estimatedBytes: totalBytes,
      signal: abortController.signal,
      onProgress: (info) => {
        if (isCancelled) return;
        const mappedProgress = Math.min(
          99,
          Math.max(progressFloor, Math.round(progressFloor + (info.progress / 100) * (99 - progressFloor)))
        );
        task.status = 'downloading';
        task.progress = Math.max(task.progress, mappedProgress);
        task.downloadedBytes = info.receivedBytes;
        if (info.totalBytes > 0) {
          task.totalBytes = info.totalBytes;
          const totalUnit = info.totalBytes >= 1024 * 1024 * 1024 ? 'GB' : 'MB';
          task.totalSize = formatDownloadedBytes(info.totalBytes, totalUnit);
        }
        task.downloadedSize = formatDownloadedBytes(info.receivedBytes, task.totalSize);
        task.speed = batterySaver ? `${info.speedText} • Eco` : info.speedText;
        task.eta = info.etaText;
        wrappedOnProgress({ ...task });
      },
    });

    if (isCancelled) return;

    const finalBytes = streamResult.verifiedBytes > 0 ? streamResult.verifiedBytes : totalBytes;
    const sizeUnit = finalBytes >= 1024 * 1024 * 1024 ? 'GB' : 'MB';
    const formattedFinalSize = formatDownloadedBytes(finalBytes, sizeUnit);

    task.status = 'completed';
    task.progress = 100;
    task.speed = 'Finished';
    task.eta = '0s';
    task.downloadedBytes = finalBytes;
    task.totalBytes = finalBytes;
    task.downloadedSize = formattedFinalSize;
    task.totalSize = formattedFinalSize;
    task.fileBlobUrl = streamResult.mode === 'blob' && streamResult.blobUrl ? streamResult.blobUrl : downloadEndpoint;

    try {
      confetti({
        particleCount: 80,
        spread: 60,
        origin: { y: 0.8 },
      });
    } catch {}

    notificationManager.notifyDownloadComplete(finalName, format.quality);
    wrappedOnComplete({ ...task });
  };

  // Execution flow for the TARGET link:
  // 1. If format already contains directDownloadUrl, verify headers & stream directly!
  // 2. Otherwise send target URL to backend /api/convert/start
  // 3. Poll /api/convert/progress until stream is ready
  // 4. Verify & stream bytes (<=100MB Blob instant download, >100MB zero-RAM native handoff)
  const runConversionFlow = async () => {
    try {
      if (format.directDownloadUrl) {
        notificationManager.notifyDownloadStarted(fileName);
        const engineName = format.id.includes('4k')
          ? 'Official 4K 60fps Direct Stream'
          : (task.platform === 'tiktok'
              ? 'TikTok No-Watermark Direct Bypass'
              : (task.platform === 'direct' ? 'Direct Media Stream Bypass' : 'High-Speed Stream Proxy'));

        task.engine = engineName;
        task.directUrl = format.directDownloadUrl;
        await executeVerifiedMediaDownload(fileName, format.directDownloadUrl, 15);
        return;
      }

      notificationManager.notifyDownloadStarted(fileName);
      task.status = 'extracting';
      task.progress = 12;
      task.eta = 'Connecting to media stream...';
      task.speed = 'Initiating...';
      wrappedOnProgress({ ...task });

      let currentExtractProgress = 12;
      const extractionMessages = [
        'Connecting to streaming nodes...',
        'Resolving media stream headers...',
        'Bypassing upstream rate-limits...',
        'Preparing direct high-speed pipeline...',
      ];
      let msgIdx = 0;

      const batterySaver = storagePreferenceManager.isBatterySaverEnabled();
      const extractIntervalMs = batterySaver ? 2000 : 700;
      const extractStep = batterySaver ? 6 : 3;

      const extractInterval = setInterval(() => {
        if (isCancelled || task.status !== 'extracting') {
          clearInterval(extractInterval);
          return;
        }
        currentExtractProgress = Math.min(38, currentExtractProgress + extractStep);
        msgIdx = (msgIdx + 1) % extractionMessages.length;
        task.progress = currentExtractProgress;
        task.eta = extractionMessages[msgIdx];
        task.speed = batterySaver ? 'Battery Saver' : 'Active';
        wrappedOnProgress({ ...task });
      }, extractIntervalMs);

      const apiFmt = getApiFormat(format);
      let startResp: globalThis.Response;
      try {
        startResp = await fetchWithTimeoutAndAbort(
          '/api/convert/start',
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ url: video.originalUrl, format: apiFmt }),
          },
          60000
        );
      } finally {
        clearInterval(extractInterval);
      }

      if (isCancelled) return;

      let startData: any = null;
      try {
        startData = await startResp.json();
      } catch {
        startData = null;
      }

      if (!startResp.ok || !startData?.success) {
        const errMsg = startData?.error || 'এই গান/ভিডিওটি এই মুহূর্তে সার্ভার থেকে ডাউনলোড করা যায়নি। পুনরায় চেষ্টা করুন অথবা নিচের ১-ক্লিক মিরর ব্যবহার করুন।';
        task.status = 'failed';
        task.error = errMsg;
        task.eta = 'Failed';
        wrappedOnProgress({ ...task });
        wrappedOnError(taskId, errMsg);
        return;
      }

      task.engine = startData.engine || 'Native Stream Bypass';

      const genericTitles = ['YouTube Video', 'YouTube Video Stream', 'Universal Web Media Stream', 'Media Download'];
      const effectiveTitle = (startData.title && (genericTitles.includes(video.title) || video.title.startsWith('YouTube_')))
        ? String(startData.title).replace(/[\\/:*?"<>|]/g, ' ').trim()
        : cleanTitle;
      const effectiveFileName = sanitizeFilename(effectiveTitle, format.ext);
      task.title = startData.title && genericTitles.includes(video.title) ? String(startData.title) : task.title;
      task.fileName = effectiveFileName;

      // Direct media file or immediate stream URL: stream & verify real bytes now
      if (startData.isDirect && startData.downloadUrl) {
        task.directUrl = startData.directUrl || startData.downloadUrl;
        await executeVerifiedMediaDownload(effectiveFileName, startData.downloadUrl, 30);
        return;
      }

      const convertId = startData.id;
      const progressUrl = startData.progressUrl;

      if (!convertId) {
        throw new Error('No conversion ID returned for target stream');
      }

      task.status = 'converting';
      task.progress = Math.max(task.progress, 35);
      task.eta = format.type === 'audio' ? 'অডিও এনকোডিং চলছে...' : 'ভিডিও এনকোডিং চলছে...';
      task.speed = 'Preparing...';
      wrappedOnProgress({ ...task });

      const pollBatterySaver = storagePreferenceManager.isBatterySaverEnabled();
      const pollIntervalMs = pollBatterySaver ? 5000 : 1500;
      let attempts = 0;
      const maxAttempts = Math.ceil(360000 / pollIntervalMs);
      let isPollInFlight = false;

      pollingInterval = setInterval(async () => {
        if (isCancelled || completionTriggered) {
          clearInterval(pollingInterval);
          return;
        }
        if (isPollInFlight) return;
        isPollInFlight = true;

        attempts++;
        try {
          const pollResp = await fetchWithTimeoutAndAbort(
            `/api/convert/progress?id=${encodeURIComponent(convertId)}&progressUrl=${encodeURIComponent(progressUrl || '')}`,
            {},
            10000
          );

          if (pollResp.ok && !isCancelled && !completionTriggered) {
            const pData = await pollResp.json();

            if (pData.success && pData.downloadUrl) {
              completionTriggered = true;
              clearInterval(pollingInterval);

              if (pData.title && (genericTitles.includes(video.title) || video.title.startsWith('YouTube_'))) {
                const resolvedClean = String(pData.title).replace(/[\\/:*?"<>|]/g, ' ').trim();
                if (resolvedClean) {
                  task.title = String(pData.title);
                  task.fileName = sanitizeFilename(resolvedClean, format.ext);
                }
              }

              const finalName = task.fileName || effectiveFileName;
              const realDownloadUrl = pData.downloadUrl.startsWith('/api/')
                ? pData.downloadUrl
                : `/api/proxy-download?url=${encodeURIComponent(pData.downloadUrl)}&originUrl=${encodeURIComponent(video.originalUrl)}&filename=${encodeURIComponent(finalName)}&type=${format.type}&isAudio=${format.type === 'audio'}&stream=true`;
              task.directUrl = pData.downloadUrl;

              try {
                await executeVerifiedMediaDownload(finalName, realDownloadUrl, Math.max(55, task.progress));
              } catch (dlErr: any) {
                if (isCancelled || dlErr?.name === 'AbortError') return;
                const dlErrMsg = dlErr?.message || 'ফাইল ডাউনলোড করতে সমস্যা হয়েছে। পুনরায় চেষ্টা করুন।';
                task.status = 'failed';
                task.error = dlErrMsg;
                task.eta = 'Failed';
                wrappedOnProgress({ ...task });
                wrappedOnError(taskId, dlErrMsg);
              }
              return;
            } else if (pData.error) {
              completionTriggered = true;
              clearInterval(pollingInterval);
              task.status = 'failed';
              task.error = pData.error || 'ফাইল কনভার্সন ব্যর্থ হয়েছে। পুনরায় চেষ্টা করুন।';
              task.eta = 'Failed';
              wrappedOnProgress({ ...task });
              wrappedOnError(taskId, task.error);
              return;
            } else {
              // Map server preparation progress smoothly: 35% -> 65%, leaving 65% -> 100% for real byte streaming
              const rawProgress = pData.progress || 0;
              const elapsedFactor = (attempts * pollIntervalMs) / 1500;
              const mapped = Math.min(65, Math.max(35, Math.round(35 + (rawProgress / 1000) * 25 + Math.min(8, elapsedFactor * 0.5))));
              task.progress = Math.max(task.progress, mapped);
              task.status = 'converting';
              task.speed = pollBatterySaver ? 'Preparing • Eco' : 'Encoding...';
              task.eta = `${Math.max(2, Math.round(((maxAttempts - attempts) * pollIntervalMs) / 1000))}s`;
              task.downloadedBytes = Math.round(totalBytes * (task.progress / 100) * 0.35);
              task.downloadedSize = formatDownloadedBytes(task.downloadedBytes, format.estimatedSize);
              wrappedOnProgress({ ...task });
            }
          }
        } catch (pollErr: any) {
          if (!isCancelled && pollErr?.name !== 'AbortError') {
            console.warn('Progress poll check:', pollErr);
          }
        } finally {
          isPollInFlight = false;
        }

        if (attempts >= maxAttempts && !completionTriggered && !isCancelled) {
          clearInterval(pollingInterval);
          task.status = 'failed';
          task.error = 'টার্গেট লিঙ্ক প্রসেস হতে অতিরিক্ত সময় লেগেছে। পুনরায় চেষ্টা করুন বা সরাসরি বাইপাস ফরম্যাট বেছে নিন।';
          task.eta = 'Timed out';
          wrappedOnProgress({ ...task });
          wrappedOnError(taskId, task.error);
        }
      }, pollIntervalMs);
    } catch (startErr: any) {
      if (isCancelled || startErr?.name === 'AbortError') return;
      const errMsg = startErr?.message || 'সার্ভারের সাথে সংযোগ ব্যর্থ হয়েছে। পুনরায় চেষ্টা করুন।';
      task.status = 'failed';
      task.error = errMsg;
      task.eta = 'Failed';
      wrappedOnProgress({ ...task });
      wrappedOnError(taskId, errMsg);
    }
  };

  // Start conversion for target URL
  runConversionFlow();

  return {
    taskId,
    cancel: () => {
      isCancelled = true;
      if (pollingInterval) clearInterval(pollingInterval);
      try {
        abortController.abort(new DOMException('Cancelled by user', 'AbortError'));
      } catch {}
      task.status = 'failed';
      task.error = 'Cancelled by user';
      wrappedOnError(taskId, 'Cancelled');
    },
  };
}
