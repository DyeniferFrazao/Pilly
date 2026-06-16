import { supabase } from '../lib/supabase';
import {
  salvarMedicamentoLocal,
  buscarMedicamentosLocais,
  enfileirarSync,
} from '../lib/localDb';
// Sempre tenta online — Supabase lança erro se offline, o catch block trata
const estaOnline = async () => true;

// UUID simples para cache offline (o Supabase usa gen_random_uuid() quando online)
function gerarId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

/**
 * Lista os medicamentos do perfil ativo.
 * Cada perfil (criado pelo usuário) tem seus próprios medicamentos
 * — a tabela `medicamentos` no Supabase tem as colunas user_id e perfil_id.
 */
export async function listarMedicamentos(perfilId) {
  if (!perfilId) return [];

  const online = await estaOnline();

  if (online) {
    const { data, error } = await supabase
      .from('medicamentos')
      .select('*')
      .eq('perfil_id', perfilId)
      .eq('ativo', true)
      .order('nome');

    if (!error && data) {
      // Atualiza cache local
      for (const med of data) await salvarMedicamentoLocal(med);
      return data;
    }
  }

  // Fallback offline
  return buscarMedicamentosLocais(perfilId);
}

export async function buscarMedicamento(id) {
  const { data, error } = await supabase
    .from('medicamentos')
    .select('*')
    .eq('id', id)
    .single();
  if (error) throw new Error(error.message);
  return data;
}

/**
 * Adiciona um medicamento vinculando-o ao perfil ativo.
 * @param {string} perfilId — id do perfil que toma o medicamento (obrigatório).
 * @param {object} dados — campos do formulário (nome, dose, etc.).
 * @param {string} userId — id do usuário dono da conta (auth.users).
 */
export async function adicionarMedicamento(perfilId, dados, userId) {
  if (!perfilId) {
    throw new Error('Selecione um perfil antes de cadastrar o medicamento.');
  }

  const online = await estaOnline();
  const payload = {
    perfil_id: perfilId,
    user_id: userId,
    ...dados,
    ativo: true,
  };

  if (online) {
    // Deixa o Supabase gerar o UUID via gen_random_uuid()
    const { data, error } = await supabase
      .from('medicamentos')
      .insert(payload)
      .select()
      .single();
    if (error) throw new Error(error.message);
    await salvarMedicamentoLocal({ ...data, sincronizado: 1 });
    return data;
  }

  // Offline: usa ID temporário local
  const novoMed = {
    id: gerarId(),
    ...payload,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
  await enfileirarSync('medicamentos', 'INSERT', novoMed);
  await salvarMedicamentoLocal({ ...novoMed, sincronizado: 0 });
  return novoMed;
}

export async function editarMedicamento(id, dados) {
  const atualizado = { ...dados, id, updated_at: new Date().toISOString() };
  const online = await estaOnline();

  if (online) {
    await supabase.from('medicamentos').update(atualizado).eq('id', id);
  } else {
    await enfileirarSync('medicamentos', 'UPDATE', atualizado);
  }

  await salvarMedicamentoLocal(atualizado);
}

export async function removerMedicamento(id) {
  const online = await estaOnline();

  if (online) {
    await supabase.from('medicamentos').update({ ativo: false }).eq('id', id);
  } else {
    await enfileirarSync('medicamentos', 'DELETE', { id });
  }
}

export async function registrarDose(
  medicamentoId,
  userId,
  status = 'tomado',
  perfilId = null,
  horarioPrevisto = null,
) {
  const dose = {
    medicamento_id: medicamentoId,
    user_id: userId,
    perfil_id: perfilId,
    horario_previsto: horarioPrevisto,
    status,
    tomado_em: new Date().toISOString(),
  };

  const online = await estaOnline();
  if (online) {
    await supabase.from('doses_historico').insert(dose);
  } else {
    await enfileirarSync('doses_historico', 'INSERT', dose);
  }
}

/**
 * Retorna as doses marcadas como "tomado" hoje para um perfil.
 * Usado pela seção de progresso na HomeScreen.
 *
 * @param {string} perfilId
 * @returns {{ tomadas: number, total: number }} — total é calculado pelo chamador
 */
export async function buscarDosesHoje(perfilId) {
  if (!perfilId) return [];
  try {
    const hoje     = new Date();
    const inicioDia = new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate(), 0,  0,  0).toISOString();
    const fimDia    = new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate(), 23, 59, 59).toISOString();

    const { data, error } = await supabase
      .from('doses_historico')
      .select('id, medicamento_id, status, tomado_em')
      .eq('perfil_id', perfilId)
      .gte('tomado_em', inicioDia)
      .lte('tomado_em', fimDia);

    if (error) return [];
    return data ?? [];
  } catch {
    return [];
  }
}
