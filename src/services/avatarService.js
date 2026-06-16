import { supabase } from '../lib/supabase';

// ─────────────────────────────────────────────────────────────
//  PILLY SCORE — pontuação normalizada 0-100
//  Fórmula: (aderência% × 0.7) + streak_bonus(max 20) + consistência_bonus(max 10)
//  Aderência é sempre relativa ao usuário — independente de quantos remédios tem.
// ─────────────────────────────────────────────────────────────

export function calcularPillyScore(gam) {
  if (!gam) return 0;

  const totalEsperadas = gam.total_doses_esperadas ?? 0;
  const totalTomadas   = gam.total_doses_tomadas   ?? 0;
  const streak         = gam.streak                ?? 0;
  const semanasPerf    = gam.semanas_perfeitas      ?? 0;
  const totalSemanas   = gam.total_semanas_ativas   ?? 1;

  // Taxa de aderência proporcional (0–100)
  const aderenciaPct = totalEsperadas > 0
    ? Math.min((totalTomadas / totalEsperadas) * 100, 100)
    : 0;

  // Bônus de streak: cresce até 60 dias (máx 20 pontos)
  const streakBonus = Math.min(streak / 60, 1) * 20;

  // Bônus de consistência: semanas perfeitas (≥80% naquela semana) → máx 10 pontos
  const consistenciaBonus = (semanasPerf / Math.max(totalSemanas, 1)) * 10;

  const score = (aderenciaPct * 0.7) + streakBonus + consistenciaBonus;
  return Math.round(Math.min(score, 100));
}

// ─────────────────────────────────────────────────────────────
//  NÍVEL pelo Pilly Score
// ─────────────────────────────────────────────────────────────

// minScore agora é em XP acumulado (XP = doses × 10 + streak_dias × 5)
// Nível 1: 0+ XP  | Nível 2: 50+ (≈5 doses) | Nível 3: 200+ (≈20 doses)
// Nível 4: 500+ XP | Nível 5: 1000+ XP
export const NIVEIS = [
  { nivel: 1, nome: 'Broto',    emoji: '🌱', minScore: 0,    cor: '#2d7a55' },
  { nivel: 2, nome: 'Constante',emoji: '🌿', minScore: 50,   cor: '#1a5ea3' },
  { nivel: 3, nome: 'Dedicado', emoji: '🌸', minScore: 200,  cor: '#6b29a0' },
  { nivel: 4, nome: 'Mestre',   emoji: '🌟', minScore: 500,  cor: '#a06010' },
  { nivel: 5, nome: 'Lendário', emoji: '💎', minScore: 1000, cor: '#c02020' },
];

export function getNivel(pillyScore) {
  for (let i = NIVEIS.length - 1; i >= 0; i--) {
    if (pillyScore >= NIVEIS[i].minScore) return NIVEIS[i];
  }
  return NIVEIS[0];
}

export function getProximoNivel(pillyScore) {
  for (const n of NIVEIS) {
    if (pillyScore < n.minScore) return n;
  }
  return null; // já é lendário
}

// ─────────────────────────────────────────────────────────────
//  CONQUISTAS — definição central
//  Cada conquista tem: id, desc, check(gam, extras) → boolean
// ─────────────────────────────────────────────────────────────

export const CONQUISTAS = [
  // ── Nível 1 ──────────────────────────────────────────────
  {
    id: 'starter',
    nivel: 1,
    nome: 'Primeira dose',
    desc: 'Registre sua primeira dose',
    emoji: '💊',
    recompensa: 'shirt_green',
    check: (gam) => (gam?.total_doses_tomadas ?? 0) >= 1,
    progresso: (gam) => ({ atual: Math.min(gam?.total_doses_tomadas ?? 0, 1), total: 1 }),
  },
  {
    id: 'streak_3',
    nivel: 1,
    nome: '3 dias seguidos',
    desc: '3 dias de streak',
    emoji: '📅',
    recompensa: 'hat_straw',
    check: (gam) => (gam?.streak ?? 0) >= 3,
    progresso: (gam) => ({ atual: Math.min(gam?.streak ?? 0, 3), total: 3 }),
  },
  {
    id: 'adherence_50',
    nivel: 1,
    nome: 'Metade garantida',
    desc: 'Aderência ≥ 50% em uma semana',
    emoji: '⭐',
    recompensa: 'shirt_green',
    check: (gam) => (gam?.melhor_aderencia_semanal ?? 0) >= 50,
    progresso: (gam) => ({ atual: Math.min(Math.round(gam?.melhor_aderencia_semanal ?? 0), 50), total: 50 }),
  },
  {
    id: 'night_7',
    nivel: 1,
    nome: '7 noites registradas',
    desc: '7 doses em horário noturno',
    emoji: '🌙',
    recompensa: 'hat_straw',
    check: (gam) => (gam?.doses_noturnas ?? 0) >= 7,
    progresso: (gam) => ({ atual: Math.min(gam?.doses_noturnas ?? 0, 7), total: 7 }),
  },
  {
    id: 'rank_joined',
    nivel: 1,
    nome: 'No mapa',
    desc: 'Entre no ranking Pilly',
    emoji: '👋',
    recompensa: 'pet_seed',
    check: (gam) => (gam?.xp ?? 0) > 0,
    progresso: (gam) => ({ atual: Math.min(gam?.xp ?? 0, 1), total: 1 }),
  },
  // ── Nível 2 ──────────────────────────────────────────────
  {
    id: 'streak_7',
    nivel: 2,
    nome: '7 dias seguidos',
    desc: '7 dias de streak',
    emoji: '🔥',
    recompensa: 'hat_glasses',
    check: (gam) => (gam?.streak ?? 0) >= 7 || (gam?.max_streak ?? 0) >= 7,
    progresso: (gam) => ({ atual: Math.min(Math.max(gam?.streak ?? 0, gam?.max_streak ?? 0), 7), total: 7 }),
  },
  {
    id: 'adherence_70',
    nivel: 2,
    nome: 'Consistente',
    desc: 'Aderência ≥ 70% por 2 semanas',
    emoji: '📈',
    recompensa: 'jacket_blue',
    check: (gam) => (gam?.semanas_aderencia_70 ?? 0) >= 2,
    progresso: (gam) => ({ atual: Math.min(gam?.semanas_aderencia_70 ?? 0, 2), total: 2 }),
  },
  {
    id: 'doses_25',
    nivel: 2,
    nome: '25 doses',
    desc: '25 doses totais registradas',
    emoji: '💪',
    recompensa: 'jacket_blue',
    check: (gam) => (gam?.total_doses_tomadas ?? 0) >= 25,
    progresso: (gam) => ({ atual: Math.min(gam?.total_doses_tomadas ?? 0, 25), total: 25 }),
  },
  {
    id: 'streak_month',
    nivel: 2,
    nome: 'Mês em sequência',
    desc: 'Streak de 30 dias sem quebrar',
    emoji: '🗓️',
    recompensa: 'pet_cat',
    check: (gam) => (gam?.max_streak ?? 0) >= 30,
    progresso: (gam) => ({ atual: Math.min(gam?.max_streak ?? 0, 30), total: 30 }),
  },
  {
    id: 'rank_top10',
    nivel: 2,
    nome: 'Top 10',
    desc: 'Top 10 no ranking',
    emoji: '🏅',
    recompensa: 'frame_blue',
    check: (_, extras) => (extras?.rankPosition ?? 999) <= 10,
    progresso: (_, extras) => ({ atual: (extras?.rankPosition ?? 999) <= 10 ? 1 : 0, total: 1 }),
  },
  // ── Nível 3 ──────────────────────────────────────────────
  {
    id: 'streak_14',
    nivel: 3,
    nome: '14 dias seguidos',
    desc: '14 dias de streak',
    emoji: '🔥',
    recompensa: 'hair_curly',
    check: (gam) => (gam?.max_streak ?? 0) >= 14,
    progresso: (gam) => ({ atual: Math.min(gam?.max_streak ?? 0, 14), total: 14 }),
  },
  {
    id: 'adherence_80',
    nivel: 3,
    nome: 'Quase perfeito',
    desc: 'Aderência ≥ 80% por 3 semanas',
    emoji: '✨',
    recompensa: 'coat_white',
    check: (gam) => (gam?.semanas_aderencia_80 ?? 0) >= 3,
    progresso: (gam) => ({ atual: Math.min(gam?.semanas_aderencia_80 ?? 0, 3), total: 3 }),
  },
  {
    id: 'badges_3',
    nivel: 3,
    nome: '3 badges',
    desc: '3 badges desbloqueados',
    emoji: '🏆',
    recompensa: 'pet_bunny',
    check: (gam) => contarBadges(gam) >= 3,
    progresso: (gam) => ({ atual: Math.min(contarBadges(gam), 3), total: 3 }),
  },
  {
    id: 'doses_50',
    nivel: 3,
    nome: '50 doses',
    desc: '50 doses totais registradas',
    emoji: '🌟',
    recompensa: 'hair_wavy',
    check: (gam) => (gam?.total_doses_tomadas ?? 0) >= 50,
    progresso: (gam) => ({ atual: Math.min(gam?.total_doses_tomadas ?? 0, 50), total: 50 }),
  },
  {
    id: 'rank_top5',
    nivel: 3,
    nome: 'Top 5',
    desc: 'Top 5 no ranking',
    emoji: '👑',
    recompensa: 'frame_purple',
    check: (_, extras) => (extras?.rankPosition ?? 999) <= 5,
    progresso: (_, extras) => ({ atual: (extras?.rankPosition ?? 999) <= 5 ? 1 : 0, total: 1 }),
  },
  // ── Nível 4 ──────────────────────────────────────────────
  {
    id: 'streak_30',
    nivel: 4,
    nome: '30 dias seguidos',
    desc: '30 dias de streak consecutivos',
    emoji: '🔥',
    recompensa: 'hat_cowboy',
    check: (gam) => (gam?.streak ?? 0) >= 30,
    progresso: (gam) => ({ atual: Math.min(gam?.streak ?? 0, 30), total: 30 }),
  },
  {
    id: 'adherence_90',
    nivel: 4,
    nome: 'Aderência exemplar',
    desc: 'Aderência ≥ 90% no mês',
    emoji: '💯',
    recompensa: 'suit_gold',
    check: (gam) => (gam?.melhor_aderencia_mensal ?? 0) >= 90,
    progresso: (gam) => ({ atual: Math.min(Math.round(gam?.melhor_aderencia_mensal ?? 0), 90), total: 90 }),
  },
  {
    id: 'doses_100',
    nivel: 4,
    nome: '100 doses',
    desc: '100 doses totais registradas',
    emoji: '💊',
    recompensa: 'hat_glasses',
    check: (gam) => (gam?.total_doses_tomadas ?? 0) >= 100,
    progresso: (gam) => ({ atual: Math.min(gam?.total_doses_tomadas ?? 0, 100), total: 100 }),
  },
  {
    id: 'mes_perfeito',
    nivel: 4,
    nome: 'Mês perfeito',
    desc: 'Badge de mês perfeito',
    emoji: '📆',
    recompensa: 'pet_dog',
    check: (gam) => gam?.badges?.mes_perfeito === true,
    progresso: (gam) => ({ atual: gam?.badges?.mes_perfeito ? 1 : 0, total: 1 }),
  },
  {
    id: 'rank_top3',
    nivel: 4,
    nome: 'Pódio',
    desc: 'Top 3 no ranking',
    emoji: '🥇',
    recompensa: 'frame_gold',
    check: (_, extras) => (extras?.rankPosition ?? 999) <= 3,
    progresso: (_, extras) => ({ atual: (extras?.rankPosition ?? 999) <= 3 ? 1 : 0, total: 1 }),
  },
  // ── Nível 5 ──────────────────────────────────────────────
  {
    id: 'streak_60',
    nivel: 5,
    nome: '60 dias seguidos',
    desc: '60 dias de streak consecutivos',
    emoji: '🔥',
    recompensa: 'hat_halo',
    check: (gam) => (gam?.streak ?? 0) >= 60,
    progresso: (gam) => ({ atual: Math.min(gam?.streak ?? 0, 60), total: 60 }),
  },
  {
    id: 'adherence_95',
    nivel: 5,
    nome: 'Quase invencível',
    desc: 'Aderência ≥ 95% por 2 meses',
    emoji: '💎',
    recompensa: 'cape_special',
    check: (gam) => (gam?.meses_aderencia_95 ?? 0) >= 2,
    progresso: (gam) => ({ atual: Math.min(gam?.meses_aderencia_95 ?? 0, 2), total: 2 }),
  },
  {
    id: 'all_badges',
    nivel: 5,
    nome: 'Colecionador',
    desc: 'Todos os 7 badges do sistema',
    emoji: '🌈',
    recompensa: 'pet_dragon',
    check: (gam) => contarBadges(gam) >= 7,
    progresso: (gam) => ({ atual: Math.min(contarBadges(gam), 7), total: 7 }),
  },
  {
    id: 'doses_200',
    nivel: 5,
    nome: '200 doses',
    desc: '200 doses totais registradas',
    emoji: '💊',
    recompensa: 'hair_rainbow',
    check: (gam) => (gam?.total_doses_tomadas ?? 0) >= 200,
    progresso: (gam) => ({ atual: Math.min(gam?.total_doses_tomadas ?? 0, 200), total: 200 }),
  },
  {
    id: 'rank_1st_week',
    nivel: 5,
    nome: 'Rei da semana',
    desc: '1º no ranking por 1 semana',
    emoji: '🏆',
    recompensa: 'frame_diamond',
    check: (gam) => (gam?.semanas_em_primeiro ?? 0) >= 1,
    progresso: (gam) => ({ atual: Math.min(gam?.semanas_em_primeiro ?? 0, 1), total: 1 }),
  },
];

// Helper: conta badges boolianos da tabela gamificacao
function contarBadges(gam) {
  if (!gam?.badges) return 0;
  return Object.values(gam.badges).filter(Boolean).length;
}

// ─────────────────────────────────────────────────────────────
//  Verifica conquistas novas e desbloqueia itens
// ─────────────────────────────────────────────────────────────

export async function verificarEDesbloquearConquistas(userId, gam, extras = {}) {
  try {
    // Busca quais conquistas já foram desbloqueadas
    const { data: jaDesbloqueadas } = await supabase
      .from('user_cosmetics')
      .select('item_id')
      .eq('user_id', userId);

    const jaIds = new Set((jaDesbloqueadas ?? []).map((r) => r.item_id));

    const novasConquistas = [];
    const itensParaInserir = [];

    for (const conquista of CONQUISTAS) {
      const recompensaId = conquista.recompensa;
      if (jaIds.has(recompensaId)) continue;

      const ok = conquista.check(gam, extras);
      if (ok) {
        itensParaInserir.push({ user_id: userId, item_id: recompensaId });
        novasConquistas.push(conquista);
      }
    }

    // Insere itens novos (ignora duplicatas)
    if (itensParaInserir.length > 0) {
      await supabase
        .from('user_cosmetics')
        .upsert(itensParaInserir, { onConflict: 'user_id,item_id', ignoreDuplicates: true });
    }

    // Garante que itens iniciais (starter + hair_default + frame_default) existam
    const itensIniciais = [
      { user_id: userId, item_id: 'hair_default' },
      { user_id: userId, item_id: 'frame_default' },
      { user_id: userId, item_id: 'pet_seed' },
    ];
    await supabase
      .from('user_cosmetics')
      .upsert(itensIniciais, { onConflict: 'user_id,item_id', ignoreDuplicates: true });

    return novasConquistas; // retorna as novas para mostrar notificação
  } catch (e) {
    console.warn('[Avatar] Erro ao verificar conquistas:', e.message);
    return [];
  }
}

// ─────────────────────────────────────────────────────────────
//  Próximas conquistas — as mais próximas de serem concluídas
// ─────────────────────────────────────────────────────────────

export async function buscarProximasConquistas(userId, gam, extras = {}, limite = 3) {
  try {
    const { data: jaDesbloqueadas } = await supabase
      .from('user_cosmetics')
      .select('item_id')
      .eq('user_id', userId);

    const jaIds = new Set((jaDesbloqueadas ?? []).map((r) => r.item_id));

    const pendentes = CONQUISTAS
      .filter((c) => !jaIds.has(c.recompensa) && !c.check(gam, extras))
      .map((c) => {
        const prog = c.progresso(gam, extras);
        const pct  = prog.total > 0 ? Math.min((prog.atual / prog.total) * 100, 99) : 0;
        return { ...c, progresso: prog, pct };
      })
      .sort((a, b) => b.pct - a.pct); // mais próximas primeiro

    return pendentes.slice(0, limite);
  } catch (e) {
    console.warn('[Avatar] Erro ao buscar próximas conquistas:', e.message);
    return [];
  }
}

// ─────────────────────────────────────────────────────────────
//  Avatar equipado
// ─────────────────────────────────────────────────────────────

export async function buscarAvatarEquipado(userId) {
  try {
    const { data } = await supabase
      .from('user_avatar')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (data) return data;

    // Cria avatar padrão
    const padrao = {
      user_id: userId,
      chapeu:  null,
      roupa:   'shirt_green',
      cabelo:  'hair_default',
      pet:     'pet_seed',
      moldura: 'frame_default',
    };
    await supabase.from('user_avatar').upsert(padrao, { onConflict: 'user_id' });
    return padrao;
  } catch (e) {
    console.warn('[Avatar] Erro ao buscar avatar:', e.message);
    return null;
  }
}

export async function equiparItem(userId, categoria, itemId) {
  try {
    await supabase
      .from('user_avatar')
      .upsert(
        { user_id: userId, [categoria]: itemId, atualizado_em: new Date().toISOString() },
        { onConflict: 'user_id' }
      );
    return true;
  } catch (e) {
    console.warn('[Avatar] Erro ao equipar item:', e.message);
    return false;
  }
}

// ─────────────────────────────────────────────────────────────
//  Itens desbloqueados por categoria
// ─────────────────────────────────────────────────────────────

export async function buscarItensDesbloqueados(userId) {
  try {
    const { data } = await supabase
      .from('user_cosmetics')
      .select('item_id')
      .eq('user_id', userId);

    return new Set((data ?? []).map((r) => r.item_id));
  } catch (e) {
    console.warn('[Avatar] Erro ao buscar itens:', e.message);
    return new Set();
  }
}

// ─────────────────────────────────────────────────────────────
//  Sincronizar pet e moldura no leaderboard (social visibility)
// ─────────────────────────────────────────────────────────────

export async function sincronizarAvatarLeaderboard(userId, avatar) {
  try {
    await supabase
      .from('leaderboard_publico')
      .upsert(
        {
          user_id:          userId,
          pet_equipado:     avatar?.pet     ?? null,
          moldura_equipada: avatar?.moldura ?? null,
          roupa_equipada:   avatar?.roupa   ?? null,
          cabelo_equipado:  avatar?.cabelo  ?? null,
          chapeu_equipado:  avatar?.chapeu  ?? null,
        },
        { onConflict: 'user_id' }
      );
  } catch (e) {
    // silencioso — colunas podem não existir ainda no Supabase
  }
}
