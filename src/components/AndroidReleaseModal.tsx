import React, { useState, useEffect } from 'react';
import { 
  Smartphone, 
  Download, 
  ExternalLink, 
  Copy, 
  Check, 
  Terminal, 
  CheckCircle2, 
  Layers, 
  X, 
  Sparkles, 
  ShieldCheck,
  ArrowRight,
  GitBranch,
  FileCode,
  Info
} from 'lucide-react';
import { Language } from '../types';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  language: Language;
}

const DEFAULT_REPO = 'universal-downloader-pro';

export const AndroidReleaseModal: React.FC<Props> = ({ isOpen, onClose, language }) => {
  const [githubUser, setGithubUser] = useState<string>(() => {
    return localStorage.getItem('user_github_handle') || '';
  });
  const [repoName, setRepoName] = useState<string>(() => {
    return localStorage.getItem('user_github_repo') || DEFAULT_REPO;
  });
  const [activeTab, setActiveTab] = useState<'download' | 'guide' | 'commands'>('download');
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  useEffect(() => {
    if (githubUser) {
      localStorage.setItem('user_github_handle', githubUser);
    }
  }, [githubUser]);

  useEffect(() => {
    if (repoName) {
      localStorage.setItem('user_github_repo', repoName);
    }
  }, [repoName]);

  if (!isOpen) return null;

  const currentRepoPath = githubUser ? `${githubUser}/${repoName}` : `<your-username>/${repoName}`;
  const releasesUrl = githubUser ? `https://github.com/${githubUser}/${repoName}/releases` : `https://github.com`;
  const latestApkUrl = githubUser 
    ? `https://github.com/${githubUser}/${repoName}/releases/latest/download/Universal-Video-Downloader-latest.apk`
    : '#';

  const copyToClipboard = (text: string, index: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const gitPushCommands = [
    `git add .`,
    `git commit -m "feat: Add Android Capacitor configuration & GitHub Release action"`,
    `git branch -M main`,
    `git remote add origin https://github.com/${githubUser || '<username>'}/${repoName}.git`,
    `git push -u origin main`
  ].join('\n');

  const gitTagReleaseCommands = [
    `# Create a release version tag (e.g. v1.0.0)`,
    `git tag v1.0.0`,
    `git push origin v1.0.0`
  ].join('\n');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden my-6">
        {/* Header */}
        <div className="relative bg-gradient-to-r from-emerald-600 via-teal-600 to-sky-600 p-6 text-white">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-1.5 rounded-lg bg-black/20 hover:bg-black/40 text-white/80 hover:text-white transition"
            title="Close"
          >
            <X className="w-5 h-5" />
          </button>
          
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/20 shadow-inner">
              <Smartphone className="w-6 h-6 text-emerald-200 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded text-[10px] font-bold tracking-wider uppercase bg-emerald-950/60 text-emerald-300 border border-emerald-400/30">
                  GitHub CI/CD
                </span>
                <span className="text-xs text-white/80">Capacitor v8 • Android SDK</span>
              </div>
              <h2 className="text-xl font-bold tracking-tight text-white mt-1">
                {language === 'bn' 
                  ? 'গিটহাব থেকে অ্যান্ড্রয়েড এপিকে রিলিজ' 
                  : 'GitHub Actions Android APK Release'}
              </h2>
            </div>
          </div>
          <p className="mt-2 text-xs sm:text-sm text-emerald-100 max-w-xl">
            {language === 'bn'
              ? 'অটোমেটেড গিটহাব অ্যাকশন্সের মাধ্যমে সরাসরি আপনার অ্যান্ড্রয়েড ফোনের জন্য ইনস্টলযোগ্য APK বিল্ড ও রিলিজ তৈরি করুন।'
              : 'Automated GitHub Actions CI/CD to build, sign, and publish installable APKs directly to your GitHub Releases.'}
          </p>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-800 bg-slate-950/50 px-6 pt-3 gap-2">
          <button
            onClick={() => setActiveTab('download')}
            className={`pb-3 px-3 text-xs sm:text-sm font-semibold border-b-2 transition flex items-center gap-1.5 ${
              activeTab === 'download'
                ? 'border-emerald-500 text-emerald-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Download className="w-4 h-4" />
            <span>{language === 'bn' ? 'এপিকে ডাউনলোড ও লিঙ্ক' : 'APK Download'}</span>
          </button>
          <button
            onClick={() => setActiveTab('commands')}
            className={`pb-3 px-3 text-xs sm:text-sm font-semibold border-b-2 transition flex items-center gap-1.5 ${
              activeTab === 'commands'
                ? 'border-emerald-500 text-emerald-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Terminal className="w-4 h-4" />
            <span>{language === 'bn' ? 'গিটহাব রিলিজ কমান্ড' : 'Release Commands'}</span>
          </button>
          <button
            onClick={() => setActiveTab('guide')}
            className={`pb-3 px-3 text-xs sm:text-sm font-semibold border-b-2 transition flex items-center gap-1.5 ${
              activeTab === 'guide'
                ? 'border-emerald-500 text-emerald-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Info className="w-4 h-4" />
            <span>{language === 'bn' ? 'ইনস্টলেশন গাইড' : 'Install Guide'}</span>
          </button>
        </div>

        {/* Tab Content */}
        <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
          {/* Repository Configuration */}
          <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-4">
            <h3 className="text-xs font-semibold text-slate-300 uppercase tracking-wider mb-3 flex items-center gap-1.5">
              <GitBranch className="w-3.5 h-3.5 text-emerald-400" />
              <span>{language === 'bn' ? 'আপনার গিটহাব রিপোজিটরি কনফিগার করুন' : 'Your GitHub Repository Configuration'}</span>
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] text-slate-400 block mb-1">
                  {language === 'bn' ? 'গিটহাব ইউজারনেম (GitHub Username)' : 'GitHub Username / Org'}
                </label>
                <input
                  type="text"
                  value={githubUser}
                  onChange={(e) => setGithubUser(e.target.value.trim())}
                  placeholder="e.g. shafiul-alam"
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition"
                />
              </div>
              <div>
                <label className="text-[11px] text-slate-400 block mb-1">
                  {language === 'bn' ? 'রিপোজিটরির নাম (Repo Name)' : 'Repository Name'}
                </label>
                <input
                  type="text"
                  value={repoName}
                  onChange={(e) => setRepoName(e.target.value.trim())}
                  placeholder="universal-downloader-pro"
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition"
                />
              </div>
            </div>
            <p className="mt-2 text-[11px] text-slate-400">
              {language === 'bn'
                ? `বর্তমান রিপো: github.com/${currentRepoPath}`
                : `Target Repo: github.com/${currentRepoPath}`}
            </p>
          </div>

          {activeTab === 'download' && (
            <div className="space-y-4">
              {/* Direct Download Card */}
              <div className="bg-gradient-to-br from-slate-950 to-slate-900 border border-emerald-500/30 rounded-xl p-5 shadow-lg relative overflow-hidden">
                <div className="absolute top-0 right-0 p-4 opacity-10">
                  <Smartphone className="w-24 h-24 text-emerald-400" />
                </div>
                
                <div className="relative z-10">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                    <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider">
                      {language === 'bn' ? 'রেডি টু ডাউনলোড' : 'Production Build Ready'}
                    </span>
                  </div>
                  <h4 className="text-base sm:text-lg font-bold text-white">
                    Universal Video Downloader Pro v1.0.0 (.apk)
                  </h4>
                  <p className="text-xs text-slate-300 mt-1 max-w-md">
                    {language === 'bn'
                      ? 'সম্পূর্ণ নো-ওয়াটারমার্ক ভিডিও ডাউনলোডার, অডিও এক্সট্র্যাক্টর, এসডি কার্ড স্টোরেজ সাপোর্ট ও শেয়ার ইন্টেন্ট সুবিধাসহ।'
                      : 'High-speed media extractor with SD card destination picker and Android share sheet intent support.'}
                  </p>

                  <div className="mt-5 flex flex-wrap items-center gap-3">
                    <a
                      href={releasesUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-slate-950 font-bold text-xs sm:text-sm shadow-lg shadow-emerald-950/50 hover:brightness-110 transition active:scale-95"
                    >
                      <Download className="w-4 h-4" />
                      <span>{language === 'bn' ? 'গিটহাব রিলিজ থেকে APK ডাউনলোড' : 'Download APK from Releases'}</span>
                      <ExternalLink className="w-3.5 h-3.5 ml-1" />
                    </a>

                    <a
                      href={githubUser ? `https://github.com/${githubUser}/${repoName}/actions` : 'https://github.com'}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition"
                    >
                      <Layers className="w-3.5 h-3.5 text-sky-400" />
                      <span>{language === 'bn' ? 'GitHub Actions স্ট্যাটাস' : 'GitHub Actions Status'}</span>
                    </a>
                  </div>
                </div>
              </div>

              {/* Workflow Pipeline Features */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="p-3 rounded-lg bg-slate-950 border border-slate-800">
                  <div className="flex items-center gap-2 text-emerald-400 text-xs font-semibold">
                    <ShieldCheck className="w-4 h-4" />
                    <span>{language === 'bn' ? 'অটোমেটেড বিল্ড' : 'Automated CI/CD'}</span>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1">
                    {language === 'bn' ? 'Java 17 ও Android SDK দিয়ে Ubuntu রানারে বিল্ড হয়' : 'Builds with Java 17 and Android SDK on Ubuntu runners'}
                  </p>
                </div>

                <div className="p-3 rounded-lg bg-slate-950 border border-slate-800">
                  <div className="flex items-center gap-2 text-sky-400 text-xs font-semibold">
                    <Sparkles className="w-4 h-4" />
                    <span>{language === 'bn' ? 'ট্যাগ রিলিজ' : 'Tag & Release'}</span>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1">
                    {language === 'bn' ? 'git tag v1.0.0 পুশ করলেই নতুন রিলিজ তৈরি হয়' : 'Pushing git tags automatically attaches release APKs'}
                  </p>
                </div>

                <div className="p-3 rounded-lg bg-slate-950 border border-slate-800">
                  <div className="flex items-center gap-2 text-pink-400 text-xs font-semibold">
                    <Smartphone className="w-4 h-4" />
                    <span>{language === 'bn' ? 'অ্যান্ড্রয়েড শেয়ার' : 'Share Intent'}</span>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1">
                    {language === 'bn' ? 'YouTube/TikTok এর শেয়ার শিট থেকে সরাসরি ওপেন হয়' : 'Opens directly from Android native share sheet'}
                  </p>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'commands' && (
            <div className="space-y-4">
              {/* Git Push Step */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs font-bold text-white flex items-center gap-1.5">
                    <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-[11px]">1</span>
                    {language === 'bn' ? 'প্রথমবার কোড গিটহাবে পুশ করার কমান্ড' : 'Push Code to GitHub (Initial Setup)'}
                  </span>
                  <button
                    onClick={() => copyToClipboard(gitPushCommands, 1)}
                    className="flex items-center gap-1 text-[11px] text-slate-400 hover:text-white px-2 py-1 rounded bg-slate-800 border border-slate-700"
                  >
                    {copiedIndex === 1 ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                    <span>{copiedIndex === 1 ? 'Copied' : 'Copy'}</span>
                  </button>
                </div>
                <pre className="bg-slate-950 p-3 rounded-xl border border-slate-800 text-[11px] font-mono text-emerald-300 overflow-x-auto">
                  {gitPushCommands}
                </pre>
              </div>

              {/* Tag Release Step */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs font-bold text-white flex items-center gap-1.5">
                    <span className="w-5 h-5 rounded-full bg-sky-500/20 text-sky-400 flex items-center justify-center text-[11px]">2</span>
                    {language === 'bn' ? 'নতুন এপিকে রিলিজ তৈরি করার কমান্ড (Tag Release)' : 'Trigger New Release via Git Tag'}
                  </span>
                  <button
                    onClick={() => copyToClipboard(gitTagReleaseCommands, 2)}
                    className="flex items-center gap-1 text-[11px] text-slate-400 hover:text-white px-2 py-1 rounded bg-slate-800 border border-slate-700"
                  >
                    {copiedIndex === 2 ? <Check className="w-3 h-3 text-sky-400" /> : <Copy className="w-3 h-3" />}
                    <span>{copiedIndex === 2 ? 'Copied' : 'Copy'}</span>
                  </button>
                </div>
                <pre className="bg-slate-950 p-3 rounded-xl border border-slate-800 text-[11px] font-mono text-sky-300 overflow-x-auto">
                  {gitTagReleaseCommands}
                </pre>
              </div>

              {/* Workflow File Details */}
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-400 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FileCode className="w-4 h-4 text-emerald-400" />
                  <span>CI/CD Workflow File: <code>.github/workflows/build-android-apk.yml</code></span>
                </div>
                <span className="text-emerald-400 font-semibold text-[11px]">Active</span>
              </div>
            </div>
          )}

          {activeTab === 'guide' && (
            <div className="space-y-4 text-xs sm:text-sm text-slate-300">
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
                <h4 className="font-bold text-white flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>{language === 'bn' ? 'অ্যান্ড্রয়েড ফোনে যেভাবে APK ইনস্টল করবেন' : 'How to Install APK on Android'}</span>
                </h4>
                
                <ol className="list-decimal list-inside space-y-2 text-slate-300 leading-relaxed text-xs sm:text-sm pl-1">
                  <li>
                    {language === 'bn' 
                      ? 'GitHub Releases থেকে আপনার পছন্দের ভার্সনের Universal-Video-Downloader.apk ফাইল ডাউনলোড করুন।'
                      : 'Download Universal-Video-Downloader.apk from GitHub Releases tab.'}
                  </li>
                  <li>
                    {language === 'bn'
                      ? 'ডাউনলোড শেষ হলে নোটিফিকেশন বার অথবা আপনার ফাইল ম্যানেজার থেকে APK ফাইলটিতে ট্যাপ করুন।'
                      : 'Tap the downloaded APK notification or open it from your phone Download folder.'}
                  </li>
                  <li>
                    {language === 'bn'
                      ? 'যদি আপনার ফোন "Blocked by Play Protect" অথবা "Install unknown apps" সতর্কবার্তা দেখায়, তবে Settings-এ যান এবং "Allow from this source" অপশনটি চালু করে দিন।'
                      : 'If Android displays "Install unknown apps", tap Settings and switch on "Allow from this source".'}
                  </li>
                  <li>
                    {language === 'bn'
                      ? '"Install" বাটনে চাপ দিন এবং ইনস্টল সম্পন্ন হলে সরাসরি "Open" করুন।'
                      : 'Tap Install. Once complete, tap Open to run Downloader Pro.'}
                  </li>
                </ol>
              </div>

              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                <h4 className="font-bold text-white flex items-center gap-2">
                  <Smartphone className="w-4 h-4 text-sky-400" />
                  <span>{language === 'bn' ? 'সোশ্যাল মিডিয়া থেকে সরাসরি ডাউনলোডার খোলার নিয়ম' : 'How Android Share Intent Works'}</span>
                </h4>
                <p className="text-xs text-slate-400 leading-relaxed">
                  {language === 'bn'
                    ? 'YouTube, Facebook, TikTok বা Instagram অ্যাপে কোনো ভিডিও দেখার সময় Share (শেয়ার) বাটনে চাপ দিন। শেয়ার অপশনে "Downloader Pro" দেখতে পাবেন—সেখানে চাপ দিলেই ভিডিও লিঙ্কটি স্বয়ংক্রিয়ভাবে ডাউনলোডারের মধ্যে চলে আসবে এবং ডাউনলোড শুরু করার অপশন পাবেন!'
                    : 'Whenever browsing YouTube, TikTok, Facebook or Instagram, hit the native Share button. Choose Downloader Pro from the sheet — the video link will automatically load and prepare high-speed download options!'}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-950 flex items-center justify-between">
          <span className="text-[11px] text-slate-500">
            {language === 'bn' ? 'Android 7.0+ (API 24+) সমর্থিত' : 'Supports Android 7.0+ (API Level 24+)'}
          </span>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition"
          >
            {language === 'bn' ? 'বন্ধ করুন' : 'Close'}
          </button>
        </div>
      </div>
    </div>
  );
};
