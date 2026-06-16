import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity, Alert, StyleSheet,
  ScrollView, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import { Feather } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';

// ─── Helpers ──────────────────────────────────────────────────────────────────
const iniciais = (email = '') => {
  const partes = email.split('@')[0].split(/[._-]/);
  return partes.slice(0, 2).map(p => p[0]?.toUpperCase() ?? '').join('');
};

const formatarData = (iso) => {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('pt-BR', {
    day: '2-digit', month: 'long', year: 'numeric',
  });
};

// ─── Linha de opção ───────────────────────────────────────────────────────────
const OpcaoRow = ({ icon, label, sub, onPress, danger = false }) => (
  <TouchableOpacity style={S.row} onPress={onPress} activeOpacity={0.7}>
    <View style={[S.rowIcon, danger && S.rowIconDanger]}>
      <Feather name={icon} size={18} color={danger ? '#A32D2D' : '#1D6B78'} />
    </View>
    <View style={S.rowInfo}>
      <Text style={[S.rowLabel, danger && { color: '#A32D2D' }]}>{label}</Text>
      {sub ? <Text style={S.rowSub}>{sub}</Text> : null}
    </View>
    <Feather name="chevron-right" size={16} color={danger ? '#A32D2D' : '#C0CACC'} />
  </TouchableOpacity>
);

// ─── Tela ─────────────────────────────────────────────────────────────────────
const UserSettings = ({ navigation }) => {
  const { user } = useAuth();
  const [sendingReset, setSendingReset] = useState(false);

  const email = user?.email ?? '';
  const criadoEm = formatarData(user?.created_at);

  // ── Alterar senha via e-mail ───────────────────────────────────────────────
  const handleResetPassword = async () => {
    if (!email) return;
    setSendingReset(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email);
      if (error) throw error;
      Alert.alert(
        'E-mail enviado',
        `Um link para redefinir a senha foi enviado para ${email}.`
      );
    } catch (err) {
      Alert.alert('Erro', err.message || 'Não foi possível enviar o e-mail.');
    } finally {
      setSendingReset(false);
    }
  };

  // ── Logout ─────────────────────────────────────────────────────────────────
  const handleLogout = () => {
    Alert.alert('Sair da conta', 'Deseja realmente sair?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Sair',
        style: 'destructive',
        onPress: async () => {
          await AsyncStorage.multiRemove(['perfilId', 'perfilNome']);
          await supabase.auth.signOut();
        },
      },
    ]);
  };

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <SafeAreaView style={S.container} edges={['top']}>

      {/* Header */}
      <View style={S.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} hitSlop={8}>
          <Feather name="arrow-left" size={22} color="#fff" />
        </TouchableOpacity>
        <Text style={S.headerTitle}>Minha Conta</Text>
        <View style={{ width: 30 }} />
      </View>

      <ScrollView
        contentContainerStyle={S.scroll}
        showsVerticalScrollIndicator={false}
      >

        {/* Avatar + email */}
        <View style={S.avatarSection}>
          <View style={S.avatarCircle}>
            <Text style={S.avatarText}>{iniciais(email)}</Text>
          </View>
          <Text style={S.emailText}>{email}</Text>
          <Text style={S.criadoText}>Conta criada em {criadoEm}</Text>
        </View>

        {/* Seção Segurança */}
        <Text style={S.secLabel}>Segurança</Text>
        <View style={S.section}>
          <OpcaoRow
            icon="lock"
            label="Alterar senha"
            sub="Receba um link no seu e-mail"
            onPress={handleResetPassword}
          />
          {sendingReset && (
            <View style={S.sending}>
              <ActivityIndicator size="small" color="#1D6B78" />
              <Text style={S.sendingText}>Enviando e-mail…</Text>
            </View>
          )}
        </View>

        {/* Seção Sessão */}
        <Text style={S.secLabel}>Sessão</Text>
        <View style={S.section}>
          <OpcaoRow
            icon="log-out"
            label="Sair da conta"
            sub="Você precisará fazer login novamente"
            onPress={handleLogout}
          />
        </View>

        {/* Seção Dados */}
        <Text style={S.secLabel}>Seus dados</Text>
        <View style={S.infoCard}>
          <InfoLine label="E-mail"         value={email} />
          <InfoLine label="ID da conta"    value={user?.id?.slice(0, 12) + '…'} />
          <InfoLine label="Membro desde"   value={criadoEm} />
        </View>

      </ScrollView>
    </SafeAreaView>
  );
};

// ─── Sub-componente de linha de info ──────────────────────────────────────────
const InfoLine = ({ label, value }) => (
  <View style={S.infoLine}>
    <Text style={S.infoLabel}>{label}</Text>
    <Text style={S.infoValue} numberOfLines={1}>{value}</Text>
  </View>
);

// ─── Estilos ──────────────────────────────────────────────────────────────────
const S = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F0F4F8' },

  header: {
    backgroundColor: '#1D6B78',
    paddingHorizontal: 18,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerTitle: { fontSize: 17, fontWeight: '700', color: '#fff' },

  scroll: { paddingHorizontal: 16, paddingBottom: 40 },

  // Avatar
  avatarSection: { alignItems: 'center', paddingVertical: 28 },
  avatarCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#C8EDF2',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  avatarText: { fontSize: 28, fontWeight: 'bold', color: '#1D6B78' },
  emailText:  { fontSize: 16, fontWeight: '600', color: '#1A3A40', marginBottom: 4 },
  criadoText: { fontSize: 12, color: '#7AABB5' },

  // Rótulo de seção
  secLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#7AABB5',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginTop: 20,
    marginBottom: 8,
    marginLeft: 4,
  },

  // Bloco de opções
  section: {
    backgroundColor: '#fff',
    borderRadius: 16,
    borderWidth: 0.5,
    borderColor: '#D5E8EA',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },

  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 13,
    gap: 12,
  },
  rowIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#EAF5F7',
    justifyContent: 'center',
    alignItems: 'center',
  },
  rowIconDanger: { backgroundColor: '#FCEBEB' },
  rowInfo: { flex: 1 },
  rowLabel: { fontSize: 14, fontWeight: '600', color: '#1A3A40' },
  rowSub:   { fontSize: 11, color: '#7AABB5', marginTop: 1 },

  sending: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  sendingText: { fontSize: 12, color: '#7AABB5' },

  // Card de informações
  infoCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    borderWidth: 0.5,
    borderColor: '#D5E8EA',
    padding: 16,
    gap: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  infoLine: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  infoLabel: { fontSize: 13, color: '#7AABB5' },
  infoValue: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1A3A40',
    maxWidth: '60%',
    textAlign: 'right',
  },
});

export default UserSettings;
