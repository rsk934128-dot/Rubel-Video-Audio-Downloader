import React, { useEffect, useState } from 'react';
import { 
  Bell, 
  BellRing, 
  Download, 
  Smartphone, 
  Wifi, 
  WifiOff, 
  Zap, 
  CheckCircle2, 
  Info, 
  X,
  Share2,
  HardDrive
} from 'lucide-react';
import { backgroundKeepAlive } from '../services/backgroundKeepAlive';
import { notificationManager, NotificationPermissionState } from '../services/notificationManager';
import { usePWAInstall } from '../hooks/usePWAInstall';
import { storagePreferenceManager } from '../services/storagePreferenceManager';
import { StorageConfig } from '../types';

interface Props {
  onOpenStorageModal?: () => void;
}

export const MobilePersistenceBar: React.FC<Props> = ({ onOpenStorageModal }) => {
  const [isActive, setIsActive] = useState<boolean>(backgroundKeepAlive.isActive());
  const [isOnline, setIsOnline] = useState<boolean>(typeof navigator !== 'undefined' ? navigator.onLine : true);
  const [notifState, setNotifState] = useState<NotificationPermissionState>(notificationManager.getPermissionStatus());
  const [showIOSGuide, setShowIOSGuide] = useState(false);
  const [testSent, setTestSent] = useState(false);
  const [storageConfig, setStorageConfig] = useState<StorageConfig>(storagePreferenceManager.getConfig());

  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();

  useEffect(() => {
    const unsubStorage = storagePreferenceManager.subscribe((c) => setStorageConfig(c));
    const unsub = backgroundKeepAlive.subscribe((active) => {
      setIsActive(active);
    });

    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      unsubStorage();
      unsub();
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const handleToggleActive = () => {
    const next = backgroundKeepAlive.toggle();
    setIsActive(next);

    if (next && notifState !== 'granted') {
      notificationManager.requestPermission().then((granted) => {
        if (granted) setNotifState('granted');
      });
    }
  };

  const handleEnableNotification = async () => {
    const granted = await notificationManager.requestPermission();
    if (granted) {
      setNotifState('granted');
    } else {
      setNotifState(notificationManager.getPermissionStatus());
    }
  };

  const handleSendTestNotification = () => {
    notificationManager.sendNotification({
      title: '⚡ রিয়েল-টাইম নোটিফিকেশন সচল আছে!',
      body: 'অ্যাপটি মিনিমাইজ বা ব্যাকগ্রাউন্ডে থাকলেও সফলভাবে নোটিফিকেশন পৌঁছেছে।',
      tag: 'test-notification',
    });
    setTestSent(true);
    setTimeout(() => setTestSent(false), 3000);
  };

  return (
    <>
      <div 
        id="mobile-persistence-control" 
        className="w-full max-w-4xl mx-auto mb-6 px-3 sm:px-0"
      >
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-slate-900/90 via-slate-800/80 to-slate-900/90 border border-slate-700/60 p-3.5 sm:p-4 shadow-lg backdrop-blur-md">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3.5">
            {/* Left: Background Active Mode Info */}
            <div className="flex items-center gap-3">
              <div className={`relative flex items-center justify-center w-10 h-10 rounded-xl transition-all ${
                isActive 
                  ? 'bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.3)]' 
                  : 'bg-slate-800 border border-slate-700 text-slate-400'
              }`}>
                <Zap className={`w-5 h-5 ${isActive ? 'animate-pulse text-emerald-400 fill-emerald-400/30' : ''}`} />
                {isActive && (
                  <span className="absolute -top-1 -right-1 flex h-3 w-3">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
                  </span>
                )}
              </div>

              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-semibold text-white flex items-center gap-1.5">
                    মোবাইল সর্বদা সক্রিয় মোড
                    {isActive ? (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                        সক্রিয় (Always Active)
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-slate-700/60 text-slate-400 border border-slate-600">
                        বন্ধ
                      </span>
                    )}
                  </h3>
                  {/* Online / Offline indicator */}
                  <span className={`inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full ${
                    isOnline 
                      ? 'bg-sky-500/10 text-sky-300 border border-sky-500/20' 
                      : 'bg-amber-500/10 text-amber-300 border border-amber-500/20'
                  }`}>
                    {isOnline ? <Wifi className="w-3 h-3 text-sky-400" /> : <WifiOff className="w-3 h-3 text-amber-400" />}
                    {isOnline ? 'অনলাইন' : 'অফলাইন'}
                  </span>
                </div>
                <p className="text-xs text-slate-300 mt-0.5">
                  🔒 স্থান পরিবর্তন, মিনিমাইজ বা ফোন স্ক্রিন লক করলেও ব্যাকগ্রাউন্ডে ডাউনলোড সচল থাকে এবং লক-স্ক্রিনে লাইভ অ্যালবাম ও নোটিফিকেশন প্রদর্শন করে।
                </p>
              </div>
            </div>

            {/* Right Controls: Toggle Active, Notification Button, Storage Config, Install App */}
            <div className="flex flex-wrap items-center gap-2 pt-2 md:pt-0 border-t md:border-t-0 border-slate-700/50">
              {/* Storage Destination Button (SD Card / Phone Memory) */}
              <button
                id="bar-storage-config-btn"
                onClick={onOpenStorageModal}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-800 hover:bg-slate-700 text-emerald-300 border border-emerald-500/30 transition shadow-sm"
                title="মেমোরি কার্ড ও ফোন স্টোরেজ কনফিগার করুন"
              >
                <HardDrive className="w-3.5 h-3.5 text-emerald-400" />
                <span>
                  {storageConfig.destination === 'sd_card'
                    ? 'মেমোরি কার্ড (SD)'
                    : storageConfig.destination === 'phone_memory'
                    ? 'ফোন মেমোরি'
                    : 'স্টোরেজ'}
                </span>
              </button>

              {/* Toggle Switch */}
              <button
                id="toggle-background-persistence"
                onClick={handleToggleActive}
                className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 focus:ring-offset-slate-900 ${
                  isActive ? 'bg-emerald-500' : 'bg-slate-700'
                }`}
                title={isActive ? 'ব্যাকগ্রাউন্ড মোড বন্ধ করুন' : 'ব্যাকগ্রাউন্ড মোড চালু করুন'}
                aria-label="Toggle Background Persistence"
              >
                <span
                  className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-md transition-transform ${
                    isActive ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>

              {/* Notification Button */}
              {notifState === 'granted' ? (
                <button
                  id="send-test-notification-btn"
                  onClick={handleSendTestNotification}
                  disabled={testSent}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-800 hover:bg-slate-700 text-emerald-300 border border-emerald-500/30 transition shadow-sm"
                  title="টেস্ট নোটিফিকেশন পাঠিয়ে যাচাই করুন"
                >
                  <BellRing className="w-3.5 h-3.5 text-emerald-400" />
                  {testSent ? 'নোটিফিকেশন পাঠানো হয়েছে!' : 'নোটিফিকেশন টেস্ট'}
                </button>
              ) : (
                <button
                  id="enable-notification-btn"
                  onClick={handleEnableNotification}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-rose-600 hover:bg-rose-500 text-white shadow-sm transition active:scale-95"
                >
                  <Bell className="w-3.5 h-3.5" />
                  নোটিফিকেশন অন করুন
                </button>
              )}

              {/* PWA Install Button (if not already installed standalone) */}
              {!isInstalled && isInstallable && (
                <button
                  id="pwa-install-app-btn"
                  onClick={install}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white shadow-sm transition active:scale-95"
                  title="মোবাইলে অ্যাপ্লিকেশন ইনস্টল করুন"
                >
                  <Download className="w-3.5 h-3.5" />
                  অ্যাপ ইনস্টল
                </button>
              )}

              {/* iOS Safari Guide Button */}
              {!isInstalled && isIOS && (
                <button
                  id="pwa-ios-guide-btn"
                  onClick={() => setShowIOSGuide(true)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-600 transition"
                  title="আইফোনে ইনস্টল নির্দেশিকা"
                >
                  <Smartphone className="w-3.5 h-3.5 text-slate-300" />
                  আইফোন ইনস্টল
                </button>
              )}

              {isInstalled && (
                <span className="hidden sm:inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-medium bg-slate-800/80 text-emerald-400 border border-emerald-500/20">
                  <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                  ইনস্টলড অ্যাপ
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* iOS Installation Guide Modal */}
      {showIOSGuide && (
        <div 
          id="ios-pwa-guide-modal"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm animate-in fade-in duration-200"
        >
          <div className="w-full max-w-sm rounded-2xl bg-slate-900 border border-slate-700 p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-blue-500/10 text-blue-400 border border-blue-500/20">
                  <Smartphone className="w-5 h-5" />
                </div>
                <h3 className="text-base font-bold text-white">iPhone / iPad এ ইনস্টল করুন</h3>
              </div>
              <button
                onClick={() => setShowIOSGuide(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs sm:text-sm text-slate-300">
              <div className="flex items-start gap-2.5 p-3 rounded-xl bg-slate-800/60 border border-slate-700/50">
                <span className="flex items-center justify-center w-5 h-5 rounded-full bg-blue-500/20 text-blue-400 font-bold text-xs shrink-0">1</span>
                <span>Safari ব্রাউজারের নিচের টুলবারের <strong className="text-white inline-flex items-center gap-1 mx-1"><Share2 className="w-3.5 h-3.5" /> Share</strong> বাটনে ট্যাপ করুন।</span>
              </div>
              <div className="flex items-start gap-2.5 p-3 rounded-xl bg-slate-800/60 border border-slate-700/50">
                <span className="flex items-center justify-center w-5 h-5 rounded-full bg-blue-500/20 text-blue-400 font-bold text-xs shrink-0">2</span>
                <span>নিচে স্ক্রোল করে <strong className="text-white">"Add to Home Screen"</strong> (হোম স্ক্রিনে যোগ করুন) অপশনটি নির্বাচন করুন।</span>
              </div>
              <div className="flex items-start gap-2.5 p-3 rounded-xl bg-slate-800/60 border border-slate-700/50">
                <span className="flex items-center justify-center w-5 h-5 rounded-full bg-blue-500/20 text-blue-400 font-bold text-xs shrink-0">3</span>
                <span>উপরে ডানপাশে <strong className="text-emerald-400">"Add"</strong> ট্যাপ করলেই আপনার ফোনে নেটিভ অ্যাপের মতো যুক্ত হয়ে যাবে।</span>
              </div>
            </div>

            <button
              onClick={() => setShowIOSGuide(false)}
              className="mt-5 w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-sm font-semibold text-white border border-slate-600 transition"
            >
              বুঝেছি
            </button>
          </div>
        </div>
      )}
    </>
  );
};
