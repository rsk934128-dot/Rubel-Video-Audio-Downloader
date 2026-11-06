import React, { useState } from 'react';
import { Language, PlatformType } from '../types';
import { getTranslation } from '../utils/translations';
import { 
  Share2, 
  Sparkles, 
  Smartphone, 
  ArrowRight, 
  ExternalLink, 
  Check, 
  Youtube, 
  Facebook, 
  Instagram, 
  ChevronDown 
} from 'lucide-react';

interface Props {
  detectedSharedUrl: string | null;
  onApplyUrl: (url: string) => void;
  language: Language;
}

export const ShareListenerBanner: React.FC<Props> = ({
  detectedSharedUrl,
  onApplyUrl,
  language,
}) => {
  const t = getTranslation(language);
  const [showSimulateMenu, setShowSimulateMenu] = useState(false);

  const testShareOptions = [
    {
      label: language === 'bn' ? 'YouTube থেকে শেয়ার টেস্ট' : 'Simulate YouTube Share',
      url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
      icon: Youtube,
      color: 'text-rose-500',
    },
    {
      label: language === 'bn' ? 'Facebook Watch থেকে শেয়ার টেস্ট' : 'Simulate Facebook Share',
      url: 'https://www.facebook.com/watch/?v=987654321012',
      icon: Facebook,
      color: 'text-blue-500',
    },
    {
      label: language === 'bn' ? 'Instagram Reel থেকে শেয়ার টেস্ট' : 'Simulate Instagram Reel',
      url: 'https://www.instagram.com/reel/C5ABC123xyz/',
      icon: Instagram,
      color: 'text-pink-500',
    },
  ];

  return (
    <div className="w-full mb-6">
      {/* If an external shared link was detected via query param */}
      {detectedSharedUrl && (
        <div className="mb-4 p-4 rounded-2xl bg-gradient-to-r from-rose-500/15 via-purple-500/15 to-sky-500/15 border border-rose-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-lg shadow-rose-950/20">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-xl bg-rose-500/20 text-rose-400 mt-0.5">
              <Share2 className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-rose-400">
                  {t.shareDetected}
                </span>
                <span className="px-2 py-0.5 text-[10px] font-semibold bg-rose-500 text-white rounded-full">
                  Intent Received
                </span>
              </div>
              <p className="text-sm font-medium text-white truncate max-w-md mt-0.5">
                {detectedSharedUrl}
              </p>
            </div>
          </div>
          <button
            id="apply-detected-share-btn"
            onClick={() => onApplyUrl(detectedSharedUrl)}
            className="flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-rose-500 hover:bg-rose-600 text-white text-xs sm:text-sm font-semibold shadow-md hover:shadow-rose-500/25 transition whitespace-nowrap"
          >
            <span>{t.analyzeBtn}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Share Intent simulation bar for quick developer testing */}
      <div className="p-3.5 rounded-2xl bg-slate-900/60 border border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2.5 text-slate-300">
          <div className="w-7 h-7 rounded-lg bg-sky-500/10 text-sky-400 flex items-center justify-center">
            <Smartphone className="w-4 h-4" />
          </div>
          <div>
            <span className="font-semibold text-white">
              {language === 'bn' ? 'Android "Share to..." ও Web Share Target' : 'Android Share Intent & Web Share Target'}
            </span>
            <span className="text-slate-400 block sm:inline sm:ml-2 text-[11px]">
              {language === 'bn' 
                ? 'মোবাইলে ইনস্টল থাকলে যেকোনো অ্যাপ থেকে "Share" চাপলেই এখানে চলে আসবে'
                : 'When installed as PWA, appears directly in Android Share sheet'}
            </span>
          </div>
        </div>

        <div className="relative">
          <button
            id="simulate-share-dropdown-btn"
            onClick={() => setShowSimulateMenu(!showSimulateMenu)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700/80 font-medium transition"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>{t.simulatedShare}</span>
            <ChevronDown className={`w-3.5 h-3.5 transition-transform ${showSimulateMenu ? 'rotate-180' : ''}`} />
          </button>

          {showSimulateMenu && (
            <div className="absolute right-0 mt-2 w-64 rounded-xl bg-slate-900 border border-slate-800 shadow-2xl p-1.5 z-30">
              <p className="text-[10px] font-semibold text-slate-400 px-2.5 py-1 uppercase tracking-wider">
                {language === 'bn' ? 'শেয়ার টেস্ট করুন' : 'Simulate incoming share'}
              </p>
              {testShareOptions.map((opt, i) => {
                const Icon = opt.icon;
                return (
                  <button
                    key={i}
                    onClick={() => {
                      onApplyUrl(opt.url);
                      setShowSimulateMenu(false);
                    }}
                    className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-left text-xs text-slate-200 hover:bg-slate-800 transition"
                  >
                    <Icon className={`w-4 h-4 ${opt.color}`} />
                    <span className="truncate">{opt.label}</span>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
