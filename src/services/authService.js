import { supabase } from '../lib/supabase';
import * as Device from 'expo-device';

async function registrarLog(userId, email, status) {
  await supabase.from('login_logs').insert({
    user_id: userId,
    email,
    status,
    dispositivo: `${Device.brand} ${Device.modelName}`,
    plataforma: Device.osName,
    created_at: new Date().toISOString(),
  });
}

export async function cadastrar(nome, username, email, senha) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password: senha,
    options: { data: { nome, username } },
  });

  if (error) throw new Error(error.message);
  return data;
}

export async function login(email, senha) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password: senha });

  if (error) {
    await registrarLog(null, email, 'failed').catch(() => {});
    throw new Error('E-mail ou senha incorretos');
  }

  await registrarLog(data.user.id, email, 'success').catch(() => {});

  // O Supabase persiste a sessão internamente — nenhum armazenamento manual necessário
  return data;
}

export async function logout() {
  const { data: { user } } = await supabase.auth.getUser();
  if (user) {
    await registrarLog(user.id, user.email, 'logout').catch(() => {});
  }
  await supabase.auth.signOut();
}

export async function recuperarSenha(email) {
  const { error } = await supabase.auth.resetPasswordForEmail(email);
  if (error) throw new Error(error.message);
}

export async function sessaoAtual() {
  const { data: { session } } = await supabase.auth.getSession();
  return session;
}
