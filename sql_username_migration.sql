-- ─────────────────────────────────────────────────────────────────────────────
-- Pilly — Migração: suporte a username
-- ─────────────────────────────────────────────────────────────────────────────
-- O username é armazenado no user_metadata do Supabase Auth (campo raw_user_meta_data).
-- Não é necessária alteração nas tabelas de auth; o campo é gravado automaticamente
-- via supabase.auth.signUp({ options: { data: { username } } }).
--
-- Execute os blocos abaixo no SQL Editor do Supabase (painel > SQL Editor).
-- ─────────────────────────────────────────────────────────────────────────────

-- 1. Adiciona coluna username à tabela leaderboard_publico
--    (caso ainda não exista — o campo apelido já receberá o username pelo app,
--     mas esta coluna permite consultar o username diretamente se necessário)
ALTER TABLE leaderboard_publico
  ADD COLUMN IF NOT EXISTS username text;

-- 2. Popula username nos registros existentes a partir do apelido atual
--    (retroativo: garante que quem já tem conta apareça com apelido correto)
UPDATE leaderboard_publico
  SET username = apelido
WHERE username IS NULL;

-- 3. (Opcional) Adiciona username à tabela perfis,
--    útil se quiser permitir que o usuário altere o nick nas configurações do app.
ALTER TABLE perfis
  ADD COLUMN IF NOT EXISTS username text;

-- 4. (Opcional) Índice único para evitar duplicatas de username em perfis
CREATE UNIQUE INDEX IF NOT EXISTS perfis_username_unique
  ON perfis (username)
  WHERE username IS NOT NULL;

-- ─────────────────────────────────────────────────────────────────────────────
-- Notas:
-- • O username é definido no cadastro (SignUpScreen) e salvo em
--   auth.users.raw_user_meta_data via supabase.auth.signUp.
-- • O app acessa via user.user_metadata.username (AuthContext).
-- • O leaderboard usa o campo 'apelido' que agora recebe o username.
-- • Usuários existentes sem username verão o nome do perfil como apelido
--   até que façam novo cadastro ou você implemente a edição de username
--   nas configurações da conta.
-- ─────────────────────────────────────────────────────────────────────────────
