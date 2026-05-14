import * as SQLite from 'expo-sqlite';

let db = null;

export async function inicializarDB() {
  db = await SQLite.openDatabaseAsync('pilly.db');
  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS medicamentos (
      id TEXT PRIMARY KEY,
      user_id TEXT,
      nome TEXT,
      dose TEXT,
      unidade TEXT,
      principio TEXT,
      frequencia TEXT,
      horarios TEXT,
      observacoes TEXT,
      estoque INTEGER DEFAULT 0,
      ativo INTEGER DEFAULT 1,
      sincronizado INTEGER DEFAULT 0,
      updated_at TEXT
    );
    CREATE TABLE IF NOT EXISTS sync_queue (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      tabela TEXT,
      operacao TEXT,
      payload TEXT,
      criado_em TEXT
    );
    CREATE TABLE IF NOT EXISTS login_logs (
      id TEXT PRIMARY KEY,
      status TEXT,
      dispositivo TEXT,
      criado_em TEXT,
      sincronizado INTEGER DEFAULT 0
    );
  `);
}

function getDb() {
  if (!db) throw new Error('DB não inicializado. Chame inicializarDB() primeiro.');
  return db;
}

export async function salvarMedicamentoLocal(med) {
  const database = getDb();
  await database.runAsync(
    `INSERT OR REPLACE INTO medicamentos
      (id, user_id, nome, dose, unidade, principio, frequencia, horarios,
       observacoes, estoque, ativo, sincronizado, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      med.id,
      med.user_id,
      med.nome,
      med.dose,
      med.unidade,
      med.principio,
      med.frequencia,
      JSON.stringify(med.horarios ?? []),
      med.observacoes,
      med.estoque ?? 0,
      med.ativo ? 1 : 0,
      1,
      med.updated_at,
    ]
  );
}

export async function buscarMedicamentosLocais(userId) {
  const database = getDb();
  const rows = await database.getAllAsync(
    `SELECT * FROM medicamentos WHERE user_id = ? AND ativo = 1`,
    [userId]
  );
  return rows.map(item => ({ ...item, horarios: JSON.parse(item.horarios || '[]') }));
}

export async function enfileirarSync(tabela, operacao, payload) {
  const database = getDb();
  await database.runAsync(
    `INSERT INTO sync_queue (tabela, operacao, payload, criado_em) VALUES (?, ?, ?, ?)`,
    [tabela, operacao, JSON.stringify(payload), new Date().toISOString()]
  );
}

export async function buscarFilaSync() {
  const database = getDb();
  const rows = await database.getAllAsync(
    `SELECT * FROM sync_queue ORDER BY criado_em ASC`
  );
  return rows.map(item => ({ ...item, payload: JSON.parse(item.payload) }));
}

export async function removerDaFila(id) {
  const database = getDb();
  await database.runAsync(`DELETE FROM sync_queue WHERE id = ?`, [id]);
}
