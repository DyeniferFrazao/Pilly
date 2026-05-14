import { supabase } from '../lib/supabase';
import { estaOnline } from '../lib/syncSecure';
import {
  salvarMedicamentoLocal,
  buscarMedicamentosLocais,
  enfileirarSync,
} from '../lib/localDb';
// UUID simples para cache offline (o Supabase usa gen_random_uuid() quando online)
function gerarId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export async function listarMedicamentos(userId) {
  const online = await estaOnline();

  if (online) {
    const { data, error } = await supabase
      .from('medicamentos')
      .select('*')
      .eq('user_id', userId)
      .eq('ativo', true)
      .order('nome');

    if (!error && data) {
      // Atualiza cache local
      for (const med of data) await salvarMedicamentoLocal(med);
      return data;
    }
  }

  // Fallback offline
  return buscarMedicamentosLocais(userId);
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

export async function adicionarMedicamento(userId, dados) {
  const online = await estaOnline();

  if (online) {
    // Deixa o Supabase gerar o UUID via gen_random_uuid()
    const { data, error } = await supabase
      .from('medicamentos')
      .insert({ user_id: userId, ...dados, ativo: true })
      .select()
      .single();
    if (error) throw new Error(error.message);
    await salvarMedicamentoLocal({ ...data, sincronizado: 1 });
    return data;
  }

  // Offline: usa ID temporário local
  const novoMed = {
    id: gerarId(),
    user_id: userId,
    ...dados,
    ativo: true,
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

export async function registrarDose(medicamentoId, userId, status = 'tomado') {
  const dose = {
    medicamento_id: medicamentoId,
    user_id: userId,
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
