import React, { useState, useEffect } from 'react';
import { 
  HardDrive, 
  Smartphone, 
  Sparkles, 
  CheckCircle2, 
  X, 
  HelpCircle, 
  Sliders, 
  FolderCheck, 
  FolderPlus, 
  ArrowRight, 
  Download, 
  ShieldCheck, 
  ExternalLink,
  Info,
  Database,
  Zap,
  RefreshCw
} from 'lucide-react';
import { storagePreferenceManager } from '../services/storagePreferenceManager';
import { StorageConfig, StorageDestination, Language, StorageAccessStatus } from '../types';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  language: Language;
}

export const StorageLocationModal: React.FC<Props> = ({
  isOpen,
  onClose,
  language,
}) => {
  const [config, setConfig] = useState<StorageConfig>(storagePreferenceManager.getConfig());
  const [accessStatus, setAccessStatus] = useState<StorageAccessStatus | null>(null);
  const [testResult, setTestResult] = useState<string | null>(null);
  const [isTesting, setIsTesting] = useState(false);
  const [isRequestingPersist, setIsRequestingPersist] = useState(false);

  useEffect(() => {
    const unsub = storagePreferenceManager.subscribe((c) => {
      setConfig(c);
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    if (isOpen) {
      storagePreferenceManager.getStorageAccessStatus().then(setAccessStatus);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSelectDestination = (dest: StorageDestination) => {
    storagePreferenceManager.setDestination(dest);
  };

  const handleTogglePicker = (enabled: boolean) => {
    storagePreferenceManager.setConfig({ useNativePicker: enabled });
  };

  const handleVerifyAccessAndQuota = async () => {
    setIsTesting(true);
    setTestResult(null);
    try {
      const res = await storagePreferenceManager.verifyStorageReadWrite();
      const updatedStatus = await storagePreferenceManager.getStorageAccessStatus();
      setAccessStatus(updatedStatus);
      if (res.success) {
        setTestResult(`✓ ${res.details}`);
      } else {
        setTestResult(`⚠ ${res.details}`);
      }
    } catch (e: any) {
      setTestResult('যাচাই ব্যর্থ: ' + (e?.message || 'অজ্ঞাত সমস্যা'));
    } finally {
      setIsTesting(false);
    }
  };

  const handleRequestPersistentStorage = async () => {
    setIsRequestingPersist(true);
    try {
      const res = await storagePreferenceManager.requestPersistentStorage();
      const updatedStatus = await storagePreferenceManager.getStorageAccessStatus();
      setAccessStatus(updatedStatus);
      setTestResult(res.message);
    } catch (e: any) {
      setTestResult('অনুরোধ ব্যর্থ: ' + (e?.message || 'ত্রুটি'));
    } finally {
      setIsRequestingPersist(false);
    }
  };

  const handleRunPickerTest = async () => {
    setIsTesting(true);
    setTestResult(null);
    try {
      const testContent = new Blob(
        ['Pro Downloader Storage Test - Successfully configured SD Card / Phone Memory location.'],
        { type: 'text/plain' }
      );
      const res = await storagePreferenceManager.saveFileToUserStorage(
        'downloader_storage_test.txt',
        testContent,
        { forcePicker: true }
      );
      if (res.success) {
        setTestResult(res.message);
      } else {
        setTestResult(res.message || 'ডায়ালগ বাতিল করা হয়েছে');
      }
    } catch (e: any) {
      setTestResult('টেস্ট সম্পন্ন করা যায়নি: ' + e.message);
    } finally {
      setIsTesting(false);
    }
  };

  return (
    <div 
      id="storage-location-modal"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-3 sm:p-4 backdrop-blur-md animate-in fade-in duration-200"
    >
      <div className="relative w-full max-w-xl max-h-[92vh] overflow-y-auto rounded-3xl bg-slate-900 border border-slate-700/80 shadow-2xl p-5 sm:p-7 text-slate-100">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition"
          aria-label="Close"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-3.5 mb-5 pr-8">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-400 p-0.5 shadow-lg shadow-emerald-500/20 shrink-0">
            <div className="w-full h-full bg-slate-950 rounded-[14px] flex items-center justify-center">
              <HardDrive className="w-6 h-6 text-emerald-400" />
            </div>
          </div>
          <div>
            <h2 className="text-lg sm:text-xl font-bold text-white flex items-center gap-2">
              <span>{language === 'bn' ? 'মেমোরি কার্ড ও ফোন স্টোরেজ সেটিংস' : 'Storage & SD Card Destination'}</span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                {language === 'bn' ? 'সরাসরি সেভ' : 'Direct Save'}
              </span>
            </h2>
            <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
              {language === 'bn' 
                ? 'ডাউনলোড করা ভিডিও সরাসরি আপনার মেমোরি কার্ড (SD Card) বা ফোন মেমোরিতে সংরক্ষণ করুন।' 
                : 'Configure where downloaded files are saved: External SD Card or Internal Phone Storage.'}
            </p>
          </div>
        </div>

        {/* Storage Destination Cards */}
        <div className="space-y-3 mb-6">
          <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider block">
            {language === 'bn' ? 'প্রাথমিক সেভ লোকেশন নির্বাচন করুন' : 'Select Primary Destination'}
          </label>

          {/* 1. SD Card Option */}
          <div
            onClick={() => handleSelectDestination('sd_card')}
            className={`cursor-pointer rounded-2xl p-4 border transition-all flex items-start justify-between gap-3.5 ${
              config.destination === 'sd_card'
                ? 'bg-gradient-to-r from-emerald-950/50 via-slate-900 to-slate-900 border-emerald-500/60 shadow-lg shadow-emerald-950/40 ring-1 ring-emerald-500/30'
                : 'bg-slate-950/60 hover:bg-slate-800/40 border-slate-800'
            }`}
          >
            <div className="flex items-start gap-3">
              <div className={`p-2.5 rounded-xl mt-0.5 shrink-0 ${
                config.destination === 'sd_card' 
                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40' 
                  : 'bg-slate-800 text-slate-400'
              }`}>
                <HardDrive className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-bold text-white">
                    {language === 'bn' ? 'মেমোরি কার্ড (SD Card / External Storage)' : 'MicroSD Card / External Storage'}
                  </h3>
                  <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                    {language === 'bn' ? 'প্রস্তাবিত (ফোন মেমোরি ফ্রি)' : 'Recommended'}
                  </span>
                </div>
                <p className="text-xs text-slate-300 mt-1">
                  {language === 'bn' 
                    ? 'সব ভিডিও ও অডিও সরাসরি আপনার এক্সটার্নাল মেমোরি কার্ডে সেভ হবে। ফলে ফোনের ইন্টারনাল মেমোরি সবসময় খালি ও দ্রুত থাকবে।' 
                    : 'Downloads go directly to your removable SD Card, keeping internal device storage free.'}
                </p>
                <div className="mt-2 text-[11px] font-mono text-emerald-400/90 flex items-center gap-1.5">
                  <FolderCheck className="w-3.5 h-3.5" />
                  <span>SD Card / Movies / Downloader</span>
                </div>
              </div>
            </div>

            <div className="shrink-0 mt-1">
              <div className={`w-5 h-5 rounded-full border flex items-center justify-center transition ${
                config.destination === 'sd_card'
                  ? 'border-emerald-400 bg-emerald-500 text-white'
                  : 'border-slate-600'
              }`}>
                {config.destination === 'sd_card' && <CheckCircle2 className="w-4 h-4" />}
              </div>
            </div>
          </div>

          {/* 2. Phone Internal Memory */}
          <div
            onClick={() => handleSelectDestination('phone_memory')}
            className={`cursor-pointer rounded-2xl p-4 border transition-all flex items-start justify-between gap-3.5 ${
              config.destination === 'phone_memory'
                ? 'bg-gradient-to-r from-blue-950/50 via-slate-900 to-slate-900 border-blue-500/60 shadow-lg shadow-blue-950/40 ring-1 ring-blue-500/30'
                : 'bg-slate-950/60 hover:bg-slate-800/40 border-slate-800'
            }`}
          >
            <div className="flex items-start gap-3">
              <div className={`p-2.5 rounded-xl mt-0.5 shrink-0 ${
                config.destination === 'phone_memory' 
                  ? 'bg-blue-500/20 text-blue-400 border border-blue-500/40' 
                  : 'bg-slate-800 text-slate-400'
              }`}>
                <Smartphone className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">
                  {language === 'bn' ? 'ফোন মেমোরি (Phone Internal Storage)' : 'Phone Internal Memory'}
                </h3>
                <p className="text-xs text-slate-300 mt-1">
                  {language === 'bn'
                    ? 'ফাইলগুলো আপনার ফোনের মূল মেমোরিতে (Downloads বা ডিসিআইএম ফোল্ডারে) সংরক্ষিত হবে।'
                    : 'Files are saved to phone internal storage default Downloads folder.'}
                </p>
                <div className="mt-2 text-[11px] font-mono text-blue-400/90 flex items-center gap-1.5">
                  <FolderCheck className="w-3.5 h-3.5" />
                  <span>Internal Storage / Downloads</span>
                </div>
              </div>
            </div>

            <div className="shrink-0 mt-1">
              <div className={`w-5 h-5 rounded-full border flex items-center justify-center transition ${
                config.destination === 'phone_memory'
                  ? 'border-blue-400 bg-blue-500 text-white'
                  : 'border-slate-600'
              }`}>
                {config.destination === 'phone_memory' && <CheckCircle2 className="w-4 h-4" />}
              </div>
            </div>
          </div>

          {/* 3. Ask Each Time */}
          <div
            onClick={() => handleSelectDestination('ask_each_time')}
            className={`cursor-pointer rounded-2xl p-4 border transition-all flex items-start justify-between gap-3.5 ${
              config.destination === 'ask_each_time'
                ? 'bg-gradient-to-r from-purple-950/50 via-slate-900 to-slate-900 border-purple-500/60 shadow-lg shadow-purple-950/40 ring-1 ring-purple-500/30'
                : 'bg-slate-950/60 hover:bg-slate-800/40 border-slate-800'
            }`}
          >
            <div className="flex items-start gap-3">
              <div className={`p-2.5 rounded-xl mt-0.5 shrink-0 ${
                config.destination === 'ask_each_time' 
                  ? 'bg-purple-500/20 text-purple-400 border border-purple-500/40' 
                  : 'bg-slate-800 text-slate-400'
              }`}>
                <Sliders className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">
                  {language === 'bn' ? 'প্রতিবার জিজ্ঞেস করুন (Ask Destination Every Time)' : 'Ask Location Every Time'}
                </h3>
                <p className="text-xs text-slate-300 mt-1">
                  {language === 'bn'
                    ? 'প্রতিটি ফাইল ডাউনলোড করার সময় সিস্টেম ডায়ালগ খুলে মেমোরি কার্ড বা ফোন মেমোরির নির্দিষ্ট ফোল্ডার বেছে নিতে পারবেন।'
                    : 'Prompts system folder/drive dialog to pick SD Card or Phone folder on every download.'}
                </p>
              </div>
            </div>

            <div className="shrink-0 mt-1">
              <div className={`w-5 h-5 rounded-full border flex items-center justify-center transition ${
                config.destination === 'ask_each_time'
                  ? 'border-purple-400 bg-purple-500 text-white'
                  : 'border-slate-600'
              }`}>
                {config.destination === 'ask_each_time' && <CheckCircle2 className="w-4 h-4" />}
              </div>
            </div>
          </div>
        </div>

        {/* Storage Access & Device Quota Overview */}
        <div className="rounded-2xl bg-slate-950/90 border border-slate-800 p-4 mb-5 space-y-3.5">
          <div className="flex items-center justify-between pb-2.5 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <Database className="w-4 h-4 text-emerald-400" />
              <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                {language === 'bn' ? 'স্টোরেজ অ্যাক্সেস ও ডিভাইস স্পেস' : 'Storage Access & Device Quota'}
              </h4>
            </div>
            <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
              accessStatus?.status === 'optimal'
                ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                : 'bg-amber-500/20 text-amber-300 border-amber-500/30'
            }`}>
              {accessStatus?.status === 'optimal'
                ? (language === 'bn' ? 'পূর্ণ অ্যাক্সেস সচল' : 'Full Access Active')
                : (language === 'bn' ? 'সীমিত অ্যাক্সেস' : 'Standard Access')}
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 text-xs">
            <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800">
              <span className="text-[10px] text-slate-400 block mb-0.5">
                {language === 'bn' ? 'উপলব্ধ মেমোরি' : 'Available Space'}
              </span>
              <span className="font-bold text-white text-sm text-emerald-400">
                {accessStatus?.availableFormatted || 'যাচাই হচ্ছে...'}
              </span>
            </div>

            <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800">
              <span className="text-[10px] text-slate-400 block mb-0.5">
                {language === 'bn' ? 'মোট সিস্টেম কোটা' : 'Total Quota'}
              </span>
              <span className="font-semibold text-slate-200">
                {accessStatus?.quotaFormatted || 'সিস্টেম নির্ধারিত'}
              </span>
            </div>

            <div className="col-span-2 sm:col-span-1 p-2.5 rounded-xl bg-slate-900 border border-slate-800 flex flex-col justify-between">
              <span className="text-[10px] text-slate-400 block mb-0.5">
                {language === 'bn' ? 'পারসিস্টেন্ট অনুমতি' : 'Persistent Storage'}
              </span>
              <div className="flex items-center justify-between">
                <span className={`text-[11px] font-bold ${accessStatus?.isPersistent ? 'text-emerald-400' : 'text-amber-400'}`}>
                  {accessStatus?.isPersistent 
                    ? (language === 'bn' ? 'স্থায়ী (Persisted)' : 'Persisted') 
                    : (language === 'bn' ? 'স্ট্যান্ডার্ড' : 'Standard')}
                </span>
                {!accessStatus?.isPersistent && (
                  <button
                    onClick={handleRequestPersistentStorage}
                    disabled={isRequestingPersist}
                    className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 hover:bg-emerald-500/30 transition"
                  >
                    {isRequestingPersist ? 'অনুরোধ হচ্ছে...' : (language === 'bn' ? 'অনুমতি নিন' : 'Request')}
                  </button>
                )}
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2 pt-1 text-[11px] text-slate-400">
            <span>
              {language === 'bn'
                ? 'ব্রাউজার বা ওএস আপনার সেভ করা ফাইল বা ডাউনলোড হিস্টোরি মুছে ফেলবে না।'
                : 'Storage Access API prevents the browser and OS from evicting saved offline files.'}
            </span>
            <button
              onClick={handleVerifyAccessAndQuota}
              disabled={isTesting}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-400 hover:text-emerald-300 transition"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isTesting ? 'animate-spin' : ''}`} />
              <span>{language === 'bn' ? 'স্টোরেজ অ্যাক্সেস ও স্পেস রিফ্রেশ' : 'Refresh Storage Quota'}</span>
            </button>
          </div>
        </div>

        {/* Android MANAGE_EXTERNAL_STORAGE & Browser SD Card Guide */}
        <div className="rounded-2xl bg-slate-950/80 border border-slate-800 p-4 mb-5 space-y-4">
          {/* MANAGE_EXTERNAL_STORAGE Badge & Details */}
          <div className="p-3 rounded-xl bg-gradient-to-r from-emerald-950/60 via-slate-900 to-slate-900 border border-emerald-500/40">
            <div className="flex items-center justify-between mb-1.5">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span className="text-xs font-bold text-white uppercase tracking-wider">
                  {language === 'bn' ? 'Android MANAGE_EXTERNAL_STORAGE সক্ষম' : 'Android MANAGE_EXTERNAL_STORAGE Enabled'}
                </span>
              </div>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                All-Files Access
              </span>
            </div>
            <p className="text-[11px] text-slate-300 leading-relaxed">
              {language === 'bn'
                ? 'এই অ্যাপটিতে Android 11+ (API 30–36) এর জন্য MANAGE_EXTERNAL_STORAGE এবং Scoped Storage বাইপাস কনফিগার করা রয়েছে। ফলে এক্সটার্নাল MicroSD কার্ড এবং ফোন মেমোরির ফোল্ডারে সম্পূর্ণ ডিরেক্ট রিড/রাইট অ্যাক্সেস পাওয়া যায়।'
                : 'Configured with Android 11+ (API 30–36) MANAGE_EXTERNAL_STORAGE and Scoped Storage bypass, providing unrestricted direct read/write access to MicroSD Cards and custom folders.'}
            </p>
          </div>

          <div>
            <div className="flex items-center gap-2 mb-3">
              <Smartphone className="w-4 h-4 text-emerald-400" />
              <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider">
                {language === 'bn' ? 'মোবাইল ব্রাউজারে মেমোরি কার্ড ডিফল্ট করার সহজ নিয়ম' : 'How to set SD Card in Mobile Chrome'}
              </h4>
            </div>

            <div className="space-y-2.5 text-xs text-slate-300">
              <div className="flex items-start gap-2.5 p-2.5 rounded-xl bg-slate-900 border border-slate-800/80">
                <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 font-bold flex items-center justify-center shrink-0 text-[11px]">১</span>
                <span>মোবাইলে Chrome ব্রাউজারের উপরে ডানদিকের <strong>৩-ডট (⋮) মেনুতে</strong> চাপ দিয়ে <strong>Settings (সেটিংস)</strong> এ যান।</span>
              </div>
              <div className="flex items-start gap-2.5 p-2.5 rounded-xl bg-slate-900 border border-slate-800/80">
                <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 font-bold flex items-center justify-center shrink-0 text-[11px]">২</span>
                <span>নিচে স্ক্রোল করে <strong>Downloads (ডাউনলোড)</strong> অপশনে ট্যাপ করুন।</span>
              </div>
              <div className="flex items-start gap-2.5 p-2.5 rounded-xl bg-slate-900 border border-slate-800/80">
                <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 font-bold flex items-center justify-center shrink-0 text-[11px]">৩</span>
                <span><strong>Download location (ডাউনলোড লোকেশন)</strong> এ গিয়ে <strong>SD Card (মেমোরি কার্ড)</strong> সিলেক্ট করুন এবং <strong>"Ask where to save files"</strong> চালু রাখুন।</span>
              </div>
            </div>
          </div>
        </div>

        {/* Interactive Test & Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-slate-800">
          <button
            id="test-sd-card-picker-btn"
            onClick={handleRunPickerTest}
            disabled={isTesting}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-emerald-400 border border-emerald-500/30 transition shadow-sm active:scale-95"
          >
            <FolderPlus className="w-4 h-4" />
            <span>{isTesting ? 'ডায়ালগ ওপেন হচ্ছে...' : 'মেমোরি কার্ড সেভ ডায়ালগ টেস্ট করুন'}</span>
          </button>

          <button
            onClick={onClose}
            className="w-full sm:w-auto px-6 py-2.5 rounded-xl text-xs font-bold bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white transition shadow-lg shadow-emerald-950/40 active:scale-95"
          >
            {language === 'bn' ? 'সেভ ও সম্পন্ন করুন' : 'Save & Done'}
          </button>
        </div>

        {testResult && (
          <div className="mt-3 p-3 rounded-xl bg-slate-950 border border-emerald-500/40 text-xs text-emerald-300 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
            <span>{testResult}</span>
          </div>
        )}
      </div>
    </div>
  );
};
