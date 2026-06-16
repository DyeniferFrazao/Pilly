import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Alert, ActivityIndicator, SafeAreaView,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { sincronizarAvatarLeaderboard } from '../../services/avatarService';

import { useAuth } from '../../contexts/AuthContext';
import AvatarComponent from '../../components/AvatarComponent';
import FooterNavigation from '../../components/FooterNavigation';
import {
  buscarAvatarEquipado,
  equiparItem,
  buscarItensDesbloqueados,
  NIVEIS,
  getNivel,
  getProximoNivel,
  CONQUISTAS,
} from '../../services/avatarService';
import { buscarGamificacao } from '../../services/gamificationService';

// ─── Paleta ───────────────────────────────────────────────────
const TEAL       = '#1D6B78';
const TEAL_LIGHT = '#C8EDF2';
const BG         = '#F0F4F8';
const WHITE      = '#FFFFFF';
const GREY       = '#A8B5B8';

// ─── Catálogo local (espelha cosmetic_items, sem precisar de query extra) ──
const CATALOGO = {
  chapeu: [
    { id: 'hat_straw',   nome: 'Chapéu de palha',  emoji: '🎩', raridade: 'comum'    },
    { id: 'hat_glasses', nome: 'Óculos redondos',   emoji: '🕶️', raridade: 'comum'    },
    { id: 'hat_cowboy',  nome: 'Chapéu cowboy',     emoji: '🤠', raridade: 'raro'     },
    { id: 'hat_crown',   nome: 'Coroa',             emoji: '👑', raridade: 'epico'    },
    { id: 'hat_halo',    nome: 'Halo brilhante',    emoji: '😇', raridade: 'lendario' },
  ],
  roupa: [
    { id: 'shirt_green',  nome: 'Camiseta verde',    emoji: '👕', raridade: 'comum'    },
    { id: 'jacket_blue',  nome: 'Jaqueta azul',      emoji: '🧥', raridade: 'raro'     },
    { id: 'coat_white',   nome: 'Jaleco branco',     emoji: '🥼', raridade: 'raro'     },
    { id: 'suit_gold',    nome: 'Uniforme dourado',  emoji: '✨', raridade: 'epico'    },
    { id: 'cape_special', nome: 'Capa especial',     emoji: '🦸', raridade: 'lendario' },
  ],
  cabelo: [
    { id: 'hair_default', nome: 'Liso castanho',   emoji: '🟫', raridade: 'comum'    },
    { id: 'hair_curly',   nome: 'Cacheado roxo',   emoji: '💜', raridade: 'raro'     },
    { id: 'hair_wavy',    nome: 'Ondulado azul',   emoji: '🌊', raridade: 'raro'     },
    { id: 'hair_rainbow', nome: 'Arco-íris',        emoji: '🌈', raridade: 'lendario' },
  ],
  pet: [
    { id: 'pet_seed',   nome: 'Sementinha',    emoji: '🌱', raridade: 'comum'    },
    { id: 'pet_cat',    nome: 'Gatinho',        emoji: '🐱', raridade: 'raro'     },
    { id: 'pet_bunny',  nome: 'Coelhinho',      emoji: '🐰', raridade: 'raro'     },
    { id: 'pet_dog',    nome: 'Cachorrinho',    emoji: '🐶', raridade: 'epico'    },
    { id: 'pet_dragon', nome: 'Dragãozinho',    emoji: '🐉', raridade: 'lendario' },
  ],
  moldura: [
    { id: 'frame_default', nome: 'Padrão',          emoji: '⬜', raridade: 'comum'    },
    { id: 'frame_blue',    nome: 'Moldura azul',    emoji: '🔵', raridade: 'raro'     },
    { id: 'frame_purple',  nome: 'Moldura violeta', emoji: '💜', raridade: 'epico'    },
    { id: 'frame_gold',    nome: 'Moldura dourada', emoji: '🟡', raridade: 'epico'    },
    { id: 'frame_diamond', nome: 'Moldura diamante',emoji: '💎', raridade: 'lendario' },
  ],
};

const ABAS = [
  { key: 'chapeu',  label: 'Chapéu',  icon: '🎩' },
  { key: 'roupa',   label: 'Roupa',   icon: '👗' },
  { key: 'cabelo',  label: 'Cabelo',  icon: '💇' },
  { key: 'pet',     label: 'Pet',     icon: '🐾' },
  { key: 'moldura', label: 'Moldura', icon: '🃏' },
];

const RARIDADE_CORES = {
  comum:    { bg: '#d4f0e4', text: '#2d7a55', label: 'Comum'    },
  raro:     { bg: '#cce6ff', text: '#1a5ea3', label: 'Raro'     },
  epico:    { bg: '#ead6ff', text: '#6b29a0', label: 'Épico'    },
  lendario: { bg: '#ffecc0', text: '#a06010', label: 'Lendário' },
};

// Busca o requisito descritivo a partir de CONQUISTAS
function getRequisito(itemId) {
  const c = CONQUISTAS.find((x) => x.recompensa === itemId);
  return c ? c.desc : '';
}

// Ícone Feather para cada nível (sem emojis)
const NIVEL_ICONE = ['', 'star', 'trending-up', 'award', 'shield', 'zap'];

// ─────────────────────────────────────────────────────────────

const AvatarEditorScreen = () => {
  const { user } = useAuth();
  const navigation = useNavigation();

  const [equipado,     setEquipado]     = useState({});
  const [desbloqueados, setDesbloqueados] = useState(new Set());
  const [gamificacao,  setGamificacao]  = useState(null);
  const [abaAtiva,     setAbaAtiva]     = useState('chapeu');
  const [salvando,     setSalvando]     = useState(false);
  const [carregando,   setCarregando]   = useState(true);

  // ── Carrega dados ────────────────────────────────────────────
  const carregar = useCallback(async () => {
    if (!user?.id) return;
    setCarregando(true);
    try {
      // perfilId necessário para buscarGamificacao
      const perfilId = await AsyncStorage.getItem('perfilId');
      const [avatar, itens, gam] = await Promise.all([
        buscarAvatarEquipado(user.id),
        buscarItensDesbloqueados(user.id),
        perfilId ? buscarGamificacao(user.id, perfilId) : Promise.resolve(null),
      ]);
      setEquipado(avatar ?? {});
      setDesbloqueados(itens);
      setGamificacao(gam);
    } catch (e) {
      console.warn('[AvatarEditor] Erro ao carregar:', e.message);
    } finally {
      setCarregando(false);
    }
  }, [user]);

  useEffect(() => { carregar(); }, [carregar]);

  // ── Equipa item localmente (preview imediato) ─────────────────
  const selecionarItem = (categoria, itemId) => {
    if (!desbloqueados.has(itemId)) return; // bloqueado
    setEquipado((prev) => ({ ...prev, [categoria]: itemId }));
  };

  // ── Salva no Supabase ────────────────────────────────────────
  const salvar = async () => {
    setSalvando(true);
    try {
      for (const cat of Object.keys(CATALOGO)) {
        const itemId = equipado[cat];
        if (itemId) await equiparItem(user.id, cat, itemId);
      }
      // Sincroniza avatar no leaderboard público (em background)
      sincronizarAvatarLeaderboard(user.id, equipado).catch(() => {});
      Alert.alert('Avatar salvo!', 'Seu visual foi atualizado. 🎉');
    } catch (e) {
      Alert.alert('Erro', 'Não foi possível salvar o avatar.');
    } finally {
      setSalvando(false);
    }
  };

  // ── Pilly Score (XP acumulado) & Nível ──────────────────────
  // Usa XP bruto para que o score cresça continuamente com o progresso
  const score     = gamificacao?.xp ?? 0;
  const nivelInfo = getNivel(score);
  const proxNivel = getProximoNivel(score);
  const progNivel = proxNivel
    ? Math.round(((score - nivelInfo.minScore) / (proxNivel.minScore - nivelInfo.minScore)) * 100)
    : 100;

  // Conquistas: se todas do nível atual estiverem concluídas → mostra o próximo
  const nivelConquistas   = CONQUISTAS.filter((c) => c.nivel === nivelInfo.nivel);
  const todosConcluidos   = nivelConquistas.every((c) => desbloqueados.has(c.recompensa));
  const nivelMostrar      = (todosConcluidos && nivelInfo.nivel < 5) ? nivelInfo.nivel + 1 : nivelInfo.nivel;
  const conquistasExibidas = CONQUISTAS.filter((c) => c.nivel === nivelMostrar);

  // ── Render ───────────────────────────────────────────────────
  if (carregando) {
    return (
      <View style={styles.loadingWrap}>
        <ActivityIndicator size="large" color={TEAL} />
      </View>
    );
  }

  const itensAba = CATALOGO[abaAtiva] ?? [];

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>

        {/* ── Header ─────────────────────────────────────────── */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
            <Feather name="chevron-left" size={24} color={TEAL} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Meu Avatar</Text>
          <TouchableOpacity onPress={salvar} disabled={salvando} style={styles.saveBtn}>
            {salvando
              ? <ActivityIndicator size="small" color={WHITE} />
              : <Text style={styles.saveBtnText}>Salvar</Text>
            }
          </TouchableOpacity>
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100 }}>

          {/* ── Preview + Nível ──────────────────────────────── */}
          <View style={styles.previewSection}>
            {/* Avatar ao vivo */}
            <View style={styles.avatarStage}>
              <View style={styles.avatarLiveLabel}>
                <Feather name="eye" size={9} color={TEAL} />
                <Text style={styles.avatarLiveLabelText}>ao vivo</Text>
              </View>
              <AvatarComponent equipado={equipado} size="lg" showPet showFrame />
            </View>

            {/* Nível e Pilly Score */}
            <View style={styles.nivelWrap}>
              {/* Cabeçalho de nível */}
              <View style={styles.nivelRow}>
                <View style={[styles.nivelIconBadge, { backgroundColor: `${nivelInfo.cor}18`, borderColor: `${nivelInfo.cor}30` }]}>
                  <Feather name={NIVEL_ICONE[nivelInfo.nivel] ?? 'star'} size={17} color={nivelInfo.cor} />
                </View>
                <View>
                  <Text style={[styles.nivelNome, { color: nivelInfo.cor }]}>{nivelInfo.nome}</Text>
                  <Text style={styles.nivelSub}>Nível {nivelInfo.nivel}</Text>
                </View>
              </View>

              {/* Score card com acento de cor */}
              <View style={[styles.scoreCard, { borderLeftColor: nivelInfo.cor }]}>
                <View style={styles.scoreLabelRow}>
                  <Feather name="zap" size={10} color={GREY} />
                  <Text style={styles.scoreLabel}> Pilly Score</Text>
                </View>
                <Text style={[styles.scoreValue, { color: nivelInfo.cor }]}>
                  {score} <Text style={styles.scorePts}>pts</Text>
                </Text>
              </View>

              {/* Progresso até próximo nível */}
              {proxNivel && (
                <View style={styles.progWrap}>
                  <View style={styles.progHeader}>
                    <Text style={[styles.progLabel, { color: nivelInfo.cor }]}>{progNivel}%</Text>
                    <View style={styles.progMetaRow}>
                      <Feather name={NIVEL_ICONE[proxNivel.nivel] ?? 'star'} size={9} color={GREY} />
                      <Text style={styles.progMeta}> até {proxNivel.nome}</Text>
                    </View>
                  </View>
                  <View style={styles.progBg}>
                    <View style={[styles.progFill, { width: `${progNivel}%`, backgroundColor: nivelInfo.cor }]} />
                  </View>
                  <Text style={styles.progPts}>{score} / {proxNivel.minScore} pts</Text>
                </View>
              )}
              {!proxNivel && (
                <View style={[styles.scoreCard, { backgroundColor: '#fff0f0', borderLeftColor: '#c02020', marginTop: 4 }]}>
                  <View style={styles.scoreLabelRow}>
                    <Feather name="zap" size={10} color="#c02020" />
                    <Text style={[styles.scoreLabel, { color: '#c02020' }]}> Nível máximo!</Text>
                  </View>
                </View>
              )}
            </View>
          </View>

          {/* ── Abas de categoria ────────────────────────────── */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.abasScroll}
            contentContainerStyle={{ paddingHorizontal: 16, gap: 8 }}
          >
            {ABAS.map((aba) => (
              <TouchableOpacity
                key={aba.key}
                style={[styles.abaBtn, abaAtiva === aba.key && styles.abaBtnAtiva]}
                onPress={() => setAbaAtiva(aba.key)}
              >
                <Text style={styles.abaIcon}>{aba.icon}</Text>
                <Text style={[styles.abaLabel, abaAtiva === aba.key && styles.abaLabelAtiva]}>
                  {aba.label}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* ── Rótulo do grid ───────────────────────────────── */}
          <View style={styles.gridLabelRow}>
            <Text style={styles.gridLabel}>Toque para experimentar</Text>
            <View style={styles.gridLabelDot} />
            <Text style={styles.gridLabelCount}>{itensAba.length} itens</Text>
          </View>

          {/* ── Grid de itens ────────────────────────────────── */}
          <View style={styles.gridWrap}>
            {itensAba.map((item) => {
              const desbloqueado = desbloqueados.has(item.id);
              const equipadoNow  = equipado[abaAtiva] === item.id;
              const rarCor       = RARIDADE_CORES[item.raridade] ?? RARIDADE_CORES.comum;
              const requisito    = getRequisito(item.id);

              // Avatar com ESSE item aplicado — o usuário vê como ficará antes de confirmar
              const previewEquipado = { ...equipado, [abaAtiva]: item.id };

              return (
                <TouchableOpacity
                  key={item.id}
                  style={[
                    styles.itemCard,
                    equipadoNow  && styles.itemCardEquipado,
                    !desbloqueado && styles.itemCardLocked,
                  ]}
                  onPress={() => selecionarItem(abaAtiva, item.id)}
                  activeOpacity={desbloqueado ? 0.75 : 1}
                >
                  {/* Preview live do avatar com este item */}
                  <View style={styles.itemAvatarWrap}>
                    <AvatarComponent
                      equipado={previewEquipado}
                      size="sm"
                      showPet={abaAtiva === 'pet'}
                      showFrame={abaAtiva === 'moldura'}
                    />
                  </View>

                  <Text style={styles.itemNome} numberOfLines={2}>{item.nome}</Text>
                  <View style={[styles.rarTag, { backgroundColor: rarCor.bg }]}>
                    <Text style={[styles.rarText, { color: rarCor.text }]}>{rarCor.label}</Text>
                  </View>

                  {!desbloqueado && (
                    <View style={styles.lockOverlay}>
                      <Feather name="lock" size={18} color="#5a7a80" />
                      <Text style={styles.lockDesc} numberOfLines={3}>{requisito}</Text>
                    </View>
                  )}
                  {equipadoNow && (
                    <View style={styles.equipadoBadge}>
                      <Feather name="check" size={9} color={WHITE} />
                      <Text style={styles.equipadoText}>Equipado</Text>
                    </View>
                  )}
                </TouchableOpacity>
              );
            })}
          </View>

          {/* ── Conquistas do nível ─────────────────────────── */}
          <View style={styles.conquistasSection}>
            <View style={styles.conquistasHeader}>
              <Text style={styles.sectionTitle}>
                {todosConcluidos && nivelMostrar > nivelInfo.nivel
                  ? `Próximas conquistas — Nível ${nivelMostrar}`
                  : 'Conquistas deste nível'}
              </Text>
              {todosConcluidos && nivelMostrar > nivelInfo.nivel && (
                <View style={styles.nivelBadge}>
                  <Feather name="check" size={9} color="#2d7a55" />
                  <Text style={styles.nivelBadgeText}>nível {nivelInfo.nivel} completo</Text>
                </View>
              )}
            </View>

            {conquistasExibidas.map((c) => {
              const feito = desbloqueados.has(c.recompensa);
              return (
                <View key={c.id} style={[styles.conquistaRow, feito && styles.conquistaRowDone]}>
                  <Text style={styles.cEmoji}>{c.emoji}</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.cNome}>{c.nome}</Text>
                    <Text style={styles.cDesc}>{c.desc}</Text>
                  </View>
                  {/* Apenas o indicador de concluído / pendente */}
                  <Feather
                    name={feito ? 'check-circle' : 'circle'}
                    size={20}
                    color={feito ? '#2d7a55' : '#C8D8DC'}
                  />
                </View>
              );
            })}
          </View>

        </ScrollView>
      </View>
      <FooterNavigation />
    </SafeAreaView>
  );
};

// ─── Estilos ──────────────────────────────────────────────────
const styles = StyleSheet.create({
  safe:        { flex: 1, backgroundColor: BG },
  container:   { flex: 1 },
  loadingWrap: { flex: 1, justifyContent: 'center', alignItems: 'center' },

  // ── Header ────────────────────────────────────────────────
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 14,
    backgroundColor: WHITE, borderBottomWidth: 1, borderBottomColor: '#e0eef2',
  },
  headerTitle:  { fontSize: 17, fontWeight: '800', color: TEAL },
  saveBtn:      { backgroundColor: TEAL, paddingHorizontal: 18, paddingVertical: 8, borderRadius: 16 },
  saveBtnText:  { color: WHITE, fontWeight: '700', fontSize: 13 },

  // ── Preview card ──────────────────────────────────────────
  previewSection: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 16,
    backgroundColor: WHITE, padding: 18,
    marginHorizontal: 16, marginTop: 16, borderRadius: 20,
    shadowColor: TEAL, shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.10, shadowRadius: 10, elevation: 5,
    borderWidth: 0.5, borderColor: TEAL_LIGHT,
  },
  avatarStage: { alignItems: 'center', gap: 4 },
  avatarLiveLabel: {
    flexDirection: 'row', alignItems: 'center', gap: 3,
    backgroundColor: TEAL_LIGHT, borderRadius: 8,
    paddingHorizontal: 7, paddingVertical: 3,
  },
  avatarLiveLabelText: { fontSize: 9, fontWeight: '700', color: TEAL },

  nivelWrap:   { flex: 1, paddingTop: 2 },
  nivelRow:    { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 10 },
  nivelIconBadge: {
    width: 38, height: 38, borderRadius: 12,
    justifyContent: 'center', alignItems: 'center',
    borderWidth: 1,
  },
  nivelNome:   { fontSize: 17, fontWeight: '800', lineHeight: 21 },
  nivelSub:    { fontSize: 10, color: GREY, fontWeight: '600', marginTop: 1 },

  scoreCard: {
    backgroundColor: '#f4fafc',
    borderRadius: 12,
    paddingHorizontal: 12, paddingVertical: 9,
    marginBottom: 10,
    borderWidth: 0.5, borderColor: TEAL_LIGHT,
    borderLeftWidth: 3,   // cor sobreposta inline com nivelInfo.cor
  },
  scoreLabelRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 3 },
  scoreLabel:    { fontSize: 10, fontWeight: '600', color: GREY },
  scoreValue:    { fontSize: 24, fontWeight: '900', lineHeight: 28 },
  scorePts:      { fontSize: 13, fontWeight: '600' },

  progWrap:   { gap: 4 },
  progHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  progLabel:  { fontSize: 11, fontWeight: '800' },
  progMetaRow:{ flexDirection: 'row', alignItems: 'center' },
  progMeta:   { fontSize: 10, color: GREY },
  progBg:     { height: 7, backgroundColor: '#e0eef2', borderRadius: 4, overflow: 'hidden' },
  progFill:   { height: '100%', borderRadius: 4 },
  progPts:    { fontSize: 9, color: GREY, marginTop: 2 },

  // ── Abas de categoria ─────────────────────────────────────
  abasScroll: { marginTop: 18 },
  abaBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    paddingHorizontal: 14, paddingVertical: 8,
    borderRadius: 20, backgroundColor: WHITE,
    borderWidth: 1.5, borderColor: '#e0eef2',
  },
  abaBtnAtiva:   { backgroundColor: TEAL, borderColor: TEAL },
  abaIcon:       { fontSize: 13 },
  abaLabel:      { fontSize: 12, fontWeight: '600', color: GREY },
  abaLabelAtiva: { color: WHITE },

  // ── Rótulo do grid ────────────────────────────────────────
  gridLabelRow: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 18, paddingTop: 18, paddingBottom: 2,
  },
  gridLabel:    { fontSize: 11, fontWeight: '700', color: GREY, textTransform: 'uppercase', letterSpacing: 0.4 },
  gridLabelDot: { width: 3, height: 3, borderRadius: 2, backgroundColor: GREY },
  gridLabelCount: { fontSize: 11, color: GREY },

  // ── Grid de itens ─────────────────────────────────────────
  gridWrap: {
    flexDirection: 'row', flexWrap: 'wrap', gap: 10,
    paddingHorizontal: 16, paddingTop: 8,
  },
  itemCard: {
    width: '47%', backgroundColor: WHITE, borderRadius: 16,
    paddingVertical: 12, paddingHorizontal: 10,
    alignItems: 'center', gap: 6,
    borderWidth: 2, borderColor: '#e8f0f2',
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05, shadowRadius: 4, elevation: 2,
    position: 'relative', overflow: 'hidden', minHeight: 150,
  },
  itemCardEquipado: { borderColor: TEAL, borderWidth: 2.5, backgroundColor: '#f4fafc' },
  itemCardLocked:   { opacity: 0.65 },

  itemAvatarWrap: {
    width: 60, height: 68,
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 2,
  },
  itemEmoji: { fontSize: 32 }, // mantido para não quebrar referências externas

  itemNome:  { fontSize: 11, fontWeight: '700', textAlign: 'center', color: '#2a3a3e', lineHeight: 15 },
  rarTag:    { paddingHorizontal: 9, paddingVertical: 3, borderRadius: 10 },
  rarText:   { fontSize: 9, fontWeight: '800', letterSpacing: 0.2 },

  lockOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(235,242,246,0.92)',
    justifyContent: 'center', alignItems: 'center',
    borderRadius: 14, gap: 5, padding: 10,
  },
  lockDesc: { fontSize: 10, color: '#5a7a80', textAlign: 'center', fontWeight: '600', lineHeight: 14 },

  equipadoBadge: {
    position: 'absolute', top: 6, right: 6,
    flexDirection: 'row', alignItems: 'center', gap: 3,
    backgroundColor: TEAL, borderRadius: 8,
    paddingHorizontal: 6, paddingVertical: 2,
  },
  equipadoText: { fontSize: 8, color: WHITE, fontWeight: '800' },

  // ── Conquistas ────────────────────────────────────────────
  conquistasSection: {
    marginHorizontal: 16, marginTop: 20, marginBottom: 4,
    backgroundColor: WHITE, borderRadius: 20, padding: 16, gap: 10,
    shadowColor: TEAL, shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06, shadowRadius: 8, elevation: 3,
    borderWidth: 0.5, borderColor: TEAL_LIGHT,
  },
  conquistasHeader: {
    flexDirection: 'row', alignItems: 'center', marginBottom: 2,
  },
  sectionTitle: { fontSize: 13, fontWeight: '800', color: TEAL, flex: 1 },
  nivelBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 3,
    backgroundColor: '#edfaf3', borderRadius: 8,
    paddingHorizontal: 8, paddingVertical: 3, marginLeft: 8,
  },
  nivelBadgeText: { fontSize: 10, fontWeight: '700', color: '#2d7a55' },

  conquistaRow: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    paddingVertical: 8, paddingHorizontal: 10,
    borderRadius: 12, backgroundColor: '#f8fbfc',
    borderWidth: 1, borderColor: '#e0eef2',
  },
  conquistaRowDone: { backgroundColor: '#edfaf3', borderColor: '#a8dfc2' },
  cEmoji:       { fontSize: 20 },
  cNome:        { fontSize: 12, fontWeight: '700', color: '#1a2a2e' },
  cDesc:        { fontSize: 10, color: GREY, marginTop: 1 },
  cReward:      { fontSize: 16 },
  cRewardAvatar: {
    width: 40, height: 46,
    alignItems: 'center', justifyContent: 'center',
    overflow: 'hidden',
  },
});

export default AvatarEditorScreen;
