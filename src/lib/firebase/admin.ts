// src/lib/firebase/admin.ts

// Importa as funções necessárias do SDK do Firebase Admin
import { initializeApp, getApps, App, applicationDefault } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { getMessaging } from 'firebase-admin/messaging';

// Esta função garante que o app do Firebase seja inicializado apenas uma vez.
// Em ambientes de desenvolvimento com hot-reload (como o Next.js), o módulo pode ser
// reavaliado, o que causaria múltiplas chamadas a initializeApp() e um erro.
function getAdminApp(): App {
  // getApps() retorna um array de todos os apps Firebase inicializados.
  // Se o array não estiver vazio, significa que o app padrão já existe.
  if (getApps().length > 0) {
    return getApps()[0]; // Retorna a instância já existente.
  }

  // Se nenhum app existir, inicializa um novo.
  // 'applicationDefault()' carrega as credenciais de serviço automaticamente
  // em ambientes Google Cloud, como o Firebase App Hosting.
  return initializeApp({
    credential: applicationDefault(),
  });
}

const adminApp = getAdminApp();
const db = getFirestore(adminApp);
const messaging = getMessaging(adminApp);

// Exporta as instâncias do Firestore e do Messaging para serem usadas em outras partes da aplicação.
export { db, messaging };
