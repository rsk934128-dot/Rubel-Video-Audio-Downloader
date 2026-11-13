import express, { Request, Response } from 'express';
import path from 'path';
import fs from 'fs';
import { createServer as createViteServer } from 'vite';
import { 
  resolveBypassMedia, 
  getBypassEngines, 
  proxyStreamMedia,
  inspectMediaUrl,
  streamResilientMedia,
  isBigBuckBunny,
  resolveYouTubeAudioStreamUrl,
  checkEtaCloudProgress
} from './server/bypassEngine';
import { searchYouTubeSongs } from './server/youtubeSearch';

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API Routes FIRST

  // Health check
  app.get('/api/health', (_req: Request, res: Response) => {
    res.json({ status: 'ok', time: new Date().toISOString() });
  });

  // YouTube Song & Album Search endpoint
  app.get('/api/youtube/search', async (req: Request, res: Response) => {
    const q = (req.query.q as string) || '';
    if (!q.trim()) {
      return res.status(400).json({ success: false, error: 'Query parameter q is required', tracks: [] });
    }
    try {
      const tracks = await searchYouTubeSongs(q);
      return res.json({ success: true, count: tracks.length, tracks });
    } catch (err: any) {
      console.error('YouTube search route error:', err.message);
      return res.status(500).json({ success: false, error: err.message, tracks: [] });
    }
  });

  // Pre-resolve direct MP3 audio URL for background playback
  app.get('/api/audio/resolve', async (req: Request, res: Response) => {
    const id = (req.query.id as string) || '';
    if (!id) return res.status(400).json({ success: false, error: 'Missing id' });
    try {
      const resolved = await resolveYouTubeAudioStreamUrl(id);
      if (resolved?.downloadUrl) {
        return res.json({
          success: true,
          streamUrl: `/api/audio/stream?id=${encodeURIComponent(id)}&title=${encodeURIComponent(resolved.title || 'audio')}`,
          title: resolved.title,
        });
      }
      return res.status(404).json({ success: false, error: 'Audio stream could not be resolved' });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err.message });
    }
  });

  // Dedicated Ultra-Fast Native Audio Stream with HTTP Range Support & Background Playback
  app.get('/api/audio/stream', async (req: Request, res: Response) => {
    const id = (req.query.id as string) || '';
    const title = (req.query.title as string) || 'audio_track';
    const localAudioPath = path.join(process.cwd(), 'server', 'assets', 'audio_master_320k.mp3');

    // Only serve Big Buck Bunny cached audio when the track is Big Buck Bunny
    if (isBigBuckBunny(id, title) && fs.existsSync(localAudioPath)) {
      const stat = fs.statSync(localAudioPath);
      const totalSize = stat.size;
      const range = req.headers.range;

      res.setHeader('Content-Type', 'audio/mpeg');
      res.setHeader('Accept-Ranges', 'bytes');
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Access-Control-Expose-Headers', 'Content-Range, Content-Length, Accept-Ranges, Content-Type');
      res.setHeader('Cache-Control', 'public, max-age=86400');

      if (range) {
        const parts = range.replace(/bytes=/, '').split('-');
        const start = parseInt(parts[0], 10);
        const end = parts[1] ? parseInt(parts[1], 10) : totalSize - 1;
        const chunksize = end - start + 1;
        const fileStream = fs.createReadStream(localAudioPath, { start, end });

        res.status(206);
        res.setHeader('Content-Range', `bytes ${start}-${end}/${totalSize}`);
        res.setHeader('Content-Length', chunksize);
        return fileStream.pipe(res);
      } else {
        res.status(200);
        res.setHeader('Content-Length', totalSize);
        return fs.createReadStream(localAudioPath).pipe(res);
      }
    }

    // Resolve and stream the REAL authentic MP3 audio for this specific YouTube song ID!
    try {
      const resolved = await resolveYouTubeAudioStreamUrl(id);
      if (resolved?.downloadUrl) {
        req.query.inline = 'true';
        req.query.isAudio = 'true';
        const safeName = `${(resolved.title || title).replace(/[\\/:*?"<>|]/g, '_')}.mp3`;
        return proxyStreamMedia(resolved.downloadUrl, safeName, req, res);
      }
    } catch (err: any) {
      console.warn('Audio stream resolution failed:', err.message);
    }

    // Do NOT serve Big Buck Bunny for other songs!
    return res.status(404).json({ error: 'Direct audio stream unavailable for this track' });
  });

  // Bypass Engines status endpoint
  app.get('/api/bypass/engines', (_req: Request, res: Response) => {
    res.json({
      status: 'online',
      activeCount: 4,
      engines: getBypassEngines(),
    });
  });

  // Dedicated Bypass Extract endpoint
  app.post('/api/bypass/extract', async (req: Request, res: Response) => {
    const { url, format } = req.body;
    if (!url) {
      return res.status(400).json({ success: false, error: 'URL is required' });
    }
    const result = await resolveBypassMedia(url, format || 'mp4');
    return res.json(result);
  });

  // Deep media format inspection and resolution endpoint
  app.post('/api/media/inspect', async (req: Request, res: Response) => {
    const { url } = req.body;
    if (!url) {
      return res.status(400).json({ error: 'Missing url parameter' });
    }

    try {
      const inspected = await inspectMediaUrl(url);
      if (inspected) {
        return res.json({ success: true, metadata: inspected });
      }
      return res.status(404).json({ success: false, error: 'Could not inspect media URL' });
    } catch (err: any) {
      console.error('Media inspection error:', err.message);
      return res.status(500).json({ success: false, error: err.message });
    }
  });

  // Real metadata extraction using oEmbed
  app.get('/api/metadata', async (req: Request, res: Response) => {
    const url = req.query.url as string;
    if (!url) {
      return res.status(400).json({ error: 'Missing url parameter' });
    }

    try {
      // YouTube oEmbed
      if (url.includes('youtube.com') || url.includes('youtu.be')) {
        const oembedUrl = `https://www.youtube.com/oembed?url=${encodeURIComponent(url)}&format=json`;
        const resp = await fetch(oembedUrl, {
          headers: { 'User-Agent': 'Mozilla/5.0 (UniversalDownloader/1.0)' },
        });
        if (resp.ok) {
          const data = await resp.json();
          return res.json({
            title: data.title,
            author: data.author_name,
            thumbnail: data.thumbnail_url,
            platform: 'youtube',
          });
        }
      }

      // Vimeo oEmbed
      if (url.includes('vimeo.com')) {
        const oembedUrl = `https://vimeo.com/api/oembed.json?url=${encodeURIComponent(url)}`;
        const resp = await fetch(oembedUrl);
        if (resp.ok) {
          const data = await resp.json();
          return res.json({
            title: data.title,
            author: data.author_name,
            thumbnail: data.thumbnail_url,
            platform: 'vimeo',
          });
        }
      }

      // TikTok oEmbed
      if (url.includes('tiktok.com')) {
        const oembedUrl = `https://www.tiktok.com/oembed?url=${encodeURIComponent(url)}`;
        const resp = await fetch(oembedUrl);
        if (resp.ok) {
          const data = await resp.json();
          return res.json({
            title: data.title,
            author: data.author_name,
            thumbnail: data.thumbnail_url,
            platform: 'tiktok',
          });
        }
      }

      return res.json({
        title: null,
        author: null,
        thumbnail: null,
      });
    } catch (err: any) {
      console.warn('Metadata fetch error:', err.message);
      return res.json({ title: null, author: null, thumbnail: null });
    }
  });

  // Start media conversion & bypass engine (TikTok / YouTube / Facebook / Instagram / Direct)
  app.post('/api/convert/start', async (req: Request, res: Response) => {
    const { url, format } = req.body;
    if (!url) {
      return res.status(400).json({ error: 'URL is required' });
    }

    try {
      const result = await resolveBypassMedia(url, format || 'mp4');
      if (result.success) {
        return res.json(result);
      }
      return res.status(500).json({
        success: false,
        error: result.error || 'Failed to initialize media bypass stream for target URL',
      });
    } catch (err: any) {
      console.error('Convert start error:', err.message);
      return res.status(500).json({
        success: false,
        error: err.message || 'Failed to initialize media stream for target URL',
      });
    }
  });

  // Check conversion progress
  app.get('/api/convert/progress', async (req: Request, res: Response) => {
    const id = req.query.id as string;
    const progressUrl = (req.query.progressUrl as string) || (id ? `https://lto2.affadaffa.com/api/progress?id=${id}` : null);

    if (!progressUrl) {
      return res.status(400).json({ error: 'Missing progressUrl or id' });
    }

    try {
      if (progressUrl.startsWith('etacloud::')) {
        const etaProg = await checkEtaCloudProgress(progressUrl);
        if (!etaProg) {
          return res.status(500).json({ success: false, error: 'EtaCloud progress check failed' });
        }
        return res.json(etaProg);
      }

      const resp = await fetch(progressUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
          'Referer': 'https://loader.to/',
        },
      });

      if (!resp.ok) {
        throw new Error(`Progress query status ${resp.status}`);
      }

      const data = await resp.json();
      return res.json({
        success: data.success === 1,
        progress: data.progress || 0,
        downloadUrl: data.download_url || null,
        text: data.text || '',
        title: data.title || data.info?.title,
        format: data.format,
      });
    } catch (err: any) {
      console.error('Convert progress error:', err.message);
      return res.status(500).json({ success: false, error: err.message });
    }
  });

  // Media stream proxy for direct device download (with Range support, CORS bypass, and resume capability)
  app.get('/api/proxy-download', async (req: Request, res: Response) => {
    const downloadUrl = req.query.url as string;
    const rawFilename = (req.query.filename as string) || 'download';
    const noStream = req.query.stream === 'false';

    if (!downloadUrl) {
      return res.status(400).send('Missing url parameter');
    }

    if (noStream) {
      return res.redirect(302, downloadUrl);
    }

    return proxyStreamMedia(downloadUrl, rawFilename, req, res);
  });

  // Vite middleware in development or static serving in production
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
