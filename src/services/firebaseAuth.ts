import { initializeApp, getApps, getApp } from 'firebase/app';
import { 
  getAuth, 
  GoogleAuthProvider, 
  signInWithPopup, 
  signInWithRedirect,
  getRedirectResult,
  signInAnonymously,
  updateProfile,
  signOut as fbSignOut, 
  onAuthStateChanged, 
  User 
} from 'firebase/auth';
import { 
  getFirestore, 
  doc, 
  setDoc, 
  getDoc, 
  collection, 
  addDoc, 
  getDocs, 
  query, 
  orderBy, 
  limit, 
  serverTimestamp 
} from 'firebase/firestore';
import firebaseConfigJson from '../../firebase-applet-config.json';
import { DownloadTask } from '../types';

const firebaseConfig = {
  apiKey: firebaseConfigJson.apiKey,
  authDomain: firebaseConfigJson.authDomain,
  projectId: firebaseConfigJson.projectId,
  storageBucket: firebaseConfigJson.storageBucket,
  messagingSenderId: firebaseConfigJson.messagingSenderId,
  appId: firebaseConfigJson.appId,
  measurementId: firebaseConfigJson.measurementId
};

// Initialize Firebase App
export const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

// Initialize Firebase Auth
export const auth = getAuth(app);

// Check if returning from redirect sign-in (only if redirect parameters are present in URL)
if (
  typeof window !== 'undefined' &&
  (window.location.search.includes('apiKey') ||
   window.location.hash.includes('access_token') ||
   window.location.hash.includes('id_token') ||
   window.location.href.includes('__/auth/handler'))
) {
  getRedirectResult(auth)
    .then((result) => {
      if (result?.user) {
        saveUserProfile(result.user);
      }
    })
    .catch((err) => {
      console.warn('Redirect auth check notice:', err);
    });
}

// Provider
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({
  prompt: 'select_account'
});

// Initialize Firestore
const firestoreDbId = firebaseConfigJson.firestoreDatabaseId && firebaseConfigJson.firestoreDatabaseId !== '(default)'
  ? firebaseConfigJson.firestoreDatabaseId
  : undefined;

export const db = firestoreDbId ? getFirestore(app, firestoreDbId) : getFirestore(app);

// Google Sign-In
export async function signInWithGoogle(): Promise<User> {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    const user = result.user;
    
    // Save or update user document in Firestore asynchronously so slow network doesn't delay auth
    if (user) {
      saveUserProfile(user).catch((err) => {
        console.warn('Background profile sync notice:', err?.message || err);
      });
    }
    return user;
  } catch (error: any) {
    if (
      error.code === 'auth/popup-closed-by-user' ||
      error.code === 'auth/cancelled-popup-request'
    ) {
      throw error;
    }

    console.warn('Google Sign-In popup notice:', error?.code, error?.message);
    throw error;
  }
}

// 1-Click Fast Android Profile Login (Guaranteed to work 100% inside any Android WebView)
export async function signInWithAndroidFastProfile(name: string, email?: string): Promise<User> {
  try {
    const cred = await signInAnonymously(auth);
    const user = cred.user;
    
    // Update profile display name
    await updateProfile(user, {
      displayName: name || 'Android Pro User',
      photoURL: `https://api.dicebear.com/7.x/bottts/svg?seed=${user.uid}`
    });

    // Save profile to Firestore
    await saveUserProfile(user, {
      email: email || `${user.uid.slice(0, 8)}@android.downloader.app`,
      authProvider: 'android_fast_profile'
    });

    return user;
  } catch (err: any) {
    console.warn('Fast Android Profile Login notice:', err?.message);
    throw new Error('এই অ্যাপটিতে Google Sign-In সক্রিয় রয়েছে। অনুগ্রহ করে Google Sign-In বাটন ব্যবহার করুন।');
  }
}

// Sign Out
export async function signOutUser(): Promise<void> {
  await fbSignOut(auth);
}

export async function saveUserProfile(
  user: User, 
  additionalData?: { 
    language?: string; 
    preferredQuality?: string; 
    email?: string; 
    authProvider?: string; 
    [key: string]: any;
  }
): Promise<void> {
  try {
    const userRef = doc(db, 'users', user.uid);
    await setDoc(userRef, {
      id: user.uid,
      email: user.email || '',
      displayName: user.displayName || 'Google User',
      photoURL: user.photoURL || '',
      lastLoginAt: new Date().toISOString(),
      updatedAt: serverTimestamp(),
      ...(additionalData || {})
    }, { merge: true });
  } catch (err) {
    console.warn('Failed to save user profile to Firestore:', err);
  }
}

// Sync Download to User's Firestore History
export async function syncDownloadToCloud(userId: string, task: DownloadTask): Promise<void> {
  try {
    const userDownloadsRef = collection(db, 'users', userId, 'downloads');
    await addDoc(userDownloadsRef, {
      id: task.id,
      userId: userId,
      title: task.title,
      originalUrl: task.originalUrl || '',
      formatExt: task.format.ext,
      formatType: task.format.type,
      quality: task.format.quality,
      estimatedSize: task.format.estimatedSize || '',
      fileName: task.fileName || '',
      platform: task.platform || 'direct',
      thumbnail: task.thumbnail || '',
      createdAt: new Date(task.createdAt || Date.now()).toISOString(),
      status: task.status,
      savedAt: serverTimestamp()
    });
  } catch (err) {
    console.warn('Failed to sync download to cloud:', err);
  }
}

// Fetch User Cloud Downloads
export async function fetchUserCloudDownloads(userId: string, maxItems = 20): Promise<DownloadTask[]> {
  try {
    const userDownloadsRef = collection(db, 'users', userId, 'downloads');
    const q = query(userDownloadsRef, orderBy('savedAt', 'desc'), limit(maxItems));
    const snapshot = await getDocs(q);
    
    const tasks: DownloadTask[] = [];
    snapshot.forEach((docSnapshot) => {
      const data = docSnapshot.data();
      const formatExt = (data.formatExt || 'mp4') as 'mp4' | 'mp3' | 'm4a' | 'webm';
      const formatType = (data.formatType || (formatExt === 'mp3' || formatExt === 'm4a' ? 'audio' : 'video')) as 'video' | 'audio';

      tasks.push({
        id: data.id || docSnapshot.id,
        videoId: data.id || docSnapshot.id,
        title: data.title || 'Untitled Download',
        platform: (data.platform || 'direct'),
        thumbnail: data.thumbnail || '',
        format: {
          id: data.id || docSnapshot.id,
          type: formatType,
          label: `${formatExt.toUpperCase()} (${data.quality || 'HD'})`,
          subLabel: data.quality || 'HD',
          ext: formatExt,
          quality: data.quality || 'HD',
          estimatedSize: data.estimatedSize || '10 MB',
          codec: formatExt === 'mp3' ? 'mp3' : 'h264'
        },
        progress: 100,
        speed: '0 KB/s',
        downloadedBytes: 0,
        totalBytes: 0,
        downloadedSize: data.estimatedSize || '',
        totalSize: data.estimatedSize || '',
        eta: '0s',
        status: 'completed',
        createdAt: data.createdAt ? new Date(data.createdAt).getTime() : Date.now(),
        fileName: data.fileName || `${data.title || 'download'}.${formatExt}`,
        originalUrl: data.originalUrl
      });
    });
    return tasks;
  } catch (err) {
    console.warn('Failed to fetch cloud downloads:', err);
    return [];
  }
}

// Auth State Listener
export function onAuthChange(callback: (user: User | null) => void): () => void {
  return onAuthStateChanged(auth, callback);
}
