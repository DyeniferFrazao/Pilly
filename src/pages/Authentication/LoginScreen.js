import React, { useState } from 'react';
import { View, Image, Text, Switch, Alert, ActivityIndicator } from 'react-native';
import InputComponent from '../../components/InputComponent';
import PrimaryButton from '../../components/PrimaryButton';
import TransparentButton from '../../components/TransparentButton';
import loginstyle from '../../style/stylelogin';
import { login } from '../../services/authService';

const LoginScreen = ({ navigation }) => {
  const [isRememberMe, setIsRememberMe] = useState(false);
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [loading, setLoading] = useState(false);

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
    <View style={loginstyle.container}>
      <Image source={require('../../../assets/icons/icon.png')} style={loginstyle.icon} />

      <InputComponent
        placeholder="E-mail"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
        style={{ width: 312, height: 47, marginBottom: 15 }}
      />
      <InputComponent
        placeholder="Senha"
        secureTextEntry
        value={senha}
        onChangeText={setSenha}
        style={{ width: 312, height: 47, marginBottom: 9 }}
      />

      <View style={loginstyle.switchContainer}>
        <Switch
          value={isRememberMe}
          onValueChange={setIsRememberMe}
          style={{ marginRight: 10 }}
        />
        <Text style={loginstyle.switchLabelText}>Manter conectado</Text>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color="#60A2AE" style={{ marginVertical: 10 }} />
      ) : (
        <PrimaryButton title="Acessar" onPress={handleLogin} textStyle={loginstyle.primaryButtonText} />
      )}

      <View style={loginstyle.footer}>
        <View style={loginstyle.TransparentButtonContainer}>
          <TransparentButton
            title="Criar conta"
            onPress={() => navigation.navigate('SignUp')}
            textStyle={loginstyle.secondaryButtonText}
          />
        </View>
      </View>
    </View>
  );
};

export default LoginScreen;
