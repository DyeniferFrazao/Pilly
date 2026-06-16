import React, { useState } from 'react';
import { View, Image, Switch, Text, Alert, ActivityIndicator } from 'react-native';
import InputComponent from '../../components/InputComponent';
import PrimaryButton from '../../components/PrimaryButton';
import TransparentButton from '../../components/TransparentButton';
import styles from '../../style/stylesignup';
import { cadastrar } from '../../services/authService';

const SignUpScreen = ({ navigation }) => {
  const [isChecked, setChecked] = useState(false);
  const [nome, setNome] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [confirmSenha, setConfirmSenha] = useState('');
  const [loading, setLoading] = useState(false);

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
    <View style={styles.container}>
      <Image source={require('../../../assets/icons/icon.png')} style={styles.icon} />

      <InputComponent
        placeholder="Nome completo"
        value={nome}
        onChangeText={setNome}
        style={{ marginBottom: 15 }}
        width={312}
      />
      <InputComponent
        placeholder="Nome de usuário (sem espaços)"
        autoCapitalize="none"
        value={username}
        onChangeText={setUsername}
        style={{ marginBottom: 15 }}
        width={312}
      />
      <InputComponent
        placeholder="E-mail"
        keyboardType="email-address"
        autoCapitalize="none"
        value={email}
        onChangeText={setEmail}
        style={{ marginBottom: 15 }}
        width={312}
      />
      <InputComponent
        placeholder="Senha"
        secureTextEntry
        value={senha}
        onChangeText={setSenha}
        style={{ marginBottom: 15 }}
        width={312}
      />
      <InputComponent
        placeholder="Confirmar senha"
        secureTextEntry
        value={confirmSenha}
        onChangeText={setConfirmSenha}
        style={{ marginBottom: 15 }}
        width={312}
      />

      <View style={styles.switchContainer}>
        <Switch value={isChecked} onValueChange={setChecked} style={styles.switch} />
        <Text style={styles.switchLabelText}>Eu aceito os termos de uso</Text>
      </View>

      <View style={styles.primaryButtonContainer}>
        {loading ? (
          <ActivityIndicator size="large" color="#60A2AE" />
        ) : (
          <PrimaryButton title="Confirmar" onPress={handleCreateAccount} />
        )}
      </View>

      <View style={styles.transparentButtonContainer}>
        <TransparentButton
          title="Já tenho uma conta"
          onPress={() => navigation.navigate('Login')}
        />
      </View>
    </View>
  );
};

export default SignUpScreen;
