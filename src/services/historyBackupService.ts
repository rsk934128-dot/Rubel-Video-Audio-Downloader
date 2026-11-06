import { DownloadTask, MediaFormat, PlatformType } from '../types';

export interface ExportMetadata {
  version: number;
  app: string;
  exportedAt: string;
  recordCount: number;
  data: DownloadTask[];
}

export interface ImportResult {
  success: boolean;
  totalParsed: number;
  newItemsCount: number;
  mergedHistory: DownloadTask[];
  format: 'json' | 'csv';
  errorMessage?: string;
}

/**
 * Trigger download of raw text/blob as file
 */
function downloadFile(content: string, fileName: string, contentType: string) {
  const blob = new Blob([content], { type: contentType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/**
 * Format current date string for file names (YYYY-MM-DD_HH-mm)
 */
function getTimestampSlug(): string {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  const hours = String(d.getHours()).padStart(2, '0');
  const mins = String(d.getMinutes()).padStart(2, '0');
  return `${year}-${month}-${day}_${hours}-${mins}`;
}

/**
 * Validate and sanitize PlatformType
 */
export function normalizePlatform(platform?: string): PlatformType {
  const p = (platform || '').toLowerCase();
  if (p.includes('youtube')) return 'youtube';
  if (p.includes('facebook')) return 'facebook';
  if (p.includes('instagram')) return 'instagram';
  if (p.includes('tiktok')) return 'tiktok';
  if (p.includes('twitter') || p.includes('x.com')) return 'twitter';
  if (p.includes('vimeo')) return 'vimeo';
  if (p.includes('direct')) return 'direct';
  return 'other';
}

/**
 * Export history as formatted JSON file
 */
export function exportHistoryAsJSON(history: DownloadTask[]): void {
  // Strip large memory blob URLs before exporting
  const cleanData: DownloadTask[] = history.map((item) => ({
    ...item,
    fileBlobUrl: undefined,
  }));

  const exportPayload: ExportMetadata = {
    version: 1,
    app: 'VideoDownloaderPro',
    exportedAt: new Date().toISOString(),
    recordCount: cleanData.length,
    data: cleanData,
  };

  const jsonString = JSON.stringify(exportPayload, null, 2);
  const fileName = `download-history_${getTimestampSlug()}.json`;
  downloadFile(jsonString, fileName, 'application/json;charset=utf-8');
}

/**
 * Helper to escape CSV string cell
 */
function escapeCSVCell(value: any): string {
  if (value === null || value === undefined) return '""';
  const str = String(value).replace(/"/g, '""');
  return `"${str}"`;
}

/**
 * Export history as spreadsheet-compatible CSV file (with UTF-8 BOM)
 */
export function exportHistoryAsCSV(history: DownloadTask[]): void {
  const headers = [
    'ID',
    'Video ID',
    'Title',
    'Platform',
    'Format Type',
    'Quality',
    'File Name',
    'Total Size',
    'Downloaded Size',
    'Status',
    'Created Date',
    'Original URL',
    'Direct URL',
    'Thumbnail URL',
  ];

  const rows = history.map((item) => {
    const formatType = item.format?.type || (item.fileName.endsWith('.mp3') ? 'audio' : 'video');
    const quality = item.format?.quality || '';
    const dateStr = item.createdAt ? new Date(item.createdAt).toISOString() : '';

    return [
      escapeCSVCell(item.id),
      escapeCSVCell(item.videoId),
      escapeCSVCell(item.title),
      escapeCSVCell(item.platform),
      escapeCSVCell(formatType),
      escapeCSVCell(quality),
      escapeCSVCell(item.fileName),
      escapeCSVCell(item.totalSize || item.format?.estimatedSize || ''),
      escapeCSVCell(item.downloadedSize || ''),
      escapeCSVCell(item.status),
      escapeCSVCell(dateStr),
      escapeCSVCell(item.originalUrl || ''),
      escapeCSVCell(item.directUrl || ''),
      escapeCSVCell(item.thumbnail || ''),
    ].join(',');
  });

  // UTF-8 BOM (\uFEFF) ensures Excel properly opens Unicode/Bengali characters
  const csvContent = '\uFEFF' + [headers.join(','), ...rows].join('\r\n');
  const fileName = `download-history_${getTimestampSlug()}.csv`;
  downloadFile(csvContent, fileName, 'text/csv;charset=utf-8');
}

/**
 * Parse a standard CSV line respecting double quotes
 */
function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    const nextChar = line[i + 1];

    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        current += '"';
        i++; // skip escaped quote
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      result.push(current);
      current = '';
    } else {
      current += char;
    }
  }
  result.push(current);
  return result;
}

/**
 * Parse CSV text into DownloadTask array
 */
export function parseCSVHistory(csvText: string): DownloadTask[] {
  // Remove BOM if present
  let cleanText = csvText;
  if (cleanText.charCodeAt(0) === 0xFEFF) {
    cleanText = cleanText.slice(1);
  }

  // Split lines by newline
  const lines = cleanText.split(/\r?\n/).filter((l) => l.trim().length > 0);
  if (lines.length < 2) {
    throw new Error('CSV file is empty or has no data rows');
  }

  const headerCells = parseCSVLine(lines[0]).map((h) => h.trim().toLowerCase().replace(/[\s_]/g, ''));
  
  // Find column indices
  const getIndex = (aliases: string[]): number => {
    return headerCells.findIndex((h) => aliases.some((a) => h.includes(a)));
  };

  const idIdx = getIndex(['id']);
  const videoIdIdx = getIndex(['videoid']);
  const titleIdx = getIndex(['title', 'name', 'videotitle']);
  const platformIdx = getIndex(['platform', 'source']);
  const formatTypeIdx = getIndex(['formattype', 'type', 'format']);
  const qualityIdx = getIndex(['quality', 'resolution']);
  const fileNameIdx = getIndex(['filename', 'file']);
  const totalSizeIdx = getIndex(['totalsize', 'size', 'filesize']);
  const downloadedSizeIdx = getIndex(['downloadedsize']);
  const statusIdx = getIndex(['status', 'state']);
  const dateIdx = getIndex(['createddate', 'downloaddate', 'date', 'createdat', 'time']);
  const urlIdx = getIndex(['originalurl', 'sourceurl', 'url', 'link']);
  const directUrlIdx = getIndex(['directurl', 'streamurl', 'downloadurl']);
  const thumbIdx = getIndex(['thumbnail', 'thumb', 'image']);

  const tasks: DownloadTask[] = [];

  for (let i = 1; i < lines.length; i++) {
    const cells = parseCSVLine(lines[i]);
    if (!cells || cells.length === 0) continue;

    const title = titleIdx !== -1 && cells[titleIdx] ? cells[titleIdx].trim() : `Imported Video #${i}`;
    const fileName = fileNameIdx !== -1 && cells[fileNameIdx] ? cells[fileNameIdx].trim() : `${title.slice(0, 30)}.mp4`;
    const formatType = formatTypeIdx !== -1 && cells[formatTypeIdx]?.toLowerCase().includes('audio') ? 'audio' : 'video';
    const quality = qualityIdx !== -1 && cells[qualityIdx] ? cells[qualityIdx].trim() : (formatType === 'audio' ? '320kbps MP3' : '720p HD');
    const originalUrl = urlIdx !== -1 && cells[urlIdx] ? cells[urlIdx].trim() : '';
    const directUrl = directUrlIdx !== -1 && cells[directUrlIdx] ? cells[directUrlIdx].trim() : '';
    const platform = normalizePlatform(platformIdx !== -1 ? cells[platformIdx] : undefined);
    const totalSize = totalSizeIdx !== -1 && cells[totalSizeIdx] ? cells[totalSizeIdx].trim() : '25.0 MB';
    const downloadedSize = downloadedSizeIdx !== -1 && cells[downloadedSizeIdx] ? cells[downloadedSizeIdx].trim() : totalSize;
    const statusVal = statusIdx !== -1 && cells[statusIdx] ? cells[statusIdx].toLowerCase().trim() : 'completed';
    const status: DownloadTask['status'] = (['completed', 'downloading', 'failed', 'queued', 'extracting', 'converting'].includes(statusVal)) 
      ? (statusVal as DownloadTask['status']) 
      : 'completed';
    
    let createdAt = Date.now();
    if (dateIdx !== -1 && cells[dateIdx]) {
      const parsedTime = Date.parse(cells[dateIdx].trim());
      if (!isNaN(parsedTime)) {
        createdAt = parsedTime;
      }
    }

    const taskId = (idIdx !== -1 && cells[idIdx]?.trim()) ? cells[idIdx].trim() : `import_${Date.now()}_${i}`;
    const videoId = (videoIdIdx !== -1 && cells[videoIdIdx]?.trim()) ? cells[videoIdIdx].trim() : `vid_${i}`;

    const formatObj: MediaFormat = {
      id: `imported_fmt_${i}`,
      type: formatType,
      label: formatType === 'audio' ? 'MP3 Audio' : 'MP4 Video',
      subLabel: quality,
      ext: formatType === 'audio' ? 'mp3' : 'mp4',
      quality: quality,
      estimatedSize: totalSize,
      codec: formatType === 'audio' ? 'mp3' : 'h264',
    };

    const task: DownloadTask = {
      id: taskId,
      videoId,
      originalUrl: originalUrl || undefined,
      title,
      fileName,
      platform,
      thumbnail: (thumbIdx !== -1 && cells[thumbIdx]?.trim()) ? cells[thumbIdx].trim() : 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=500&auto=format&fit=crop&q=60',
      format: formatObj,
      progress: status === 'completed' ? 100 : 0,
      speed: '0 KB/s',
      downloadedBytes: 25000000,
      totalBytes: 25000000,
      downloadedSize,
      totalSize,
      eta: '0s',
      status,
      createdAt,
      directUrl: directUrl || undefined,
    };

    tasks.push(task);
  }

  return tasks;
}

/**
 * Parse JSON text into DownloadTask array
 */
export function parseJSONHistory(jsonText: string): DownloadTask[] {
  let parsed: any;
  try {
    parsed = JSON.parse(jsonText);
  } catch (err: any) {
    throw new Error('Invalid JSON file format: ' + (err?.message || 'Could not parse JSON'));
  }

  let rawList: any[] = [];
  if (Array.isArray(parsed)) {
    rawList = parsed;
  } else if (parsed && typeof parsed === 'object') {
    if (Array.isArray(parsed.data)) {
      rawList = parsed.data;
    } else if (Array.isArray(parsed.history)) {
      rawList = parsed.history;
    } else if (Array.isArray(parsed.items)) {
      rawList = parsed.items;
    } else {
      throw new Error('JSON file must contain an array of download history records or a "data" property with records.');
    }
  }

  if (rawList.length === 0) {
    throw new Error('No download records found in this JSON file.');
  }

  const tasks: DownloadTask[] = rawList.map((item, index) => {
    const title = item.title || item.name || `Imported Item #${index + 1}`;
    const fileName = item.fileName || item.filename || `${title.replace(/[/\\?%*:|"<>]/g, '_')}.mp4`;
    const formatType = item.format?.type || (fileName.endsWith('.mp3') ? 'audio' : 'video');
    const quality = item.format?.quality || item.quality || (formatType === 'audio' ? '320kbps MP3' : '720p HD');
    const totalSize = item.totalSize || item.fileSize || item.format?.estimatedSize || '20.0 MB';

    const format: MediaFormat = {
      id: item.format?.id || `fmt_${index}`,
      type: formatType,
      label: item.format?.label || (formatType === 'audio' ? 'MP3 Audio' : 'MP4 Video'),
      subLabel: item.format?.subLabel || quality,
      ext: item.format?.ext || (formatType === 'audio' ? 'mp3' : 'mp4'),
      quality: quality,
      estimatedSize: totalSize,
      codec: item.format?.codec || (formatType === 'audio' ? 'mp3' : 'h264'),
      isRecommended: Boolean(item.format?.isRecommended),
      directDownloadUrl: item.format?.directDownloadUrl || item.directUrl,
    };

    const statusVal = item.status || 'completed';
    const status: DownloadTask['status'] = (['completed', 'downloading', 'failed', 'queued', 'extracting', 'converting', 'corrupted'].includes(statusVal)) 
      ? statusVal 
      : 'completed';

    const createdAt = typeof item.createdAt === 'number' 
      ? item.createdAt 
      : (typeof item.timestamp === 'number' ? item.timestamp : Date.now());

    return {
      id: String(item.id || `imp_${Date.now()}_${index}`),
      videoId: String(item.videoId || item.id || `vid_${index}`),
      originalUrl: item.originalUrl || item.sourceUrl || item.url || undefined,
      title: String(title),
      fileName: String(fileName),
      platform: normalizePlatform(item.platform),
      thumbnail: item.thumbnail || 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=500&auto=format&fit=crop&q=60',
      format,
      progress: typeof item.progress === 'number' ? item.progress : (status === 'completed' ? 100 : 0),
      speed: item.speed || '0 KB/s',
      downloadedBytes: item.downloadedBytes || 20000000,
      totalBytes: item.totalBytes || 20000000,
      downloadedSize: item.downloadedSize || totalSize,
      totalSize: totalSize,
      eta: item.eta || '0s',
      status,
      createdAt,
      directUrl: item.directUrl || item.streamUrl || undefined,
      engine: item.engine,
      error: item.error,
    };
  });

  return tasks;
}

/**
 * Merge new tasks into existing history with duplicate prevention
 */
export function mergeHistoryRecords(
  existing: DownloadTask[],
  imported: DownloadTask[],
  mode: 'merge' | 'replace'
): { merged: DownloadTask[]; addedCount: number } {
  if (mode === 'replace') {
    return {
      merged: imported,
      addedCount: imported.length,
    };
  }

  // Merge mode: deduplicate by ID or identical title + originalUrl/fileName
  const seenIds = new Set<string>();
  const seenKeys = new Set<string>();

  existing.forEach((item) => {
    seenIds.add(item.id);
    const key = `${(item.originalUrl || item.fileName).toLowerCase()}_${item.title.toLowerCase()}`;
    seenKeys.add(key);
  });

  const newItemsToAdd: DownloadTask[] = [];

  imported.forEach((item) => {
    const key = `${(item.originalUrl || item.fileName).toLowerCase()}_${item.title.toLowerCase()}`;
    if (!seenIds.has(item.id) && !seenKeys.has(key)) {
      seenIds.add(item.id);
      seenKeys.add(key);
      newItemsToAdd.push(item);
    }
  });

  // Combine new items at the top and preserve date ordering
  const combined = [...newItemsToAdd, ...existing].sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));

  return {
    merged: combined,
    addedCount: newItemsToAdd.length,
  };
}
