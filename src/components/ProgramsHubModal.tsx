import React, { useState, useEffect } from 'react';
import { 
  Download, 
  HardDrive, 
  Smartphone, 
  Activity, 
  Layers, 
  Share2, 
  Code, 
  Cloud, 
  X, 
  ChevronLeft, 
  ChevronRight, 
  Sparkles, 
  ArrowRight, 
  LayoutGrid, 
  ListOrdered,
  CheckCircle,
  ExternalLink,
  ShieldCheck,
  Music
} from 'lucide-react';
import { Language, AppTab } from '../types';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  language: Language;
  setActiveTab: (tab: AppTab) => void;
  onOpenStorageModal: () => void;
  onOpenAndroidReleaseModal: () => void;
  onOpenBypassModal: () => void;
  onOpenAndroidPermissionModal?: () => void;
}

export const ProgramsHubModal: React.FC<Props> = ({
  isOpen,
  onClose,
  language,
  setActiveTab,
  onOpenStorageModal,
  onOpenAndroidReleaseModal,
  onOpenBypassModal,
  onOpenAndroidPermissionModal,
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [viewMode, setViewMode] = useState<'one-by-one' | 'all'>('one-by-one');

  const programs = [
    {
      id: 'youtube-song-search',
      titleBn: 'ইউটিউব গান ও অ্যালবাম সার্চ ও প্লেয়ার',
      titleEn: 'YouTube Songs & Album Player',
      categoryBn: 'মিউজিক ইঞ্জিন',
      categoryEn: 'Music Engine',
      color: 'from-purple-500 to-pink-600',
      bgColor: 'bg-purple-500/10 border-purple-500/30 text-purple-400',
      icon: Music,
      badgeBn: 'অ্যালবাম আর্ট ও লক স্ক্রিন সাপোর্ট',
      badgeEn: 'Album Art & Lock Screen',
      descBn: 'ইউটিউব থেকে গান ও সম্পূর্ণ অ্যালবাম নাম দিয়ে খুঁজে বের করুন, অ্যালবাম কভার আর্ট সহ শুনুন এবং ফোন লক করলেও ব্যাকগ্রাউন্ডে নিরবচ্ছিন্ন অডিও (MP3) ও ভিডিও (MP4) ডাউনলোড করুন।',
      descEn: 'Search YouTube for songs & albums, listen with high-res album covers, and download audio (MP3) or video (MP4) seamlessly even with screen locked.',
      actionBn: 'গান ও অ্যালবাম সার্চে যান',
      actionEn: 'Open Music Engine',
      onRun: () => {
        onClose();
        setActiveTab('music');
      }
    },
    {
      id: 'shortcut-download',
      titleBn: 'শর্টকাট ডাউনলোডার',
      titleEn: 'Quick Shortcut Downloader',
      categoryBn: 'ডাউনলোড টুল',
      categoryEn: 'Download Tool',
      color: 'from-rose-500 to-pink-600',
      bgColor: 'bg-rose-500/10 border-rose-500/30 text-rose-400',
      icon: Download,
      badgeBn: 'শর্টকাট: Alt + D',
      badgeEn: 'Shortcut: Alt + D',
      descBn: 'কীবোর্ড শর্টকাট (Alt + D) বা স্ক্রিনের ফ্ল্যাটিং বাটন দিয়ে যেকোনো ভিডিওর লিঙ্ক পেস্ট করে সরাসরি হাই-স্পিড অডিও/ভিডিও ডাউনলোড শুরু করুন।',
      descEn: 'Instantly paste media URLs via keyboard shortcut or floating FAB to initiate rapid audio/video extractions.',
      actionBn: 'শর্টকাট ডাউনলোডার খুলুন',
      actionEn: 'Launch Quick Downloader',
      onRun: () => {
        onClose();
        setTimeout(() => {
          const fab = document.getElementById('shortcut-floating-fab-btn');
          if (fab) fab.click();
        }, 150);
      }
    },
    {
      id: 'sd-card-storage',
      titleBn: 'এসডি কার্ড ও মেমোরি স্টোরেজ',
      titleEn: 'SD Card & Phone Storage',
      categoryBn: 'স্টোরেজ সেটিংস',
      categoryEn: 'Storage Settings',
      color: 'from-emerald-500 to-teal-600',
      bgColor: 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400',
      icon: HardDrive,
      badgeBn: 'মেমোরি কার্ড সমর্থিত',
      badgeEn: 'SD Card Supported',
      descBn: 'ডাউনলোড হওয়া MP4 ভিডিও ও MP3 গানগুলো স্বয়ংক্রিয়ভাবে সরাসরি আপনার মেমোরি কার্ড (SD Card) অথবা ফোন মেমোরির নির্দিষ্ট ফোল্ডারে সেভ করুন।',
      descEn: 'Configure default download destination directly to your micro SD Card or phone storage folder.',
      actionBn: 'মেমোরি কার্ড সেটিংস করুন',
      actionEn: 'Configure SD Storage',
      onRun: () => {
        onClose();
        onOpenStorageModal();
      }
    },
    {
      id: 'android-apk-release',
      titleBn: 'অ্যান্ড্রয়েড এপিকে রিলিজ (GitHub CI/CD)',
      titleEn: 'Android APK Release & CI/CD',
      categoryBn: 'মোবাইল অ্যাপ',
      categoryEn: 'Mobile App',
      color: 'from-sky-500 to-cyan-600',
      bgColor: 'bg-sky-500/10 border-sky-500/30 text-sky-400',
      icon: Smartphone,
      badgeBn: 'অটোমেটেড APK বিল্ড',
      badgeEn: 'Automated APK Build',
      descBn: 'গিটহাব অ্যাকশন্স সিআই/সিডি অটোমেশন ব্যবহার করে সরাসরি আপনার অ্যান্ড্রয়েড ফোনের জন্য ইনস্টলযোগ্য APK বিল্ড, রিলিজ ও ডাউনলোড করুন।',
      descEn: 'Generate, sign, and download production-ready Android APKs directly from automated GitHub Releases.',
      actionBn: 'APK রিলিজ সেন্টারে যান',
      actionEn: 'Open APK Release Center',
      onRun: () => {
        onClose();
        onOpenAndroidReleaseModal();
      }
    },
    {
      id: 'android-permissions-login',
      titleBn: 'অ্যান্ড্রয়েড ডিভাইস পারমিশন ও সাইন-ইন',
      titleEn: 'Android Device Permissions & Sign-In',
      categoryBn: 'ডিভাইস কন্ট্রোল',
      categoryEn: 'Device Control',
      color: 'from-emerald-500 to-teal-600',
      bgColor: 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400',
      icon: ShieldCheck,
      badgeBn: 'পারমিশন + ফায়ারস্টোর',
      badgeEn: 'Permissions + Firestore',
      descBn: 'অ্যান্ড্রয়েড ফোনের স্টোরেজ, পুশ নোটিফিকেশন ও স্ক্রিন-অফ ওয়েক লক পারমিশন অন করুন এবং গুগল বা ১-ক্লিক প্রোফাইল দিয়ে সুন্দরভাবে লগইন করুন।',
      descEn: 'Turn on Android device storage, notifications, and wake lock permissions with seamless Google and 1-Click login.',
      actionBn: 'পারমিশন ও লগইন প্যানেল খুলুন',
      actionEn: 'Open Permissions & Login',
      onRun: () => {
        onClose();
        if (onOpenAndroidPermissionModal) {
          onOpenAndroidPermissionModal();
        } else {
          const authBtn = document.getElementById('google-auth-btn');
          if (authBtn) authBtn.click();
        }
      }
    },
    {
      id: 'bypass-engine-status',
      titleBn: 'বাইপাস ইঞ্জিন ও বট প্রটেকশন স্ট্যাটাস',
      titleEn: 'Bypass Engine & Bot Protection',
      categoryBn: 'সিস্টেম ইঞ্জিন',
      categoryEn: 'Engine Status',
      color: 'from-amber-500 to-orange-600',
      bgColor: 'bg-amber-500/10 border-amber-500/30 text-amber-400',
      icon: Activity,
      badgeBn: '০ KB এরর মুক্ত',
      badgeEn: 'Zero-byte Protected',
      descBn: 'ইউটিউব, ফেসবুক ও টিকটকের বট ডিটেকশন ও সাইন-ইন ব্লকিং বাইপাস করতে সার্ভার-সাইড FFmpeg রেজিলিয়েন্স ও ৬টি ব্যাকআপ ইঞ্জিন মনিটর করুন।',
      descEn: 'Monitor server-side resilient streaming and 6 fallback engines guaranteeing zero 0-KB/empty download errors.',
      actionBn: 'ইঞ্জিন স্ট্যাটাস দেখুন',
      actionEn: 'Check Engine Status',
      onRun: () => {
        onClose();
        onOpenBypassModal();
      }
    },
    {
      id: 'batch-downloader',
      titleBn: 'মাল্টি-ইউআরএল ব্যাচ কিউ ডাউনলোডার',
      titleEn: 'Multi-URL Batch Downloader Queue',
      categoryBn: 'ব্যাচ প্রসেসিং',
      categoryEn: 'Batch Processing',
      color: 'from-purple-500 to-pink-600',
      bgColor: 'bg-purple-500/10 border-purple-500/30 text-purple-400',
      icon: Layers,
      badgeBn: 'একসাথে বহু ভিডিও',
      badgeEn: 'Queue Multiple URLs',
      descBn: 'একসাথে ৫ থেকে ১০টি বা ততোধিক বিভিন্ন প্ল্যাটফর্মের ভিডিও লিঙ্ক পেস্ট করে অটোমেটিক কিউ সিস্টেমে এক ক্লিকে সিরিয়াল ডাউনলোড করুন।',
      descEn: 'Paste multiple video links simultaneously and queue them for automated background extraction.',
      actionBn: 'ব্যাচ কিউ ডাউনলোডার খুলুন',
      actionEn: 'Open Batch Queue',
      onRun: () => {
        onClose();
        setActiveTab('batch');
      }
    },
    {
      id: 'cloud-google-auth',
      titleBn: 'গুগল একাউন্ট ও ক্লাউড সিঙ্ক',
      titleEn: 'Google Chrome Account & Cloud Sync',
      categoryBn: 'একাউন্ট ও ব্যাকআপ',
      categoryEn: 'Account & Sync',
      color: 'from-blue-500 to-indigo-600',
      bgColor: 'bg-blue-500/10 border-blue-500/30 text-blue-400',
      icon: Cloud,
      badgeBn: 'ফায়ারস্টোর সিঙ্ক',
      badgeEn: 'Firestore Synced',
      descBn: 'গুগল একাউন্টে ১-ক্লিকে সাইন ইন করে আপনার সকল ডিভাইসের মধ্যে ডাউনলোড হিস্টোরি সুরক্ষিতভাবে ক্লাউডে ব্যাকআপ ও সিঙ্ক রাখুন।',
      descEn: 'Sign in with your Google Account to automatically synchronize and back up your download history across devices.',
      actionBn: 'গুগল একাউন্ট দেখুন',
      actionEn: 'View Google Account',
      onRun: () => {
        onClose();
        const authBtn = document.getElementById('google-auth-btn');
        if (authBtn) authBtn.click();
      }
    },
    {
      id: 'pwa-share-guide',
      titleBn: 'PWA শেয়ার ইন্টেন্ট টিউটোরিয়াল',
      titleEn: 'PWA Share Target Tutorial',
      categoryBn: 'টিউটোরিয়াল ও গাইড',
      categoryEn: 'Guide & Tutorial',
      color: 'from-teal-500 to-emerald-600',
      bgColor: 'bg-teal-500/10 border-teal-500/30 text-teal-400',
      icon: Share2,
      badgeBn: 'মোবাইল শেয়ার শিট',
      badgeEn: 'Native Share Sheet',
      descBn: 'ইউটিউব, ফেসবুক, টিকটক বা ইনস্টাগ্রাম অ্যাপে ভিডিও দেখার সময় কোনো লিঙ্ক কপি না করেই সরাসরি "Share" বাটন থেকে ডাউনলোডার ওপেন করার কৌশল।',
      descEn: 'Learn how to trigger Downloader Pro directly from the native Android/iOS share sheet with zero link copying.',
      actionBn: 'শেয়ার টিউটোরিয়াল পড়ুন',
      actionEn: 'Read Share Guide',
      onRun: () => {
        onClose();
        setActiveTab('pwa-guide');
      }
    },
    {
      id: 'code-blueprint',
      titleBn: 'সিস্টেম আর্কিটেকচার ব্লুপ্রিন্ট ও কোড',
      titleEn: 'System Architecture & Source Blueprint',
      categoryBn: 'ডেভেলপার স্পেস',
      categoryEn: 'Developer Specs',
      color: 'from-violet-500 to-purple-600',
      bgColor: 'bg-violet-500/10 border-violet-500/30 text-violet-400',
      icon: Code,
      badgeBn: 'yt-dlp + Android Intent',
      badgeEn: 'yt-dlp + Android Intent',
      descBn: 'সম্পূর্ণ অ্যাপ্লিকেশনের স্ট্রিম বাইপাস ইঞ্জিন, অ্যান্ড্রয়েড ইন্টেন্ট এক্সএমএল এবং ফায়ারস্টোর রুলস আর্কিটেকচার কোড সরাসরি পরিদর্শন করুন।',
      descEn: 'Inspect the full engine source architecture, Android manifest intent-filter XML, and secure Firebase rules.',
      actionBn: 'আর্কিটেকচার ব্লুপ্রিন্ট দেখুন',
      actionEn: 'View Code Blueprint',
      onRun: () => {
        onClose();
        setActiveTab('blueprint');
      }
    }
  ];

  // Keyboard navigation for One-by-One mode
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') {
        setCurrentIndex((prev) => (prev + 1) % programs.length);
      } else if (e.key === 'ArrowLeft') {
        setCurrentIndex((prev) => (prev - 1 + programs.length) % programs.length);
      } else if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, programs.length, onClose]);

  if (!isOpen) return null;

  const currentProgram = programs[currentIndex];
  const IconComponent = currentProgram.icon;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-3 sm:p-4 overflow-y-auto animate-in fade-in duration-200">
      <div 
        className="relative w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden my-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Header */}
        <div className="relative bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 p-5 sm:p-6 border-b border-slate-800">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition"
            title="Close"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-2 mb-2">
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold tracking-wider uppercase bg-rose-500/10 text-rose-400 border border-rose-500/20 flex items-center gap-1">
              <Sparkles className="w-3 h-3" />
              <span>{language === 'bn' ? 'সকল প্রোগ্রাম হাব' : 'Programs & Tools Hub'}</span>
            </span>
            <span className="text-xs text-slate-400">
              {programs.length} {language === 'bn' ? 'টি ফিচার সক্রিয়' : 'Features Active'}
            </span>
          </div>

          <h2 className="text-lg sm:text-xl font-bold text-white tracking-tight">
            {language === 'bn' 
              ? 'ডানদিকের সকল প্রোগ্রাম ও সুবিধাসমূহ' 
              : 'All Integrated Programs & Features'}
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            {language === 'bn'
              ? 'স্ক্রিন নড়াচড়া ছাড়া একদম সহজে প্রতিটি প্রোগ্রাম একটা একটা করে বিস্তারিত দেখুন ও এক-ক্লিকে চালু করুন।'
              : 'Inspect and launch each tool one by one with clean navigation and zero horizontal screen shift.'}
          </p>

          {/* Mode Switcher */}
          <div className="mt-4 flex items-center gap-2">
            <button
              onClick={() => setViewMode('one-by-one')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                viewMode === 'one-by-one'
                  ? 'bg-rose-500 text-white shadow-md shadow-rose-950/50'
                  : 'bg-slate-800 text-slate-300 hover:text-white'
              }`}
            >
              <ListOrdered className="w-3.5 h-3.5" />
              <span>{language === 'bn' ? 'একটা একটা করে দেখুন (One-by-One)' : 'One-by-One Viewer'}</span>
            </button>
            <button
              onClick={() => setViewMode('all')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                viewMode === 'all'
                  ? 'bg-rose-500 text-white shadow-md shadow-rose-950/50'
                  : 'bg-slate-800 text-slate-300 hover:text-white'
              }`}
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span>{language === 'bn' ? 'সব প্রোগ্রাম গ্রিড (All Grid)' : 'All Programs'}</span>
            </button>
          </div>
        </div>

        {/* Content Area */}
        {viewMode === 'one-by-one' ? (
          <div className="p-5 sm:p-7 space-y-6">
            {/* Step Counter Indicator */}
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                {language === 'bn' 
                  ? `প্রোগ্রাম ${currentIndex + 1} / ${programs.length}` 
                  : `Program ${currentIndex + 1} of ${programs.length}`}
              </span>
              <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${currentProgram.bgColor}`}>
                {language === 'bn' ? currentProgram.badgeBn : currentProgram.badgeEn}
              </span>
            </div>

            {/* Main Featured Program Card */}
            <div className="relative rounded-2xl bg-gradient-to-b from-slate-950 to-slate-900 border border-slate-800 p-6 sm:p-7 shadow-xl overflow-hidden group">
              {/* Decorative Background Glow */}
              <div className={`absolute top-0 right-0 w-48 h-48 bg-gradient-to-bl ${currentProgram.color} opacity-10 blur-2xl pointer-events-none rounded-full`} />

              <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-6">
                <div className={`w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-gradient-to-tr ${currentProgram.color} p-0.5 shadow-lg flex-shrink-0`}>
                  <div className="w-full h-full bg-slate-950 rounded-[14px] flex items-center justify-center">
                    <IconComponent className="w-8 h-8 sm:w-10 sm:h-10 text-white" />
                  </div>
                </div>

                <div className="flex-1">
                  <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                    {language === 'bn' ? currentProgram.categoryBn : currentProgram.categoryEn}
                  </div>
                  <h3 className="text-lg sm:text-xl font-bold text-white mt-0.5">
                    {language === 'bn' ? currentProgram.titleBn : currentProgram.titleEn}
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-300 mt-2 leading-relaxed">
                    {language === 'bn' ? currentProgram.descBn : currentProgram.descEn}
                  </p>
                </div>
              </div>

              {/* Action Button */}
              <div className="mt-6 pt-5 border-t border-slate-800/80 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                <div className="flex items-center gap-1.5 text-xs text-slate-400">
                  <CheckCircle className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                  <span>
                    {language === 'bn' ? 'সরাসরি ব্যবহারের জন্য প্রস্তুত' : 'Ready for direct launch'}
                  </span>
                </div>

                <button
                  onClick={currentProgram.onRun}
                  className={`flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r ${currentProgram.color} text-white font-bold text-xs sm:text-sm shadow-lg hover:brightness-110 active:scale-95 transition`}
                >
                  <span>{language === 'bn' ? currentProgram.actionBn : currentProgram.actionEn}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Stepper Navigation Controls */}
            <div className="flex items-center justify-between gap-2 pt-2">
              <button
                onClick={() => setCurrentIndex((prev) => (prev - 1 + programs.length) % programs.length)}
                className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs sm:text-sm font-semibold transition active:scale-95 border border-slate-700"
              >
                <ChevronLeft className="w-4 h-4" />
                <span>{language === 'bn' ? 'পূর্ববর্তী' : 'Previous'}</span>
              </button>

              {/* Dots Indicator */}
              <div className="flex items-center gap-1.5 overflow-x-auto py-1">
                {programs.map((prog, idx) => (
                  <button
                    key={prog.id}
                    onClick={() => setCurrentIndex(idx)}
                    className={`h-2.5 rounded-full transition-all duration-300 ${
                      idx === currentIndex
                        ? 'w-7 bg-rose-500'
                        : 'w-2.5 bg-slate-700 hover:bg-slate-600'
                    }`}
                    title={language === 'bn' ? prog.titleBn : prog.titleEn}
                  />
                ))}
              </div>

              <button
                onClick={() => setCurrentIndex((prev) => (prev + 1) % programs.length)}
                className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs sm:text-sm font-semibold transition active:scale-95 border border-slate-700"
              >
                <span>{language === 'bn' ? 'পরবর্তী' : 'Next'}</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        ) : (
          /* All Programs Grid View */
          <div className="p-5 sm:p-6 max-h-[60vh] overflow-y-auto space-y-3">
            {programs.map((prog, idx) => {
              const ItemIcon = prog.icon;
              return (
                <div
                  key={prog.id}
                  onClick={prog.onRun}
                  className="flex items-start sm:items-center justify-between gap-3 p-3.5 sm:p-4 rounded-xl bg-slate-950 hover:bg-slate-800/80 border border-slate-800 hover:border-slate-700 transition cursor-pointer group"
                >
                  <div className="flex items-start sm:items-center gap-3.5 min-w-0">
                    <div className={`w-10 h-10 rounded-xl bg-gradient-to-tr ${prog.color} p-0.5 flex-shrink-0 shadow-md`}>
                      <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center">
                        <ItemIcon className="w-5 h-5 text-white group-hover:scale-110 transition" />
                      </div>
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <h4 className="text-xs sm:text-sm font-bold text-white group-hover:text-rose-400 transition truncate">
                          {language === 'bn' ? prog.titleBn : prog.titleEn}
                        </h4>
                        <span className={`px-1.5 py-0.2 rounded text-[10px] font-semibold border ${prog.bgColor} hidden sm:inline-block`}>
                          {language === 'bn' ? prog.badgeBn : prog.badgeEn}
                        </span>
                      </div>
                      <p className="text-[11px] sm:text-xs text-slate-400 truncate max-w-md mt-0.5">
                        {language === 'bn' ? prog.descBn : prog.descEn}
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      prog.onRun();
                    }}
                    className="flex-shrink-0 flex items-center gap-1 px-3 py-1.5 rounded-lg bg-slate-800 group-hover:bg-rose-500 text-slate-300 group-hover:text-white text-xs font-semibold transition"
                  >
                    <span>{language === 'bn' ? 'ওপেন' : 'Open'}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              );
            })}
          </div>
        )}

        {/* Modal Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-950 flex items-center justify-between text-xs text-slate-400">
          <span>
            {language === 'bn' 
              ? '💡 কীবোর্ডের Left / Right বাটন চেপে পরিবর্তন করুন' 
              : '💡 Use Arrow keys to navigate programs'}
          </span>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-semibold transition"
          >
            {language === 'bn' ? 'বন্ধ করুন' : 'Close'}
          </button>
        </div>
      </div>
    </div>
  );
};
