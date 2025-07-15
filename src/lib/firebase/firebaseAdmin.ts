// src/lib/firebase/firebaseAdmin.ts
import admin from 'firebase-admin';

// Buscando as credenciais do Firebase a partir de variáveis de ambiente.
// Isso é mais seguro do que ter o arquivo de credenciais diretamente no código.
const serviceAccountKey = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
if (!serviceAccountKey) {
  throw new Error('A variável de ambiente FIREBASE_SERVICE_ACCOUNT_KEY não está definida.');
}

const serviceAccount = JSON.parse(serviceAccountKey);

/**
 * Inicialização do Firebase Admin SDK.
 * 
 * Este bloco de código garante que o Firebase seja inicializado apenas uma vez,
 * evitando erros em ambientes de desenvolvimento onde o código pode ser recarregado.
 * 
 * Se a inicialização falhar, um erro claro será lançado, ajudando na depuração.
 */
try {
  if (!admin.apps.length) {
    console.log("DEBUG: Inicializando o Firebase Admin SDK...");
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });
    console.log("DEBUG: Firebase Admin SDK inicializado com sucesso.");
  }
} catch (error: any) {
  console.error("ERRO CRÍTICO: Falha ao inicializar o Firebase Admin SDK.", error);
  // Em um ambiente de produção, você poderia enviar este erro para um serviço de monitoramento.
  throw new Error(`Falha na conexão com o Firebase: ${error.message}`);
}

// Exportando as instâncias do Firestore e do Messaging para serem usadas na aplicação.
export const db = admin.firestore();
export const messaging = admin.messaging();
