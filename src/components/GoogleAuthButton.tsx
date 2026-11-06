import React, { useState, useEffect, useRef } from 'react';
import { User } from 'firebase/auth';
import { 
  signInWithGoogle, 
  signOutUser, 
  onAuthChange,
  fetchUserCloudDownloads 
} from '../services/firebaseAuth';
import { Language, DownloadTask } from '../types';
import { LogOut, Cloud, CloudCheck, UserCheck, ChevronDown, RefreshCw, AlertCircle, ExternalLink, X } from 'lucide-react';

interface Props {
  language: Language;
  onCloudSyncLoaded?: (cloudTasks: DownloadTask[]) => void;
}

export const GoogleAuthButton: React.FC<Props> = ({ language, onCloudSyncLoaded }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [signingIn, setSigningIn] = useState<boolean>(false);
  const [dropdownOpen, setDropdownOpen] = useState<boolean>(false);
  const [syncing, setSyncing] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const unsubscribe = onAuthChange((currentUser) => {
      setUser(currentUser);
      setLoading(false);
      if (currentUser && onCloudSyncLoaded) {
        // Fetch cloud downloads on login
        fetchUserCloudDownloads(currentUser.uid)
          .then((tasks) => {
            if (tasks.length > 0) {
              onCloudSyncLoaded(tasks);
            }
          })
          .catch((err) => console.warn(err));
      }
    });

    return () => unsubscribe();
  }, [onCloudSyncLoaded]);

  // Click outside to close dropdown
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSignIn = async () => {
    try {
      setSigningIn(true);
      setErrorMsg(null);
      await signInWithGoogle();
    } catch (err: any) {
      if (err.code === 'auth/cancelled-popup-request' || err.code === 'auth/popup-closed-by-user') {
        // User closed popup intentionally
        return;
      }

      console.warn('Google Sign in notice:', err.code, err.message);

      if (err.code === 'auth/popup-blocked') {
        setErrorMsg(
          language === 'bn' 
            ? 'ব্রাউজার পপ-আপ ব্লক করেছে। অনুগ্রহ করে ব্রাউজারে পপ-আপ অনুমতি দিন।' 
            : 'Popup was blocked by browser. Please allow popups for this site.'
        );
      } else if (err.code === 'auth/internal-error' || err.message?.includes('internal-error')) {
        setErrorMsg(
          language === 'bn'
            ? 'ব্রাউজার সিকিউরিটি বা অ্যাড-ব্লকারের কারণে লগইন পপ-আপ সংযোগ করতে পারেনি। নতুন ট্যাবে অ্যাপটি খুলুন বা পপ-আপ অনুমোদন দিন।'
            : 'Google Sign-In popup could not connect due to browser or iframe security. Please allow popups or open in a direct tab.'
        );
      } else if (err.code === 'auth/network-request-failed' || err.message?.includes('network-request-failed')) {
        setErrorMsg(
          language === 'bn'
            ? 'গুগল সার্ভার বা ইন্টারনেট সংযোগে সমস্যা হয়েছে (auth/network-request-failed)। আপনার নেটওয়ার্ক সংযোগ বা অ্যাড-ব্লকার চেক করে পুনরায় চেষ্টা করুন।'
            : 'Network connection issue with Google servers. Please check your internet connection or ad-blocker and retry.'
        );
      } else {
        setErrorMsg(err.message || (language === 'bn' ? 'লগইন সম্পন্ন করা সম্ভব হয়নি' : 'Sign in failed'));
      }
    } finally {
      setSigningIn(false);
    }
  };

  const handleSignOut = async () => {
    try {
      setLoading(true);
      await signOutUser();
      setDropdownOpen(false);
    } catch (err) {
      console.error('Sign out error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleManualSync = async () => {
    if (!user) return;
    try {
      setSyncing(true);
      const cloudTasks = await fetchUserCloudDownloads(user.uid);
      if (onCloudSyncLoaded && cloudTasks.length > 0) {
        onCloudSyncLoaded(cloudTasks);
      }
    } catch (err) {
      console.error('Sync failed:', err);
    } finally {
      setSyncing(false);
    }
  };

  if (loading) {
    return (
      <div className="h-8 w-24 rounded-lg bg-slate-900 border border-slate-800 animate-pulse" />
    );
  }

  // Not signed in state
  if (!user) {
    return (
      <div className="relative">
        <button
          id="google-signin-btn"
          onClick={handleSignIn}
          disabled={signingIn}
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold bg-white text-slate-800 hover:bg-slate-100 border border-slate-200 transition shadow-sm hover:shadow active:scale-95 disabled:opacity-60 select-none"
          title="Sign in with Google Account"
        >
          {signingIn ? (
            <RefreshCw className="w-3.5 h-3.5 text-slate-600 animate-spin" />
          ) : (
            <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
              />
            </svg>
          )}
          <span className="hidden sm:inline">
            {language === 'bn' ? 'গুগল লগইন' : 'Google Sign In'}
          </span>
          <span className="sm:hidden">
            {language === 'bn' ? 'লগইন' : 'Sign in'}
          </span>
        </button>

        {errorMsg && (
          <div className="absolute right-0 top-full mt-2 w-72 p-3 rounded-xl bg-slate-900 border border-red-500/40 text-xs text-red-200 shadow-2xl z-50 flex flex-col gap-2 backdrop-blur-xl">
            <div className="flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
              <p className="flex-1 leading-relaxed text-[11px]">{errorMsg}</p>
              <button
                onClick={() => setErrorMsg(null)}
                className="text-slate-400 hover:text-white p-0.5"
                title="Dismiss"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
            <div className="flex items-center gap-2 pt-1 border-t border-slate-800">
              <button
                onClick={handleSignIn}
                disabled={signingIn}
                className="flex-1 inline-flex items-center justify-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-[11px] font-semibold transition active:scale-95 disabled:opacity-50"
              >
                <RefreshCw className={`w-3 h-3 ${signingIn ? 'animate-spin' : ''}`} />
                <span>{language === 'bn' ? 'পুনরায় চেষ্টা' : 'Retry'}</span>
              </button>
              {typeof window !== 'undefined' && window.self !== window.top && (
                <a
                  href={window.location.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center gap-1 px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-[11px] font-medium border border-slate-700 transition"
                  title={language === 'bn' ? 'সরাসরি নতুন ট্যাবে খুলুন' : 'Open in direct tab'}
                >
                  <ExternalLink className="w-3 h-3" />
                </a>
              )}
            </div>
          </div>
        )}
      </div>
    );
  }

  // Signed in state with Avatar and Popover
  return (
    <div className="relative" ref={dropdownRef}>
      <button
        id="user-profile-menu-btn"
        onClick={() => setDropdownOpen(!dropdownOpen)}
        className="flex items-center gap-2 p-1 pl-1.5 pr-2.5 rounded-full bg-slate-900 border border-slate-700/80 hover:border-slate-600 text-slate-200 transition shadow-sm hover:shadow"
        title={user.displayName || user.email || 'Google Account'}
      >
        {user.photoURL ? (
          <img
            src={user.photoURL}
            alt={user.displayName || 'User'}
            className="w-6 h-6 rounded-full object-cover ring-1 ring-emerald-500/50"
            referrerPolicy="no-referrer"
          />
        ) : (
          <div className="w-6 h-6 rounded-full bg-gradient-to-tr from-rose-500 to-indigo-600 flex items-center justify-center text-[11px] font-bold text-white uppercase">
            {(user.displayName || user.email || 'U')[0]}
          </div>
        )}

        <div className="flex flex-col text-left max-w-[80px] sm:max-w-[120px] truncate">
          <span className="text-[11px] font-semibold text-white leading-tight truncate">
            {user.displayName?.split(' ')[0] || 'User'}
          </span>
          <span className="text-[9px] text-emerald-400 flex items-center gap-1 font-medium">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
            {language === 'bn' ? 'সিঙ্কড' : 'Synced'}
          </span>
        </div>

        <ChevronDown className={`w-3 h-3 text-slate-400 transition-transform ${dropdownOpen ? 'rotate-180' : ''}`} />
      </button>

      {dropdownOpen && (
        <div className="absolute right-0 top-full mt-2 w-72 rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl p-4 z-50 animate-in fade-in zoom-in-95 duration-150">
          {/* User Header */}
          <div className="flex items-center gap-3 pb-3 border-b border-slate-800">
            {user.photoURL ? (
              <img
                src={user.photoURL}
                alt={user.displayName || 'User'}
                className="w-11 h-11 rounded-full object-cover ring-2 ring-emerald-500"
                referrerPolicy="no-referrer"
              />
            ) : (
              <div className="w-11 h-11 rounded-full bg-gradient-to-tr from-rose-500 to-indigo-600 flex items-center justify-center text-sm font-bold text-white uppercase shadow-md">
                {(user.displayName || user.email || 'U')[0]}
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold text-white truncate">
                {user.displayName || 'Google User'}
              </p>
              <p className="text-[11px] text-slate-400 truncate">
                {user.email}
              </p>
              <div className="mt-1 flex items-center gap-1 text-[10px] text-sky-400 font-medium">
                <UserCheck className="w-3 h-3" />
                <span>{language === 'bn' ? 'গুগল অথেন্টিকেশন সক্রিয়' : 'Google Auth Verified'}</span>
              </div>
            </div>
          </div>

          {/* Sync status section */}
          <div className="mt-3 py-2 px-2.5 rounded-xl bg-slate-950/60 border border-slate-800/80 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Cloud className="w-4 h-4 text-emerald-400" />
              <div>
                <p className="text-[11px] font-semibold text-slate-200">
                  {language === 'bn' ? 'ক্লাউড হিস্টোরি ব্যাকআপ' : 'Cloud History Sync'}
                </p>
                <p className="text-[10px] text-slate-400">
                  {language === 'bn' ? 'ক্রোম ও ফোনে অটো সেভ' : 'Synced across Chrome & devices'}
                </p>
              </div>
            </div>
            <button
              onClick={handleManualSync}
              disabled={syncing}
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition disabled:opacity-50"
              title="Sync now"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${syncing ? 'animate-spin text-emerald-400' : ''}`} />
            </button>
          </div>

          {/* Sign Out Button */}
          <div className="mt-4 pt-2 border-t border-slate-800 flex justify-end">
            <button
              onClick={handleSignOut}
              className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-xs font-medium text-red-400 hover:text-red-300 hover:bg-red-500/10 border border-red-500/20 transition"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>{language === 'bn' ? 'লগআউট করুন' : 'Sign Out'}</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
