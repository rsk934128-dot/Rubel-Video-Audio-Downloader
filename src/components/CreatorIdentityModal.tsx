import React, { useEffect, useRef, useState } from 'react';
import type { User as FirebaseUser } from 'firebase/auth';
import {
  Check,
  Copy,
  Edit3,
  ExternalLink,
  Globe,
  Mail,
  MapPin,
  RotateCcw,
  Share2,
  Sparkles,
  Trash2,
  Upload,
  UserCheck,
  X,
  Youtube,
  Github,
  Facebook,
} from 'lucide-react';
import { CreatorProfile, Language } from '../types';
import { creatorIdentityManager } from '../services/creatorIdentityManager';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  language: Language;
  currentUser: FirebaseUser | null;
  initialMode?: 'card' | 'edit';
}

export const CreatorIdentityModal: React.FC<Props> = ({
  isOpen,
  onClose,
  language,
  currentUser,
  initialMode = 'card',
}) => {
  const [profile, setProfile] = useState<CreatorProfile>(() => creatorIdentityManager.getProfile());
  const [draft, setDraft] = useState<CreatorProfile>(() => creatorIdentityManager.getProfile());
  const [mode, setMode] = useState<'card' | 'edit'>(initialMode);
  const [avatarLoadError, setAvatarLoadError] = useState(false);
  const [copiedContact, setCopiedContact] = useState(false);
  const [sharedSuccess, setSharedSuccess] = useState(false);
  const [savedNotice, setSavedNotice] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    const unsub = creatorIdentityManager.subscribe((updated) => {
      setProfile(updated);
    });
    return unsub;
  }, []);

  useEffect(() => {
    if (isOpen) {
      const latest = creatorIdentityManager.getProfile();
      setProfile(latest);
      setDraft(latest);
      setMode(initialMode);
      setAvatarLoadError(false);
      setSavedNotice(false);
    }
  }, [isOpen, initialMode]);

  useEffect(() => {
    if (!isOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const bn = language === 'bn';
  const activeProfile = mode === 'edit' ? draft : profile;
  const initials = creatorIdentityManager.getInitials(activeProfile.name);
  const hasAvatar = Boolean(activeProfile.avatarUrl) && !avatarLoadError;

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const saved = creatorIdentityManager.saveProfile(draft);
    setProfile(saved);
    setDraft(saved);
    setAvatarLoadError(false);
    setSavedNotice(true);
    setMode('card');
    setTimeout(() => setSavedNotice(false), 3000);
  };

  const handleReset = () => {
    const reset = creatorIdentityManager.resetProfile();
    setProfile(reset);
    setDraft(reset);
    setAvatarLoadError(false);
  };

  const handleImportFromGoogle = () => {
    if (!currentUser) return;
    setDraft((prev) => ({
      ...prev,
      name: currentUser.displayName?.trim() || prev.name,
      email: currentUser.email?.trim() || prev.email,
      avatarUrl: currentUser.photoURL?.trim() || prev.avatarUrl,
    }));
    setAvatarLoadError(false);
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        const maxDim = 256;
        const scale = Math.min(1, maxDim / Math.max(img.width, img.height));
        const w = Math.max(1, Math.round(img.width * scale));
        const h = Math.max(1, Math.round(img.height * scale));
        const canvas = document.createElement('canvas');
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, w, h);
          const dataUrl = canvas.toDataURL('image/jpeg', 0.82);
          setDraft((prev) => ({ ...prev, avatarUrl: dataUrl }));
          setAvatarLoadError(false);
        }
      };
      img.src = String(reader.result || '');
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleCopyCredit = async () => {
    const text = creatorIdentityManager.formatShareText(profile, language);
    try {
      await navigator.clipboard.writeText(text);
      setCopiedContact(true);
      setTimeout(() => setCopiedContact(false), 2200);
    } catch {
      // Ignore clipboard failure
    }
  };

  const handleShareIdentity = async () => {
    const text = creatorIdentityManager.formatShareText(profile, language);
    if (navigator.share) {
      try {
        await navigator.share({
          title: `${profile.studioName || 'Downloader Pro'} — ${profile.name}`,
          text,
          url: profile.websiteUrl || window.location.href,
        });
        setSharedSuccess(true);
        setTimeout(() => setSharedSuccess(false), 2200);
        return;
      } catch {
        // Fallback to copy
      }
    }
    await handleCopyCredit();
  };

  const socialLinks = [
    { label: bn ? 'ওয়েবসাইট' : 'Website', url: profile.websiteUrl, icon: Globe },
    { label: 'YouTube', url: profile.youtubeUrl, icon: Youtube },
    { label: 'Facebook', url: profile.facebookUrl, icon: Facebook },
    { label: 'GitHub', url: profile.githubUrl, icon: Github },
  ].filter((item) => Boolean(item.url));

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-3 sm:p-4 overflow-y-auto"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="creator-identity-modal-title"
    >
      <div
        className="relative w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden my-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="bg-slate-950 px-5 sm:px-6 py-4 sm:py-5 border-b border-slate-800 flex items-center justify-between gap-3">
          <div>
            <p className="text-xs font-medium text-rose-400">
              {bn ? 'অ্যাপ নির্মাতার পরিচিতি ও মালিকানা' : 'App Creator Identity & Ownership'}
            </p>
            <h2
              id="creator-identity-modal-title"
              className="text-lg sm:text-xl font-bold text-white tracking-tight mt-0.5"
            >
              {bn ? 'নির্মাতার প্রোফাইল' : 'Creator Profile'}
            </h2>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition"
            aria-label={bn ? 'বন্ধ করুন' : 'Close'}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Mode Switch Tabs */}
        <div className="px-5 sm:px-6 pt-4 flex items-center gap-2 border-b border-slate-800/80 pb-3 bg-slate-900">
          <button
            type="button"
            onClick={() => setMode('card')}
            className={`min-h-[44px] px-4 rounded-xl text-xs sm:text-sm font-semibold flex items-center gap-2 transition ${
              mode === 'card'
                ? 'bg-rose-500 text-white shadow-sm'
                : 'bg-slate-800 text-slate-300 hover:text-white'
            }`}
          >
            <UserCheck className="w-4 h-4" />
            <span>{bn ? 'পরিচিতি কার্ড' : 'Identity Card'}</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setDraft(profile);
              setMode('edit');
            }}
            className={`min-h-[44px] px-4 rounded-xl text-xs sm:text-sm font-semibold flex items-center gap-2 transition ${
              mode === 'edit'
                ? 'bg-rose-500 text-white shadow-sm'
                : 'bg-slate-800 text-slate-300 hover:text-white'
            }`}
          >
            <Edit3 className="w-4 h-4" />
            <span>{bn ? 'তথ্য এডিট করুন' : 'Edit Identity'}</span>
          </button>
        </div>

        {savedNotice && (
          <div className="mx-5 sm:mx-6 mt-4 px-4 py-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs sm:text-sm flex items-center gap-2">
            <Check className="w-4 h-4 shrink-0" />
            <span>
              {bn
                ? 'আপনার নির্মাতার পরিচিতি সফলভাবে সংরক্ষণ করা হয়েছে!'
                : 'Your creator identity has been saved!'}
            </span>
          </div>
        )}

        {mode === 'card' ? (
          <div className="p-5 sm:p-6 space-y-6">
            {/* Hero Identity Block */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-5">
              <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl bg-gradient-to-tr from-rose-500 via-pink-500 to-sky-500 p-0.5 shrink-0 shadow-lg">
                <div className="w-full h-full rounded-[14px] bg-slate-950 overflow-hidden flex items-center justify-center">
                  {hasAvatar ? (
                    <img
                      src={profile.avatarUrl}
                      alt={profile.name}
                      referrerPolicy="no-referrer"
                      onError={() => setAvatarLoadError(true)}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
                      {initials}
                    </span>
                  )}
                </div>
              </div>

              <div className="min-w-0 flex-1 space-y-1.5">
                <p className="text-xs font-medium text-sky-400">
                  {profile.studioName || 'Downloader Pro'}
                </p>
                <h3 className="text-xl sm:text-2xl font-bold text-white tracking-tight break-words">
                  {profile.name}
                </h3>
                <p className="text-sm text-slate-300">
                  {profile.role || (bn ? 'অ্যাপ নির্মাতা ও ডেভেলপার' : 'App Creator & Developer')}
                </p>

                {/* Unboxed inline metadata separated by middot */}
                <div className="pt-1 flex flex-wrap items-center gap-x-2.5 gap-y-1 text-xs text-slate-400">
                  {profile.location && (
                    <span className="inline-flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-slate-500" />
                      <span>{profile.location}</span>
                    </span>
                  )}
                  {profile.location && profile.email && <span aria-hidden="true">·</span>}
                  {profile.email && (
                    <a
                      href={`mailto:${profile.email}`}
                      className="inline-flex items-center gap-1 hover:text-white transition break-all"
                    >
                      <Mail className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                      <span>{profile.email}</span>
                    </a>
                  )}
                  {(profile.location || profile.email) && <span aria-hidden="true">·</span>}
                  <span>
                    © {profile.copyrightYear} {profile.name}
                  </span>
                </div>
              </div>
            </div>

            {/* Bio */}
            {profile.bio && (
              <div className="pt-4 border-t border-slate-800">
                <h4 className="text-xs font-semibold text-slate-400 mb-1.5">
                  {bn ? 'নির্মাতা সম্পর্কে' : 'About the Creator'}
                </h4>
                <p className="text-sm text-slate-200 leading-relaxed">{profile.bio}</p>
              </div>
            )}

            {/* Social / Portfolio Links (only shown if populated) */}
            {socialLinks.length > 0 && (
              <div className="pt-4 border-t border-slate-800">
                <h4 className="text-xs font-semibold text-slate-400 mb-3">
                  {bn ? 'যোগাযোগ ও প্রোফাইল লিংক' : 'Links & Channels'}
                </h4>
                <div className="flex flex-wrap gap-2.5">
                  {socialLinks.map((item) => {
                    const Icon = item.icon;
                    return (
                      <a
                        key={item.label}
                        href={item.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="min-h-[44px] px-3.5 rounded-xl bg-slate-950 border border-slate-800 hover:border-slate-600 text-xs sm:text-sm font-medium text-slate-200 hover:text-white inline-flex items-center gap-2 transition"
                      >
                        <Icon className="w-4 h-4 text-sky-400" />
                        <span>{item.label}</span>
                        <ExternalLink className="w-3.5 h-3.5 text-slate-500" />
                      </a>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Ownership Attribution Summary */}
            <div className="pt-4 border-t border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-slate-400">
              <span>
                {bn
                  ? `ডিজাইন ও নির্মাণ: ${profile.name} · সর্বস্বত্ব সংরক্ষিত (${profile.copyrightYear})`
                  : `Built & Maintained by ${profile.name} · All rights reserved (${profile.copyrightYear})`}
              </span>
              <span>
                {profile.showInFooter
                  ? bn
                    ? 'অ্যাপ ফুটারে দৃশ্যমান'
                    : 'Visible in footer'
                  : bn
                  ? 'ফুটারে লুকানো আছে'
                  : 'Hidden in footer'}
              </span>
            </div>

            {/* Primary Actions */}
            <div className="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
              <button
                type="button"
                onClick={handleShareIdentity}
                className="min-h-[44px] flex-1 px-4 rounded-xl bg-rose-500 hover:bg-rose-600 text-white text-sm font-semibold inline-flex items-center justify-center gap-2 transition active:scale-[0.99]"
              >
                {sharedSuccess ? <Check className="w-4 h-4" /> : <Share2 className="w-4 h-4" />}
                <span>
                  {sharedSuccess
                    ? bn
                      ? 'শেয়ার করা হয়েছে!'
                      : 'Shared!'
                    : bn
                    ? 'পরিচিতি শেয়ার করুন'
                    : 'Share Identity'}
                </span>
              </button>

              <button
                type="button"
                onClick={handleCopyCredit}
                className="min-h-[44px] px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-sm font-semibold inline-flex items-center justify-center gap-2 transition"
              >
                {copiedContact ? (
                  <Check className="w-4 h-4 text-emerald-400" />
                ) : (
                  <Copy className="w-4 h-4" />
                )}
                <span>
                  {copiedContact
                    ? bn
                      ? 'কপি হয়েছে'
                      : 'Copied'
                    : bn
                    ? 'ক্রেডিট কপি'
                    : 'Copy Credit'}
                </span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setDraft(profile);
                  setMode('edit');
                }}
                className="min-h-[44px] px-4 rounded-xl bg-slate-950 border border-slate-700 hover:border-slate-500 text-slate-200 text-sm font-semibold inline-flex items-center justify-center gap-2 transition"
              >
                <Edit3 className="w-4 h-4 text-sky-400" />
                <span>{bn ? 'তথ্য এডিট' : 'Edit'}</span>
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSave} className="p-5 sm:p-6 space-y-5 max-h-[75vh] overflow-y-auto">
            {/* Optional Google Account Quick Import */}
            {currentUser && (
              <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="text-xs text-slate-300">
                  <span className="font-semibold text-white">
                    {currentUser.displayName || currentUser.email}
                  </span>{' '}
                  — {bn ? 'Google অ্যাকাউন্ট থেকে নাম, ইমেইল ও ছবি বসাতে পারেন।' : 'Import name, email & avatar from Google.'}
                </div>
                <button
                  type="button"
                  onClick={handleImportFromGoogle}
                  className="min-h-[44px] px-3.5 rounded-xl bg-sky-500/15 border border-sky-500/30 text-sky-300 hover:bg-sky-500/25 text-xs font-semibold inline-flex items-center justify-center gap-1.5 shrink-0 transition"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>{bn ? 'Google থেকে আনুন' : 'Import from Google'}</span>
                </button>
              </div>
            )}

            {/* Avatar Preview + Upload */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 pb-4 border-b border-slate-800">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-rose-500 to-sky-500 p-0.5 shrink-0">
                <div className="w-full h-full rounded-[14px] bg-slate-950 overflow-hidden flex items-center justify-center">
                  {draft.avatarUrl && !avatarLoadError ? (
                    <img
                      src={draft.avatarUrl}
                      alt={draft.name}
                      referrerPolicy="no-referrer"
                      onError={() => setAvatarLoadError(true)}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="text-xl font-bold text-white">
                      {creatorIdentityManager.getInitials(draft.name)}
                    </span>
                  )}
                </div>
              </div>

              <div className="flex-1 w-full space-y-2">
                <div className="flex flex-wrap items-center gap-2">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handlePhotoUpload}
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="min-h-[44px] px-3.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-white inline-flex items-center gap-2 transition"
                  >
                    <Upload className="w-4 h-4 text-rose-400" />
                    <span>{bn ? 'নিজের ছবি আপলোড করুন' : 'Upload Photo'}</span>
                  </button>

                  {draft.avatarUrl && (
                    <button
                      type="button"
                      onClick={() => {
                        setDraft((p) => ({ ...p, avatarUrl: '' }));
                        setAvatarLoadError(false);
                      }}
                      className="min-h-[44px] px-3 rounded-xl bg-slate-950 border border-slate-800 hover:border-rose-500/40 text-xs font-medium text-slate-400 hover:text-rose-400 inline-flex items-center gap-1.5 transition"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>{bn ? 'ছবি সরান' : 'Remove'}</span>
                    </button>
                  )}
                </div>
                <input
                  type="url"
                  value={draft.avatarUrl.startsWith('data:') ? '' : draft.avatarUrl}
                  onChange={(e) => {
                    setDraft((p) => ({ ...p, avatarUrl: e.target.value }));
                    setAvatarLoadError(false);
                  }}
                  placeholder={bn ? 'অথবা ছবির HTTPS লিংক দিন (ঐচ্ছিক)' : 'Or paste image URL (optional)'}
                  className="w-full min-h-[44px] px-3.5 rounded-xl bg-slate-950 border border-slate-800 focus:border-rose-500 outline-none text-xs sm:text-sm text-white placeholder-slate-500"
                />
              </div>
            </div>

            {/* Basic Identity Fields */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  {bn ? 'আপনার নাম *' : 'Creator Name *'}
                </label>
                <input
                  type="text"
                  required
                  value={draft.name}
                  onChange={(e) => setDraft((p) => ({ ...p, name: e.target.value }))}
                  placeholder={bn ? 'যেমন: রুবেল আহমেদ' : 'e.g. Rubel Ahmed'}
                  className="w-full min-h-[44px] px-3.5 rounded-xl bg-slate-950 border border-slate-800 focus:border-rose-500 outline-none text-sm text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  {bn ? 'পদবি / ভূমিকা' : 'Role / Title'}
                </label>
                <input
                  type="text"
                  value={draft.role}
                  onChange={(e) => setDraft((p) => ({ ...p, role: e.target.value }))}
                  placeholder={bn ? 'যেমন: অ্যাপ নির্মাতা ও ডেভেলপার' : 'e.g. App Creator & Developer'}
                  className="w-full min-h-[44px] px-3.5 rounded-xl bg-slate-950 border border-slate-800 focus:border-rose-500 outline-none text-sm text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  {bn ? 'স্টুডিও / ব্র্যান্ডের নাম' : 'Studio / Brand Name'}
                </label>
                <input
                  type="text"
                  value={draft.studioName}
                  onChange={(e) => setDraft((p) => ({ ...p, studioName: e.target.value }))}
                  placeholder="Downloader Pro"
                  className="w-full min-h-[44px] px-3.5 rounded-xl bg-slate-950 border border-slate-800 focus:border-rose-500 outline-none text-sm text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  {bn ? 'যোগাযোগের ইমেইল' : 'Contact Email'}
                </label>
                <input
                  type="email"
                  value={draft.email}
                  onChange={(e) => setDraft((p) => ({ ...p, email: e.target.value }))}
                  placeholder="name@example.com"
                  className="w-full min-h-[44px] px-3.5 rounded-xl bg-slate-950 border border-slate-800 focus:border-rose-500 outline-none text-sm text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  {bn ? 'শহর / দেশ' : 'Location'}
                </label>
                <input
                  type="text"
                  value={draft.location}
                  onChange={(e) => setDraft((p) => ({ ...p, location: e.target.value }))}
                  placeholder={bn ? 'যেমন: ঢাকা, বাংলাদেশ' : 'e.g. Dhaka, Bangladesh'}
                  className="w-full min-h-[44px] px-3.5 rounded-xl bg-slate-950 border border-slate-800 focus:border-rose-500 outline-none text-sm text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  {bn ? 'কপিরাইট সাল' : 'Copyright Year'}
                </label>
                <input
                  type="text"
                  value={draft.copyrightYear}
                  onChange={(e) => setDraft((p) => ({ ...p, copyrightYear: e.target.value }))}
                  placeholder="2026"
                  className="w-full min-h-[44px] px-3.5 rounded-xl bg-slate-950 border border-slate-800 focus:border-rose-500 outline-none text-sm text-white"
                />
              </div>
            </div>

            {/* Bio */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                {bn ? 'নিজের সম্পর্কে সংক্ষিপ্ত বিবরণ (Bio)' : 'Short Bio'}
              </label>
              <textarea
                rows={3}
                value={draft.bio}
                onChange={(e) => setDraft((p) => ({ ...p, bio: e.target.value }))}
                placeholder={
                  bn
                    ? 'আপনি কেন অ্যাপটি বানিয়েছেন বা আপনার পরিচয় লিখুন...'
                    : 'Tell users a little bit about yourself and why you built this app...'
                }
                className="w-full p-3.5 rounded-xl bg-slate-950 border border-slate-800 focus:border-rose-500 outline-none text-sm text-white resize-none"
              />
            </div>

            {/* Social / Portfolio URLs */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-slate-800">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  {bn ? 'ওয়েবসাইট / পোর্টফোলিও' : 'Website URL'}
                </label>
                <input
                  type="text"
                  value={draft.websiteUrl}
                  onChange={(e) => setDraft((p) => ({ ...p, websiteUrl: e.target.value }))}
                  placeholder="https://yoursite.com"
                  className="w-full min-h-[44px] px-3.5 rounded-xl bg-slate-950 border border-slate-800 focus:border-rose-500 outline-none text-sm text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  YouTube {bn ? 'চ্যানেল' : 'Channel'}
                </label>
                <input
                  type="text"
                  value={draft.youtubeUrl}
                  onChange={(e) => setDraft((p) => ({ ...p, youtubeUrl: e.target.value }))}
                  placeholder="https://youtube.com/@..."
                  className="w-full min-h-[44px] px-3.5 rounded-xl bg-slate-950 border border-slate-800 focus:border-rose-500 outline-none text-sm text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Facebook {bn ? 'পেজ / প্রোফাইল' : 'Profile'}
                </label>
                <input
                  type="text"
                  value={draft.facebookUrl}
                  onChange={(e) => setDraft((p) => ({ ...p, facebookUrl: e.target.value }))}
                  placeholder="https://facebook.com/..."
                  className="w-full min-h-[44px] px-3.5 rounded-xl bg-slate-950 border border-slate-800 focus:border-rose-500 outline-none text-sm text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  GitHub {bn ? 'প্রোফাইল' : 'Profile'}
                </label>
                <input
                  type="text"
                  value={draft.githubUrl}
                  onChange={(e) => setDraft((p) => ({ ...p, githubUrl: e.target.value }))}
                  placeholder="https://github.com/..."
                  className="w-full min-h-[44px] px-3.5 rounded-xl bg-slate-950 border border-slate-800 focus:border-rose-500 outline-none text-sm text-white"
                />
              </div>
            </div>

            {/* Footer Visibility Checkbox */}
            <label className="flex items-center justify-between gap-3 p-3.5 rounded-xl bg-slate-950 border border-slate-800 cursor-pointer min-h-[44px]">
              <span className="text-xs sm:text-sm text-slate-200 font-medium">
                {bn
                  ? 'অ্যাপের নিচে (Footer) নির্মাতার ক্রেডিট দেখান'
                  : 'Show creator attribution in app footer'}
              </span>
              <input
                type="checkbox"
                checked={draft.showInFooter}
                onChange={(e) => setDraft((p) => ({ ...p, showInFooter: e.target.checked }))}
                className="w-5 h-5 accent-rose-500 rounded cursor-pointer shrink-0"
              />
            </label>

            {/* Form Buttons */}
            <div className="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
              <button
                type="button"
                onClick={handleReset}
                className="min-h-[44px] px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs sm:text-sm font-semibold inline-flex items-center justify-center gap-2 transition"
              >
                <RotateCcw className="w-4 h-4" />
                <span>{bn ? 'ডিফল্ট রিসেট' : 'Reset Default'}</span>
              </button>

              <div className="flex items-center gap-2.5">
                <button
                  type="button"
                  onClick={() => setMode('card')}
                  className="min-h-[44px] px-4 rounded-xl bg-slate-950 border border-slate-700 text-slate-300 hover:text-white text-xs sm:text-sm font-semibold transition"
                >
                  {bn ? 'বাতিল' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  className="min-h-[44px] flex-1 sm:flex-initial px-6 rounded-xl bg-rose-500 hover:bg-rose-600 text-white text-xs sm:text-sm font-bold inline-flex items-center justify-center gap-2 transition shadow-lg shadow-rose-950/40"
                >
                  <Check className="w-4 h-4" />
                  <span>{bn ? 'পরিচিতি সংরক্ষণ করুন' : 'Save Identity'}</span>
                </button>
              </div>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
