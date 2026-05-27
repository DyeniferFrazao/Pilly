import React, { useState, useCallback } from 'react';
import {
  View, Text, ScrollView, Image, Alert,
  TouchableOpacity, StyleSheet,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import stylehome from '../../style/stylehome';
import Card from '../../components/Card';
import FooterNavigation from '../../components/FooterNavigation';
import ModalComponent from '../../components/ModalComponent';
import { useAuth } from '../../contexts/AuthContext';
import { listarMedicamentos, removerMedicamento, buscarDosesHoje } from '../../services/medicService';
import { cancelAlarmsForMedication } from '../../services/alarmService';

// ─── Helper ───────────────────────────────────────────────────────────────────
const diasDesde = (dateStr) => {
  if (!dateStr) return null;
  const diff = Date.now() - new Date(dateStr).getTime();
  const dias  = Math.floor(diff / (1000 * 60 * 60 * 24));
  if (dias < 30) return `${dias}d`;
  const meses     = Math.floor(dias / 30);
  const restoDias = dias % 30;
  return restoDias > 0 ? `${meses}m e ${restoDias}d` : `${meses}m`;
};

/** Mensagem motivacional com base no percentual de adesão */
function mensagemProgresso(pct) {
  if (pct === 0)   return 'Comece o dia tomando sua primeira dose 💊';
  if (pct < 0.5)   return 'Bom começo! Continue assim 💪';
  if (pct < 1)     return 'Quase lá! Você está indo muito bem ⭐';
  return 'Perfeito! Todas as doses do dia tomadas 🏆';
}

// ─── Componente de progresso ──────────────────────────────────────────────────
const CartaoProgresso = ({ tomadas, total }) => {
  if (total === 0) return null;

  const pct    = Math.min(tomadas / total, 1);
  const pctPct = Math.round(pct * 100);

  return (
    <View style={prog.card}>
      {/* Cabeçalho */}
      <View style={prog.cabecalho}>
        <Feather name="activity" size={16} color="#2E7D8A" />
        <Text style={prog.titulo}>  Progresso de Hoje</Text>
        <Text style={prog.contagem}>{tomadas}/{total} doses</Text>
      </View>

      {/* Barra de progresso */}
      <View style={prog.barraFundo}>
        <View style={[prog.barraPreenchimento, { width: `${pctPct}%` }]} />
      </View>

      {/* Mensagem */}
      <Text style={prog.mensagem}>{mensagemProgresso(pct)}</Text>

      {/* Placeholder para gamificação futura */}
      <View style={prog.gamRow}>
        <View style={prog.gamBadge}>
          <Feather name="zap" size={12} color="#60A2AE" />
          <Text style={prog.gamTexto}>  Sequência  —</Text>
        </View>
        <View style={prog.gamBadge}>
          <Feather name="award" size={12} color="#60A2AE" />
          <Text style={prog.gamTexto}>  Conquistas  —</Text>
        </View>
      </View>
    </View>
  );
};

// ─── Tela principal ───────────────────────────────────────────────────────────
const HomeScreen = ({ navigation, route }) => {
  const { user } = useAuth();

  const [perfilId,   setPerfilId]   = useState(route.params?.perfilId   ?? null);
  const [perfilNome, setPerfilNome] = useState(route.params?.perfilNome ?? '');

  const [modalVisible,       setModalVisible]       = useState(false);
  const [selectedMedication, setSelectedMedication] = useState(null);
  const [medications,        setMedications]        = useState([]);
  const [loading,            setLoading]            = useState(true);

  // Progresso do dia
  const [dosesTomadas, setDosesTomadas] = useState(0);
  const [dosesTotal,   setDosesTotal]   = useState(0);

  // ── Perfil ativo ────────────────────────────────────────────────────────────
  const restaurarPerfilAtivo = useCallback(async () => {
    if (perfilId) return perfilId;
    const storedId   = await AsyncStorage.getItem('perfilId');
    const storedNome = await AsyncStorage.getItem('perfilNome');
    if (storedId) {
      setPerfilId(storedId);
      if (storedNome) setPerfilNome(storedNome);
      return storedId;
    }
    return null;
  }, [perfilId]);

  const persistirPerfilAtivo = useCallback(async (id, nome) => {
    if (id)   await AsyncStorage.setItem('perfilId',   id);
    if (nome) await AsyncStorage.setItem('perfilNome', nome);
  }, []);

  // ── Busca de dados ──────────────────────────────────────────────────────────
  const fetchDados = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const idAtivo = await restaurarPerfilAtivo();
      if (!idAtivo) {
        setMedications([]);
        setLoading(false);
        navigation.navigate('User');
        return;
      }

      // Medicamentos e doses em paralelo
      const [meds, dosesHoje] = await Promise.all([
        listarMedicamentos(idAtivo),
        buscarDosesHoje(idAtivo),
      ]);

      setMedications(meds);

      // Total de doses programadas hoje = soma dos horários de cada medicamento
      const totalProgramado = meds.reduce((acc, m) => {
        const hrs = Array.isArray(m.horarios) ? m.horarios : [];
        return acc + hrs.length;
      }, 0);

      const tomadas = (dosesHoje ?? []).filter(d => d.status === 'tomado').length;
      setDosesTotal(totalProgramado);
      setDosesTomadas(tomadas);

    } catch {
      Alert.alert('Erro', 'Não foi possível carregar os medicamentos.');
      setMedications([]);
    } finally {
      setLoading(false);
    }
  }, [user, restaurarPerfilAtivo, navigation]);

  // ── Focus effect ────────────────────────────────────────────────────────────
  useFocusEffect(
    useCallback(() => {
      const idFromParams   = route.params?.perfilId;
      const nomeFromParams = route.params?.perfilNome;
      if (idFromParams) {
        setPerfilId(idFromParams);
        setPerfilNome(nomeFromParams ?? '');
        persistirPerfilAtivo(idFromParams, nomeFromParams ?? '');
      }
      fetchDados();
    }, [route.params?.perfilId, route.params?.perfilNome, persistirPerfilAtivo, fetchDados])
  );

  // ── Ações ───────────────────────────────────────────────────────────────────
  const handleDelete = async (id) => {
    try {
      await removerMedicamento(id);
      await cancelAlarmsForMedication(id);
      setMedications(prev => prev.filter(m => m.id !== id));
      setModalVisible(false);
    } catch {
      Alert.alert('Erro', 'Não foi possível excluir o medicamento.');
    }
  };

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <SafeAreaView style={stylehome.container} edges={['top']}>

      {/* Cabeçalho */}
      <View style={stylehome.header}>
        <Text style={stylehome.headerText}>Medicamentos</Text>
      </View>

      {/* Seletor de perfil ativo */}
      <TouchableOpacity
        onPress={() => navigation.navigate('User')}
        style={stylehome.perfilBar}
      >
        <Text style={stylehome.perfilBarLabel}>Perfil ativo:</Text>
        <Text style={stylehome.perfilBarValue} numberOfLines={1}>
          {perfilNome || 'Selecionar perfil'}
        </Text>
        <Text style={stylehome.perfilBarSwitch}>trocar ›</Text>
      </TouchableOpacity>

      <ScrollView
        contentContainerStyle={[stylehome.scrollContent, { paddingBottom: 90 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Cartão de progresso ─────────────────────────────────────────── */}
        {!loading && (
          <CartaoProgresso tomadas={dosesTomadas} total={dosesTotal} />
        )}

        {/* ── Lista de medicamentos ────────────────────────────────────────── */}
        {loading ? (
          <Text style={stylehome.emptyListText}>Carregando…</Text>
        ) : medications.length > 0 ? (
          medications.map((med) => (
            <Card
              key={med.id}
              onPress={() => { setSelectedMedication(med); setModalVisible(true); }}
            >
              <View style={stylehome.cardContent}>
                <Image
                  source={require('../../../assets/icons/capsula.png')}
                  style={stylehome.cardImage}
                />
                <View style={stylehome.cardTextContainer}>
                  <Text style={stylehome.cardTitle}>{med.nome}</Text>
                  {med.principio ? (
                    <Text style={stylehome.cardDescription}>{med.principio}</Text>
                  ) : null}
                </View>
              </View>

              {med.dose ? (
                <Text style={stylehome.cardDetails}>
                  • {med.dose}{med.unidade ? ` ${med.unidade}` : ''}
                </Text>
              ) : null}
              {med.created_at ? (
                <Text style={stylehome.cardDetails}>
                  • Iniciado há{' '}
                  <Text style={stylehome.highlight}>{diasDesde(med.created_at)}</Text>
                </Text>
              ) : null}
              {med.estoque != null ? (
                <Text style={stylehome.cardDetails}>
                  • Restam{' '}
                  <Text style={stylehome.highlight}>
                    {med.estoque} {med.unidade || 'unidades'}
                  </Text>
                </Text>
              ) : null}
            </Card>
          ))
        ) : (
          <Text style={stylehome.emptyListText}>
            {perfilNome
              ? `Nenhum medicamento cadastrado para ${perfilNome}.`
              : 'Nenhum medicamento cadastrado.'}
          </Text>
        )}
      </ScrollView>

      {/* FAB removido — o "+" do FooterNavigation já cumpre essa função */}

      <FooterNavigation />

      {selectedMedication && (
        <ModalComponent
          visible={modalVisible}
          medication={selectedMedication}
          onClose={() => setModalVisible(false)}
          navigation={navigation}
          onDelete={handleDelete}
          onRefresh={fetchDados}
          perfilNome={perfilNome}
        />
      )}
    </SafeAreaView>
  );
};

// ─── Estilos do cartão de progresso ──────────────────────────────────────────
const prog = StyleSheet.create({
  card: {
    width: '92%',
    backgroundColor: '#EAF4F6',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#C8E6EA',
  },
  cabecalho: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  titulo: {
    fontSize: 14,
    fontWeight: '700',
    color: '#2E7D8A',
    flex: 1,
  },
  contagem: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#2E7D8A',
  },
  barraFundo: {
    height: 10,
    backgroundColor: '#C8E6EA',
    borderRadius: 5,
    overflow: 'hidden',
    marginBottom: 10,
  },
  barraPreenchimento: {
    height: '100%',
    backgroundColor: '#2E7D8A',
    borderRadius: 5,
  },
  mensagem: {
    fontSize: 12,
    color: '#4A7A82',
    marginBottom: 12,
  },
  // Placeholder gamificação
  gamRow: {
    flexDirection: 'row',
    gap: 10,
  },
  gamBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderWidth: 1,
    borderColor: '#C8E6EA',
  },
  gamTexto: {
    fontSize: 11,
    color: '#4A7A82',
    fontWeight: '600',
  },
});

export default HomeScreen;
