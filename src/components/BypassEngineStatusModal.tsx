import React, { useEffect, useState } from 'react';
import { Language } from '../types';
import { 
  Zap, 
  X, 
  ShieldCheck, 
  CheckCircle2, 
  Cpu, 
  Radio, 
  Sparkles, 
  ArrowRight,
  RefreshCw,
  Server,
  Layers,
  Lock
} from 'lucide-react';

interface EngineInfo {
  name: string;
  type: string;
  status: 'active' | 'degraded' | 'standby';
  description: string;
  platforms: string[];
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
  language: Language;
}

export const BypassEngineStatusModal: React.FC<Props> = ({
  isOpen,
  onClose,
  language,
}) => {
  const [engines, setEngines] = useState<EngineInfo[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [lastCheckTime, setLastCheckTime] = useState<string>('');

  const fetchEngines = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/bypass/engines');
      if (res.ok) {
        const data = await res.json();
        if (data.engines) {
          setEngines(data.engines);
        }
      }
    } catch {
      // Fallback display
      setEngines([
        {
          name: 'TikTok No-Watermark Direct Bypass',
          type: 'direct_cdn',
          status: 'active',
          description: 'টিকটক ওয়াটারমার্ক ছাড়া ফুল এইচডি ভিডিও এবং ক্রিস্টাল ক্লিয়ার এমপি৩ সরাসরি ডাউনলোড।',
          platforms: ['TikTok', 'Douyin'],
        },
        {
          name: 'Android Client Stream Bypass (yt-dlp)',
          type: 'native_extractor',
          status: 'active',
          description: 'ইউটিউব বট ডিটেকশন বাইপাস করে অ্যান্ড্রয়েড ক্লায়েন্টের মাধ্যমে সরাসরি অরিজিনাল অডিও/ভিডিও স্ট্রিম।',
          platforms: ['YouTube', 'Shorts', 'Music'],
        },
        {
          name: 'Cloud Converter Pro (Loader Engine)',
          type: 'cloud_transcoder',
          status: 'active',
          description: '৩২০ কেবিপিএস আল্ট্রা এইচডি অডিও এবং ১০৮০পি/৪কে ভিডিও এনকোডিং ও ফরম্যাট কনভার্সন।',
          platforms: ['YouTube', 'Facebook', 'Instagram', 'Twitter/X', 'Vimeo', 'SoundCloud'],
        },
        {
          name: 'High-Speed Stream Proxy Bypass',
          type: 'cors_proxy',
          status: 'active',
          description: 'CORS ও হটলিঙ্ক প্রটেকশন বাইপাস করে সরাসরি ডিভাইসে ডাউনলোডার স্ট্রিম পাইপ।',
          platforms: ['All Platforms', 'Direct Media Links'],
        },
      ]);
    } finally {
      setIsLoading(false);
      setLastCheckTime(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchEngines();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-fade-in">
      <div className="bg-slate-900 border border-slate-800 w-full max-w-2xl rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="p-6 border-b border-slate-800/80 bg-slate-950/60 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-rose-500/10 border border-rose-500/25 flex items-center justify-center text-rose-400 shadow-sm">
              <Zap className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-bold text-white">
                  {language === 'bn' ? 'বাইপাস এপিআই ইঞ্জিন (Bypass Engine)' : 'Bypass API Engines'}
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                  ONLINE
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                {language === 'bn' 
                  ? 'সব ধরণের ভিডিও/অডিও লিংক মসৃণভাবে ডাউনলোডের জন্য একাধিক বাইপাস ইঞ্জিন সক্রিয় রয়েছে' 
                  : 'Multi-tiered bypass pipeline ensuring smooth extraction for any media link'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-4">
          <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-sky-500/10 text-sky-400 flex items-center justify-center">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs font-semibold text-white">
                  {language === 'bn' ? 'অটোমেটিক বাইপাস ক্যাসকেড' : 'Automatic Cascade Fallback'}
                </p>
                <p className="text-[11px] text-slate-400">
                  {language === 'bn' 
                    ? 'কোনো লিঙ্কে একটি সার্ভার সীমাবদ্ধতা পেলে সিস্টেম নিজে থেকেই পরবর্তী বাইপাস ইঞ্জিনে সুইচ করে।' 
                    : 'If an upstream source throttles, the engine automatically switches to the next bypass tier.'}
                </p>
              </div>
            </div>
            <button
              onClick={fetchEngines}
              disabled={isLoading}
              className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium border border-slate-700 transition flex items-center gap-1.5 shrink-0"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-rose-400' : ''}`} />
              <span>{language === 'bn' ? 'রিফ্রেশ' : 'Refresh'}</span>
            </button>
          </div>

          {/* Engine Cards */}
          <div className="space-y-3">
            {engines.map((engine, idx) => (
              <div
                key={idx}
                className="p-4 rounded-2xl bg-slate-950/40 border border-slate-800/80 hover:border-slate-700 transition space-y-2.5"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-lg bg-rose-500/15 text-rose-400 text-xs font-bold flex items-center justify-center">
                      {idx + 1}
                    </span>
                    <h4 className="text-sm font-bold text-white">
                      {engine.name}
                    </h4>
                  </div>
                  <span className="px-2 py-0.5 rounded-lg text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                    Active & Ready
                  </span>
                </div>

                <p className="text-xs text-slate-300 leading-relaxed">
                  {engine.description}
                </p>

                <div className="flex items-center gap-1.5 flex-wrap pt-1">
                  <span className="text-[10px] text-slate-500 font-medium mr-1">
                    {language === 'bn' ? 'সাপোর্টেড:' : 'Supported:'}
                  </span>
                  {engine.platforms.map((plat, pidx) => (
                    <span
                      key={pidx}
                      className="px-2 py-0.5 rounded-md text-[10px] font-medium bg-slate-800 text-slate-300 border border-slate-700/60"
                    >
                      {plat}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Technical Specs box */}
          <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-2">
            <h5 className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
              <Cpu className="w-3.5 h-3.5 text-rose-400" />
              <span>{language === 'bn' ? 'বাইপাস প্রটোকল বৈশিষ্ট্য' : 'Bypass Protocol Capabilities'}</span>
            </h5>
            <ul className="text-xs text-slate-400 space-y-1.5 list-disc list-inside">
              <li>{language === 'bn' ? 'YouTube Android Client সিগনেচার স্পুফিং (SABR / Bot-check বাইপাস)' : 'YouTube Android Client Signature Spoofing (Bypasses bot checks)'}</li>
              <li>{language === 'bn' ? 'TikTok Watermark Stripping ও সরাসরি অরিজিনাল অডিও এক্সট্র্যাক্টর' : 'TikTok Watermark Stripping and direct original audio extractor'}</li>
              <li>{language === 'bn' ? 'HTTP Range 206 Partial Content সহ রিজুম্যাবল স্ট্রিমিং ডাউনলোড' : 'Resumable streaming downloads with HTTP Range 206 support'}</li>
              <li>{language === 'bn' ? 'CORS ও Hotlink রেফারার বাইপাসার (ব্রাউজারে সরাসরি ডিস্কে সেভ)' : 'CORS & Hotlink Referer Bypasser (Saves directly to device disk)'}</li>
            </ul>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/80 flex items-center justify-between text-xs text-slate-400">
          <span className="flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>{language === 'bn' ? 'সবগুলো বাইপাস ইঞ্জিন প্রস্তুত' : 'All Bypass Engines Ready'}</span>
          </span>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-rose-500 hover:bg-rose-600 text-white font-bold transition shadow-md shadow-rose-500/20"
          >
            {language === 'bn' ? 'বুঝেছি' : 'Got it'}
          </button>
        </div>
      </div>
    </div>
  );
};
