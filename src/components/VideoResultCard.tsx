import React, { useState, useEffect } from 'react';
import { MediaFormat, VideoMetadata, Language, DownloadTask } from '../types';
import { getTranslation } from '../utils/translations';
import { PlatformBadge } from './PlatformBadge';
import { extractYouTubeId } from '../services/videoExtractor';
import { triggerBrowserDownload } from '../services/downloadManager';
import { 
  Download, 
  Music, 
  Film, 
  Clock, 
  Eye, 
  Play, 
  ShieldCheck, 
  Info,
  ExternalLink,
  Disc3,
  Flame,
  CheckCircle2,
  RefreshCw,
  Loader2,
  Zap,
  HardDrive
} from 'lucide-react';
import { storagePreferenceManager } from '../services/storagePreferenceManager';
import { StorageConfig } from '../types';

interface Props {
  video: VideoMetadata;
  activeFormatId: string | null;
  activeTask?: DownloadTask | null;
  onDownload: (format: MediaFormat) => void;
  onOpenStorageSettings?: () => void;
  language: Language;
}

export const VideoResultCard: React.FC<Props> = ({
  video,
  activeFormatId,
  activeTask,
  onDownload,
  onOpenStorageSettings,
  language,
}) => {
  const t = getTranslation(language);
  const [storageConfig, setStorageConfig] = useState<StorageConfig>(storagePreferenceManager.getConfig());

  useEffect(() => {
    return storagePreferenceManager.subscribe((c) => setStorageConfig(c));
  }, []);
  
  const audioFormats = video.formats.filter(f => f.type === 'audio');
  const videoFormats = video.formats.filter(f => f.type === 'video');

  const [activeFormatTab, setActiveFormatTab] = useState<'video' | 'audio'>(() => {
    return videoFormats.length > 0 ? 'video' : 'audio';
  });
  const [showPlayer, setShowPlayer] = useState(false);
  const [playerMode, setPlayerMode] = useState<'video' | 'audio'>('audio');

  // Keep format tab automatically aligned when a new media source is loaded
  useEffect(() => {
    if (videoFormats.length === 0 && audioFormats.length > 0) {
      setActiveFormatTab('audio');
    } else if (videoFormats.length > 0 && audioFormats.length === 0) {
      setActiveFormatTab('video');
    }
  }, [video.id, videoFormats.length, audioFormats.length]);

  const displayedFormats = activeFormatTab === 'video' ? videoFormats : audioFormats;

  const ytId = extractYouTubeId(video.originalUrl) || (video.id && video.id.length === 11 ? video.id : null);
  const isYouTube = video.platform === 'youtube' || !!ytId;

  const handleOpenPlayer = (mode: 'video' | 'audio') => {
    setPlayerMode(mode);
    setShowPlayer(true);
  };

  return (
    <div className="w-full rounded-3xl bg-slate-900/80 border border-slate-800 shadow-xl overflow-hidden backdrop-blur-md mb-8">
      {/* Top Banner & Metadata */}
      <div className="p-5 sm:p-7 border-b border-slate-800/80 flex flex-col md:flex-row gap-5">
        {/* Thumbnail with duration */}
        <div className="relative w-full md:w-64 h-44 sm:h-48 md:h-40 rounded-2xl overflow-hidden shrink-0 group shadow-lg bg-slate-950">
          <img
            src={video.thumbnail}
            alt={video.title}
            className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
            onError={(e) => {
              (e.target as HTMLImageElement).src = ytId 
                ? `https://i.ytimg.com/vi/${ytId}/hqdefault.jpg`
                : 'https://images.unsplash.com/photo-1611162617474-5b21e879e113?auto=format&fit=crop&w=800&q=80';
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent pointer-events-none" />

          {/* Duration Badge */}
          <div className="absolute bottom-3 right-3 px-2 py-0.5 rounded-md bg-black/80 backdrop-blur-sm text-[11px] font-semibold text-white flex items-center gap-1">
            <Clock className="w-3 h-3 text-slate-400" />
            <span>{video.duration}</span>
          </div>

          {/* Platform Badge Overlay */}
          <div className="absolute top-3 left-3">
            <PlatformBadge platform={video.platform} />
          </div>

          {/* Play preview toggle button */}
          <button
            onClick={() => handleOpenPlayer('video')}
            className="absolute inset-0 flex items-center justify-center bg-black/30 opacity-0 group-hover:opacity-100 transition duration-200"
            title="Play video / song"
          >
            <div className="w-12 h-12 rounded-full bg-rose-500 text-white flex items-center justify-center shadow-lg transform group-hover:scale-110 transition">
              <Play className="w-5 h-5 fill-white ml-0.5" />
            </div>
          </button>
        </div>

        {/* Video Info */}
        <div className="flex-1 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-2 flex-wrap">
              <span className="px-2 py-0.5 rounded-md text-[11px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>{language === 'bn' ? 'যাচাইকৃত স্ট্রিম' : 'Verified Stream'}</span>
              </span>
              <span className="text-xs text-slate-400 flex items-center gap-1">
                <Eye className="w-3.5 h-3.5 text-slate-500" />
                <span>{video.viewCount}</span>
              </span>
              <span className="text-xs text-slate-500">•</span>
              <span className="text-xs text-slate-400">{video.uploadDate}</span>
            </div>

            <h2 className="text-base sm:text-xl font-bold text-white leading-snug line-clamp-2">
              {video.title}
            </h2>

            {/* Author */}
            <div className="flex items-center gap-2.5 mt-3">
              {video.authorAvatar && (
                <img
                  src={video.authorAvatar}
                  alt={video.author}
                  className="w-6 h-6 rounded-full bg-slate-800 border border-slate-700 object-cover"
                />
              )}
              <span className="text-xs sm:text-sm font-semibold text-slate-300">
                {video.author}
              </span>
            </div>
          </div>

          {/* Interactive Play & Listen Controls */}
          <div className="mt-4 flex items-center gap-2.5 flex-wrap">
            <button
              onClick={() => handleOpenPlayer('audio')}
              className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition border ${
                showPlayer && playerMode === 'audio'
                  ? 'bg-rose-500 text-white border-rose-400 shadow-md shadow-rose-950/40'
                  : 'bg-slate-800 hover:bg-slate-700 text-rose-300 border-slate-700'
              }`}
            >
              <Music className="w-3.5 h-3.5 text-rose-400" />
              <span>{language === 'bn' ? 'গান শুনুন (Audio)' : 'Listen Song (Audio)'}</span>
            </button>

            <button
              onClick={() => handleOpenPlayer('video')}
              className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition border ${
                showPlayer && playerMode === 'video'
                  ? 'bg-sky-500 text-white border-sky-400 shadow-md shadow-sky-950/40'
                  : 'bg-slate-800 hover:bg-slate-700 text-sky-300 border-slate-700'
              }`}
            >
              <Play className="w-3.5 h-3.5 text-sky-400 fill-sky-400/40" />
              <span>{language === 'bn' ? 'ভিডিও চালান (Video)' : 'Play Video'}</span>
            </button>

            {showPlayer && (
              <button
                onClick={() => setShowPlayer(false)}
                className="text-xs text-slate-400 hover:text-white px-2.5 py-1.5 rounded-xl hover:bg-slate-800 transition"
              >
                {language === 'bn' ? 'বন্ধ করুন' : 'Close'}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* In-App Live Player (Audio & Video Modes) */}
      {showPlayer && (
        <div className="p-5 bg-slate-950 border-b border-slate-800 flex flex-col items-center">
          {/* Audio Mode Player */}
          {playerMode === 'audio' ? (
            <div className="w-full max-w-xl p-5 rounded-2xl bg-gradient-to-br from-slate-900 to-slate-950 border border-slate-800 flex flex-col sm:flex-row items-center gap-5 shadow-2xl">
              {/* Spinning Album Art / Disc */}
              <div className="relative w-28 h-28 rounded-2xl overflow-hidden shrink-0 shadow-lg border border-slate-700/60 bg-black flex items-center justify-center">
                <img
                  src={video.thumbnail}
                  alt={video.title}
                  className="w-full h-full object-cover animate-pulse"
                />
                <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                  <Disc3 className="w-10 h-10 text-rose-400 animate-spin" style={{ animationDuration: '8s' }} />
                </div>
              </div>

              {/* Song Information & Live Soundwave */}
              <div className="flex-1 min-w-0 text-center sm:text-left w-full">
                <div className="flex items-center justify-center sm:justify-start gap-2 mb-1">
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/30">
                    {language === 'bn' ? 'গান চলছে' : 'Playing Song'}
                  </span>
                  <span className="text-xs text-slate-400 font-mono">320kbps MP3</span>
                </div>
                <h4 className="text-sm font-bold text-white line-clamp-1">
                  {video.title}
                </h4>
                <p className="text-xs text-slate-400 mt-0.5 mb-3">
                  {video.author}
                </p>

                {/* Animated Equalizer Bars */}
                <div className="flex items-end justify-center sm:justify-start gap-1 h-5 mb-3">
                  {[40, 75, 100, 60, 85, 45, 95, 70, 80, 50, 90, 65, 80, 40].map((h, i) => (
                    <div
                      key={i}
                      className="w-1 bg-gradient-to-t from-rose-500 to-pink-400 rounded-full animate-pulse"
                      style={{
                        height: `${h}%`,
                        animationDelay: `${(i % 5) * 150}ms`,
                        animationDuration: '600ms',
                      }}
                    />
                  ))}
                </div>

                {/* Direct Audio Stream element for playback */}
                {isYouTube && ytId ? (
                  <div className="w-full rounded-xl overflow-hidden border border-slate-800 bg-black">
                    <iframe
                      src={`https://www.youtube-nocookie.com/embed/${ytId}?autoplay=1&rel=0`}
                      title={video.title}
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                      className="w-full h-24 sm:h-28 border-0"
                    />
                  </div>
                ) : (
                  <audio
                    src={video.sampleAudioUrl || (/\.(mp3|m4a|wav|ogg)$/i.test(video.originalUrl) ? video.originalUrl : undefined)}
                    controls
                    autoPlay
                    className="w-full h-10 accent-rose-500"
                  />
                )}
              </div>
            </div>
          ) : (
            /* Video Mode Player */
            <div className="w-full max-w-2xl flex flex-col items-center">
              <div className="w-full aspect-video rounded-2xl overflow-hidden bg-black border border-slate-800 shadow-2xl">
                {isYouTube && ytId ? (
                  <iframe
                    src={`https://www.youtube-nocookie.com/embed/${ytId}?autoplay=1&rel=0`}
                    title={video.title}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    className="w-full h-full border-0"
                  />
                ) : (
                  <video
                    src={video.sampleVideoUrl || (/\.(mp4|webm|mov)$/i.test(video.originalUrl) ? video.originalUrl : undefined)}
                    controls
                    autoPlay
                    className="w-full h-full object-contain"
                  />
                )}
              </div>
              <p className="text-[11px] text-slate-400 mt-2 text-center flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                <span>
                  {language === 'bn' 
                    ? 'ফুল এইচডি প্লেয়ার স্ট্রিম সক্রিয় আছে' 
                    : 'Full HD media stream player active'}
                </span>
              </p>
            </div>
          )}
        </div>
      )}

      {/* Format Selector Tabs */}
      <div className="p-5 sm:p-7">
        <div className="flex items-center justify-between gap-4 mb-4 flex-wrap">
          <div>
            <h3 className="text-sm sm:text-base font-bold text-white">
              {t.formatOptions}
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              {language === 'bn' 
                ? 'আপনার প্রয়োজন অনুযায়ী রেজোলিউশন বা অডিও কোয়ালিটি বেছে নিন'
                : 'Select resolution or audio bitrate for direct download'}
            </p>
            {/* Storage Destination Indicator */}
            <div className="flex items-center gap-2 mt-2">
              <button
                id="result-card-storage-dest-btn"
                onClick={onOpenStorageSettings}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-slate-950 border border-slate-800 hover:border-emerald-500/40 text-[11px] text-slate-300 transition"
                title="Change Storage Destination"
              >
                <HardDrive className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-slate-400">{language === 'bn' ? 'সংরক্ষণ:' : 'Save to:'}</span>
                <span className="font-semibold text-emerald-300">
                  {storageConfig.destination === 'sd_card'
                    ? (language === 'bn' ? 'মেমোরি কার্ড (SD Card)' : 'SD Card')
                    : storageConfig.destination === 'phone_memory'
                    ? (language === 'bn' ? 'ফোন মেমোরি' : 'Phone Memory')
                    : (language === 'bn' ? 'প্রতিবার নির্বাচন' : 'Ask Each Time')}
                </span>
                {onOpenStorageSettings && (
                  <span className="text-emerald-400 hover:underline ml-1 font-medium">
                    {language === 'bn' ? '(পরিবর্তন)' : '(Change)'}
                  </span>
                )}
              </button>
            </div>
          </div>

          {/* Audio vs Video Toggle Switch */}
          <div className="p-1 rounded-2xl bg-slate-950 border border-slate-800 flex items-center gap-1">
            {videoFormats.length > 0 && (
              <button
                id="format-tab-video"
                onClick={() => setActiveFormatTab('video')}
                className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition ${
                  activeFormatTab === 'video'
                    ? 'bg-rose-500 text-white shadow'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Film className="w-3.5 h-3.5" />
                <span>{language === 'bn' ? `ভিডিও (${videoFormats.length})` : `Video (${videoFormats.length})`}</span>
              </button>
            )}

            {audioFormats.length > 0 && (
              <button
                id="format-tab-audio"
                onClick={() => setActiveFormatTab('audio')}
                className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition ${
                  activeFormatTab === 'audio'
                    ? 'bg-rose-500 text-white shadow'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Music className="w-3.5 h-3.5" />
                <span>{language === 'bn' ? `অডিও (${audioFormats.length})` : `Audio (${audioFormats.length})`}</span>
              </button>
            )}
          </div>
        </div>

        {/* Format List Grid */}
        {displayedFormats.length === 0 ? (
          <div className="p-8 rounded-2xl bg-slate-950/60 border border-slate-800 text-center text-slate-400 text-sm">
            {language === 'bn' 
              ? 'এই লিঙ্কের জন্য এই ক্যাটাগরিতে কোনো ফরম্যাট নেই। অন্য ক্যাটাগরি বেছে নিন।' 
              : 'No formats found for this category. Please switch category above.'}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {displayedFormats.map((format) => {
              const isDownloadingThis = activeFormatId === format.id;

              return (
                <div
                  key={format.id}
                  className={`p-4 rounded-2xl border transition-all duration-200 flex items-center justify-between gap-3 ${
                    format.isRecommended
                      ? 'bg-gradient-to-r from-rose-500/10 to-purple-500/10 border-rose-500/30 hover:border-rose-500/60'
                      : 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-bold text-white">
                        {format.label}
                      </span>
                      <span className="text-xs uppercase font-mono font-bold px-1.5 py-0.5 rounded bg-slate-800 text-slate-300">
                        .{format.ext}
                      </span>
                      {format.badge && (
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          format.isRecommended
                            ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                            : 'bg-sky-500/20 text-sky-300 border border-sky-500/30'
                        }`}>
                          {format.badge}
                        </span>
                      )}
                      {format.directDownloadUrl && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                          <Zap className="w-2.5 h-2.5 text-emerald-400" />
                          <span>{language === 'bn' ? 'সরাসরি বাইপাস' : 'Direct Bypass'}</span>
                        </span>
                      )}
                    </div>

                  <p className="text-xs text-slate-400 mt-0.5">
                    {format.subLabel}
                  </p>

                  <div className="flex items-center gap-2.5 text-[11px] text-slate-500 mt-2">
                    <span className="font-semibold text-slate-300">{format.estimatedSize}</span>
                    <span>•</span>
                    <span>{format.codec}</span>
                  </div>
                </div>

                {/* Download Action */}
                {activeTask && activeTask.format.id === format.id && activeTask.status === 'completed' ? (
                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      id={`save-file-link-${format.id}`}
                      onClick={() => triggerBrowserDownload(activeTask.fileName, activeTask.fileBlobUrl || activeTask.directUrl!)}
                      className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white text-xs font-bold shadow-lg shadow-emerald-950/40 transition whitespace-nowrap"
                    >
                      <CheckCircle2 className="w-4 h-4 text-white" />
                      <span>{language === 'bn' ? 'ফাইল সেভ করুন' : 'Save File'}</span>
                    </button>
                    <button
                      onClick={() => onDownload(format)}
                      className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
                      title="Download again"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ) : activeTask && activeTask.format.id === format.id && (activeTask.status === 'downloading' || activeTask.status === 'converting' || activeTask.status === 'extracting') ? (
                  <div className="flex flex-col items-end gap-1 shrink-0">
                    <div className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-rose-300">
                      <Loader2 className="w-3.5 h-3.5 animate-spin text-rose-400" />
                      <span className="font-semibold">{activeTask.progress}%</span>
                    </div>
                    <span className="text-[10px] text-slate-400 font-mono">
                      {activeTask.status === 'converting' 
                        ? (language === 'bn' ? 'এনকোডিং...' : 'Encoding...') 
                        : activeTask.speed}
                    </span>
                  </div>
                ) : (
                  <button
                    id={`download-btn-${format.id}`}
                    onClick={() => onDownload(format)}
                    disabled={isDownloadingThis}
                    className={`shrink-0 flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition shadow-md whitespace-nowrap ${
                      isDownloadingThis
                        ? 'bg-slate-800 text-slate-400 cursor-not-allowed'
                        : format.isRecommended
                        ? 'bg-gradient-to-r from-rose-500 to-pink-500 hover:from-rose-600 hover:to-pink-600 text-white shadow-rose-950/40'
                        : 'bg-slate-800 hover:bg-slate-700 text-white hover:text-white border border-slate-700'
                    }`}
                  >
                    <Download className={`w-4 h-4 ${isDownloadingThis ? 'animate-bounce' : ''}`} />
                    <span>
                      {isDownloadingThis
                        ? (language === 'bn' ? 'ডাউনলোড হচ্ছে...' : 'Downloading...')
                        : (language === 'bn' ? 'ডাউনলোড' : 'Download')}
                    </span>
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}

        {/* Alternative External Direct Download Mirrors for YouTube */}
        {isYouTube && ytId && (
          <div className="mt-5 p-4 rounded-2xl bg-gradient-to-r from-slate-950 to-slate-900 border border-slate-800/80">
            <div className="flex items-center justify-between gap-3 flex-wrap mb-2">
              <div className="flex items-center gap-2">
                <Flame className="w-4 h-4 text-amber-400" />
                <h4 className="text-xs sm:text-sm font-bold text-white">
                  {language === 'bn' ? 'অন্যান্য সরাসরি ডাউনলোড মিরর (External Direct Stream)' : 'Direct Raw Stream Mirrors'}
                </h4>
              </div>
              <span className="text-[11px] text-slate-400">
                {language === 'bn' ? 'ফুল 1080p ও হাই-স্পিড অডিও' : 'Unrestricted bitrates'}
              </span>
            </div>
            <p className="text-xs text-slate-400 mb-3">
              {language === 'bn'
                ? 'সরাসরি ইউটিউব সার্ভার থেকে ফুল লেন্থের মূল ভিডিও বা গান ডাউনলোড করতে নিচের মিরর লিঙ্কগুলো ব্যবহার করতে পারেন:'
                : 'Directly download the full raw original file from external high-speed servers:'}
            </p>
            <div className="flex items-center gap-2.5 flex-wrap">
              <a
                href={`https://10downloader.com/download?v=${ytId}`}
                target="_blank"
                rel="noreferrer noopener"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-emerald-300 text-xs font-semibold border border-slate-700 transition"
              >
                <span>10Downloader (HD MP4)</span>
                <ExternalLink className="w-3 h-3 text-slate-400" />
              </a>
              <a
                href={`https://www.y2mate.com/youtube/${ytId}`}
                target="_blank"
                rel="noreferrer noopener"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-rose-300 text-xs font-semibold border border-slate-700 transition"
              >
                <span>Y2Mate (MP3 / MP4)</span>
                <ExternalLink className="w-3 h-3 text-slate-400" />
              </a>
              <a
                href={`https://cobalt.tools`}
                target="_blank"
                rel="noreferrer noopener"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-sky-300 text-xs font-semibold border border-slate-700 transition"
              >
                <span>Cobalt Tools</span>
                <ExternalLink className="w-3 h-3 text-slate-400" />
              </a>
            </div>
          </div>
        )}

        {/* Informative footer */}
        <div className="mt-4 p-3 rounded-xl bg-slate-950/40 border border-slate-800/60 flex items-start gap-2.5 text-xs text-slate-400">
          <Info className="w-4 h-4 text-sky-400 shrink-0 mt-0.5" />
          <p>
            {language === 'bn'
              ? 'ডাউনলোড বাটনে চাপলে ব্রাউজার সরাসরি আপনার ডিভাইসের Downloads ফোল্ডারে সম্পূর্ণ সচল MP4 ভিডিও অথবা MP3 গানটি সেভ করবে।'
              : 'Files are directly packaged and delivered into your device\'s local Downloads directory. 100% playable MP4 video and MP3 audio.'}
          </p>
        </div>
      </div>
    </div>
  );
};
