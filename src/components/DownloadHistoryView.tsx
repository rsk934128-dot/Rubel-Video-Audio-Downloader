import React, { useState } from 'react';
import { DownloadTask, Language } from '../types';
import { getTranslation } from '../utils/translations';
import { triggerBrowserDownload } from '../services/downloadManager';
import { storagePreferenceManager } from '../services/storagePreferenceManager';
import { 
  exportHistoryAsJSON, 
  exportHistoryAsCSV 
} from '../services/historyBackupService';
import { HistoryBackupModal } from './HistoryBackupModal';
import { 
  History, 
  Trash2, 
  Download, 
  FileAudio, 
  FileVideo, 
  Calendar, 
  HardDrive, 
  ArrowLeft, 
  CheckCircle2, 
  Play, 
  Pause, 
  Disc3, 
  RotateCw, 
  AlertCircle, 
  Share2,
  Database,
  Upload,
  FileSpreadsheet,
  FileCode
} from 'lucide-react';

interface Props {
  history: DownloadTask[];
  onClearHistory: () => void;
  onDeleteItem: (id: string) => void;
  onRetry: (item: DownloadTask) => void;
  onImportHistory?: (updatedHistory: DownloadTask[], count: number, mode: 'merge' | 'replace') => void;
  onBackToDownloader: () => void;
  language: Language;
  currentUser?: any;
}

export const DownloadHistoryView: React.FC<Props> = ({
  history,
  onClearHistory,
  onDeleteItem,
  onRetry,
  onImportHistory,
  onBackToDownloader,
  language,
  currentUser,
}) => {
  const t = getTranslation(language);
  const [playingId, setPlayingId] = useState<string | null>(null);
  const [sdFeedback, setSdFeedback] = useState<{ id: string; msg: string } | null>(null);
  const [isBackupModalOpen, setIsBackupModalOpen] = useState<boolean>(false);
  const [feedbackToast, setFeedbackToast] = useState<string | null>(null);

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString(language === 'bn' ? 'bn-BD' : 'en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const handleSaveToSDCard = async (item: DownloadTask) => {
    const targetUrl = item.fileBlobUrl || (item.directUrl ? `/api/proxy-download?url=${encodeURIComponent(item.directUrl)}&filename=${encodeURIComponent(item.fileName)}&stream=true` : null);
    if (!targetUrl) {
      onRetry(item);
      return;
    }

    const res = await storagePreferenceManager.saveFileToUserStorage(
      item.fileName,
      targetUrl,
      { forcePicker: true, destinationOverride: 'sd_card' }
    );
    if (res.success) {
      setSdFeedback({ id: item.id, msg: res.message });
      setTimeout(() => setSdFeedback(null), 4000);
    }
  };

  const handleReDownload = async (item: DownloadTask) => {
    if (item.fileBlobUrl) {
      triggerBrowserDownload(item.fileName, item.fileBlobUrl);
      return;
    }
    if (item.directUrl) {
      const proxyUrl = `/api/proxy-download?url=${encodeURIComponent(item.directUrl)}&filename=${encodeURIComponent(item.fileName)}&stream=true`;
      triggerBrowserDownload(item.fileName, proxyUrl);
      return;
    }
    // Re-trigger actual target link download
    onRetry(item);
  };

  const handleQuickJSON = () => {
    if (history.length === 0) return;
    exportHistoryAsJSON(history);
    setFeedbackToast(language === 'bn' ? 'JSON ব্যাকআপ ডাউনলোড সম্পন্ন হয়েছে!' : 'JSON backup downloaded!');
    setTimeout(() => setFeedbackToast(null), 3500);
  };

  const handleQuickCSV = () => {
    if (history.length === 0) return;
    exportHistoryAsCSV(history);
    setFeedbackToast(language === 'bn' ? 'CSV স্প্রেডশিট ডাউনলোড সম্পন্ন হয়েছে!' : 'CSV spreadsheet downloaded!');
    setTimeout(() => setFeedbackToast(null), 3500);
  };

  return (
    <div className="w-full max-w-4xl mx-auto py-4">
      {/* Toast Feedback */}
      {feedbackToast && (
        <div className="mb-4 px-4 py-3 rounded-2xl bg-emerald-950/90 border border-emerald-500/40 text-emerald-300 text-xs flex items-center justify-between shadow-lg animate-in fade-in duration-200">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{feedbackToast}</span>
          </div>
          <button
            onClick={() => setFeedbackToast(null)}
            className="text-emerald-400 hover:text-white"
          >
            ✕
          </button>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <button
            onClick={onBackToDownloader}
            className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-200 mb-2 transition"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>{language === 'bn' ? 'ডাউনলোডারে ফিরে যান' : 'Back to Downloader'}</span>
          </button>
          <h2 className="text-xl sm:text-2xl font-bold text-white flex items-center gap-2.5">
            <History className="w-6 h-6 text-rose-500" />
            <span>{t.viewDownloads}</span>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-300 font-normal">
              {history.length} {language === 'bn' ? 'টি ফাইল' : 'items'}
            </span>
          </h2>
        </div>

        {/* Toolbar: Backup, Export, Import, Clear */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Main Backup / Restore Modal Button */}
          <button
            id="open-backup-modal-btn"
            onClick={() => setIsBackupModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-gradient-to-r from-rose-500/20 to-purple-500/20 hover:from-rose-500/30 hover:to-purple-500/30 text-rose-200 border border-rose-500/30 transition shadow-sm"
            title="Backup & Restore History"
          >
            <Database className="w-3.5 h-3.5 text-rose-400" />
            <span>{language === 'bn' ? 'ব্যাকআপ / রিস্টোর' : 'Backup & Restore'}</span>
          </button>

          {/* Quick JSON export */}
          {history.length > 0 && (
            <button
              id="quick-export-json-btn"
              onClick={handleQuickJSON}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-semibold bg-slate-850 hover:bg-slate-800 text-slate-300 border border-slate-700 transition"
              title="Export as JSON file"
            >
              <FileCode className="w-3.5 h-3.5 text-rose-400" />
              <span>JSON</span>
            </button>
          )}

          {/* Quick CSV export */}
          {history.length > 0 && (
            <button
              id="quick-export-csv-btn"
              onClick={handleQuickCSV}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-semibold bg-slate-850 hover:bg-slate-800 text-slate-300 border border-slate-700 transition"
              title="Export as CSV spreadsheet"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
              <span>CSV</span>
            </button>
          )}

          {/* Quick Import Button */}
          <button
            id="quick-import-history-btn"
            onClick={() => setIsBackupModalOpen(true)}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-semibold bg-slate-850 hover:bg-slate-800 text-emerald-300 border border-emerald-500/30 transition"
            title="Import history backup"
          >
            <Upload className="w-3.5 h-3.5 text-emerald-400" />
            <span className="hidden sm:inline">{language === 'bn' ? 'ইম্পোর্ট' : 'Import'}</span>
          </button>

          {history.length > 0 && (
            <button
              id="clear-all-history-btn"
              onClick={onClearHistory}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 border border-rose-500/20 transition"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>{t.clearHistory}</span>
            </button>
          )}
        </div>
      </div>

      {/* Google Cloud Sync Status Card */}
      {currentUser && (
        <div className="mb-5 px-3.5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-950/40 via-slate-900 to-sky-950/30 border border-emerald-500/30 flex items-center justify-between text-xs shadow-sm">
          <div className="flex items-center gap-2.5">
            <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-emerald-300 font-medium">
              {language === 'bn' ? 'Google ক্লাউড সিঙ্ক সক্রিয়' : 'Google Cloud Sync Active'}: <strong className="text-white font-semibold">{currentUser.email || currentUser.displayName}</strong>
            </span>
          </div>
          <span className="text-[11px] text-slate-400 hidden sm:inline">
            {language === 'bn' ? 'ক্রোম ও ডিভাইসে হিস্টোরি সংরক্ষিত' : 'Synced across Chrome & devices'}
          </span>
        </div>
      )}

      {/* History List */}
      {history.length === 0 ? (
        <div className="p-12 text-center rounded-3xl bg-slate-900/60 border border-slate-800">
          <div className="w-16 h-16 rounded-2xl bg-slate-800 text-slate-500 mx-auto flex items-center justify-center mb-4">
            <Download className="w-8 h-8" />
          </div>
          <h3 className="text-base font-bold text-white">
            {t.noHistory}
          </h3>
          <p className="text-xs sm:text-sm text-slate-400 max-w-sm mx-auto mt-1 mb-6">
            {t.noHistoryDesc}
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <button
              onClick={onBackToDownloader}
              className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-rose-500 hover:bg-rose-600 text-white text-xs sm:text-sm font-semibold shadow-lg shadow-rose-500/20 transition"
            >
              {language === 'bn' ? 'একটি ভিডিও ডাউনলোড করুন' : 'Download a Video Now'}
            </button>
            <button
              id="empty-state-import-btn"
              onClick={() => setIsBackupModalOpen(true)}
              className="w-full sm:w-auto flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-emerald-300 text-xs sm:text-sm font-semibold border border-slate-700 transition"
            >
              <Upload className="w-4 h-4 text-emerald-400" />
              <span>{language === 'bn' ? 'পূর্ববর্তী ব্যাকআপ ইম্পোর্ট করুন (.json / .csv)' : 'Import Backup File (.json / .csv)'}</span>
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {history.map((item) => {
            const isAudio = item.format.type === 'audio';

            return (
              <div key={item.id} className="flex flex-col">
                <div className={`p-4 rounded-2xl bg-slate-900/80 border border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 hover:border-slate-700 transition ${playingId === item.id ? 'rounded-b-none border-b-0' : ''}`}>
                  <div className="flex items-center gap-3.5 min-w-0">
                  {/* Thumbnail or Media Icon */}
                  <div className="relative w-16 h-16 rounded-xl overflow-hidden shrink-0 bg-slate-950 border border-slate-800">
                    <img
                      src={item.thumbnail}
                      alt={item.title}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = 'none';
                      }}
                    />
                    <div className="absolute bottom-1 right-1 p-0.5 rounded bg-black/80 text-slate-200">
                      {isAudio ? (
                        <FileAudio className="w-3.5 h-3.5 text-purple-400" />
                      ) : (
                        <FileVideo className="w-3.5 h-3.5 text-rose-400" />
                      )}
                    </div>
                  </div>

                  {/* Details */}
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-bold text-white truncate max-w-md">
                        {item.title}
                      </span>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-semibold uppercase ${
                        isAudio
                          ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                          : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                      }`}>
                        {item.format.label} (.{item.format.ext})
                      </span>
                    </div>

                    <div className="flex items-center gap-3 text-xs text-slate-400 mt-1">
                      <span className="flex items-center gap-1">
                        <HardDrive className="w-3 h-3 text-slate-500" />
                        <span>{item.totalSize}</span>
                      </span>
                      <span>•</span>
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3 text-slate-500" />
                        <span>{formatDate(item.createdAt)}</span>
                      </span>
                      <span>•</span>
                      {item.status === 'failed' ? (
                        <span className="flex items-center gap-1 text-rose-400 font-medium">
                          <AlertCircle className="w-3.5 h-3.5" />
                          <span>{language === 'bn' ? 'ব্যর্থ হয়েছে' : 'Failed'}</span>
                          {item.error && (
                            <span className="text-[10px] text-slate-400 max-w-[140px] truncate" title={item.error}>
                              ({item.error})
                            </span>
                          )}
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 text-emerald-400 font-medium">
                          <CheckCircle2 className="w-3 h-3" />
                          <span>{language === 'bn' ? 'সংরক্ষিত' : 'Saved'}</span>
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                  {item.status === 'failed' ? (
                    <button
                      id={`retry-download-${item.id}`}
                      onClick={() => onRetry(item)}
                      className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-slate-950 font-bold text-xs shadow-md shadow-amber-950/30 transition"
                      title="Auto-Retry download simulation for this URL"
                    >
                      <RotateCw className="w-3.5 h-3.5 animate-spin-hover" />
                      <span>{language === 'bn' ? 'অটো-রিট্রাই' : 'Auto Retry'}</span>
                    </button>
                  ) : (
                    <>
                      <button
                        onClick={() => setPlayingId(playingId === item.id ? null : item.id)}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition ${
                          playingId === item.id
                            ? 'bg-rose-500 text-white border-rose-400'
                            : 'bg-slate-800 hover:bg-slate-700 text-rose-300 border-slate-700'
                        }`}
                        title="Play media"
                      >
                        {playingId === item.id ? (
                          <>
                            <Pause className="w-3.5 h-3.5" />
                            <span>{language === 'bn' ? 'থামান' : 'Stop'}</span>
                          </>
                        ) : (
                          <>
                            <Play className="w-3.5 h-3.5 fill-rose-400/40" />
                            <span>{isAudio ? (language === 'bn' ? 'শুনুন' : 'Play Song') : (language === 'bn' ? 'প্লে করুন' : 'Watch')}</span>
                          </>
                        )}
                      </button>

                      <button
                        id={`redownload-${item.id}`}
                        onClick={() => handleReDownload(item)}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition"
                        title="Download again"
                      >
                        <Download className="w-3.5 h-3.5 text-rose-400" />
                        <span>{language === 'bn' ? 'আবার সেভ' : 'Download'}</span>
                      </button>

                      <button
                        id={`sd-save-${item.id}`}
                        onClick={() => handleSaveToSDCard(item)}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-950/60 hover:bg-emerald-900/80 text-emerald-300 text-xs font-semibold border border-emerald-500/30 transition shadow-sm"
                        title="Save directly to Memory Card (SD Card)"
                      >
                        <HardDrive className="w-3.5 h-3.5 text-emerald-400" />
                        <span className="hidden sm:inline">{language === 'bn' ? 'মেমোরি কার্ড' : 'SD Card'}</span>
                        <span className="sm:hidden">SD</span>
                      </button>

                      <button
                        id={`re-execute-${item.id}`}
                        onClick={() => onRetry(item)}
                        className="hidden sm:flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-300 text-xs font-medium border border-slate-700 transition"
                        title="Re-run stream download simulation"
                      >
                        <RotateCw className="w-3 h-3" />
                        <span>{language === 'bn' ? 'রি-রান' : 'Re-run'}</span>
                      </button>
                    </>
                  )}

                  <button
                    id={`delete-${item.id}`}
                    onClick={() => {
                      if (playingId === item.id) setPlayingId(null);
                      onDeleteItem(item.id);
                    }}
                    className="p-2 rounded-xl text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition"
                    title="Delete record"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Feedback toast for saving to SD card */}
              {sdFeedback && sdFeedback.id === item.id && (
                <div className="mt-2 px-3 py-1.5 rounded-xl bg-emerald-950/90 border border-emerald-500/40 text-[11px] text-emerald-300 flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span>{sdFeedback.msg}</span>
                </div>
              )}

              {/* Inline player if active */}
              {playingId === item.id && (
                <div className="p-4 bg-slate-950/90 rounded-b-2xl border-x border-b border-slate-800 -mt-2 mb-3">
                  {isAudio ? (
                    <div className="flex items-center gap-4">
                      <Disc3 className="w-8 h-8 text-rose-400 animate-spin shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-bold text-white line-clamp-1">{item.title}</p>
                        <audio
                          src={item.fileBlobUrl || (item.directUrl ? `/api/proxy-download?url=${encodeURIComponent(item.directUrl)}` : undefined)}
                          controls
                          autoPlay
                          className="w-full mt-2 h-9 accent-rose-500"
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center">
                      <div className="w-full max-w-md aspect-video rounded-xl overflow-hidden bg-black">
                        <video
                          src={item.fileBlobUrl || (item.directUrl ? `/api/proxy-download?url=${encodeURIComponent(item.directUrl)}` : undefined)}
                          controls
                          autoPlay
                          className="w-full h-full object-contain"
                        />
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
            );
          })}
        </div>
      )}

      {/* History Backup & Import Modal */}
      <HistoryBackupModal
        isOpen={isBackupModalOpen}
        onClose={() => setIsBackupModalOpen(false)}
        history={history}
        onImportComplete={(updated, count, mode) => {
          if (onImportHistory) {
            onImportHistory(updated, count, mode);
          }
          setFeedbackToast(
            language === 'bn'
              ? `${count} টি নতুন ডাউনলোড রেকর্ড সফলভাবে সংরক্ষিত হয়েছে!`
              : `Successfully imported ${count} download records!`
          );
          setTimeout(() => setFeedbackToast(null), 4000);
        }}
        language={language}
      />
    </div>
  );
};
