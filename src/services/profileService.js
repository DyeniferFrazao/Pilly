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
    .eq('ativo', true)
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

export async function excluirPerfil(perfilId) {
  const { error } = await supabase
    .from('perfis')
    .update({ ativo: false })
    .eq('id', perfilId);

  if (error) throw new Error(error.message);
}
