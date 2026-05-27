import * as SQLite from 'expo-sqlite';

let db = null;

/**
 * Adiciona colunas faltantes a uma tabela já existente, de forma idempotente.
 * O SQLite não tem "ADD COLUMN IF NOT EXISTS", então conferimos via PRAGMA.
 */
async function garantirColunas(database, tabela, colunasDesejadas) {
  const info = await database.getAllAsync(`PRAGMA table_info(${tabela})`);
  const existentes = new Set(info.map((c) => c.name));
  for (const [nome, definicao] of colunasDesejadas) {
    if (!existentes.has(nome)) {
      try {
        await database.execAsync(
          `ALTER TABLE ${tabela} ADD COLUMN ${nome} ${definicao}`
        );
      } catch (e) {
        // Se duas instâncias rodarem a migração ao mesmo tempo, a segunda falha
        // com "duplicate column" — ignoramos.
        if (!String(e?.message).includes('duplicate column')) {
          // outro erro real: relança
          throw e;
        }
      }
    }
  }
}

export async function inicializarDB() {
  db = await SQLite.openDatabaseAsync('pilly.db');

  // 1) Cria tabelas se ainda não existem (esquema completo)
  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS medicamentos (
      id TEXT PRIMARY KEY,
      user_id TEXT,
      perfil_id TEXT,
      nome TEXT,
      dose TEXT,
      unidade TEXT,
      principio TEXT,
      tipo TEXT,
      via TEXT,
      frequencia TEXT,
      horarios TEXT,
      observacoes TEXT,
      estoque INTEGER DEFAULT 0,
      ativo INTEGER DEFAULT 1,
      alarme INTEGER DEFAULT 0,
      duracao_tipo TEXT,
      duracao_valor INTEGER,
      sincronizado INTEGER DEFAULT 0,
      created_at TEXT,
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

  // 2) Migração: para bancos antigos que já existiam sem essas colunas
  await garantirColunas(db, 'medicamentos', [
    ['perfil_id', 'TEXT'],
    ['tipo', 'TEXT'],
    ['via', 'TEXT'],
    ['alarme', 'INTEGER DEFAULT 0'],
    ['created_at', 'TEXT'],
    ['duracao_tipo', 'TEXT'],
    ['duracao_valor', 'INTEGER'],
  ]);

  // Índice para acelerar SELECTs por perfil
  try {
    await db.execAsync(
      `CREATE INDEX IF NOT EXISTS idx_medicamentos_perfil ON medicamentos(perfil_id)`
    );
  } catch (_) {
    // ignora se já existir
  }
}

function getDb() {
  if (!db) throw new Error('DB não inicializado. Chame inicializarDB() primeiro.');
  return db;
}

export async function salvarMedicamentoLocal(med) {
  const database = getDb();
  await database.runAsync(
    `INSERT OR REPLACE INTO medicamentos
      (id, user_id, perfil_id, nome, dose, unidade, principio, tipo, via,
       frequencia, horarios, observacoes, estoque, ativo, alarme,
       duracao_tipo, duracao_valor,
       sincronizado, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      med.id,
      med.user_id,
      med.perfil_id,
      med.nome,
      med.dose,
      med.unidade,
      med.principio,
      med.tipo,
      med.via,
      med.frequencia,
      JSON.stringify(med.horarios ?? []),
      med.observacoes,
      med.estoque ?? 0,
      med.ativo ? 1 : 0,
      med.alarme ? 1 : 0,
      med.duracao_tipo ?? null,
      med.duracao_valor ?? null,
      med.sincronizado ?? 1,
      med.created_at ?? new Date().toISOString(),
      med.updated_at,
    ]
  );
}

/**
 * Lista os medicamentos locais do perfil ativo (cache offline).
 * Mantida a assinatura por compatibilidade; agora filtra por perfil_id.
 */
export async function buscarMedicamentosLocais(perfilId) {
  const database = getDb();
  const rows = await database.getAllAsync(
    `SELECT * FROM medicamentos WHERE perfil_id = ? AND ativo = 1 ORDER BY nome`,
    [perfilId]
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
