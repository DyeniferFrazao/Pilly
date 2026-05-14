import * as Network from 'expo-network';
import { supabase } from './supabase';
import { buscarFilaSync, removerDaFila, salvarMedicamentoLocal } from './localDb';

// Verifica conexão
export async function estaOnline() {
  const state = await Network.getNetworkStateAsync();
  return state.isConnected === true && state.isInternetReachable === true;
}

// Executa sync: envia pendentes → busca atualizações do servidor
export async function sincronizar(userId) {
  const online = await estaOnline();
  if (!online) return { enviados: 0, erros: 0 };

  const fila = await buscarFilaSync();
  let enviados = 0;
  let erros = 0;

  // 1. Envia operações pendentes ao Supabase
  for (const item of fila) {
    try {
      if (item.operacao === 'INSERT' || item.operacao === 'UPDATE') {
        await supabase.from(item.tabela).upsert(item.payload);
      } else if (item.operacao === 'DELETE') {
        await supabase.from(item.tabela).update({ ativo: false }).eq('id', item.payload.id);
      }
      await removerDaFila(item.id);
      enviados++;
    } catch {
      erros++;
    }
  }

  // 2. Baixa dados atualizados do servidor
  const { data } = await supabase
    .from('medicamentos')
    .select('*')
    .eq('user_id', userId)
    .eq('ativo', true);

  if (data) {
    for (const med of data) {
      await salvarMedicamentoLocal(med);
    }
  }

  return { enviados, erros };
}
