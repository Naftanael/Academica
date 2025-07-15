// src/lib/firebase/admin.ts
import { initializeApp, getApps, App, cert, ServiceAccount } from 'firebase-admin/app';
import { getFirestore, Firestore } from 'firebase-admin/firestore';
import { getMessaging, Messaging } from 'firebase-admin/messaging';

// Definição de uma interface para os serviços do Firebase para tipagem forte.
interface FirebaseAdminServices {
  app: App;
  db: Firestore;
  messaging: Messaging;
}

// Singleton para armazenar a instância dos serviços.
let services: FirebaseAdminServices | null = null;

/**
 * Decodifica e analisa a chave da conta de serviço do Firebase a partir de variáveis de ambiente.
 * Prioriza a chave codificada em Base64, que é mais segura para ambientes de CI/CD e deployment.
 * @returns O objeto de conta de serviço do Firebase.
 */
function getServiceAccount(): ServiceAccount {
  const base64Key = process.env.FIREBASE_SERVICE_ACCOUNT_BASE64;
  const jsonKey = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;

  if (base64Key) {
    console.log("🔥 INFO: Found FIREBASE_SERVICE_ACCOUNT_BASE64. Decoding...");
    try {
      const decodedKey = Buffer.from(base64Key, 'base64').toString('utf-8');
      return JSON.parse(decodedKey) as ServiceAccount;
    } catch (error: any) {
      console.error("❌ CRITICAL ERROR: Failed to decode or parse Base64 service account key.", error.message);
      throw new Error("Invalid Base64 or JSON format in FIREBASE_SERVICE_ACCOUNT_BASE64.");
    }
  }

  if (jsonKey) {
    console.log("🔥 INFO: Found FIREBASE_SERVICE_ACCOUNT_KEY. Parsing...");
    try {
      // Esta abordagem é frágil devido a caracteres de nova linha.
      // AVISO: Recomenda-se usar a versão Base64 para maior robustez.
      console.warn("⚠️ WARNING: Using raw JSON from env var is not recommended. Consider using FIREBASE_SERVICE_ACCOUNT_BASE64 instead.");
      return JSON.parse(jsonKey) as ServiceAccount;
    } catch (error: any) {
      console.error("❌ CRITICAL ERROR: Failed to parse JSON service account key.", error.message);
      throw new Error("Invalid JSON format in FIREBASE_SERVICE_ACCOUNT_KEY. Check for unescaped newlines.");
    }
  }

  // Erro fatal se nenhuma credencial for encontrada.
  throw new Error(
    "Firebase Admin credentials are not set. Please set FIREBASE_SERVICE_ACCOUNT_BASE64 in your environment variables."
  );
}

/**
 * Inicializa o Firebase Admin SDK usando um padrão Singleton para garantir que seja executado apenas uma vez.
 * A aplicação irá parar (throw) se a inicialização falhar, prevenindo operações em um estado inválido.
 * @returns Um objeto contendo a app, db e messaging do Firebase Admin.
 */
function initializeFirebaseAdmin(): FirebaseAdminServices {
  if (services) {
    return services;
  }

  // Verifica se a app já foi inicializada em outro lugar (menos provável, mas seguro).
  if (getApps().length > 0) {
    const app = getApps()[0];
    services = {
      app,
      db: getFirestore(app),
      messaging: getMessaging(app),
    };
    return services;
  }

  console.log("🚀 INFO: Initializing Firebase Admin SDK for the first time...");
  
  try {
    const serviceAccount = getServiceAccount();
    const app = initializeApp({
      credential: cert(serviceAccount),
    });

    console.log("✅ SUCCESS: Firebase Admin SDK initialized successfully.");

    services = {
      app,
      db: getFirestore(app),
      messaging: getMessaging(app),
    };

    return services;

  } catch (error: any) {
    console.error("❌ FATAL: Could not initialize Firebase Admin SDK.", error);
    // Para a execução. A aplicação não pode funcionar sem o Firebase.
    throw new Error(`Firebase initialization failed: ${error.message}`);
  }
}

// Inicializa e exporta os serviços.
// Qualquer falha aqui irá parar o build ou o boot do servidor, o que é o comportamento desejado (Fail Fast).
const { db, messaging } = initializeFirebaseAdmin();

export { db, messaging };
