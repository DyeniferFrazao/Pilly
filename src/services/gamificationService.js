import { supabase } from '../lib/supabase';

// ─── Catálogo de conquistas ────────────────────────────────────────────────────
export const TODOS_BADGES = {
  streak_3:    { id: 'streak_3',    featherIcon: 'zap',         iconColor: '#E25822', label: '3 dias seguidos'   },
  streak_7:    { id: 'streak_7',    featherIcon: 'trending-up', iconColor: '#9B2DE8', label: '7 dias seguidos'   },
  streak_14:   { id: 'streak_14',   featherIcon: 'star',        iconColor: '#1a5ea3', label: '14 dias seguidos'  },
  streak_30:   { id: 'streak_30',   featherIcon: 'award',       iconColor: '#c8a020', label: '30 dias seguidos'  },
  doses_10:    { id: 'doses_10',    featherIcon: 'package',     iconColor: '#1D6B78', label: '10 doses tomadas'  },
  doses_100:   { id: 'doses_100',   featherIcon: 'layers',      iconColor: '#1D6B78', label: '100 doses tomadas' },
  rank_1:      { id: 'rank_1',      featherIcon: 'award',       iconColor: '#c8a020', label: '1° no ranking'     },
  mes_perfeito:{ id: 'mes_perfeito',featherIcon: 'shield',      iconColor: '#2d7a55', label: 'Mês perfeito'      },
};

// ─── XP por dose tomada ────────────────────────────────────────────────────────
const XP_POR_DOSE    = 10;
const XP_POR_DIA_STREAK = 5;

// ─── Helpers de data ───────────────────────────────────────────────────────────
const inicioDia = (d = new Date()) => {
  const r = new Date(d); r.setHours(0, 0, 0, 0); return r;
};
const fimDia = (d = new Date()) => {
  const r = new Date(d); r.setHours(23, 59, 59, 999); return r;
};
const isoDate = (d) => d.toISOString().split('T')[0];

// ─── CRUD gamificação ─────────────────────────────────────────────────────────

/**
 * Busca o registro de gamificação de um perfil.
 * Retorna null se ainda não existir.
 */
export async function buscarGamificacao(userId, perfilId) {
  const { data, error } = await supabase
    .from('gamificacao')
    .select('*')
    .eq('user_id', userId)
    .eq('perfil_id', perfilId)
    .single();

  if (error) return null;
  return data;
}

/**
 * Cria ou atualiza o registro de gamificação.
 */
async function upsertGamificacao(userId, perfilId, campos) {
  const { data, error } = await supabase
    .from('gamificacao')
    .upsert(
      { user_id: userId, perfil_id: perfilId, ...campos },
      { onConflict: 'perfil_id' }
    )
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data;
}

// ─── Cálculo de streak ─────────────────────────────────────────────────────────

/**
 * Calcula a sequência de dias consecutivos em que o perfil tomou ao menos
 * uma dose. Retroage desde hoje.
 */
export async function calcularStreak(perfilId) {
  try {
    const { data: doses } = await supabase
      .from('doses_historico')
      .select('tomado_em')
      .eq('perfil_id', perfilId)
      .eq('status', 'tomado')
      .order('tomado_em', { ascending: false })
      .limit(200);

    if (!doses || doses.length === 0) return 0;

    const diasUnicos = [
      ...new Set(doses.map((d) => isoDate(new Date(d.tomado_em)))),
    ].sort((a, b) => b.localeCompare(a));

    let streak = 0;
    const hoje = new Date();

    for (let i = 0; i < diasUnicos.length; i++) {
      const esperado = new Date(hoje);
      esperado.setDate(esperado.getDate() - i);
      if (diasUnicos[i] === isoDate(esperado)) {
        streak++;
      } else {
        break;
      }
    }
    return streak;
  } catch {
    return 0;
  }
}

// ─── Adesão semanal (calendário) ───────────────────────────────────────────────

/**
 * Retorna array de 7 objetos — um por dia da última semana — com:
 *   { date, taken, totalEsperado, status }
 *
 * status: 'full' | 'partial' | 'miss' | 'today'
 *
 * @param {string}   perfilId
 * @param {object[]} meds  — lista de medicamentos ativos do perfil (com .horarios)
 */
export async function buscarAdesaoSemana(perfilId, meds = []) {
  try {
    const hoje = new Date();
    const dias = Array.from({ length: 7 }, (_, i) => {
      const d = new Date(hoje);
      d.setDate(hoje.getDate() - (6 - i));
      return d;
    });

    const inicio = inicioDia(dias[0]);
    const fim    = fimDia(dias[dias.length - 1]);

    const { data: doses } = await supabase
      .from('doses_historico')
      .select('tomado_em, status')
      .eq('perfil_id', perfilId)
      .gte('tomado_em', inicio.toISOString())
      .lte('tomado_em', fim.toISOString());

    const totalEsperadoPorDia = meds.reduce(
      (acc, m) => acc + (Array.isArray(m.horarios) ? m.horarios.length : 0),
      0
    );

    const hojeStr = isoDate(hoje);

    return dias.map((d) => {
      const dayStr = isoDate(d);
      const isToday = dayStr === hojeStr;

      const taken = (doses ?? []).filter(
        (dose) =>
          isoDate(new Date(dose.tomado_em)) === dayStr &&
          dose.status === 'tomado'
      ).length;

      let status;
      if (isToday) {
        status = 'today';
      } else if (totalEsperadoPorDia === 0 || taken === 0) {
        status = 'miss';
      } else if (taken >= totalEsperadoPorDia) {
        status = 'full';
      } else {
        status = 'partial';
      }

      return { date: d, taken, totalEsperado: totalEsperadoPorDia, status };
    });
  } catch {
    return [];
  }
}

// ─── Adesão semanal para a Arena ───────────────────────────────────────────────

/**
 * Calcula o % de adesão dos últimos 6 dias (sem hoje) para exibição na arena.
 * Retorna 0–100.
 *
 * @param {string}   perfilId
 * @param {object[]} meds — medicamentos ativos do perfil
 */
export async function calcularAdesaoSemanalPerfil(perfilId, meds = []) {
  try {
    const hoje = new Date();
    const inicioSemana = inicioDia(new Date(hoje));
    inicioSemana.setDate(hoje.getDate() - 6);

    const ontem = fimDia(new Date(hoje));
    ontem.setDate(hoje.getDate() - 1);

    const { data: doses } = await supabase
      .from('doses_historico')
      .select('status')
      .eq('perfil_id', perfilId)
      .gte('tomado_em', inicioSemana.toISOString())
      .lte('tomado_em', ontem.toISOString());

    const totalDosesPerDay = meds.reduce(
      (acc, m) => acc + (Array.isArray(m.horarios) ? m.horarios.length : 0),
      0
    );

    const diasPassados = 6; // ontem até 6 dias atrás
    const totalEsperado = totalDosesPerDay * diasPassados;

    if (totalEsperado === 0) return 0;

    const tomadas = (doses ?? []).filter((d) => d.status === 'tomado').length;
    return Math.min(Math.round((tomadas / totalEsperado) * 100), 100);
  } catch {
    return 0;
  }
}

// ─── Sincronização principal ───────────────────────────────────────────────────

/**
 * Recalcula XP, streak e badges do perfil e salva no Supabase.
 * Pode ser chamado a cada foco da HomeScreen.
 *
 * @returns {{ xp, streak, badges, total_doses_tomadas } | null}
 */
export async function sincronizarGamificacao(userId, perfilId) {
  try {
    const [gam, streak, countResult] = await Promise.all([
      buscarGamificacao(userId, perfilId),
      calcularStreak(perfilId),
      supabase
        .from('doses_historico')
        .select('*', { count: 'exact', head: true })
        .eq('perfil_id', perfilId)
        .eq('status', 'tomado'),
    ]);

    const totalDoses = countResult.count ?? 0;
    const xp = totalDoses * XP_POR_DOSE + streak * XP_POR_DIA_STREAK;

    const badgesAtuais = Array.isArray(gam?.badges) ? gam.badges : [];
    const novosBadges = [...badgesAtuais];

    const checar = (id, cond) => {
      if (cond && !novosBadges.includes(id)) novosBadges.push(id);
    };

    checar('streak_3',  streak >= 3);
    checar('streak_7',  streak >= 7);
    checar('streak_14', streak >= 14);
    checar('streak_30', streak >= 30);
    checar('doses_10',  totalDoses >= 10);
    checar('doses_100', totalDoses >= 100);

    const resultado = await upsertGamificacao(userId, perfilId, {
      xp,
      streak,
      total_doses_tomadas: totalDoses,
      badges: novosBadges,
      atualizado_em: new Date().toISOString(),
    });

    return resultado ?? { xp, streak, badges: novosBadges, total_doses_tomadas: totalDoses };
  } catch {
    return null;
  }
}

/**
 * Busca dados de gamificação de múltiplos perfis em uma só query.
 * Retorna um mapa { [perfilId]: gamificacaoData }.
 *
 * @param {string}   userId
 * @param {string[]} perfilIds
 */
export async function buscarGamificacaoTodosPerfis(userId, perfilIds) {
  if (!perfilIds.length) return {};
  try {
    const { data } = await supabase
      .from('gamificacao')
      .select('*')
      .eq('user_id', userId)
      .in('perfil_id', perfilIds);

    const mapa = {};
    for (const g of data ?? []) mapa[g.perfil_id] = g;
    return mapa;
  } catch {
    return {};
  }
}

/**
 * Marca o badge de 1° lugar no ranking para o perfil líder.
 * Chamado depois de montar a arenaData na HomeScreen.
 *
 * @param {string} userId
 * @param {string} perfilIdLider — id do perfil em 1° lugar
 */
export async function premiarLider(userId, perfilIdLider) {
  try {
    const gam = await buscarGamificacao(userId, perfilIdLider);
    const badges = Array.isArray(gam?.badges) ? gam.badges : [];
    if (!badges.includes('rank_1')) {
      await upsertGamificacao(userId, perfilIdLider, {
        badges: [...badges, 'rank_1'],
        atualizado_em: new Date().toISOString(),
      });
    }
  } catch { /* silencioso */ }
}

// ─── Leaderboard público entre usuários ───────────────────────────────────────

/**
 * Grava (ou atualiza) o registro público deste usuário no leaderboard.
 * Chamado após cada sincronização de gamificação.
 *
 * @param {string} userId
 * @param {{ xp, streak, total_doses_tomadas }} gam — resultado de sincronizarGamificacao
 * @param {string} apelido — nome público (prefixo do e-mail)
 */
export async function sincronizarLeaderboard(userId, gam, apelido = 'Usuário') {
  try {
    await supabase
      .from('leaderboard_publico')
      .upsert(
        {
          user_id:      userId,
          apelido,
          xp:           gam?.xp            ?? 0,
          streak:       gam?.streak         ?? 0,
          total_doses:  gam?.total_doses_tomadas ?? 0,
          atualizado_em: new Date().toISOString(),
        },
        { onConflict: 'user_id' }
      );
  } catch { /* silencioso — não bloqueia o fluxo */ }
}

/**
 * Busca todos os usuários do leaderboard, ordenados por XP.
 * Retorna array de { user_id, apelido, xp, streak, total_doses }.
 */
export async function buscarLeaderboard() {
  try {
    const { data } = await supabase
      .from('leaderboard_publico')
      .select('user_id, apelido, xp, streak, total_doses, pet_equipado, moldura_equipada, roupa_equipada, cabelo_equipado, chapeu_equipado')
      .order('xp', { ascending: false })
      .limit(50);

    return data ?? [];
  } catch {
    return [];
  }
}

// ─── Aderência semanal por medicamento ────────────────────────────────────────

/**
 * Para cada medicamento, conta em quantos dos últimos 7 dias
 * ao menos uma dose foi registrada como 'tomado'.
 * Retorna array de meds enriquecidos com { diasComDose, porcentagem },
 * ordenados do maior para o menor %.
 *
 * @param {string}   perfilId
 * @param {object[]} meds — lista de medicamentos do perfil
 */
export async function buscarAdesaoSemanaPorMed(perfilId, meds = []) {
  if (!meds.length) return [];
  try {
    const hoje     = new Date();
    const inicio   = inicioDia(new Date(hoje));
    inicio.setDate(hoje.getDate() - 6);

    const { data: doses } = await supabase
      .from('doses_historico')
      .select('medicamento_id, tomado_em')
      .eq('perfil_id', perfilId)
      .eq('status', 'tomado')
      .gte('tomado_em', inicio.toISOString());

    return meds
      .map((med) => {
        const dosMed = (doses ?? []).filter((d) => d.medicamento_id === med.id);
        const diasUnicos = new Set(dosMed.map((d) => isoDate(new Date(d.tomado_em))));
        const diasComDose  = diasUnicos.size;
        const porcentagem  = Math.round((diasComDose / 7) * 100);
        return { ...med, diasComDose, porcentagem };
      })
      .sort((a, b) => b.porcentagem - a.porcentagem);
  } catch {
    return meds.map((m) => ({ ...m, diasComDose: 0, porcentagem: 0 }));
  }
}

// ─── Presença anônima ─────────────────────────────────────────────────────────

/**
 * Conta quantas doses foram registradas no app na última hora,
 * globalmente (sem identificar usuários).
 *
 * Requer que a RLS da tabela doses_historico permita COUNT sem filtro de
 * user_id. Se restrita, retorna 0 graciosamente.
 *
 * Para um deploy real, use uma Edge Function com service_role key.
 */
export async function buscarPresencaAnonima() {
  try {
    const agora     = new Date();
    const umaHAtras = new Date(agora.getTime() - 60 * 60 * 1000);

    const { count } = await supabase
      .from('doses_historico')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'tomado')
      .gte('tomado_em', umaHAtras.toISOString());

    return count ?? 0;
  } catch {
    return 0;
  }
}
