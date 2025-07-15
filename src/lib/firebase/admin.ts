// src/lib/firebase/admin.ts

import { initializeApp, getApps, App, cert } from 'firebase-admin/app';
import { getFirestore, Firestore } from 'firebase-admin/firestore';
import { getMessaging, Messaging } from 'firebase-admin/messaging';

let adminApp: App;
let db: Firestore;
let messaging: Messaging;

/**
 * Initializes the Firebase Admin SDK, ensuring that it's only done once.
 * This function is robust and handles different environments (production/development)
 * and ensures that credentials are properly loaded.
 * 
 * @returns An object containing the initialized Firebase Admin App, Firestore, and Messaging services.
 */
function initializeFirebaseAdmin() {
  if (getApps().length > 0) {
    adminApp = getApps()[0];
  } else {
    console.log("🔥 INFO: Initializing Firebase Admin SDK...");
    const serviceAccountKey = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;

    if (!serviceAccountKey) {
      // Throw an error if the service account key is not found. 
      // This is a critical failure, and the app should not proceed without it.
      throw new Error("FIREBASE_SERVICE_ACCOUNT_KEY is not set. The application cannot start without credentials. Please ensure the secret is configured correctly in Google Secret Manager and referenced in apphosting.yaml.");
    }

    try {
      const serviceAccount = JSON.parse(serviceAccountKey);
      adminApp = initializeApp({
        credential: cert(serviceAccount),
      });
      console.log("✅ SUCCESS: Firebase Admin SDK initialized successfully.");
    } catch (error: any) {
      // Catch and log any errors during parsing or initialization.
      console.error("❌ ERROR: Failed to initialize Firebase Admin SDK.", error);
      // Re-throw the error to ensure the application startup fails, preventing it from running in a broken state.
      throw new Error(`Failed to parse FIREBASE_SERVICE_ACCOUNT_KEY or initialize Firebase: ${error.message}`);
    }
  }

  // Once the app is initialized, get the Firestore and Messaging services.
  db = getFirestore(adminApp);
  messaging = getMessaging(adminApp);
  
  return { adminApp, db, messaging };
}

// Initialize and export the Firebase services.
// This ensures that initialization is attempted as soon as this module is imported.
try {
  ({ adminApp, db, messaging } = initializeFirebaseAdmin());
} catch (error) {
  // If initialization fails, log the error and ensure that db and messaging are not used.
  // This is a safeguard, but the throw in initializeFirebaseAdmin should halt execution.
  console.error("❌ CRITICAL: Firebase Admin initialization failed. Firestore and Messaging will not be available.", error);
  // We don't export db and messaging if they are not initialized to prevent further errors.
  // This will cause a runtime error if other parts of the app try to use them, which is the desired behavior.
}

export { db, messaging };
