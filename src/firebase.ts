import { initializeApp, getApps, getApp, deleteApp, FirebaseApp } from 'firebase/app';
import { getAuth, signInAnonymously, Auth } from 'firebase/auth';
import { getFirestore, doc, getDocFromServer, Firestore, setDoc } from 'firebase/firestore';
import { getDatabase, ref as rtdbRef, set as rtdbSet, get as rtdbGet, remove as rtdbRemove, Database } from 'firebase/database';
import { getStorage, ref as storageRef, uploadBytes, getDownloadURL, uploadString, FirebaseStorage } from 'firebase/storage';
import { getAnalytics, isSupported, Analytics } from 'firebase/analytics';
import defaultFirebaseConfig from '../firebase-applet-config.json';

export interface FirebaseCustomConfig {
  apiKey: string;
  authDomain?: string;
  projectId: string;
  storageBucket?: string;
  messagingSenderId?: string;
  appId?: string;
  measurementId?: string;
  databaseURL?: string;
  firestoreDatabaseId?: string;
}

export function getActiveFirebaseConfig(): FirebaseCustomConfig {
  if (typeof window !== 'undefined') {
    try {
      const saved = localStorage.getItem('custom_firebase_config_v1');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && parsed.projectId && parsed.apiKey) {
          return parsed;
        }
      }
    } catch (e) {
      console.warn('Error reading custom firebase config:', e);
    }
  }
  return defaultFirebaseConfig as any;
}

export function isUsingCustomFirebaseConfig(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    const saved = localStorage.getItem('custom_firebase_config_v1');
    return Boolean(saved);
  } catch {
    return false;
  }
}

export function saveCustomFirebaseConfig(config: FirebaseCustomConfig) {
  if (typeof window !== 'undefined') {
    localStorage.setItem('custom_firebase_config_v1', JSON.stringify(config));
    window.location.reload();
  }
}

export function resetFirebaseConfigToDefault() {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('custom_firebase_config_v1');
    window.location.reload();
  }
}

const activeConfig = getActiveFirebaseConfig();

// Initialize Firebase App
export const app: FirebaseApp = getApps().length === 0 ? initializeApp(activeConfig as any) : getApp();

// Initialize Auth & Firestore
export const auth: Auth = getAuth(app);
export const db: Firestore = (activeConfig.firestoreDatabaseId && activeConfig.firestoreDatabaseId !== '(default)')
  ? getFirestore(app, activeConfig.firestoreDatabaseId)
  : getFirestore(app);

// Initialize Firebase Realtime Database
export const rtdb: Database = getDatabase(
  app, 
  activeConfig.databaseURL || (activeConfig.projectId ? `https://${activeConfig.projectId}-default-rtdb.firebaseio.com` : undefined)
);

// Initialize Firebase Cloud Storage
export const storage: FirebaseStorage = getStorage(
  app, 
  activeConfig.storageBucket || (activeConfig.projectId ? `${activeConfig.projectId}.appspot.com` : undefined)
);

// Initialize Firebase Analytics safely
export let analytics: Analytics | null = null;
if (typeof window !== 'undefined' && activeConfig.measurementId) {
  isSupported().then((supported) => {
    if (supported) {
      analytics = getAnalytics(app);
      console.log('Firebase Analytics initialized successfully');
    }
  }).catch((err) => {
    console.warn('Analytics initialization skipped/unsupported:', err);
  });
}

// Attempt anonymous sign in to satisfy security rules requiring auth
if (typeof window !== 'undefined') {
  signInAnonymously(auth).then(() => {
    console.log('Firebase Anonymous auth initialized');
  }).catch((err) => {
    console.warn('Firebase Anonymous auth note:', err?.message || err);
  });
}

// Upload file directly to Firebase Storage with permanent URL
export async function uploadFileToFirebaseStorage(
  file: File,
  customPath?: string,
  tenantId?: string
): Promise<{ success: boolean; url?: string; error?: string }> {
  try {
    const timestamp = Date.now();
    const cleanFileName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
    const cleanTenant = (tenantId && tenantId.trim()) ? tenantId.replace(/[^a-zA-Z0-9_-]/g, '_') : 'global';
    
    let fullPath: string;
    if (customPath) {
      fullPath = customPath.startsWith('users/') ? customPath : `users/${cleanTenant}/${customPath}`;
    } else {
      fullPath = `users/${cleanTenant}/uploads/${timestamp}_${cleanFileName}`;
    }
    
    const fileRef = storageRef(storage, fullPath);

    const snapshot = await uploadBytes(fileRef, file, {
      contentType: file.type || 'image/jpeg'
    });
    const downloadURL = await getDownloadURL(snapshot.ref);
    return { success: true, url: downloadURL };
  } catch (error: any) {
    console.error('Firebase Storage upload error:', error);
    return { success: false, error: error?.message || 'Storage upload failed' };
  }
}

// Upload Base64 Data URL to Firebase Storage
export async function uploadDataUrlToFirebaseStorage(
  dataUrl: string,
  fileName: string = 'image.png',
  tenantId?: string
): Promise<{ success: boolean; url?: string; error?: string }> {
  try {
    const timestamp = Date.now();
    const cleanFileName = fileName.replace(/[^a-zA-Z0-9._-]/g, '_');
    const cleanTenant = (tenantId && tenantId.trim()) ? tenantId.replace(/[^a-zA-Z0-9_-]/g, '_') : 'global';
    const fullPath = `users/${cleanTenant}/uploads/${timestamp}_${cleanFileName}`;
    const fileRef = storageRef(storage, fullPath);

    const snapshot = await uploadString(fileRef, dataUrl, 'data_url');
    const downloadURL = await getDownloadURL(snapshot.ref);
    return { success: true, url: downloadURL };
  } catch (error: any) {
    console.error('Firebase Storage data_url upload error:', error);
    return { success: false, error: error?.message || 'Storage upload failed' };
  }
}

// Connection test
export async function testFirestoreConnection(): Promise<{ success: boolean; message: string; latencyMs?: number }> {
  const startTime = Date.now();
  try {
    const testDoc = doc(db, '_connection_test_', 'ping');
    await setDoc(testDoc, { ping: true, timestamp: Date.now() }, { merge: true });
    const latency = Date.now() - startTime;
    return { success: true, message: `Connected to Firestore successfully (${latency}ms)`, latencyMs: latency };
  } catch (error: any) {
    console.warn('Firestore connection check:', error);
    return { success: false, message: error?.message || 'Firestore connection check failed' };
  }
}

if (typeof window !== 'undefined') {
  testFirestoreConnection();
}

export default app;
