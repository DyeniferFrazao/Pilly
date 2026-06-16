import React, { useState } from 'react';
import {
  View, Image, Text, Switch, Alert,
  ActivityIndicator, TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform,
} from 'react-native';
import InputComponent from '../../components/InputComponent';
import { login } from '../../services/authService';

const TEAL      = '#1D6B78';
const TEAL_SOFT = '#60A2AE';

const LoginScreen = ({ navigation }) => {
  const [isRememberMe, setIsRememberMe] = useState(false);
  const [email,        setEmail]        = useState('');
  const [senha,        setSenha]        = useState('');
  const [loading,      setLoading]      = useState(false);

  const handleLogin = async () => {
    if (!email.trim() || !senha.trim()) {
      Alert.alert('Atenção', 'Preencha e-mail e senha para continuar.');
      return;
    }
    setLoading(true);
    try {
      await login(email.trim(), senha);
      // AuthContext detecta a sessão e StackNavigator redireciona automaticamente
    } catch (error) {
      Alert.alert('Erro ao entrar', error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={S.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <Image source={require('../../../assets/icons/icon.png')} style={S.icon} />

      <InputComponent
        placeholder="E-mail"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
        width={312}
        height={47}
        marginVertical={8}
      />
      <InputComponent
        placeholder="Senha"
        secureTextEntry
        value={senha}
        onChangeText={setSenha}
        width={312}
        height={47}
        marginVertical={8}
      />

      <View style={S.switchRow}>
        <Switch
          value={isRememberMe}
          onValueChange={setIsRememberMe}
          trackColor={{ false: '#D5E8EA', true: '#A8D5DC' }}
          thumbColor={isRememberMe ? TEAL : '#B0C4C8'}
        />
        <Text style={S.switchLabel}>Manter conectado</Text>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color={TEAL_SOFT} style={{ marginVertical: 16 }} />
      ) : (
        <TouchableOpacity style={S.btnPrimary} onPress={handleLogin} activeOpacity={0.85}>
          <Text style={S.btnPrimaryText}>Acessar</Text>
        </TouchableOpacity>
      )}

      <TouchableOpacity
        style={S.btnTransparent}
        onPress={() => navigation.navigate('SignUp')}
        activeOpacity={0.7}
      >
        <Text style={S.btnTransparentText}>Criar conta</Text>
      </TouchableOpacity>
    </KeyboardAvoidingView>
  );
};

const S = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F0F4F8',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  icon: {
    width: 90,
    height: 90,
    resizeMode: 'contain',
    marginBottom: 32,
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginVertical: 12,
    alignSelf: 'flex-start',
    marginLeft: 24,
  },
  switchLabel: { fontSize: 13, color: '#4A6B70' },
  btnPrimary: {
    width: 312,
    height: 48,
    backgroundColor: TEAL,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 4,
    elevation: 3,
  },
  btnPrimaryText: { color: '#fff', fontSize: 15, fontWeight: '700' },
  btnTransparent: {
    marginTop: 16,
    paddingVertical: 10,
    paddingHorizontal: 20,
  },
  btnTransparentText: { fontSize: 14, color: TEAL_SOFT, fontWeight: '600' },
});

export default LoginScreen;
