// YouTube Song & Music Album Search Engine

export interface YouTubeTrackItem {
  id: string;
  title: string;
  artist: string;
  channelTitle: string;
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

export async function searchYouTubeSongs(query: string): Promise<YouTubeTrackItem[]> {
  const searchQuery = query.trim();
  if (!searchQuery) return [];

  try {
    const url = `https://www.youtube.com/results?search_query=${encodeURIComponent(searchQuery)}&sp=EgIQAQ%253D%253D`; // sp filters for videos
    const resp = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
        'Accept-Language': 'en-US,en;q=0.9,bn;q=0.8',
        'Cache-Control': 'no-cache',
      },
    });

    if (!resp.ok) {
      console.warn(`YouTube search returned HTTP ${resp.status}`);
      return getFallbackTracks(query);
    }

    const html = await resp.text();
    const match = html.match(/var ytInitialData = ({.*?});<\/script>/s) || html.match(/ytInitialData = ({.*?});<\/script>/s);

    if (!match) {
      console.warn('Could not extract ytInitialData from YouTube search response');
      return getFallbackTracks(query);
    }

    const data = JSON.parse(match[1]);
    const sectionList = data?.contents?.twoColumnSearchResultsRenderer?.primaryContents?.sectionListRenderer?.contents || [];

    const tracks: YouTubeTrackItem[] = [];

    for (const sec of sectionList) {
      const items = sec?.itemSectionRenderer?.contents || [];
      for (const it of items) {
        if (it.videoRenderer) {
          const vr = it.videoRenderer;
          const videoId = vr.videoId;
          if (!videoId) continue;

          const title = vr.title?.runs?.[0]?.text || vr.title?.simpleText || 'Unknown Song';
          const artist = vr.ownerText?.runs?.[0]?.text || vr.longBylineText?.runs?.[0]?.text || 'YouTube Artist';
          const lengthStr = vr.lengthText?.simpleText || '3:30';
          const views = vr.viewCountText?.simpleText || vr.shortViewCountText?.simpleText || '';
          const published = vr.publishedTimeText?.simpleText || '';

          // Calculate duration in seconds
          const parts = lengthStr.split(':').map(Number);
          let durationSeconds = 210;
          if (parts.length === 2) {
            durationSeconds = (parts[0] || 0) * 60 + (parts[1] || 0);
          } else if (parts.length === 3) {
            durationSeconds = (parts[0] || 0) * 3600 + (parts[1] || 0) * 60 + (parts[2] || 0);
          }

          const hqThumb = `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`;
          const maxThumb = `https://i.ytimg.com/vi/${videoId}/maxresdefault.jpg`;

          tracks.push({
            id: videoId,
            title,
            artist,
            channelTitle: artist,
            duration: lengthStr,
            durationSeconds,
            views,
            published,
            thumbnail: hqThumb,
            albumArt: maxThumb,
            url: `https://www.youtube.com/watch?v=${videoId}`,
            type: durationSeconds > 1200 ? 'album' : 'song',
            isOfficial: title.toLowerCase().includes('official') || title.toLowerCase().includes('audio'),
          });
        }
      }
    }

    if (tracks.length === 0) {
      return getFallbackTracks(query);
    }

    return tracks;
  } catch (error: any) {
    console.error('Error during YouTube song search:', error.message);
    return getFallbackTracks(query);
  }
}

// Reliable fallback songs if network to YouTube search is temporarily restricted
function getFallbackTracks(query: string): YouTubeTrackItem[] {
  const q = query.toLowerCase();
  const popularBangla: YouTubeTrackItem[] = [
    {
      id: 'e-ORhEE9VVg',
      title: 'Blank Space (Taylor Swift) - High Quality Audio & Video',
      artist: 'Taylor Swift',
      channelTitle: 'Taylor Swift',
      duration: '4:32',
      durationSeconds: 272,
      views: '3.4B views',
      published: 'Official Track',
      thumbnail: 'https://i.ytimg.com/vi/e-ORhEE9VVg/hqdefault.jpg',
      albumArt: 'https://i.ytimg.com/vi/e-ORhEE9VVg/maxresdefault.jpg',
      url: 'https://www.youtube.com/watch?v=e-ORhEE9VVg',
      type: 'song',
      isOfficial: true,
    },
    {
      id: 'O5gwxm3NxFU',
      title: 'Best Of Arijit Singh - Ultimate Romantic Collection Album',
      artist: 'Arijit Singh',
      channelTitle: 'Arijit Singh Music',
      duration: '1:00:52',
      durationSeconds: 3652,
      views: '75M views',
      published: 'Album Jukebox',
      thumbnail: 'https://i.ytimg.com/vi/O5gwxm3NxFU/hqdefault.jpg',
      albumArt: 'https://i.ytimg.com/vi/O5gwxm3NxFU/maxresdefault.jpg',
      url: 'https://www.youtube.com/watch?v=O5gwxm3NxFU',
      type: 'album',
      isOfficial: true,
    },
    {
      id: 'kJQP7kiw5Fk',
      title: 'Luis Fonsi - Despacito ft. Daddy Yankee',
      artist: 'Luis Fonsi',
      channelTitle: 'Luis Fonsi',
      duration: '4:41',
      durationSeconds: 281,
      views: '8.4B views',
      published: 'Official Music Video',
      thumbnail: 'https://i.ytimg.com/vi/kJQP7kiw5Fk/hqdefault.jpg',
      albumArt: 'https://i.ytimg.com/vi/kJQP7kiw5Fk/maxresdefault.jpg',
      url: 'https://www.youtube.com/watch?v=kJQP7kiw5Fk',
      type: 'song',
      isOfficial: true,
    },
  ];

  return popularBangla.filter(t => 
    t.title.toLowerCase().includes(q) || 
    t.artist.toLowerCase().includes(q) || 
    q.length < 3
  );
}
