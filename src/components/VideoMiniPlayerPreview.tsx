import React, { useState, useRef, useEffect } from 'react';
import { VideoMetadata, MediaFormat, Language, DownloadTask } from '../types';
import { extractYouTubeId } from '../services/videoExtractor';
import { 
  Play, 
  Pause, 
  Volume2, 
  VolumeX, 
  Maximize2, 
  Film, 
  Cpu, 
  Layers, 
  Gauge, 
  Music, 
  Download, 
  Sparkles, 
  CheckCircle2, 
  ShieldCheck, 
  Clock, 
  Eye, 
  FileCode,
  Sliders,
  ExternalLink,
  Tv,
  Loader2,
  HardDrive,
  Smartphone
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

export const VideoMiniPlayerPreview: React.FC<Props> = ({
  video,
  activeFormatId,
  activeTask,
  onDownload,
  onOpenStorageSettings,
  language,
}) => {
  const [storageConfig, setStorageConfig] = useState<StorageConfig>(storagePreferenceManager.getConfig());

  useEffect(() => {
    return storagePreferenceManager.subscribe((c) => setStorageConfig(c));
  }, []);
  // Find highest quality video format as initial preview format, or first format
  const videoFormats = video.formats.filter(f => f.type === 'video');
  const audioFormats = video.formats.filter(f => f.type === 'audio');

  const [selectedFormat, setSelectedFormat] = useState<MediaFormat>(() => {
    if (activeFormatId) {
      const found = video.formats.find(f => f.id === activeFormatId);
      if (found) return found;
    }
    return videoFormats.find(f => f.isRecommended) || videoFormats[0] || video.formats[0];
  });

  // Player state
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(video.durationSeconds || 120);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [showIframe, setShowIframe] = useState(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  // Sync format if activeFormatId changes from outside
  useEffect(() => {
    if (activeFormatId) {
      const match = video.formats.find(f => f.id === activeFormatId);
      if (match) setSelectedFormat(match);
    }
  }, [activeFormatId, video.formats]);

  const ytId = extractYouTubeId(video.originalUrl) || (video.id && video.id.length === 11 ? video.id : null);
  const isYouTube = video.platform === 'youtube' || !!ytId;
  const isVertical = video.platform === 'tiktok' || 
    video.platform === 'instagram' || 
    selectedFormat.resolution?.includes('1080x1920') || 
    selectedFormat.resolution?.includes('720x1280') ||
    video.title.toLowerCase().includes('shorts') ||
    video.title.toLowerCase().includes('reel');

  // Direct playable video source
  const playableVideoUrl = video.sampleVideoUrl || 
    (video.platform === 'direct' && /\.(mp4|webm|mov)(\?.*)?$/i.test(video.originalUrl) ? video.originalUrl : null);

  const togglePlay = () => {
    if (isYouTube) {
      setShowIframe(true);
      setIsPlaying(!isPlaying);
      return;
    }

    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
        setIsPlaying(false);
      } else {
        videoRef.current.play().then(() => setIsPlaying(true)).catch(() => {
          // In case browser blocks unmuted playback
          if (videoRef.current) {
            videoRef.current.muted = true;
            setIsMuted(true);
            videoRef.current.play().then(() => setIsPlaying(true)).catch(() => {});
          }
        });
      }
    } else {
      setIsPlaying(!isPlaying);
    }
  };

  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
    }
    setIsMuted(!isMuted);
  };

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      setCurrentTime(videoRef.current.currentTime);
      if (videoRef.current.duration && !isNaN(videoRef.current.duration)) {
        setDuration(videoRef.current.duration);
      }
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    setCurrentTime(val);
    if (videoRef.current) {
      videoRef.current.currentTime = val;
    }
  };

  const handleSpeedChange = () => {
    const speeds = [1, 1.25, 1.5, 2];
    const nextIdx = (speeds.indexOf(playbackSpeed) + 1) % speeds.length;
    const nextSpeed = speeds[nextIdx];
    setPlaybackSpeed(nextSpeed);
    if (videoRef.current) {
      videoRef.current.playbackRate = nextSpeed;
    }
  };

  const formatSecs = (sec: number) => {
    const mins = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${mins}:${s < 10 ? '0' : ''}${s}`;
  };

  // Derive detailed codec and resolution metadata based on current format
  const currentResolution = selectedFormat.resolution || (
    selectedFormat.quality.includes('1080') ? '1920×1080 (1080p FHD)' :
    selectedFormat.quality.includes('720') ? '1280×720 (720p HD)' :
    selectedFormat.quality.includes('480') ? '854×480 (480p SD)' :
    selectedFormat.quality.includes('360') ? '640×360 (360p)' :
    selectedFormat.type === 'audio' ? 'Audio Bitstream (N/A)' : '1920×1080'
  );

  const currentCodec = selectedFormat.codec || (
    selectedFormat.type === 'audio' ? 'MPEG-1 Layer 3 (MP3)' : 'H.264 / AVC (High Profile)'
  );

  const currentAudioCodec = selectedFormat.type === 'audio' 
    ? (selectedFormat.ext === 'm4a' ? 'AAC-LC 256 kbps (Apple Core)' : 'MP3 Stereo 320 kbps (44.1 kHz)')
    : 'AAC Stereo 128 kbps (Embedded)';

  const currentFps = selectedFormat.fps ? `${selectedFormat.fps} fps` : (selectedFormat.type === 'video' ? '60 fps' : 'N/A');
  const currentBitrate = selectedFormat.bitrate || (selectedFormat.type === 'audio' ? '320 kbps' : '4,500 kbps (VBR)');
  const currentContainer = selectedFormat.ext.toUpperCase();

  const isCurrentTaskDownloading = activeTask && activeTask.status === 'downloading';

  return (
    <div 
      id="video-mini-player-preview" 
      className="w-full rounded-3xl bg-gradient-to-b from-slate-900 via-slate-900/95 to-slate-950 border border-slate-700/70 shadow-2xl overflow-hidden backdrop-blur-xl mb-7 transition-all"
    >
      {/* Top Header Bar */}
      <div className="px-5 py-3.5 border-b border-slate-800 flex flex-wrap items-center justify-between gap-2.5 bg-slate-950/60">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-rose-500/10 text-rose-400 border border-rose-500/20 flex items-center justify-center shrink-0">
            <Tv className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
                {language === 'bn' ? 'ভিডিও লাইভ প্রিভিউ ও স্পেক্স' : 'Video Live Mini-Player & Specs'}
              </h3>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                {language === 'bn' ? 'প্রিভিউ প্রস্তুত' : 'Preview Ready'}
              </span>
            </div>
            <p className="text-[11px] text-slate-400">
              {language === 'bn' 
                ? 'ডাউনলোড শুরু করার আগে ভিডিও কোয়ালিটি ও কোডেক তথ্য পর্যবেক্ষণ করুন' 
                : 'Inspect video resolution, codec details and preview stream before downloading'}
            </p>
          </div>
        </div>

        {/* Platform Indicator */}
        <div className="flex items-center gap-2">
          <span className="px-2.5 py-1 rounded-xl text-xs font-semibold bg-slate-800/80 text-slate-300 border border-slate-700/80 flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span className="capitalize">{video.platform}</span>
          </span>
          <span className="text-xs text-slate-400 font-mono px-2 py-1 rounded-lg bg-slate-900 border border-slate-800">
            {video.duration}
          </span>
        </div>
      </div>

      {/* Main Content Area: Mini Player & Technical Inspector */}
      <div className="p-4 sm:p-6 grid grid-cols-1 lg:grid-cols-12 gap-5 sm:gap-6 items-start">
        {/* Left Column: Visual Mini-Player Stage (7 cols) */}
        <div className="lg:col-span-7 flex flex-col items-center w-full">
          <div 
            className={`relative w-full rounded-2xl overflow-hidden bg-black border border-slate-800 shadow-inner group transition-all ${
              isVertical ? 'max-w-xs aspect-[9/16]' : 'aspect-video'
            }`}
          >
            {/* 1. YouTube Iframe Mode */}
            {isYouTube && ytId && showIframe ? (
              <iframe
                src={`https://www.youtube-nocookie.com/embed/${ytId}?autoplay=1&rel=0&modestbranding=1`}
                title={video.title}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                className="w-full h-full border-0"
              />
            ) : playableVideoUrl ? (
              /* 2. Direct HTML5 Video Stream */
              <video
                ref={videoRef}
                src={playableVideoUrl}
                poster={video.thumbnail}
                playsInline
                muted={isMuted}
                onTimeUpdate={handleTimeUpdate}
                onEnded={() => setIsPlaying(false)}
                className="w-full h-full object-contain"
              />
            ) : (
              /* 3. High-Definition Poster / Interactive Preview Stage */
              <div className="relative w-full h-full">
                <img
                  src={video.thumbnail}
                  alt={video.title}
                  className="w-full h-full object-cover transition duration-300 group-hover:scale-105"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = ytId 
                      ? `https://i.ytimg.com/vi/${ytId}/hqdefault.jpg`
                      : 'https://images.unsplash.com/photo-1611162617474-5b21e879e113?auto=format&fit=crop&w=800&q=80';
                  }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-black/30 pointer-events-none" />

                {/* Big Center Play Button Overlay */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <button
                    id="mini-player-overlay-play-btn"
                    onClick={togglePlay}
                    className="w-16 h-16 rounded-full bg-rose-500 hover:bg-rose-600 text-white flex items-center justify-center shadow-xl shadow-rose-500/30 transform hover:scale-110 active:scale-95 transition"
                    title="Play Preview"
                  >
                    <Play className="w-7 h-7 fill-white ml-1" />
                  </button>
                </div>

                {/* Top Overlay Badge */}
                <div className="absolute top-3 left-3 flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-black/75 backdrop-blur-md border border-white/10 text-[11px] font-semibold text-white">
                  <Film className="w-3.5 h-3.5 text-rose-400" />
                  <span>{selectedFormat.quality}</span>
                </div>

                {/* Title overlay in poster */}
                <div className="absolute bottom-3 left-3 right-3 text-left pointer-events-none">
                  <p className="text-xs font-semibold text-white truncate drop-shadow">
                    {video.title}
                  </p>
                  <p className="text-[10px] text-slate-300 mt-0.5">
                    {video.author} • {video.viewCount}
                  </p>
                </div>
              </div>
            )}

            {/* Live Playback Controls Bar (for playable video or interactive stage) */}
            {(!isYouTube || !showIframe) && (
              <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/95 via-black/70 to-transparent p-3 pt-6 flex flex-col gap-2 opacity-95 transition-opacity">
                {/* Scrubber timeline */}
                <div className="flex items-center gap-2">
                  <input
                    type="range"
                    min={0}
                    max={duration || 100}
                    value={currentTime}
                    onChange={handleSeek}
                    className="w-full h-1 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-rose-500"
                  />
                  <span className="text-[10px] text-slate-300 font-mono whitespace-nowrap">
                    {formatSecs(currentTime)} / {formatSecs(duration)}
                  </span>
                </div>

                {/* Bottom Control Buttons */}
                <div className="flex items-center justify-between text-white text-xs">
                  <div className="flex items-center gap-2">
                    <button
                      id="mini-player-toggle-btn"
                      onClick={togglePlay}
                      className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 transition text-white"
                      title={isPlaying ? 'Pause' : 'Play'}
                    >
                      {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 fill-white" />}
                    </button>

                    <button
                      id="mini-player-mute-btn"
                      onClick={toggleMute}
                      className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 transition text-white"
                      title={isMuted ? 'Unmute' : 'Mute'}
                    >
                      {isMuted ? <VolumeX className="w-4 h-4 text-slate-400" /> : <Volume2 className="w-4 h-4 text-emerald-400" />}
                    </button>

                    <button
                      onClick={handleSpeedChange}
                      className="px-2 py-0.5 rounded-md bg-white/10 hover:bg-white/20 transition font-mono text-[11px]"
                      title="Playback Speed"
                    >
                      {playbackSpeed}x
                    </button>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-[10px] px-2 py-0.5 rounded bg-rose-500/30 text-rose-300 border border-rose-500/40 font-semibold uppercase">
                      {selectedFormat.ext}
                    </span>
                    {isYouTube && ytId && !showIframe && (
                      <button
                        onClick={() => setShowIframe(true)}
                        className="text-[11px] font-semibold text-sky-400 hover:text-sky-300 underline"
                      >
                        {language === 'bn' ? 'ইউটিউব প্লেয়ার চালান' : 'Load Embed'}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Quick Audio / Video Format Pills right below player */}
          <div className="w-full mt-3 flex items-center justify-between gap-2 overflow-x-auto pb-1">
            <span className="text-[11px] font-semibold text-slate-400 shrink-0">
              {language === 'bn' ? 'কোয়ালিটি নির্বাচন:' : 'Quick Select:'}
            </span>
            <div className="flex items-center gap-1.5">
              {video.formats.slice(0, 5).map((fmt) => {
                const isSelected = selectedFormat.id === fmt.id;
                return (
                  <button
                    key={fmt.id}
                    id={`quick-fmt-btn-${fmt.id}`}
                    onClick={() => setSelectedFormat(fmt)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition border whitespace-nowrap ${
                      isSelected
                        ? 'bg-rose-500 text-white border-rose-400 shadow-md shadow-rose-950/40'
                        : 'bg-slate-800/80 hover:bg-slate-700 text-slate-300 border-slate-700'
                    }`}
                  >
                    {fmt.quality}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Column: Metadata & Technical Codec Inspector (5 cols) */}
        <div className="lg:col-span-5 flex flex-col justify-between h-full space-y-4">
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-1.5">
                <Cpu className="w-4 h-4 text-rose-400" />
                <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider">
                  {language === 'bn' ? 'মিডিয়া স্পেসিফিকেশন ও কোডেক' : 'Media Codec & Stream Specs'}
                </h4>
              </div>
              <span className="text-[10px] text-slate-400 font-mono">ISO/IEC Standard</span>
            </div>

            {/* Spec Badges Grid */}
            <div className="grid grid-cols-2 gap-2.5">
              {/* 1. Resolution */}
              <div className="p-3 rounded-2xl bg-slate-950/70 border border-slate-800 flex flex-col">
                <span className="text-[10px] font-medium text-slate-400 flex items-center gap-1">
                  <Film className="w-3 h-3 text-sky-400" />
                  {language === 'bn' ? 'রেজোলিউশন (Resolution)' : 'Resolution'}
                </span>
                <span className="text-xs sm:text-sm font-bold text-white mt-1 font-mono">
                  {currentResolution}
                </span>
                <span className="text-[10px] text-slate-500 mt-0.5">
                  {isVertical ? '9:16 Vertical Portrait' : '16:9 Widescreen Standard'}
                </span>
              </div>

              {/* 2. Video Codec */}
              <div className="p-3 rounded-2xl bg-slate-950/70 border border-slate-800 flex flex-col">
                <span className="text-[10px] font-medium text-slate-400 flex items-center gap-1">
                  <Cpu className="w-3 h-3 text-purple-400" />
                  {language === 'bn' ? 'ভিডিও কোডেক (Video Codec)' : 'Video Codec'}
                </span>
                <span className="text-xs sm:text-sm font-bold text-purple-300 mt-1 font-mono truncate" title={currentCodec}>
                  {currentCodec}
                </span>
                <span className="text-[10px] text-slate-500 mt-0.5">
                  Hardware Accelerated
                </span>
              </div>

              {/* 3. Audio Codec & Bitrate */}
              <div className="p-3 rounded-2xl bg-slate-950/70 border border-slate-800 flex flex-col">
                <span className="text-[10px] font-medium text-slate-400 flex items-center gap-1">
                  <Music className="w-3 h-3 text-emerald-400" />
                  {language === 'bn' ? 'অডিও কোডেক (Audio Codec)' : 'Audio Codec'}
                </span>
                <span className="text-xs sm:text-sm font-bold text-emerald-300 mt-1 font-mono truncate" title={currentAudioCodec}>
                  {currentAudioCodec}
                </span>
                <span className="text-[10px] text-slate-500 mt-0.5">
                  Stereo 48.0 kHz
                </span>
              </div>

              {/* 4. Frame Rate (FPS) */}
              <div className="p-3 rounded-2xl bg-slate-950/70 border border-slate-800 flex flex-col">
                <span className="text-[10px] font-medium text-slate-400 flex items-center gap-1">
                  <Gauge className="w-3 h-3 text-amber-400" />
                  {language === 'bn' ? 'ফ্রেম রেট (FPS)' : 'Frame Rate (FPS)'}
                </span>
                <span className="text-xs sm:text-sm font-bold text-amber-300 mt-1 font-mono">
                  {currentFps}
                </span>
                <span className="text-[10px] text-slate-500 mt-0.5">
                  Constant Frame Rate
                </span>
              </div>

              {/* 5. Target Bitrate */}
              <div className="p-3 rounded-2xl bg-slate-950/70 border border-slate-800 flex flex-col">
                <span className="text-[10px] font-medium text-slate-400 flex items-center gap-1">
                  <Sliders className="w-3 h-3 text-rose-400" />
                  {language === 'bn' ? 'বিটরেট (Bitrate)' : 'Target Bitrate'}
                </span>
                <span className="text-xs sm:text-sm font-bold text-white mt-1 font-mono">
                  {currentBitrate}
                </span>
                <span className="text-[10px] text-slate-500 mt-0.5">
                  High Fidelity Stream
                </span>
              </div>

              {/* 6. Estimated File Size */}
              <div className="p-3 rounded-2xl bg-slate-950/70 border border-slate-800 flex flex-col">
                <span className="text-[10px] font-medium text-slate-400 flex items-center gap-1">
                  <FileCode className="w-3 h-3 text-sky-400" />
                  {language === 'bn' ? 'আনুমানিক সাইজ' : 'Estimated Size'}
                </span>
                <span className="text-xs sm:text-sm font-bold text-sky-300 mt-1 font-mono">
                  {selectedFormat.estimatedSize}
                </span>
                <span className="text-[10px] text-slate-500 mt-0.5">
                  Container: {currentContainer}
                </span>
              </div>
            </div>
          </div>

          {/* Primary Action Button: Initiate Download */}
          <div className="pt-2 border-t border-slate-800">
            {/* Storage Destination Indicator */}
            <div className="flex items-center justify-between mb-2.5 px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-[11px]">
              <div className="flex items-center gap-1.5 text-slate-300 truncate">
                <HardDrive className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span className="text-slate-400">{language === 'bn' ? 'সেভ লোকেশন:' : 'Save To:'}</span>
                <span className="font-semibold text-emerald-300 truncate">
                  {storageConfig.destination === 'sd_card'
                    ? (language === 'bn' ? 'মেমোরি কার্ড (SD Card)' : 'SD Card')
                    : storageConfig.destination === 'phone_memory'
                    ? (language === 'bn' ? 'ফোন মেমোরি' : 'Phone Memory')
                    : (language === 'bn' ? 'প্রতিবার নির্বাচন' : 'Prompt')}
                </span>
              </div>
              {onOpenStorageSettings && (
                <button
                  id="preview-change-storage-btn"
                  onClick={onOpenStorageSettings}
                  className="text-emerald-400 hover:text-emerald-300 font-semibold underline shrink-0 text-[11px] ml-2"
                >
                  {language === 'bn' ? 'পরিবর্তন' : 'Change'}
                </button>
              )}
            </div>

            <div className="flex items-center justify-between text-xs text-slate-300 mb-2">
              <span className="font-semibold">{selectedFormat.label}</span>
              <span className="text-rose-400 font-bold font-mono">{selectedFormat.estimatedSize}</span>
            </div>

            <button
              id="mini-player-direct-download-btn"
              onClick={() => onDownload(selectedFormat)}
              disabled={isCurrentTaskDownloading}
              className={`w-full py-3 px-4 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 transition shadow-xl ${
                isCurrentTaskDownloading
                  ? 'bg-slate-800 text-slate-400 cursor-not-allowed border border-slate-700'
                  : 'bg-gradient-to-r from-rose-500 to-pink-500 hover:from-rose-600 hover:to-pink-600 text-white shadow-rose-500/30 active:scale-[0.98]'
              }`}
            >
              {isCurrentTaskDownloading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>{language === 'bn' ? 'ডাউনলোড চলমান...' : 'Downloading...'}</span>
                </>
              ) : (
                <>
                  <Download className="w-4 h-4" />
                  <span>
                    {language === 'bn' 
                      ? `${selectedFormat.quality} ডাউনলোড শুরু করুন` 
                      : `Download ${selectedFormat.quality} Now`}
                  </span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
