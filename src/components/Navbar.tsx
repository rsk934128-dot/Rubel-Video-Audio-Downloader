import React, { useState, useEffect } from 'react';
import { GoogleAuthButton } from './GoogleAuthButton';
import { ProgramsHubModal } from './ProgramsHubModal';
import { AppTab, Language, StorageConfig, DownloadTask } from '../types';
import { getTranslation } from '../utils/translations';
import { usePWA } from '../hooks/usePWA';
import { storagePreferenceManager } from '../services/storagePreferenceManager';
import { 
  Download, 
  History, 
  Code, 
  Smartphone, 
  Languages, 
  Share2, 
  Check, 
  Layers, 
  HardDrive,
  LayoutGrid,
  Activity,
  ShieldCheck,
  Music
} from 'lucide-react';

interface Props {
  activeTab: AppTab;
  setActiveTab: (tab: AppTab) => void;
  language: Language;
  setLanguage: (lang: Language) => void;
  historyCount: number;
  onOpenBypassModal?: () => void;
  onOpenStorageModal?: () => void;
  onOpenAndroidReleaseModal?: () => void;
  onOpenAndroidPermissionModal?: () => void;
  onCloudSyncLoaded?: (cloudTasks: DownloadTask[]) => void;
}

export const Navbar: React.FC<Props> = ({
  activeTab,
  setActiveTab,
  language,
  setLanguage,
  historyCount,
  onOpenBypassModal,
  onOpenStorageModal,
  onOpenAndroidReleaseModal,
  onOpenAndroidPermissionModal,
  onCloudSyncLoaded,
}) => {
  const t = getTranslation(language);
  const { isInstallable, isInstalled, isIOS, install } = usePWA();
  const [showIOSModal, setShowIOSModal] = useState(false);
  const [showProgramsModal, setShowProgramsModal] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [storageConfig, setStorageConfig] = useState<StorageConfig>(storagePreferenceManager.getConfig());

  useEffect(() => {
    return storagePreferenceManager.subscribe((c) => setStorageConfig(c));
  }, []);

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: t.appTitle,
          text: t.appSubtitle,
          url: window.location.href,
        });
      } catch {
        // User cancelled
      }
    } else {
      navigator.clipboard.writeText(window.location.href);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    }
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-800/80 bg-slate-950/90 backdrop-blur-md overflow-x-hidden">
      <div className="max-w-6xl mx-auto px-3 sm:px-6 h-16 flex items-center justify-between gap-2 sm:gap-4">
        {/* Brand */}
        <div 
          onClick={() => setActiveTab('downloader')}
          className="flex items-center gap-2.5 sm:gap-3 cursor-pointer group select-none shrink-0"
        >
          <div className="relative w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-tr from-rose-500 via-pink-500 to-sky-500 p-0.5 shadow-lg shadow-rose-500/20 group-hover:shadow-rose-500/40 transition">
            <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center">
              <Download className="w-4 h-4 sm:w-5 sm:h-5 text-rose-400 group-hover:scale-110 transition duration-200" />
            </div>
          </div>
          <div>
            <h1 className="text-sm sm:text-base md:text-lg font-bold text-white tracking-tight flex items-center gap-1.5 sm:gap-2">
              <span>{language === 'bn' ? 'ডাউনলোডার প্রো' : 'Downloader Pro'}</span>
              <span className="hidden sm:inline-block px-1.5 py-0.5 text-[9px] sm:text-[10px] font-semibold tracking-wider uppercase bg-rose-500/10 text-rose-400 border border-rose-500/20 rounded">
                MP3 & HD
              </span>
            </h1>
            <p className="text-[10px] sm:text-[11px] text-slate-400 hidden md:block">
              {language === 'bn' ? 'সব প্ল্যাটফর্মের ভিডিও ও অডিও এক্সট্র্যাক্টর' : 'Universal Media & Stream Extractor'}
            </p>
          </div>
        </div>

        {/* Navigation Tabs (Desktop & Tablet) */}
        <nav className="hidden md:flex items-center gap-1 overflow-x-auto no-scrollbar py-1">
          <button
            id="nav-tab-downloader"
            onClick={() => setActiveTab('downloader')}
            className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium transition shrink-0 ${
              activeTab === 'downloader'
                ? 'bg-rose-500/15 text-rose-400 border border-rose-500/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
            }`}
          >
            <Download className="w-4 h-4" />
            <span>{language === 'bn' ? 'ডাউনলোড' : 'Download'}</span>
          </button>

          <button
            id="nav-tab-music"
            onClick={() => setActiveTab('music')}
            className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium transition shrink-0 ${
              activeTab === 'music'
                ? 'bg-rose-500/15 text-rose-400 border border-rose-500/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
            }`}
          >
            <Music className="w-4 h-4 text-rose-400" />
            <span>{language === 'bn' ? 'গান ও অ্যালবাম' : 'Music & Songs'}</span>
          </button>

          <button
            id="nav-tab-batch"
            onClick={() => setActiveTab('batch')}
            className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium transition shrink-0 ${
              activeTab === 'batch'
                ? 'bg-rose-500/15 text-rose-400 border border-rose-500/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
            }`}
          >
            <Layers className="w-4 h-4 text-rose-400" />
            <span>{language === 'bn' ? 'ব্যাচ কিউ' : 'Batch Queue'}</span>
          </button>

          <button
            id="nav-tab-history"
            onClick={() => setActiveTab('history')}
            className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium transition relative shrink-0 ${
              activeTab === 'history'
                ? 'bg-rose-500/15 text-rose-400 border border-rose-500/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
            }`}
          >
            <History className="w-4 h-4" />
            <span>{language === 'bn' ? 'হিস্টোরি' : 'History'}</span>
            {historyCount > 0 && (
              <span className="ml-0.5 px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-rose-500 text-white">
                {historyCount}
              </span>
            )}
          </button>

          <button
            id="nav-tab-pwa-guide"
            onClick={() => setActiveTab('pwa-guide')}
            className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium transition shrink-0 ${
              activeTab === 'pwa-guide'
                ? 'bg-rose-500/15 text-rose-400 border border-rose-500/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
            }`}
          >
            <Share2 className="w-4 h-4 text-sky-400" />
            <span>{language === 'bn' ? 'শেয়ার গাইড' : 'Share Guide'}</span>
          </button>

          <button
            id="nav-tab-blueprint"
            onClick={() => setActiveTab('blueprint')}
            className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium transition shrink-0 ${
              activeTab === 'blueprint'
                ? 'bg-rose-500/15 text-rose-400 border border-rose-500/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
            }`}
          >
            <Code className="w-4 h-4" />
            <span>{language === 'bn' ? 'ব্লুপ্রিন্ট' : 'Blueprint'}</span>
          </button>
        </nav>

        {/* Right Action Controls */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          {/* Highlighted Programs Hub Button (Opens One-by-One Program Viewer) */}
          <button
            id="programs-hub-btn"
            onClick={() => setShowProgramsModal(true)}
            className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl text-xs font-bold bg-gradient-to-r from-rose-500/20 via-purple-500/20 to-sky-500/20 border border-rose-500/40 text-rose-300 hover:text-white hover:border-rose-400 transition shadow-sm active:scale-95 shrink-0"
            title="Browse all tools & programs one by one"
          >
            <LayoutGrid className="w-3.5 h-3.5 text-rose-400" />
            <span>{language === 'bn' ? 'প্রোগ্রামসমূহ (৮)' : 'Programs (8)'}</span>
          </button>

          {/* Optional Wide Desktop Direct Shortcuts */}
          <div className="hidden xl:flex items-center gap-1.5">
            {/* Quick Shortcut */}
            <button
              onClick={() => {
                const fab = document.getElementById('shortcut-floating-fab-btn');
                if (fab) fab.click();
              }}
              className="flex items-center gap-1 px-2 py-1.5 rounded-lg text-xs font-semibold bg-rose-500/10 border border-rose-500/25 text-rose-300 hover:bg-rose-500/20 hover:text-white transition"
              title="Shortcut Download (Alt + D)"
            >
              <Download className="w-3.5 h-3.5" />
              <span>{language === 'bn' ? 'শর্টকাট' : 'Quick'}</span>
            </button>

            {/* Storage Destination */}
            <button
              onClick={onOpenStorageModal}
              className="flex items-center gap-1 px-2 py-1.5 rounded-lg text-xs font-semibold bg-emerald-500/10 border border-emerald-500/25 text-emerald-300 hover:bg-emerald-500/20 hover:text-white transition"
              title="SD Card Storage"
            >
              <HardDrive className="w-3.5 h-3.5" />
              <span>{storageConfig.destination === 'sd_card' ? 'SD কার্ড' : 'স্টোরেজ'}</span>
            </button>

            {/* Android APK */}
            <button
              onClick={onOpenAndroidReleaseModal}
              className="flex items-center gap-1 px-2 py-1.5 rounded-lg text-xs font-semibold bg-sky-500/10 border border-sky-500/25 text-sky-300 hover:bg-sky-500/20 hover:text-white transition"
              title="Android APK GitHub Release"
            >
              <Smartphone className="w-3.5 h-3.5" />
              <span>APK</span>
            </button>
          </div>

          {/* Language Toggle */}
          <button
            id="lang-toggle-btn"
            onClick={() => setLanguage(language === 'bn' ? 'en' : 'bn')}
            className="flex items-center gap-1 px-2 sm:px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-slate-900 border border-slate-800 text-slate-300 hover:text-white hover:border-slate-700 transition shrink-0"
            title="Switch Language"
          >
            <Languages className="w-3.5 h-3.5 text-sky-400" />
            <span>{language === 'bn' ? 'EN' : 'বাং'}</span>
          </button>

          {/* Android Permissions & Login Trigger */}
          <button
            id="android-permissions-header-btn"
            onClick={onOpenAndroidPermissionModal}
            className="flex items-center gap-1 px-2 sm:px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 hover:bg-emerald-500/20 hover:text-white transition shrink-0"
            title="Android Permissions & Login Control"
          >
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span className="hidden sm:inline">{language === 'bn' ? 'পারমিশন' : 'Perms'}</span>
          </button>

          {/* Google Chrome Authentication & Sign In */}
          <GoogleAuthButton 
            language={language} 
            onCloudSyncLoaded={onCloudSyncLoaded} 
          />
        </div>
      </div>

      {/* Mobile Sub-Navbar: Smooth Horizontal Scroll Tabs with ZERO screen overflow */}
      <div className="md:hidden border-t border-slate-900/80 bg-slate-950/95 px-3 py-1.5 overflow-x-auto no-scrollbar flex items-center gap-1.5 overscroll-contain">
        <button
          onClick={() => setActiveTab('downloader')}
          className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-semibold whitespace-nowrap transition shrink-0 ${
            activeTab === 'downloader'
              ? 'bg-rose-500/20 text-rose-400 border border-rose-500/40'
              : 'text-slate-400 bg-slate-900/60'
          }`}
        >
          <Download className="w-3 h-3" />
          <span>{language === 'bn' ? 'ডাউনলোড' : 'Download'}</span>
        </button>

        <button
          onClick={() => setActiveTab('music')}
          className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-semibold whitespace-nowrap transition shrink-0 ${
            activeTab === 'music'
              ? 'bg-rose-500/20 text-rose-400 border border-rose-500/40'
              : 'text-slate-400 bg-slate-900/60'
          }`}
        >
          <Music className="w-3 h-3 text-rose-400" />
          <span>{language === 'bn' ? 'গান ও অ্যালবাম' : 'Songs'}</span>
        </button>

        <button
          onClick={() => setActiveTab('batch')}
          className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-semibold whitespace-nowrap transition shrink-0 ${
            activeTab === 'batch'
              ? 'bg-rose-500/20 text-rose-400 border border-rose-500/40'
              : 'text-slate-400 bg-slate-900/60'
          }`}
        >
          <Layers className="w-3 h-3 text-rose-400" />
          <span>{language === 'bn' ? 'ব্যাচ কিউ' : 'Batch'}</span>
        </button>

        <button
          onClick={() => setActiveTab('history')}
          className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-semibold whitespace-nowrap transition shrink-0 ${
            activeTab === 'history'
              ? 'bg-rose-500/20 text-rose-400 border border-rose-500/40'
              : 'text-slate-400 bg-slate-900/60'
          }`}
        >
          <History className="w-3 h-3" />
          <span>{language === 'bn' ? 'হিস্টোরি' : 'History'}</span>
          {historyCount > 0 && (
            <span className="px-1 py-0.2 rounded-full text-[9px] font-bold bg-rose-500 text-white">
              {historyCount}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('pwa-guide')}
          className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-semibold whitespace-nowrap transition shrink-0 ${
            activeTab === 'pwa-guide'
              ? 'bg-rose-500/20 text-rose-400 border border-rose-500/40'
              : 'text-slate-400 bg-slate-900/60'
          }`}
        >
          <Share2 className="w-3 h-3 text-sky-400" />
          <span>{language === 'bn' ? 'শেয়ার গাইড' : 'Guide'}</span>
        </button>

        <button
          onClick={() => setActiveTab('blueprint')}
          className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-semibold whitespace-nowrap transition shrink-0 ${
            activeTab === 'blueprint'
              ? 'bg-rose-500/20 text-rose-400 border border-rose-500/40'
              : 'text-slate-400 bg-slate-900/60'
          }`}
        >
          <Code className="w-3 h-3" />
          <span>{language === 'bn' ? 'ব্লুপ্রিন্ট' : 'Code'}</span>
        </button>

        <button
          onClick={() => setShowProgramsModal(true)}
          className="flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] font-bold text-rose-300 bg-rose-500/10 border border-rose-500/30 whitespace-nowrap shrink-0"
        >
          <LayoutGrid className="w-3 h-3 text-rose-400" />
          <span>{language === 'bn' ? 'সকল প্রোগ্রাম' : 'All Programs'}</span>
        </button>
      </div>

      {/* Programs Hub Modal (One-by-One Program Viewer) */}
      <ProgramsHubModal
        isOpen={showProgramsModal}
        onClose={() => setShowProgramsModal(false)}
        language={language}
        setActiveTab={setActiveTab}
        onOpenStorageModal={() => {
          if (onOpenStorageModal) onOpenStorageModal();
        }}
        onOpenAndroidReleaseModal={() => {
          if (onOpenAndroidReleaseModal) onOpenAndroidReleaseModal();
        }}
        onOpenBypassModal={() => {
          if (onOpenBypassModal) onOpenBypassModal();
        }}
        onOpenAndroidPermissionModal={() => {
          if (onOpenAndroidPermissionModal) onOpenAndroidPermissionModal();
        }}
      />
    </header>
  );
};
