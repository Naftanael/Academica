/**
 * @file Este arquivo é responsável pela inicialização do Firebase Admin SDK.
 * A inicialização é feita utilizando um padrão Singleton para garantir que o SDK
 * seja configurado apenas uma vez durante o ciclo de vida da aplicação no servidor.
 *
 * Para simplificar a configuração no ambiente de desenvolvimento, este script
 * lê as credenciais diretamente de um objeto JSON armazenado na variável de ambiente
 * `FIREBASE_SERVICE_ACCOUNT_KEY`.
 */

// Importações necessárias do Firebase Admin SDK.
import {
  initializeApp,
  getApps,
  App,
  cert,
  ServiceAccount,
} from 'firebase-admin/app';
import { getFirestore, Firestore } from 'firebase-admin/firestore';
import { getMessaging, Messaging } from 'firebase-admin/messaging';

// Definição de uma interface para agrupar os serviços do Firebase.
interface FirebaseAdminServices {
  app: App;
  db: Firestore;
  messaging: Messaging;
}

// Variável para armazenar a instância única (Singleton) dos serviços do Firebase.
let services: FirebaseAdminServices | null = null;

/**
 * Obtém as credenciais da conta de serviço do Firebase a partir da variável de ambiente.
 *
 * @returns O objeto de credenciais (`ServiceAccount`) para inicializar o Firebase.
 * @throws Lança um erro crítico se a variável de ambiente não for encontrada ou
 *         se o seu conteúdo não for um JSON válido.
 */
function getServiceAccount(): ServiceAccount {
  // Lê a chave em formato JSON diretamente da variável de ambiente.
  const jsonKey = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;

  if (!jsonKey) {
    // Se a variável de ambiente não estiver definida, a aplicação não pode continuar.
    throw new Error(
      'A credencial do Firebase não foi encontrada. Por favor, defina a variável de ambiente `FIREBASE_SERVICE_ACCOUNT_KEY` com o conteúdo do JSON da sua chave de serviço.',
    );
  }

  console.log('🔥 INFO: Credenciais do Firebase encontradas via FIREBASE_SERVICE_ACCOUNT_KEY.');

  try {
    // Tenta converter a string JSON para um objeto JavaScript.
    return JSON.parse(jsonKey) as ServiceAccount;
  } catch (error: any) {
    console.error(
      '❌ ERRO CRÍTICO: Falha ao analisar o JSON da chave de serviço.',
      error.message,
    );
    // Este erro geralmente ocorre se o JSON estiver malformado (ex: vírgula faltando).
    throw new Error(
      'O formato do conteúdo em FIREBASE_SERVICE_ACCOUNT_KEY é um JSON inválido.',
    );
  }
}

/**
 * Inicializa o Firebase Admin SDK, garantindo que a inicialização ocorra apenas uma vez.
 *
 * @returns Um objeto contendo as instâncias dos serviços `app`, `db` e `messaging`.
 */
function initializeFirebaseAdmin(): FirebaseAdminServices {
  // Se a instância já existe (padrão Singleton), retorna-a imediatamente.
  if (services) {
    return services;
  }

  // Medida de segurança extra: verifica se alguma app já foi inicializada fora deste fluxo.
  if (getApps().length > 0) {
    const app = getApps()[0];
    console.log('🔥 INFO: Utilizando app Firebase Admin já inicializada.');
    services = {
      app,
      db: getFirestore(app),
      messaging: getMessaging(app),
    };
    return services;
  }

  console.log('🚀 INFO: Inicializando o Firebase Admin SDK pela primeira vez...');

  try {
    // 1. Obter as credenciais.
    const serviceAccount = getServiceAccount();

    // 2. Inicializar o app Firebase com as credenciais.
    const app = initializeApp({
      credential: cert(serviceAccount),
    });

    console.log('✅ SUCESSO: Firebase Admin SDK inicializado com sucesso.');

    // 3. Armazenar e retornar as instâncias dos serviços.
    services = {
      app,
      db: getFirestore(app),
      messaging: getMessaging(app),
    };

    return services;
  } catch (error: any) {
    console.error('❌ FATAL: Não foi possível inicializar o Firebase Admin SDK.', error);
    throw new Error(`Falha na inicialização do Firebase: ${error.message}`);
  }
}

// Executa a função de inicialização e exporta as instâncias de `db` e `messaging`.
const { db, messaging } = initializeFirebaseAdmin();

export { db, messaging };
