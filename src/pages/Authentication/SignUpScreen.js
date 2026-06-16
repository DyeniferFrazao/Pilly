import React, { useState } from 'react';
import {
  View, Image, Switch, Text, Alert, ActivityIndicator,
  TouchableOpacity, StyleSheet, ScrollView, KeyboardAvoidingView, Platform,
} from 'react-native';
import InputComponent from '../../components/InputComponent';
import { cadastrar } from '../../services/authService';

const TEAL      = '#1D6B78';
const TEAL_SOFT = '#60A2AE';

const SignUpScreen = ({ navigation }) => {
  const [isChecked,    setChecked]    = useState(false);
  const [nome,         setNome]        = useState('');
  const [username,     setUsername]    = useState('');
  const [email,        setEmail]       = useState('');
  const [senha,        setSenha]       = useState('');
  const [confirmSenha, setConfirmSenha]= useState('');
  const [loading,      setLoading]     = useState(false);

  const handleCreateAccount = async () => {
    if (!nome || !username || !email || !senha || !confirmSenha) {
      Alert.alert('Atenção', 'Preencha todos os campos.');
      return;
    }
    if (username.includes(' ')) {
      Alert.alert('Atenção', 'O nome de usuário não pode conter espaços.');
      return;
    }
    if (senha !== confirmSenha) {
      Alert.alert('Atenção', 'As senhas não conferem.');
      return;
    }
    if (!isChecked) {
      Alert.alert('Atenção', 'Aceite os termos de uso para continuar.');
      return;
    }

    setLoading(true);
    try {
      await cadastrar(nome, username.trim().toLowerCase(), email.trim(), senha);
      Alert.alert('Conta criada!', 'Verifique seu e-mail para confirmar o cadastro.');
      navigation.navigate('Login');
    } catch (error) {
      Alert.alert('Erro ao cadastrar', error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: '#F0F4F8' }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={S.container}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <Image source={require('../../../assets/icons/icon.png')} style={S.icon} />

        <InputComponent placeholder="Nome completo"           value={nome}         onChangeText={setNome}         width={312} height={47} marginVertical={7} />
        <InputComponent placeholder="Nome de usuário"         value={username}     onChangeText={setUsername}     width={312} height={47} marginVertical={7} autoCapitalize="none" />
        <InputComponent placeholder="E-mail"                  value={email}        onChangeText={setEmail}        width={312} height={47} marginVertical={7} keyboardType="email-address" autoCapitalize="none" />
        <InputComponent placeholder="Senha"                   value={senha}        onChangeText={setSenha}        width={312} height={47} marginVertical={7} secureTextEntry />
        <InputComponent placeholder="Confirmar senha"         value={confirmSenha} onChangeText={setConfirmSenha} width={312} height={47} marginVertical={7} secureTextEntry />

        <View style={S.switchRow}>
          <Switch
            value={isChecked}
            onValueChange={setChecked}
            trackColor={{ false: '#D5E8EA', true: '#A8D5DC' }}
            thumbColor={isChecked ? TEAL : '#B0C4C8'}
          />
          <Text style={S.switchLabel}>Eu aceito os termos de uso</Text>
        </View>

        {loading ? (
          <ActivityIndicator size="large" color={TEAL_SOFT} style={{ marginVertical: 16 }} />
        ) : (
          <TouchableOpacity style={S.btnPrimary} onPress={handleCreateAccount} activeOpacity={0.85}>
            <Text style={S.btnPrimaryText}>Confirmar</Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity
          style={S.btnTransparent}
          onPress={() => navigation.navigate('Login')}
          activeOpacity={0.7}
        >
          <Text style={S.btnTransparentText}>Já tenho uma conta</Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const S = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 48,
    paddingHorizontal: 24,
  },
  icon: {
    width: 80,
    height: 80,
    resizeMode: 'contain',
    marginBottom: 24,
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginVertical: 14,
    alignSelf: 'flex-start',
    marginLeft: 4,
  },
  switchLabel: { fontSize: 13, color: '#4A6B70' },
  btnPrimary: {
    width: 312,
    height: 48,
    backgroundColor: TEAL,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
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

export default SignUpScreen;
