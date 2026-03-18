import React, { useState, useEffect } from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Feather, AntDesign } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';

const FooterNavigation = () => {
  const navigation = useNavigation();
  const [token, setToken] = useState(null);
  const [profileId, setProfileId] = useState(null);

  // Função para pegar os dados do AsyncStorage
  const getTokenAndProfileId = async () => {
    const storedToken = await AsyncStorage.getItem('token');
    const storedProfileId = await AsyncStorage.getItem('profileId');
    setToken(storedToken);
    setProfileId(storedProfileId);
  };

  useEffect(() => {
    getTokenAndProfileId(); // Carrega os dados do AsyncStorage ao montar o componente
  }, []);

  const handleNavigation = async () => {
    if (token && profileId) {
      navigation.navigate('Home', { token, profileId });
    } else {
      if (profileId == null) {
        console.error("Selecione um Perfil");
      }}
  };

  return (
    <View style={styles.footer}>
      <TouchableOpacity onPress={handleNavigation}>
        <Feather name="home" size={24} color="white" />
      </TouchableOpacity>
      <TouchableOpacity onPress={() => navigation.navigate('Map')}>
        <Feather name="map-pin" size={24} color="white" />
      </TouchableOpacity>
      <TouchableOpacity
        style={styles.addButton}
        onPress={() => navigation.navigate('AddMedScreen', { token, profileId })}>
        <AntDesign name="plus" size={36} color="white" />
      </TouchableOpacity>
      <TouchableOpacity onPress={() => navigation.navigate('User', { token, profileId })}>
        <Feather name="user" size={24} color="white" />
      </TouchableOpacity>
      <TouchableOpacity onPress={() => navigation.navigate('Setting', { token, profileId })}>
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
