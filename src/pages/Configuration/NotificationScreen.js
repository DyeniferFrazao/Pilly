import React, { useState, useEffect } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView,
  Switch, Modal, StyleSheet, Alert, Platform, Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import * as Notifications from 'expo-notifications';
import AsyncStorage from '@react-native-async-storage/async-storage';

const TEAL       = '#1D6B78';
const TEAL_LIGHT = '#C8EDF2';
const BG         = '#F0F4F8';
const WHITE      = '#FFFFFF';
const PREF_KEY   = '@pilly_notif_enabled';

const NotificationScreen = ({ navigation, route }) => {
  const alarms = route.params?.alarms ?? [];
  const [isEnabled,     setIsEnabled]     = useState(false);
  const [modalVisible,  setModalVisible]  = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(null);
  const [currentAlarms, setCurrentAlarms] = useState(alarms);

  // ── Carrega estado real na montagem ──────────────────────────
  useEffect(() => {
    (async () => {
      const saved = await AsyncStorage.getItem(PREF_KEY);
      const { status } = await Notifications.getPermissionsAsync();
      // Só marca como ativo se a preferência E a permissão do SO estão OK
      setIsEnabled(saved === 'true' && status === 'granted');
    })();
  }, []);

  // ── Toggle com request real de permissão ─────────────────────
  const toggleSwitch = async () => {
    if (!isEnabled) {
      // Tenta ativar — solicita permissão se necessário
      const { status } = await Notifications.requestPermissionsAsync();
      if (status === 'granted') {
        setIsEnabled(true);
        await AsyncStorage.setItem(PREF_KEY, 'true');
      } else {
        // Permissão negada — orienta o usuário a abrir Ajustes
        Alert.alert(
          'Permissão negada',
          'Para receber lembretes, acesse as configurações do seu dispositivo e ative as notificações para o Pilly.',
          [
            { text: 'Agora não', style: 'cancel' },
            {
              text: 'Abrir Ajustes',
              onPress: () =>
                Platform.OS === 'ios'
                  ? Linking.openURL('app-settings:')
                  : Linking.openSettings(),
            },
          ]
        );
      }
    } else {
      // Desativa (guarda preferência; não revoga permissão do SO)
      setIsEnabled(false);
      await AsyncStorage.setItem(PREF_KEY, 'false');
    }
  };

  const handleDelete = () => {
    if (selectedIndex !== null) {
      setCurrentAlarms((prev) => prev.filter((_, i) => i !== selectedIndex));
      setModalVisible(false);
      Alert.alert('Sucesso', 'Alarme excluído.');
    }
  };

  const handleOpenModal = (index) => {
    setSelectedIndex(index);
    setModalVisible(true);
  };

  return (
    <SafeAreaView style={S.safe} edges={['top']}>

      {/* ── Header ─────────────────────────────────────────── */}
      <View style={S.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} hitSlop={8}>
          <Feather name="arrow-left" size={22} color={WHITE} />
        </TouchableOpacity>
        <Text style={S.headerTitle}>Notificações</Text>
        <View style={{ width: 30 }} />
      </View>

      <ScrollView contentContainerStyle={S.body} showsVerticalScrollIndicator={false}>

        {/* ── Card de permissão ─────────────────────────────── */}
        <View style={S.permCard}>
          <View style={S.permIconWrap}>
            <Feather name="bell" size={22} color={TEAL} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={S.permLabel}>Permitir notificações</Text>
            <Text style={S.permSub}>
              {isEnabled
                ? 'Notificações ativas — você receberá lembretes de doses.'
                : 'Ative para receber lembretes dos seus medicamentos.'}
            </Text>
          </View>
          <Switch
            trackColor={{ false: '#D5E8EA', true: TEAL_LIGHT }}
            thumbColor={isEnabled ? TEAL : '#B0C4C8'}
            onValueChange={toggleSwitch}
            value={isEnabled}
          />
        </View>

        {/* ── Lista de alarmes ─────────────────────────────── */}
        <Text style={S.sectionLabel}>Próximos alarmes</Text>

        {!isEnabled ? (
          <View style={S.emptyCard}>
            <Feather name="bell-off" size={28} color="#B0C4C8" />
            <Text style={S.emptyText}>Notificações desativadas.</Text>
            <Text style={S.emptySubText}>Ative o interruptor acima para ver os alarmes.</Text>
          </View>
        ) : currentAlarms.length === 0 ? (
          <View style={S.emptyCard}>
            <Feather name="clock" size={28} color="#B0C4C8" />
            <Text style={S.emptyText}>Nenhum alarme configurado.</Text>
            <Text style={S.emptySubText}>Adicione medicamentos para criar lembretes automáticos.</Text>
          </View>
        ) : (
          currentAlarms.map((alarm, index) => (
            <TouchableOpacity
              key={index}
              style={S.alarmCard}
              onPress={() => handleOpenModal(index)}
              activeOpacity={0.8}
            >
              <View style={S.alarmIconWrap}>
                <Feather name="clock" size={18} color={TEAL} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={S.alarmText}>{alarm}</Text>
                <Text style={S.alarmSub}>Lembrete de medicamento</Text>
              </View>
              <Feather name="more-vertical" size={18} color="#B0C4C8" />
            </TouchableOpacity>
          ))
        )}

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* ── Modal de ação ────────────────────────────────────── */}
      <Modal
        animationType="slide"
        transparent
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <TouchableOpacity
          style={S.modalOverlay}
          activeOpacity={1}
          onPress={() => setModalVisible(false)}
        >
          <TouchableOpacity activeOpacity={1} style={S.modalSheet}>
            <View style={S.modalHandle} />
            <Text style={S.modalTitle}>Alarme selecionado</Text>
            {selectedIndex !== null && currentAlarms[selectedIndex] && (
              <View style={S.modalAlarmInfo}>
                <Feather name="clock" size={16} color={TEAL} />
                <Text style={S.modalAlarmText}>{currentAlarms[selectedIndex]}</Text>
              </View>
            )}
            <TouchableOpacity style={S.modalBtnDelete} onPress={handleDelete}>
              <Feather name="trash-2" size={16} color="#E06060" />
              <Text style={S.modalBtnDeleteText}>Excluir alarme</Text>
            </TouchableOpacity>
            <TouchableOpacity style={S.modalBtnCancel} onPress={() => setModalVisible(false)}>
              <Text style={S.modalBtnCancelText}>Cancelar</Text>
            </TouchableOpacity>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>

    </SafeAreaView>
  );
};

const S = StyleSheet.create({
  safe:    { flex: 1, backgroundColor: BG },

  // Header
  header: {
    backgroundColor: TEAL,
    paddingHorizontal: 18,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerTitle: { fontSize: 17, fontWeight: '700', color: WHITE },

  // Body
  body: { paddingHorizontal: 16, paddingTop: 20 },

  // Card de permissão
  permCard: {
    backgroundColor: WHITE,
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    borderWidth: 0.5,
    borderColor: '#D5E8EA',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
    marginBottom: 24,
  },
  permIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 13,
    backgroundColor: TEAL_LIGHT,
    justifyContent: 'center',
    alignItems: 'center',
  },
  permLabel: { fontSize: 14, fontWeight: '700', color: '#1A3A40' },
  permSub:   { fontSize: 11, color: '#7AABB5', marginTop: 2, maxWidth: 180 },

  // Section label
  sectionLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#7AABB5',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 10,
    marginLeft: 4,
  },

  // Cards de alarme
  alarmCard: {
    backgroundColor: WHITE,
    borderRadius: 14,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 10,
    borderWidth: 0.5,
    borderColor: '#D5E8EA',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  alarmIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: TEAL_LIGHT,
    justifyContent: 'center',
    alignItems: 'center',
  },
  alarmText: { fontSize: 14, fontWeight: '600', color: '#1A3A40' },
  alarmSub:  { fontSize: 11, color: '#7AABB5', marginTop: 2 },

  // Empty state
  emptyCard: {
    backgroundColor: WHITE,
    borderRadius: 16,
    padding: 30,
    alignItems: 'center',
    gap: 8,
    borderWidth: 0.5,
    borderColor: '#D5E8EA',
  },
  emptyText:    { fontSize: 14, fontWeight: '600', color: '#9AAFB3', marginTop: 6 },
  emptySubText: { fontSize: 12, color: '#B0C4C8', textAlign: 'center', maxWidth: 220 },

  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: WHITE,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    paddingBottom: 36,
    gap: 12,
  },
  modalHandle: {
    width: 40,
    height: 4,
    backgroundColor: '#D5E8EA',
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 8,
  },
  modalTitle: { fontSize: 16, fontWeight: '800', color: '#1A3A40', textAlign: 'center' },
  modalAlarmInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: TEAL_LIGHT,
    borderRadius: 12,
    padding: 12,
  },
  modalAlarmText: { fontSize: 14, fontWeight: '600', color: TEAL },
  modalBtnDelete: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    backgroundColor: '#FFF0F0',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#F4C5C5',
  },
  modalBtnDeleteText: { fontSize: 14, fontWeight: '700', color: '#E06060' },
  modalBtnCancel: {
    paddingVertical: 14,
    alignItems: 'center',
  },
  modalBtnCancelText: { fontSize: 14, fontWeight: '600', color: '#7AABB5' },
});

export default NotificationScreen;
