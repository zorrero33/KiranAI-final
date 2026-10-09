import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getFirestore,
  collection,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  getDocs,
  deleteDoc,
  type Firestore,
} from 'firebase/firestore';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export interface FirebaseAppConfig {
  projectId: string;
  appId: string;
  apiKey: string;
  authDomain: string;
  firestoreDatabaseId?: string;
  storageBucket?: string;
  messagingSenderId?: string;
}

let dbInstance: Firestore | null = null;
let initialized = false;

export function getFirestoreDB(): Firestore | null {
  if (dbInstance) return dbInstance;
  if (initialized) return null;

  try {
    const configPath = path.resolve(__dirname, '../../../firebase-applet-config.json');
    if (!fs.existsSync(configPath)) {
      console.warn('[Firestore] No firebase-applet-config.json found.');
      initialized = true;
      return null;
    }

    const configContent = fs.readFileSync(configPath, 'utf8');
    const config: FirebaseAppConfig = JSON.parse(configContent);

    const app = getApps().length > 0 ? getApp() : initializeApp({
      apiKey: config.apiKey,
      authDomain: config.authDomain,
      projectId: config.projectId,
      storageBucket: config.storageBucket,
      messagingSenderId: config.messagingSenderId,
      appId: config.appId,
    });

    if (config.firestoreDatabaseId && config.firestoreDatabaseId !== '(default)') {
      dbInstance = getFirestore(app, config.firestoreDatabaseId);
    } else {
      dbInstance = getFirestore(app);
    }

    console.log('[Firestore] Connected successfully to project:', config.projectId, 'database:', config.firestoreDatabaseId || '(default)');
    initialized = true;
    return dbInstance;
  } catch (error) {
    console.warn('[Firestore] Initialization failed, using local persistent fallback:', error);
    initialized = true;
    return null;
  }
}

export async function syncDocToFirestore(collName: string, docId: string, data: Record<string, any>): Promise<boolean> {
  const firestore = getFirestoreDB();
  if (!firestore) return false;
  try {
    const docRef = doc(firestore, collName, docId);
    // sanitize undefined
    const cleanData: Record<string, any> = {};
    for (const [k, v] of Object.entries(data)) {
      if (v !== undefined) cleanData[k] = v;
    }
    await setDoc(docRef, cleanData, { merge: true });
    return true;
  } catch (err) {
    console.warn(`[Firestore] Sync failed for ${collName}/${docId}:`, err);
    return false;
  }
}

export async function getDocFromFirestore(collName: string, docId: string): Promise<Record<string, any> | null> {
  const firestore = getFirestoreDB();
  if (!firestore) return null;
  try {
    const docRef = doc(firestore, collName, docId);
    const snap = await getDoc(docRef);
    if (snap.exists()) {
      return snap.data();
    }
    return null;
  } catch (err) {
    console.warn(`[Firestore] Read failed for ${collName}/${docId}:`, err);
    return null;
  }
}

export async function getAllDocsFromFirestore(collName: string): Promise<Record<string, any>[]> {
  const firestore = getFirestoreDB();
  if (!firestore) return [];
  try {
    const colRef = collection(firestore, collName);
    const snap = await getDocs(colRef);
    return snap.docs.map(d => d.data());
  } catch (err) {
    console.warn(`[Firestore] Query failed for ${collName}:`, err);
    return [];
  }
}
