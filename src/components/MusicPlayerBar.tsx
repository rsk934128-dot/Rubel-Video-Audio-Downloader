import React, { useState, useEffect, useRef } from 'react';
import { 
  Play, 
  Pause, 
  X, 
  Download, 
  Volume2, 
  VolumeX, 
  Repeat, 
  SkipForward, 
  SkipBack, 
  Music, 
  Film, 
  Maximize2, 
  Minimize2,
  Disc3,
  ShieldCheck
} from 'lucide-react';
import { YouTubeSongTrack } from '../types';
import { backgroundKeepAlive } from '../services/backgroundKeepAlive';

interface Props {
  track: YouTubeSongTrack | null;
  isPlaying: boolean;
  onPlayPause: () => void;
  onClose: () => void;
  onDownloadAudio: (track: YouTubeSongTrack) => void;
  onDownloadVideo: (track: YouTubeSongTrack) => void;
  onNext?: () => void;
  onPrev?: () => void;
}

export const MusicPlayerBar: React.FC<Props> = ({
  track,
  isPlaying,
  onPlayPause,
  onClose,
  onDownloadAudio,
  onDownloadVideo,
  onNext,
  onPrev,
}) => {
  const [isMuted, setIsMuted] = useState(false);
  const [isLooping, setIsLooping] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(180);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  // Sync with MediaSession API for Android Lock Screen controls & Album Art
  useEffect(() => {
    if (!track) return;

    setDuration(track.durationSeconds || 180);
    setCurrentTime(0);

    // Lock screen MediaSession with Album Art
    backgroundKeepAlive.updateLockScreenMediaSession(
      track.title,
      track.artist,
      track.albumArt || track.thumbnail
    );

    if (typeof navigator !== 'undefined' && 'mediaSession' in navigator) {
      try {
        navigator.mediaSession.setActionHandler('play', () => onPlayPause());
        navigator.mediaSession.setActionHandler('pause', () => onPlayPause());
        if (onNext) navigator.mediaSession.setActionHandler('nexttrack', () => onNext());
        if (onPrev) navigator.mediaSession.setActionHandler('previoustrack', () => onPrev());
      } catch (e) {
        console.warn('MediaSession action handler set skipped:', e);
      }
    }
  }, [track]);

  // Timer ticker for duration
  useEffect(() => {
    let interval: any;
    if (isPlaying) {
      interval = setInterval(() => {
        setCurrentTime((prev) => {
          if (prev >= duration) {
            if (isLooping) return 0;
            if (onNext) onNext();
            return duration;
          }
          return prev + 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isPlaying, duration, isLooping, onNext]);

  if (!track) return null;

  const formatSeconds = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <>
      {/* Hidden/Sandboxed YouTube playback node for high-fidelity audio stream */}
      <div className="hidden">
        {isPlaying && (
          <iframe
            ref={iframeRef}
            src={`https://www.youtube-nocookie.com/embed/${track.id}?autoplay=1&enablejsapi=1&playsinline=1`}
            allow="autoplay; encrypted-media"
            title={track.title}
            className="w-0 h-0 opacity-0 pointer-events-none"
          />
        )}
      </div>

      {/* Expanded Modal View (Full Screen Album Experience) */}
      {isExpanded && (
        <div className="fixed inset-0 z-50 bg-slate-950/95 backdrop-blur-xl flex flex-col justify-between p-4 sm:p-8 animate-in fade-in zoom-in-95 duration-200">
          {/* Top Bar */}
          <div className="flex items-center justify-between max-w-xl mx-auto w-full">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-pulse" />
              <span className="text-xs font-semibold text-rose-400 tracking-wider uppercase">
                মিউজিক ও অ্যালবাম প্লেয়ার
              </span>
            </div>
            <button
              onClick={() => setIsExpanded(false)}
              className="p-2 text-slate-400 hover:text-white bg-slate-900 hover:bg-slate-800 rounded-full transition"
            >
              <Minimize2 className="w-5 h-5" />
            </button>
          </div>

          {/* Center Album Art with Vinyl Glow */}
          <div className="flex flex-col items-center justify-center max-w-sm mx-auto w-full my-auto text-center">
            <div className="relative group w-64 h-64 sm:w-80 sm:h-80 rounded-2xl overflow-hidden shadow-2xl shadow-rose-950/60 border border-slate-700/60 mb-6">
              <img
                src={track.albumArt || track.thumbnail}
                alt={track.title}
                className={`w-full h-full object-cover transition duration-700 ${isPlaying ? 'scale-105' : 'scale-100 opacity-90'}`}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent" />
              
              {/* Spinning Disc Badge */}
              <div className="absolute bottom-3 right-3 bg-slate-900/90 backdrop-blur-md px-3 py-1.5 rounded-full border border-slate-700/70 flex items-center gap-2">
                <Disc3 className={`w-4 h-4 text-rose-400 ${isPlaying ? 'animate-spin' : ''}`} />
                <span className="text-xs font-medium text-slate-200">
                  {track.type === 'album' ? 'ফুল অ্যালবাম' : 'অডিও ট্র্যাক'}
                </span>
              </div>
            </div>

            <h2 className="text-lg sm:text-xl font-bold text-white line-clamp-2 px-2">
              {track.title}
            </h2>
            <p className="text-sm text-rose-400 mt-1 font-medium">
              {track.artist}
            </p>
            <div className="flex items-center gap-2 mt-2 text-xs text-slate-400">
              <span>{track.views}</span>
              <span>•</span>
              <span className="flex items-center gap-1 text-emerald-400">
                <ShieldCheck className="w-3.5 h-3.5" />
                লক স্ক্রিন সাপোর্ট
              </span>
            </div>
          </div>

          {/* Controls & Download Actions */}
          <div className="max-w-xl mx-auto w-full space-y-4 mb-2">
            {/* Seek Bar */}
            <div className="space-y-1">
              <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden relative cursor-pointer">
                <div
                  className="bg-gradient-to-r from-rose-500 to-pink-500 h-full transition-all duration-300"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
              <div className="flex justify-between text-[11px] text-slate-400 font-mono">
                <span>{formatSeconds(currentTime)}</span>
                <span>{track.duration || formatSeconds(duration)}</span>
              </div>
            </div>

            {/* Playback Controls */}
            <div className="flex items-center justify-center gap-6 sm:gap-8">
              <button
                onClick={() => setIsLooping(!isLooping)}
                className={`p-2 rounded-full transition ${isLooping ? 'text-rose-400 bg-rose-500/20' : 'text-slate-400 hover:text-white'}`}
                title="লুপ চালু/বন্ধ"
              >
                <Repeat className="w-5 h-5" />
              </button>

              {onPrev && (
                <button
                  onClick={onPrev}
                  className="p-3 text-slate-300 hover:text-white bg-slate-900 rounded-full transition"
                >
                  <SkipBack className="w-5 h-5" />
                </button>
              )}

              <button
                onClick={onPlayPause}
                className="p-5 bg-gradient-to-r from-rose-500 to-pink-600 hover:from-rose-600 hover:to-pink-700 text-white rounded-full shadow-lg shadow-rose-500/30 hover:scale-105 transition"
              >
                {isPlaying ? <Pause className="w-7 h-7 fill-white" /> : <Play className="w-7 h-7 fill-white ml-0.5" />}
              </button>

              {onNext && (
                <button
                  onClick={onNext}
                  className="p-3 text-slate-300 hover:text-white bg-slate-900 rounded-full transition"
                >
                  <SkipForward className="w-5 h-5" />
                </button>
              )}

              <button
                onClick={() => setIsMuted(!isMuted)}
                className="p-2 text-slate-400 hover:text-white transition"
              >
                {isMuted ? <VolumeX className="w-5 h-5 text-rose-400" /> : <Volume2 className="w-5 h-5" />}
              </button>
            </div>

            {/* Direct 1-Click Downloads */}
            <div className="grid grid-cols-2 gap-3 pt-2">
              <button
                onClick={() => onDownloadAudio(track)}
                className="flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-medium text-sm shadow-md shadow-emerald-950/30 transition hover:scale-[1.02]"
              >
                <Music className="w-4 h-4" />
                <span>MP3 অডিও (320k)</span>
              </button>
              <button
                onClick={() => onDownloadVideo(track)}
                className="flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-gradient-to-r from-rose-600 to-pink-600 hover:from-rose-500 hover:to-pink-500 text-white font-medium text-sm shadow-md shadow-rose-950/30 transition hover:scale-[1.02]"
              >
                <Film className="w-4 h-4" />
                <span>HD ভিডিও (MP4)</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Floating Bottom Mini Player Bar */}
      <div className="fixed bottom-0 left-0 right-0 z-40 bg-slate-950/95 backdrop-blur-xl border-t border-slate-800 shadow-2xl px-3 sm:px-6 py-2.5">
        {/* Progress bar line */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-slate-800">
          <div
            className="h-full bg-gradient-to-r from-rose-500 via-pink-500 to-sky-500 transition-all duration-300"
            style={{ width: `${progressPercent}%` }}
          />
        </div>

        <div className="max-w-6xl mx-auto flex items-center justify-between gap-3">
          {/* Song info & Album Art */}
          <div 
            onClick={() => setIsExpanded(true)}
            className="flex items-center gap-3 cursor-pointer group min-w-0 flex-1"
          >
            <div className="relative w-11 h-11 sm:w-12 sm:h-12 rounded-lg overflow-hidden shrink-0 border border-slate-700/80 shadow-md">
              <img
                src={track.albumArt || track.thumbnail}
                alt={track.title}
                className="w-full h-full object-cover group-hover:scale-105 transition"
              />
              <div className="absolute inset-0 bg-black/20 group-hover:bg-transparent transition" />
              {isPlaying && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                  <div className="flex items-end gap-0.5 h-3">
                    <span className="w-1 bg-rose-400 animate-pulse h-full" />
                    <span className="w-1 bg-rose-400 animate-pulse h-2" />
                    <span className="w-1 bg-rose-400 animate-pulse h-3" />
                  </div>
                </div>
              )}
            </div>

            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h4 className="text-xs sm:text-sm font-semibold text-white truncate group-hover:text-rose-400 transition">
                  {track.title}
                </h4>
                <span className="hidden sm:inline-block px-1.5 py-0.2 text-[9px] font-medium bg-rose-500/20 text-rose-400 rounded">
                  অ্যালবাম
                </span>
              </div>
              <p className="text-[11px] sm:text-xs text-slate-400 truncate">
                {track.artist} • <span className="font-mono text-slate-300">{formatSeconds(currentTime)} / {track.duration}</span>
              </p>
            </div>
          </div>

          {/* Controls */}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            {onPrev && (
              <button
                onClick={onPrev}
                className="hidden sm:inline-flex p-2 text-slate-400 hover:text-white transition"
              >
                <SkipBack className="w-4 h-4" />
              </button>
            )}

            <button
              onClick={onPlayPause}
              className="p-2.5 sm:p-3 bg-gradient-to-r from-rose-500 to-pink-600 hover:from-rose-600 hover:to-pink-700 text-white rounded-full shadow-md shadow-rose-500/20 transition hover:scale-105"
            >
              {isPlaying ? <Pause className="w-4 h-4 sm:w-5 sm:h-5 fill-white" /> : <Play className="w-4 h-4 sm:w-5 sm:h-5 fill-white ml-0.5" />}
            </button>

            {onNext && (
              <button
                onClick={onNext}
                className="hidden sm:inline-flex p-2 text-slate-400 hover:text-white transition"
              >
                <SkipForward className="w-4 h-4" />
              </button>
            )}

            {/* Quick 1-click Audio Download button */}
            <button
              onClick={() => onDownloadAudio(track)}
              title="MP3 অডিও ডাউনলোড"
              className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600/90 hover:bg-emerald-500 text-white rounded-lg text-xs font-medium transition shadow-sm"
            >
              <Music className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">MP3</span>
            </button>

            {/* Quick 1-click Video Download button */}
            <button
              onClick={() => onDownloadVideo(track)}
              title="HD ভিডিও ডাউনলোড"
              className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-600/90 hover:bg-rose-500 text-white rounded-lg text-xs font-medium transition shadow-sm"
            >
              <Film className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">MP4</span>
            </button>

            <button
              onClick={() => setIsExpanded(true)}
              className="p-2 text-slate-400 hover:text-white transition"
              title="ফুল স্ক্রিন প্লেয়ার"
            >
              <Maximize2 className="w-4 h-4" />
            </button>

            <button
              onClick={onClose}
              className="p-2 text-slate-500 hover:text-rose-400 transition"
              title="বন্ধ করুন"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </>
  );
};
