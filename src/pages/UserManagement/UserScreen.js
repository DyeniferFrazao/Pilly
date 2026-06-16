import React, { useState, useCallback } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  Image, Alert, StyleSheet,
} from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import FooterNavigation from '../../components/FooterNavigation';
import { useAuth } from '../../contexts/AuthContext';
import { listarPerfis, excluirPerfil } from '../../services/profileService';
import { buscarGamificacaoTodosPerfis } from '../../services/gamificationService';

// ─── Helpers ──────────────────────────────────────────────────────────────────
const COR_PERFIS = ['#1D6B78', '#D4537E', '#BA7517', '#7F77DD', '#3B6D11'];
const BG_PERFIS  = ['#C8EDF2', '#F4C0D1', '#FAC775', '#CECBF6', '#C0DD97'];

const iniciais = (nome = '') =>
  nome.trim().split(/\s+/).slice(0, 2).map(w => w[0]?.toUpperCase() ?? '').join('');

// ─── Componente: Avatar de perfil ─────────────────────────────────────────────
// Nota: foto_url pode vir como string "null" do Supabase — checar explicitamente.
const fotoValida = (url) => url && url !== 'null' && url.startsWith('http');

const AvatarPerfil = ({ perfil, index, size = 52 }) => {
  const cor = COR_PERFIS[index % COR_PERFIS.length];
  const bg  = BG_PERFIS[index % BG_PERFIS.length];

  if (fotoValida(perfil.foto_url)) {
    return (
      <Image
        source={{ uri: perfil.foto_url }}
        style={{ width: size, height: size, borderRadius: size / 2 }}
      />
    );
  }
  return (
    <View
      style={{
        width: size, height: size, borderRadius: size / 2,
        backgroundColor: bg, justifyContent: 'center', alignItems: 'center',
        flexShrink: 0,
      }}
    >
      <Text style={{ fontSize: Math.round(size * 0.35), fontWeight: 'bold', color: cor }}>
        {iniciais(perfil.nome)}
      </Text>
    </View>
  );
};

// ─── Componente: Card de perfil ────────────────────────────────────────────────
const PerfilCard = ({ perfil, index, ativo, gam, onSelect, onEdit }) => {
  const cor    = COR_PERFIS[index % COR_PERFIS.length];
  const xp     = gam?.xp     ?? 0;
  const streak = gam?.streak  ?? 0;
  const badges = Array.isArray(gam?.badges) ? gam.badges : [];

  return (
    <TouchableOpacity
      style={[S.card, ativo && { borderColor: '#1D6B78', borderWidth: 1.5 }]}
      onPress={onSelect}
      activeOpacity={0.8}
    >
      {/* Badge "ativo" */}
      {ativo && (
        <View style={S.ativoBadge}>
          <Text style={S.ativoText}>ativo</Text>
        </View>
      )}

      {/* Linha principal */}
      <View style={S.cardRow}>
        <AvatarPerfil perfil={perfil} index={index} />

        <View style={S.cardInfo}>
          <Text style={S.cardNome}>{perfil.nome}</Text>
          {perfil.bio ? (
            <Text style={S.cardBio} numberOfLines={1}>{perfil.bio}</Text>
          ) : null}

          {/* Badges de gamificação */}
          <View style={S.gamRow}>
            {streak > 0 && (
              <View style={S.gamChip}>
                <Text style={S.gamChipText}>🔥 {streak}d</Text>
              </View>
            )}
            {xp > 0 && (
              <View style={S.gamChip}>
                <Text style={S.gamChipText}>⚡ {xp} XP</Text>
              </View>
            )}
            {badges.includes('rank_1') && (
              <View style={[S.gamChip, { backgroundColor: '#FAC775' }]}>
                <Text style={[S.gamChipText, { color: '#633806' }]}>👑 Líder</Text>
              </View>
            )}
          </View>
        </View>

        {/* Botão editar */}
        <TouchableOpacity onPress={onEdit} style={S.editBtn} hitSlop={8}>
          <Feather name="edit-2" size={16} color="#7AABB5" />
        </TouchableOpacity>
      </View>

      {/* Barra de XP */}
      {xp > 0 && (
        <View style={S.xpBarRow}>
          <View style={S.xpBarBg}>
            <View
              style={[
                S.xpBarFill,
                { width: `${Math.min((xp / 1000) * 100, 100)}%`, backgroundColor: cor },
              ]}
            />
          </View>
          <Text style={[S.xpLabel, { color: cor }]}>{xp} / 1000 XP</Text>
        </View>
      )}
    </TouchableOpacity>
  );
};

// ─── Tela principal ───────────────────────────────────────────────────────────
const UserScreen = () => {
  const navigation = useNavigation();
  const { user }   = useAuth();

  const [perfis,    setPerfis]    = useState([]);
  const [perfilAtivoId, setPerfilAtivoId] = useState(null);
  const [gamMap,    setGamMap]    = useState({});
  const [loading,   setLoading]   = useState(true);

  // ── Carga de dados ────────────────────────────────────────────────────────────
  useFocusEffect(
    useCallback(() => {
      if (!user) return;

      const carregar = async () => {
        setLoading(true);
        try {
          const [lista, ativoId] = await Promise.all([
            listarPerfis(user.id),
            AsyncStorage.getItem('perfilId'),
          ]);

          setPerfis(lista);
          setPerfilAtivoId(ativoId);

          if (lista.length > 0) {
            const ids = lista.map(p => p.id);
            const mapa = await buscarGamificacaoTodosPerfis(user.id, ids);
            setGamMap(mapa);
          }
        } catch {
          Alert.alert('Erro', 'Não foi possível carregar os perfis.');
        } finally {
          setLoading(false);
        }
      };

      carregar();
    }, [user])
  );

  // ── Selecionar perfil ─────────────────────────────────────────────────────────
  const handleSelect = async (perfil) => {
    await AsyncStorage.setItem('perfilId',   perfil.id);
    await AsyncStorage.setItem('perfilNome', perfil.nome ?? '');
    navigation.navigate('Home', { perfilId: perfil.id, perfilNome: perfil.nome });
  };

  // ── Excluir perfil ────────────────────────────────────────────────────────────
  const handleDelete = (perfilId) => {
    Alert.alert('Excluir perfil', 'Essa ação não pode ser desfeita.', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Excluir',
        style: 'destructive',
        onPress: async () => {
          try {
            await excluirPerfil(perfilId);
            setPerfis(prev => prev.filter(p => p.id !== perfilId));
            const ativo = await AsyncStorage.getItem('perfilId');
            if (ativo === perfilId) {
              await AsyncStorage.multiRemove(['perfilId', 'perfilNome']);
              setPerfilAtivoId(null);
            }
          } catch {
            Alert.alert('Erro', 'Não foi possível excluir o perfil.');
          }
        },
      },
    ]);
  };

  // ── Editar perfil ─────────────────────────────────────────────────────────────
  const handleEdit = (perfil) => {
    navigation.navigate('EditProfileScreen', { profile: perfil });
  };

  // ── Render ────────────────────────────────────────────────────────────────────
  const emailCurto = user?.email ?? '';

  return (
    <SafeAreaView style={S.container} edges={['top']}>

      {/* Header */}
      <View style={S.header}>
        <View>
          <Text style={S.headerTitle}>Perfis</Text>
          <Text style={S.headerSub} numberOfLines={1}>{emailCurto}</Text>
        </View>
        <TouchableOpacity
          style={S.headerSettingsBtn}
          onPress={() => navigation.navigate('Setting', {})}
        >
          <Feather name="settings" size={20} color="rgba(255,255,255,0.8)" />
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={S.scroll}
        showsVerticalScrollIndicator={false}
      >
        {/* Instrução */}
        <Text style={S.instrucao}>
          {perfis.length === 0
            ? 'Crie o primeiro perfil para começar.'
            : 'Toque em um perfil para ativá-lo.'}
        </Text>

        {/* Lista de perfis */}
        {loading ? (
          <Text style={S.loadingText}>Carregando perfis…</Text>
        ) : (
          perfis.map((perfil, i) => (
            <PerfilCard
              key={perfil.id}
              perfil={perfil}
              index={i}
              ativo={perfil.id === perfilAtivoId}
              gam={gamMap[perfil.id]}
              onSelect={() => handleSelect(perfil)}
              onEdit={() => handleEdit(perfil)}
            />
          ))
        )}

        {/* Card inline: adicionar perfil */}
        {!loading && (
          <TouchableOpacity
            style={S.addCard}
            onPress={() => navigation.navigate('AddUser')}
            activeOpacity={0.7}
          >
            <View style={S.addCardIconWrap}>
              <Feather name="plus" size={20} color="#1D6B78" />
            </View>
            <Text style={S.addCardText}>Adicionar novo perfil</Text>
          </TouchableOpacity>
        )}

        {/* Espaço para o footer */}
        <View style={{ height: 100 }} />
      </ScrollView>

      <FooterNavigation />
    </SafeAreaView>
  );
};

// ─── Estilos ──────────────────────────────────────────────────────────────────
const S = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F0F4F8' },

  header: {
    backgroundColor: '#1D6B78',
    paddingHorizontal: 18,
    paddingTop: 12,
    paddingBottom: 18,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  headerTitle: { fontSize: 22, fontWeight: 'bold', color: '#fff' },
  headerSub: { fontSize: 12, color: 'rgba(255,255,255,0.6)', marginTop: 2 },
  headerSettingsBtn: {
    padding: 6,
    marginTop: 2,
  },

  scroll: { paddingHorizontal: 16, paddingTop: 16 },

  instrucao: {
    fontSize: 13,
    color: '#7AABB5',
    marginBottom: 14,
  },

  loadingText: { color: '#AAB5B8', fontSize: 13, marginTop: 20 },

  // Card de perfil
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 14,
    marginBottom: 12,
    borderWidth: 0.5,
    borderColor: '#D5E8EA',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
    position: 'relative',
  },

  ativoBadge: {
    position: 'absolute',
    top: -8,
    right: 12,
    backgroundColor: '#1D6B78',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  ativoText: { fontSize: 10, fontWeight: 'bold', color: '#fff' },

  cardRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },

  cardInfo: { flex: 1 },
  cardNome: { fontSize: 16, fontWeight: '700', color: '#1A3A40', marginBottom: 2 },
  cardBio:  { fontSize: 12, color: '#7AABB5', marginBottom: 6 },

  gamRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  gamChip: {
    backgroundColor: '#EAF5F7',
    borderRadius: 20,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  gamChipText: { fontSize: 11, color: '#1D6B78', fontWeight: '600' },

  editBtn: {
    padding: 6,
    alignSelf: 'flex-start',
  },

  // Barra XP
  xpBarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 10,
  },
  xpBarBg: {
    flex: 1,
    height: 5,
    backgroundColor: '#E8F0F2',
    borderRadius: 3,
    overflow: 'hidden',
  },
  xpBarFill: {
    height: 5,
    borderRadius: 3,
  },
  xpLabel: {
    fontSize: 10,
    fontWeight: '600',
    minWidth: 72,
    textAlign: 'right',
  },

  // Card inline: adicionar perfil
  addCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#fff',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#C8EDF2',
    borderStyle: 'dashed',
    padding: 14,
    marginBottom: 12,
  },
  addCardIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#EAF5F7',
    justifyContent: 'center',
    alignItems: 'center',
  },
  addCardText: { fontSize: 14, fontWeight: '600', color: '#1D6B78' },
});

export default UserScreen;
