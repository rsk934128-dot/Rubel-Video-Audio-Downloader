import React, { useState } from 'react';
import { Language, MediaFormat, VideoMetadata, DownloadTask } from '../types';
import { getTranslation } from '../utils/translations';
import { ShareListenerBanner } from './ShareListenerBanner';
import { VideoResultCard } from './VideoResultCard';
import { VideoMiniPlayerPreview } from './VideoMiniPlayerPreview';
import { 
  Link as LinkIcon, 
  ClipboardPaste, 
  ArrowRight, 
  X, 
  Loader2, 
  Sparkles,
  ShieldAlert, 
  CheckCircle, 
  FileCheck2, 
  Zap, 
  Headphones, 
  Video as VideoIcon, 
  Youtube, 
  Facebook, 
  Instagram, 
  Tv,
  Layers,
  Link2
} from 'lucide-react';

interface Props {
  inputUrl: string;
  setInputUrl: (url: string) => void;
  isLoading: boolean;
  error: string | null;
  video: VideoMetadata | null;
  activeFormatId: string | null;
  activeTask?: DownloadTask | null;
  detectedSharedUrl: string | null;
  onAnalyze: (urlToAnalyze?: string) => void;
  onDownload: (format: MediaFormat) => void;
  onSelectSample?: (sample: any) => void;
  onOpenPWAGuide?: () => void;
  onSwitchToBatch?: () => void;
  onOpenBypassModal?: () => void;
  onOpenStorageSettings?: () => void;
  language: Language;
}

export const DownloaderView: React.FC<Props> = ({
  inputUrl,
  setInputUrl,
  isLoading,
  error,
  video,
  activeFormatId,
  activeTask,
  detectedSharedUrl,
  onAnalyze,
  onDownload,
  onSelectSample: _onSelectSample,
  onOpenPWAGuide,
  onSwitchToBatch,
  onOpenBypassModal,
  onOpenStorageSettings,
  language,
}) => {
  const t = getTranslation(language);
  const [pasteSuccess, setPasteSuccess] = useState(false);

  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text) {
        setInputUrl(text);
        setPasteSuccess(true);
        setTimeout(() => setPasteSuccess(false), 2000);
        // Automatically analyze pasted link
        onAnalyze(text);
      }
    } catch {
      // If clipboard permission is denied, focus the input
      const inputEl = document.getElementById('video-url-input');
      if (inputEl) inputEl.focus();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      onAnalyze();
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto py-2 sm:py-6">
      {/* Hero Header */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-rose-500/10 text-rose-400 border border-rose-500/20 text-xs font-semibold mb-3">
          <Sparkles className="w-3.5 h-3.5 text-rose-400" />
          <span>{language === 'bn' ? 'শেয়ার লিঙ্ক থেকে সরাসরি ডাউনলোড' : 'Direct Stream & Share-to-Download'}</span>
        </div>
        <h2 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight leading-tight">
          {t.appTitle}
        </h2>
        <p className="text-sm sm:text-base text-slate-400 max-w-2xl mx-auto mt-2 leading-relaxed">
          {t.appSubtitle}
        </p>
      </div>

      {/* Share Intent listener / test banner */}
      <ShareListenerBanner
        detectedSharedUrl={detectedSharedUrl}
        onApplyUrl={(url) => {
          setInputUrl(url);
          onAnalyze(url);
        }}
        language={language}
      />

      {/* Mode Switcher: Single Link vs Batch Queue */}
      <div className="flex items-center justify-between mb-3 px-1">
        <div className="inline-flex p-1 rounded-2xl bg-slate-900 border border-slate-800 text-xs font-semibold">
          <span className="px-3.5 py-1.5 rounded-xl bg-rose-500 text-white shadow-sm flex items-center gap-1.5">
            <Link2 className="w-3.5 h-3.5" />
            <span>{language === 'bn' ? 'একক লিঙ্ক' : 'Single URL'}</span>
          </span>
          {onSwitchToBatch && (
            <button
              id="switch-to-batch-btn"
              onClick={onSwitchToBatch}
              className="px-3.5 py-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800/80 transition flex items-center gap-1.5"
            >
              <Layers className="w-3.5 h-3.5 text-rose-400" />
              <span>{language === 'bn' ? 'ব্যাচ প্রসেসিং' : 'Batch Queue'}</span>
              <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-rose-500/20 text-rose-400 border border-rose-500/30">
                Multi
              </span>
            </button>
          )}
        </div>

        {onSwitchToBatch && (
          <button
            onClick={onSwitchToBatch}
            className="text-xs text-rose-400 hover:text-rose-300 font-medium hidden sm:flex items-center gap-1"
          >
            <span>{language === 'bn' ? 'একসাথে অনেক লিঙ্ক ডাউনলোড করুন ➔' : 'Batch download multiple URLs ➔'}</span>
          </button>
        )}
      </div>

      {/* Main Input Box */}
      <div className="relative rounded-3xl bg-slate-900/90 border border-slate-800 p-2.5 sm:p-3.5 shadow-2xl shadow-slate-950/80 mb-6 backdrop-blur-xl">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3">
          <div className="relative flex-1 flex items-center">
            <div className="absolute left-4 text-slate-500 pointer-events-none">
              <LinkIcon className="w-5 h-5 text-rose-400" />
            </div>
            <input
              id="video-url-input"
              type="text"
              value={inputUrl}
              onChange={(e) => setInputUrl(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={t.inputPlaceholder}
              className="w-full pl-12 pr-10 py-3.5 rounded-2xl bg-slate-950/80 border border-slate-800 text-sm sm:text-base text-white placeholder-slate-500 focus:outline-none focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20 transition"
            />
            {inputUrl && (
              <button
                id="clear-url-input-btn"
                onClick={() => setInputUrl('')}
                className="absolute right-3 p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            {/* Paste Button */}
            <button
              id="paste-clipboard-btn"
              type="button"
              onClick={handlePaste}
              className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-4 py-3.5 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs sm:text-sm font-semibold border border-slate-700/80 transition"
              title="Paste from clipboard"
            >
              {pasteSuccess ? (
                <CheckCircle className="w-4 h-4 text-emerald-400" />
              ) : (
                <ClipboardPaste className="w-4 h-4 text-sky-400" />
              )}
              <span>{pasteSuccess ? 'Pasted!' : t.pasteBtn}</span>
            </button>

            {/* Fetch Button */}
            <button
              id="analyze-video-btn"
              type="button"
              onClick={() => onAnalyze()}
              disabled={isLoading || !inputUrl.trim()}
              className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-6 py-3.5 rounded-2xl text-xs sm:text-sm font-bold transition shadow-lg whitespace-nowrap ${
                isLoading || !inputUrl.trim()
                  ? 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
                  : 'bg-gradient-to-r from-rose-500 to-pink-500 hover:from-rose-600 hover:to-pink-600 text-white shadow-rose-500/25'
              }`}
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>{language === 'bn' ? 'অপেক্ষা করুন...' : 'Fetching...'}</span>
                </>
              ) : (
                <>
                  <span>{t.analyzeBtn}</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        </div>

        {/* Quick Sample Link for Big Buck Bunny 60fps 4K */}
        <div className="mt-3 flex items-center gap-2 flex-wrap text-xs">
          <span className="text-slate-400 text-[11px]">{language === 'bn' ? 'নমুনা ও টেস্ট ভিডিও:' : 'Sample & Test:'}</span>
          <button
            type="button"
            onClick={() => {
              const bbbUrl = 'https://www.youtube.com/watch?v=aqz-KE-bpKQ';
              setInputUrl(bbbUrl);
              onAnalyze(bbbUrl);
            }}
            className="px-2.5 py-1 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/30 text-[11px] font-medium transition flex items-center gap-1.5 cursor-pointer shadow-sm"
          >
            <span>🐰</span>
            <span className="font-semibold">Big Buck Bunny 60fps 4K (Official Blender)</span>
            <span className="px-1.5 py-0.2 rounded bg-rose-500/25 text-[10px] text-rose-200 font-mono">4K 60fps</span>
          </button>
        </div>

        {/* Error message */}
        {error && (
          <div className="mt-3 px-4 py-2.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Bypass Engine Status Banner */}
        <div 
          onClick={onOpenBypassModal}
          className="mt-3.5 pt-3 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-2 text-xs cursor-pointer group"
        >
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shrink-0" />
            <span className="text-slate-300 font-medium group-hover:text-white transition">
              {language === 'bn' ? 'বাইপাস এপিআই ইঞ্জিন ৪টি স্তরে সক্রিয়' : 'Bypass API 4-tier active'}:
            </span>
            <span className="text-[11px] text-slate-400 hidden sm:inline">
              TikTok HD No-Watermark • YouTube Android Client • Cloud Transcoder • Stream Proxy
            </span>
          </div>
          <span className="text-[11px] font-semibold text-rose-400 group-hover:text-rose-300 flex items-center gap-1 shrink-0">
            <span>{language === 'bn' ? 'ইঞ্জিন স্ট্যাটাস ➔' : 'View Engines ➔'}</span>
          </span>
        </div>
      </div>

      {/* Visual Mini-Player Preview for Detected Video with Codec & Resolution Specs */}
      {video && (
        <VideoMiniPlayerPreview
          video={video}
          activeFormatId={activeFormatId}
          activeTask={activeTask}
          onDownload={onDownload}
          onOpenStorageSettings={onOpenStorageSettings}
          language={language}
        />
      )}

      {/* Extracted Video Card with Comprehensive Format Options */}
      {video && (
        <VideoResultCard
          video={video}
          activeFormatId={activeFormatId}
          activeTask={activeTask}
          onDownload={onDownload}
          onOpenStorageSettings={onOpenStorageSettings}
          language={language}
        />
      )}

      {/* Feature Highlights Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 flex items-start gap-3">
          <div className="w-9 h-9 rounded-xl bg-rose-500/10 text-rose-400 flex items-center justify-center shrink-0">
            <VideoIcon className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-white">
              {language === 'bn' ? '১০৮০p ফুল এইচডি ভিডিও' : '1080p Full HD MP4'}
            </h4>
            <p className="text-[11px] text-slate-400 mt-0.5">
              {language === 'bn' ? 'ক্রিস্টাল ক্লিয়ার রেজোলিউশন ও ৬০fps স্মুথ ফ্রেমরেট' : 'Crystal clear resolution with 60fps high bitrate'}
            </p>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 flex items-start gap-3">
          <div className="w-9 h-9 rounded-xl bg-purple-500/10 text-purple-400 flex items-center justify-center shrink-0">
            <Headphones className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-white">
              {language === 'bn' ? '৩২০ kbps আল্ট্রা অডিও (MP3)' : '320 kbps Ultra MP3'}
            </h4>
            <p className="text-[11px] text-slate-400 mt-0.5">
              {language === 'bn' ? 'মিউজিক ট্র্যাকের জন্য স্টুডিও কোয়ালিটি বিটরেট ও ট্যাগ' : 'Studio grade bitrate with embedded ID3 meta tags'}
            </p>
          </div>
        </div>

        <div 
          onClick={onOpenPWAGuide}
          className="p-4 rounded-2xl bg-gradient-to-br from-slate-900 via-slate-900 to-sky-950/40 border border-sky-500/20 hover:border-sky-500/40 transition cursor-pointer flex items-start gap-3 group shadow-lg"
        >
          <div className="w-9 h-9 rounded-xl bg-sky-500/10 text-sky-400 flex items-center justify-center shrink-0 group-hover:scale-105 transition">
            <Zap className="w-4 h-4 text-sky-400" />
          </div>
          <div className="flex-1">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold text-white group-hover:text-sky-300 transition flex items-center gap-1.5">
                <span>{language === 'bn' ? 'PWA Web Share Target টিউটোরিয়াল ও গাইড' : 'PWA Web Share Target Guide & Config'}</span>
                <span className="text-[10px] px-1.5 py-0.2 rounded bg-sky-500/20 text-sky-400 border border-sky-500/30">
                  Documentation
                </span>
              </h4>
              <ArrowRight className="w-3.5 h-3.5 text-sky-400 group-hover:translate-x-1 transition" />
            </div>
            <p className="text-[11px] text-slate-400 mt-0.5">
              {language === 'bn' ? 'কীভাবে manifest.json কনফিগার করে ইউটিউব থেকে সরাসরি শেয়ার করবেন তা দেখুন।' : 'Learn how to configure manifest.json to enable direct mobile browser sharing.'}
            </p>
          </div>
        </div>
      </div>

      {/* Legal & Policy Advisory Card */}
      <div className="p-4 rounded-2xl bg-slate-900/40 border border-slate-800/80 text-xs text-slate-400 flex items-start gap-3">
        <ShieldAlert className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
        <div>
          <span className="font-semibold text-slate-200">
            {t.legalNotice}
          </span>
          <span className="ml-1 text-slate-400">
            {t.legalNoticeText}
          </span>
        </div>
      </div>
    </div>
  );
};
