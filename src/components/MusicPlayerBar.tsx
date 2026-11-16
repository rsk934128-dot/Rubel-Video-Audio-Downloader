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
import { androidBackgroundAudio, NativePlaylistTrack } from '../services/androidBackgroundAudio';
import musicFallbackArt from '../assets/images/app_music_vinyl_cover_1794589327282.jpg';

interface Props {
  track: YouTubeSongTrack | null;
  playlist?: YouTubeSongTrack[];
  isPlaying: boolean;
  onPlayPause: () => void;
  onClose: () => void;
  onDownloadAudio: (track: YouTubeSongTrack) => void;
  onDownloadVideo: (track: YouTubeSongTrack) => void;
  onNext?: () => void;
  onPrev?: () => void;
  onSelectTrack?: (track: YouTubeSongTrack) => void;
}

function getYouTubeIdForTrack(t: YouTubeSongTrack | null): string {
  if (!t) return '';
  if (t.id && t.id.length === 11) return t.id;
  const match = t.url?.match(/(?:v=|\/embed\/|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
  return match?.[1] || t.id || '';
}

function getStreamUrlForTrack(t: YouTubeSongTrack | null): string {
  if (!t) return '';
  const isYt = Boolean(t.id || (t.url && t.url.includes('youtu')));
  const ytId = getYouTubeIdForTrack(t);
  if (isYt && ytId) {
    return `/api/audio/stream?id=${encodeURIComponent(ytId)}&title=${encodeURIComponent(t.title)}`;
  }
  return t.url || '';
}

function toAbsoluteHttpUrl(pathOrUrl: string): string {
  if (!pathOrUrl) return '';
  if (pathOrUrl.startsWith('http://') || pathOrUrl.startsWith('https://')) {
    return pathOrUrl;
  }
  if (typeof window !== 'undefined' && window.location?.origin) {
    try {
      return new URL(pathOrUrl, window.location.origin).href;
    } catch {
      return pathOrUrl;
    }
  }
  return pathOrUrl;
}

export const MusicPlayerBar: React.FC<Props> = ({
  track,
  playlist = [],
  isPlaying,
  onPlayPause,
  onClose,
  onDownloadAudio,
  onDownloadVideo,
  onNext,
  onPrev,
  onSelectTrack,
}) => {
  const [isMuted, setIsMuted] = useState(false);
  const [isLooping, setIsLooping] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [showVideo, setShowVideo] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(180);
  const [isBuffering, setIsBuffering] = useState(false);
  const [prepProgress, setPrepProgress] = useState<number | null>(null);
  const [prepMessage, setPrepMessage] = useState<string | null>(null);
  const [audioError, setAudioError] = useState<string | null>(null);
  const [nativePlaybackActive, setNativePlaybackActive] = useState(false);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const iframeRef = useRef<HTMLIFrameElement | null>(null);
  const progressBarRef = useRef<HTMLDivElement | null>(null);
  const miniProgressBarRef = useRef<HTMLDivElement | null>(null);
  const lastLoadedStreamRef = useRef<string>('');
  const resolvedTrackKeyRef = useRef<string>('');
  const streamRetryCountRef = useRef<number>(0);
  const currentTimeRef = useRef<number>(0);

  useEffect(() => {
    currentTimeRef.current = currentTime;
  }, [currentTime]);

  const isYouTube = Boolean(track && (track.id || (track.url && track.url.includes('youtu'))));
  const youtubeVideoId = getYouTubeIdForTrack(track);
  const activeStreamUrl = getStreamUrlForTrack(track);
  const useIframeMode = Boolean(isYouTube && youtubeVideoId && isExpanded && showVideo);

  // Direct helper to send commands to YouTube IFrame API (only when Video Watch Mode is toggled on)
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

  // Build native playlist payload for Capacitor Android Foreground Service
  const buildNativePlaylist = useCallback((): NativePlaylistTrack[] => {
    if (!playlist || playlist.length === 0) return [];
    return playlist.map((item) => ({
      id: item.id,
      title: item.title,
      artist: item.artist,
      artworkUrl: item.albumArt || item.thumbnail,
      streamUrl: toAbsoluteHttpUrl(getStreamUrlForTrack(item)),
    }));
  }, [playlist]);

  // 1. Track Change: async status pre-resolve for YouTube (prevents <audio> timeout on 1+ hour mixes) & pre-warm next track
  useEffect(() => {
    if (!track) return;

    let cancelled = false;
    const abortController = new AbortController();

    setDuration(track.durationSeconds || 180);
    setCurrentTime(0);
    setAudioError(null);
    setPrepProgress(null);
    setPrepMessage(null);
    setIsBuffering(!useIframeMode);
    resolvedTrackKeyRef.current = '';
    streamRetryCountRef.current = 0;

    backgroundKeepAlive.enableMusicSession(
      track.title,
      track.artist,
      track.albumArt || track.thumbnail
    );

    const startAudioPlaybackWithUrl = (streamPath: string) => {
      if (cancelled) return;
      const absoluteStream = toAbsoluteHttpUrl(streamPath);
      const nativeList = buildNativePlaylist();

      androidBackgroundAudio
        .startForeground({
          trackId: track.id,
          title: track.title,
          artist: track.artist,
          artworkUrl: track.albumArt || track.thumbnail,
          streamUrl: useIframeMode ? undefined : absoluteStream,
          isPlaying,
          isLooping,
          playlist: nativeList,
        })
        .then((res) => {
          if (cancelled) return;
          setNativePlaybackActive(res.nativePlayback && !useIframeMode);
          if (res.nativePlayback && !useIframeMode && audioRef.current) {
            audioRef.current.pause();
          }
        });

      if (!useIframeMode && audioRef.current && streamPath) {
        const el = audioRef.current;
        if (lastLoadedStreamRef.current !== streamPath) {
          lastLoadedStreamRef.current = streamPath;
          el.src = streamPath;
          el.load();
        }
        if (isPlaying && !nativePlaybackActive) {
          el.play().catch((err) => {
            console.warn('HTML5 audio play awaiting gesture or buffer:', err?.message);
          });
        }
      }
    };

    if (useIframeMode) {
      startAudioPlaybackWithUrl(activeStreamUrl);
    } else if (isYouTube && youtubeVideoId) {
      // Clear any previous track audio immediately while resolving/converting
      if (audioRef.current && lastLoadedStreamRef.current !== activeStreamUrl) {
        audioRef.current.pause();
        audioRef.current.removeAttribute('src');
        lastLoadedStreamRef.current = '';
      }

      const isLongTrack = (track.durationSeconds || 0) >= 3600;
      setPrepMessage(isLongTrack ? `বড় অডিও (${track.duration}) প্রস্তুত হচ্ছে...` : 'অডিও প্রস্তুত হচ্ছে...');

      (async () => {
        for (let attempt = 0; attempt < 65; attempt++) {
          if (cancelled) return;
          try {
            const resp = await fetch(
              `/api/audio/resolve?id=${encodeURIComponent(youtubeVideoId)}&title=${encodeURIComponent(track.title)}&mode=status`,
              { signal: abortController.signal }
            );
            const data = await resp.json().catch(() => null);
            if (cancelled) return;

            if (resp.ok && data?.ready && data?.streamUrl) {
              resolvedTrackKeyRef.current = youtubeVideoId;
              setPrepProgress(null);
              setPrepMessage(null);
              startAudioPlaybackWithUrl(data.streamUrl);
              return;
            }

            if (resp.ok && data?.status === 'processing') {
              const pct = typeof data.progress === 'number' ? data.progress : 20;
              setPrepProgress(pct);
              setPrepMessage(
                isLongTrack
                  ? `বড় অডিও (${track.duration}) রূপান্তর হচ্ছে (${pct}%)...`
                  : `অডিও প্রস্তুত হচ্ছে (${pct}%)...`
              );
              await new Promise((r) => setTimeout(r, 1800));
              continue;
            }

            break;
          } catch (err: any) {
            if (err?.name === 'AbortError' || cancelled) return;
            break;
          }
        }

        if (!cancelled) {
          setPrepProgress(null);
          setPrepMessage(null);
          setIsBuffering(false);
          setAudioError(
            isLongTrack
              ? '১+ ঘণ্টার এই বড় অডিওটি সরাসরি MP3 স্ট্রিমে প্রস্তুত করা যায়নি। "YouTube প্লেয়ারে চালান" দিয়ে শুনুন।'
              : 'অডিও স্ট্রিম লোড হতে সমস্যা হয়েছে — YouTube প্লেয়ার দিয়ে চালাতে পারেন।'
          );
        }
      })();
    } else if (activeStreamUrl) {
      resolvedTrackKeyRef.current = track.id;
      startAudioPlaybackWithUrl(activeStreamUrl);
    }

    // Pre-warm NEXT song in playlist after 2.5s so track-to-track auto-play is instantaneous
    let warmupTimer: any = null;
    if (playlist.length > 1) {
      const idx = playlist.findIndex((t) => t.id === track.id);
      const nextTrack = idx !== -1 ? playlist[(idx + 1) % playlist.length] : playlist[0];
      const nextYtId = getYouTubeIdForTrack(nextTrack);
      if (nextYtId) {
        warmupTimer = setTimeout(() => {
          fetch(`/api/audio/resolve?id=${encodeURIComponent(nextYtId)}`).catch(() => {});
        }, 2500);
      }
    }

    return () => {
      cancelled = true;
      abortController.abort();
      if (warmupTimer) clearTimeout(warmupTimer);
    };
  }, [track?.id, activeStreamUrl, useIframeMode]);

  // 2. Register MediaSession lock-screen controls
  useEffect(() => {
    if (!track || typeof navigator === 'undefined' || !('mediaSession' in navigator)) return;
    try {
      navigator.mediaSession.setActionHandler('play', () => {
        if (!isPlaying) onPlayPause();
      });
      navigator.mediaSession.setActionHandler('pause', () => {
        if (isPlaying) onPlayPause();
      });
      if (onNext) navigator.mediaSession.setActionHandler('nexttrack', () => onNext());
      if (onPrev) navigator.mediaSession.setActionHandler('previoustrack', () => onPrev());
      navigator.mediaSession.setActionHandler('seekto', (details) => {
        if (details.seekTime !== undefined) {
          handleSeekToSeconds(details.seekTime);
        }
      });
      navigator.mediaSession.setActionHandler('seekbackward', () => {
        handleSeekToSeconds(Math.max(0, currentTimeRef.current - 10));
      });
      navigator.mediaSession.setActionHandler('seekforward', () => {
        handleSeekToSeconds(Math.min(duration, currentTimeRef.current + 10));
      });
    } catch (e) {
      console.warn('MediaSession handler registration skipped:', e);
    }
  }, [track?.id, isPlaying, duration, onPlayPause, onNext, onPrev]);

  // 3. Play/Pause synchronization
  useEffect(() => {
    if (!track) return;

    if (isPlaying) {
      if (useIframeMode) {
        if (audioRef.current) audioRef.current.pause();
        postIframeCommand('playVideo');
      } else if (!nativePlaybackActive && audioRef.current) {
        const isReadyForElement = !isYouTube || resolvedTrackKeyRef.current === youtubeVideoId;
        if (isReadyForElement) {
          if (!audioRef.current.getAttribute('src') && activeStreamUrl) {
            audioRef.current.src = activeStreamUrl;
            lastLoadedStreamRef.current = activeStreamUrl;
          }
          if (audioRef.current.getAttribute('src')) {
            audioRef.current.play().catch((err) => {
              console.warn('Native audio play error:', err);
            });
          }
        }
      }

      backgroundKeepAlive.enableMusicSession(
        track.title,
        track.artist,
        track.albumArt || track.thumbnail
      );
      androidBackgroundAudio.updateMetadata({ isPlaying: true, isLooping });
    } else {
      if (useIframeMode) {
        postIframeCommand('pauseVideo');
      }
      if (audioRef.current) {
        audioRef.current.pause();
      }
      backgroundKeepAlive.setMusicPlaybackState('paused');
      androidBackgroundAudio.updateMetadata({ isPlaying: false, isLooping });
    }
  }, [isPlaying, useIframeMode, nativePlaybackActive, isLooping, track, activeStreamUrl, postIframeCommand]);

  // 4. Listen to YouTube postMessage events ONLY when video iframe mode is open
  useEffect(() => {
    if (!useIframeMode) return;
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
  }, [useIframeMode, isLooping, onNext, postIframeCommand]);

  // 5. Listen for native Android Foreground Service events (Notification buttons, native auto-next, progress)
  useEffect(() => {
    const unsubAction = androidBackgroundAudio.onAction((action) => {
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

    const unsubTrack = androidBackgroundAudio.onTrackChanged((data) => {
      if (onSelectTrack && playlist.length > 0) {
        const matched = playlist.find((t) => t.id === data.trackId) || playlist[data.index];
        if (matched) {
          onSelectTrack(matched);
        }
      }
    });

    const unsubProgress = androidBackgroundAudio.onProgress((data) => {
      if (nativePlaybackActive) {
        setCurrentTime(data.currentTime);
        if (data.duration > 1) setDuration(data.duration);
        setIsBuffering(false);
      }
    });

    const unsubState = androidBackgroundAudio.onPlaybackState((data) => {
      setNativePlaybackActive(data.nativePlayback && !useIframeMode);
      if (data.isPlaying !== isPlaying) {
        onPlayPause();
      }
    });

    return () => {
      unsubAction();
      unsubTrack();
      unsubProgress();
      unsubState();
    };
  }, [isPlaying, nativePlaybackActive, useIframeMode, playlist, onPlayPause, onNext, onPrev, onSelectTrack]);

  // Synchronous HTML5 <audio> onEnded auto-advance handler (preserves background playback permissions on Chrome/Android)
  const handleAudioEnded = () => {
    if (isLooping) {
      if (audioRef.current) {
        audioRef.current.currentTime = 0;
        audioRef.current.play().catch(() => {});
      }
      return;
    }

    // Determine next track synchronously so we can load & play on the SAME <audio> element immediately
    if (playlist.length > 0 && track) {
      const idx = playlist.findIndex((t) => t.id === track.id);
      const nextTrack = idx !== -1 ? playlist[(idx + 1) % playlist.length] : playlist[0];
      const nextStream = getStreamUrlForTrack(nextTrack);
      if (audioRef.current && nextStream) {
        lastLoadedStreamRef.current = nextStream;
        audioRef.current.src = nextStream;
        audioRef.current.load();
        audioRef.current.play().catch((err) => {
          console.warn('Background auto-next play fallback:', err?.message);
        });
      }
      backgroundKeepAlive.enableMusicSession(
        nextTrack.title,
        nextTrack.artist,
        nextTrack.albumArt || nextTrack.thumbnail
      );
      if (onSelectTrack) {
        onSelectTrack(nextTrack);
        return;
      }
    }

    if (onNext) {
      onNext();
    }
  };

  // Seek helper
  const handleSeekToSeconds = (targetSec: number) => {
    const clamped = Math.max(0, Math.min(duration, targetSec));
    setCurrentTime(clamped);
    if (useIframeMode) {
      postIframeCommand('seekTo', [clamped, true]);
    } else if (nativePlaybackActive) {
      androidBackgroundAudio.seekTo(clamped);
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
    if (useIframeMode) {
      postIframeCommand(nextMuted ? 'mute' : 'unMute');
    } else if (audioRef.current) {
      audioRef.current.muted = nextMuted;
    }
  };

  const handleClose = () => {
    if (useIframeMode) {
      postIframeCommand('pauseVideo');
    }
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.removeAttribute('src');
      audioRef.current.load();
      lastLoadedStreamRef.current = '';
    }
    backgroundKeepAlive.disableMusicSession();
    androidBackgroundAudio.stopForeground();
    onClose();
  };

  if (!track) return null;

  const formatSeconds = (sec: number) => {
    if (isNaN(sec) || sec < 0) return '0:00';
    const total = Math.floor(sec);
    const h = Math.floor(total / 3600);
    const m = Math.floor((total % 3600) / 60);
    const s = total % 60;
    if (h > 0) {
      return `${h}:${m < 10 ? '0' : ''}${m}:${s < 10 ? '0' : ''}${s}`;
    }
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const progressPercent = duration > 0 ? Math.min(100, (currentTime / duration) * 100) : 0;

  return (
    <>
      {/* 
        Persistent Native HTML5 Audio Engine:
        Never uses a YouTube iframe for background audio, so playback & auto-next keep running
        even when the user exits/minimizes the app or locks the phone screen!
      */}
      <audio
        ref={audioRef}
        preload="auto"
        playsInline
        muted={isMuted || useIframeMode || nativePlaybackActive}
        onTimeUpdate={(e) => {
          if (!useIframeMode && !nativePlaybackActive) {
            setCurrentTime(Math.floor(e.currentTarget.currentTime));
            setIsBuffering(false);
          }
        }}
        onWaiting={() => {
          if (!useIframeMode && !nativePlaybackActive) setIsBuffering(true);
        }}
        onCanPlay={() => {
          setIsBuffering(false);
          setPrepMessage(null);
          setPrepProgress(null);
          setAudioError(null);
        }}
        onPlaying={() => {
          setIsBuffering(false);
          setPrepMessage(null);
          setPrepProgress(null);
          setAudioError(null);
          if (typeof navigator !== 'undefined' && 'mediaSession' in navigator) {
            navigator.mediaSession.playbackState = 'playing';
          }
        }}
        onLoadedMetadata={(e) => {
          setIsBuffering(false);
          const metaDuration = e.currentTarget.duration;
          if (metaDuration && !isNaN(metaDuration) && metaDuration > 1 && isFinite(metaDuration)) {
            setDuration(Math.floor(metaDuration));
          }
        }}
        onEnded={handleAudioEnded}
        onError={() => {
          const el = audioRef.current;
          if (!el || !el.getAttribute('src') || useIframeMode || nativePlaybackActive) return;

          // Auto-retry once preserving current playback position (recovers long-stream network hiccups)
          if (streamRetryCountRef.current < 1 && activeStreamUrl) {
            streamRetryCountRef.current += 1;
            const resumeAt = el.currentTime || currentTimeRef.current || 0;
            setIsBuffering(true);
            setPrepMessage('স্ট্রিম পুনঃসংযোগ করা হচ্ছে...');
            setTimeout(() => {
              if (!audioRef.current) return;
              const sep = activeStreamUrl.includes('?') ? '&' : '?';
              const retrySrc = `${activeStreamUrl}${sep}retry=${Date.now()}`;
              lastLoadedStreamRef.current = retrySrc;
              audioRef.current.src = retrySrc;
              audioRef.current.load();
              if (resumeAt > 1) {
                try { audioRef.current.currentTime = resumeAt; } catch {}
              }
              if (isPlaying) {
                audioRef.current.play().catch(() => {});
              }
            }, 1000);
            return;
          }

          setPrepMessage(null);
          setPrepProgress(null);
          setIsBuffering(false);
          setAudioError('অডিও স্ট্রিম লোড হতে সমস্যা হয়েছে — YouTube প্লেয়ারে চালিয়ে শুনতে পারেন।');
        }}
      />

      {/* Optional Video Watch Mode Iframe (mounted ONLY when user explicitly opens Video Watch inside Expanded Player) */}
      {useIframeMode && (
        <iframe
          ref={iframeRef}
          key={`yt-video-${youtubeVideoId}`}
          src={`https://www.youtube-nocookie.com/embed/${youtubeVideoId}?enablejsapi=1&autoplay=1&playsinline=1&controls=0&start=${Math.floor(currentTimeRef.current)}&origin=${typeof window !== 'undefined' ? encodeURIComponent(window.location.origin) : ''}`}
          title={track.title}
          allow="autoplay; encrypted-media; picture-in-picture"
          className="fixed inset-x-4 top-16 max-w-lg mx-auto aspect-video z-55 rounded-2xl shadow-2xl border border-slate-700 bg-black"
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
                ব্যাকগ্রাউন্ড লাইভ প্লেয়ার
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
                  <span>{showVideo ? 'ব্যাকগ্রাউন্ড অডিও' : 'ভিডিও দেখুন'}</span>
                </button>
              )}

              <button
                onClick={() => {
                  setShowVideo(false);
                  setIsExpanded(false);
                }}
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
                  src={track.albumArt || track.thumbnail || musicFallbackArt}
                  alt={track.title}
                  referrerPolicy="no-referrer"
                  onError={(e) => {
                    const img = e.currentTarget as HTMLImageElement;
                    if (img.src !== musicFallbackArt) img.src = musicFallbackArt;
                  }}
                  className={`w-full h-full object-cover transition duration-700 ${isPlaying ? 'scale-105' : 'scale-100 opacity-90'}`}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/85 via-transparent to-transparent" />
                
                {/* Spinning Disc Badge */}
                <div className="absolute bottom-3 right-3 bg-slate-900/90 backdrop-blur-md px-3 py-1.5 rounded-full border border-slate-700/70 flex items-center gap-2">
                  <Disc3 className={`w-4 h-4 text-rose-400 ${isPlaying ? 'animate-spin' : ''}`} />
                  <span className="text-xs font-medium text-slate-200">
                    {track.type === 'album' ? 'ফুল অ্যালবাম' : 'অটো প্লে সক্রিয়'}
                  </span>
                </div>

                {/* Instant Play Indicator */}
                <div className="absolute top-3 left-3 bg-slate-900/80 backdrop-blur-md px-2.5 py-1 rounded-full border border-emerald-500/50 flex items-center gap-1.5 text-[11px] text-emerald-300">
                  <Zap className="w-3 h-3 text-emerald-400 fill-emerald-400" />
                  <span>
                    {prepMessage
                      ? prepMessage
                      : isBuffering
                      ? 'অডিও লোড হচ্ছে...'
                      : 'নেটিভ MP3 স্ট্রিম'}
                  </span>
                </div>
              </div>

              <h2 className="text-lg sm:text-xl font-bold text-white line-clamp-2 px-2">
                {track.title}
              </h2>
              <p className="text-sm text-rose-400 mt-1 font-medium">
                {track.artist}
              </p>

              {/* Reassuring Background Auto-Play Active Banner */}
              <div className="inline-flex items-center gap-2 mt-3 px-3.5 py-1.5 rounded-full bg-emerald-950/70 border border-emerald-600/60 text-xs text-emerald-300 font-medium shadow-md shadow-emerald-950/40">
                <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>🛡️ ব্যাকগ্রাউন্ড অটো প্লে সক্রিয় • অ্যাপ থেকে বের হলেও গান চলবে</span>
              </div>

              {prepProgress !== null && (
                <div className="w-full max-w-xs mt-3 space-y-1">
                  <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-amber-400 to-emerald-400 transition-all duration-300"
                      style={{ width: `${Math.min(100, Math.max(8, prepProgress))}%` }}
                    />
                  </div>
                  <p className="text-[11px] text-amber-300">{prepMessage}</p>
                </div>
              )}

              {audioError && (
                <div className="mt-3 flex flex-col items-center gap-2">
                  <p className="text-xs text-rose-400 font-medium max-w-xs">{audioError}</p>
                  {isYouTube && youtubeVideoId && (
                    <button
                      onClick={() => setShowVideo(true)}
                      className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold shadow transition"
                    >
                      <Tv className="w-3.5 h-3.5" />
                      <span>YouTube প্লেয়ারে চালান</span>
                    </button>
                  )}
                </div>
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
                  {isBuffering && <span className="text-amber-400 animate-pulse text-[10px]">{prepMessage || 'অডিও প্রস্তুত হচ্ছে...'}</span>}
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
                src={track.albumArt || track.thumbnail || musicFallbackArt}
                alt={track.title}
                referrerPolicy="no-referrer"
                onError={(e) => {
                  const img = e.currentTarget as HTMLImageElement;
                  if (img.src !== musicFallbackArt) img.src = musicFallbackArt;
                }}
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
                  ব্যাকগ্রাউন্ড অটো প্লে
                </span>
              </div>
              <p className="text-[11px] sm:text-xs text-slate-400 truncate flex items-center gap-1.5">
                <span>{track.artist}</span>
                <span>•</span>
                <span className="font-mono text-slate-300">{formatSeconds(currentTime)} / {track.duration}</span>
                {isBuffering && <span className="text-amber-400 text-[10px]">{prepMessage || 'প্রস্তুত হচ্ছে...'}</span>}
                {audioError && isYouTube && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setIsExpanded(true);
                      setShowVideo(true);
                    }}
                    className="text-[10px] text-rose-400 underline hover:text-rose-300"
                  >
                    YouTube-এ চালান
                  </button>
                )}
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
