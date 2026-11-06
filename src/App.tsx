/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState, useCallback } from 'react';
import { AppTab, DownloadTask, Language, MediaFormat, VideoMetadata, YouTubeSongTrack } from './types';
import { Navbar } from './components/Navbar';
import { DownloaderView } from './components/DownloaderView';
import { DownloadHistoryView } from './components/DownloadHistoryView';
import { CodeBlueprintModal } from './components/CodeBlueprintModal';
import { PWAShareTargetTutorial } from './components/PWAShareTargetTutorial';
import { BatchDownloaderView } from './components/BatchDownloaderView';
import { ActiveDownloadBar } from './components/ActiveDownloadBar';
import { BypassEngineStatusModal } from './components/BypassEngineStatusModal';
import { MobilePersistenceBar } from './components/MobilePersistenceBar';
import { StorageLocationModal } from './components/StorageLocationModal';
import { AndroidReleaseModal } from './components/AndroidReleaseModal';
import { AndroidPermissionLoginModal } from './components/AndroidPermissionLoginModal';
import { FloatingShortcutDownloadButton } from './components/FloatingShortcutDownloadButton';
import { YouTubeMusicView } from './components/YouTubeMusicView';
import { MusicPlayerBar } from './components/MusicPlayerBar';
import { 
  extractUrlFromText, 
  extractVideoInfo 
} from './services/videoExtractor';
import { 
  loadDownloadHistory, 
  saveDownloadHistory, 
  startDownloadSimulation 
} from './services/downloadManager';
import { 
  onAuthChange, 
  syncDownloadToCloud 
} from './services/firebaseAuth';
import type { User } from 'firebase/auth';

export default function App() {
  const [activeTab, setActiveTab] = useState<AppTab>('downloader');
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [language, setLanguage] = useState<Language>('bn');
  const [inputUrl, setInputUrl] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [video, setVideo] = useState<VideoMetadata | null>(null);
  const [activeFormatId, setActiveFormatId] = useState<string | null>(null);
  const [detectedSharedUrl, setDetectedSharedUrl] = useState<string | null>(null);
  
  // Download states
  const [activeTask, setActiveTask] = useState<DownloadTask | null>(null);
  const [cancelFn, setCancelFn] = useState<(() => void) | null>(null);
  const [history, setHistory] = useState<DownloadTask[]>([]);
  const [isBypassModalOpen, setIsBypassModalOpen] = useState<boolean>(false);
  const [isStorageModalOpen, setIsStorageModalOpen] = useState<boolean>(false);
  const [isAndroidReleaseModalOpen, setIsAndroidReleaseModalOpen] = useState<boolean>(false);
  const [isAndroidPermissionModalOpen, setIsAndroidPermissionModalOpen] = useState<boolean>(false);

  // YouTube Music & Album Player states
  const [playingTrack, setPlayingTrack] = useState<YouTubeSongTrack | null>(null);
  const [isPlayingSong, setIsPlayingSong] = useState<boolean>(false);
  const [activePlaylist, setActivePlaylist] = useState<YouTubeSongTrack[]>([]);

  // 1. Initialize history from localStorage
  useEffect(() => {
    const saved = loadDownloadHistory();
    setHistory(saved);
  }, []);

  // 1b. Listen to Google Auth State
  useEffect(() => {
    const unsubscribe = onAuthChange((user) => {
      setCurrentUser(user);
    });
    return () => unsubscribe();
  }, []);

  // 2. Check for Web Share Target query params (?url=... or ?text=...)
  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const sharedUrl = params.get('url') || params.get('text');
      if (sharedUrl) {
        const cleanUrl = extractUrlFromText(sharedUrl);
        if (cleanUrl) {
          setDetectedSharedUrl(cleanUrl);
          setInputUrl(cleanUrl);
          // Automatically extract if a share URL arrived
          executeAnalyze(cleanUrl);
        }
      }
    } catch {
      // Ignore URL parsing errors
    }
  }, []);

  // Analyze video function
  const executeAnalyze = useCallback(async (urlToAnalyze?: string) => {
    const targetUrl = urlToAnalyze || inputUrl;
    const cleanUrl = extractUrlFromText(targetUrl);

    if (!cleanUrl) {
      setError(language === 'bn' ? 'অনুগ্রহ করে একটি সঠিক ভিডিও লিঙ্ক প্রদান করুন' : 'Please provide a valid video URL');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const metadata = await extractVideoInfo(cleanUrl);
      setVideo(metadata);
      setActiveTab('downloader');
    } catch (err: any) {
      setError(err?.message || (language === 'bn' ? 'ভিডিও তথ্য বের করতে সমস্যা হয়েছে' : 'Failed to retrieve video information'));
    } finally {
      setIsLoading(false);
    }
  }, [inputUrl, language]);

  // Handle Download trigger
  const handleDownload = useCallback((format: MediaFormat) => {
    if (!video) return;

    setActiveFormatId(format.id);

    const { cancel } = startDownloadSimulation(
      video,
      format,
      // onProgress
      (task) => {
        setActiveTask(task);
      },
      // onComplete
      (completedTask) => {
        setActiveTask(completedTask);
        setActiveFormatId(null);
        setCancelFn(null);

        // Add to history
        setHistory((prev) => {
          const updated = [completedTask, ...prev.filter(i => i.id !== completedTask.id)];
          saveDownloadHistory(updated);
          return updated;
        });

        // Sync to Firebase Cloud if logged in with Google
        if (currentUser) {
          syncDownloadToCloud(currentUser.uid, completedTask);
        }
      },
      // onError
      (taskId, errorMsg) => {
        setActiveFormatId(null);
        setCancelFn(null);
        setActiveTask((prev) => {
          if (!prev) return null;
          const failedTask: DownloadTask = { ...prev, status: 'failed', error: errorMsg };
          setHistory((h) => {
            const updated = [failedTask, ...h.filter(i => i.id !== failedTask.id)];
            saveDownloadHistory(updated);
            return updated;
          });
          return failedTask;
        });
      }
    );

    setCancelFn(() => cancel);
  }, [video, currentUser]);

  // Handle instant analyze & auto-download from floating shortcut button
  const handleAnalyzeAndDownload = useCallback(async (targetUrl: string, autoStartFormat?: 'video' | 'audio') => {
    const cleanUrl = extractUrlFromText(targetUrl) || targetUrl.trim();
    if (!cleanUrl) return;

    setInputUrl(cleanUrl);
    setIsLoading(true);
    setError(null);

    try {
      const metadata = await extractVideoInfo(cleanUrl);
      setVideo(metadata);
      setActiveTab('downloader');

      // If auto-start format is requested, trigger download right away
      if (autoStartFormat && metadata.formats && metadata.formats.length > 0) {
        const matchingFormat = metadata.formats.find(f => f.type === autoStartFormat && (f.quality.includes('1080') || f.quality.includes('320') || f.isRecommended))
          || metadata.formats.find(f => f.type === autoStartFormat)
          || metadata.formats[0];

        if (matchingFormat) {
          setActiveFormatId(matchingFormat.id);
          const { cancel } = startDownloadSimulation(
            metadata,
            matchingFormat,
            (task) => setActiveTask(task),
            (completedTask) => {
              setActiveTask(completedTask);
              setActiveFormatId(null);
              setCancelFn(null);
              setHistory((prev) => {
                const updated = [completedTask, ...prev.filter(i => i.id !== completedTask.id)];
                saveDownloadHistory(updated);
                return updated;
              });
              if (currentUser) {
                syncDownloadToCloud(currentUser.uid, completedTask);
              }
            },
            (taskId, errorMsg) => {
              setActiveFormatId(null);
              setCancelFn(null);
              setActiveTask((prev) => {
                if (!prev) return null;
                const failedTask: DownloadTask = { ...prev, status: 'failed', error: errorMsg };
                setHistory((h) => {
                  const updated = [failedTask, ...h.filter(i => i.id !== failedTask.id)];
                  saveDownloadHistory(updated);
                  return updated;
                });
                return failedTask;
              });
            }
          );
          setCancelFn(() => cancel);
        }
      }
    } catch (err: any) {
      setError(err?.message || (language === 'bn' ? 'ভিডিও তথ্য বের করতে সমস্যা হয়েছে' : 'Failed to retrieve video information'));
    } finally {
      setIsLoading(false);
    }
  }, [language, currentUser]);

  // Handle Auto-Retry from download history
  const handleRetryHistoryItem = useCallback((item: DownloadTask) => {
    // 1. Switch to Downloader tab
    setActiveTab('downloader');

    // 2. Resolve clean URL
    const urlToUse = item.originalUrl || (item.videoId.startsWith('http') ? item.videoId : `https://www.youtube.com/watch?v=${item.videoId}`);
    setInputUrl(urlToUse);

    // 3. Construct target metadata for simulation
    const targetVideo: VideoMetadata = {
      id: item.videoId,
      originalUrl: urlToUse,
      platform: item.platform,
      title: item.title,
      thumbnail: item.thumbnail,
      author: 'Creator / Media Channel',
      duration: '03:45',
      durationSeconds: 225,
      viewCount: 'Verified Stream',
      uploadDate: 'Recently updated',
      formats: [item.format],
    };

    setVideo(targetVideo);
    setActiveFormatId(item.format.id);

    // 4. Re-invoke download simulation
    const { cancel } = startDownloadSimulation(
      targetVideo,
      item.format,
      (task) => {
        setActiveTask(task);
      },
      (completedTask) => {
        setActiveTask(completedTask);
        setActiveFormatId(null);
        setCancelFn(null);

        setHistory((prev) => {
          const updated = [completedTask, ...prev.filter(i => i.id !== item.id && i.id !== completedTask.id)];
          saveDownloadHistory(updated);
          return updated;
        });
      },
      (taskId, errorMsg) => {
        setActiveFormatId(null);
        setCancelFn(null);
        setActiveTask((prev) => {
          if (!prev) return null;
          const failedTask: DownloadTask = { ...prev, status: 'failed', error: errorMsg };
          setHistory((prevH) => {
            const updated = [failedTask, ...prevH.filter(i => i.id !== item.id && i.id !== failedTask.id)];
            saveDownloadHistory(updated);
            return updated;
          });
          return failedTask;
        });
      }
    );

    setCancelFn(() => cancel);
  }, []);

  // Handle cancel download
  const handleCancelDownload = useCallback((taskId: string) => {
    if (cancelFn) {
      cancelFn();
    }
    setActiveTask(null);
    setActiveFormatId(null);
  }, [cancelFn]);

  // Delete history item
  const handleDeleteHistoryItem = useCallback((id: string) => {
    setHistory((prev) => {
      const updated = prev.filter(item => item.id !== id);
      saveDownloadHistory(updated);
      return updated;
    });
  }, []);

  // Clear all history
  const handleClearHistory = useCallback(() => {
    setHistory([]);
    saveDownloadHistory([]);
  }, []);

  // Handle import history from backup (JSON / CSV)
  const handleImportHistory = useCallback((updatedHistory: DownloadTask[]) => {
    setHistory(updatedHistory);
    saveDownloadHistory(updatedHistory);
  }, []);

  // Handle test from PWA Share Target Tutorial
  const handleTestInDownloader = useCallback((testUrl: string) => {
    setInputUrl(testUrl);
    setActiveTab('downloader');
    executeAnalyze(testUrl);
  }, [executeAnalyze]);

  // Handle cloud sync loaded from Google account
  const handleCloudSyncLoaded = useCallback((cloudTasks: DownloadTask[]) => {
    setHistory((prev) => {
      const existingIds = new Set(prev.map(item => item.id));
      const newItems = cloudTasks.filter(item => !existingIds.has(item.id));
      if (newItems.length === 0) return prev;
      const updated = [...newItems, ...prev];
      saveDownloadHistory(updated);
      return updated;
    });
  }, []);

  // Handle batch task completion (auto save to download history)
  const handleBatchTaskCompleted = useCallback((task: DownloadTask) => {
    setHistory(prev => {
      const updated = [task, ...prev.filter(item => item.id !== task.id)];
      saveDownloadHistory(updated);
      return updated;
    });
    if (currentUser) {
      syncDownloadToCloud(currentUser.uid, task);
    }
  }, [currentUser]);

  // Handle Play Song with Album Player
  const handlePlaySong = useCallback((track: YouTubeSongTrack, playlist?: YouTubeSongTrack[]) => {
    setPlayingTrack(track);
    setIsPlayingSong(true);
    if (playlist && playlist.length > 0) {
      setActivePlaylist(playlist);
    }
  }, []);

  const handleNextSong = useCallback(() => {
    if (!playingTrack || activePlaylist.length === 0) return;
    const currentIndex = activePlaylist.findIndex((t) => t.id === playingTrack.id);
    if (currentIndex !== -1 && currentIndex < activePlaylist.length - 1) {
      setPlayingTrack(activePlaylist[currentIndex + 1]);
      setIsPlayingSong(true);
    } else if (activePlaylist.length > 0) {
      setPlayingTrack(activePlaylist[0]);
      setIsPlayingSong(true);
    }
  }, [playingTrack, activePlaylist]);

  const handlePrevSong = useCallback(() => {
    if (!playingTrack || activePlaylist.length === 0) return;
    const currentIndex = activePlaylist.findIndex((t) => t.id === playingTrack.id);
    if (currentIndex > 0) {
      setPlayingTrack(activePlaylist[currentIndex - 1]);
      setIsPlayingSong(true);
    } else if (activePlaylist.length > 0) {
      setPlayingTrack(activePlaylist[activePlaylist.length - 1]);
      setIsPlayingSong(true);
    }
  }, [playingTrack, activePlaylist]);

  // Handle 1-Click YouTube Song Audio (MP3 320k) Download
  const handleDownloadYouTubeAudio = useCallback((track: YouTubeSongTrack) => {
    const audioFormat: MediaFormat = {
      id: 'audio-mp3-320',
      type: 'audio',
      label: 'MP3 320 kbps',
      subLabel: 'Ultra HD Audio (সেরা অডিও)',
      ext: 'mp3',
      quality: '320kbps High Quality',
      bitrate: '320 kbps',
      estimatedSize: `${Math.max(4.2, ((track.durationSeconds || 210) * 0.04)).toFixed(1)} MB`,
      codec: 'MPEG-1 Layer 3 (MP3)',
      badge: 'Crystal Audio',
      isRecommended: true,
    };

    const videoMeta: VideoMetadata = {
      id: track.id,
      originalUrl: track.url,
      platform: 'youtube',
      title: track.title,
      author: track.artist,
      thumbnail: track.albumArt || track.thumbnail,
      duration: track.duration,
      durationSeconds: track.durationSeconds,
      viewCount: track.views,
      uploadDate: track.published || 'Recent',
      formats: [audioFormat],
    };

    setVideo(videoMeta);
    setActiveFormatId(audioFormat.id);

    const { cancel } = startDownloadSimulation(
      videoMeta,
      audioFormat,
      (task) => setActiveTask(task),
      (completedTask) => {
        setActiveTask(completedTask);
        setActiveFormatId(null);
        setCancelFn(null);
        setHistory((prev) => {
          const updated = [completedTask, ...prev.filter(i => i.id !== completedTask.id)];
          saveDownloadHistory(updated);
          return updated;
        });
        if (currentUser) {
          syncDownloadToCloud(currentUser.uid, completedTask);
        }
      },
      (taskId, errorMsg) => {
        setActiveFormatId(null);
        setCancelFn(null);
        setActiveTask((prev) => {
          if (!prev) return null;
          const failedTask: DownloadTask = { ...prev, status: 'failed', error: errorMsg };
          setHistory((h) => {
            const updated = [failedTask, ...h.filter(i => i.id !== failedTask.id)];
            saveDownloadHistory(updated);
            return updated;
          });
          return failedTask;
        });
      }
    );
    setCancelFn(() => cancel);
  }, [currentUser]);

  // Handle 1-Click YouTube Song Video (HD MP4) Download
  const handleDownloadYouTubeVideo = useCallback((track: YouTubeSongTrack) => {
    const videoFormat: MediaFormat = {
      id: 'video-mp4-720p',
      type: 'video',
      label: '720p HD',
      subLabel: '1280x720 High Definition',
      ext: 'mp4',
      quality: '720p HD',
      resolution: '1280x720',
      estimatedSize: `${Math.max(16.5, ((track.durationSeconds || 210) * 0.18)).toFixed(1)} MB`,
      codec: 'H.264 / AVC + AAC Stereo',
      badge: 'Fast HD',
      isRecommended: true,
    };

    const videoMeta: VideoMetadata = {
      id: track.id,
      originalUrl: track.url,
      platform: 'youtube',
      title: track.title,
      author: track.artist,
      thumbnail: track.albumArt || track.thumbnail,
      duration: track.duration,
      durationSeconds: track.durationSeconds,
      viewCount: track.views,
      uploadDate: track.published || 'Recent',
      formats: [videoFormat],
    };

    setVideo(videoMeta);
    setActiveFormatId(videoFormat.id);

    const { cancel } = startDownloadSimulation(
      videoMeta,
      videoFormat,
      (task) => setActiveTask(task),
      (completedTask) => {
        setActiveTask(completedTask);
        setActiveFormatId(null);
        setCancelFn(null);
        setHistory((prev) => {
          const updated = [completedTask, ...prev.filter(i => i.id !== completedTask.id)];
          saveDownloadHistory(updated);
          return updated;
        });
        if (currentUser) {
          syncDownloadToCloud(currentUser.uid, completedTask);
        }
      },
      (taskId, errorMsg) => {
        setActiveFormatId(null);
        setCancelFn(null);
        setActiveTask((prev) => {
          if (!prev) return null;
          const failedTask: DownloadTask = { ...prev, status: 'failed', error: errorMsg };
          setHistory((h) => {
            const updated = [failedTask, ...h.filter(i => i.id !== failedTask.id)];
            saveDownloadHistory(updated);
            return updated;
          });
          return failedTask;
        });
      }
    );
    setCancelFn(() => cancel);
  }, [currentUser]);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-rose-500 selection:text-white overflow-x-hidden w-full max-w-full">
      {/* Top Navigation Bar */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        language={language}
        setLanguage={setLanguage}
        historyCount={history.length}
        onOpenBypassModal={() => setIsBypassModalOpen(true)}
        onOpenStorageModal={() => setIsStorageModalOpen(true)}
        onOpenAndroidReleaseModal={() => setIsAndroidReleaseModalOpen(true)}
        onOpenAndroidPermissionModal={() => setIsAndroidPermissionModalOpen(true)}
        onCloudSyncLoaded={handleCloudSyncLoaded}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 pt-4 pb-28">
        {/* Mobile Real-time Keep-Alive & Notification Control */}
        <MobilePersistenceBar onOpenStorageModal={() => setIsStorageModalOpen(true)} />

        {activeTab === 'downloader' && (
          <DownloaderView
            inputUrl={inputUrl}
            setInputUrl={setInputUrl}
            isLoading={isLoading}
            error={error}
            video={video}
            activeFormatId={activeFormatId}
            activeTask={activeTask}
            detectedSharedUrl={detectedSharedUrl}
            onAnalyze={executeAnalyze}
            onDownload={handleDownload}
            onOpenPWAGuide={() => setActiveTab('pwa-guide')}
            onSwitchToBatch={() => setActiveTab('batch')}
            onOpenBypassModal={() => setIsBypassModalOpen(true)}
            onOpenStorageSettings={() => setIsStorageModalOpen(true)}
            language={language}
          />
        )}

        {activeTab === 'music' && (
          <YouTubeMusicView
            language={language}
            onPlaySong={handlePlaySong}
            onDownloadAudio={handleDownloadYouTubeAudio}
            onDownloadVideo={handleDownloadYouTubeVideo}
            onSendToDownloader={(url) => {
              setInputUrl(url);
              setActiveTab('downloader');
              executeAnalyze(url);
            }}
            onAddToBatch={(url) => {
              setActiveTab('batch');
            }}
          />
        )}

        {activeTab === 'batch' && (
          <BatchDownloaderView
            language={language}
            onTaskCompleted={handleBatchTaskCompleted}
            onSwitchToSingle={(url) => {
              if (url) {
                setInputUrl(url);
                executeAnalyze(url);
              }
              setActiveTab('downloader');
            }}
          />
        )}

        {activeTab === 'history' && (
          <DownloadHistoryView
            history={history}
            onClearHistory={handleClearHistory}
            onDeleteItem={handleDeleteHistoryItem}
            onRetry={handleRetryHistoryItem}
            onImportHistory={handleImportHistory}
            onBackToDownloader={() => setActiveTab('downloader')}
            language={language}
            currentUser={currentUser}
          />
        )}

        {activeTab === 'pwa-guide' && (
          <PWAShareTargetTutorial
            language={language}
            onTestInDownloader={handleTestInDownloader}
            onBackToDownloader={() => setActiveTab('downloader')}
          />
        )}

        {activeTab === 'blueprint' && (
          <CodeBlueprintModal
            language={language}
            onOpenPWAGuide={() => setActiveTab('pwa-guide')}
          />
        )}
      </main>

      {/* Active in-progress Download bar */}
      <ActiveDownloadBar
        task={activeTask}
        onCancel={handleCancelDownload}
        onRetry={(failedTask) => {
          if (failedTask && failedTask.format) {
            handleDownload(failedTask.format);
          }
        }}
        onOpenStorageSettings={() => setIsStorageModalOpen(true)}
        language={language}
      />

      {/* Floating Bottom Music & Album Player Bar */}
      {playingTrack && (
        <MusicPlayerBar
          track={playingTrack}
          isPlaying={isPlayingSong}
          onPlayPause={() => setIsPlayingSong(!isPlayingSong)}
          onClose={() => {
            setIsPlayingSong(false);
            setPlayingTrack(null);
          }}
          onDownloadAudio={handleDownloadYouTubeAudio}
          onDownloadVideo={handleDownloadYouTubeVideo}
          onNext={handleNextSong}
          onPrev={handlePrevSong}
        />
      )}

      {/* Bypass API Engine Status Modal */}
      <BypassEngineStatusModal
        isOpen={isBypassModalOpen}
        onClose={() => setIsBypassModalOpen(false)}
        language={language}
      />

      {/* Storage Location & SD Card Preference Modal */}
      <StorageLocationModal
        isOpen={isStorageModalOpen}
        onClose={() => setIsStorageModalOpen(false)}
        language={language}
      />

      {/* Android APK GitHub Release Modal */}
      <AndroidReleaseModal
        isOpen={isAndroidReleaseModalOpen}
        onClose={() => setIsAndroidReleaseModalOpen(false)}
        language={language}
      />

      {/* Android Device Permissions & Seamless Login Modal */}
      <AndroidPermissionLoginModal
        isOpen={isAndroidPermissionModalOpen}
        onClose={() => setIsAndroidPermissionModalOpen(false)}
        language={language}
        onCloudSyncLoaded={handleCloudSyncLoaded}
        onOpenStorageModal={() => setIsStorageModalOpen(true)}
      />

      {/* Always Visible Floating Shortcut Download Button */}
      <FloatingShortcutDownloadButton
        video={video}
        onDownload={handleDownload}
        onAnalyzeAndDownload={handleAnalyzeAndDownload}
        onOpenStorageModal={() => setIsStorageModalOpen(true)}
        isLoading={isLoading}
        hasActiveTask={!!activeTask}
        language={language}
      />

      {/* Footer */}
      <footer className="w-full border-t border-slate-900 bg-slate-950 py-6 text-center text-xs text-slate-500">
        <div className="max-w-4xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p>
            {language === 'bn' 
              ? 'সার্বজনীন ভিডিও ও অডিও ডাউনলোডার ইঞ্জিন • yt-dlp ও Web Share Target আর্কিটেকচার'
              : 'Universal Video & Audio Downloader Engine • yt-dlp & Web Share Target Architecture'}
          </p>
          <div className="flex items-center gap-4 text-slate-400 flex-wrap justify-center">
            <button 
              onClick={() => setIsAndroidPermissionModalOpen(true)}
              className="hover:text-emerald-300 text-emerald-400 font-semibold transition flex items-center gap-1"
            >
              <span>{language === 'bn' ? '🛡️ অ্যান্ড্রয়েড পারমিশন ও সাইন-ইন' : '🛡️ Android Permissions & Login'}</span>
            </button>
            <span>•</span>
            <button 
              onClick={() => setIsAndroidReleaseModalOpen(true)}
              className="hover:text-emerald-300 text-sky-400 font-medium transition flex items-center gap-1"
            >
              <span>{language === 'bn' ? '📱 অ্যান্ড্রয়েড APK রিলিজ' : '📱 Android APK Release'}</span>
            </button>
            <span>•</span>
            <button 
              onClick={() => setIsStorageModalOpen(true)}
              className="hover:text-white text-emerald-400 font-medium transition flex items-center gap-1"
            >
              <span>{language === 'bn' ? '💾 মেমোরি কার্ড সেটিংস' : '💾 SD Card Settings'}</span>
            </button>
            <span>•</span>
            <button 
              onClick={() => setActiveTab('batch')}
              className="hover:text-white text-rose-400 font-medium transition flex items-center gap-1"
            >
              <span>{language === 'bn' ? 'ব্যাচ কিউ' : 'Batch Queue'}</span>
            </button>
            <span>•</span>
            <button 
              onClick={() => setActiveTab('pwa-guide')}
              className="hover:text-rose-400 text-sky-400 transition flex items-center gap-1"
            >
              <span>{language === 'bn' ? 'PWA শেয়ার টিউটোরিয়াল' : 'PWA Share Guide'}</span>
            </button>
            <span>•</span>
            <button 
              onClick={() => setActiveTab('blueprint')}
              className="hover:text-white transition"
            >
              {language === 'bn' ? 'অ্যান্ড্রয়েড ইন্টেন্ট কোড' : 'Android Intent Code'}
            </button>
            <span>•</span>
            <button 
              onClick={() => setActiveTab('history')}
              className="hover:text-white transition"
            >
              {language === 'bn' ? 'হিস্টোরি' : 'History'}
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
}
