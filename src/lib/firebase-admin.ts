import { App, getApps, initializeApp, cert } from 'firebase-admin/app'
import { getFirestore, Firestore } from 'firebase-admin/firestore'
import { getStorage, Storage } from 'firebase-admin/storage'

let cachedApp: App | null = null
let cachedDb: Firestore | null = null
let cachedStorage: Storage | null = null

function getAdminApp(): App {
  if (cachedApp) return cachedApp
  if (getApps().length > 0) {
    cachedApp = getApps()[0]
    return cachedApp
  }
  const privateKey = process.env.FIREBASE_ADMIN_PRIVATE_KEY
  if (!privateKey || !process.env.FIREBASE_ADMIN_PROJECT_ID) {
    throw new Error('Firebase Admin credentials not configured')
  }
  cachedApp = initializeApp({
    credential: cert({
      projectId: process.env.FIREBASE_ADMIN_PROJECT_ID,
      clientEmail: process.env.FIREBASE_ADMIN_CLIENT_EMAIL,
      privateKey: privateKey.replace(/\\n/g, '\n').replace(/^["']|["']$/g, ''),
    }),
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  })
  return cachedApp
}

export function getAdminStorage(): Storage {
  if (cachedStorage) return cachedStorage
  cachedStorage = getStorage(getAdminApp())
  return cachedStorage
}

export function getAdminDb(): Firestore {
  if (cachedDb) return cachedDb
  cachedDb = getFirestore(getAdminApp())
  return cachedDb
}

// Alias para compatibilidad con imports existentes
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const adminDb = new Proxy({} as Firestore, {
  get(_target, prop) {
    return (getAdminDb() as unknown as Record<string | symbol, unknown>)[prop]
  },
})
