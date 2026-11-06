import React from 'react';
import { PlatformType } from '../types';
import { 
  Youtube, 
  Facebook, 
  Instagram, 
  Share2, 
  Video, 
  Globe 
} from 'lucide-react';

interface Props {
  platform: PlatformType;
  showName?: boolean;
  className?: string;
}

export const PlatformBadge: React.FC<Props> = ({ platform, showName = true, className = '' }) => {
  switch (platform) {
    case 'youtube':
      return (
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-500/10 text-rose-400 border border-rose-500/20 ${className}`}>
          <Youtube className="w-3.5 h-3.5 text-rose-500" />
          {showName && 'YouTube'}
        </span>
      );
    case 'facebook':
      return (
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-500/10 text-blue-400 border border-blue-500/20 ${className}`}>
          <Facebook className="w-3.5 h-3.5 text-blue-500" />
          {showName && 'Facebook'}
        </span>
      );
    case 'instagram':
      return (
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-pink-500/10 text-pink-400 border border-pink-500/20 ${className}`}>
          <Instagram className="w-3.5 h-3.5 text-pink-500" />
          {showName && 'Instagram'}
        </span>
      );
    case 'tiktok':
      return (
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 ${className}`}>
          <Video className="w-3.5 h-3.5 text-cyan-400" />
          {showName && 'TikTok'}
        </span>
      );
    case 'twitter':
      return (
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-sky-500/10 text-sky-400 border border-sky-500/20 ${className}`}>
          <Share2 className="w-3.5 h-3.5 text-sky-400" />
          {showName && 'Twitter / X'}
        </span>
      );
    case 'direct':
      return (
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 ${className}`}>
          <Globe className="w-3.5 h-3.5 text-emerald-400" />
          {showName && 'Direct Media'}
        </span>
      );
    default:
      return (
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-800 text-slate-300 border border-slate-700 ${className}`}>
          <Video className="w-3.5 h-3.5 text-slate-400" />
          {showName && 'Universal Media'}
        </span>
      );
  }
};
