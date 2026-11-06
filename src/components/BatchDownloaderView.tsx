import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  Download, 
  Play, 
  Pause, 
  RotateCcw, 
  Trash2, 
  CheckCircle2, 
  AlertCircle, 
  Clock, 
  FileText, 
  Upload, 
  Clipboard, 
  Sparkles, 
  Layers, 
  ArrowRight, 
  ExternalLink, 
  ListFilter,
  Check,
  Zap,
  Youtube,
  Facebook,
  Instagram,
  Tv,
  Globe
} from 'lucide-react';
import { 
  BatchQueueItem, 
  DownloadTask, 
  Language, 
  MediaFormat, 
  PlatformType, 
  VideoMetadata 
} from '../types';
import { 
  detectPlatform, 
  extractMultipleUrlsFromText, 
  extractVideoInfo, 
  BATCH_FORMAT_PRESETS
} from '../services/videoExtractor';
import { 
  startDownloadSimulation, 
  triggerBrowserDownload, 
  saveDownloadHistory 
} from '../services/downloadManager';
import { getTranslation } from '../utils/translations';

interface Props {
  language: Language;
  onTaskCompleted: (task: DownloadTask) => void;
  onSwitchToSingle: (url?: string) => void;
}

export const BatchDownloaderView: React.FC<Props> = ({
  language,
  onTaskCompleted,
  onSwitchToSingle,
}) => {
  const t = getTranslation(language);
  const [rawInput, setRawInput] = useState<string>('');
  const [selectedPresetId, setSelectedPresetId] = useState<string>('batch-mp3-320');
  const [queue, setQueue] = useState<BatchQueueItem[]>([]);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [activeItemId, setActiveItemId] = useState<string | null>(null);
  const [autoDownloadToDisk, setAutoDownloadToDisk] = useState<boolean>(true);
  const [copyFeedback, setCopyFeedback] = useState<boolean>(false);

  // Cancellation ref for currently active download task
  const cancelActiveTaskRef = useRef<(() => void) | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const isProcessingRef = useRef<boolean>(false);
  const isPausedRef = useRef<boolean>(false);
  const queueRef = useRef<BatchQueueItem[]>([]);

  // Keep refs in sync for asynchronous loops
  useEffect(() => {
    isProcessingRef.current = isProcessing;
    isPausedRef.current = isPaused;
    queueRef.current = queue;
  }, [isProcessing, isPaused, queue]);

  // Detected URLs count from textarea
  const detectedUrls = extractMultipleUrlsFromText(rawInput);

  // Current selected default format
  const activePreset = BATCH_FORMAT_PRESETS.find(p => p.id === selectedPresetId) || BATCH_FORMAT_PRESETS[0];

  // Handle pasting from clipboard
  const handlePasteClipboard = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text) {
        setRawInput(prev => prev ? `${prev}\n${text}` : text);
        setCopyFeedback(true);
        setTimeout(() => setCopyFeedback(false), 1500);
      }
    } catch {
      // Ignore clipboard permission errors
    }
  };

  // Import links from a .txt file
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content) {
        setRawInput(prev => prev ? `${prev}\n${content}` : content);
      }
    };
    reader.readAsText(file);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Add detected URLs into queue
  const handleAddToQueue = () => {
    if (detectedUrls.length === 0) return;

    const newItems: BatchQueueItem[] = detectedUrls.map((url, idx) => {
      const platform = detectPlatform(url);
      return {
        id: `batch-${Date.now()}-${idx}-${Math.random().toString(36).slice(2, 6)}`,
        originalUrl: url,
        platform,
        status: 'pending',
        selectedFormat: activePreset.format,
        progress: 0,
        speed: '0.0 MB/s',
        eta: '--',
        downloadedSize: '0 MB',
        totalSize: activePreset.format.estimatedSize,
      };
    });

    setQueue(prev => [...prev, ...newItems]);
    setRawInput('');
  };

  // Sequential Queue Runner
  const processNextInQueue = useCallback(async () => {
    if (!isProcessingRef.current || isPausedRef.current) {
      return;
    }

    const currentQueue = queueRef.current;
    // Find next pending or queued item
    const nextIndex = currentQueue.findIndex(item => item.status === 'pending' || item.status === 'queued');

    if (nextIndex === -1) {
      // All items completed or failed!
      setIsProcessing(false);
      setActiveItemId(null);
      return;
    }

    const currentItem = currentQueue[nextIndex];
    setActiveItemId(currentItem.id);

    // Update status to 'extracting'
    setQueue(prev => prev.map(it => it.id === currentItem.id ? { ...it, status: 'extracting', progress: 5 } : it));

    try {
      // Step 1: Extract Video Metadata if needed
      let videoMeta = currentItem.video;
      if (!videoMeta) {
        videoMeta = await extractVideoInfo(currentItem.originalUrl);
        setQueue(prev => prev.map(it => 
          it.id === currentItem.id 
            ? { 
                ...it, 
                video: videoMeta, 
                platform: videoMeta.platform,
                totalSize: it.selectedFormat.estimatedSize 
              } 
            : it
        ));
      }

      if (!isProcessingRef.current || isPausedRef.current) return;

      // Step 2: Start Download Simulation
      await new Promise<void>((resolve) => {
        const sim = startDownloadSimulation(
          videoMeta,
          currentItem.selectedFormat,
          // onProgress
          (task: DownloadTask) => {
            setQueue(prev => prev.map(it => {
              if (it.id === currentItem.id) {
                return {
                  ...it,
                  status: task.status,
                  progress: task.progress,
                  speed: task.speed,
                  eta: task.eta,
                  downloadedSize: task.downloadedSize,
                  totalSize: task.totalSize,
                  fileName: task.fileName,
                };
              }
              return it;
            }));
          },
          // onComplete
          (task: DownloadTask) => {
            setQueue(prev => prev.map(it => {
              if (it.id === currentItem.id) {
                return {
                  ...it,
                  status: 'completed',
                  progress: 100,
                  speed: 'Finished',
                  eta: '0s',
                  fileBlobUrl: task.fileBlobUrl,
                  fileName: task.fileName,
                };
              }
              return it;
            }));
            
            // Notify parent to append to persistent history
            onTaskCompleted(task);
            cancelActiveTaskRef.current = null;
            resolve();
          },
          // onError
          (taskId: string, error: string) => {
            setQueue(prev => prev.map(it => {
              if (it.id === currentItem.id) {
                return {
                  ...it,
                  status: 'failed',
                  error: error || 'Extraction or download failed',
                };
              }
              return it;
            }));
            cancelActiveTaskRef.current = null;
            resolve();
          }
        );

        cancelActiveTaskRef.current = sim.cancel;
      });

      // Advance to next after a brief 400ms pause
      setTimeout(() => {
        if (isProcessingRef.current && !isPausedRef.current) {
          processNextInQueue();
        }
      }, 400);

    } catch (err: any) {
      setQueue(prev => prev.map(it => 
        it.id === currentItem.id 
          ? { ...it, status: 'failed', error: err?.message || 'Error extracting video' } 
          : it
      ));
      // Continue to next item even if one fails
      setTimeout(() => {
        if (isProcessingRef.current && !isPausedRef.current) {
          processNextInQueue();
        }
      }, 400);
    }
  }, [onTaskCompleted]);

  // Start / Resume Batch Queue
  const handleStartQueue = () => {
    if (queue.length === 0) return;
    setIsPaused(false);
    setIsProcessing(true);
  };

  // Effect to kick off next item when isProcessing changes to true
  useEffect(() => {
    if (isProcessing && !isPaused) {
      processNextInQueue();
    }
  }, [isProcessing, isPaused, processNextInQueue]);

  // Pause queue
  const handlePauseQueue = () => {
    setIsPaused(true);
    setIsProcessing(false);
    if (cancelActiveTaskRef.current) {
      cancelActiveTaskRef.current();
      cancelActiveTaskRef.current = null;
    }
    // Set active item back to 'pending'
    if (activeItemId) {
      setQueue(prev => prev.map(it => it.id === activeItemId ? { ...it, status: 'pending', progress: 0 } : it));
      setActiveItemId(null);
    }
  };

  // Stop & clear active download
  const handleStopQueue = () => {
    setIsProcessing(false);
    setIsPaused(false);
    if (cancelActiveTaskRef.current) {
      cancelActiveTaskRef.current();
      cancelActiveTaskRef.current = null;
    }
    if (activeItemId) {
      setQueue(prev => prev.map(it => it.id === activeItemId ? { ...it, status: 'pending', progress: 0 } : it));
      setActiveItemId(null);
    }
  };

  // Clear all items in queue
  const handleClearQueue = () => {
    handleStopQueue();
    setQueue([]);
  };

  // Retry failed items
  const handleRetryFailed = () => {
    setQueue(prev => prev.map(it => it.status === 'failed' ? { ...it, status: 'pending', progress: 0, error: undefined } : it));
    if (!isProcessing) {
      setIsPaused(false);
      setIsProcessing(true);
    }
  };

  // Remove individual item from queue
  const handleRemoveItem = (id: string) => {
    if (activeItemId === id && cancelActiveTaskRef.current) {
      cancelActiveTaskRef.current();
      cancelActiveTaskRef.current = null;
      setActiveItemId(null);
    }
    setQueue(prev => prev.filter(it => it.id !== id));
  };

  // Update format for a specific pending queue item
  const handleChangeItemFormat = (id: string, newFormat: MediaFormat) => {
    setQueue(prev => prev.map(it => it.id === id ? { ...it, selectedFormat: newFormat, totalSize: newFormat.estimatedSize } : it));
  };

  // Calculate overall queue statistics
  const completedCount = queue.filter(q => q.status === 'completed').length;
  const failedCount = queue.filter(q => q.status === 'failed').length;
  const inProgressCount = queue.filter(q => q.status === 'downloading' || q.status === 'extracting' || q.status === 'converting').length;
  const pendingCount = queue.filter(q => q.status === 'pending' || q.status === 'queued').length;
  const totalCount = queue.length;
  const masterProgress = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  // Render Platform Icon helper
  const renderPlatformBadge = (platform: PlatformType) => {
    switch (platform) {
      case 'youtube':
        return (
          <span className="flex items-center gap-1 text-[11px] font-semibold text-red-400 bg-red-500/10 px-2 py-0.5 rounded-md border border-red-500/20">
            <Youtube className="w-3 h-3" />
            YouTube
          </span>
        );
      case 'facebook':
        return (
          <span className="flex items-center gap-1 text-[11px] font-semibold text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded-md border border-blue-500/20">
            <Facebook className="w-3 h-3" />
            Facebook
          </span>
        );
      case 'instagram':
        return (
          <span className="flex items-center gap-1 text-[11px] font-semibold text-pink-400 bg-pink-500/10 px-2 py-0.5 rounded-md border border-pink-500/20">
            <Instagram className="w-3 h-3" />
            Instagram
          </span>
        );
      case 'vimeo':
        return (
          <span className="flex items-center gap-1 text-[11px] font-semibold text-cyan-400 bg-cyan-500/10 px-2 py-0.5 rounded-md border border-cyan-500/20">
            <Tv className="w-3 h-3" />
            Vimeo
          </span>
        );
      default:
        return (
          <span className="flex items-center gap-1 text-[11px] font-semibold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-500/20">
            <Globe className="w-3 h-3" />
            Web Video
          </span>
        );
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6 animate-fadeIn">
      {/* Header Banner */}
      <div className="p-6 rounded-3xl bg-gradient-to-r from-slate-900 via-slate-900 to-rose-950/30 border border-slate-800 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-rose-500/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="p-2 rounded-xl bg-rose-500/20 text-rose-400 border border-rose-500/30">
                <Layers className="w-5 h-5" />
              </span>
              <h2 className="text-xl sm:text-2xl font-black tracking-tight text-white">
                {t.batchTitle}
              </h2>
            </div>
            <p className="text-xs sm:text-sm text-slate-400 max-w-xl">
              {t.batchDesc}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => onSwitchToSingle()}
              className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition flex items-center gap-1.5"
            >
              <span>{language === 'bn' ? 'একক লিঙ্ক মোড' : 'Single URL Mode'}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Multi-URL Input Box */}
      <div className="p-5 rounded-3xl bg-slate-900/90 border border-slate-800 shadow-lg space-y-4">
        <div className="flex items-center justify-between">
          <label className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
            <FileText className="w-3.5 h-3.5 text-rose-400" />
            <span>{language === 'bn' ? 'ভিডিও লিঙ্ক তালিকা (URL Input)' : 'Video URL List (One per line)'}</span>
          </label>
          <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-rose-500/15 text-rose-400 border border-rose-500/30">
            {detectedUrls.length} {language === 'bn' ? 'লিঙ্ক শনাক্ত' : 'links detected'}
          </span>
        </div>

        {/* Textarea */}
        <textarea
          id="batch-url-input"
          value={rawInput}
          onChange={(e) => setRawInput(e.target.value)}
          placeholder={t.batchPlaceholder}
          rows={4}
          className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-3.5 text-xs sm:text-sm text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-rose-500 focus:ring-1 focus:ring-rose-500 font-mono resize-y transition"
        />

        {/* Action Controls for Input */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
          <div className="flex flex-wrap items-center gap-2">
            {/* Paste Button */}
            <button
              id="batch-paste-btn"
              onClick={handlePasteClipboard}
              className="px-3 py-1.5 rounded-xl text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition flex items-center gap-1.5"
            >
              <Clipboard className="w-3.5 h-3.5 text-sky-400" />
              <span>{copyFeedback ? (language === 'bn' ? 'পেস্ট হয়েছে!' : 'Pasted!') : t.pasteBtn}</span>
            </button>

            {/* Upload .txt File */}
            <label className="px-3 py-1.5 rounded-xl text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition flex items-center gap-1.5 cursor-pointer">
              <Upload className="w-3.5 h-3.5 text-emerald-400" />
              <span>{t.uploadTxtList}</span>
              <input 
                ref={fileInputRef}
                type="file" 
                accept=".txt,.csv" 
                onChange={handleFileUpload} 
                className="hidden" 
              />
            </label>

            {rawInput && (
              <button
                onClick={() => setRawInput('')}
                className="px-2.5 py-1.5 rounded-xl text-xs font-medium text-slate-400 hover:text-slate-200 transition"
              >
                {t.clearBtn}
              </button>
            )}
          </div>

          {/* Add to Queue Button */}
          <button
            id="batch-add-to-queue-btn"
            onClick={handleAddToQueue}
            disabled={detectedUrls.length === 0}
            className={`px-5 py-2 rounded-xl text-xs sm:text-sm font-bold transition flex items-center gap-2 shadow-lg ${
              detectedUrls.length > 0
                ? 'bg-rose-500 hover:bg-rose-600 text-white shadow-rose-500/20 active:scale-95'
                : 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700/50'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>{t.addUrlsBtn} ({detectedUrls.length})</span>
          </button>
        </div>

        {/* Universal Batch Format Selector */}
        <div className="pt-3 border-t border-slate-800/80">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-400">
              {t.batchFormatPreset}:
            </span>
            <span className="text-[11px] text-slate-500">
              {activePreset.subLabel}
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
            {BATCH_FORMAT_PRESETS.map((preset) => {
              const isSelected = selectedPresetId === preset.id;
              return (
                <button
                  key={preset.id}
                  onClick={() => setSelectedPresetId(preset.id)}
                  className={`p-2.5 rounded-xl text-left border transition relative flex flex-col justify-between ${
                    isSelected
                      ? 'bg-rose-500/15 border-rose-500 text-white shadow-md'
                      : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-200'
                  }`}
                >
                  <div className="flex items-center justify-between w-full">
                    <span className="text-[11px] font-bold text-slate-200 truncate">
                      {preset.label}
                    </span>
                    {isSelected && <Check className="w-3.5 h-3.5 text-rose-400" />}
                  </div>
                  <span className="text-[10px] text-slate-500 mt-1 uppercase font-mono">
                    {preset.ext}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Queue Section */}
      <div className="space-y-4">
        {/* Master Queue Header & Controls */}
        <div className="p-5 rounded-3xl bg-slate-900/90 border border-slate-800 shadow-xl space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-rose-500/15 text-rose-400 flex items-center justify-center border border-rose-500/20">
                <ListFilter className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm sm:text-base font-bold text-white flex items-center gap-2">
                  <span>{language === 'bn' ? 'ডাউনলোড কিউ ম্যানেজমেন্ট' : 'Sequential Queue Manager'}</span>
                  <span className="text-xs px-2 py-0.2 rounded-full bg-slate-800 text-slate-300 font-mono">
                    {completedCount}/{totalCount}
                  </span>
                </h3>
                <p className="text-xs text-slate-400">
                  {totalCount === 0 
                    ? (language === 'bn' ? 'কিউ খালি। উপরে লিঙ্ক যুক্ত করুন।' : 'Queue is empty. Add links above.')
                    : (isProcessing 
                        ? (language === 'bn' ? 'ক্রমান্বয়ে ডাউনলোড চলছে...' : 'Processing batch queue sequentially...') 
                        : (completedCount === totalCount && totalCount > 0
                            ? (language === 'bn' ? 'সবগুলো ভিডিও ডাউনলোড সম্পন্ন হয়েছে!' : 'All downloads completed!')
                            : (language === 'bn' ? 'ডাউনলোড শুরু করতে "Start" চাপুন।' : 'Ready to start sequential downloads.')))}
                </p>
              </div>
            </div>

            {/* Queue Control Buttons */}
            <div className="flex flex-wrap items-center gap-2">
              {!isProcessing ? (
                <button
                  id="batch-start-queue-btn"
                  onClick={handleStartQueue}
                  disabled={queue.length === 0 || completedCount === totalCount}
                  className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-1.5 transition shadow-lg ${
                    queue.length > 0 && completedCount < totalCount
                      ? 'bg-gradient-to-r from-rose-500 to-rose-600 hover:from-rose-600 hover:to-rose-700 text-white shadow-rose-500/20 active:scale-95'
                      : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                  }`}
                >
                  <Play className="w-4 h-4 fill-white" />
                  <span>{isPaused ? t.resumeBatchBtn : t.startBatchBtn}</span>
                </button>
              ) : (
                <button
                  id="batch-pause-queue-btn"
                  onClick={handlePauseQueue}
                  className="px-4 py-2 rounded-xl text-xs sm:text-sm font-bold bg-amber-500 hover:bg-amber-600 text-slate-950 flex items-center gap-1.5 transition shadow-lg shadow-amber-500/20 active:scale-95"
                >
                  <Pause className="w-4 h-4 fill-current" />
                  <span>{t.pauseBatchBtn}</span>
                </button>
              )}

              {failedCount > 0 && (
                <button
                  onClick={handleRetryFailed}
                  className="px-3 py-2 rounded-xl text-xs font-semibold bg-red-500/20 hover:bg-red-500/30 text-red-300 border border-red-500/30 transition flex items-center gap-1.5"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>{t.retryFailedBtn} ({failedCount})</span>
                </button>
              )}

              {totalCount > 0 && (
                <button
                  onClick={handleClearQueue}
                  className="px-3 py-2 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-200 border border-slate-700 transition flex items-center gap-1.5"
                  title="Clear Queue"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>{t.clearQueueBtn}</span>
                </button>
              )}
            </div>
          </div>

          {/* Master Progress Bar */}
          {totalCount > 0 && (
            <div className="space-y-2 pt-2">
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span className="font-semibold text-slate-300">
                  {language === 'bn' ? 'সার্বিক অগ্রগতি (Total Progress)' : 'Batch Progress'}
                </span>
                <span className="font-mono font-bold text-rose-400">
                  {masterProgress}% ({completedCount} / {totalCount})
                </span>
              </div>
              <div className="w-full h-2.5 bg-slate-950 rounded-full overflow-hidden p-0.5 border border-slate-800">
                <div 
                  className="h-full bg-gradient-to-r from-rose-500 via-pink-500 to-emerald-500 rounded-full transition-all duration-300"
                  style={{ width: `${masterProgress}%` }}
                />
              </div>
            </div>
          )}
        </div>

        {/* Queue Items List */}
        {totalCount === 0 ? (
          <div className="p-12 rounded-3xl bg-slate-900/40 border border-dashed border-slate-800 text-center space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-slate-800/80 text-slate-500 flex items-center justify-center mx-auto">
              <Layers className="w-6 h-6" />
            </div>
            <h4 className="text-sm font-semibold text-slate-300">
              {language === 'bn' ? 'কোনো ভিডিও কিউতে নেই' : 'No videos in download queue'}
            </h4>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              {language === 'bn' 
                ? 'উপরের বক্সে আপনার কাঙ্ক্ষিত ভিডিও লিঙ্কগুলো (YouTube, Facebook, Instagram, ইত্যাদি) এক লাইনে একটি করে পেস্ট করুন।' 
                : 'Paste your target video links (YouTube, Facebook, Instagram, etc.) into the box above, one URL per line.'}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {queue.map((item, index) => {
              const isActive = activeItemId === item.id;
              return (
                <div
                  key={item.id}
                  className={`p-4 rounded-2xl border transition-all duration-200 ${
                    isActive
                      ? 'bg-slate-900 border-rose-500/60 shadow-lg shadow-rose-500/10'
                      : item.status === 'completed'
                      ? 'bg-slate-900/70 border-emerald-500/30'
                      : item.status === 'failed'
                      ? 'bg-slate-900/70 border-red-500/30'
                      : 'bg-slate-900/50 border-slate-800/80 hover:border-slate-700'
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    {/* Left: Thumbnail & Info */}
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <span className="text-xs font-mono font-bold text-slate-500 w-5 shrink-0 text-center">
                        #{index + 1}
                      </span>

                      {/* Thumbnail or Platform placeholder */}
                      <div className="w-14 h-14 rounded-xl bg-slate-950 border border-slate-800 shrink-0 overflow-hidden relative flex items-center justify-center">
                        {item.video?.thumbnail ? (
                          <img 
                            src={item.video.thumbnail} 
                            alt={item.video.title} 
                            className="w-full h-full object-cover"
                            referrerPolicy="no-referrer"
                          />
                        ) : (
                          <div className="text-slate-600">
                            {renderPlatformBadge(item.platform)}
                          </div>
                        )}
                        {item.video?.duration && (
                          <span className="absolute bottom-1 right-1 px-1 py-0.2 rounded text-[9px] font-mono font-bold bg-black/80 text-white">
                            {item.video.duration}
                          </span>
                        )}
                      </div>

                      {/* Details */}
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          {renderPlatformBadge(item.platform)}
                          <span className="text-[10px] font-mono text-slate-500">
                            {item.selectedFormat.label} • {item.totalSize}
                          </span>
                        </div>
                        <h4 className="text-xs sm:text-sm font-semibold text-slate-200 truncate">
                          {item.video?.title || item.originalUrl}
                        </h4>
                        {item.video?.author && (
                          <p className="text-[11px] text-slate-500 truncate mt-0.5">
                            {item.video.author}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Right: Status & Actions */}
                    <div className="flex items-center gap-3 self-end sm:self-center shrink-0">
                      {/* Status indicator */}
                      <div className="text-right">
                        {item.status === 'completed' && (
                          <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-lg border border-emerald-500/20">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>{t.queueStatusCompleted}</span>
                          </span>
                        )}

                        {item.status === 'downloading' && (
                          <span className="inline-flex items-center gap-1.5 text-xs font-bold text-rose-400 bg-rose-500/10 px-2.5 py-1 rounded-lg border border-rose-500/20">
                            <Zap className="w-3.5 h-3.5 animate-pulse" />
                            <span>{item.progress}% ({item.speed})</span>
                          </span>
                        )}

                        {item.status === 'extracting' && (
                          <span className="inline-flex items-center gap-1.5 text-xs font-bold text-sky-400 bg-sky-500/10 px-2.5 py-1 rounded-lg border border-sky-500/20">
                            <div className="w-2.5 h-2.5 rounded-full border-2 border-sky-400 border-t-transparent animate-spin" />
                            <span>{t.extracting}</span>
                          </span>
                        )}

                        {item.status === 'converting' && (
                          <span className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-400 bg-amber-500/10 px-2.5 py-1 rounded-lg border border-amber-500/20">
                            <div className="w-2.5 h-2.5 rounded-full border-2 border-amber-400 border-t-transparent animate-spin" />
                            <span>{t.converting}</span>
                          </span>
                        )}

                        {item.status === 'failed' && (
                          <span className="inline-flex items-center gap-1 text-xs font-bold text-red-400 bg-red-500/10 px-2.5 py-1 rounded-lg border border-red-500/20">
                            <AlertCircle className="w-3.5 h-3.5" />
                            <span>{t.queueStatusFailed}</span>
                          </span>
                        )}

                        {item.status === 'pending' && (
                          <span className="inline-flex items-center gap-1 text-xs font-medium text-slate-400 bg-slate-800 px-2.5 py-1 rounded-lg border border-slate-700">
                            <Clock className="w-3.5 h-3.5" />
                            <span>{t.queueStatusPending}</span>
                          </span>
                        )}
                      </div>

                      {/* Format changer for pending items */}
                      {item.status === 'pending' && (
                        <select
                          value={item.selectedFormat.id}
                          onChange={(e) => {
                            const found = BATCH_FORMAT_PRESETS.find(p => p.format.id === e.target.value)?.format;
                            if (found) handleChangeItemFormat(item.id, found);
                          }}
                          className="bg-slate-950 border border-slate-800 text-[11px] text-slate-300 rounded-lg px-2 py-1 focus:outline-none"
                        >
                          {BATCH_FORMAT_PRESETS.map(p => (
                            <option key={p.id} value={p.format.id}>
                              {p.label}
                            </option>
                          ))}
                        </select>
                      )}

                      {/* Download button if completed */}
                      {item.status === 'completed' && item.fileBlobUrl && (
                        <button
                          onClick={() => triggerBrowserDownload(item.fileName || 'download.mp3', item.fileBlobUrl!)}
                          className="p-1.5 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/30 transition"
                          title="Save File Again"
                        >
                          <Download className="w-3.5 h-3.5" />
                        </button>
                      )}

                      {/* Remove item button */}
                      <button
                        onClick={() => handleRemoveItem(item.id)}
                        className="p-1.5 rounded-lg text-slate-500 hover:text-red-400 hover:bg-slate-800 transition"
                        title="Remove from Queue"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Active Download Progress Bar */}
                  {(item.status === 'downloading' || item.status === 'extracting' || item.status === 'converting') && (
                    <div className="mt-3 pt-3 border-t border-slate-800/80 space-y-1.5">
                      <div className="flex items-center justify-between text-[11px] text-slate-400">
                        <span>{item.downloadedSize} / {item.totalSize}</span>
                        <span>ETA: {item.eta}</span>
                      </div>
                      <div className="w-full h-1.5 bg-slate-950 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-rose-500 rounded-full transition-all duration-200"
                          style={{ width: `${item.progress}%` }}
                        />
                      </div>
                    </div>
                  )}

                  {/* Error Message if failed */}
                  {item.status === 'failed' && item.error && (
                    <p className="mt-2 text-[11px] text-red-400">
                      {item.error}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
