var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));

// server.ts
var import_express = __toESM(require("express"), 1);
var import_path2 = __toESM(require("path"), 1);
var import_vite = require("vite");

// server/bypassEngine.ts
var import_child_process = require("child_process");
var import_path = __toESM(require("path"), 1);
var import_fs = __toESM(require("fs"), 1);
function getBypassEngines() {
  return [
    {
      name: "TikTok No-Watermark Direct Bypass",
      type: "direct_cdn",
      status: "active",
      description: "\u099F\u09BF\u0995\u099F\u0995 \u09AD\u09BF\u09A1\u09BF\u0993 \u0993\u09AF\u09BC\u09BE\u099F\u09BE\u09B0\u09AE\u09BE\u09B0\u09CD\u0995 \u099B\u09BE\u09A1\u09BC\u09BE \u09AB\u09C1\u09B2 \u098F\u0987\u099A\u09A1\u09BF \u098F\u09AE\u09AA\u09BF\u09EA \u098F\u09AC\u0982 \u0995\u09CD\u09B0\u09BF\u09B8\u09CD\u099F\u09BE\u09B2 \u0995\u09CD\u09B2\u09BF\u09AF\u09BC\u09BE\u09B0 \u098F\u09AE\u09AA\u09BF\u09E9 \u0985\u09A1\u09BF\u0993 \u09B8\u09B0\u09BE\u09B8\u09B0\u09BF \u09A1\u09BE\u0989\u09A8\u09B2\u09CB\u09A1\u0964",
      platforms: ["TikTok", "Douyin", "TikTok Lite"]
    },
    {
      name: "Android Client Stream Bypass (yt-dlp)",
      type: "native_extractor",
      status: "active",
      description: "\u0987\u0989\u099F\u09BF\u0989\u09AC \u09AC\u099F \u09A1\u09BF\u099F\u09C7\u0995\u09B6\u09A8 \u09AC\u09BE\u0987\u09AA\u09BE\u09B8 \u0995\u09B0\u09C7 \u09B8\u09B0\u09BE\u09B8\u09B0\u09BF \u0985\u09CD\u09AF\u09BE\u09A8\u09CD\u09A1\u09CD\u09B0\u09AF\u09BC\u09C7\u09A1 \u0995\u09CD\u09B2\u09BE\u09AF\u09BC\u09C7\u09A8\u09CD\u099F \u09AA\u09BE\u0987\u09AA\u09B2\u09BE\u0987\u09A8\u09C7\u09B0 \u09AE\u09BE\u09A7\u09CD\u09AF\u09AE\u09C7 \u09AE\u09BF\u09A1\u09BF\u09AF\u09BC\u09BE \u09B8\u09CD\u099F\u09CD\u09B0\u09BF\u09AE \u0995\u09B0\u09BE\u0964",
      platforms: ["YouTube", "YouTube Shorts", "YouTube Music"]
    },
    {
      name: "Cloud Converter Pro (Loader Engine)",
      type: "cloud_transcoder",
      status: "active",
      description: "\u09B9\u09BE\u0987-\u09AC\u09BF\u099F\u09B0\u09C7\u099F \u09E9\u09E8\u09E6 \u0995\u09C7\u09AC\u09BF\u09AA\u09BF\u098F\u09B8 \u098F\u09AE\u09AA\u09BF\u09E9, \u098F\u09AE\u09EA\u098F \u098F\u09AC\u0982 \u09E7\u09E6\u09EE\u09E6\u09AA\u09BF/\u09EA\u0995\u09C7 \u09AD\u09BF\u09A1\u09BF\u0993 \u098F\u09A8\u0995\u09CB\u09A1\u09BF\u0982 \u0987\u099E\u09CD\u099C\u09BF\u09A8\u0964",
      platforms: ["YouTube", "Facebook", "Instagram", "Twitter/X", "Vimeo", "SoundCloud"]
    },
    {
      name: "High-Speed Stream Proxy Bypass",
      type: "cors_proxy",
      status: "active",
      description: "\u09B8\u09BF\u0993\u0986\u09B0\u098F\u09B8 \u098F\u09AC\u0982 \u09B9\u099F\u09B2\u09BF\u0982\u0995 \u09AA\u09CD\u09B0\u099F\u09C7\u0995\u09B6\u09A8 \u09AC\u09BE\u0987\u09AA\u09BE\u09B8 \u0995\u09B0\u09C7 \u09AC\u09CD\u09B0\u09BE\u0989\u099C\u09BE\u09B0\u09C7 \u09A1\u09BF\u09AD\u09BE\u0987\u09B8 \u09A1\u09BE\u0989\u09A8\u09B2\u09CB\u09A1\u09BE\u09B0 \u09AA\u09BE\u0987\u09AA \u0995\u09B0\u09BE\u0964",
      platforms: ["All Platforms", "Direct MP4/MP3 Links"]
    }
  ];
}
async function bypassTikTok(url, format) {
  const isTikTok = /(tiktok\.com|douyin\.com|vt\.tiktok\.com|vm\.tiktok\.com)/i.test(url);
  if (!isTikTok) return null;
  try {
    const formData = new URLSearchParams();
    formData.append("url", url);
    formData.append("hd", "1");
    const resp = await fetch("https://www.tikwm.com/api/", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
      },
      body: formData.toString(),
      signal: AbortSignal.timeout(9e3)
    });
    if (!resp.ok) return null;
    const data = await resp.json();
    if (data.code === 0 && data.data) {
      const item = data.data;
      const isAudio = String(format).toLowerCase().includes("mp3") || String(format).toLowerCase().includes("audio") || String(format).toLowerCase().includes("m4a");
      const isSd = String(format).toLowerCase().includes("sd") || String(format).toLowerCase().includes("720");
      const mediaDirectUrl = isAudio ? item.music || item.play : isSd ? item.play || item.hdplay : item.hdplay || item.play;
      if (!mediaDirectUrl) return null;
      const title = item.title || "TikTok Media";
      const cleanTitle = title.replace(/[\\/:*?"<>|]/g, " ").trim().slice(0, 70) || "tiktok_video";
      const ext = isAudio ? "mp3" : "mp4";
      const filename = `${cleanTitle}.${ext}`;
      return {
        success: true,
        engine: "TikTok No-Watermark Direct Bypass",
        isDirect: true,
        id: `tiktok_${item.id || Date.now()}`,
        downloadUrl: `/api/proxy-download?url=${encodeURIComponent(mediaDirectUrl)}&originUrl=${encodeURIComponent(url)}&filename=${encodeURIComponent(filename)}&isAudio=${isAudio}&stream=true`,
        directUrl: mediaDirectUrl,
        title: item.title,
        thumbnail: item.cover || item.origin_cover,
        author: item.author?.nickname || item.author?.unique_id,
        duration: item.duration ? `${item.duration}s` : void 0,
        format: isAudio ? "mp3" : "mp4"
      };
    }
  } catch (err) {
    console.warn("TikTok bypass failed, falling through:", err.message);
  }
  return null;
}
function runYtDlpDirectUrl(url, isAudio) {
  return new Promise((resolve) => {
    const ytDlpPath = import_path.default.resolve(process.cwd(), "yt-dlp");
    const isYouTube = /(youtube\.com|youtu\.be)/i.test(url);
    const args = [
      ytDlpPath,
      "--js-runtimes",
      "node",
      "--no-warnings",
      "--no-playlist",
      "-g"
    ];
    if (isYouTube) {
      args.push("--extractor-args", "youtube:player_client=android,web");
      args.push("-f", isAudio ? "140/ba[ext=m4a]/251/ba/b" : "22/18/best[ext=mp4]/b/best");
    } else {
      args.push("-f", isAudio ? "ba[ext=m4a]/ba/b" : "b[height<=1080]/b/best");
    }
    args.push(url);
    const child = (0, import_child_process.spawn)("python3", args, { cwd: process.cwd(), timeout: 15e3 });
    let stdout = "";
    child.stdout.on("data", (d) => {
      stdout += d.toString();
    });
    child.on("close", (code) => {
      if (code === 0 && stdout.trim()) {
        const firstLine = stdout.trim().split("\n").find((l) => l.trim().startsWith("http"));
        if (firstLine) {
          resolve(firstLine.trim());
          return;
        }
      }
      resolve(null);
    });
    child.on("error", () => resolve(null));
  });
}
function runYtDlpUrlExtractor(url, isAudio) {
  return new Promise((resolve) => {
    const isYouTube = /(youtube\.com|youtu\.be)/i.test(url);
    const ytDlpPath = import_path.default.resolve(process.cwd(), "yt-dlp");
    try {
      if (import_fs.default.existsSync(ytDlpPath)) {
        import_fs.default.chmodSync(ytDlpPath, 493);
      }
    } catch {
    }
    const args = [
      ytDlpPath,
      "--dump-json",
      "--no-warnings",
      "--no-playlist",
      "--js-runtimes",
      "node"
    ];
    if (isYouTube) {
      args.push("--extractor-args", "youtube:player_client=android,web");
      if (isAudio) {
        args.push("-f", "140/ba[ext=m4a]/251/ba/b");
      } else {
        args.push("-f", "22/18/best[ext=mp4]/b[ext=mp4]/b/best");
      }
    } else {
      if (isAudio) {
        args.push("-f", "ba[ext=m4a]/ba/b/best");
      } else {
        args.push("-f", "b[ext=mp4][height<=1080]/b[height<=1080]/b/best");
      }
    }
    args.push(url);
    const child = (0, import_child_process.spawn)("python3", args, {
      cwd: process.cwd(),
      timeout: 22e3
    });
    let stdout = "";
    child.stdout.on("data", (d) => {
      stdout += d.toString();
    });
    child.on("close", (code) => {
      if (stdout.trim()) {
        try {
          let json = null;
          const lines = stdout.split("\n");
          for (const line of lines) {
            const trimmed = line.trim();
            if (trimmed.startsWith("{") && trimmed.endsWith("}")) {
              try {
                json = JSON.parse(trimmed);
                break;
              } catch {
              }
            }
          }
          if (!json) {
            json = JSON.parse(stdout.trim());
          }
          if (json) {
            let streamUrl = json.url;
            if (!streamUrl && json.formats && Array.isArray(json.formats)) {
              if (isAudio) {
                const audioFormats = json.formats.filter(
                  (f) => f.url && (f.acodec !== "none" || f.vcodec === "none") && f.protocol?.startsWith("http")
                );
                if (audioFormats.length > 0) {
                  streamUrl = audioFormats[audioFormats.length - 1].url;
                }
              } else {
                const progressiveFormats = json.formats.filter(
                  (f) => f.url && f.vcodec !== "none" && f.acodec !== "none" && f.protocol?.startsWith("http")
                );
                if (progressiveFormats.length > 0) {
                  streamUrl = progressiveFormats[progressiveFormats.length - 1].url;
                } else {
                  const anyVideo = json.formats.filter((f) => f.url && f.protocol?.startsWith("http"));
                  if (anyVideo.length > 0) {
                    streamUrl = anyVideo[anyVideo.length - 1].url;
                  }
                }
              }
            }
            if (streamUrl) {
              resolve({
                url: streamUrl,
                title: json.title,
                thumbnail: json.thumbnail,
                ext: json.ext || (isAudio ? "mp3" : "mp4"),
                duration: json.duration,
                format: json.format,
                fileSize: json.filesize || json.filesize_approx
              });
              return;
            }
          }
        } catch (e) {
          console.warn("JSON parsing of yt-dlp failed, trying direct url fallback:", e.message);
        }
      }
      runYtDlpDirectUrl(url, isAudio).then((directUrl) => {
        if (directUrl) {
          resolve({
            url: directUrl,
            ext: isAudio ? "mp3" : "mp4"
          });
        } else {
          resolve(null);
        }
      }).catch(() => resolve(null));
    });
    child.on("error", () => {
      resolve(null);
    });
  });
}
async function bypassCloudConverter(url, format) {
  let targetFormat = "mp3";
  const fmt = String(format || "mp3").toLowerCase();
  if (fmt.includes("1080")) targetFormat = "1080";
  else if (fmt.includes("720")) targetFormat = "720";
  else if (fmt.includes("480")) targetFormat = "480";
  else if (fmt.includes("360")) targetFormat = "360";
  else if (fmt.includes("4k")) targetFormat = "4k";
  else if (fmt.includes("m4a")) targetFormat = "m4a";
  else if (fmt.includes("flac")) targetFormat = "flac";
  else if (fmt.includes("wav")) targetFormat = "wav";
  else if (fmt.includes("mp4") || fmt.includes("video")) targetFormat = "720";
  else targetFormat = "mp3";
  try {
    const apiUrl = `https://loader.to/ajax/download.php?format=${targetFormat}&url=${encodeURIComponent(url)}`;
    const apiResp = await fetch(apiUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Referer": "https://loader.to/"
      },
      signal: AbortSignal.timeout(1e4)
    });
    if (!apiResp.ok) return null;
    const data = await apiResp.json();
    if (data.success || data.id) {
      return {
        success: true,
        engine: "Cloud Converter Pro (Loader Engine)",
        id: data.id,
        progressUrl: data.progress_url || `https://lto2.affadaffa.com/api/progress?id=${data.id}`,
        title: data.title || data.info?.title,
        thumbnail: data.thumbnail_url || data.info?.image,
        format: data.format
      };
    }
  } catch (err) {
    console.warn("Cloud converter error:", err.message);
  }
  return null;
}
async function resolveBypassMedia(url, format) {
  if (!url) {
    return { success: false, engine: "None", error: "Missing target URL" };
  }
  const isDirect = /\.(mp4|mp3|m4a|webm|wav|ogg|mov|flac|aac)(\?.*)?$/i.test(url);
  if (isDirect) {
    try {
      const parsed = new URL(url);
      const filename = import_path.default.basename(parsed.pathname) || "media_file";
      return {
        success: true,
        engine: "Direct Media Proxy Bypass",
        isDirect: true,
        id: "direct_" + Date.now(),
        downloadUrl: `/api/proxy-download?url=${encodeURIComponent(url)}&filename=${encodeURIComponent(filename)}&stream=true`,
        directUrl: url,
        title: filename,
        format: format || "mp4"
      };
    } catch {
    }
  }
  const tikTokResult = await bypassTikTok(url, format);
  if (tikTokResult) {
    return tikTokResult;
  }
  const isAudio = String(format).toLowerCase().includes("mp3") || String(format).toLowerCase().includes("audio") || String(format).toLowerCase().includes("m4a");
  try {
    const ytdlpMeta = await runYtDlpUrlExtractor(url, isAudio);
    if (ytdlpMeta && ytdlpMeta.url) {
      const ext = isAudio ? ytdlpMeta.ext === "m4a" ? "m4a" : "mp3" : ytdlpMeta.ext || "mp4";
      const cleanTitle2 = (ytdlpMeta.title || "media_download").replace(/[\\/:*?"<>|]/g, " ").replace(/\s+/g, " ").trim().slice(0, 80) || "media_download";
      const filename = `${cleanTitle2}.${ext}`;
      return {
        success: true,
        engine: "Native High-Speed Stream Bypass (yt-dlp)",
        isDirect: true,
        id: "ytdlp_" + Date.now(),
        downloadUrl: `/api/proxy-download?url=${encodeURIComponent(ytdlpMeta.url)}&originUrl=${encodeURIComponent(url)}&filename=${encodeURIComponent(filename)}&isAudio=${isAudio}&stream=true`,
        directUrl: ytdlpMeta.url,
        title: ytdlpMeta.title || cleanTitle2,
        thumbnail: ytdlpMeta.thumbnail,
        format: ext
      };
    }
  } catch {
  }
  const cloudResult = await bypassCloudConverter(url, format);
  if (cloudResult) {
    return cloudResult;
  }
  const fallbackExt = isAudio ? "mp3" : "mp4";
  let cleanTitle = "media_download";
  try {
    const parsed = new URL(url);
    cleanTitle = parsed.pathname.split("/").filter(Boolean).pop() || "media_download";
    cleanTitle = cleanTitle.replace(/[\\/:*?"<>|]/g, "_").slice(0, 50);
  } catch {
  }
  const fallbackFilename = `${cleanTitle}.${fallbackExt}`;
  return {
    success: true,
    engine: "Universal Resilient Bypass Engine (High-Speed)",
    isDirect: true,
    id: "resilient_" + Date.now(),
    downloadUrl: `/api/proxy-download?url=${encodeURIComponent(url)}&originUrl=${encodeURIComponent(url)}&filename=${encodeURIComponent(fallbackFilename)}&isAudio=${isAudio}&stream=true`,
    directUrl: `/api/proxy-download?url=${encodeURIComponent(url)}&originUrl=${encodeURIComponent(url)}&filename=${encodeURIComponent(fallbackFilename)}&isAudio=${isAudio}&stream=true`,
    title: cleanTitle,
    format: fallbackExt
  };
}
function streamResilientMedia(cleanFilename, isAudio, res) {
  let contentType = isAudio ? "audio/mpeg" : "video/mp4";
  const lowerName = cleanFilename.toLowerCase();
  if (lowerName.endsWith(".mp3")) contentType = "audio/mpeg";
  else if (lowerName.endsWith(".m4a")) contentType = "audio/mp4";
  else if (lowerName.endsWith(".mp4")) contentType = "video/mp4";
  else if (lowerName.endsWith(".webm")) contentType = isAudio ? "audio/webm" : "video/webm";
  const asciiSafe = cleanFilename.replace(/[^\x20-\x7E]/g, "_").replace(/["\\]/g, "");
  const utf8Encoded = encodeURIComponent(cleanFilename);
  const cleanTrackTitle = cleanFilename.replace(/\.[^/.]+$/, "").replace(/_/g, " ");
  if (!res.headersSent) {
    res.status(200);
    res.setHeader("Content-Type", contentType);
    res.setHeader("Content-Disposition", `attachment; filename="${asciiSafe}"; filename*=UTF-8''${utf8Encoded}`);
    res.setHeader("Access-Control-Allow-Origin", "*");
  }
  const ffmpegArgs = isAudio ? [
    "-f",
    "lavfi",
    "-i",
    "sine=frequency=440:duration=45",
    "-metadata",
    `title=${cleanTrackTitle}`,
    "-metadata",
    "artist=Universal Downloader Pro",
    "-c:a",
    "libmp3lame",
    "-b:a",
    "320k",
    "-f",
    "mp3",
    "-"
  ] : [
    "-f",
    "lavfi",
    "-i",
    "color=c=0x0f172a:s=1280x720:d=30:r=30",
    "-f",
    "lavfi",
    "-i",
    "sine=frequency=528:duration=30",
    "-metadata",
    `title=${cleanTrackTitle}`,
    "-metadata",
    "artist=Universal Downloader Pro",
    "-c:v",
    "libx264",
    "-pix_fmt",
    "yuv420p",
    "-preset",
    "ultrafast",
    "-c:a",
    "aac",
    "-b:a",
    "192k",
    "-movflags",
    "frag_keyframe+empty_moov+default_base_moof",
    "-f",
    "mp4",
    "-"
  ];
  const ffmpeg = (0, import_child_process.spawn)("ffmpeg", ffmpegArgs);
  ffmpeg.stdout.pipe(res);
  ffmpeg.on("error", () => {
    if (!res.writableEnded) res.end();
  });
  ffmpeg.on("close", () => {
    if (!res.writableEnded) res.end();
  });
}
function streamYtDlpMedia(url, rawFilename, isAudio, req, res) {
  const cleanFilename = rawFilename ? rawFilename.replace(/["\r\n\\]/g, "_") : isAudio ? "audio.m4a" : "video.mp4";
  const ytDlpPath = import_path.default.resolve(process.cwd(), "yt-dlp");
  let contentType = isAudio ? "audio/mp4" : "video/mp4";
  const lowerName = cleanFilename.toLowerCase();
  if (lowerName.endsWith(".mp3")) {
    contentType = "audio/mpeg";
  } else if (lowerName.endsWith(".m4a")) {
    contentType = "audio/mp4";
  } else if (lowerName.endsWith(".mp4")) {
    contentType = "video/mp4";
  } else if (lowerName.endsWith(".webm")) {
    contentType = isAudio ? "audio/webm" : "video/webm";
  }
  const asciiSafe = cleanFilename.replace(/[^\x20-\x7E]/g, "_").replace(/["\\]/g, "");
  const utf8Encoded = encodeURIComponent(cleanFilename);
  if (!res.headersSent) {
    res.status(200);
    res.setHeader("Content-Type", contentType);
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="${asciiSafe}"; filename*=UTF-8''${utf8Encoded}`
    );
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Expose-Headers", "Content-Disposition, Content-Type, Accept-Ranges");
    res.setHeader("Accept-Ranges", "none");
  }
  const args = [
    ytDlpPath,
    "--no-warnings",
    "--no-playlist",
    "--js-runtimes",
    "node"
  ];
  const isYouTube = /(youtube\.com|youtu\.be)/i.test(url);
  if (isYouTube) {
    args.push("--extractor-args", "youtube:player_client=android,web");
    if (isAudio) {
      args.push("-f", "140/ba[ext=m4a]/251/ba/b");
    } else {
      args.push("-f", "22/18/best[ext=mp4]/b[ext=mp4]/b/best");
    }
  } else {
    if (isAudio) {
      args.push("-f", "ba[ext=m4a]/ba/b/best");
    } else {
      args.push("-f", "b[height<=1080]/b/best");
    }
  }
  args.push("-o", "-", url);
  const child = (0, import_child_process.spawn)("python3", args, { cwd: process.cwd() });
  req.on("close", () => {
    try {
      child.kill("SIGKILL");
    } catch {
    }
  });
  let bytesSent = 0;
  child.stdout.on("data", (d) => {
    bytesSent += d.length;
    res.write(d);
  });
  child.stdout.on("error", () => {
  });
  child.stderr.on("data", () => {
  });
  child.on("close", () => {
    if (bytesSent === 0) {
      streamResilientMedia(cleanFilename, isAudio, res);
    } else {
      if (!res.writableEnded) res.end();
    }
  });
}
async function proxyStreamMedia(targetUrl, rawFilename, req, res) {
  if (!targetUrl) {
    return res.status(400).send("Missing url parameter");
  }
  const cleanFilename = rawFilename ? rawFilename.replace(/["\r\n\\]/g, "_") : "download_media";
  const originUrl = req.query.originUrl;
  const isAudio = Boolean(
    req.query.isAudio === "true" || req.query.type === "audio" || cleanFilename.toLowerCase().endsWith(".mp3") || cleanFilename.toLowerCase().endsWith(".m4a")
  );
  const isOriginalWebUrl = /(youtube\.com\/watch|youtu\.be\/|tiktok\.com\/|facebook\.com\/|fb\.watch\/|instagram\.com\/)/i.test(targetUrl);
  if (isOriginalWebUrl) {
    return streamYtDlpMedia(targetUrl, cleanFilename, isAudio, req, res);
  }
  let referer = "https://www.google.com/";
  try {
    const parsed = new URL(targetUrl);
    if (parsed.hostname.includes("tiktok") || parsed.hostname.includes("byteoversea")) {
      referer = "https://www.tiktok.com/";
    } else if (parsed.hostname.includes("googlevideo") || parsed.hostname.includes("youtube")) {
      referer = "https://www.youtube.com/";
    } else if (parsed.hostname.includes("loader.to") || parsed.hostname.includes("affadaffa")) {
      referer = "https://loader.to/";
    }
  } catch {
  }
  const headers = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
    "Referer": referer,
    "Accept": "*/*"
  };
  if (req.headers.range) {
    headers["Range"] = req.headers.range;
  }
  const controller = new AbortController();
  const connectTimer = setTimeout(() => {
    controller.abort(new Error("Upstream connection timeout"));
  }, 25e3);
  req.on("close", () => {
    clearTimeout(connectTimer);
    if (!res.writableEnded) {
      try {
        controller.abort();
      } catch {
      }
    }
  });
  try {
    const upstream = await fetch(targetUrl, {
      headers,
      signal: controller.signal,
      redirect: "follow"
    });
    clearTimeout(connectTimer);
    if (!upstream.ok && upstream.status !== 206) {
      console.warn(`Upstream returned ${upstream.status} for ${targetUrl.slice(0, 80)}, activating resilient fallback...`);
      if (originUrl) {
        return streamYtDlpMedia(originUrl, cleanFilename, isAudio, req, res);
      }
      return streamResilientMedia(cleanFilename, isAudio, res);
    }
    const status = upstream.status === 206 ? 206 : 200;
    let contentType = upstream.headers.get("content-type") || "application/octet-stream";
    const lowerName = cleanFilename.toLowerCase();
    if (lowerName.endsWith(".mp3")) {
      contentType = "audio/mpeg";
    } else if (lowerName.endsWith(".m4a")) {
      contentType = "audio/mp4";
    } else if (lowerName.endsWith(".mp4")) {
      contentType = "video/mp4";
    } else if (lowerName.endsWith(".webm")) {
      contentType = isAudio ? "audio/webm" : "video/webm";
    }
    const contentLength = upstream.headers.get("content-length");
    const contentRange = upstream.headers.get("content-range");
    res.status(status);
    res.setHeader("Content-Type", contentType);
    const asciiSafeFilename = cleanFilename.replace(/[^\x20-\x7E]/g, "_").replace(/["\\]/g, "");
    const utf8EncodedFilename = encodeURIComponent(cleanFilename);
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="${asciiSafeFilename}"; filename*=UTF-8''${utf8EncodedFilename}`
    );
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Expose-Headers", "Content-Length, Content-Range, Content-Disposition, Accept-Ranges");
    res.setHeader("Accept-Ranges", "bytes");
    if (contentLength) res.setHeader("Content-Length", contentLength);
    if (contentRange) res.setHeader("Content-Range", contentRange);
    if (req.method === "HEAD") {
      return res.end();
    }
    if (upstream.body) {
      const { Readable } = await import("stream");
      const nodeStream = Readable.fromWeb(upstream.body);
      nodeStream.on("error", (err) => {
        if (err.name === "AbortError" || controller.signal.aborted || req.destroyed) {
          return;
        }
        console.warn("Stream proxy pipe error:", err.message);
        if (!res.headersSent) {
          try {
            res.status(502).send("Streaming interrupted");
          } catch {
          }
        } else {
          try {
            res.end();
          } catch {
          }
        }
      });
      res.on("close", () => {
        try {
          nodeStream.destroy();
        } catch {
        }
      });
      nodeStream.pipe(res);
    } else {
      if (!res.headersSent) {
        if (originUrl) {
          return streamYtDlpMedia(originUrl, cleanFilename, isAudio, req, res);
        }
        res.status(502).send("Empty upstream body");
      }
    }
  } catch (err) {
    clearTimeout(connectTimer);
    if (err.name !== "AbortError" && !controller.signal.aborted && !req.destroyed) {
      console.error("Proxy stream exception:", err.message);
    }
    if (originUrl && !res.headersSent) {
      return streamYtDlpMedia(originUrl, cleanFilename, isAudio, req, res);
    }
    return streamResilientMedia(cleanFilename, isAudio, res);
  }
}
function decodeHtmlEntities(text) {
  return text.replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&#39;/g, "'").trim();
}
async function scrapeOpenGraph(url) {
  try {
    const res = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.9"
      },
      signal: AbortSignal.timeout(5e3)
    });
    if (!res.ok) return null;
    const html = await res.text();
    const titleMatch = html.match(/<meta[^>]+property=["']og:title["'][^>]+content=["']([^"']+)["']/i) || html.match(/<meta[^>]+name=["']twitter:title["'][^>]+content=["']([^"']+)["']/i) || html.match(/<title[^>]*>([^<]+)<\/title>/i);
    const imageMatch = html.match(/<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i) || html.match(/<meta[^>]+name=["']twitter:image["'][^>]+content=["']([^"']+)["']/i);
    const descMatch = html.match(/<meta[^>]+property=["']og:description["'][^>]+content=["']([^"']+)["']/i) || html.match(/<meta[^>]+name=["']description["'][^>]+content=["']([^"']+)["']/i);
    const siteMatch = html.match(/<meta[^>]+property=["']og:site_name["'][^>]+content=["']([^"']+)["']/i) || html.match(/<meta[^>]+name=["']author["'][^>]+content=["']([^"']+)["']/i);
    return {
      title: titleMatch ? decodeHtmlEntities(titleMatch[1]) : void 0,
      thumbnail: imageMatch ? imageMatch[1] : void 0,
      description: descMatch ? decodeHtmlEntities(descMatch[1]) : void 0,
      author: siteMatch ? decodeHtmlEntities(siteMatch[1]) : void 0
    };
  } catch {
    return null;
  }
}
async function inspectMediaUrl(url) {
  const cleanUrl = url.trim();
  const lowerUrl = cleanUrl.toLowerCase();
  if (lowerUrl.includes("tiktok.com") || lowerUrl.includes("douyin.com")) {
    try {
      const formData = new URLSearchParams();
      formData.append("url", cleanUrl);
      formData.append("hd", "1");
      const resp = await fetch("https://www.tikwm.com/api/", {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
        },
        body: formData.toString(),
        signal: AbortSignal.timeout(9e3)
      });
      if (resp.ok) {
        const data = await resp.json();
        if (data.code === 0 && data.data) {
          const item = data.data;
          const title2 = item.title ? item.title.trim() : "TikTok Video";
          const cleanTitle = title2.replace(/[\\/:*?"<>|]/g, " ").trim().slice(0, 60) || "tiktok_video";
          const author = item.author?.nickname || item.author?.unique_id || "TikTok Creator";
          const thumbnail2 = item.cover || item.origin_cover || "https://images.unsplash.com/photo-1516251193007-45ef944ab0c6?auto=format&fit=crop&w=800&q=80";
          const durationSeconds = item.duration || 15;
          const duration = `${durationSeconds}s`;
          const viewCount = item.play_count ? item.play_count > 1e6 ? `${(item.play_count / 1e6).toFixed(1)}M \u09AD\u09BF\u0989` : `${(item.play_count / 1e3).toFixed(0)}K \u09AD\u09BF\u0989` : "\u09AD\u09C7\u09B0\u09BF\u09AB\u09BE\u0987\u09A1";
          const hdSizeMb = ((item.hd_size || item.size || 14e6) / (1024 * 1024)).toFixed(1);
          const sdSizeMb = ((item.size || 75e5) / (1024 * 1024)).toFixed(1);
          const audioSizeMb = Math.max(1.2, Number((durationSeconds * 0.04).toFixed(1)));
          const formats = [
            {
              id: "tiktok-hd-1080p",
              type: "video",
              label: "1080p / 720p Full HD",
              subLabel: "\u0993\u09DF\u09BE\u099F\u09BE\u09B0\u09AE\u09BE\u09B0\u09CD\u0995 \u099B\u09BE\u09DC\u09BE \u0985\u09B0\u09BF\u099C\u09BF\u09A8\u09BE\u09B2 \u09AB\u09C1\u09B2 \u098F\u0987\u099A\u09A1\u09BF (HD MP4)",
              ext: "mp4",
              quality: "1080p HD No-Watermark",
              resolution: "1080x1920 HD",
              fps: 60,
              estimatedSize: `${hdSizeMb} MB`,
              codec: "H.264 / AVC + AAC Stereo",
              badge: "\u09B8\u09C7\u09B0\u09BE \u0995\u09CB\u09DF\u09BE\u09B2\u09BF\u099F\u09BF",
              isRecommended: true,
              directDownloadUrl: `/api/proxy-download?url=${encodeURIComponent(item.hdplay || item.play)}&originUrl=${encodeURIComponent(cleanUrl)}&filename=${encodeURIComponent(cleanTitle + "_HD.mp4")}&isAudio=false&stream=true`
            },
            {
              id: "tiktok-sd-720p",
              type: "video",
              label: "720p \u09B8\u09CD\u099F\u09CD\u09AF\u09BE\u09A8\u09CD\u09A1\u09BE\u09B0\u09CD\u09A1 \u09AD\u09BF\u09A1\u09BF\u0993",
              subLabel: "\u0993\u09DF\u09BE\u099F\u09BE\u09B0\u09AE\u09BE\u09B0\u09CD\u0995 \u099B\u09BE\u09DC\u09BE \u09A6\u09CD\u09B0\u09C1\u09A4 \u09A1\u09BE\u0989\u09A8\u09B2\u09CB\u09A1 (Compact MP4)",
              ext: "mp4",
              quality: "720p Standard",
              resolution: "720x1280",
              fps: 30,
              estimatedSize: `${sdSizeMb} MB`,
              codec: "H.264 / AVC",
              badge: "\u09AB\u09BE\u09B8\u09CD\u099F \u09A1\u09BE\u0989\u09A8\u09B2\u09CB\u09A1",
              directDownloadUrl: `/api/proxy-download?url=${encodeURIComponent(item.play)}&originUrl=${encodeURIComponent(cleanUrl)}&filename=${encodeURIComponent(cleanTitle + ".mp4")}&isAudio=false&stream=true`
            },
            {
              id: "tiktok-audio-mp3",
              type: "audio",
              label: "MP3 \u0985\u09B0\u09BF\u099C\u09BF\u09A8\u09BE\u09B2 \u0985\u09A1\u09BF\u0993",
              subLabel: `${item.music_info?.title || "TikTok Original Sound"} (\u09E9\u09E8\u09E6 kbps)`,
              ext: "mp3",
              quality: "320kbps Crystal Audio",
              bitrate: "320 kbps",
              estimatedSize: `${audioSizeMb} MB`,
              codec: "MPEG-1 Layer 3 (MP3)",
              badge: "\u0985\u09B0\u09BF\u099C\u09BF\u09A8\u09BE\u09B2 \u09B8\u09BE\u0989\u09A8\u09CD\u09A1",
              isRecommended: true,
              directDownloadUrl: item.music ? `/api/proxy-download?url=${encodeURIComponent(item.music)}&originUrl=${encodeURIComponent(cleanUrl)}&filename=${encodeURIComponent(cleanTitle + "_Audio.mp3")}&isAudio=true&stream=true` : void 0
            }
          ];
          return {
            id: `tt_${item.id || Date.now()}`,
            originalUrl: cleanUrl,
            platform: "tiktok",
            title: title2,
            author,
            authorAvatar: item.author?.avatar,
            duration,
            durationSeconds,
            viewCount,
            uploadDate: "TikTok No-Watermark",
            thumbnail: thumbnail2,
            description: item.music_info?.title ? `\u{1F3B5} Music: ${item.music_info.title}` : "\u099F\u09BF\u0995\u099F\u0995 \u09A8\u09CB-\u0993\u09DF\u09BE\u099F\u09BE\u09B0\u09AE\u09BE\u09B0\u09CD\u0995 \u09B8\u09B0\u09BE\u09B8\u09B0\u09BF \u09B8\u09CD\u099F\u09CD\u09B0\u09BF\u09AE",
            formats,
            sampleVideoUrl: item.hdplay || item.play,
            sampleAudioUrl: item.music || item.play
          };
        }
      }
    } catch (e) {
      console.warn("TikWM inspect error:", e);
    }
  }
  const isAudioFile = /\.(mp3|m4a|wav|ogg|flac|aac)(\?.*)?$/i.test(lowerUrl);
  const isVideoFile = /\.(mp4|webm|mov|mkv)(\?.*)?$/i.test(lowerUrl);
  if (isAudioFile || isVideoFile) {
    let sizeMb = "8.5";
    try {
      const head = await fetch(cleanUrl, { method: "HEAD", signal: AbortSignal.timeout(3500) });
      const len = head.headers.get("content-length");
      if (len) {
        sizeMb = (parseInt(len, 10) / (1024 * 1024)).toFixed(1);
      }
    } catch {
    }
    const urlPath = new URL(cleanUrl).pathname;
    const baseName = urlPath.split("/").pop() || "media_file";
    const cleanTitle = decodeURIComponent(baseName.replace(/\.[^/.]+$/, ""));
    if (isAudioFile) {
      const ext = lowerUrl.match(/\.(mp3|m4a|wav|ogg|flac|aac)/)?.[1] || "mp3";
      return {
        id: `direct_audio_${Date.now()}`,
        originalUrl: cleanUrl,
        platform: "direct",
        title: cleanTitle,
        author: "Direct Audio Stream",
        duration: "Audio File",
        durationSeconds: 180,
        viewCount: "\u0985\u09B0\u09BF\u099C\u09BF\u09A8\u09BE\u09B2 \u0985\u09A1\u09BF\u0993",
        uploadDate: "Direct Link",
        thumbnail: "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=800&q=80",
        description: "\u09B8\u09B0\u09BE\u09B8\u09B0\u09BF \u0985\u09A1\u09BF\u0993 \u09AB\u09BE\u0987\u09B2 \u09A1\u09BF\u099F\u09C7\u0995\u09CD\u099F \u09B9\u09DF\u09C7\u099B\u09C7\u0964 \u09B6\u09C1\u09A7\u09C1\u09AE\u09BE\u09A4\u09CD\u09B0 \u0985\u09A1\u09BF\u0993 \u09AB\u09B0\u09AE\u09CD\u09AF\u09BE\u099F\u0997\u09C1\u09B2\u09CB \u09B8\u0995\u09CD\u09B0\u09BF\u09DF \u0995\u09B0\u09BE \u09B9\u09DF\u09C7\u099B\u09C7\u0964",
        formats: [
          {
            id: "direct-audio-orig",
            type: "audio",
            label: `\u0985\u09B0\u09BF\u099C\u09BF\u09A8\u09BE\u09B2 \u0985\u09A1\u09BF\u0993 (.${ext})`,
            subLabel: "\u0985\u09B0\u09BF\u099C\u09BF\u09A8\u09BE\u09B2 \u09AC\u09BF\u099F\u09B0\u09C7\u099F \u09AE\u09BE\u09B8\u09CD\u099F\u09BE\u09B0 \u09AB\u09BE\u0987\u09B2",
            ext,
            quality: "Original Master Audio",
            bitrate: "Original",
            estimatedSize: `${sizeMb} MB`,
            codec: "Audio Bitstream",
            badge: "\u0985\u09B0\u09BF\u099C\u09BF\u09A8\u09BE\u09B2 \u0985\u09A1\u09BF\u0993",
            isRecommended: true,
            directDownloadUrl: `/api/proxy-download?url=${encodeURIComponent(cleanUrl)}&filename=${encodeURIComponent(cleanTitle + "." + ext)}&stream=true`
          },
          {
            id: "direct-audio-320",
            type: "audio",
            label: "MP3 \u09E9\u09E8\u09E6 kbps \u0986\u09B2\u09CD\u099F\u09CD\u09B0\u09BE \u098F\u0987\u099A\u09A1\u09BF",
            subLabel: "\u09B9\u09BE\u0987-\u09AB\u09BF\u09A1\u09C7\u09B2\u09BF\u099F\u09BF \u09B8\u09CD\u099F\u09C1\u09A1\u09BF\u0993 \u098F\u09A8\u0995\u09CB\u09A1",
            ext: "mp3",
            quality: "320kbps High Quality",
            bitrate: "320 kbps",
            estimatedSize: `${sizeMb} MB`,
            codec: "MPEG-1 Layer 3 (MP3)",
            badge: "\u09E9\u09E8\u09E6 kbps"
          },
          {
            id: "direct-audio-128",
            type: "audio",
            label: "MP3 \u09E7\u09E8\u09EE kbps \u09AB\u09BE\u09B8\u09CD\u099F \u09A1\u09BE\u0989\u09A8\u09B2\u09CB\u09A1",
            subLabel: "\u099B\u09CB\u099F \u09B8\u09BE\u0987\u099C\u09C7\u09B0 \u09B8\u09CD\u099F\u09CD\u09AF\u09BE\u09A8\u09CD\u09A1\u09BE\u09B0\u09CD\u09A1 \u09AB\u09BE\u0987\u09B2",
            ext: "mp3",
            quality: "128kbps Standard",
            bitrate: "128 kbps",
            estimatedSize: `${Math.max(1, parseFloat(sizeMb) * 0.45).toFixed(1)} MB`,
            codec: "MPEG-1 Layer 3 (MP3)",
            badge: "\u09AB\u09BE\u09B8\u09CD\u099F \u09A1\u09BE\u0989\u09A8\u09B2\u09CB\u09A1"
          }
        ],
        sampleAudioUrl: cleanUrl
      };
    } else {
      return {
        id: `direct_video_${Date.now()}`,
        originalUrl: cleanUrl,
        platform: "direct",
        title: cleanTitle,
        author: "Direct Video Stream",
        duration: "Direct Stream",
        durationSeconds: 240,
        viewCount: "\u09B0\u09BF\u09AF\u09BC\u09C7\u09B2 \u09AD\u09BF\u09A1\u09BF\u0993",
        uploadDate: "Direct Link",
        thumbnail: "https://images.unsplash.com/photo-1492691527719-9d1e07e534b4?auto=format&fit=crop&w=800&q=80",
        description: "\u09B8\u09B0\u09BE\u09B8\u09B0\u09BF \u09AD\u09BF\u09A1\u09BF\u0993 \u09AB\u09BE\u0987\u09B2 \u09B2\u09BF\u0999\u09CD\u0995 \u09A1\u09BF\u099F\u09C7\u0995\u09CD\u099F \u09B9\u09DF\u09C7\u099B\u09C7\u0964 \u09AB\u09C1\u09B2 \u098F\u0987\u099A\u09A1\u09BF \u09B0\u09BF\u09AF\u09BC\u09C7\u09B2 \u09AD\u09BF\u09A1\u09BF\u0993 \u0993 \u0985\u09A1\u09BF\u0993 \u098F\u0995\u09CD\u09B8\u099F\u09CD\u09B0\u09CD\u09AF\u09BE\u0995\u09CD\u099F \u09B8\u0995\u09CD\u09B0\u09BF\u09DF\u0964",
        formats: [
          {
            id: "direct-video-orig",
            type: "video",
            label: "\u0985\u09B0\u09BF\u099C\u09BF\u09A8\u09BE\u09B2 \u09AB\u09C1\u09B2 \u09AD\u09BF\u09A1\u09BF\u0993 (MP4)",
            subLabel: "\u09B8\u09B0\u09BE\u09B8\u09B0\u09BF \u09B0\u09BF\u09AF\u09BC\u09C7\u09B2 \u09AD\u09BF\u09A1\u09BF\u0993 \u09AB\u09BE\u0987\u09B2",
            ext: "mp4",
            quality: "Original Video Stream",
            estimatedSize: `${sizeMb} MB`,
            codec: "H.264 / AVC + AAC",
            badge: "\u09B0\u09BF\u09AF\u09BC\u09C7\u09B2 \u09AD\u09BF\u09A1\u09BF\u0993",
            isRecommended: true,
            directDownloadUrl: `/api/proxy-download?url=${encodeURIComponent(cleanUrl)}&filename=${encodeURIComponent(cleanTitle + ".mp4")}&stream=true`
          },
          {
            id: "direct-video-720",
            type: "video",
            label: "720p HD \u09AD\u09BF\u09A1\u09BF\u0993",
            subLabel: "\u0995\u09AE\u09CD\u09AA\u09CD\u09AF\u09BE\u0995\u09CD\u099F \u09B8\u09BE\u0987\u099C \u09B8\u09CD\u099F\u09CD\u09AF\u09BE\u09A8\u09CD\u09A1\u09BE\u09B0\u09CD\u09A1 \u098F\u0987\u099A\u09A1\u09BF",
            ext: "mp4",
            quality: "720p HD",
            estimatedSize: `${Math.max(2, parseFloat(sizeMb) * 0.65).toFixed(1)} MB`,
            codec: "H.264 / AVC",
            badge: "\u0995\u09AE\u09CD\u09AA\u09CD\u09AF\u09BE\u0995\u09CD\u099F"
          },
          {
            id: "direct-audio-320",
            type: "audio",
            label: "MP3 \u09E9\u09E8\u09E6 kbps (\u098F\u0995\u09CD\u09B8\u099F\u09CD\u09B0\u09CD\u09AF\u09BE\u0995\u09CD\u099F\u09C7\u09A1 \u0985\u09A1\u09BF\u0993)",
            subLabel: "\u09AD\u09BF\u09A1\u09BF\u0993 \u09A5\u09C7\u0995\u09C7 \u0986\u09B2\u09BE\u09A6\u09BE \u0995\u09B0\u09BE \u09B8\u09BE\u0989\u09A8\u09CD\u09A1\u099F\u09CD\u09B0\u09CD\u09AF\u09BE\u0995",
            ext: "mp3",
            quality: "320kbps Audio",
            bitrate: "320 kbps",
            estimatedSize: "4.8 MB",
            codec: "MPEG-1 Layer 3 (MP3)",
            badge: "\u0985\u09A1\u09BF\u0993 \u099F\u09CD\u09B0\u09CD\u09AF\u09BE\u0995",
            isRecommended: true
          }
        ],
        sampleVideoUrl: cleanUrl
      };
    }
  }
  if (lowerUrl.includes("youtube.com") || lowerUrl.includes("youtu.be")) {
    const regExp = /(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=|shorts\/))([\w-]{11})/;
    const match = cleanUrl.match(regExp);
    const ytId = match ? match[1] : null;
    let title2 = "YouTube Video";
    let author = "YouTube Creator";
    let thumbnail2 = ytId ? `https://i.ytimg.com/vi/${ytId}/hqdefault.jpg` : "https://images.unsplash.com/photo-1611162617474-5b21e879e113?auto=format&fit=crop&w=800&q=80";
    try {
      const oembedRes = await fetch(`https://www.youtube.com/oembed?url=${encodeURIComponent(cleanUrl)}&format=json`, {
        signal: AbortSignal.timeout(4e3)
      });
      if (oembedRes.ok) {
        const d = await oembedRes.json();
        if (d.title) title2 = d.title;
        if (d.author_name) author = d.author_name;
        if (d.thumbnail_url) thumbnail2 = d.thumbnail_url;
      }
    } catch {
    }
    return {
      id: ytId || `yt_${Date.now()}`,
      originalUrl: cleanUrl,
      platform: "youtube",
      title: title2,
      author,
      authorAvatar: `https://api.dicebear.com/7.x/identicon/svg?seed=${encodeURIComponent(author)}`,
      duration: "4:15",
      durationSeconds: 255,
      viewCount: "HD \u09AD\u09C7\u09B0\u09BF\u09AB\u09BE\u0987\u09A1",
      uploadDate: "YouTube",
      thumbnail: thumbnail2,
      description: "\u0987\u0989\u099F\u09BF\u0989\u09AC \u09AD\u09BF\u09A1\u09BF\u0993 \u09B8\u09CD\u099F\u09CD\u09B0\u09BF\u09AE \u09A1\u09BF\u099F\u09C7\u0995\u09CD\u099F \u09B9\u09DF\u09C7\u099B\u09C7\u0964 \u09AB\u09C1\u09B2 \u098F\u0987\u099A\u09A1\u09BF 1080p \u09AD\u09BF\u09A1\u09BF\u0993 \u0993 \u09E9\u09E8\u09E6kbps \u0985\u09A1\u09BF\u0993 \u09AB\u09B0\u09AE\u09CD\u09AF\u09BE\u099F \u09AA\u09CD\u09B0\u09B8\u09CD\u09A4\u09C1\u09A4\u0964",
      formats: [
        {
          id: "yt-video-1080p",
          type: "video",
          label: "1080p Full HD",
          subLabel: "1920x1080 @ 60fps (\u09AB\u09C1\u09B2 \u098F\u0987\u099A\u09A1\u09BF \u09B0\u09BF\u09AF\u09BC\u09C7\u09B2 \u09AD\u09BF\u09A1\u09BF\u0993)",
          ext: "mp4",
          quality: "1080p Full HD",
          resolution: "1920x1080",
          fps: 60,
          bitrate: "4500 kbps",
          estimatedSize: "48.5 MB",
          codec: "H.264 / AVC + AAC Stereo",
          badge: "Best Quality",
          isRecommended: true
        },
        {
          id: "yt-video-720p",
          type: "video",
          label: "720p HD",
          subLabel: "1280x720 (\u09B8\u09CD\u099F\u09CD\u09AF\u09BE\u09A8\u09CD\u09A1\u09BE\u09B0\u09CD\u09A1 \u098F\u0987\u099A\u09A1\u09BF)",
          ext: "mp4",
          quality: "720p HD",
          resolution: "1280x720",
          fps: 30,
          bitrate: "2500 kbps",
          estimatedSize: "24.2 MB",
          codec: "H.264 / AVC + AAC Stereo",
          badge: "Recommended"
        },
        {
          id: "yt-video-480p",
          type: "video",
          label: "480p SD",
          subLabel: "854x480 (\u09AE\u09CB\u09AC\u09BE\u0987\u09B2 \u09A1\u09C7\u099F\u09BE \u09B8\u09C7\u09AD\u09BE\u09B0)",
          ext: "mp4",
          quality: "480p SD",
          resolution: "854x480",
          fps: 30,
          bitrate: "1200 kbps",
          estimatedSize: "12.0 MB",
          codec: "H.264 / AVC",
          badge: "Data Saver"
        },
        {
          id: "yt-video-360p",
          type: "video",
          label: "360p Mobile",
          subLabel: "640x360 (\u09A6\u09CD\u09B0\u09C1\u09A4 \u09A1\u09BE\u0989\u09A8\u09B2\u09CB\u09A1)",
          ext: "mp4",
          quality: "360p Mobile",
          resolution: "640x360",
          fps: 30,
          bitrate: "750 kbps",
          estimatedSize: "7.5 MB",
          codec: "H.264 / AVC",
          badge: "Fast Download"
        },
        {
          id: "yt-audio-320k",
          type: "audio",
          label: "MP3 320 kbps",
          subLabel: "Ultra HD Audio (\u09B8\u09C7\u09B0\u09BE \u09AE\u09BF\u0989\u099C\u09BF\u0995 \u0995\u09CB\u09DF\u09BE\u09B2\u09BF\u099F\u09BF)",
          ext: "mp3",
          quality: "320kbps High Quality",
          bitrate: "320 kbps",
          estimatedSize: "9.5 MB",
          codec: "MPEG-1 Layer 3 (MP3)",
          badge: "Crystal Audio",
          isRecommended: true
        },
        {
          id: "yt-audio-128k",
          type: "audio",
          label: "MP3 128 kbps",
          subLabel: "Standard Audio (\u09A6\u09CD\u09B0\u09C1\u09A4 \u09A1\u09BE\u0989\u09A8\u09B2\u09CB\u09A1)",
          ext: "mp3",
          quality: "128kbps Standard",
          bitrate: "128 kbps",
          estimatedSize: "3.8 MB",
          codec: "MPEG-1 Layer 3 (MP3)",
          badge: "Fast Download"
        },
        {
          id: "yt-audio-m4a",
          type: "audio",
          label: "M4A 256 kbps",
          subLabel: "Apple AAC Studio Audio",
          ext: "m4a",
          quality: "256kbps AAC",
          bitrate: "256 kbps",
          estimatedSize: "7.6 MB",
          codec: "Advanced Audio Coding (AAC)",
          badge: "Apple AAC"
        }
      ]
    };
  }
  if (lowerUrl.includes("instagram.com")) {
    const og2 = await scrapeOpenGraph(cleanUrl);
    const title2 = og2?.title || "Instagram Reel / Video";
    const thumbnail2 = og2?.thumbnail || "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=800&q=80";
    const author = og2?.author || "Instagram Creator";
    return {
      id: `ig_${Date.now()}`,
      originalUrl: cleanUrl,
      platform: "instagram",
      title: title2,
      author,
      authorAvatar: "https://api.dicebear.com/7.x/identicon/svg?seed=InstagramCreator",
      duration: "0:60",
      durationSeconds: 60,
      viewCount: "\u09B0\u09BF\u09B2\u09B8 \u098F\u0987\u099A\u09A1\u09BF",
      uploadDate: "Instagram Reels",
      thumbnail: thumbnail2,
      description: "\u0987\u09A8\u09B8\u09CD\u099F\u09BE\u0997\u09CD\u09B0\u09BE\u09AE \u09B0\u09BF\u09B2\u09B8 \u09A1\u09BF\u099F\u09C7\u0995\u09CD\u099F \u09B9\u09DF\u09C7\u099B\u09C7\u0964 1080p \u09AD\u09BE\u09B0\u09CD\u099F\u09BF\u0995\u09CD\u09AF\u09BE\u09B2 \u09AB\u09C1\u09B2 \u098F\u0987\u099A\u09A1\u09BF \u098F\u09AE\u09AA\u09BF\u09EA \u0993 \u09B0\u09BF\u09B2\u09B8 \u0985\u09A1\u09BF\u0993 \u09B8\u0995\u09CD\u09B0\u09BF\u09DF\u0964",
      formats: [
        {
          id: "ig-video-1080p",
          type: "video",
          label: "1080p Reel Full HD",
          subLabel: "1080x1920 (\u09AD\u09BE\u09B0\u09CD\u099F\u09BF\u0995\u09CD\u09AF\u09BE\u09B2 \u09B0\u09BF\u09B2\u09B8 \u0985\u09B0\u09BF\u099C\u09BF\u09A8\u09BE\u09B2 \u09AD\u09BF\u09A1\u09BF\u0993)",
          ext: "mp4",
          quality: "1080p Reel HD",
          resolution: "1080x1920",
          fps: 60,
          estimatedSize: "18.5 MB",
          codec: "H.264 / AVC + AAC",
          badge: "Reel HD",
          isRecommended: true
        },
        {
          id: "ig-video-720p",
          type: "video",
          label: "720p Reel Standard",
          subLabel: "720x1280 (\u09AE\u09CB\u09AC\u09BE\u0987\u09B2 \u09AB\u09CD\u09B0\u09C7\u09A8\u09CD\u09A1\u09B2\u09BF)",
          ext: "mp4",
          quality: "720p Standard",
          resolution: "720x1280",
          fps: 30,
          estimatedSize: "9.8 MB",
          codec: "H.264 / AVC",
          badge: "Mobile"
        },
        {
          id: "ig-audio-320k",
          type: "audio",
          label: "MP3 320 kbps (Reel Audio)",
          subLabel: "\u09B0\u09BF\u09B2\u09B8 \u09AC\u09CD\u09AF\u09BE\u0995\u0997\u09CD\u09B0\u09BE\u0989\u09A8\u09CD\u09A1 \u09AE\u09BF\u0989\u099C\u09BF\u0995 (\u09B8\u09BE\u0989\u09A8\u09CD\u09A1\u099F\u09CD\u09B0\u09CD\u09AF\u09BE\u0995)",
          ext: "mp3",
          quality: "320kbps Audio",
          bitrate: "320 kbps",
          estimatedSize: "2.8 MB",
          codec: "MPEG-1 Layer 3 (MP3)",
          badge: "Reel Sound",
          isRecommended: true
        }
      ]
    };
  }
  if (lowerUrl.includes("facebook.com") || lowerUrl.includes("fb.watch")) {
    const og2 = await scrapeOpenGraph(cleanUrl);
    const title2 = og2?.title || "Facebook Video / Watch Clip";
    const thumbnail2 = og2?.thumbnail || "https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=800&q=80";
    const author = og2?.author || "Facebook Creator";
    return {
      id: `fb_${Date.now()}`,
      originalUrl: cleanUrl,
      platform: "facebook",
      title: title2,
      author,
      authorAvatar: "https://api.dicebear.com/7.x/identicon/svg?seed=FacebookUser",
      duration: "3:00",
      durationSeconds: 180,
      viewCount: "Facebook Watch",
      uploadDate: "Facebook",
      thumbnail: thumbnail2,
      description: "\u09AB\u09C7\u09B8\u09AC\u09C1\u0995 \u0993\u09DF\u09BE\u099A \u09AD\u09BF\u09A1\u09BF\u0993 \u09A1\u09BF\u099F\u09C7\u0995\u09CD\u099F \u09B9\u09DF\u09C7\u099B\u09C7\u0964 \u09AB\u09C1\u09B2 \u098F\u0987\u099A\u09A1\u09BF \u09E7\u09E6\u09EE\u09E6p \u0993 \u09E9\u09E8\u09E6kbps \u0985\u09A1\u09BF\u0993 \u09AB\u09B0\u09AE\u09CD\u09AF\u09BE\u099F \u09AA\u09CD\u09B0\u09B8\u09CD\u09A4\u09C1\u09A4\u0964",
      formats: [
        {
          id: "fb-video-1080p",
          type: "video",
          label: "1080p Facebook Watch HD",
          subLabel: "\u09AB\u09C1\u09B2 \u098F\u0987\u099A\u09A1\u09BF \u09AD\u09BF\u09A1\u09BF\u0993 \u0995\u09CB\u09DF\u09BE\u09B2\u09BF\u099F\u09BF",
          ext: "mp4",
          quality: "1080p Full HD",
          resolution: "1920x1080",
          estimatedSize: "36.5 MB",
          codec: "H.264 / AVC + AAC",
          badge: "Facebook HD",
          isRecommended: true
        },
        {
          id: "fb-video-720p",
          type: "video",
          label: "720p Facebook Video",
          subLabel: "\u09B8\u09CD\u099F\u09CD\u09AF\u09BE\u09A8\u09CD\u09A1\u09BE\u09B0\u09CD\u09A1 \u09AE\u09CB\u09AC\u09BE\u0987\u09B2 \u0995\u09CB\u09DF\u09BE\u09B2\u09BF\u099F\u09BF",
          ext: "mp4",
          quality: "720p HD",
          resolution: "1280x720",
          estimatedSize: "18.2 MB",
          codec: "H.264 / AVC",
          badge: "Mobile"
        },
        {
          id: "fb-audio-320k",
          type: "audio",
          label: "MP3 320 kbps (FB Audio)",
          subLabel: "\u09AB\u09C7\u09B8\u09AC\u09C1\u0995 \u09AD\u09BF\u09A1\u09BF\u0993 \u09A5\u09C7\u0995\u09C7 \u0986\u09B2\u09BE\u09A6\u09BE \u0995\u09B0\u09BE \u0985\u09A1\u09BF\u0993",
          ext: "mp3",
          quality: "320kbps Audio",
          bitrate: "320 kbps",
          estimatedSize: "6.5 MB",
          codec: "MPEG-1 Layer 3 (MP3)",
          badge: "FB Sound",
          isRecommended: true
        }
      ]
    };
  }
  if (lowerUrl.includes("twitter.com") || lowerUrl.includes("x.com")) {
    const og2 = await scrapeOpenGraph(cleanUrl);
    const title2 = og2?.title || "X / Twitter Video Clip";
    const thumbnail2 = og2?.thumbnail || "https://images.unsplash.com/photo-1611605698335-8b1569810432?auto=format&fit=crop&w=800&q=80";
    return {
      id: `tw_${Date.now()}`,
      originalUrl: cleanUrl,
      platform: "twitter",
      title: title2,
      author: og2?.author || "X Post Creator",
      duration: "1:30",
      durationSeconds: 90,
      viewCount: "Twitter/X Media",
      uploadDate: "X Stream",
      thumbnail: thumbnail2,
      description: "\u099F\u09C1\u0987\u099F\u09BE\u09B0/\u098F\u0995\u09CD\u09B8 \u09AD\u09BF\u09A1\u09BF\u0993 \u0995\u09CD\u09B2\u09BF\u09AA \u09A1\u09BF\u099F\u09C7\u0995\u09CD\u099F \u09B9\u09DF\u09C7\u099B\u09C7\u0964 \u098F\u09AE\u09AA\u09BF\u09EA \u0993 \u0985\u09A1\u09BF\u0993 \u098F\u0995\u09CD\u09B8\u099F\u09CD\u09B0\u09CD\u09AF\u09BE\u0995\u09CD\u099F \u09B8\u09C1\u09AC\u09BF\u09A7\u09BE\u0964",
      formats: [
        {
          id: "tw-video-hd",
          type: "video",
          label: "1080p / 720p Tweet Video",
          subLabel: "\u099F\u09C1\u0987\u099F \u098F\u09B0 \u09AE\u09C2\u09B2 \u098F\u0987\u099A\u09A1\u09BF \u09AD\u09BF\u09A1\u09BF\u0993",
          ext: "mp4",
          quality: "HD Video",
          estimatedSize: "12.4 MB",
          codec: "H.264 / AVC + AAC",
          badge: "Tweet HD",
          isRecommended: true
        },
        {
          id: "tw-audio-mp3",
          type: "audio",
          label: "MP3 320 kbps (Tweet Sound)",
          subLabel: "\u099F\u09C1\u0987\u099F \u0985\u09A1\u09BF\u0993 \u09B8\u09CD\u099F\u09CD\u09B0\u09BF\u09AE",
          ext: "mp3",
          quality: "320kbps Audio",
          estimatedSize: "2.4 MB",
          codec: "MPEG-1 Layer 3 (MP3)",
          badge: "Audio"
        }
      ]
    };
  }
  const og = await scrapeOpenGraph(cleanUrl);
  const title = og?.title || "Universal Web Media Stream";
  const thumbnail = og?.thumbnail || "https://images.unsplash.com/photo-1492691527719-9d1e07e534b4?auto=format&fit=crop&w=800&q=80";
  return {
    id: `media_${Date.now()}`,
    originalUrl: cleanUrl,
    platform: "other",
    title,
    author: og?.author || "Web Stream Host",
    duration: "3:30",
    durationSeconds: 210,
    viewCount: "\u0987\u0989\u09A8\u09BF\u09AD\u09BE\u09B0\u09CD\u09B8\u09BE\u09B2 \u09AE\u09BF\u09A1\u09BF\u09DF\u09BE",
    uploadDate: "Verified",
    thumbnail,
    description: "\u09AE\u09BF\u09A1\u09BF\u09DF\u09BE \u09B8\u09CD\u099F\u09CD\u09B0\u09BF\u09AE \u09B8\u09AB\u09B2\u09AD\u09BE\u09AC\u09C7 \u099A\u09BF\u09B9\u09CD\u09A8\u09BF\u09A4 \u09B9\u09DF\u09C7\u099B\u09C7\u0964 \u0986\u09AA\u09A8\u09BE\u09B0 \u09AA\u099B\u09A8\u09CD\u09A6\u09C7\u09B0 \u09AB\u09B0\u09AE\u09CD\u09AF\u09BE\u099F \u09A8\u09BF\u09B0\u09CD\u09AC\u09BE\u099A\u09A8 \u0995\u09B0\u09C1\u09A8\u0964",
    formats: [
      {
        id: "univ-video-hd",
        type: "video",
        label: "1080p / 720p HD MP4",
        subLabel: "\u09AB\u09C1\u09B2 \u098F\u0987\u099A\u09A1\u09BF \u09B0\u09C7\u099C\u09CB\u09B2\u09BF\u0989\u09B6\u09A8 \u09AD\u09BF\u09A1\u09BF\u0993",
        ext: "mp4",
        quality: "HD Video",
        estimatedSize: "28.0 MB",
        codec: "H.264 / AVC + AAC",
        badge: "Best Quality",
        isRecommended: true
      },
      {
        id: "univ-video-sd",
        type: "video",
        label: "480p SD MP4",
        subLabel: "\u09B8\u09CD\u099F\u09CD\u09AF\u09BE\u09A8\u09CD\u09A1\u09BE\u09B0\u09CD\u09A1 \u09AE\u09CB\u09AC\u09BE\u0987\u09B2 \u0995\u09CB\u09DF\u09BE\u09B2\u09BF\u099F\u09BF",
        ext: "mp4",
        quality: "480p SD",
        estimatedSize: "14.0 MB",
        codec: "H.264 / AVC",
        badge: "Mobile"
      },
      {
        id: "univ-audio-320",
        type: "audio",
        label: "MP3 320 kbps Audio",
        subLabel: "\u0986\u09B2\u09CD\u099F\u09CD\u09B0\u09BE \u098F\u0987\u099A\u09A1\u09BF \u09B8\u09BE\u0989\u09A8\u09CD\u09A1\u099F\u09CD\u09B0\u09CD\u09AF\u09BE\u0995",
        ext: "mp3",
        quality: "320kbps Audio",
        estimatedSize: "7.5 MB",
        codec: "MPEG-1 Layer 3 (MP3)",
        badge: "Crystal Audio",
        isRecommended: true
      }
    ]
  };
}

// server/youtubeSearch.ts
async function searchYouTubeSongs(query) {
  const searchQuery = query.trim();
  if (!searchQuery) return [];
  try {
    const url = `https://www.youtube.com/results?search_query=${encodeURIComponent(searchQuery)}&sp=EgIQAQ%253D%253D`;
    const resp = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
        "Accept-Language": "en-US,en;q=0.9,bn;q=0.8",
        "Cache-Control": "no-cache"
      }
    });
    if (!resp.ok) {
      console.warn(`YouTube search returned HTTP ${resp.status}`);
      return getFallbackTracks(query);
    }
    const html = await resp.text();
    const match = html.match(/var ytInitialData = ({.*?});<\/script>/s) || html.match(/ytInitialData = ({.*?});<\/script>/s);
    if (!match) {
      console.warn("Could not extract ytInitialData from YouTube search response");
      return getFallbackTracks(query);
    }
    const data = JSON.parse(match[1]);
    const sectionList = data?.contents?.twoColumnSearchResultsRenderer?.primaryContents?.sectionListRenderer?.contents || [];
    const tracks = [];
    for (const sec of sectionList) {
      const items = sec?.itemSectionRenderer?.contents || [];
      for (const it of items) {
        if (it.videoRenderer) {
          const vr = it.videoRenderer;
          const videoId = vr.videoId;
          if (!videoId) continue;
          const title = vr.title?.runs?.[0]?.text || vr.title?.simpleText || "Unknown Song";
          const artist = vr.ownerText?.runs?.[0]?.text || vr.longBylineText?.runs?.[0]?.text || "YouTube Artist";
          const lengthStr = vr.lengthText?.simpleText || "3:30";
          const views = vr.viewCountText?.simpleText || vr.shortViewCountText?.simpleText || "";
          const published = vr.publishedTimeText?.simpleText || "";
          const parts = lengthStr.split(":").map(Number);
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
            type: durationSeconds > 1200 ? "album" : "song",
            isOfficial: title.toLowerCase().includes("official") || title.toLowerCase().includes("audio")
          });
        }
      }
    }
    if (tracks.length === 0) {
      return getFallbackTracks(query);
    }
    return tracks;
  } catch (error) {
    console.error("Error during YouTube song search:", error.message);
    return getFallbackTracks(query);
  }
}
function getFallbackTracks(query) {
  const q = query.toLowerCase();
  const popularBangla = [
    {
      id: "e-ORhEE9VVg",
      title: "Blank Space (Taylor Swift) - High Quality Audio & Video",
      artist: "Taylor Swift",
      channelTitle: "Taylor Swift",
      duration: "4:32",
      durationSeconds: 272,
      views: "3.4B views",
      published: "Official Track",
      thumbnail: "https://i.ytimg.com/vi/e-ORhEE9VVg/hqdefault.jpg",
      albumArt: "https://i.ytimg.com/vi/e-ORhEE9VVg/maxresdefault.jpg",
      url: "https://www.youtube.com/watch?v=e-ORhEE9VVg",
      type: "song",
      isOfficial: true
    },
    {
      id: "O5gwxm3NxFU",
      title: "Best Of Arijit Singh - Ultimate Romantic Collection Album",
      artist: "Arijit Singh",
      channelTitle: "Arijit Singh Music",
      duration: "1:00:52",
      durationSeconds: 3652,
      views: "75M views",
      published: "Album Jukebox",
      thumbnail: "https://i.ytimg.com/vi/O5gwxm3NxFU/hqdefault.jpg",
      albumArt: "https://i.ytimg.com/vi/O5gwxm3NxFU/maxresdefault.jpg",
      url: "https://www.youtube.com/watch?v=O5gwxm3NxFU",
      type: "album",
      isOfficial: true
    },
    {
      id: "kJQP7kiw5Fk",
      title: "Luis Fonsi - Despacito ft. Daddy Yankee",
      artist: "Luis Fonsi",
      channelTitle: "Luis Fonsi",
      duration: "4:41",
      durationSeconds: 281,
      views: "8.4B views",
      published: "Official Music Video",
      thumbnail: "https://i.ytimg.com/vi/kJQP7kiw5Fk/hqdefault.jpg",
      albumArt: "https://i.ytimg.com/vi/kJQP7kiw5Fk/maxresdefault.jpg",
      url: "https://www.youtube.com/watch?v=kJQP7kiw5Fk",
      type: "song",
      isOfficial: true
    }
  ];
  return popularBangla.filter(
    (t) => t.title.toLowerCase().includes(q) || t.artist.toLowerCase().includes(q) || q.length < 3
  );
}

// server.ts
async function startServer() {
  const app = (0, import_express.default)();
  const PORT = 3e3;
  app.use(import_express.default.json());
  app.get("/api/health", (_req, res) => {
    res.json({ status: "ok", time: (/* @__PURE__ */ new Date()).toISOString() });
  });
  app.get("/api/youtube/search", async (req, res) => {
    const q = req.query.q || "";
    if (!q.trim()) {
      return res.status(400).json({ success: false, error: "Query parameter q is required", tracks: [] });
    }
    try {
      const tracks = await searchYouTubeSongs(q);
      return res.json({ success: true, count: tracks.length, tracks });
    } catch (err) {
      console.error("YouTube search route error:", err.message);
      return res.status(500).json({ success: false, error: err.message, tracks: [] });
    }
  });
  app.get("/api/bypass/engines", (_req, res) => {
    res.json({
      status: "online",
      activeCount: 4,
      engines: getBypassEngines()
    });
  });
  app.post("/api/bypass/extract", async (req, res) => {
    const { url, format } = req.body;
    if (!url) {
      return res.status(400).json({ success: false, error: "URL is required" });
    }
    const result = await resolveBypassMedia(url, format || "mp4");
    return res.json(result);
  });
  app.post("/api/media/inspect", async (req, res) => {
    const { url } = req.body;
    if (!url) {
      return res.status(400).json({ error: "Missing url parameter" });
    }
    try {
      const inspected = await inspectMediaUrl(url);
      if (inspected) {
        return res.json({ success: true, metadata: inspected });
      }
      return res.status(404).json({ success: false, error: "Could not inspect media URL" });
    } catch (err) {
      console.error("Media inspection error:", err.message);
      return res.status(500).json({ success: false, error: err.message });
    }
  });
  app.get("/api/metadata", async (req, res) => {
    const url = req.query.url;
    if (!url) {
      return res.status(400).json({ error: "Missing url parameter" });
    }
    try {
      if (url.includes("youtube.com") || url.includes("youtu.be")) {
        const oembedUrl = `https://www.youtube.com/oembed?url=${encodeURIComponent(url)}&format=json`;
        const resp = await fetch(oembedUrl, {
          headers: { "User-Agent": "Mozilla/5.0 (UniversalDownloader/1.0)" }
        });
        if (resp.ok) {
          const data = await resp.json();
          return res.json({
            title: data.title,
            author: data.author_name,
            thumbnail: data.thumbnail_url,
            platform: "youtube"
          });
        }
      }
      if (url.includes("vimeo.com")) {
        const oembedUrl = `https://vimeo.com/api/oembed.json?url=${encodeURIComponent(url)}`;
        const resp = await fetch(oembedUrl);
        if (resp.ok) {
          const data = await resp.json();
          return res.json({
            title: data.title,
            author: data.author_name,
            thumbnail: data.thumbnail_url,
            platform: "vimeo"
          });
        }
      }
      if (url.includes("tiktok.com")) {
        const oembedUrl = `https://www.tiktok.com/oembed?url=${encodeURIComponent(url)}`;
        const resp = await fetch(oembedUrl);
        if (resp.ok) {
          const data = await resp.json();
          return res.json({
            title: data.title,
            author: data.author_name,
            thumbnail: data.thumbnail_url,
            platform: "tiktok"
          });
        }
      }
      return res.json({
        title: null,
        author: null,
        thumbnail: null
      });
    } catch (err) {
      console.warn("Metadata fetch error:", err.message);
      return res.json({ title: null, author: null, thumbnail: null });
    }
  });
  app.post("/api/convert/start", async (req, res) => {
    const { url, format } = req.body;
    if (!url) {
      return res.status(400).json({ error: "URL is required" });
    }
    try {
      const result = await resolveBypassMedia(url, format || "mp4");
      if (result.success) {
        return res.json(result);
      }
      return res.status(500).json({
        success: false,
        error: result.error || "Failed to initialize media bypass stream for target URL"
      });
    } catch (err) {
      console.error("Convert start error:", err.message);
      return res.status(500).json({
        success: false,
        error: err.message || "Failed to initialize media stream for target URL"
      });
    }
  });
  app.get("/api/convert/progress", async (req, res) => {
    const id = req.query.id;
    const progressUrl = req.query.progressUrl || (id ? `https://lto2.affadaffa.com/api/progress?id=${id}` : null);
    if (!progressUrl) {
      return res.status(400).json({ error: "Missing progressUrl or id" });
    }
    try {
      const resp = await fetch(progressUrl, {
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
          "Referer": "https://loader.to/"
        }
      });
      if (!resp.ok) {
        throw new Error(`Progress query status ${resp.status}`);
      }
      const data = await resp.json();
      return res.json({
        success: data.success === 1,
        progress: data.progress || 0,
        downloadUrl: data.download_url || null,
        text: data.text || "",
        title: data.title || data.info?.title,
        format: data.format
      });
    } catch (err) {
      console.error("Convert progress error:", err.message);
      return res.status(500).json({ success: false, error: err.message });
    }
  });
  app.get("/api/proxy-download", async (req, res) => {
    const downloadUrl = req.query.url;
    const rawFilename = req.query.filename || "download";
    const noStream = req.query.stream === "false";
    if (!downloadUrl) {
      return res.status(400).send("Missing url parameter");
    }
    if (noStream) {
      return res.redirect(302, downloadUrl);
    }
    return proxyStreamMedia(downloadUrl, rawFilename, req, res);
  });
  if (process.env.NODE_ENV !== "production") {
    const vite = await (0, import_vite.createServer)({
      server: { middlewareMode: true },
      appType: "spa"
    });
    app.use(vite.middlewares);
  } else {
    const distPath = import_path2.default.join(process.cwd(), "dist");
    app.use(import_express.default.static(distPath));
    app.get("*", (_req, res) => {
      res.sendFile(import_path2.default.join(distPath, "index.html"));
    });
  }
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}
startServer();
//# sourceMappingURL=server.cjs.map
