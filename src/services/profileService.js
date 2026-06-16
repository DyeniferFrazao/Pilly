import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '../lib/supabase';

// Tabela `perfis`: precisa ser criada no Supabase com o SQL abaixo:
// CREATE TABLE perfis (
//   id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
//   user_id uuid REFERENCES auth.users(id) NOT NULL,
//   nome text NOT NULL,
//   bio text,
//   foto_url text,
//   ativo boolean DEFAULT true,
//   created_at timestamptz DEFAULT now()
// );
// ALTER TABLE perfis ENABLE ROW LEVEL SECURITY;
// CREATE POLICY "Usuarios veem seus proprios perfis"
//   ON perfis FOR ALL USING (auth.uid() = user_id);

export async function listarPerfis(userId) {
  const { data, error } = await supabase
    .from('perfis')
    .select('*')
    .eq('user_id', userId)
    .order('created_at');

  if (error) throw new Error(error.message);
  return data;
}

export async function criarPerfil(userId, { nome, bio, foto_url }) {
  const { data, error } = await supabase
    .from('perfis')
    .insert({ user_id: userId, nome, bio, foto_url })
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data;
}

export async function atualizarPerfil(perfilId, { nome, bio, foto_url }) {
  const { data, error } = await supabase
    .from('perfis')
    .update({ nome, bio, foto_url, updated_at: new Date().toISOString() })
    .eq('id', perfilId)
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data;
}

export async function excluirPerfil(perfilId) {
  const { error } = await supabase
    .from('perfis')
    .delete()
    .eq('id', perfilId);

  if (error) throw new Error(error.message);
}

// ─── Auto-perfil (uma conta = um perfil) ─────────────────────────────────────

/**
 * Garante que o usuário tem exatamente um perfil.
 * Se ainda não existe, cria automaticamente usando o prefixo do e-mail.
 * Salva perfilId e perfilNome no AsyncStorage.
 *
 * @returns {{ id: string, nome: string }}
 */
export async function garantirPerfilPadrao(userId, email = '') {
  try {
    const lista = await listarPerfis(userId);

    if (lista.length > 0) {
      const perfil = lista[0];
      await AsyncStorage.setItem('perfilId',   perfil.id);
      await AsyncStorage.setItem('perfilNome', perfil.nome ?? '');
      return { id: perfil.id, nome: perfil.nome ?? '' };
    }

    // Cria o perfil padrão com nome derivado do e-mail
    const nomePadrao = email.split('@')[0] ?? 'Usuário';
    const perfil = await criarPerfil(userId, {
      nome:     nomePadrao,
      bio:      '',
      foto_url: null,
    });

    await AsyncStorage.setItem('perfilId',   perfil.id);
    await AsyncStorage.setItem('perfilNome', perfil.nome ?? '');
    return { id: perfil.id, nome: perfil.nome ?? '' };
  } catch {
    // Fallback: usa o userId diretamente (evita travamento do app)
    await AsyncStorage.setItem('perfilId', userId);
    return { id: userId, nome: email.split('@')[0] ?? 'Usuário' };
  }
}
