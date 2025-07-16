import admin, { ServiceAccount } from 'firebase-admin';
import { getApps } from 'firebase-admin/app';

// This file provides a single, initialized instance of the Firestore database.

let db: admin.firestore.Firestore;

if (getApps().length === 0) {
  const privateKeyRaw = process.env.FIREBASE_PRIVATE_KEY;

  if (!process.env.FIREBASE_PROJECT_ID || !process.env.FIREBASE_CLIENT_EMAIL || !privateKeyRaw) {
    throw new Error('FATAL: Firebase credentials are not set in the environment variables. Please check your .env.local file.');
  }

  // This is the robust way to format the private key from an environment variable.
  const privateKey = privateKeyRaw.replace(/\\n/g, '\n');

  const serviceAccount: ServiceAccount = {
    projectId: process.env.FIREBASE_PROJECT_ID,
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    privateKey: privateKey,
  };

  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
  
  db = admin.firestore();

} else {
  // If the app is already initialized, just get the firestore instance.
  db = admin.firestore();
}


export { db };
