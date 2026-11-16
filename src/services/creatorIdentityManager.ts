import { CreatorProfile, Language } from '../types';

const STORAGE_KEY = 'creator_identity_profile_v1';

const DEFAULT_PROFILE: CreatorProfile = {
  name: 'Rubel',
  role: 'অ্যাপ নির্মাতা ও ডেভেলপার',
  studioName: 'Downloader Pro',
  email: 'rubels1k994@gmail.com',
  location: 'Bangladesh',
  bio: 'দ্রুত, নিরাপদ এবং ব্যবহারবান্ধব ভিডিও ও অডিও ডাউনলোডার অ্যাপের নির্মাতা। ব্যবহারকারীদের জন্য সহজ মিডিয়া অভিজ্ঞতা তৈরি করাই আমার লক্ষ্য।',
  websiteUrl: '',
  youtubeUrl: '',
  facebookUrl: '',
  githubUrl: '',
  avatarUrl: '',
  showInFooter: true,
  copyrightYear: String(new Date().getFullYear()),
  updatedAt: 0,
};

type Listener = (profile: CreatorProfile) => void;

class CreatorIdentityManager {
  private listeners: Set<Listener> = new Set();
  private cachedProfile: CreatorProfile | null = null;

  getProfile(): CreatorProfile {
    if (this.cachedProfile) return this.cachedProfile;

    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed && typeof parsed === 'object') {
          this.cachedProfile = {
            ...DEFAULT_PROFILE,
            ...parsed,
            name: typeof parsed.name === 'string' && parsed.name.trim() ? parsed.name : DEFAULT_PROFILE.name,
            copyrightYear:
              typeof parsed.copyrightYear === 'string' && parsed.copyrightYear.trim()
                ? parsed.copyrightYear
                : DEFAULT_PROFILE.copyrightYear,
          };
          return this.cachedProfile;
        }
      }
    } catch {
      // Ignore storage read errors and fall back to defaults
    }

    this.cachedProfile = { ...DEFAULT_PROFILE };
    return this.cachedProfile;
  }

  saveProfile(partial: Partial<CreatorProfile>): CreatorProfile {
    const current = this.getProfile();
    const next: CreatorProfile = {
      ...current,
      ...partial,
      name: (partial.name ?? current.name).trim() || DEFAULT_PROFILE.name,
      role: (partial.role ?? current.role).trim(),
      studioName: (partial.studioName ?? current.studioName).trim(),
      email: (partial.email ?? current.email).trim(),
      location: (partial.location ?? current.location).trim(),
      bio: (partial.bio ?? current.bio).trim(),
      websiteUrl: this.normalizeUrl(partial.websiteUrl ?? current.websiteUrl),
      youtubeUrl: this.normalizeUrl(partial.youtubeUrl ?? current.youtubeUrl),
      facebookUrl: this.normalizeUrl(partial.facebookUrl ?? current.facebookUrl),
      githubUrl: this.normalizeUrl(partial.githubUrl ?? current.githubUrl),
      avatarUrl: (partial.avatarUrl ?? current.avatarUrl).trim(),
      copyrightYear: (partial.copyrightYear ?? current.copyrightYear).trim() || String(new Date().getFullYear()),
      updatedAt: Date.now(),
    };

    this.cachedProfile = next;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch {
      // Handle quota errors gracefully without crashing
    }

    this.notify(next);
    return next;
  }

  resetProfile(): CreatorProfile {
    const fresh: CreatorProfile = {
      ...DEFAULT_PROFILE,
      updatedAt: 0,
    };
    this.cachedProfile = fresh;
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      // Ignore
    }
    this.notify(fresh);
    return fresh;
  }

  subscribe(listener: Listener): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notify(profile: CreatorProfile) {
    this.listeners.forEach((fn) => {
      try {
        fn(profile);
      } catch {
        // Ignore subscriber error
      }
    });
  }

  private normalizeUrl(raw: string): string {
    const trimmed = raw.trim();
    if (!trimmed) return '';
    if (/^https?:\/\//i.test(trimmed)) return trimmed;
    return `https://${trimmed}`;
  }

  getInitials(name: string): string {
    const parts = name.trim().split(/\s+/).filter(Boolean);
    if (parts.length === 0) return 'CR';
    if (parts.length === 1) return Array.from(parts[0]).slice(0, 2).join('').toUpperCase();
    return (
      (Array.from(parts[0])[0] || '') + (Array.from(parts[parts.length - 1])[0] || '')
    ).toUpperCase();
  }

  formatShareText(profile: CreatorProfile, language: Language): string {
    if (language === 'bn') {
      return `${profile.studioName || 'Downloader Pro'} — নির্মাতা: ${profile.name}${profile.role ? ` (${profile.role})` : ''}${profile.email ? `\nযোগাযোগ: ${profile.email}` : ''}`;
    }
    return `${profile.studioName || 'Downloader Pro'} — Created by ${profile.name}${profile.role ? ` (${profile.role})` : ''}${profile.email ? `\nContact: ${profile.email}` : ''}`;
  }
}

export const creatorIdentityManager = new CreatorIdentityManager();
