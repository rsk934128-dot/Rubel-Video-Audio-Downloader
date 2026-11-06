import React, { useState } from 'react';
import { Language } from '../types';
import { getTranslation } from '../utils/translations';
import { 
  Code, 
  Copy, 
  Check, 
  Smartphone, 
  Server, 
  ShieldAlert, 
  Layers, 
  ExternalLink, 
  Terminal, 
  FileText 
} from 'lucide-react';

interface Props {
  language: Language;
  onOpenPWAGuide?: () => void;
}

export const CodeBlueprintModal: React.FC<Props> = ({ language, onOpenPWAGuide }) => {
  const t = getTranslation(language);
  const [activeTab, setActiveTab] = useState<'android' | 'flutter' | 'node' | 'python' | 'policy'>('android');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const codeSnippets = {
    android: `<!-- 1. AndroidManifest.xml: Receive Share Intent from YouTube / Instagram / Facebook -->
<manifest xmlns:android="http://schemas.android.com/apk/res/android"
    package="com.example.videodownloader">

    <uses-permission android:name="android.permission.INTERNET" />
    <uses-permission android:name="android.permission.WRITE_EXTERNAL_STORAGE" />
    <uses-permission android:name="android.permission.READ_EXTERNAL_STORAGE" />

    <application
        android:label="Video Downloader"
        android:icon="@mipmap/ic_launcher">

        <activity
            android:name=".MainActivity"
            android:exported="true"
            android:launchMode="singleTask">
            
            <intent-filter>
                <action android:name="android.intent.action.MAIN" />
                <category android:name="android.intent.category.LAUNCHER" />
            </intent-filter>

            <!-- ✨ ইউজার যখন ইউটিউবে 'Share' চাপবে, এই অ্যাপটি শেয়ার অপশনে শো করবে -->
            <intent-filter>
                <action android:name="android.intent.action.SEND" />
                <category android:name="android.intent.category.DEFAULT" />
                <data android:mimeType="text/plain" />
            </intent-filter>

        </activity>
    </application>
</manifest>`,

    flutter: `// 2. Flutter Implementation: Listen to incoming Share Intent & download
import 'package:flutter/material.dart';
import 'package:receive_sharing_intent/receive_sharing_intent.dart';
import 'package:flutter_downloader/flutter_downloader.dart';
import 'package:path_provider/path_provider.dart';

class DownloaderScreen extends StatefulWidget {
  @override
  _DownloaderScreenState createState() => _DownloaderScreenState();
}

class _DownloaderScreenState extends State<DownloaderScreen> {
  String? sharedUrl;

  @override
  void initState() {
    super.initState();
    // অ্যাপ রানিং অবস্থায় শেয়ার রিসিভ করা
    ReceiveSharingIntent.instance.getMediaStream().listen((value) {
      if (value.isNotEmpty) {
        _handleIncomingUrl(value.first.path);
      }
    });

    // অ্যাপ বন্ধ থেকে শেয়ার চাপলে ওপেন হওয়া
    ReceiveSharingIntent.instance.getInitialMedia().then((value) {
      if (value.isNotEmpty) {
        _handleIncomingUrl(value.first.path);
      }
    });
  }

  void _handleIncomingUrl(String text) {
    setState(() {
      sharedUrl = text;
    });
    // ব্যাকএন্ড এপিআই কল করে ফরম্যাট আনা
    fetchVideoFormats(text);
  }

  // ডাউনলোড শুরু করার ফাংশন
  Future<void> startDownload(String downloadUrl, String filename) async {
    final dir = await getExternalStorageDirectory();
    await FlutterDownloader.enqueue(
      url: downloadUrl,
      savedDir: dir!.path,
      fileName: filename,
      showNotification: true,
      openFileFromNotification: true,
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: Text('ভিডিও ডাউনলোডার')),
      body: Center(
        child: Text(sharedUrl ?? 'কোনো লিঙ্ক শেয়ার করা হয়নি'),
      ),
    );
  }
}`,

    node: `// 3. Node.js Express + yt-dlp Backend (youtube-dl-exec)
const express = require('express');
const youtubedl = require('youtube-dl-exec');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

// ১. ভিডিও ইনফো ও ফরম্যাট লিস্ট আনা
app.post('/api/info', async (req, res) => {
  const { url } = req.body;
  try {
    const info = await youtubedl(url, {
      dumpSingleJson: true,
      noWarnings: true,
      noCallHome: true,
      preferFreeFormats: true,
      youtubeSkipDashManifest: true,
    });

    // ফিল্টার করে MP3 এবং MP4 720p / 1080p লিস্ট সাজানো
    const formats = [
      { id: 'mp3-320', label: 'MP3 320 kbps', type: 'audio', ext: 'mp3' },
      { id: 'mp4-720p', label: '720p HD', type: 'video', ext: 'mp4' },
      { id: 'mp4-1080p', label: '1080p Full HD', type: 'video', ext: 'mp4' }
    ];

    res.json({
      title: info.title,
      thumbnail: info.thumbnail,
      duration: info.duration_string,
      formats: formats
    });
  } catch (error) {
    res.status(500).json({ error: 'ভিডিও তথ্য পাওয়া যায়নি', details: error.message });
  }
});

// ২. সরাসরি স্ট্রিমিং ডাউনলোড
app.get('/api/download', (req, res) => {
  const { url, format } = req.query;
  const isAudio = format === 'mp3';

  res.header('Content-Disposition', \`attachment; filename="video.\${isAudio ? 'mp3' : 'mp4'}"\`);

  const subprocess = youtubedl.exec(url, {
    output: '-',
    format: isAudio ? 'bestaudio' : 'bestvideo[ext=mp4]+bestaudio[ext=m4a]/best[ext=mp4]/best',
    extractAudio: isAudio,
    audioFormat: isAudio ? 'mp3' : undefined,
  });

  subprocess.stdout.pipe(res);
});

app.listen(5000, () => console.log('Downloader Server running on port 5000'));`,

    python: `# 4. Python FastAPI + yt_dlp Backend
from fastapi import FastAPI, HTTPException
from fastapi.responses import StreamingResponse
import yt_dlp
import io

app = FastAPI(title="Universal Video Downloader Core")

@app.post("/api/extract")
def extract_formats(data: dict):
    url = data.get("url")
    if not url:
        raise HTTPException(status_code=400, detail="URL প্রদান করুন")

    ydl_opts = {
        'quiet': True,
        'skip_download': True,
    }

    try:
        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            info = ydl.extract_info(url, download=False)
            return {
                "title": info.get("title"),
                "thumbnail": info.get("thumbnail"),
                "duration": info.get("duration"),
                "channel": info.get("uploader"),
                "formats": [
                    {"id": "mp3-320", "type": "audio", "quality": "320kbps", "ext": "mp3"},
                    {"id": "mp4-720p", "type": "video", "quality": "720p HD", "ext": "mp4"},
                    {"id": "mp4-1080p", "type": "video", "quality": "1080p Full HD", "ext": "mp4"}
                ]
            }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)`,

    policy: `📋 Google Play Store Policy & Alternative Distribution Guide:

1. ⚠️ Google Play Store নীতি ও সীমাবদ্ধতা:
   - YouTube Terms of Service ধারা ৫.খ অনুযায়ী অফিসিয়াল পারমিশন ছাড়া ভিডিও ডাউনলোড করার টুল প্রদান করা নিষিদ্ধ।
   - Google Play Developer Policy অনুযায়ী এমন অ্যাপ রিলিজ করলে অ্যাপটি "Copyright / IP Infringement" বা "Circumvention" এর জন্য সাসপেন্ড বা ব্যান হতে পারে।

2. ✅ অল্টারনেটিভ ডিস্ট্রিবিউশন পদ্ধতি (Alternative Safe Routes):
   - নিজস্ব ওয়েবসাইট / ল্যান্ডিং পেজে সরাসরি Direct APK ডাউনলোড লিঙ্ক দিন (যেমন Snaptube বা VidMate এর মতো)।
   - থার্ড-পার্টি অ্যাপ স্টোরে পাবলিশ করুন:
     * F-Droid (ওপেন সোর্স অ্যাপের জন্য সেরা)
     * APKPure / APKMirror
     * Samsung Galaxy Store (নিয়মাবলী চেক করে)
     * Xiaomi GetApps
   - প্রোগ্রেসিভ ওয়েব অ্যাপ (PWA):
     * বর্তমান ওয়েব অ্যাপটি সরাসরি মোবাইল ব্রাউজার থেকে "Install App" বা "Add to Home Screen" হিসেবে সেভ করা যায়।
     * এতে ব্যবহারকারী কোনো প্রকার প্লে স্টোর বাধা ছাড়াই সরাসরি অ্যান্ড্রয়েড ডিভাইসে ব্যবহার করতে পারে!

3. 🔒 ব্যাকএন্ড সার্ভার অপটিমাইজেশন:
   - yt-dlp নিয়মিত আপডেট রাখতে হবে: \`pip install -U yt-dlp\` বা \`npm update youtube-dl-exec\` কারণ ইউটিউব সময়ে সময়ে তাদের সাইফার অ্যালগরিদম পরিবর্তন করে।
   - প্রক্সি বা রোটেশন আইপি ব্যবহার করলে সার্ভার রেট লিমিট ব্লক হওয়া থেকে রক্ষা পায়।`,
  };

  return (
    <div className="w-full max-w-4xl mx-auto py-4">
      {/* Title */}
      <div className="mb-6">
        <h2 className="text-xl sm:text-2xl font-bold text-white flex items-center gap-2.5">
          <Code className="w-6 h-6 text-rose-500" />
          <span>{t.blueprintTitle}</span>
        </h2>
        <p className="text-xs sm:text-sm text-slate-400 mt-1">
          {t.blueprintDesc}
        </p>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 mb-4 border-b border-slate-800">
        <button
          onClick={() => setActiveTab('android')}
          className={`px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition flex items-center gap-2 ${
            activeTab === 'android'
              ? 'bg-rose-500 text-white shadow'
              : 'text-slate-400 hover:text-white bg-slate-900 border border-slate-800'
          }`}
        >
          <Smartphone className="w-3.5 h-3.5" />
          <span>Android Manifest (Intent)</span>
        </button>

        <button
          onClick={() => setActiveTab('flutter')}
          className={`px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition flex items-center gap-2 ${
            activeTab === 'flutter'
              ? 'bg-rose-500 text-white shadow'
              : 'text-slate-400 hover:text-white bg-slate-900 border border-slate-800'
          }`}
        >
          <Layers className="w-3.5 h-3.5" />
          <span>Flutter (Share Handler)</span>
        </button>

        <button
          onClick={() => setActiveTab('node')}
          className={`px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition flex items-center gap-2 ${
            activeTab === 'node'
              ? 'bg-rose-500 text-white shadow'
              : 'text-slate-400 hover:text-white bg-slate-900 border border-slate-800'
          }`}
        >
          <Server className="w-3.5 h-3.5" />
          <span>Node.js (yt-dlp)</span>
        </button>

        <button
          onClick={() => setActiveTab('python')}
          className={`px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition flex items-center gap-2 ${
            activeTab === 'python'
              ? 'bg-rose-500 text-white shadow'
              : 'text-slate-400 hover:text-white bg-slate-900 border border-slate-800'
          }`}
        >
          <Terminal className="w-3.5 h-3.5" />
          <span>Python (FastAPI)</span>
        </button>

        <button
          onClick={() => setActiveTab('policy')}
          className={`px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition flex items-center gap-2 ${
            activeTab === 'policy'
              ? 'bg-rose-500 text-white shadow'
              : 'text-slate-400 hover:text-white bg-slate-900 border border-slate-800'
          }`}
        >
          <ShieldAlert className="w-3.5 h-3.5 text-amber-400" />
          <span>Play Store & APK Policy</span>
        </button>

        {onOpenPWAGuide && (
          <button
            onClick={onOpenPWAGuide}
            className="px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition flex items-center gap-2 text-sky-400 hover:text-white bg-sky-500/10 hover:bg-sky-500/20 border border-sky-500/30"
          >
            <Layers className="w-3.5 h-3.5 text-sky-400" />
            <span>PWA share_target Guide ➔</span>
          </button>
        )}
      </div>

      {/* Code Viewer Panel */}
      <div className="relative rounded-2xl bg-slate-950 border border-slate-800 overflow-hidden shadow-2xl">
        <div className="p-3 bg-slate-900/90 border-b border-slate-800 flex items-center justify-between gap-3">
          <span className="text-xs font-mono text-slate-400">
            {activeTab === 'android' && 'android/app/src/main/AndroidManifest.xml'}
            {activeTab === 'flutter' && 'lib/screens/downloader_screen.dart'}
            {activeTab === 'node' && 'server.js (Express + youtube-dl-exec)'}
            {activeTab === 'python' && 'backend/main.py (FastAPI + yt_dlp)'}
            {activeTab === 'policy' && 'LEGAL_AND_DISTRIBUTION_GUIDE.md'}
          </span>

          <button
            onClick={() => copyToClipboard(codeSnippets[activeTab], activeTab)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium border border-slate-700 transition"
          >
            {copiedId === activeTab ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-emerald-400">Copied!</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5 text-slate-400" />
                <span>{language === 'bn' ? 'কোড কপি করুন' : 'Copy Code'}</span>
              </>
            )}
          </button>
        </div>

        <pre className="p-4 sm:p-6 text-xs sm:text-sm font-mono text-slate-200 overflow-x-auto leading-relaxed max-h-[500px]">
          <code>{codeSnippets[activeTab]}</code>
        </pre>
      </div>
    </div>
  );
};
