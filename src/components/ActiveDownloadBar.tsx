import React, { useState, useEffect } from 'react';
import { DownloadTask, Language, StorageConfig } from '../types';
import { getTranslation } from '../utils/translations';
import { triggerBrowserDownload } from '../services/downloadManager';
import { storagePreferenceManager } from '../services/storagePreferenceManager';
import { 
  Download, 
  CheckCircle2, 
  AlertCircle, 
  X, 
  Play, 
  FileAudio, 
  FileVideo, 
  RefreshCw,
  HardDrive,
  Smartphone,
  Share2,
  FolderDown,
  ExternalLink
} from 'lucide-react';

interface Props {
  task: DownloadTask | null;
  onCancel: (taskId: string) => void;
  onRetry?: (task: DownloadTask) => void;
  onOpenPreview?: (task: DownloadTask) => void;
  onOpenStorageSettings?: () => void;
  language: Language;
}

export const ActiveDownloadBar: React.FC<Props> = ({
  task,
  onCancel,
  onRetry,
  onOpenPreview,
  onOpenStorageSettings,
  language,
}) => {
  const t = getTranslation(language);
  const [storageConfig, setStorageConfig] = useState<StorageConfig>(storagePreferenceManager.getConfig());
  const [savedToSDMsg, setSavedToSDMsg] = useState<string | null>(null);

  useEffect(() => {
    return storagePreferenceManager.subscribe((c) => setStorageConfig(c));
  }, []);

  if (!task) return null;

  const isCompleted = task.status === 'completed';
  const isFailed = task.status === 'failed';
  const isAudio = task.format.type === 'audio';

  const handleSaveDirectToSD = async () => {
    const targetUrl = task.fileBlobUrl || task.directUrl;
    if (!targetUrl) return;
    const res = await storagePreferenceManager.saveFileToUserStorage(
      task.fileName,
      targetUrl,
      { forcePicker: true, destinationOverride: 'sd_card' }
    );
    if (res.success) {
      setSavedToSDMsg(res.message);
      setTimeout(() => setSavedToSDMsg(null), 4000);
    }
  };

  const getStatusText = () => {
    switch (task.status) {
      case 'extracting':
        return language === 'bn' ? 'স্ট্রিম তথ্য আনা হচ্ছে...' : 'Extracting media streams...';
      case 'downloading':
        return language === 'bn' ? `ডাউনলোড হচ্ছে... (${task.speed})` : `Downloading... (${task.speed})`;
      case 'converting':
        return language === 'bn' ? 'ফাইল একত্রীকরণ ও এনকোডিং...' : 'Multiplexing & packaging...';
      case 'completed':
        return language === 'bn' ? 'ডাউনলোড সফল! ফাইল ডিভাইসে সেভ হয়েছে' : 'Download Complete! File saved to device';
      case 'failed':
        return language === 'bn' ? 'ডাউনলোড ব্যর্থ হয়েছে' : 'Download failed';
      default:
        return 'Processing...';
    }
  };

  return (
    <div className="fixed bottom-4 left-4 right-4 max-w-3xl mx-auto z-40 animate-in fade-in slide-in-from-bottom-5 duration-300">
      <div className={`p-4 rounded-2xl border shadow-2xl backdrop-blur-xl ${
        isCompleted
          ? 'bg-slate-900/95 border-emerald-500/40 shadow-emerald-950/40'
          : isFailed
          ? 'bg-slate-900/95 border-rose-500/40 shadow-rose-950/40'
          : 'bg-slate-900/95 border-rose-500/30 shadow-slate-950/60'
      }`}>
        <div className="flex items-start sm:items-center justify-between gap-3 mb-2.5">
          <div className="flex items-center gap-3 min-w-0">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
              isCompleted
                ? 'bg-emerald-500/20 text-emerald-400'
                : isFailed
                ? 'bg-rose-500/20 text-rose-400'
                : 'bg-rose-500/20 text-rose-400'
            }`}>
              {isCompleted ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-400" />
              ) : isFailed ? (
                <AlertCircle className="w-5 h-5 text-rose-400" />
              ) : isAudio ? (
                <FileAudio className="w-5 h-5 animate-pulse" />
              ) : (
                <FileVideo className="w-5 h-5 animate-pulse" />
              )}
            </div>

            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-white truncate max-w-xs sm:max-w-md">
                  {task.fileName}
                </span>
                <span className={`px-2 py-0.5 rounded text-[10px] font-semibold uppercase ${
                  isAudio 
                    ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30' 
                    : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                }`}>
                  {task.format.label}
                </span>
              </div>
              <div className="flex items-center gap-3 text-xs text-slate-400 mt-0.5 flex-wrap">
                <span className="font-medium text-slate-300">{getStatusText()}</span>
                {task.engine && (
                  <span className="px-1.5 py-0.5 rounded bg-rose-500/15 text-rose-300 border border-rose-500/25 text-[10px] font-mono flex items-center gap-1">
                    <span>⚡</span>
                    <span>{task.engine}</span>
                  </span>
                )}
                {!isCompleted && !isFailed && (
                  <>
                    <span className="hidden sm:inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 text-[10px]">
                      <span>🔒</span>
                      <span>{language === 'bn' ? 'লক স্ক্রিন সাপোর্ট' : 'Lock-Screen Active'}</span>
                    </span>
                    <span>•</span>
                    <span>{task.downloadedSize} / {task.totalSize}</span>
                    {task.eta && (
                      <>
                        <span>•</span>
                        <span>ETA: {task.eta}</span>
                      </>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2 shrink-0">
            {isCompleted && (task.fileBlobUrl || task.directUrl) && (
              <div className="flex items-center gap-1.5 flex-wrap">
                {/* Save to SD Card Button */}
                <button
                  id="save-to-sd-card-btn"
                  onClick={handleSaveDirectToSD}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-md shadow-emerald-950/40 transition"
                  title="Save directly to Memory Card (SD Card)"
                >
                  <HardDrive className="w-3.5 h-3.5 text-white" />
                  <span>{language === 'bn' ? 'মেমোরি কার্ডে সেভ' : 'Save to SD'}</span>
                </button>

                <button
                  id="direct-save-file-link"
                  onClick={() => triggerBrowserDownload(task.fileName, task.fileBlobUrl || task.directUrl!)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold border border-slate-700 transition"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>{language === 'bn' ? 'ফাইল সেভ' : 'Save File'}</span>
                </button>

                <button
                  id="save-again-btn"
                  onClick={() => triggerBrowserDownload(task.fileName, task.fileBlobUrl || task.directUrl!)}
                  className="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium border border-slate-700 transition"
                  title="Trigger browser download again"
                >
                  <RefreshCw className="w-3.5 h-3.5 text-emerald-400" />
                  <span>{language === 'bn' ? 'পুনরায়' : 'Retry'}</span>
                </button>
              </div>
            )}

            {isFailed && (
              <div className="flex items-center gap-1.5 flex-wrap">
                {task.originalUrl && (
                  <a
                    href={`https://www.ssyoutube.com/watch?v=${task.videoId.replace(/^yt-/, '')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-md shadow-emerald-950/40 transition"
                    title="মোবাইলের নিজস্ব নেটওয়ার্ক থেকে সরাসরি আসল ফাইলটি ডাউনলোড করুন"
                  >
                    <ExternalLink className="w-3.5 h-3.5 text-white" />
                    <span>{language === 'bn' ? 'আসল গান ডাউনলোড' : 'Direct Download'}</span>
                  </a>
                )}
                <button
                  id="retry-failed-download-btn"
                  onClick={() => onRetry?.(task)}
                  className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium border border-slate-700 transition"
                  title="Retry download"
                >
                  <RefreshCw className="w-3.5 h-3.5 text-slate-300" />
                  <span>{language === 'bn' ? 'পুনরায়' : 'Retry'}</span>
                </button>
              </div>
            )}

            {!isCompleted && !isFailed && (
              <button
                id="cancel-download-btn"
                onClick={() => onCancel(task.id)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
                title="Cancel download"
              >
                <X className="w-4 h-4" />
              </button>
            )}

            {(isCompleted || isFailed) && (
              <button
                id="dismiss-download-btn"
                onClick={() => onCancel(task.id)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
                title="Dismiss"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Saved to SD confirmation alert if triggered */}
        {savedToSDMsg && (
          <div className="mb-2 px-3 py-1.5 rounded-xl bg-emerald-950/80 border border-emerald-500/40 text-[11px] text-emerald-300 flex items-center justify-between gap-2">
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              <span>{savedToSDMsg}</span>
            </span>
          </div>
        )}

        {/* Progress Bar */}
        <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden relative">
          <div
            className={`h-full transition-all duration-200 rounded-full ${
              isCompleted
                ? 'bg-gradient-to-r from-emerald-500 to-teal-400'
                : isFailed
                ? 'bg-rose-500'
                : 'bg-gradient-to-r from-rose-500 via-pink-500 to-sky-400'
            }`}
            style={{ width: `${task.progress}%` }}
          />
        </div>

        {/* Progress % indicator & Storage Destination Selector */}
        <div className="flex justify-between items-center text-[10px] text-slate-400 mt-1.5 flex-wrap gap-1">
          <div className="flex items-center gap-2">
            <span>
              {isCompleted 
                ? (language === 'bn' ? 'ডাউনলোড সফল হয়েছে' : 'Download finished')
                : `${task.progress}%`}
            </span>
            {/* Clickable Storage Badge */}
            <button
              onClick={onOpenStorageSettings}
              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-slate-800/90 hover:bg-slate-700 text-slate-300 border border-slate-700 hover:border-emerald-500/40 transition cursor-pointer"
              title="Change Storage Destination"
            >
              {storageConfig.destination === 'sd_card' ? (
                <>
                  <HardDrive className="w-3 h-3 text-emerald-400" />
                  <span className="text-emerald-300 font-semibold">{language === 'bn' ? 'গন্তব্য: মেমোরি কার্ড' : 'Dest: SD Card'}</span>
                </>
              ) : storageConfig.destination === 'phone_memory' ? (
                <>
                  <Smartphone className="w-3 h-3 text-blue-400" />
                  <span className="text-blue-300 font-semibold">{language === 'bn' ? 'গন্তব্য: ফোন মেমোরি' : 'Dest: Phone Memory'}</span>
                </>
              ) : (
                <>
                  <FolderDown className="w-3 h-3 text-purple-400" />
                  <span className="text-purple-300 font-semibold">{language === 'bn' ? 'গন্তব্য: প্রতিবার জিজ্ঞেস' : 'Dest: Prompt'}</span>
                </>
              )}
            </button>
          </div>

          {!isCompleted && !isFailed && (
            <span className="font-mono text-slate-300">{task.speed}</span>
          )}
        </div>
      </div>
    </div>
  );
};
