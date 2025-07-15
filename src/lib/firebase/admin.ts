// src/lib/firebase/admin.ts

import { initializeApp, getApps, App, applicationDefault, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { getMessaging } from 'firebase-admin/messaging';

function getAdminApp(): App | null {
  if (getApps().length > 0) {
    return getApps()[0];
  }

  if (process.env.NODE_ENV === 'production') {
    if (!process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
      console.warn('FIREBASE_SERVICE_ACCOUNT_KEY is not set. Skipping Firebase Admin initialization.');
      return null;
    }
    const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY);
    return initializeApp({
      credential: cert(serviceAccount),
    });
  } else {
    console.log("🔥INFO: Initializing Firebase Admin with Application Default Credentials.");
    return initializeApp({
      credential: applicationDefault(),
    });
  }
}

const adminApp = getAdminApp();

let db: ReturnType<typeof getFirestore> | undefined;
let messaging: ReturnType<typeof getMessaging> | undefined;

if (adminApp) {
  db = getFirestore(adminApp);
  messaging = getMessaging(adminApp);
}

export { db, messaging };
