import React, { useState, useEffect, useRef } from 'react';
import { 
  Download, 
  Zap, 
  Clipboard, 
  ClipboardCheck, 
  X, 
  ArrowRight, 
  Sparkles, 
  Film, 
  Music, 
  HardDrive, 
  Check, 
  Loader2,
  ChevronDown,
  ChevronUp,
  Link as LinkIcon
} from 'lucide-react';
import { VideoMetadata, MediaFormat, Language, StorageConfig } from '../types';
import { storagePreferenceManager } from '../services/storagePreferenceManager';
import { extractUrlFromText } from '../services/videoExtractor';

interface Props {
  video: VideoMetadata | null;
  onDownload: (format: MediaFormat) => void;
  onAnalyzeAndDownload: (url: string, autoStartFormat?: 'video' | 'audio') => Promise<void>;
  onOpenStorageModal?: () => void;
  isLoading: boolean;
  hasActiveTask?: boolean;
  language: Language;
}

export const FloatingShortcutDownloadButton: React.FC<Props> = ({
  video,
  onDownload,
  onAnalyzeAndDownload,
  onOpenStorageModal,
  isLoading,
  hasActiveTask = false,
  language,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [urlInput, setUrlInput] = useState('');
  const [copiedState, setCopiedState] = useState(false);
  const [hasClipboardText, setHasClipboardText] = useState(false);
  const [storageConfig, setStorageConfig] = useState<StorageConfig>(storagePreferenceManager.getConfig());
  const [quickFormatType, setQuickFormatType] = useState<'video' | 'audio'>('video');
  const panelRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Subscribe to storage changes
  useEffect(() => {
    return storagePreferenceManager.subscribe((c) => setStorageConfig(c));
  }, []);

  // Check if clipboard contains a link when window focuses
  useEffect(() => {
    const checkClipboard = async () => {
      try {
        if (navigator.clipboard && navigator.clipboard.readText) {
          const text = await navigator.clipboard.readText();
          if (text && extractUrlFromText(text)) {
            setHasClipboardText(true);
          }
        }
      } catch {
        // Clipboard read permission might be denied or unsupported
      }
    };

    window.addEventListener('focus', checkClipboard);
    checkClipboard();
    return () => window.removeEventListener('focus', checkClipboard);
  }, []);

  // Global keyboard shortcut: Alt + D or Ctrl + Shift + D
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.altKey && e.key.toLowerCase() === 'd') || (e.ctrlKey && e.shiftKey && e.key.toLowerCase() === 'd')) {
        e.preventDefault();
        setIsOpen((prev) => !prev);
        if (!isOpen) {
          setTimeout(() => inputRef.current?.focus(), 150);
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  // Click outside listener to close floating panel
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(event.target as Node)) {
        // Don't close if clicking the toggle button itself (handled by toggle)
        const toggleBtn = document.getElementById('shortcut-floating-fab-btn');
        if (toggleBtn && toggleBtn.contains(event.target as Node)) return;
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  const handlePasteClipboard = async () => {
    try {
      if (navigator.clipboard && navigator.clipboard.readText) {
        const text = await navigator.clipboard.readText();
        const extracted = extractUrlFromText(text) || text.trim();
        if (extracted) {
          setUrlInput(extracted);
          setCopiedState(true);
          setTimeout(() => setCopiedState(false), 2000);
          return extracted;
        }
      }
    } catch {
      // Permission issue
    }
    return null;
  };

  const handleQuickPasteAndDownload = async () => {
    const pasted = await handlePasteClipboard();
    const targetUrl = pasted || urlInput.trim();
    if (!targetUrl) return;

    await onAnalyzeAndDownload(targetUrl, quickFormatType);
    setIsOpen(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const clean = extractUrlFromText(urlInput) || urlInput.trim();
    if (!clean) return;

    await onAnalyzeAndDownload(clean, quickFormatType);
    setIsOpen(false);
  };

  // Find best formats of active video
  const bestVideoFormat = video?.formats.find(f => f.type === 'video' && (f.quality.includes('1080') || f.isRecommended)) 
    || video?.formats.find(f => f.type === 'video');
  const bestAudioFormat = video?.formats.find(f => f.type === 'audio' && (f.quality.includes('320') || f.isRecommended)) 
    || video?.formats.find(f => f.type === 'audio');

  return (
    <aside 
      aria-label="Shortcut Downloader"
      className={`fixed ${hasActiveTask ? 'bottom-28 sm:bottom-28' : 'bottom-6 sm:bottom-7'} right-4 sm:right-7 z-40 flex flex-col items-end pointer-events-none transition-all duration-300`}
    >
      {/* Floating Quick Action Drawer / Flyout Panel */}
      {isOpen && (
        <div
          ref={panelRef}
          id="shortcut-download-flyout"
          className="pointer-events-auto mb-3 w-[calc(100vw-2rem)] sm:w-96 rounded-2xl bg-slate-900/95 border border-rose-500/40 shadow-2xl shadow-rose-950/80 backdrop-blur-xl p-4 sm:p-5 animate-in fade-in slide-in-from-bottom-5 duration-200"
        >
          {/* Header */}
          <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-rose-500 to-pink-500 flex items-center justify-center text-white shadow-md shadow-rose-950/50">
                <Zap className="w-4 h-4 fill-white" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
                  <span>{language === 'bn' ? 'শর্টকাট ডাউনলোড' : 'Quick Shortcut Downloader'}</span>
                  <span className="px-1.5 py-0.2 rounded text-[9px] font-mono uppercase bg-rose-500/20 text-rose-300 border border-rose-500/30">
                    Always On
                  </span>
                </h3>
                <p className="text-[11px] text-slate-400">
                  {language === 'bn' ? 'যেকোনো সময় এক ক্লিকে ডাউনলোড' : 'One-click instant download anytime'}
                </p>
              </div>
            </div>

            <button
              id="close-shortcut-panel-btn"
              onClick={() => setIsOpen(false)}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
              title="Close panel"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Quick Storage Location Destination Indicator */}
          <div className="mb-3 px-3 py-2 rounded-xl bg-slate-950/80 border border-slate-800 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2 text-slate-300 truncate">
              <HardDrive className="w-4 h-4 text-emerald-400 shrink-0" />
              <span className="text-slate-400">{language === 'bn' ? 'সংরক্ষণ:' : 'Save To:'}</span>
              <span className="font-semibold text-emerald-300 truncate">
                {storageConfig.destination === 'sd_card'
                  ? (language === 'bn' ? 'মেমোরি কার্ড (SD Card)' : 'SD Card')
                  : storageConfig.destination === 'phone_memory'
                  ? (language === 'bn' ? 'ফোন মেমোরি' : 'Phone Memory')
                  : (language === 'bn' ? 'প্রতিবার নির্বাচন' : 'Ask Each Time')}
              </span>
            </div>
            {onOpenStorageModal && (
              <button
                id="shortcut-change-storage-btn"
                onClick={() => {
                  onOpenStorageModal();
                  setIsOpen(false);
                }}
                className="text-[11px] text-emerald-400 hover:text-emerald-300 font-semibold underline shrink-0 ml-2"
              >
                {language === 'bn' ? 'পরিবর্তন' : 'Change'}
              </button>
            )}
          </div>

          {/* Active Video Quick Download Controls (if a video is already loaded) */}
          {video && (
            <div className="mb-3.5 p-3 rounded-xl bg-slate-950/90 border border-slate-800/90">
              <div className="flex items-center gap-2.5 mb-2.5">
                <img
                  src={video.thumbnail}
                  alt={video.title}
                  className="w-12 h-9 object-cover rounded-lg bg-slate-800 border border-slate-700 shrink-0"
                />
                <div className="min-w-0 flex-1">
                  <span className="text-[10px] text-rose-400 font-semibold uppercase">{video.platform}</span>
                  <p className="text-xs font-bold text-white truncate">{video.title}</p>
                </div>
              </div>

              {/* Direct Format Quick Action Buttons */}
              <div className="grid grid-cols-2 gap-2">
                {bestVideoFormat && (
                  <button
                    id="shortcut-download-video-btn"
                    onClick={() => {
                      onDownload(bestVideoFormat);
                      setIsOpen(false);
                    }}
                    disabled={isLoading}
                    className="flex items-center justify-center gap-1.5 px-2.5 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold shadow-md shadow-rose-950/40 transition active:scale-95 disabled:opacity-50"
                  >
                    <Film className="w-3.5 h-3.5" />
                    <span>{bestVideoFormat.quality} MP4</span>
                  </button>
                )}

                {bestAudioFormat && (
                  <button
                    id="shortcut-download-audio-btn"
                    onClick={() => {
                      onDownload(bestAudioFormat);
                      setIsOpen(false);
                    }}
                    disabled={isLoading}
                    className="flex items-center justify-center gap-1.5 px-2.5 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold shadow-md shadow-purple-950/40 transition active:scale-95 disabled:opacity-50"
                  >
                    <Music className="w-3.5 h-3.5" />
                    <span>{bestAudioFormat.quality} MP3</span>
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Instant Clipboard One-Tap Button */}
          <button
            id="shortcut-paste-one-click-btn"
            onClick={handleQuickPasteAndDownload}
            disabled={isLoading}
            className="w-full mb-3 py-2.5 px-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-emerald-950/50 transition active:scale-[0.98] disabled:opacity-50"
          >
            {copiedState ? (
              <>
                <ClipboardCheck className="w-4 h-4 text-emerald-200" />
                <span>{language === 'bn' ? 'পেস্ট করা হয়েছে!' : 'Pasted!'}</span>
              </>
            ) : (
              <>
                <Clipboard className="w-4 h-4" />
                <span>
                  {language === 'bn' 
                    ? '📋 ক্লিপবোর্ড থেকে সরাসরি ডাউনলোড' 
                    : '📋 Direct Clipboard Download'}
                </span>
              </>
            )}
          </button>

          {/* Manual Link Input Form */}
          <form onSubmit={handleSubmit} className="space-y-2.5">
            <div className="relative">
              <input
                ref={inputRef}
                id="shortcut-url-input"
                type="text"
                value={urlInput}
                onChange={(e) => setUrlInput(e.target.value)}
                placeholder={language === 'bn' ? 'এখানে লিঙ্ক পেস্ট করুন...' : 'Paste link here...'}
                className="w-full pl-8 pr-8 py-2 text-xs rounded-xl bg-slate-950 border border-slate-700 focus:border-rose-500 focus:outline-none text-white placeholder-slate-500"
              />
              <LinkIcon className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-1/2 -translate-y-1/2" />
              {urlInput && (
                <button
                  type="button"
                  onClick={() => setUrlInput('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Video vs Audio Type selector */}
            <div className="flex items-center justify-between text-xs text-slate-400 pt-1">
              <span className="text-[11px]">{language === 'bn' ? 'ডাউনলোড টাইপ:' : 'Format:'}</span>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setQuickFormatType('video')}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition ${
                    quickFormatType === 'video'
                      ? 'bg-rose-500 text-white'
                      : 'bg-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  {language === 'bn' ? 'ভিডিও (MP4)' : 'Video'}
                </button>
                <button
                  type="button"
                  onClick={() => setQuickFormatType('audio')}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition ${
                    quickFormatType === 'audio'
                      ? 'bg-purple-500 text-white'
                      : 'bg-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  {language === 'bn' ? 'গান/অডিও (MP3)' : 'Audio'}
                </button>
              </div>
            </div>

            <button
              id="shortcut-submit-download-btn"
              type="submit"
              disabled={isLoading || !urlInput.trim()}
              className="w-full py-2 px-3 rounded-xl bg-rose-600 hover:bg-rose-500 disabled:bg-slate-800 disabled:text-slate-500 text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-md transition active:scale-98"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>{language === 'bn' ? 'প্রসেসিং...' : 'Processing...'}</span>
                </>
              ) : (
                <>
                  <Download className="w-3.5 h-3.5" />
                  <span>{language === 'bn' ? 'ডাউনলোড শুরু করুন' : 'Start Download'}</span>
                </>
              )}
            </button>
          </form>

          {/* Quick Tip */}
          <div className="mt-3 pt-2 border-t border-slate-800/80 flex items-center justify-between text-[10px] text-slate-500">
            <span>কিবোর্ড শর্টকাট: <kbd className="px-1 py-0.5 rounded bg-slate-800 text-slate-300 font-mono">Alt + D</kbd></span>
            <span className="text-emerald-400 font-medium">Auto-Save Enabled</span>
          </div>
        </div>
      )}

      {/* Floating Action Button (Always visible on screen) */}
      <div className="pointer-events-auto flex items-center gap-2 group">
        <button
          id="shortcut-floating-fab-btn"
          onClick={() => setIsOpen((prev) => !prev)}
          className={`relative flex items-center gap-2 px-4 py-3 sm:px-4 sm:py-3 rounded-full font-bold text-xs sm:text-sm text-white shadow-2xl transition-all duration-300 transform active:scale-95 border ${
            isOpen 
              ? 'bg-slate-900 border-rose-500 text-rose-300 shadow-rose-950/60 ring-2 ring-rose-500/40' 
              : 'bg-gradient-to-r from-rose-500 via-pink-500 to-rose-600 hover:from-rose-600 hover:to-pink-600 border-rose-400/50 shadow-rose-950/80 hover:shadow-rose-500/30'
          }`}
          title={language === 'bn' ? 'শর্টকাট ডাউনলোড বাটন (Alt + D)' : 'Quick Shortcut Download (Alt + D)'}
        >
          {/* Animated pulse ring */}
          {!isOpen && (
            <span className="absolute -top-1 -right-1 flex h-3.5 w-3.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-rose-500 border-2 border-slate-900"></span>
            </span>
          )}

          {isLoading ? (
            <Loader2 className="w-5 h-5 animate-spin text-white" />
          ) : isOpen ? (
            <ChevronDown className="w-5 h-5 text-rose-400 transition-transform duration-200" />
          ) : (
            <Download className="w-5 h-5 animate-bounce" />
          )}

          <span className="font-semibold tracking-wide">
            {isOpen 
              ? (language === 'bn' ? 'বন্ধ করুন' : 'Close')
              : (language === 'bn' ? 'শর্টকাট ডাউনলোড' : 'Quick Download')}
          </span>

          {!isOpen && (
            <span className="hidden md:inline-block px-1.5 py-0.5 rounded bg-black/30 text-[10px] font-mono text-rose-200">
              Alt+D
            </span>
          )}
        </button>
      </div>
    </aside>
  );
};
