
// scripts/test-database.ts
import { getDb } from '../src/lib/database';
import { Database } from 'sqlite';

/**
 * Script de teste para verificar a conexão com o banco de dados SQLite.
 * 
 * Este script executa as seguintes ações:
 * 1. Tenta estabelecer uma conexão com o banco de dados usando a função getDb.
 * 2. Realiza uma consulta simples para listar todas as tabelas existentes.
 * 3. Registra os resultados ou eventuais erros no console.
 * 4. Garante que a conexão com o banco de dados seja sempre fechada ao final.
 */
const testDatabaseConnection = async () => {
  console.log('Iniciando o teste de conexão com o banco de dados SQLite...');

  let connection: Database | null = null;

  try {
    // A função `getDb` retorna uma promessa que resolve para a instância do banco de dados.
    connection = await getDb();
    console.log('Conexão com o banco de dados estabelecida com sucesso.');

    // Validação de entrada: Verifica se a conexão é um objeto válido.
    if (!connection) {
      throw new Error('O objeto de conexão com o banco de dados é inválido.');
    }

    // Otimização: Em vez de consultar dados de uma tabela específica (que pode estar vazia),
    // consultamos o schema do banco de dados, que é uma operação leve e sempre retorna dados.
    const query = "SELECT name FROM sqlite_master WHERE type='table'";
    console.log(`Executando a consulta de teste: ${query}`);
    
    // Operação segura: Usamos o método `all()` que é seguro contra injeção de SQL para esta consulta.
    const tables = await connection.all(query);

    console.log('Consulta executada com sucesso.');
    console.log('Tabelas encontradas no banco de dados:', tables.map((t: any) => t.name));

    if (tables.length > 0) {
      console.log('✅ Teste bem-sucedido: O banco de dados está conectado e contém tabelas.');
    } else {
      console.warn('⚠️ Atenção: A conexão foi bem-sucedida, mas o banco de dados está vazio (sem tabelas).');
    }

  } catch (error) {
    // Tratamento de erros: Captura e exibe qualquer erro que ocorra durante o processo.
    console.error('❌ Erro durante o teste de conexão com o banco de dados:', error);
  
  } finally {
    // Robustez: Garante que a conexão seja sempre fechada, mesmo que ocorram erros.
    if (connection) {
      await connection.close();
      console.log('Conexão com o banco de dados fechada.');
    }
  }
};

// Executa a função de teste.
testDatabaseConnection();
