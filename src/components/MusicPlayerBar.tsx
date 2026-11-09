import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  Play, 
  Pause, 
  X, 
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
  ShieldCheck,
  Zap,
  Radio,
  Tv
} from 'lucide-react';
import { YouTubeSongTrack } from '../types';
import { backgroundKeepAlive } from '../services/backgroundKeepAlive';
import { androidBackgroundAudio } from '../services/androidBackgroundAudio';

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
  const [showVideo, setShowVideo] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(180);
  const [isBuffering, setIsBuffering] = useState(false);
  const [audioError, setAudioError] = useState<string | null>(null);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const iframeRef = useRef<HTMLIFrameElement | null>(null);
  const progressBarRef = useRef<HTMLDivElement | null>(null);
  const miniProgressBarRef = useRef<HTMLDivElement | null>(null);

  // Check if track is a YouTube track
  const isYouTube = Boolean(track && (track.id || (track.url && track.url.includes('youtu'))));
  const youtubeVideoId = track ? (track.id.length === 11 ? track.id : (track.url.match(/(?:v=|\/embed\/|youtu\.be\/)([a-zA-Z0-9_-]{11})/)?.[1] || track.id)) : '';

  // Direct helper to send commands to YouTube IFrame API
  const postIframeCommand = useCallback((func: string, args: any = '') => {
    if (iframeRef.current && iframeRef.current.contentWindow) {
      try {
        iframeRef.current.contentWindow.postMessage(
          JSON.stringify({ event: 'command', func, args }),
          '*'
        );
      } catch (err) {
        console.warn('Iframe postMessage command failed:', err);
      }
    }
  }, []);

  // 1. Play/Pause synchronization with YouTube iframe or native audio, plus Android Foreground Service
  useEffect(() => {
    if (!track) return;

    if (isPlaying) {
      if (isYouTube) {
        postIframeCommand('playVideo');
      } else if (audioRef.current) {
        audioRef.current.play().catch((err) => {
          console.warn('Native audio play error:', err);
        });
      }

      backgroundKeepAlive.enableMusicSession(
        track.title,
        track.artist,
        track.albumArt || track.thumbnail
      );

      // Start Android Foreground Service for persistent playback when minimized
      androidBackgroundAudio.startForeground({
        title: track.title,
        artist: track.artist,
        artworkUrl: track.albumArt || track.thumbnail,
        isPlaying: true,
      });
    } else {
      if (isYouTube) {
        postIframeCommand('pauseVideo');
      } else if (audioRef.current) {
        audioRef.current.pause();
      }

      backgroundKeepAlive.setMusicPlaybackState('paused');
      androidBackgroundAudio.updateMetadata({ isPlaying: false });
    }
  }, [isPlaying, track, isYouTube, postIframeCommand]);

  // 2. Track Change: Immediately load new track and start playing with zero delay
  useEffect(() => {
    if (!track) return;

    setDuration(track.durationSeconds || 180);
    setCurrentTime(0);
    setAudioError(null);
    setIsBuffering(false);

    // Setup native lock-screen MediaSession controls
    backgroundKeepAlive.enableMusicSession(
      track.title,
      track.artist,
      track.albumArt || track.thumbnail
    );

    // Update Android Foreground Service with new track metadata
    androidBackgroundAudio.startForeground({
      title: track.title,
      artist: track.artist,
      artworkUrl: track.albumArt || track.thumbnail,
      isPlaying,
    });

    if (typeof navigator !== 'undefined' && 'mediaSession' in navigator) {
      try {
        navigator.mediaSession.setActionHandler('play', () => onPlayPause());
        navigator.mediaSession.setActionHandler('pause', () => onPlayPause());
        if (onNext) navigator.mediaSession.setActionHandler('nexttrack', () => onNext());
        if (onPrev) navigator.mediaSession.setActionHandler('previoustrack', () => onPrev());
        navigator.mediaSession.setActionHandler('seekto', (details) => {
          if (details.seekTime !== undefined) {
            handleSeekToSeconds(details.seekTime);
          }
        });
        navigator.mediaSession.setActionHandler('seekbackward', () => {
          handleSeekToSeconds(Math.max(0, currentTime - 10));
        });
        navigator.mediaSession.setActionHandler('seekforward', () => {
          handleSeekToSeconds(Math.min(duration, currentTime + 10));
        });
      } catch (e) {
        console.warn('MediaSession handler registration skipped:', e);
      }
    }
  }, [track]);

  // 3. Listen to YouTube postMessage events for accurate time tracking and track end
  useEffect(() => {
    const handleWindowMessage = (event: MessageEvent) => {
      if (typeof event.data !== 'string') return;
      try {
        const data = JSON.parse(event.data);
        if (data.event === 'infoDelivery' && data.info) {
          if (typeof data.info.currentTime === 'number') {
            setCurrentTime(Math.floor(data.info.currentTime));
          }
          if (typeof data.info.duration === 'number' && data.info.duration > 0) {
            setDuration(Math.floor(data.info.duration));
          }
          // PlayerState: 0 is Ended, 1 is Playing, 2 is Paused, 3 is Buffering
          if (data.info.playerState === 3) {
            setIsBuffering(true);
          } else if (data.info.playerState === 1) {
            setIsBuffering(false);
          } else if (data.info.playerState === 0) {
            setIsBuffering(false);
            if (isLooping) {
              postIframeCommand('seekTo', [0, true]);
              postIframeCommand('playVideo');
            } else if (onNext) {
              onNext();
            }
          }
        }
      } catch {}
    };

    window.addEventListener('message', handleWindowMessage);
    return () => window.removeEventListener('message', handleWindowMessage);
  }, [isLooping, onNext, postIframeCommand]);

  // 4. Smooth playback timer tick when playing
  useEffect(() => {
    if (!isPlaying) return;
    const interval = setInterval(() => {
      setCurrentTime((prev) => {
        if (duration > 0 && prev >= duration) {
          if (isLooping) return 0;
          return prev;
        }
        return prev + 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [isPlaying, duration, isLooping]);

  // 5. Listen for media action events from Android System Notification (Play, Pause, Next, Prev)
  useEffect(() => {
    const unsubscribe = androidBackgroundAudio.onAction((action) => {
      if (action === 'play') {
        if (!isPlaying) onPlayPause();
      } else if (action === 'pause') {
        if (isPlaying) onPlayPause();
      } else if (action === 'next') {
        if (onNext) onNext();
      } else if (action === 'prev') {
        if (onPrev) onPrev();
      }
    });
    return () => unsubscribe();
  }, [isPlaying, onPlayPause, onNext, onPrev]);

  // Seek helper
  const handleSeekToSeconds = (targetSec: number) => {
    const clamped = Math.max(0, Math.min(duration, targetSec));
    setCurrentTime(clamped);
    if (isYouTube) {
      postIframeCommand('seekTo', [clamped, true]);
    } else if (audioRef.current) {
      audioRef.current.currentTime = clamped;
    }
  };

  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const pct = Math.max(0, Math.min(1, clickX / rect.width));
    const targetSeconds = pct * duration;
    handleSeekToSeconds(targetSeconds);
  };

  const handleToggleMute = () => {
    const nextMuted = !isMuted;
    setIsMuted(nextMuted);
    if (isYouTube) {
      postIframeCommand(nextMuted ? 'mute' : 'unMute');
    } else if (audioRef.current) {
      audioRef.current.muted = nextMuted;
    }
  };

  const handleClose = () => {
    if (isYouTube) {
      postIframeCommand('pauseVideo');
    } else if (audioRef.current) {
      audioRef.current.pause();
    }
    backgroundKeepAlive.disableMusicSession();
    androidBackgroundAudio.stopForeground();
    onClose();
  };

  if (!track) return null;

  const formatSeconds = (sec: number) => {
    if (isNaN(sec) || sec < 0) return '0:00';
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <>
      {/* 
        Authentic Media Engine:
        For YouTube tracks, renders genuine YouTube iframe player so EVERY song plays its own authentic audio/video!
        For non-YouTube audio, uses native HTML5 audio.
      */}
      {isYouTube && youtubeVideoId ? (
        <iframe
          ref={iframeRef}
          key={`yt-${youtubeVideoId}`}
          src={`https://www.youtube-nocookie.com/embed/${youtubeVideoId}?enablejsapi=1&autoplay=1&playsinline=1&controls=0&origin=${typeof window !== 'undefined' ? encodeURIComponent(window.location.origin) : ''}`}
          title={track.title}
          allow="autoplay; encrypted-media; picture-in-picture"
          className={
            isExpanded && showVideo
              ? "fixed inset-x-4 top-16 max-w-lg mx-auto aspect-video z-55 rounded-2xl shadow-2xl border border-slate-700 bg-black"
              : "fixed -bottom-96 -right-96 w-1 h-1 opacity-0 pointer-events-none"
          }
        />
      ) : (
        <audio
          ref={audioRef}
          src={track.url}
          preload="auto"
          playsInline
          loop={isLooping}
          muted={isMuted}
          onTimeUpdate={(e) => {
            setCurrentTime(e.currentTarget.currentTime);
            setIsBuffering(false);
          }}
          onWaiting={() => setIsBuffering(true)}
          onPlaying={() => setIsBuffering(false)}
          onLoadedMetadata={(e) => {
            setIsBuffering(false);
            const metaDuration = e.currentTarget.duration;
            if (metaDuration && !isNaN(metaDuration) && metaDuration > 1) {
              setDuration(Math.floor(metaDuration));
            }
          }}
          onEnded={() => {
            if (isLooping) {
              if (audioRef.current) {
                audioRef.current.currentTime = 0;
                audioRef.current.play().catch(() => {});
              }
            } else if (onNext) {
              onNext();
            }
          }}
          onError={() => {
            setAudioError('অডিও স্ট্রিম লোড হতে সমস্যা হয়েছে');
            setIsBuffering(false);
          }}
        />
      )}

      {/* Expanded Modal View (Full Screen Player) */}
      {isExpanded && (
        <div className="fixed inset-0 z-50 bg-slate-950/95 backdrop-blur-xl flex flex-col justify-between p-4 sm:p-8 animate-in fade-in zoom-in-95 duration-200">
          {/* Top Bar */}
          <div className="flex items-center justify-between max-w-xl mx-auto w-full">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-xs font-semibold text-emerald-400 tracking-wider uppercase flex items-center gap-1.5">
                <Radio className="w-3.5 h-3.5 animate-spin" />
                অরিজিনাল লাইভ প্লেয়ার
              </span>
            </div>
            
            <div className="flex items-center gap-2">
              {isYouTube && (
                <button
                  onClick={() => setShowVideo(!showVideo)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition ${
                    showVideo 
                      ? 'bg-rose-500 text-white shadow-md' 
                      : 'bg-slate-900 text-slate-300 hover:text-white border border-slate-700'
                  }`}
                  title="ভিডিও ও অ্যালবামের মধ্যে পরিবর্তন"
                >
                  <Tv className="w-3.5 h-3.5" />
                  <span>{showVideo ? 'অ্যালবাম ভিউ' : 'ভিডিও দেখুন'}</span>
                </button>
              )}

              <button
                onClick={() => setIsExpanded(false)}
                className="p-2 text-slate-400 hover:text-white bg-slate-900 hover:bg-slate-800 rounded-full transition"
              >
                <Minimize2 className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Center Album Art with Vinyl Glow & Status (when video is not active) */}
          {(!showVideo || !isYouTube) && (
            <div className="flex flex-col items-center justify-center max-w-sm mx-auto w-full my-auto text-center">
              <div className="relative group w-64 h-64 sm:w-76 sm:h-76 rounded-2xl overflow-hidden shadow-2xl shadow-rose-950/60 border border-slate-700/60 mb-5">
                <img
                  src={track.albumArt || track.thumbnail}
                  alt={track.title}
                  className={`w-full h-full object-cover transition duration-700 ${isPlaying ? 'scale-105' : 'scale-100 opacity-90'}`}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/85 via-transparent to-transparent" />
                
                {/* Spinning Disc Badge */}
                <div className="absolute bottom-3 right-3 bg-slate-900/90 backdrop-blur-md px-3 py-1.5 rounded-full border border-slate-700/70 flex items-center gap-2">
                  <Disc3 className={`w-4 h-4 text-rose-400 ${isPlaying ? 'animate-spin' : ''}`} />
                  <span className="text-xs font-medium text-slate-200">
                    {track.type === 'album' ? 'ফুল অ্যালবাম' : 'আসল ট্র্যাক'}
                  </span>
                </div>

                {/* Instant Play Indicator */}
                <div className="absolute top-3 left-3 bg-slate-900/80 backdrop-blur-md px-2.5 py-1 rounded-full border border-emerald-500/50 flex items-center gap-1.5 text-[11px] text-emerald-300">
                  <Zap className="w-3 h-3 text-emerald-400 fill-emerald-400" />
                  <span>সরাসরি সাউন্ড</span>
                </div>
              </div>

              <h2 className="text-lg sm:text-xl font-bold text-white line-clamp-2 px-2">
                {track.title}
              </h2>
              <p className="text-sm text-rose-400 mt-1 font-medium">
                {track.artist}
              </p>

              {/* Reassuring Android Foreground Service Active Banner */}
              <div className="inline-flex items-center gap-2 mt-3 px-3.5 py-1.5 rounded-full bg-emerald-950/70 border border-emerald-600/60 text-xs text-emerald-300 font-medium shadow-md shadow-emerald-950/40">
                <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>🛡️ ব্যাকগ্রাউন্ড সার্ভিস সক্রিয় • অ্যাপ থেকে বের হলেও গান চলবে</span>
              </div>

              {audioError && (
                <p className="text-xs text-rose-400 mt-2 font-medium">{audioError}</p>
              )}
            </div>
          )}

          {/* Spacer if video is displayed */}
          {showVideo && isYouTube && (
            <div className="my-auto text-center pt-52 pb-4">
              <h2 className="text-base sm:text-lg font-bold text-white line-clamp-1 px-4">
                {track.title}
              </h2>
              <p className="text-xs text-rose-400 mt-0.5 font-medium">
                {track.artist}
              </p>
            </div>
          )}

          {/* Controls & Download Actions */}
          <div className="max-w-xl mx-auto w-full space-y-4 mb-2">
            {/* Seek Bar */}
            <div className="space-y-1">
              <div 
                ref={progressBarRef}
                onClick={handleSeek}
                className="w-full bg-slate-800 hover:bg-slate-750 h-2.5 rounded-full overflow-hidden relative cursor-pointer group transition"
              >
                <div
                  className="bg-gradient-to-r from-rose-500 via-pink-500 to-emerald-400 h-full transition-all duration-150 relative"
                  style={{ width: `${progressPercent}%` }}
                >
                  <div className="absolute right-0 top-0 bottom-0 w-2 bg-white rounded-full shadow-md opacity-0 group-hover:opacity-100 transition" />
                </div>
              </div>
              <div className="flex justify-between text-[11px] text-slate-400 font-mono">
                <span>{formatSeconds(currentTime)}</span>
                <span className="flex items-center gap-1">
                  {isBuffering && <span className="text-amber-400 animate-pulse text-[10px]">বাফারিং...</span>}
                  <span>{track.duration || formatSeconds(duration)}</span>
                </span>
              </div>
            </div>

            {/* Playback Controls */}
            <div className="flex items-center justify-center gap-6 sm:gap-8">
              <button
                onClick={() => setIsLooping(!isLooping)}
                className={`p-2.5 rounded-full transition ${isLooping ? 'text-rose-400 bg-rose-500/20' : 'text-slate-400 hover:text-white'}`}
                title="লুপ চালু/বন্ধ"
              >
                <Repeat className="w-5 h-5" />
              </button>

              {onPrev && (
                <button
                  onClick={onPrev}
                  className="p-3 text-slate-300 hover:text-white bg-slate-900 hover:bg-slate-800 rounded-full transition"
                  title="পূর্ববর্তী গান"
                >
                  <SkipBack className="w-5 h-5" />
                </button>
              )}

              <button
                onClick={onPlayPause}
                className="p-5 bg-gradient-to-r from-rose-500 to-pink-600 hover:from-rose-600 hover:to-pink-700 text-white rounded-full shadow-lg shadow-rose-500/30 hover:scale-105 transition"
                title={isPlaying ? 'বিরতি' : 'বাজান'}
              >
                {isPlaying ? <Pause className="w-7 h-7 fill-white" /> : <Play className="w-7 h-7 fill-white ml-0.5" />}
              </button>

              {onNext && (
                <button
                  onClick={onNext}
                  className="p-3 text-slate-300 hover:text-white bg-slate-900 hover:bg-slate-800 rounded-full transition"
                  title="পরবর্তী গান"
                >
                  <SkipForward className="w-5 h-5" />
                </button>
              )}

              <button
                onClick={handleToggleMute}
                className="p-2.5 text-slate-400 hover:text-white transition"
                title={isMuted ? 'আনমিউট' : 'মিউট'}
              >
                {isMuted ? <VolumeX className="w-5 h-5 text-rose-400" /> : <Volume2 className="w-5 h-5" />}
              </button>
            </div>

            {/* Direct 1-Click Downloads for the REAL file */}
            <div className="grid grid-cols-2 gap-3 pt-2">
              <button
                onClick={() => onDownloadAudio(track)}
                className="flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-medium text-sm shadow-md shadow-emerald-950/30 transition hover:scale-[1.02]"
              >
                <Music className="w-4 h-4" />
                <span>আসল MP3 (320k)</span>
              </button>
              <button
                onClick={() => onDownloadVideo(track)}
                className="flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-gradient-to-r from-rose-600 to-pink-600 hover:from-rose-500 hover:to-pink-500 text-white font-medium text-sm shadow-md shadow-rose-950/30 transition hover:scale-[1.02]"
              >
                <Film className="w-4 h-4" />
                <span>আসল HD ভিডিও (MP4)</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Floating Bottom Mini Player Bar */}
      <div className="fixed bottom-0 left-0 right-0 z-40 bg-slate-950/95 backdrop-blur-xl border-t border-slate-800 shadow-2xl px-3 sm:px-6 py-2.5">
        {/* Progress bar line (Clickable to seek) */}
        <div 
          ref={miniProgressBarRef}
          onClick={handleSeek}
          className="absolute top-0 left-0 right-0 h-1.5 bg-slate-800 cursor-pointer group"
          title="টাইমলাইনে যান"
        >
          <div
            className="h-full bg-gradient-to-r from-rose-500 via-pink-500 to-emerald-400 transition-all duration-150 relative"
            style={{ width: `${progressPercent}%` }}
          >
            <div className="absolute right-0 top-1/2 -translate-y-1/2 w-2.5 h-2.5 bg-white rounded-full opacity-0 group-hover:opacity-100 shadow transition" />
          </div>
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
                    <span className="w-1 bg-emerald-400 animate-pulse h-full" />
                    <span className="w-1 bg-rose-400 animate-pulse h-2" />
                    <span className="w-1 bg-emerald-400 animate-pulse h-3" />
                  </div>
                </div>
              )}
            </div>

            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h4 className="text-xs sm:text-sm font-semibold text-white truncate group-hover:text-rose-400 transition">
                  {track.title}
                </h4>
                <span className="hidden sm:inline-flex items-center gap-1 px-1.5 py-0.2 text-[9px] font-medium bg-emerald-500/20 text-emerald-400 rounded">
                  <ShieldCheck className="w-2.5 h-2.5" />
                  অরিজিনাল গান
                </span>
              </div>
              <p className="text-[11px] sm:text-xs text-slate-400 truncate flex items-center gap-1.5">
                <span>{track.artist}</span>
                <span>•</span>
                <span className="font-mono text-slate-300">{formatSeconds(currentTime)} / {track.duration}</span>
                {isBuffering && <span className="text-amber-400 text-[10px]">বাফারিং...</span>}
              </p>
            </div>
          </div>

          {/* Controls */}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            {onPrev && (
              <button
                onClick={onPrev}
                className="hidden sm:inline-flex p-2 text-slate-400 hover:text-white transition"
                title="পূর্ববর্তী"
              >
                <SkipBack className="w-4 h-4" />
              </button>
            )}

            <button
              onClick={onPlayPause}
              className="p-2.5 sm:p-3 bg-gradient-to-r from-rose-500 to-pink-600 hover:from-rose-600 hover:to-pink-700 text-white rounded-full shadow-md shadow-rose-500/20 transition hover:scale-105"
              title={isPlaying ? 'বিরতি' : 'বাজান'}
            >
              {isPlaying ? <Pause className="w-4 h-4 sm:w-5 sm:h-5 fill-white" /> : <Play className="w-4 h-4 sm:w-5 sm:h-5 fill-white ml-0.5" />}
            </button>

            {onNext && (
              <button
                onClick={onNext}
                className="hidden sm:inline-flex p-2 text-slate-400 hover:text-white transition"
                title="পরবর্তী"
              >
                <SkipForward className="w-4 h-4" />
              </button>
            )}

            {/* Quick 1-click Audio Download button */}
            <button
              onClick={() => onDownloadAudio(track)}
              title="আসল MP3 অডিও ডাউনলোড"
              className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600/90 hover:bg-emerald-500 text-white rounded-lg text-xs font-medium transition shadow-sm"
            >
              <Music className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">MP3</span>
            </button>

            {/* Quick 1-click Video Download button */}
            <button
              onClick={() => onDownloadVideo(track)}
              title="আসল HD ভিডিও ডাউনলোড"
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
              onClick={handleClose}
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
