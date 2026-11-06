export type PlatformType = 
  | 'youtube' 
  | 'facebook' 
  | 'instagram' 
  | 'tiktok' 
  | 'twitter' 
  | 'vimeo' 
  | 'direct' 
  | 'other';

export interface MediaFormat {
  id: string;
  type: 'video' | 'audio';
  label: string;
  subLabel: string;
  ext: 'mp4' | 'mp3' | 'm4a' | 'webm';
  quality: string;
  resolution?: string;
  bitrate?: string;
  fps?: number;
  estimatedSize: string;
  codec: string;
  badge?: string;
  isRecommended?: boolean;
  directDownloadUrl?: string;
}

export interface VideoMetadata {
  id: string;
  originalUrl: string;
  platform: PlatformType;
  title: string;
  author: string;
  authorAvatar?: string;
  duration: string;
  durationSeconds: number;
  viewCount: string;
  uploadDate: string;
  thumbnail: string;
  description?: string;
  formats: MediaFormat[];
  sampleVideoUrl?: string;
  sampleAudioUrl?: string;
}

export interface DownloadTask {
  id: string;
  videoId: string;
  originalUrl?: string;
  title: string;
  platform: PlatformType;
  thumbnail: string;
  format: MediaFormat;
  progress: number;
  speed: string;
  downloadedBytes: number;
  totalBytes: number;
  downloadedSize: string;
  totalSize: string;
  eta: string;
  status: 'queued' | 'extracting' | 'downloading' | 'converting' | 'completed' | 'failed' | 'corrupted';
  createdAt: number;
  fileName: string;
  error?: string;
  fileBlobUrl?: string;
  directUrl?: string;
  engine?: string;
  isCorrupted?: boolean;
  corruptedReason?: string;
}

export interface BatchQueueItem {
  id: string;
  originalUrl: string;
  platform: PlatformType;
  status: 'pending' | 'extracting' | 'queued' | 'downloading' | 'converting' | 'completed' | 'failed' | 'cancelled' | 'corrupted';
  video?: VideoMetadata;
  selectedFormat: MediaFormat;
  progress: number;
  speed: string;
  eta: string;
  downloadedSize: string;
  totalSize: string;
  error?: string;
  fileBlobUrl?: string;
  fileName?: string;
  taskId?: string;
  isCorrupted?: boolean;
}

export interface YouTubeSongTrack {
  id: string;
  title: string;
  artist: string;
  channelTitle?: string;
  duration: string;
  durationSeconds: number;
  views: string;
  published: string;
  thumbnail: string;
  albumArt: string;
  url: string;
  type: 'song' | 'album' | 'video';
  isOfficial?: boolean;
}

export type AppTab = 'downloader' | 'music' | 'batch' | 'history' | 'blueprint' | 'pwa-guide' | 'settings';
export type Language = 'bn' | 'en';

export type StorageDestination = 'sd_card' | 'phone_memory' | 'ask_each_time' | 'browser_default';

export interface StorageConfig {
  destination: StorageDestination;
  customFolder?: string;
  useNativePicker: boolean;
  autoSaveToSD: boolean;
  lastUsedPath?: string;
}

export interface StorageAccessStatus {
  isPersistent: boolean;
  hasNativePicker: boolean;
  hasFileShare: boolean;
  quotaBytes?: number;
  usageBytes?: number;
  availableBytes?: number;
  quotaFormatted: string;
  usageFormatted: string;
  availableFormatted: string;
  destination: StorageDestination;
  canWriteLocalStorage: boolean;
  status: 'optimal' | 'limited' | 'request_needed';
}
