import { initializeApp, getApps, App, cert, ServiceAccount } from 'firebase-admin/app';
import { getFirestore, Firestore } from 'firebase-admin/firestore';
import { getMessaging, Messaging } from 'firebase-admin/messaging';

let db: Firestore;
let messaging: Messaging;

// This function initializes the Firebase Admin SDK.
function initializeFirebaseAdmin() {
  // If the app is already initialized, use the existing instance.
  const apps = getApps();
  if (apps.length > 0) {
    const app = apps[0];
    db = getFirestore(app);
    messaging = getMessaging(app);
    return;
  }

  // If not initialized, proceed with the setup.
  try {
    const jsonKey = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
    if (!jsonKey) {
      throw new Error('FIREBASE_SERVICE_ACCOUNT_KEY environment variable not set.');
    }

    const serviceAccount = JSON.parse(jsonKey) as ServiceAccount;

    // This is the critical part: Replace the escaped newlines ('
') in the
    // private key with actual newlines ('
'). Using new RegExp() is the
    // most robust way to do this and avoids syntax errors during the build.
    if (serviceAccount.private_key) {
      serviceAccount.private_key = serviceAccount.private_key.replace(new RegExp('
', 'g'), '
');
    }

    const app = initializeApp({
      credential: cert(serviceAccount),
    });

    db = getFirestore(app);
    messaging = getMessaging(app);

  } catch (error) {
    console.error("Firebase Admin SDK initialization failed:", error);
    // To allow the build to succeed even if Firebase initialization fails (e.g., in a CI/CD environment
    // without the key), we assign dummy objects. The app will fail at runtime if Firebase is used.
    db = {} as Firestore;
    messaging = {} as Messaging;
  }
}

// Initialize the app.
initializeFirebaseAdmin();

// Export the initialized services.
export { db, messaging };
