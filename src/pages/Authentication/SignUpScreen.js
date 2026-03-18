import React, { useState } from 'react';
import { View, Image, Switch, Text, Alert } from 'react-native';
import InputComponent from '../../components/InputComponent';
import PrimaryButton from '../../components/PrimaryButton';
import TransparentButton from '../../components/TransparentButton';
import styles from '../../style/stylesignup';


const SignUpScreen = ({ navigation }) => {
  const [isChecked, setChecked] = useState(false);
  const [name, setname] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const toggleSwitch = () => setChecked((previousState) => !previousState);

  const handleCreateAccount = async () => {
    const apiIp = await AsyncStorage.getItem('apiIp');
    if (!name || !phone || !email || !password || !confirmPassword) {
      Alert.alert("Erro", "Por favor, preencha todos os campos.");
      return;
    }
    if (password !== confirmPassword) {
      Alert.alert("Erro", "As senhas não coincidem.");
      return;
    }
    if (!isChecked) {
      Alert.alert("Erro", "Você precisa aceitar os termos de uso.");
      return;
    }
  
    try {
      const requestBody = {
        email: email,
        password: password,
        name: name,
      };
  
      const response = await fetch('https://'+ apiIp +'/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });
  
      if (response.ok) {
        try {
          const data = await response.json(); // Tenta interpretar como JSON
          Alert.alert("Sucesso", data?.message || "Conta criada com sucesso!");
        } catch (error) {
          // Caso a resposta seja vazia ou não seja JSON válido
          console.warn("A resposta não é um JSON válido ou está vazia.", error);
          Alert.alert("Sucesso", "Conta criada com sucesso!");
        }
        navigation.navigate('Login');
      } else {
        const errorData = await response.json() || String;
        Alert.alert("Erro", errorData?.message || "Ocorreu um erro ao criar a conta.");
      }
    } catch (error) {
      console.error("Erro ao criar conta:");
      Alert.alert("Erro ao criar conta");
    }
  };
  

  const navigateToLogin = () => {
    if (!isChecked) {
      Alert.alert("Erro", "Você precisa aceitar os termos de uso.");
      return;
    }
    navigation.navigate('Login');
  };

  return (
    <View style={styles.container}>
      <Image 
        source={require('../../../assets/icons/icon.png')} 
        style={styles.icon} 
      />
      
      <InputComponent 
        placeholder="Nome de Usuário" 
        value={name} 
        onChangeText={setname}
        style={{ marginBottom: 15 }}
        width={312} 
      />
      <InputComponent 
        placeholder="Telefone" 
        keyboardType="phone-pad" 
        value={phone} 
        onChangeText={setPhone}
        style={{ marginBottom: 15 }}
        width={312} 
      />
      <InputComponent 
        placeholder="E-mail" 
        keyboardType="email-address" 
        value={email} 
        onChangeText={setEmail}
        style={{ marginBottom: 15 }}
        width={312} 
      />
      <InputComponent 
        placeholder="Senha" 
        secureTextEntry={true} 
        value={password} 
        onChangeText={setPassword}
        style={{ marginBottom: 15 }}
        width={312} 
      />
      <InputComponent 
        placeholder="Confirme a senha" 
        secureTextEntry={true} 
        value={confirmPassword} 
        onChangeText={setConfirmPassword}
        style={{ marginBottom: 15 }}
        width={312} 
      />
      
      <View style={styles.switchContainer}>
        <Switch 
          value={isChecked} 
          onValueChange={toggleSwitch} 
          style={styles.switch} 
        />
        <Text style={styles.switchLabelText}>Eu aceito os termos de uso</Text>
      </View>
      
      <View style={styles.primaryButtonContainer}>
        <PrimaryButton 
          title="Confirmar" 
          onPress={handleCreateAccount}
        />
      </View>
      
      <View style={styles.transparentButtonContainer}>
        <TransparentButton 
          title="Já tenho uma conta" 
          onPress={navigateToLogin}
        />
      </View>
    </View>
  );
};

export default SignUpScreen;
