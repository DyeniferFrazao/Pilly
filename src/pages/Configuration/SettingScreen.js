import React from 'react';
import { View, Text, TouchableOpacity, Alert, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { supabase } from '../../lib/supabase';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from '../../contexts/AuthContext';
import FooterNavigation from '../../components/FooterNavigation';

// ─── Linha de opção ───────────────────────────────────────────────────────────
const OpcaoRow = ({ icon, label, sub, onPress, danger = false, rightIcon = 'chevron-right' }) => (
  <TouchableOpacity style={S.row} onPress={onPress} activeOpacity={0.7}>
    <View style={[S.rowIcon, danger && S.rowIconDanger]}>
      <Feather name={icon} size={18} color={danger ? '#A32D2D' : '#1D6B78'} />
    </View>
    <View style={S.rowInfo}>
      <Text style={[S.rowLabel, danger && { color: '#A32D2D' }]}>{label}</Text>
      {sub ? <Text style={S.rowSub}>{sub}</Text> : null}
    </View>
    <Feather name={rightIcon} size={16} color={danger ? '#A32D2D' : '#C0CACC'} />
  </TouchableOpacity>
);

const Separador = ({ label }) => (
  <Text style={S.separador}>{label}</Text>
);

// ─── Tela ─────────────────────────────────────────────────────────────────────
const SettingScreen = ({ navigation }) => {
  const { user } = useAuth();

  const handleLogout = () => {
    Alert.alert(
      'Sair da conta',
      'Você será desconectado e precisará fazer login novamente.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Sair',
          style: 'destructive',
          onPress: async () => {
            await AsyncStorage.multiRemove(['perfilId', 'perfilNome']);
            await supabase.auth.signOut();
          },
        },
      ]
    );
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      'Excluir conta',
      'Esta ação é permanente e apagará todos os seus dados. Tem certeza?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Excluir',
          style: 'destructive',
          onPress: () =>
            Alert.alert(
              'Conta excluída',
              'Para exclusão definitiva da conta, entre em contato com o suporte: suporte@pilly.app'
            ),
        },
      ]
    );
  };

  return (
    <SafeAreaView style={S.container} edges={['top']}>

      {/* Header */}
      <View style={S.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} hitSlop={8}>
          <Feather name="arrow-left" size={22} color="#fff" />
        </TouchableOpacity>
        <Text style={S.headerTitle}>Configurações</Text>
        <View style={{ width: 30 }} />
      </View>

      {/* Conta */}
      <View style={S.accountCard}>
        <View style={S.accountAvatar}>
          <Feather name="user" size={26} color="#1D6B78" />
        </View>
        <View style={{ flex: 1 }}>
          {/* Nome em destaque (topo) */}
          <Text style={S.accountNome} numberOfLines={1}>
            {user?.user_metadata?.nome || user?.email?.split('@')[0] || 'Usuário'}
          </Text>
          {/* @username abaixo, menor */}
          {user?.user_metadata?.username ? (
            <Text style={S.accountUsername}>@{user.user_metadata.username}</Text>
          ) : (
            <Text style={S.accountSub}>{user?.email ?? 'Conta Pilly'}</Text>
          )}
        </View>
      </View>

      <View style={S.body}>

        {/* Seção App */}
        <Separador label="Aplicativo" />
        <View style={S.section}>
          <OpcaoRow
            icon="bell"
            label="Notificações"
            sub="Configurar alertas e lembretes"
            onPress={() => navigation.navigate('Notification', {})}
          />
        </View>

        {/* Seção Conta */}
        <Separador label="Conta" />
        <View style={S.section}>
          <OpcaoRow
            icon="user"
            label="Dados da conta"
            sub="Nome, usuário, e-mail e segurança"
            onPress={() => navigation.navigate('UserSettings', {})}
          />
          <View style={S.divider} />
          <OpcaoRow
            icon="log-out"
            label="Sair da conta"
            onPress={handleLogout}
            rightIcon="arrow-right"
          />
        </View>

        {/* Zona de perigo */}
        <Separador label="Zona de perigo" />
        <View style={S.section}>
          <OpcaoRow
            icon="trash-2"
            label="Excluir conta"
            sub="Remove permanentemente todos os dados"
            onPress={handleDeleteAccount}
            danger
          />
        </View>

      </View>

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
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#fff',
  },

  accountCard: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginTop: 16,
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
  },
  accountAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#C8EDF2',
    justifyContent: 'center',
    alignItems: 'center',
  },
  accountNome:     { fontSize: 16, fontWeight: '700', color: '#1A3A40' },
  accountUsername: { fontSize: 12, fontWeight: '600', color: '#1D6B78', marginTop: 3 },
  accountSub:      { fontSize: 12, color: '#7AABB5', marginTop: 3 },

  body: { flex: 1, paddingHorizontal: 16, paddingTop: 8, paddingBottom: 90 },

  separador: {
    fontSize: 11,
    fontWeight: '700',
    color: '#7AABB5',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginTop: 20,
    marginBottom: 8,
    marginLeft: 4,
  },

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

  divider: {
    height: 0.5,
    backgroundColor: '#E8F0F2',
    marginLeft: 62,
  },
});

export default SettingScreen;
