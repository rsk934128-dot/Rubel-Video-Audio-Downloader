import React, { useState } from 'react';
import { Language } from '../types';
import { getTranslation } from '../utils/translations';
import { extractUrlFromText } from '../services/videoExtractor';
import { 
  Share2, 
  Code, 
  Smartphone, 
  Check, 
  Copy, 
  ExternalLink, 
  Layers, 
  AlertTriangle, 
  Play, 
  CheckCircle2, 
  Sparkles, 
  Sliders, 
  Settings, 
  ArrowRight, 
  Terminal, 
  Globe, 
  FileJson, 
  HelpCircle,
  Laptop,
  CheckCheck
} from 'lucide-react';

interface Props {
  language: Language;
  onTestInDownloader: (url: string) => void;
  onBackToDownloader: () => void;
}

export const PWAShareTargetTutorial: React.FC<Props> = ({
  language,
  onTestInDownloader,
  onBackToDownloader,
}) => {
  const t = getTranslation(language);
  const [activeSection, setActiveSection] = useState<'guide' | 'manifest' | 'javascript' | 'simulator' | 'generator' | 'checklist'>('guide');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // Live Simulator state
  const [simTitle, setSimTitle] = useState('Awesome Music Track Official Video');
  const [simText, setSimText] = useState('Check out this amazing video on YouTube: https://youtu.be/aqz-KE-bpKQ');
  const [simUrl, setSimUrl] = useState('');
  const [preset, setPreset] = useState<'youtube' | 'facebook' | 'instagram' | 'browser' | 'custom'>('youtube');

  // Manifest Generator state
  const [genAction, setGenAction] = useState('/');
  const [genMethod, setGenMethod] = useState<'GET' | 'POST'>('GET');
  const [genParamTitle, setGenParamTitle] = useState(true);
  const [genParamText, setGenParamText] = useState(true);
  const [genParamUrl, setGenParamUrl] = useState(true);
  const [genAcceptFiles, setGenAcceptFiles] = useState(false);
  const [genFileTypes, setGenFileTypes] = useState<string[]>(['video/*', 'audio/*']);

  const copyCode = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const handleSelectPreset = (p: 'youtube' | 'facebook' | 'instagram' | 'browser' | 'custom') => {
    setPreset(p);
    if (p === 'youtube') {
      setSimTitle('Lofi Hip Hop Radio - Beats to Relax/Study to');
      setSimText('Check out this live stream: https://youtu.be/jfKfPfyJRdk');
      setSimUrl(''); // YouTube often sends empty url param and puts URL in text!
    } else if (p === 'facebook') {
      setSimTitle('');
      setSimText('Watch this viral clip on Facebook: https://fb.watch/mG7Xk9qP/');
      setSimUrl('');
    } else if (p === 'instagram') {
      setSimTitle('');
      setSimText('https://www.instagram.com/reel/C8xYz12/');
      setSimUrl('https://www.instagram.com/reel/C8xYz12/');
    } else if (p === 'browser') {
      setSimTitle('Big Buck Bunny Open Source 4K');
      setSimText('');
      setSimUrl('https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4');
    }
  };

  // Compute live simulator parsed URL
  const simulatedQueryString = `?title=${encodeURIComponent(simTitle)}&text=${encodeURIComponent(simText)}&url=${encodeURIComponent(simUrl)}`;
  const extractedFromUrl = simUrl ? extractUrlFromText(simUrl) : null;
  const extractedFromText = simText ? extractUrlFromText(simText) : null;
  const detectedTargetUrl = extractedFromUrl || extractedFromText || '';

  // Generate Manifest JSON
  const generatedManifestObject: any = {
    id: "/",
    name: "Universal Video & Audio Downloader",
    short_name: "Downloader",
    start_url: "/",
    scope: "/",
    display: "standalone",
    share_target: {
      action: genAction,
      method: genMethod,
      params: {
        ...(genParamTitle ? { title: "title" } : {}),
        ...(genParamText ? { text: "text" } : {}),
        ...(genParamUrl ? { url: "url" } : {}),
        ...(genAcceptFiles ? {
          files: [
            {
              name: "media_files",
              accept: genFileTypes
            }
          ]
        } : {})
      }
    }
  };
  const generatedManifestJson = JSON.stringify(generatedManifestObject, null, 2);

  return (
    <div className="w-full max-w-5xl mx-auto py-2 sm:py-6">
      {/* Header Banner */}
      <div className="rounded-3xl bg-gradient-to-br from-slate-900 via-slate-900/90 to-slate-950 border border-slate-800 p-6 sm:p-8 shadow-2xl relative overflow-hidden mb-8">
        <div className="absolute -right-10 -top-10 w-60 h-60 bg-rose-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute right-20 -bottom-10 w-60 h-60 bg-sky-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-sky-500/10 text-sky-400 border border-sky-500/20 text-xs font-semibold mb-3">
              <Share2 className="w-3.5 h-3.5" />
              <span>W3C Web Share Target API Specification</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight leading-tight">
              {language === 'bn' 
                ? 'PWA Web Share Target কনফিগারেশন টিউটোরিয়াল' 
                : 'PWA Web Share Target Guide & Documentation'}
            </h2>
            <p className="text-sm sm:text-base text-slate-400 mt-2 leading-relaxed">
              {language === 'bn'
                ? 'মোবাইলে ইনস্টল করা PWA কীভাবে YouTube, Facebook বা Instagram এর মতো অন্য যেকোনো অ্যাপের "Share" মেনুতে শো করবে এবং সরাসরি ভিডিও লিঙ্ক রিসিভ করবে তার সম্পূর্ণ গাইড ও কোড।'
                : 'Learn how to configure manifest.json so your Progressive Web App appears in the Android OS System Share Sheet, allowing users to share links directly from YouTube, Facebook, and Instagram into your app.'}
            </p>
          </div>

          <div className="flex flex-row md:flex-col gap-2 shrink-0 w-full sm:w-auto">
            <button
              onClick={onBackToDownloader}
              className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs sm:text-sm font-semibold border border-slate-700 transition"
            >
              <ArrowRight className="w-4 h-4 rotate-180" />
              <span>{language === 'bn' ? 'ডাউনলোডারে ফিরুন' : 'Back to Downloader'}</span>
            </button>
            <button
              onClick={() => setActiveSection('simulator')}
              className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 text-xs sm:text-sm font-semibold border border-rose-500/30 transition"
            >
              <Sparkles className="w-4 h-4 text-rose-400" />
              <span>{language === 'bn' ? 'শেয়ার সিমুলেটর টেস্ট' : 'Test Share Simulator'}</span>
            </button>
          </div>
        </div>

        {/* Quick Highlights Pills */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-6 border-t border-slate-800/80">
          <div className="flex items-center gap-2 text-xs text-slate-300">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{language === 'bn' ? 'কোনো Play Store প্রয়োজন নেই' : 'No App Store Required'}</span>
          </div>
          <div className="flex items-center gap-2 text-xs text-slate-300">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{language === 'bn' ? 'অ্যান্ড্রয়েড সিস্টেম শেয়ার শিট' : 'Native Android Share Sheet'}</span>
          </div>
          <div className="flex items-center gap-2 text-xs text-slate-300">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{language === 'bn' ? '১০০% পিউর ওয়েব স্ট্যান্ডার্ড' : '100% W3C Web Standard'}</span>
          </div>
          <div className="flex items-center gap-2 text-xs text-slate-300">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{language === 'bn' ? 'ইনস্ট্যান্ট অটো-এক্সট্র্যাকশন' : 'Automatic URL Ingestion'}</span>
          </div>
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 mb-6 scrollbar-thin">
        <button
          onClick={() => setActiveSection('guide')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold whitespace-nowrap transition ${
            activeSection === 'guide'
              ? 'bg-rose-500 text-white shadow-lg shadow-rose-500/25'
              : 'bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-800'
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>{language === 'bn' ? '১. আর্কিটেকচার ও ধারণা' : '1. Architecture & Concept'}</span>
        </button>

        <button
          onClick={() => setActiveSection('manifest')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold whitespace-nowrap transition ${
            activeSection === 'manifest'
              ? 'bg-rose-500 text-white shadow-lg shadow-rose-500/25'
              : 'bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-800'
          }`}
        >
          <FileJson className="w-4 h-4" />
          <span>{language === 'bn' ? '২. manifest.json কনফিগার' : '2. manifest.json Config'}</span>
        </button>

        <button
          onClick={() => setActiveSection('javascript')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold whitespace-nowrap transition ${
            activeSection === 'javascript'
              ? 'bg-rose-500 text-white shadow-lg shadow-rose-500/25'
              : 'bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-800'
          }`}
        >
          <Code className="w-4 h-4" />
          <span>{language === 'bn' ? '৩. জাভাস্ক্রিপ্ট পার্সার ও ট্র্যাপ' : '3. JS URL Parser & Quirks'}</span>
        </button>

        <button
          onClick={() => setActiveSection('simulator')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold whitespace-nowrap transition ${
            activeSection === 'simulator'
              ? 'bg-rose-500 text-white shadow-lg shadow-rose-500/25'
              : 'bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-800'
          }`}
        >
          <Play className="w-4 h-4" />
          <span>{language === 'bn' ? '৪. লাইভ টেস্ট সিমুলেটর' : '4. Live Share Simulator'}</span>
        </button>

        <button
          onClick={() => setActiveSection('generator')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold whitespace-nowrap transition ${
            activeSection === 'generator'
              ? 'bg-rose-500 text-white shadow-lg shadow-rose-500/25'
              : 'bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-800'
          }`}
        >
          <Sliders className="w-4 h-4" />
          <span>{language === 'bn' ? '৫. ম্যানিফেস্ট জেনারেটর' : '5. Manifest Generator'}</span>
        </button>

        <button
          onClick={() => setActiveSection('checklist')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold whitespace-nowrap transition ${
            activeSection === 'checklist'
              ? 'bg-rose-500 text-white shadow-lg shadow-rose-500/25'
              : 'bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-800'
          }`}
        >
          <CheckCircle2 className="w-4 h-4" />
          <span>{language === 'bn' ? '৬. চেকলিস্ট ও ব্রাউজার সাপোর্ট' : '6. Checklist & Support'}</span>
        </button>
      </div>

      {/* SECTION 1: ARCHITECTURE & CONCEPT */}
      {activeSection === 'guide' && (
        <div className="space-y-6">
          {/* Visual Step-by-Step Flow */}
          <div className="p-6 rounded-3xl bg-slate-900/80 border border-slate-800">
            <h3 className="text-base font-bold text-white mb-4 flex items-center gap-2">
              <Smartphone className="w-5 h-5 text-rose-400" />
              <span>
                {language === 'bn' 
                  ? 'কীভাবে Web Share Target কাজ করে? (৪টি ধাপের ফ্লো)' 
                  : 'How Web Share Target Works (4-Step Native Flow)'}
              </span>
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800/80 relative">
                <div className="w-8 h-8 rounded-xl bg-rose-500/10 text-rose-400 flex items-center justify-center text-xs font-bold mb-3">
                  ১
                </div>
                <h4 className="text-sm font-bold text-white mb-1">
                  {language === 'bn' ? '১. ইউজার শেয়ার চাপলেন' : '1. User Taps "Share"'}
                </h4>
                <p className="text-xs text-slate-400 leading-relaxed">
                  {language === 'bn'
                    ? 'ইউজার YouTube, Instagram, বা TikTok-এ যেকোনো ভিডিওতে গিয়ে নেটিভ "Share" বাটনে চাপেন।'
                    : 'User is watching a video in YouTube, Instagram, or TikTok app and taps the native "Share" button.'}
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800/80 relative">
                <div className="w-8 h-8 rounded-xl bg-sky-500/10 text-sky-400 flex items-center justify-center text-xs font-bold mb-3">
                  ২
                </div>
                <h4 className="text-sm font-bold text-white mb-1">
                  {language === 'bn' ? '২. সিস্টেম শেয়ার শিট' : '2. Android Share Sheet'}
                </h4>
                <p className="text-xs text-slate-400 leading-relaxed">
                  {language === 'bn'
                    ? 'যেহেতু PWA ফোনে ইনস্টল করা আছে, অ্যান্ড্রয়েড সিস্টেম অ্যাপ তালিকার মধ্যে আপনার ওয়েব অ্যাপের নাম ও আইকন প্রদর্শন করে।'
                    : 'Android OS reads the installed PWA manifest and registers your web app alongside WhatsApp, Messenger, etc.'}
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800/80 relative">
                <div className="w-8 h-8 rounded-xl bg-purple-500/10 text-purple-400 flex items-center justify-center text-xs font-bold mb-3">
                  ৩
                </div>
                <h4 className="text-sm font-bold text-white mb-1">
                  {language === 'bn' ? '৩. কোয়েরি সহ লঞ্চ' : '3. Launch with Query'}
                </h4>
                <p className="text-xs text-slate-400 leading-relaxed">
                  {language === 'bn'
                    ? 'ইউজার অ্যাপটি সিলেক্ট করলে ব্রাউজার PWA টি ওপেন করে এবং লিঙ্কটি URL Parameter হিসেবে পাঠিয়ে দেয়।'
                    : 'The browser launches the PWA at the configured action URL with "?url=..." or "?text=..." parameters.'}
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800/80 relative">
                <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center text-xs font-bold mb-3">
                  ৪
                </div>
                <h4 className="text-sm font-bold text-white mb-1">
                  {language === 'bn' ? '৪. অটোমেটিক ডাউনলোড' : '4. Ingest & Download'}
                </h4>
                <p className="text-xs text-slate-400 leading-relaxed">
                  {language === 'bn'
                    ? 'React/JavaScript কোয়েরি পার্স করে ভিডিও লিঙ্কটি ফিল্টার করে স্বয়ংক্রিয়ভাবে ভিডিও তথ্য নিয়ে আসে!'
                    : 'The frontend app reads the parameters on startup, regex-extracts the clean video URL, and starts extraction.'}
                </p>
              </div>
            </div>
          </div>

          {/* GET vs POST Explanation Card */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="p-6 rounded-3xl bg-slate-900/80 border border-slate-800">
              <div className="flex items-center gap-2 mb-3">
                <span className="px-2.5 py-1 rounded-lg bg-emerald-500/20 text-emerald-300 text-xs font-mono font-bold">
                  METHOD: "GET"
                </span>
                <span className="text-xs font-semibold text-slate-300">
                  {language === 'bn' ? 'লিঙ্ক শেয়ারের জন্য সেরা (Recommended)' : 'Ideal for Link/URL Downloaders'}
                </span>
              </div>
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                {language === 'bn' ? (
                  <>
                    <strong>GET মেথড:</strong> ব্রাউজার ডেটাগুলো URL Query String (যেমন <code className="text-rose-400 bg-slate-950 px-1 py-0.5 rounded">/?url=...&text=...</code>) হিসেবে অ্যাপের এন্ট্রি পয়েন্টে পাস করে। কোনো সার্ভিস ওয়ার্কার জটিলতা ছাড়া ক্লায়েন্ট-সাইড জাভাস্ক্রিপ্ট দিয়েই <code className="text-sky-400 bg-slate-950 px-1 py-0.5 rounded">URLSearchParams</code> ব্যবহার করে লিঙ্ক পড়ে নেওয়া যায়।
                  </>
                ) : (
                  <>
                    <strong>GET Method:</strong> The browser passes the shared payload as URL query parameters (e.g., <code className="text-rose-400 bg-slate-950 px-1 py-0.5 rounded">/?url=...&text=...</code>). The client-side JavaScript reads it immediately on load using <code className="text-sky-400 bg-slate-950 px-1 py-0.5 rounded">URLSearchParams</code> without complex backend setup.
                  </>
                )}
              </p>
            </div>

            <div className="p-6 rounded-3xl bg-slate-900/80 border border-slate-800">
              <div className="flex items-center gap-2 mb-3">
                <span className="px-2.5 py-1 rounded-lg bg-purple-500/20 text-purple-300 text-xs font-mono font-bold">
                  METHOD: "POST"
                </span>
                <span className="text-xs font-semibold text-slate-300">
                  {language === 'bn' ? 'ফাইল বা বড় ডেটা শেয়ারের জন্য' : 'For Media Files & Large Data'}
                </span>
              </div>
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                {language === 'bn' ? (
                  <>
                    <strong>POST মেথড:</strong> যখন ইউজার গ্যালারি বা ফাইল ম্যানেজার থেকে ছবি/অডিও/ভিডিও ফাইল সরাসরি শেয়ার করতে চান, তখন <code className="text-purple-400 bg-slate-950 px-1 py-0.5 rounded">enctype: "multipart/form-data"</code> দিয়ে POST করতে হয়। এটি সার্ভিস ওয়ার্কারের <code className="text-amber-400 bg-slate-950 px-1 py-0.5 rounded">fetch</code> ইভেন্ট হ্যান্ডলার দিয়ে ইন্টারসেপ্ট করতে হয়।
                  </>
                ) : (
                  <>
                    <strong>POST Method:</strong> Required when accepting actual files (audio, video, images) or very large text blobs using <code className="text-purple-400 bg-slate-950 px-1 py-0.5 rounded">multipart/form-data</code>. In client-only PWAs, the Service Worker intercepts the request and caches or forwards the files.
                  </>
                )}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* SECTION 2: MANIFEST CONFIGURATION */}
      {activeSection === 'manifest' && (
        <div className="space-y-6">
          <div className="p-6 rounded-3xl bg-slate-900/80 border border-slate-800">
            <div className="flex items-center justify-between gap-4 mb-4">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <FileJson className="w-5 h-5 text-sky-400" />
                  <span>
                    {language === 'bn' 
                      ? 'manifest.json এর মৌলিক স্ট্রাকচার (Pattern 1: GET Method)' 
                      : 'Production manifest.json Configuration (Pattern 1: GET)'}
                  </span>
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  {language === 'bn'
                    ? 'ভিডিও ও অডিও ডাউনলোডারের জন্য এই কনফিগারেশনটি সবচেয়ে দ্রুত ও কার্যকর।'
                    : 'The standard and battle-tested pattern for video/audio link extraction apps.'}
                </p>
              </div>

              <button
                onClick={() => copyCode(
`{
  "id": "/",
  "name": "Universal Video & Audio Downloader",
  "short_name": "Downloader",
  "start_url": "/",
  "scope": "/",
  "display": "standalone",
  "orientation": "portrait",
  "background_color": "#090d16",
  "theme_color": "#090d16",
  "share_target": {
    "action": "/",
    "method": "GET",
    "params": {
      "title": "title",
      "text": "text",
      "url": "url"
    }
  },
  "icons": [
    {
      "src": "/icon.svg",
      "sizes": "192x192 512x512",
      "type": "image/svg+xml",
      "purpose": "any"
    }
  ]
}`,
                  'manifest_get'
                )}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition"
              >
                {copiedKey === 'manifest_get' ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4 text-slate-400" />}
                <span>{copiedKey === 'manifest_get' ? 'Copied!' : 'Copy manifest.json'}</span>
              </button>
            </div>

            {/* Code Block */}
            <div className="relative rounded-2xl bg-slate-950 p-4 border border-slate-800/80 font-mono text-xs text-slate-300 overflow-x-auto leading-relaxed">
              <pre>{`{
  "name": "Universal Video Downloader",
  "short_name": "Downloader",
  "start_url": "/",
  "display": "standalone",

  /* ✨ SHARE_TARGET DEFINITION ✨ */
  "share_target": {
    "action": "/",          // রিসিভ করার রাউট (Route that receives the share)
    "method": "GET",         // GET প্যারামিটার হিসেবে পাঠাবে (Sends via URL query)
    "params": {
      "title": "title",      // ?title=...
      "text": "text",        // ?text=... (YouTube লিঙ্ক সাধারণত এখানে থাকে!)
      "url": "url"           // ?url=...
    }
  },

  "icons": [
    {
      "src": "/icon.svg",
      "sizes": "192x192 512x512",
      "type": "image/svg+xml",
      "purpose": "any maskable"
    }
  ]
}`}</pre>
            </div>

            {/* Params Detailed Breakdown Table */}
            <div className="mt-6">
              <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-3">
                {language === 'bn' ? 'প্যারামিটার বিবরণ' : 'Parameter Breakdown'}
              </h4>
              <div className="space-y-2">
                <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/60 flex flex-col sm:flex-row sm:items-center justify-between text-xs gap-1">
                  <div>
                    <span className="font-mono font-bold text-rose-400">action</span>
                    <span className="ml-2 text-slate-300 font-mono">string (e.g. "/" or "/download")</span>
                  </div>
                  <span className="text-slate-400">
                    {language === 'bn' ? 'যে পেজ বা রাউটে শেয়ার করা তথ্যগুলো পাঠানো হবে' : 'The target URL within the PWA scope to receive the data'}
                  </span>
                </div>

                <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/60 flex flex-col sm:flex-row sm:items-center justify-between text-xs gap-1">
                  <div>
                    <span className="font-mono font-bold text-sky-400">method</span>
                    <span className="ml-2 text-slate-300 font-mono">"GET" | "POST"</span>
                  </div>
                  <span className="text-slate-400">
                    {language === 'bn' ? 'GET দিলে কুয়েরি প্যারামিটার হিসেবে যায়; POST দিলে ফর্ম ডেটা হিসেবে' : 'HTTP verb: GET passes URL parameters; POST sends request body'}
                  </span>
                </div>

                <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/60 flex flex-col sm:flex-row sm:items-center justify-between text-xs gap-1">
                  <div>
                    <span className="font-mono font-bold text-purple-400">params.text</span>
                    <span className="ml-2 text-slate-300 font-mono">string</span>
                  </div>
                  <span className="text-slate-400">
                    {language === 'bn' ? 'ইউটিউব বা ফেসবুকের টেক্সট ও এমবেডেড ইউআরএল ধারণ করে' : 'Crucial: Most social apps put the link inside this field'}
                  </span>
                </div>

                <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/60 flex flex-col sm:flex-row sm:items-center justify-between text-xs gap-1">
                  <div>
                    <span className="font-mono font-bold text-emerald-400">params.files</span>
                    <span className="ml-2 text-slate-300 font-mono">array of file descriptors</span>
                  </div>
                  <span className="text-slate-400">
                    {language === 'bn' ? 'ভিডিও বা অডিও ফাইল সরাসরি শেয়ার করার ক্ষেত্রে প্রযোজ্য' : 'Optional: Receives actual files when method is POST'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Pattern 2: Receiving Files via POST & Service Worker */}
          <div className="p-6 rounded-3xl bg-slate-900/80 border border-slate-800">
            <div className="flex items-center justify-between gap-4 mb-4">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <FileJson className="w-5 h-5 text-purple-400" />
                  <span>
                    {language === 'bn' 
                      ? 'Pattern 2: ফাইল রিসিভ করার কনফিগারেশন (POST + multipart/form-data)' 
                      : 'Pattern 2: File Sharing Configuration (POST + Files)'}
                  </span>
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  {language === 'bn'
                    ? 'ইউজার যখন গ্যালারি থেকে সরাসরি ভিডিও বা অডিও ফাইল শেয়ার করতে চান।'
                    : 'Used if you want users to share local MP4 or MP3 files from Android Gallery/Files.'}
                </p>
              </div>

              <button
                onClick={() => copyCode(
`"share_target": {
  "action": "/share-target",
  "method": "POST",
  "enctype": "multipart/form-data",
  "params": {
    "title": "title",
    "text": "text",
    "files": [
      {
        "name": "media",
        "accept": ["video/*", "audio/*", ".mp4", ".mp3"]
      }
    ]
  }
}`,
                  'manifest_post'
                )}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition"
              >
                {copiedKey === 'manifest_post' ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4 text-slate-400" />}
                <span>{copiedKey === 'manifest_post' ? 'Copied!' : 'Copy POST Config'}</span>
              </button>
            </div>

            <div className="relative rounded-2xl bg-slate-950 p-4 border border-slate-800/80 font-mono text-xs text-slate-300 overflow-x-auto leading-relaxed">
              <pre>{`"share_target": {
  "action": "/share-target",
  "method": "POST",
  "enctype": "multipart/form-data",
  "params": {
    "title": "title",
    "text": "text",
    "files": [
      {
        "name": "media",
        "accept": ["video/*", "audio/*", ".mp4", ".mp3"]
      }
    ]
  }
}`}</pre>
            </div>
          </div>
        </div>
      )}

      {/* SECTION 3: JAVASCRIPT & QUIRKS */}
      {activeSection === 'javascript' && (
        <div className="space-y-6">
          {/* The Critical "YouTube Trap" Advisory */}
          <div className="p-6 rounded-3xl bg-amber-500/10 border border-amber-500/30 text-amber-200">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-6 h-6 text-amber-400 shrink-0 mt-0.5" />
              <div>
                <h4 className="text-sm font-bold text-amber-300">
                  {language === 'bn' 
                    ? '⚠️ গুরুত্বপূর্ণ সতর্কবার্তা: YouTube ও Twitter এর লুকানো ট্র্যাপ' 
                    : '⚠️ Crucial Production Gotcha: The YouTube & Social Media Quirk'}
                </h4>
                <p className="text-xs sm:text-sm text-amber-200/90 mt-1 leading-relaxed">
                  {language === 'bn' ? (
                    <>
                      অনেক ডেভেলপার শুধুমাত্র <code className="bg-amber-950/60 px-1 py-0.5 rounded text-white font-mono">params.get('url')</code> চেক করেন। কিন্তু <strong>YouTube Android App</strong> কখনোই <code className="bg-amber-950/60 px-1 py-0.5 rounded text-white font-mono">url</code> ফিল্ডে লিঙ্ক পাঠায় না! তারা টেক্সট ফিল্ডে এরকম মেসেজ পাঠায়:
                      <br />
                      <code className="block mt-1 p-2 rounded bg-amber-950/80 text-amber-100 font-mono text-xs">
                        text = &quot;Check out this video on YouTube: https://youtu.be/aqz-KE-bpKQ&quot;
                      </code>
                      তাই অ্যাপে অবশ্যই <strong>Regex URL Extractor</strong> থাকতে হবে যা টেক্সট মেসেজের ভেতর থেকে সঠিক লিঙ্ক বের করতে পারে।
                    </>
                  ) : (
                    <>
                      Most developers only inspect <code className="bg-amber-950/60 px-1 py-0.5 rounded text-white font-mono">params.get('url')</code>. However, the <strong>YouTube Android App</strong> rarely populates the <code className="bg-amber-950/60 px-1 py-0.5 rounded text-white font-mono">url</code> property! Instead, it populates the <code className="bg-amber-950/60 px-1 py-0.5 rounded text-white font-mono">text</code> property with:
                      <br />
                      <code className="block mt-1 p-2 rounded bg-amber-950/80 text-amber-100 font-mono text-xs">
                        text = &quot;Check out this video on YouTube: https://youtu.be/aqz-KE-bpKQ&quot;
                      </code>
                      If you only check <code className="bg-amber-950/60 px-1 py-0.5 rounded text-white font-mono">params.get('url')</code>, YouTube shares will completely fail. You must parse the text using a URL regex.
                    </>
                  )}
                </p>
              </div>
            </div>
          </div>

          {/* Frontend Implementation Code */}
          <div className="p-6 rounded-3xl bg-slate-900/80 border border-slate-800">
            <div className="flex items-center justify-between gap-4 mb-4">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Code className="w-5 h-5 text-emerald-400" />
                  <span>
                    {language === 'bn' 
                      ? 'React / JavaScript কোড: লিঙ্ক রিসিভ ও পার্সিং' 
                      : 'React / JavaScript Ingestion Code (Handles YouTube, FB & Insta)'}
                  </span>
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  {language === 'bn'
                    ? 'অ্যাপ ওপেন হওয়ার সাথে সাথে প্যারামিটার চেক করে ভিডিও লোড করার পূর্ণাঙ্গ কোড।'
                    : 'Robust code to extract URLs from query params or mixed text strings on app load.'}
                </p>
              </div>

              <button
                onClick={() => copyCode(
`// 1. Regular expression to extract http/https URLs from mixed text
export function extractUrlFromText(text: string): string | null {
  if (!text) return null;
  const match = text.match(/https?:\\/\\/[^\\s]+/i);
  return match ? match[0] : null;
}

// 2. React Hook to listen for Web Share Target incoming query params
import { useEffect, useState } from 'react';

export function useSharedUrlHandler(onUrlReceived: (url: string) => void) {
  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      
      // Check ?url= parameter
      const rawUrl = params.get('url');
      // Check ?text= parameter (where YouTube and Twitter put links!)
      const rawText = params.get('text');
      
      const candidate = rawUrl || rawText;
      if (candidate) {
        const cleanUrl = extractUrlFromText(candidate);
        if (cleanUrl) {
          onUrlReceived(cleanUrl);
          
          // Optional: Clean URL query params so reloading won't trigger again
          const cleanWindowUrl = window.location.pathname;
          window.history.replaceState({}, document.title, cleanWindowUrl);
        }
      }
    } catch (err) {
      console.error('Failed to parse incoming share intent:', err);
    }
  }, [onUrlReceived]);
}`,
                  'js_code'
                )}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition"
              >
                {copiedKey === 'js_code' ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4 text-slate-400" />}
                <span>{copiedKey === 'js_code' ? 'Copied!' : 'Copy Hook Code'}</span>
              </button>
            </div>

            <div className="relative rounded-2xl bg-slate-950 p-4 border border-slate-800/80 font-mono text-xs text-slate-300 overflow-x-auto leading-relaxed">
              <pre>{`// 1. Regex function to extract clean URL from text
export function extractUrlFromText(text: string): string | null {
  if (!text) return null;
  const match = text.match(/https?:\\/\\/[^\\s]+/i);
  return match ? match[0] : null;
}

// 2. React useEffect to capture incoming share
useEffect(() => {
  const params = new URLSearchParams(window.location.search);
  
  // Read either ?url= or ?text=
  const candidate = params.get('url') || params.get('text');
  
  if (candidate) {
    const cleanUrl = extractUrlFromText(candidate);
    if (cleanUrl) {
      // 🚀 Automatically analyze and prompt download!
      executeAnalyze(cleanUrl);
    }
  }
}, []);`}</pre>
            </div>
          </div>
        </div>
      )}

      {/* SECTION 4: INTERACTIVE LIVE SIMULATOR */}
      {activeSection === 'simulator' && (
        <div className="space-y-6">
          <div className="p-6 rounded-3xl bg-slate-900/80 border border-slate-800">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Play className="w-5 h-5 text-rose-400" />
                  <span>
                    {language === 'bn' 
                      ? 'লাইভ ওয়েব শেয়ার টার্গেট সিমুলেটর ও ডিবাগার' 
                      : 'Live Web Share Target Simulator & Ingestion Tester'}
                  </span>
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  {language === 'bn'
                    ? 'বিভিন্ন মোবাইল অ্যাপ কীভাবে ডেটা পাঠায় তা টেস্ট করুন এবং ইন-অ্যাপ পার্সার কীভাবে তা এক্সট্র্যাক্ট করে তা দেখুন।'
                    : 'Simulate how different mobile apps formulate their share payloads and test the parser in real time.'}
                </p>
              </div>

              {/* Preset Buttons */}
              <div className="flex items-center gap-1.5 overflow-x-auto">
                <button
                  onClick={() => handleSelectPreset('youtube')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition ${
                    preset === 'youtube' ? 'bg-rose-500 text-white' : 'bg-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  YouTube App
                </button>
                <button
                  onClick={() => handleSelectPreset('facebook')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition ${
                    preset === 'facebook' ? 'bg-blue-600 text-white' : 'bg-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  Facebook Watch
                </button>
                <button
                  onClick={() => handleSelectPreset('instagram')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition ${
                    preset === 'instagram' ? 'bg-pink-600 text-white' : 'bg-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  Instagram Reel
                </button>
                <button
                  onClick={() => handleSelectPreset('browser')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition ${
                    preset === 'browser' ? 'bg-emerald-600 text-white' : 'bg-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  Direct Browser
                </button>
              </div>
            </div>

            {/* Simulated Inputs */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1.5">
                  params.title (Optional Title)
                </label>
                <input
                  type="text"
                  value={simTitle}
                  onChange={(e) => {
                    setSimTitle(e.target.value);
                    setPreset('custom');
                  }}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-rose-500"
                  placeholder="e.g. Video Title"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1.5">
                  params.text (Text / Message)
                </label>
                <input
                  type="text"
                  value={simText}
                  onChange={(e) => {
                    setSimText(e.target.value);
                    setPreset('custom');
                  }}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-rose-500"
                  placeholder="e.g. Check this out: https://..."
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1.5">
                  params.url (Raw URL)
                </label>
                <input
                  type="text"
                  value={simUrl}
                  onChange={(e) => {
                    setSimUrl(e.target.value);
                    setPreset('custom');
                  }}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-rose-500"
                  placeholder="e.g. https://..."
                />
              </div>
            </div>

            {/* Generated Query String Display */}
            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800/80 mb-6">
              <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                {language === 'bn' ? 'ব্রাউজারে রিসিভ হওয়া কুয়েরি স্ট্রিং:' : 'Browser Incoming Query String:'}
              </div>
              <div className="font-mono text-xs text-sky-400 break-all bg-slate-900/60 p-2.5 rounded-xl border border-slate-800">
                https://your-pwa-domain.com/{simulatedQueryString}
              </div>
            </div>

            {/* Ingestion & Extracted Result Box */}
            <div className="p-4 rounded-2xl bg-gradient-to-br from-slate-950 to-slate-900 border border-rose-500/20 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-300">
                    {language === 'bn' ? 'শনাক্তকৃত ভিডিও লিঙ্ক:' : 'Regex Extracted URL:'}
                  </span>
                  {detectedTargetUrl ? (
                    <span className="px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold">
                      Detected
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 rounded bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs font-bold">
                      No URL Found
                    </span>
                  )}
                </div>
                <p className="font-mono text-xs text-rose-300 mt-1 break-all">
                  {detectedTargetUrl || 'Please provide a valid URL in either text or url field'}
                </p>
              </div>

              {detectedTargetUrl && (
                <button
                  onClick={() => onTestInDownloader(detectedTargetUrl)}
                  className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-rose-500 to-pink-500 hover:from-rose-600 hover:to-pink-600 text-white text-xs font-bold shadow-lg shadow-rose-500/25 transition whitespace-nowrap"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>{language === 'bn' ? 'ডাউনলোডারে টেস্ট করুন' : 'Test in Downloader'}</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* SECTION 5: MANIFEST GENERATOR */}
      {activeSection === 'generator' && (
        <div className="space-y-6">
          <div className="p-6 rounded-3xl bg-slate-900/80 border border-slate-800">
            <h3 className="text-base font-bold text-white mb-2 flex items-center gap-2">
              <Sliders className="w-5 h-5 text-rose-400" />
              <span>
                {language === 'bn' 
                  ? 'ইন্টারেক্টিভ manifest.json জেনারেটর' 
                  : 'Interactive manifest.json Generator'}
              </span>
            </h3>
            <p className="text-xs text-slate-400 mb-6">
              {language === 'bn'
                ? 'আপনার প্রয়োজন অনুযায়ী অপশনগুলো সিলেক্ট করুন এবং সরাসরি কপি করে আপনার manifest.json ফাইলে ব্যবহার করুন।'
                : 'Customize share_target parameters below to generate a production-ready manifest snippet.'}
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Controls Column */}
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1.5">
                    Target Action URL (Route)
                  </label>
                  <input
                    type="text"
                    value={genAction}
                    onChange={(e) => setGenAction(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-rose-500"
                    placeholder="e.g. / or /download or /share-target"
                  />
                  <p className="text-[11px] text-slate-500 mt-1">
                    {language === 'bn' ? 'ডিফল্ট রুট হিসেবে "/" রাখা সবচেয়ে সহজ।' : 'Usually "/" for Single Page Applications.'}
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1.5">
                    HTTP Method
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setGenMethod('GET')}
                      className={`px-3 py-2 rounded-xl text-xs font-bold border transition ${
                        genMethod === 'GET'
                          ? 'bg-rose-500/20 border-rose-500/40 text-rose-300'
                          : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                      }`}
                    >
                      GET (Recommended)
                    </button>
                    <button
                      type="button"
                      onClick={() => setGenMethod('POST')}
                      className={`px-3 py-2 rounded-xl text-xs font-bold border transition ${
                        genMethod === 'POST'
                          ? 'bg-purple-500/20 border-purple-500/40 text-purple-300'
                          : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                      }`}
                    >
                      POST
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1.5">
                    Query / Form Parameters
                  </label>
                  <div className="space-y-2">
                    <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={genParamTitle}
                        onChange={(e) => setGenParamTitle(e.target.checked)}
                        className="rounded border-slate-700 bg-slate-950 text-rose-500 focus:ring-0"
                      />
                      <span>Include "title" parameter</span>
                    </label>

                    <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={genParamText}
                        onChange={(e) => setGenParamText(e.target.checked)}
                        className="rounded border-slate-700 bg-slate-950 text-rose-500 focus:ring-0"
                      />
                      <span>Include "text" parameter (Mandatory for YouTube)</span>
                    </label>

                    <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={genParamUrl}
                        onChange={(e) => setGenParamUrl(e.target.checked)}
                        className="rounded border-slate-700 bg-slate-950 text-rose-500 focus:ring-0"
                      />
                      <span>Include "url" parameter</span>
                    </label>
                  </div>
                </div>

                <div>
                  <label className="flex items-center gap-2 text-xs font-bold text-slate-300 mb-1.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={genAcceptFiles}
                      onChange={(e) => {
                        setGenAcceptFiles(e.target.checked);
                        if (e.target.checked) setGenMethod('POST');
                      }}
                      className="rounded border-slate-700 bg-slate-950 text-rose-500 focus:ring-0"
                    />
                    <span>Accept Media Files (Audio & Video)</span>
                  </label>
                  {genAcceptFiles && (
                    <p className="text-[11px] text-amber-400 mt-1">
                      * Accepting files automatically switches method to POST and requires a Service Worker.
                    </p>
                  )}
                </div>
              </div>

              {/* Live Preview Column */}
              <div>
                <div className="flex items-center justify-between gap-2 mb-1.5">
                  <span className="text-xs font-bold text-slate-400">
                    Generated manifest.json
                  </span>
                  <button
                    onClick={() => copyCode(generatedManifestJson, 'gen_json')}
                    className="flex items-center gap-1 text-xs text-rose-400 hover:text-rose-300 transition"
                  >
                    {copiedKey === 'gen_json' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedKey === 'gen_json' ? 'Copied' : 'Copy JSON'}</span>
                  </button>
                </div>
                <div className="h-[340px] rounded-2xl bg-slate-950 p-4 border border-slate-800 font-mono text-xs text-emerald-400 overflow-y-auto leading-relaxed">
                  <pre>{generatedManifestJson}</pre>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SECTION 6: CHECKLIST & BROWSER SUPPORT */}
      {activeSection === 'checklist' && (
        <div className="space-y-6">
          {/* Browser Support Matrix */}
          <div className="p-6 rounded-3xl bg-slate-900/80 border border-slate-800">
            <h3 className="text-base font-bold text-white mb-4 flex items-center gap-2">
              <Globe className="w-5 h-5 text-sky-400" />
              <span>
                {language === 'bn' 
                  ? 'মোবাইল ব্রাউজার সাপোর্ট ম্যাট্রিক্স' 
                  : 'Mobile Browser Support Matrix'}
              </span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-bold text-white">Chrome for Android</span>
                  <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 text-xs font-bold">
                    Full Support
                  </span>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed">
                  {language === 'bn'
                    ? 'v71+ থেকে GET সাপোর্ট করে এবং v76+ থেকে POST ও ফাইল শেয়ারিং ফুল সাপোর্ট করে।'
                    : 'Supported since Chrome 71 (GET) and Chrome 76 (POST/Files). Native Android Share Sheet integration.'}
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-bold text-white">Samsung Internet</span>
                  <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 text-xs font-bold">
                    Full Support
                  </span>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed">
                  {language === 'bn'
                    ? 'v11.1+ থেকে স্যামসাং গ্যালাক্সি ডিভাইসের সিস্টেম শেয়ার শিটের সাথে পুরোপুরি ইন্টিগ্রেটেড।'
                    : 'Supported since Samsung Internet 11.1. Native Galaxy OS share sheet support.'}
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-bold text-white">Edge / Brave Android</span>
                  <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 text-xs font-bold">
                    Full Support
                  </span>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed">
                  {language === 'bn'
                    ? 'যেহেতু এরা Chromium ইঞ্জিন ব্যবহার করে, সেহেতু এগুলো সম্পূর্ণ সাপোর্ট করে।'
                    : 'All Chromium-based Android browsers support Web Share Target out of the box.'}
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-bold text-white">Windows 10 / 11 Edge</span>
                  <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 text-xs font-bold">
                    Supported
                  </span>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed">
                  {language === 'bn'
                    ? 'উইন্ডোজের নেটিভ শেয়ার ডায়লগে ইনস্টল করা PWA শো করে।'
                    : 'PWA shows up in Windows native Share UI for links and files.'}
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 sm:col-span-2">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-bold text-white">iOS Safari (iPhone / iPad)</span>
                  <span className="px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 text-xs font-bold">
                    Not Supported by Apple
                  </span>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed">
                  {language === 'bn' ? (
                    <>
                      Apple Safari এখনও <code className="text-amber-400">share_target</code> সাপোর্ট করেনি (WebKit Bug #194529)। আইফোন ইউজারদের জন্য এই অ্যাপে ওয়ান-ট্যাপ <strong>&quot;Paste from Clipboard&quot;</strong> বাটন ও Apple Shortcuts ওয়ার্কফ্লো যুক্ত করা হয়েছে।
                    </>
                  ) : (
                    <>
                      Apple Safari WebKit has not implemented the Web Share Target API yet (WebKit Bug #194529). For iPhone users, our app provides a 1-tap <strong>&quot;Paste&quot;</strong> button and Apple Shortcuts integration.
                    </>
                  )}
                </p>
              </div>
            </div>
          </div>

          {/* Verification Checklist */}
          <div className="p-6 rounded-3xl bg-slate-900/80 border border-slate-800">
            <h3 className="text-base font-bold text-white mb-4 flex items-center gap-2">
              <CheckCheck className="w-5 h-5 text-emerald-400" />
              <span>
                {language === 'bn' 
                  ? 'PWA শেয়ার টার্গেট সক্রিয় করার ৬টি চেকলিস্ট' 
                  : '6-Point Activation & Troubleshooting Checklist'}
              </span>
            </h3>

            <div className="space-y-3 text-xs sm:text-sm">
              <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800/80 flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-bold text-white">1. HTTPS Protocol</h4>
                  <p className="text-slate-400 text-xs mt-0.5">
                    Web Share Target and Service Workers strictly require HTTPS (or localhost during development).
                  </p>
                </div>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800/80 flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-bold text-white">2. Standalone Display Mode</h4>
                  <p className="text-slate-400 text-xs mt-0.5">
                    Your <code className="text-sky-400">manifest.json</code> must specify <code className="text-sky-400">&quot;display&quot;: &quot;standalone&quot;</code> or <code className="text-sky-400">&quot;minimal-ui&quot;</code>.
                  </p>
                </div>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800/80 flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-bold text-white">3. Valid PNG / SVG Icons</h4>
                  <p className="text-slate-400 text-xs mt-0.5">
                    Must include at least 192x192 and 512x512 icons, preferably with <code className="text-sky-400">&quot;purpose&quot;: &quot;any maskable&quot;</code> for Android adaptive icons.
                  </p>
                </div>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800/80 flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-bold text-white">4. Active Service Worker Registration</h4>
                  <p className="text-slate-400 text-xs mt-0.5">
                    Chrome requires an active registered Service Worker (<code className="text-sky-400">navigator.serviceWorker.register('/sw.js')</code>).
                  </p>
                </div>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800/80 flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-bold text-white">5. Installed via &quot;Add to Home Screen&quot;</h4>
                  <p className="text-slate-400 text-xs mt-0.5">
                    The user must install the app on their phone. Regular uninstalled web tabs cannot appear in the Android system share sheet!
                  </p>
                </div>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800/80 flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-bold text-white">6. Regex URL Parser in JavaScript</h4>
                  <p className="text-slate-400 text-xs mt-0.5">
                    Always parse both <code className="text-sky-400">?url=</code> and <code className="text-sky-400">?text=</code> using a regular expression because YouTube and social apps embed links inside the text field.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
