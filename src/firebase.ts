import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, signInAnonymously } from 'firebase/auth';
import { getFirestore, doc, getDocFromServer } from 'firebase/firestore';
import { getDatabase, ref as rtdbRef, set as rtdbSet, get as rtdbGet, remove as rtdbRemove } from 'firebase/database';
import { getStorage, ref as storageRef, uploadBytes, getDownloadURL, uploadString } from 'firebase/storage';
import { getAnalytics, isSupported, Analytics } from 'firebase/analytics';
import firebaseConfig from '../firebase-applet-config.json';

// Initialize Firebase App
const app = getApps().length === 0 ? initializeApp(firebaseConfig as any) : getApp();

// Initialize Auth & Firestore
export const auth = getAuth(app);
export const db = (firebaseConfig.firestoreDatabaseId && firebaseConfig.firestoreDatabaseId !== '(default)')
  ? getFirestore(app, firebaseConfig.firestoreDatabaseId)
  : getFirestore(app);

// Initialize Firebase Realtime Database
export const rtdb = getDatabase(app, (firebaseConfig as any).databaseURL || undefined);

// Initialize Firebase Cloud Storage
export const storage = getStorage(app, firebaseConfig.storageBucket || undefined);

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

// Initialize Analytics if supported
export let analytics: Analytics | null = null;
if (typeof window !== 'undefined') {
  isSupported().then((supported) => {
    if (supported) {
      analytics = getAnalytics(app);
    }
  }).catch((err) => {
    console.warn('Firebase Analytics error:', err);
  });
}

// Connection test
async function testFirestoreConnection() {
  try {
    await getDocFromServer(doc(db, '_connection_test_', 'test'));
    console.log('Successfully connected to Firestore database:', firebaseConfig.firestoreDatabaseId);
  } catch (error) {
    console.warn('Firestore connection check:', error);
  }
}

if (typeof window !== 'undefined') {
  testFirestoreConnection();
}

export default app;
