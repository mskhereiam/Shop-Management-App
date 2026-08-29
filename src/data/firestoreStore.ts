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

/**
 * Strips out `undefined` values recursively because Firestore/RTDB reject `undefined` values.
 */
function cleanForFirestore<T>(data: T): any {
  if (data === undefined || data === null) return null;
  return JSON.parse(JSON.stringify(data));
}

function getCleanTenant(tenantId?: string): string {
  if (tenantId && tenantId.trim()) {
    return tenantId.replace(/[^a-zA-Z0-9_-]/g, '_');
  }
  return 'default';
}

/**
 * Real-time subscription to a Firestore collection with persistent cloud storage.
 * If empty on first launch, it seeds initial starter data to Firestore and RTDB.
 */
export function subscribeToCollection<T extends { id: string }>(
  collectionName: string,
  initialData: T[],
  onData: (data: T[]) => void,
  tenantId?: string
): () => void {
  const cleanTenant = getCleanTenant(tenantId);
  const colRef = collection(db, 'users', cleanTenant, collectionName);

  const unsubscribe = onSnapshot(
    colRef,
    async (snapshot) => {
      if (snapshot.empty) {
        if (initialData && initialData.length > 0) {
          try {
            const batch = writeBatch(db);
            initialData.forEach((item) => {
              if (item && item.id) {
                const docRef = doc(db, 'users', cleanTenant, collectionName, String(item.id));
                batch.set(docRef, cleanForFirestore(item));
              }
            });
            await batch.commit();
            console.log(`Firestore initial seeded '${collectionName}' for tenant '${cleanTenant}'`);
          } catch (err: any) {
            console.warn(`Firestore seed error for ${collectionName}:`, err?.message || err);
          }

          // Also seed RTDB
          try {
            if (rtdb) {
              const rtdbMap: Record<string, any> = {};
              initialData.forEach((item) => {
                if (item && item.id) {
                  rtdbMap[String(item.id)] = cleanForFirestore(item);
                }
              });
              await rtdbSet(rtdbRef(rtdb, `users/${cleanTenant}/${collectionName}`), rtdbMap);
            }
          } catch (err: any) {
            console.warn(`RTDB seed error for ${collectionName}:`, err?.message || err);
          }
        }
        onData(initialData);
      } else {
        const items: T[] = [];
        snapshot.forEach((docSnap) => {
          items.push(docSnap.data() as T);
        });
        onData(items);
      }
    },
    (error) => {
      console.warn(`Firestore subscription error on ${collectionName}:`, error?.message || error);
    }
  );

  return unsubscribe;
}

/**
 * Saves or updates a single document directly to Firestore and Realtime Database.
 */
export async function saveDocumentToFirestore<T extends { id: string }>(
  collectionName: string,
  item: T,
  tenantId?: string
): Promise<void> {
  if (!item || !item.id) return;
  const cleanTenant = getCleanTenant(tenantId);
  const cleanItem = cleanForFirestore(item);

  // 1. Save directly to Firestore
  try {
    const docRef = doc(db, 'users', cleanTenant, collectionName, String(item.id));
    await setDoc(docRef, cleanItem, { merge: true });
    console.log(`Firestore saved: users/${cleanTenant}/${collectionName}/${item.id}`);
  } catch (error: any) {
    console.error(`Firestore save error on ${collectionName}/${item.id}:`, error?.message || error);
  }

  // 2. Save directly to Realtime Database
  try {
    if (rtdb) {
      const nodeRef = rtdbRef(rtdb, `users/${cleanTenant}/${collectionName}/${String(item.id)}`);
      await rtdbSet(nodeRef, cleanItem);
    }
  } catch (rtdbError: any) {
    console.warn(`RTDB save note on ${collectionName}:`, rtdbError?.message || rtdbError);
  }
}

/**
 * Deletes a document from Firestore and Realtime Database.
 */
export async function deleteDocumentFromFirestore(
  collectionName: string,
  docId: string,
  tenantId?: string
): Promise<void> {
  if (!docId) return;
  const cleanTenant = getCleanTenant(tenantId);

  // 1. Delete from Firestore
  try {
    const docRef = doc(db, 'users', cleanTenant, collectionName, String(docId));
    await deleteDoc(docRef);
    console.log(`Firestore deleted: users/${cleanTenant}/${collectionName}/${docId}`);
  } catch (error: any) {
    console.error(`Firestore delete error on ${collectionName}/${docId}:`, error?.message || error);
  }

  // 2. Delete from Realtime Database
  try {
    if (rtdb) {
      const nodeRef = rtdbRef(rtdb, `users/${cleanTenant}/${collectionName}/${String(docId)}`);
      await rtdbRemove(nodeRef);
    }
  } catch (rtdbError: any) {
    console.warn(`RTDB delete note on ${collectionName}:`, rtdbError?.message || rtdbError);
  }
}

/**
 * Utility to batch save an array of items to Firestore and Realtime Database.
 */
export async function saveCollectionToFirestore<T extends { id: string }>(
  collectionName: string,
  items: T[],
  tenantId?: string
): Promise<void> {
  if (!items || !Array.isArray(items) || items.length === 0) return;
  const cleanTenant = getCleanTenant(tenantId);

  // 1. Batch write to Firestore
  try {
    const batch = writeBatch(db);
    items.forEach((item) => {
      if (item && item.id) {
        const docRef = doc(db, 'users', cleanTenant, collectionName, String(item.id));
        batch.set(docRef, cleanForFirestore(item), { merge: true });
      }
    });
    await batch.commit();
    console.log(`Firestore batch saved ${items.length} items to '${collectionName}'`);
  } catch (error: any) {
    console.warn(`Firestore batch error on '${collectionName}':`, error?.message || error);
    for (const item of items) {
      if (item && item.id) {
        saveDocumentToFirestore(collectionName, item, tenantId);
      }
    }
  }

  // 2. Write to Realtime Database
  try {
    if (rtdb) {
      const rtdbMap: Record<string, any> = {};
      items.forEach((item) => {
        if (item && item.id) {
          rtdbMap[String(item.id)] = cleanForFirestore(item);
        }
      });
      await rtdbSet(rtdbRef(rtdb, `users/${cleanTenant}/${collectionName}`), rtdbMap);
    }
  } catch (rtdbError: any) {
    console.warn(`RTDB batch error on '${collectionName}':`, rtdbError?.message || rtdbError);
  }
}

/**
 * Saves settings directly to Firestore and Realtime Database.
 */
export async function saveSettingsToFirestore<T>(settings: T, tenantId?: string): Promise<void> {
  if (!settings) return;
  const cleanTenant = getCleanTenant(tenantId);
  const cleanSettings = cleanForFirestore(settings);

  try {
    const docRef = doc(db, 'users', cleanTenant, 'settings', 'main');
    await setDoc(docRef, cleanSettings, { merge: true });
    console.log(`Firestore saved settings for tenant '${cleanTenant}'`);
  } catch (error: any) {
    console.error('Firestore save settings error:', error?.message || error);
  }

  try {
    if (rtdb) {
      await rtdbSet(rtdbRef(rtdb, `users/${cleanTenant}/settings/main`), cleanSettings);
    }
  } catch (rtdbError: any) {
    console.warn('RTDB save settings note:', rtdbError?.message || rtdbError);
  }
}

/**
 * Real-time subscription to settings from Firestore.
 */
export function subscribeToSettings<T>(
  initialSettings: T,
  onData: (data: T) => void,
  tenantId?: string
): () => void {
  const cleanTenant = getCleanTenant(tenantId);
  const docRef = doc(db, 'users', cleanTenant, 'settings', 'main');

  const unsubscribe = onSnapshot(
    docRef,
    async (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data() as T;
        onData(data);
      } else {
        try {
          const cleanSettings = cleanForFirestore(initialSettings);
          await setDoc(docRef, cleanSettings);
          console.log(`Firestore seeded settings for tenant '${cleanTenant}'`);
          if (rtdb) {
            await rtdbSet(rtdbRef(rtdb, `users/${cleanTenant}/settings/main`), cleanSettings);
          }
        } catch (e: any) {
          console.warn('Firestore seed settings note:', e?.message || e);
        }
        onData(initialSettings);
      }
    },
    (error) => {
      console.warn('Firestore settings listener error:', error?.message || error);
    }
  );

  return unsubscribe;
}
