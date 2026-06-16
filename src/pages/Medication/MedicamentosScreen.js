import React, { useState, useCallback } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  Alert, StyleSheet, Modal,
} from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import FooterNavigation from '../../components/FooterNavigation';
import { useAuth } from '../../contexts/AuthContext';
import { listarMedicamentos, removerMedicamento } from '../../services/medicService';
import { cancelAlarmsForMedication } from '../../services/alarmService';

// ─── Paleta de cores por índice ──────────────────────────────────────────────
const CORES = ['#1D6B78', '#D4537E', '#BA7517', '#7F77DD', '#3B6D11'];
const BGS   = ['#C8EDF2', '#F4C0D1', '#FAC775', '#CECBF6', '#C0DD97'];

// ─── Helpers ─────────────────────────────────────────────────────────────────
const tipoIcone = (tipo = '') => {
  const t = tipo?.toLowerCase() ?? '';
  if (t.includes('líquid') || t.includes('liquid')) return 'droplet';
  if (t.includes('injet'))                           return 'activity';
  if (t.includes('gotas'))                           return 'eye';
  if (t.includes('pomada'))                          return 'layers';
  if (t.includes('adesivo'))                         return 'square';
  return 'package'; // comprimido / cápsula (default)
};

const formatarHorarios = (horarios) => {
  if (!Array.isArray(horarios) || horarios.length === 0) return null;
  return horarios.join(' · ');
};

const formatarDose = (med) => {
  if (!med.dose) return null;
  return `${med.dose}${med.unidade ? ' ' + med.unidade : ''}`;
};

// ─── Card de medicamento ─────────────────────────────────────────────────────
const MedCard = ({ med, index, onEdit, onDelete, onPress }) => {
  const cor = CORES[index % CORES.length];
  const bg  = BGS[index % BGS.length];
  const icone     = tipoIcone(med.tipo);
  const doseStr   = formatarDose(med);
  const horasStr  = formatarHorarios(med.horarios);

  return (
    <TouchableOpacity style={S.card} onPress={onPress} activeOpacity={0.85}>
      {/* Linha principal */}
      <View style={S.cardRow}>
        {/* Ícone */}
        <View style={[S.cardIcon, { backgroundColor: bg }]}>
          <Feather name={icone} size={18} color={cor} />
        </View>

        {/* Info */}
        <View style={S.cardInfo}>
          <Text style={S.cardNome}>{med.nome}</Text>
          {med.principio ? (
            <Text style={S.cardPrincipio} numberOfLines={1}>{med.principio}</Text>
          ) : null}
          <Text style={S.cardSub} numberOfLines={1}>
            {[doseStr, horasStr].filter(Boolean).join('  ·  ') || 'Sem horário definido'}
          </Text>
          {med.tipo ? (
            <View style={[S.tipoBadge, { backgroundColor: bg }]}>
              <Text style={[S.tipoBadgeText, { color: cor }]}>{med.tipo}</Text>
            </View>
          ) : null}
        </View>

        {/* Ações: editar + excluir (edit primeiro = mais acessível) */}
        <View style={S.acoes}>
          <TouchableOpacity onPress={onEdit} style={S.editBtn} hitSlop={8}>
            <Feather name="edit-2" size={16} color="#7AABB5" />
          </TouchableOpacity>
          <TouchableOpacity onPress={onDelete} style={S.deleteBtn} hitSlop={10}>
            <Feather name="trash-2" size={15} color="#E06060" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Barra de horários */}
      {Array.isArray(med.horarios) && med.horarios.length > 0 && (
        <View style={S.horasRow}>
          {med.horarios.map((h, i) => (
            <View key={i} style={S.horaChip}>
              <Feather name="clock" size={9} color={cor} />
              <Text style={[S.horaChipText, { color: cor }]}>{h}</Text>
            </View>
          ))}
        </View>
      )}
    </TouchableOpacity>
  );
};

// ─── Modal de detalhes ────────────────────────────────────────────────────────
const MedDetailModal = ({ med, visible, onClose, onEdit, onDelete }) => {
  if (!med) return null;
  const index = 0;
  const cor = '#1D6B78';
  const bg  = '#C8EDF2';
  const icone = tipoIcone(med.tipo);

  const linhas = [
    med.principio   && { label: 'Princípio ativo', valor: med.principio },
    med.dose        && { label: 'Dosagem',          valor: `${med.dose}${med.unidade ? ' ' + med.unidade : ''}` },
    med.tipo        && { label: 'Forma',             valor: med.tipo },
    med.via         && { label: 'Via',               valor: med.via },
    med.observacoes && { label: 'Observações',       valor: med.observacoes },
    med.estoque != null && med.estoque !== '' && { label: 'Estoque', valor: `${med.estoque} unidades` },
  ].filter(Boolean);

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <TouchableOpacity style={S.modalOverlay} activeOpacity={1} onPress={onClose}>
        <TouchableOpacity activeOpacity={1} style={S.modalSheet}>
          {/* Alça */}
          <View style={S.modalHandle} />

          {/* Header do modal */}
          <View style={S.modalHeader}>
            <View style={[S.modalIconWrap, { backgroundColor: bg }]}>
              <Feather name={icone} size={22} color={cor} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={S.modalNome}>{med.nome}</Text>
              {med.principio ? (
                <Text style={S.modalPrincipio}>{med.principio}</Text>
              ) : null}
            </View>
            <TouchableOpacity onPress={onClose} hitSlop={10}>
              <Feather name="x" size={20} color="#9AAFB3" />
            </TouchableOpacity>
          </View>

          {/* Horários */}
          {Array.isArray(med.horarios) && med.horarios.length > 0 && (
            <View style={S.modalHorasRow}>
              {med.horarios.map((h, i) => (
                <View key={i} style={S.modalHoraChip}>
                  <Feather name="clock" size={10} color={cor} />
                  <Text style={[S.modalHoraChipText, { color: cor }]}>{h}</Text>
                </View>
              ))}
            </View>
          )}

          {/* Linhas de detalhe */}
          {linhas.map((l, i) => (
            <View key={i} style={S.modalLinha}>
              <Text style={S.modalLinhaLabel}>{l.label}</Text>
              <Text style={S.modalLinhaValor}>{l.valor}</Text>
            </View>
          ))}

          {/* Ações */}
          <View style={S.modalAcoes}>
            <TouchableOpacity style={S.modalBtnEdit} onPress={onEdit}>
              <Feather name="edit-2" size={15} color="#1D6B78" />
              <Text style={S.modalBtnEditText}>Editar</Text>
            </TouchableOpacity>
            <TouchableOpacity style={S.modalBtnDelete} onPress={onDelete}>
              <Feather name="trash-2" size={15} color="#E06060" />
              <Text style={S.modalBtnDeleteText}>Excluir</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  );
};

// ─── Tela principal ───────────────────────────────────────────────────────────
const MedicamentosScreen = () => {
  const navigation = useNavigation();
  const { user }   = useAuth();

  const [perfilId,   setPerfilId]   = useState(null);
  const [perfilNome, setPerfilNome] = useState('');
  const [meds,       setMeds]       = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [medModal,   setMedModal]   = useState(null);

  // ── Carga de dados ───────────────────────────────────────────────────────
  useFocusEffect(
    useCallback(() => {
      const carregar = async () => {
        setLoading(true);
        try {
          const id   = await AsyncStorage.getItem('perfilId');
          const nome = await AsyncStorage.getItem('perfilNome');
          setPerfilId(id ?? null);
          setPerfilNome(nome ?? '');

          if (id) {
            const lista = await listarMedicamentos(id);
            setMeds(lista);
          }
        } catch {
          Alert.alert('Erro', 'Não foi possível carregar os medicamentos.');
        } finally {
          setLoading(false);
        }
      };
      carregar();
    }, [])
  );

  // ── Excluir ─────────────────────────────────────────────────────────────
  const handleDelete = (med) => {
    Alert.alert(
      'Excluir medicamento',
      `"${med.nome}" será removido permanentemente.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Excluir',
          style: 'destructive',
          onPress: async () => {
            try {
              await removerMedicamento(med.id);
              await cancelAlarmsForMedication(med.id);
              setMeds((prev) => prev.filter((m) => m.id !== med.id));
            } catch {
              Alert.alert('Erro', 'Não foi possível excluir o medicamento.');
            }
          },
        },
      ]
    );
  };

  // ── Editar ──────────────────────────────────────────────────────────────
  const handleEdit = (med) => {
    navigation.navigate('AddMedScreen', { medicamento: med, perfilId, perfilNome });
  };

  // ── Render ───────────────────────────────────────────────────────────────
  return (
    <SafeAreaView style={S.container} edges={['top']}>

      {/* Header */}
      <View style={S.header}>
        <View>
          <Text style={S.headerTitle}>Medicamentos</Text>
          <Text style={S.headerSub} numberOfLines={1}>
            {perfilNome || 'Perfil ativo'}
          </Text>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={S.scroll}
        showsVerticalScrollIndicator={false}
      >
        <Text style={S.instrucao}>
          {loading
            ? ''
            : meds.length === 0
            ? 'Nenhum medicamento cadastrado ainda.'
            : `${meds.length} medicamento${meds.length > 1 ? 's' : ''} cadastrado${meds.length > 1 ? 's' : ''}.`}
        </Text>

        {/* Lista */}
        {!loading && meds.map((med, i) => (
          <MedCard
            key={med.id}
            med={med}
            index={i}
            onPress={() => setMedModal(med)}
            onEdit={() => handleEdit(med)}
            onDelete={() => handleDelete(med)}
          />
        ))}

        {/* Card inline: adicionar */}
        {!loading && (
          <TouchableOpacity
            style={S.addCard}
            onPress={() =>
              perfilId
                ? navigation.navigate('AddMedScreen', { perfilId, perfilNome })
                : Alert.alert('Atenção', 'Selecione um perfil primeiro.')
            }
            activeOpacity={0.7}
          >
            <View style={S.addCardIconWrap}>
              <Feather name="plus" size={20} color="#1D6B78" />
            </View>
            <Text style={S.addCardText}>Adicionar medicamento</Text>
          </TouchableOpacity>
        )}

        <View style={{ height: 100 }} />
      </ScrollView>

      <MedDetailModal
        med={medModal}
        visible={!!medModal}
        onClose={() => setMedModal(null)}
        onEdit={() => { setMedModal(null); handleEdit(medModal); }}
        onDelete={() => { setMedModal(null); handleDelete(medModal); }}
      />

      <FooterNavigation />
    </SafeAreaView>
  );
};

// ─── Estilos ─────────────────────────────────────────────────────────────────
const S = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F0F4F8' },

  header: {
    backgroundColor: '#1D6B78',
    paddingHorizontal: 18,
    paddingTop: 12,
    paddingBottom: 18,
  },
  headerTitle: { fontSize: 22, fontWeight: 'bold', color: '#fff' },
  headerSub:   { fontSize: 12, color: 'rgba(255,255,255,0.6)', marginTop: 2 },

  scroll: { paddingHorizontal: 16, paddingTop: 16 },

  instrucao: {
    fontSize: 13,
    color: '#7AABB5',
    marginBottom: 14,
  },

  // Card de medicamento
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
  },
  cardRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  cardIcon: {
    width: 46,
    height: 46,
    borderRadius: 13,
    justifyContent: 'center',
    alignItems: 'center',
    flexShrink: 0,
  },
  cardInfo: { flex: 1 },
  cardNome:      { fontSize: 15, fontWeight: '700', color: '#1A3A40', marginBottom: 1 },
  cardPrincipio: { fontSize: 11, color: '#1D6B78', fontWeight: '500', marginBottom: 2 },
  cardSub:       { fontSize: 12, color: '#7AABB5' },

  tipoBadge: {
    alignSelf: 'flex-start',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 2,
    marginTop: 5,
  },
  tipoBadgeText: { fontSize: 10, fontWeight: '600' },

  acoes: {
    flexDirection: 'column',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'flex-start',
    marginTop: 2,
  },
  deleteBtn: {
    padding: 6,
    backgroundColor: '#FFF0F0',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#F4C5C5',
  },
  editBtn: {
    padding: 6,
    backgroundColor: '#F0F7F9',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#D5E8EA',
  },

  // Chips de horário
  horasRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 0.5,
    borderTopColor: '#E8F0F2',
  },
  horaChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#F7FBFC',
    borderRadius: 20,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderWidth: 0.5,
    borderColor: '#D5E8EA',
  },
  horaChipText: { fontSize: 11, fontWeight: '600' },

  // ── Modal de detalhes ──────────────────────────────────────────────────────
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    paddingBottom: 32,
    gap: 12,
  },
  modalHandle: {
    width: 40,
    height: 4,
    backgroundColor: '#D5E8EA',
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 4,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    marginBottom: 4,
  },
  modalIconWrap: {
    width: 52,
    height: 52,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalNome:      { fontSize: 17, fontWeight: '800', color: '#1A3A40' },
  modalPrincipio: { fontSize: 12, color: '#1D6B78', fontWeight: '500', marginTop: 2 },
  modalHorasRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 4,
  },
  modalHoraChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#EAF5F7',
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  modalHoraChipText: { fontSize: 12, fontWeight: '600' },
  modalLinha: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 0.5,
    borderBottomColor: '#EAF5F7',
  },
  modalLinhaLabel: { fontSize: 12, color: '#9AAFB3', fontWeight: '600' },
  modalLinhaValor: { fontSize: 13, color: '#1A3A40', fontWeight: '600', maxWidth: '60%', textAlign: 'right' },
  modalAcoes: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 8,
  },
  modalBtnEdit: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    backgroundColor: '#EAF5F7',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#C8EDF2',
  },
  modalBtnEditText: { fontSize: 14, fontWeight: '700', color: '#1D6B78' },
  modalBtnDelete: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    backgroundColor: '#FFF0F0',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#F4C5C5',
  },
  modalBtnDeleteText: { fontSize: 14, fontWeight: '700', color: '#E06060' },

  // Card inline: adicionar
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

export default MedicamentosScreen;
