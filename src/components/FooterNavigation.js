import React, { useState, useEffect } from 'react';
import { View, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { Feather, AntDesign } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';

const FooterNavigation = () => {
  const navigation = useNavigation();
  const [perfilId, setPerfilId] = useState(null);
  const [perfilNome, setPerfilNome] = useState('');

  const carregarPerfilAtivo = async () => {
    const storedId = await AsyncStorage.getItem('perfilId');
    const storedNome = await AsyncStorage.getItem('perfilNome');
    setPerfilId(storedId);
    setPerfilNome(storedNome ?? '');
  };

  useEffect(() => {
    carregarPerfilAtivo();
  }, []);

  // Recarrega sempre que a tela em que o footer está volta a ter foco
  useFocusEffect(
    React.useCallback(() => {
      carregarPerfilAtivo();
    }, [])
  );

  const exigirPerfil = (acao) => {
    if (!perfilId) {
      Alert.alert(
        'Selecione um perfil',
        'Escolha um perfil antes de continuar.',
        [{ text: 'Ok', onPress: () => navigation.navigate('User') }]
      );
      return false;
    }
    acao();
    return true;
  };

  const irParaHome = () =>
    exigirPerfil(() =>
      navigation.navigate('Home', { perfilId, perfilNome })
    );

  const irParaAddMed = () =>
    exigirPerfil(() =>
      navigation.navigate('AddMedScreen', { perfilId, perfilNome })
    );

  return (
    <View style={styles.footer}>
      <TouchableOpacity onPress={irParaHome} accessibilityLabel="Início">
        <Feather name="home" size={24} color="white" />
      </TouchableOpacity>
      <TouchableOpacity onPress={() => navigation.navigate('Map')} accessibilityLabel="Mapa">
        <Feather name="map-pin" size={24} color="white" />
      </TouchableOpacity>
      <TouchableOpacity
        style={styles.addButton}
        onPress={irParaAddMed}
        accessibilityLabel="Adicionar medicamento"
      >
        <AntDesign name="plus" size={36} color="white" />
      </TouchableOpacity>
      <TouchableOpacity
        onPress={() => navigation.navigate('User')}
        accessibilityLabel="Perfis"
      >
        <Feather name="user" size={24} color="white" />
      </TouchableOpacity>
      <TouchableOpacity
        onPress={() => navigation.navigate('Setting', { perfilId, perfilNome })}
        accessibilityLabel="Configurações"
      >
        <Feather name="settings" size={24} color="white" />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  footer: {
    width: '100%',
    height: 69,
    backgroundColor: '#8D989C',
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    position: 'absolute',
    bottom: 0,
    paddingHorizontal: 10,
  },
  addButton: {
    width: 73,
    height: 73,
    backgroundColor: '#2E7D8A',
    borderRadius: 36.5,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
    marginTop: -30,
  },
});

export default FooterNavigation;
