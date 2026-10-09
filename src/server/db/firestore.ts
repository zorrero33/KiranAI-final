import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createRequire } from 'module';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const require = createRequire(import.meta.url);

export interface FirebaseAppConfig {
  projectId: string;
  appId: string;
  apiKey: string;
  authDomain: string;
  firestoreDatabaseId?: string;
  storageBucket?: string;
  messagingSenderId?: string;
}

/**
 * Server-side persistence backend.
 *
 * The Admin SDK is preferred for every server write. It authenticates with a
 * service account instead of the public web API key, so it can legitimately
 * bypass Firestore security rules — the only correct way for the backend to
 * maintain credit ledgers, subscriptions and transactions. The previous client
 * SDK path could never do this: rules denied it, the write failed silently and
 * privileged state was lost on restart.
 *
 * Credentials, in order of precedence:
 *  1. FIREBASE_SERVICE_ACCOUNT_JSON  — full JSON (or base64 JSON) service account key.
 *  2. GOOGLE_APPLICATION_CREDENTIALS — path to a service account key file.
 *  3. Application Default Credentials — automatic on Cloud Run / App Engine.
 *
 * The Admin SDK is loaded lazily so the app still boots without it.
 */
type AdminDocRef = {
  set: (data: Record<string, any>, opts?: { merge?: boolean }) => Promise<unknown>;
  get: () => Promise<{ exists: boolean; data: () => Record<string, any> | undefined }>;
  delete: () => Promise<unknown>;
};
type AdminCollectionRef = {
  doc: (id: string) => AdminDocRef;
  get: () => Promise<{ docs: Array<{ data: () => Record<string, any> }> }>;
};
type AdminDb = { collection: (name: string) => AdminCollectionRef };

type AdminFirestoreModule = { getFirestore: (databaseId?: string) => AdminDb };
type AdminAppModule = {
  initializeApp: (opts: Record<string, any>) => unknown;
  getApps: () => unknown[];
  cert: (serviceAccount: unknown) => unknown;
  applicationDefault: () => unknown;
};

let adminDb: AdminDb | null = null;
let adminInitialized = false;

function loadFirebaseConfig(): FirebaseAppConfig | null {
  try {
    const configPath = path.resolve(__dirname, '../../../firebase-applet-config.json');
    if (!fs.existsSync(configPath)) return null;
    return JSON.parse(fs.readFileSync(configPath, 'utf8'));
  } catch {
    return null;
  }
}

function parseServiceAccount(): unknown | null {
  const raw = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
  if (raw && raw.trim()) {
    try {
      const text = raw.trim().startsWith('{') ? raw : Buffer.from(raw, 'base64').toString('utf8');
      return JSON.parse(text);
    } catch {
      console.warn('[Firestore/Admin] FIREBASE_SERVICE_ACCOUNT_JSON is not valid JSON/base64 JSON.');
      return null;
    }
  }
  const filePath = process.env.GOOGLE_APPLICATION_CREDENTIALS;
  if (filePath && fs.existsSync(filePath)) {
    try {
      return JSON.parse(fs.readFileSync(filePath, 'utf8'));
    } catch {
      console.warn('[Firestore/Admin] GOOGLE_APPLICATION_CREDENTIALS file is not valid JSON.');
      return null;
    }
  }
  return null;
}

/**
 * Lazily initialize the Admin SDK and return its Firestore handle, or null when
 * the SDK or credentials are unavailable (callers fall back to the local store).
 */
export function getAdminFirestore(): AdminDb | null {
  if (adminDb) return adminDb;
  if (adminInitialized) return null;
  adminInitialized = true;

  try {
    const appMod = require('firebase-admin/app') as AdminAppModule;
    const fsMod = require('firebase-admin/firestore') as AdminFirestoreModule;

    const config = loadFirebaseConfig();
    const serviceAccount = parseServiceAccount();

    const options: Record<string, any> = {};
    if (serviceAccount) {
      options.credential = appMod.cert(serviceAccount);
    } else if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
      options.credential = appMod.applicationDefault();
    } else {
      console.warn(
        '[Firestore/Admin] No service account configured. Set FIREBASE_SERVICE_ACCOUNT_JSON or ' +
        'GOOGLE_APPLICATION_CREDENTIALS to enable privileged persistence. Falling back to the local store.'
      );
      return null;
    }

    if (config?.projectId) options.projectId = config.projectId;

    if (appMod.getApps().length === 0) {
      appMod.initializeApp(options);
    }

    const databaseId = config?.firestoreDatabaseId && config.firestoreDatabaseId !== '(default)'
      ? config.firestoreDatabaseId
      : undefined;

    adminDb = fsMod.getFirestore(databaseId);
    console.log('[Firestore/Admin] Privileged persistence enabled for project:', config?.projectId || '(adc)');
    return adminDb;
  } catch (err) {
    console.warn('[Firestore/Admin] Initialization failed, using local persistent fallback:', (err as Error)?.message);
    return null;
  }
}

/**
 * Backwards-compatible accessor. Returns the Admin Firestore handle when
 * privileged persistence is available, otherwise null.
 */
export function getFirestoreDB(): AdminDb | null {
  return getAdminFirestore();
}

function sanitize(data: Record<string, any>): Record<string, any> {
  const clean: Record<string, any> = {};
  for (const [k, v] of Object.entries(data)) {
    if (v !== undefined) clean[k] = v;
  }
  return clean;
}

export async function syncDocToFirestore(collName: string, docId: string, data: Record<string, any>): Promise<boolean> {
  const db = getAdminFirestore();
  if (!db) return false;
  try {
    await db.collection(collName).doc(docId).set(sanitize(data), { merge: true });
    return true;
  } catch (err) {
    console.warn(`[Firestore/Admin] Sync failed for ${collName}/${docId}:`, (err as Error)?.message);
    return false;
  }
}

export async function getDocFromFirestore(collName: string, docId: string): Promise<Record<string, any> | null> {
  const db = getAdminFirestore();
  if (!db) return null;
  try {
    const snap = await db.collection(collName).doc(docId).get();
    return snap.exists ? (snap.data() ?? null) : null;
  } catch (err) {
    console.warn(`[Firestore/Admin] Read failed for ${collName}/${docId}:`, (err as Error)?.message);
    return null;
  }
}

export async function getAllDocsFromFirestore(collName: string): Promise<Record<string, any>[]> {
  const db = getAdminFirestore();
  if (!db) return [];
  try {
    const snap = await db.collection(collName).get();
    return snap.docs.map((d) => d.data());
  } catch (err) {
    console.warn(`[Firestore/Admin] Query failed for ${collName}:`, (err as Error)?.message);
    return [];
  }
}

/** True when privileged persistence (Admin SDK) is actually available. */
export function isAdminPersistenceEnabled(): boolean {
  return !!getAdminFirestore();
}
