import { 
  collection, 
  doc, 
  setDoc, 
  deleteDoc, 
  onSnapshot, 
  writeBatch 
} from 'firebase/firestore';
import { 
  ref as rtdbRef, 
  set as rtdbSet, 
  remove as rtdbRemove, 
  get as rtdbGet 
} from 'firebase/database';
import { db, rtdb } from '../firebase';

function getCacheKey(key: string, tenantId?: string): string {
  if (tenantId && tenantId.trim()) {
    const cleanTenant = tenantId.replace(/[^a-zA-Z0-9_-]/g, '_');
    return `shopmind_${cleanTenant}_${key}_v1`;
  }
  return `shopmind_${key}_v1`;
}

function getLocalCache<T>(key: string, tenantId?: string): T[] | null {
  try {
    const item = localStorage.getItem(getCacheKey(key, tenantId));
    if (item) {
      const parsed = JSON.parse(item);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch (e) {
    console.warn(`Error reading local cache for ${key}`, e);
  }
  return null;
}

function updateLocalCache<T extends { id: string }>(key: string, item: T, tenantId?: string) {
  try {
    const list = getLocalCache<T>(key, tenantId) || [];
    const idx = list.findIndex((x) => x.id === item.id);
    if (idx >= 0) {
      list[idx] = item;
    } else {
      list.unshift(item);
    }
    localStorage.setItem(getCacheKey(key, tenantId), JSON.stringify(list));
  } catch (e) {
    console.warn(`Error updating local cache for ${key}`, e);
  }
}

function removeFromLocalCache(key: string, docId: string, tenantId?: string) {
  try {
    const list = getLocalCache<{ id: string }>(key, tenantId) || [];
    const filtered = list.filter((x) => x.id !== docId);
    localStorage.setItem(getCacheKey(key, tenantId), JSON.stringify(filtered));
  } catch (e) {
    console.warn(`Error removing from local cache for ${key}`, e);
  }
}

/**
 * Strips out `undefined` values recursively because Firestore/RTDB reject `undefined` values.
 */
function cleanForFirestore<T>(data: T): any {
  if (data === undefined || data === null) return null;
  return JSON.parse(JSON.stringify(data));
}

function getFirestoreCollectionRef(collectionName: string, tenantId?: string) {
  if (tenantId && tenantId.trim()) {
    const cleanTenant = tenantId.replace(/[^a-zA-Z0-9_-]/g, '_');
    return collection(db, 'users', cleanTenant, collectionName);
  }
  return collection(db, collectionName);
}

function getFirestoreDocRef(collectionName: string, docId: string, tenantId?: string) {
  if (tenantId && tenantId.trim()) {
    const cleanTenant = tenantId.replace(/[^a-zA-Z0-9_-]/g, '_');
    return doc(db, 'users', cleanTenant, collectionName, String(docId));
  }
  return doc(db, collectionName, String(docId));
}

function getRtdbPath(collectionName: string, docId?: string, tenantId?: string): string {
  const cleanTenant = (tenantId && tenantId.trim()) ? tenantId.replace(/[^a-zA-Z0-9_-]/g, '_') : 'global';
  if (docId) {
    return `users/${cleanTenant}/${collectionName}/${docId}`;
  }
  return `users/${cleanTenant}/${collectionName}`;
}

/**
 * Utility to listen to a Firestore collection for a specific tenant/user and fall back/seed initial data if empty.
 */
export function subscribeToCollection<T extends { id: string }>(
  collectionName: string,
  initialData: T[],
  onData: (data: T[]) => void,
  tenantId?: string
): () => void {
  const colRef = getFirestoreCollectionRef(collectionName, tenantId);

  const unsubscribe = onSnapshot(
    colRef,
    async (snapshot) => {
      if (snapshot.empty) {
        // Check local cache for this tenant
        const cached = getLocalCache<T>(collectionName, tenantId);
        let dataToSeed = cached && cached.length > 0 ? cached : initialData;

        // Also check Realtime Database before seeding
        try {
          if (rtdb) {
            const rtdbSnap = await rtdbGet(rtdbRef(rtdb, getRtdbPath(collectionName, undefined, tenantId)));
            if (rtdbSnap.exists()) {
              const val = rtdbSnap.val();
              if (val) {
                const rtdbList: T[] = Array.isArray(val) ? val.filter(Boolean) : Object.values(val);
                if (rtdbList.length > 0) {
                  dataToSeed = rtdbList;
                }
              }
            }
          }
        } catch (rtdbErr) {
          console.warn(`RTDB check note for ${collectionName}:`, rtdbErr);
        }

        if (dataToSeed && dataToSeed.length > 0) {
          try {
            const batch = writeBatch(db);
            dataToSeed.forEach((item) => {
              if (item && item.id) {
                const docRef = getFirestoreDocRef(collectionName, item.id, tenantId);
                batch.set(docRef, cleanForFirestore(item));
              }
            });
            await batch.commit();
            console.log(`Firestore seeded collection '${collectionName}' (${tenantId || 'global'}) with ${dataToSeed.length} items`);
          } catch (err: any) {
            console.warn(`Firestore collection '${collectionName}' seed note:`, err?.message || err);
          }

          // Also seed RTDB
          try {
            if (rtdb) {
              const rtdbMap: Record<string, any> = {};
              dataToSeed.forEach((item) => {
                if (item && item.id) {
                  rtdbMap[String(item.id)] = cleanForFirestore(item);
                }
              });
              await rtdbSet(rtdbRef(rtdb, getRtdbPath(collectionName, undefined, tenantId)), rtdbMap);
            }
          } catch (err: any) {
            console.warn(`RTDB collection '${collectionName}' seed note:`, err?.message || err);
          }
        }
      } else {
        const items: T[] = [];
        snapshot.forEach((docSnap) => {
          items.push(docSnap.data() as T);
        });
        // Cache to localStorage
        try {
          localStorage.setItem(getCacheKey(collectionName, tenantId), JSON.stringify(items));
        } catch {}
        onData(items);
      }
    },
    (error) => {
      console.warn(`Firestore collection '${collectionName}' connection note:`, error?.message || error);
    }
  );

  return unsubscribe;
}

/**
 * Utility to save or update a document in Firestore, Realtime Database, and Local Cache for a user
 */
export async function saveDocumentToFirestore<T extends { id: string }>(
  collectionName: string,
  item: T,
  tenantId?: string
): Promise<void> {
  if (!item || !item.id) return;
  const cleanItem = cleanForFirestore(item);

  // 1. Update local cache immediately
  updateLocalCache(collectionName, cleanItem, tenantId);

  // 2. Save to Firestore
  try {
    const docRef = getFirestoreDocRef(collectionName, item.id, tenantId);
    await setDoc(docRef, cleanItem, { merge: true });
    console.log(`Firestore saved '${collectionName}/${item.id}' for tenant ${tenantId || 'global'}`);
  } catch (error: any) {
    console.error(`Firestore save '${collectionName}/${item.id}' error:`, error?.message || error);
  }

  // 3. Save to Realtime Database
  try {
    if (rtdb) {
      const nodeRef = rtdbRef(rtdb, getRtdbPath(collectionName, String(item.id), tenantId));
      await rtdbSet(nodeRef, cleanItem);
    }
  } catch (rtdbError: any) {
    console.warn(`RTDB save '${collectionName}/${item.id}' note:`, rtdbError?.message || rtdbError);
  }
}

/**
 * Utility to delete a document from Firestore, Realtime Database, and Local Cache for a user
 */
export async function deleteDocumentFromFirestore(
  collectionName: string,
  docId: string,
  tenantId?: string
): Promise<void> {
  if (!docId) return;

  // 1. Remove from local cache
  removeFromLocalCache(collectionName, docId, tenantId);

  // 2. Delete from Firestore
  try {
    const docRef = getFirestoreDocRef(collectionName, docId, tenantId);
    await deleteDoc(docRef);
    console.log(`Firestore deleted '${collectionName}/${docId}' for tenant ${tenantId || 'global'}`);
  } catch (error: any) {
    console.error(`Firestore delete '${collectionName}/${docId}' error:`, error?.message || error);
  }

  // 3. Delete from Realtime Database
  try {
    if (rtdb) {
      const nodeRef = rtdbRef(rtdb, getRtdbPath(collectionName, String(docId), tenantId));
      await rtdbRemove(nodeRef);
    }
  } catch (rtdbError: any) {
    console.warn(`RTDB delete '${collectionName}/${docId}' note:`, rtdbError?.message || rtdbError);
  }
}

/**
 * Utility to save an entire array of items to Firestore and Realtime Database for a user
 */
export async function saveCollectionToFirestore<T extends { id: string }>(
  collectionName: string,
  items: T[],
  tenantId?: string
): Promise<void> {
  if (!items || !Array.isArray(items) || items.length === 0) return;
  
  // Cache in localStorage
  try {
    localStorage.setItem(getCacheKey(collectionName, tenantId), JSON.stringify(items));
  } catch {}

  // 1. Batch write to Firestore
  try {
    const batch = writeBatch(db);
    items.forEach((item) => {
      if (item && item.id) {
        const docRef = getFirestoreDocRef(collectionName, item.id, tenantId);
        const cleanItem = cleanForFirestore(item);
        batch.set(docRef, cleanItem, { merge: true });
      }
    });
    await batch.commit();
    console.log(`Firestore batch synced '${collectionName}' for tenant ${tenantId || 'global'} (${items.length} items)`);
  } catch (error: any) {
    console.warn(`Firestore batch sync '${collectionName}' note:`, error?.message || error);
    for (const item of items) {
      if (item && item.id) {
        saveDocumentToFirestore(collectionName, item, tenantId);
      }
    }
  }

  // 2. Batch write to Realtime Database
  try {
    if (rtdb) {
      const rtdbMap: Record<string, any> = {};
      items.forEach((item) => {
        if (item && item.id) {
          rtdbMap[String(item.id)] = cleanForFirestore(item);
        }
      });
      await rtdbSet(rtdbRef(rtdb, getRtdbPath(collectionName, undefined, tenantId)), rtdbMap);
    }
  } catch (rtdbError: any) {
    console.warn(`RTDB batch sync '${collectionName}' note:`, rtdbError?.message || rtdbError);
  }
}

/**
 * Save single settings document to Firestore, Realtime Database, and Local Cache for a user
 */
export async function saveSettingsToFirestore<T>(settings: T, tenantId?: string): Promise<void> {
  if (!settings) return;
  const cleanSettings = cleanForFirestore(settings);

  try {
    localStorage.setItem(getCacheKey('settings', tenantId), JSON.stringify(cleanSettings));
  } catch {}

  try {
    const docRef = tenantId && tenantId.trim()
      ? doc(db, 'users', tenantId.replace(/[^a-zA-Z0-9_-]/g, '_'), 'settings', 'main')
      : doc(db, 'settings', 'main');
    await setDoc(docRef, cleanSettings, { merge: true });
    console.log(`Firestore saved settings for tenant ${tenantId || 'global'}`);
  } catch (error: any) {
    console.error('Firestore save settings error:', error?.message || error);
  }

  try {
    if (rtdb) {
      const cleanTenant = (tenantId && tenantId.trim()) ? tenantId.replace(/[^a-zA-Z0-9_-]/g, '_') : 'global';
      await rtdbSet(rtdbRef(rtdb, `users/${cleanTenant}/settings/main`), cleanSettings);
    }
  } catch (rtdbError: any) {
    console.warn('RTDB save settings note:', rtdbError?.message || rtdbError);
  }
}

/**
 * Subscribe to settings document for a user
 */
export function subscribeToSettings<T>(
  initialSettings: T,
  onData: (data: T) => void,
  tenantId?: string
): () => void {
  const docRef = tenantId && tenantId.trim()
    ? doc(db, 'users', tenantId.replace(/[^a-zA-Z0-9_-]/g, '_'), 'settings', 'main')
    : doc(db, 'settings', 'main');

  const unsubscribe = onSnapshot(
    docRef,
    async (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data() as T;
        try {
          localStorage.setItem(getCacheKey('settings', tenantId), JSON.stringify(data));
        } catch {}
        onData(data);
      } else {
        try {
          const cleanSettings = cleanForFirestore(initialSettings);
          await setDoc(docRef, cleanSettings);
          console.log(`Firestore seeded settings for tenant ${tenantId || 'global'}`);
          if (rtdb) {
            const cleanTenant = (tenantId && tenantId.trim()) ? tenantId.replace(/[^a-zA-Z0-9_-]/g, '_') : 'global';
            await rtdbSet(rtdbRef(rtdb, `users/${cleanTenant}/settings/main`), cleanSettings);
          }
        } catch (e: any) {
          console.warn('Firestore seed settings note:', e?.message || e);
        }
      }
    },
    (error) => {
      console.warn('Firestore settings listener note:', error?.message || error);
    }
  );

  return unsubscribe;
}


