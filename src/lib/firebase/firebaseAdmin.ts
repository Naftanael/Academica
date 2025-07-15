import { initializeApp, getApps, cert, ServiceAccount } from 'firebase-admin/app';
import { getFirestore, Firestore } from 'firebase-admin/firestore';
import { getMessaging, Messaging } from 'firebase-admin/messaging';

let db: Firestore;
let messaging: Messaging;

function initializeFirebaseAdmin() {
  if (getApps().length > 0) {
    const app = getApps()[0];
    db = getFirestore(app);
    messaging = getMessaging(app);
    return;
  }

  try {
    const serviceAccountKeyJson = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
    if (!serviceAccountKeyJson) {
      throw new Error('A variável de ambiente FIREBASE_SERVICE_ACCOUNT_KEY não foi definida.');
    }

    const serviceAccount = JSON.parse(serviceAccountKeyJson) as ServiceAccount;

    const app = initializeApp({
      credential: cert(serviceAccount),
    });

    db = getFirestore(app);
    messaging = getMessaging(app);

  } catch (error) {
    console.error("Falha na inicialização do Firebase Admin SDK:", error);
    throw new Error('Não foi possível conectar ao Firebase.');
  }
}

initializeFirebaseAdmin();

export { db, messaging };
