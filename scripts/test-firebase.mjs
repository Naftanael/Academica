// scripts/test-firebase.mjs
import { db } from '../src/lib/firebase/admin.js';

async function testConnection() {
  console.log('Iniciando teste de conexão com o Firebase...');
  try {
    // A importação de 'db' de 'admin.ts' já inicializa o app do Firebase.
    // Para confirmar que a conexão está funcionando, vamos tentar uma operação de leitura simples.
    // Tentar listar as coleções é uma operação não-destrutiva e leve.
    await db.listCollections();
    console.log('✅ Sucesso: Conexão com o Firebase estabelecida com sucesso.');
  } catch (error) {
    console.error('❌ Falha: Não foi possível conectar ao Firebase.', error);
  }
}

testConnection();
