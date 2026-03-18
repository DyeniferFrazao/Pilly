import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, Image, Alert } from 'react-native';
import stylehome from '../../style/stylehome'; 
import Card from '../../components/Card'; 
import FooterNavigation from '../../components/FooterNavigation'; 
import ModalComponent from '../../components/ModalComponent'; 

import { useFocusEffect } from '@react-navigation/native'; 
import AsyncStorage from '@react-native-async-storage/async-storage';

const HomeScreen = ({ navigation, route }) => {
  const [token, setToken] = useState(null);
  const [profileId, setProfileId] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedMedication, setSelectedMedication] = useState(null);
  const [medications, setMedications] = useState([]);

  // Função para buscar os medicamentos da API
  const fetchMedications = async () => {
    const apiIp = await AsyncStorage.getItem('apiIp');
    try {
      const response = await fetch('https://' + apiIp + '/medicamento/list', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          'Active-Profile': profileId, 
        },
      });

      if (response.ok) {
        const data = await response.json(); 
        setMedications(data); 
      } else {
        const errorMessage = await response.text();
        console.error('Erro ao buscar medicamentos:', errorMessage);
        Alert.alert('Erro', `Erro ao buscar medicamentos: ${errorMessage}`);
      }
    } catch (error) {
      console.error('Erro ao buscar medicamentos:', error);
      Alert.alert('Erro', 'Não foi possível carregar os medicamentos.');
    }
  };

  // Lê os dados do AsyncStorage ao entrar na tela
  useFocusEffect(
    React.useCallback(() => {
      const getTokenAndProfileId = async () => {
        const storedToken = await AsyncStorage.getItem('token');
        const storedProfileId = await AsyncStorage.getItem('profileId');
        if (storedToken && storedProfileId) {
          setToken(storedToken);
          setProfileId(storedProfileId);
        }
      };

      // Se os parâmetros da navegação estiverem disponíveis, use-os
      if (route.params) {
        const { token, profileId } = route.params;
        setToken(token);
        setProfileId(profileId);
      } else {
        // Se não, busca do AsyncStorage
        getTokenAndProfileId();
      }
    }, [route.params])
  );

  // Carrega os medicamentos assim que token e profileId são encontrados
  useEffect(() => {
    if (token && profileId) {
      fetchMedications();
    }
  }, [token, profileId]);

  const handleDelete = (id) => {
    setMedications(prevMedications => prevMedications.filter(med => med.id !== id));
    setModalVisible(false); 
  };

  return (
    <View style={stylehome.container}>
      <View style={{ height: 30 }} />
      <View style={stylehome.header}>
        <Text style={stylehome.headerText}>Medicamentos</Text>
      </View>

      <ScrollView contentContainerStyle={stylehome.scrollContent}>
        {medications.length > 0 ? (
          medications.map((medication) => (
            <Card key={medication.id} onPress={() => {
              setSelectedMedication(medication);
              setModalVisible(true);
            }}>
              <View style={stylehome.cardContent}>
                <Image
                  source={require('../../../assets/icons/capsula.png')}
                  style={stylehome.cardImage}
                />
                <View style={stylehome.cardTextContainer}>
                  <Text style={stylehome.cardTitle}>{medication.nome || 'Nome não disponível'}</Text>
                  <Text style={stylehome.cardDescription}>
                    {medication.descricao || 'Descrição não disponível'}
                  </Text>
                </View>
              </View>
              <Text style={stylehome.cardDetails}>
                • Dosagem: <Text style={stylehome.highlight}>{medication.dosagem || 'Não disponível'}</Text>
              </Text>
              <Text style={stylehome.cardDetails}>
                • Quantidade disponível: <Text style={stylehome.highlight}>{medication.quantidade || '0'}</Text>
              </Text>
            </Card>
          ))
        ) : (
          <Text style={stylehome.emptyListText}>Nenhum medicamento encontrado.</Text>
        )}
      </ScrollView>

      <FooterNavigation token={token} profileId={profileId} />

      {selectedMedication && (
        <ModalComponent
          visible={modalVisible}
          medication={selectedMedication}
          onClose={() => setModalVisible(false)}
          navigation={navigation}
          onDelete={handleDelete} 
        />
      )}
    </View>
  );
};

export default HomeScreen;
