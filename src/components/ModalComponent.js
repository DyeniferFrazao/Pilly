import React, { useState, useEffect } from 'react';
import { View, Text, Modal, TouchableOpacity, TouchableWithoutFeedback, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const ModalComponent = ({ visible, medication, onClose, navigation, onDelete, route }) => {
  const [medicationDetails, setMedicationDetails] = useState(null);
  const [token, setToken] = useState(null);
  const [profileId, setProfileId] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const getTokenAndProfileId = async () => {
      try {
        const storedToken = await AsyncStorage.getItem('token');
        const storedProfileId = await AsyncStorage.getItem('profileId');
        if (storedToken && storedProfileId) {
          setToken(storedToken);
          setProfileId(storedProfileId);
        }
      } catch (error) {
        console.error('Erro ao buscar dados do AsyncStorage:', error);
      }
    };

    // Verifica parâmetros da navegação
    if (route?.params) {
      const { token: navToken, profileId: navProfileId } = route.params;
      setToken(navToken);
      setProfileId(navProfileId);
    } else {
      // Caso não haja parâmetros, busca do AsyncStorage
      getTokenAndProfileId();
    }
  }, [route?.params]);

  const fetchMedicationDetails = async (medId) => {
    setIsLoading(true); // Inicia o carregamento
    const apiIp = await AsyncStorage.getItem('apiIp');
    try {
      const response = await fetch('https://'+ apiIp +`/medicamento/getbyid/${medId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          'Active-Profile': profileId,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setMedicationDetails(data);
      }
    } catch (error) {
      console.error('Erro ao buscar os detalhes do medicamento:', error.message);
      Alert.alert('Erro', 'Não foi possível carregar os detalhes do medicamento.');
    } finally {
      setIsLoading(false); // Finaliza o carregamento
    }
  };

  useEffect(() => {
    if (visible && medication?.id && token && profileId) {
      fetchMedicationDetails(medication.id);
    }
  }, [visible, medication, token, profileId]);

  const deleteMedication = async (medId) => {
    const apiIp = await AsyncStorage.getItem('apiIp');
    try {
      const response = await fetch('https://'+ apiIp +`/medicamento/deletebyid/${medId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          'Active-Profile': profileId,
        },
      });

      if (response.ok) {
        navigation.navigate('Home', { refresh: true });
        Alert.alert('Sucesso', 'Medicamento excluído com sucesso.');
        onClose();
      } else {
        Alert.alert('Erro', 'Não foi possível excluir o medicamento.');
      }
    } catch (error) {
      console.error('Erro ao excluir o medicamento:', error.message);
      Alert.alert('Erro', 'Não foi possível excluir o medicamento.');
    }
  };

  return (
    <Modal
      transparent
      visible={visible}
      animationType="slide"
      onRequestClose={onClose}
    >
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.modalContainer}>
          <TouchableWithoutFeedback>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Detalhes</Text>
              <Text style={styles.modalMedicationName}>{medication?.name}</Text>
              <Text style={styles.modalDescription}>{medication?.description}</Text>

              {isLoading ? (
                <Text>Carregando detalhes do medicamento...</Text>
              ) : (
                medicationDetails ? (
                  <>
                    <Text style={styles.modalDetails}>
                      Nome: <Text style={styles.highlight}>{medicationDetails?.nome || 'Não informado'}</Text>
                    </Text>
                    <Text style={styles.modalDetails}>
                      Quantidade: <Text style={styles.highlight}>{`${medicationDetails.quantidade}`}</Text>
                    </Text>
                    <Text style={styles.modalDetails}>
                      Descrição: <Text style={styles.highlight}>{medicationDetails.descricao}</Text>
                    </Text>
                  </>
                ) : (
                  <Text>Detalhes do medicamento não disponíveis.</Text>
                )
              )}

              <View style={styles.centerContent}>
                <TouchableOpacity
                  style={styles.secondaryButton}
                  onPress={() =>
                    Alert.alert(
                      'Confirmar exclusão',
                      'Tem certeza que deseja excluir este medicamento?',
                      [
                        { text: 'Cancelar', style: 'cancel' },
                        { text: 'Excluir', style: 'destructive', onPress: () => deleteMedication(medication.id) },
                      ]
                    )
                  }
                >
                  <Text style={styles.secondaryButtonText}>Excluir</Text>
                </TouchableOpacity>
              </View>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
};

const styles = {
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    width: '85%',
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  modalTitle: {
    fontSize: 25,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 10,
    textAlign: 'center',  // Centraliza o título
  },
  modalMedicationName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000',
    textAlign: 'center', // Nome do medicamento centralizado
    marginBottom: 5,
  },
  modalDescription: {
    fontSize: 14,
    color: '#000',
    marginBottom: 15,
    fontWeight: 'bold',
    textAlign: 'center', // Descrição centralizada
    marginTop: -50, // Movimenta a descrição um pouco para cima
  },
  modalDetails: {
    fontSize: 14,
    color: '#000',
    marginBottom: 5,
    fontWeight: 'bold',
  },
  highlight: {
    fontWeight: 'bold',
    color: '#C25B8C',
  },
  centerContent: {
    alignItems: 'center',
    marginBottom: 10,
  },
  secondaryButton: {
    width: 187,
    height: 45,
    borderWidth: 1,
    borderColor: '#62A4B0',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 10,
    marginBottom: 10,
    marginTop: 20,
  },
  secondaryButtonText: {
    color: '#62A4B0',
    fontSize: 16,
    fontWeight: 'bold',
  },
};

export default ModalComponent;
