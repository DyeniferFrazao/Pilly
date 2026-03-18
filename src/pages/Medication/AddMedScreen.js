import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Modal, StyleSheet, Switch, Alert } from 'react-native';
import { Feather } from 'react-native-vector-icons';
import InputComponent from '../../components/InputComponent';
import TransparentButton from '../../components/TransparentButton';
import FooterNavigation from '../../components/FooterNavigation';
import styles from '../../style/styleaddmed';
import AsyncStorage from '@react-native-async-storage/async-storage';

const AddMedScreen = ({ route, navigation }) => {
  const { token, userId } = route.params;
  const [alarmEnabled, setAlarmEnabled] = useState(false);
  const [openTypeModal, setOpenTypeModal] = useState(false);
  const [selectedType, setSelectedType] = useState('');
  const [nome, setNome] = useState('');
  const [descricao, setDescricao] = useState('');
  const [quantidade, setQuantidade] = useState('');
  const [dosagem, setDosagem] = useState('');

  const handleAddMedication = async () => {
    if (!nome || !descricao || !quantidade || !selectedType || !dosagem) {
      Alert.alert('Erro', 'Por favor, preencha todos os campos.');
      return;
    }
  
    const medicationData = {
      nome,
      dosagem,
      tipo: selectedType,
      quantidade: parseInt(quantidade),
      descricao,
    };
  
    try {
      const apiIp = await AsyncStorage.getItem('apiIp');
      const response = await fetch('https://'+ apiIp + '/medicamento/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          'Active-Profile': userId, // Passando o ID do perfil
        },
        body: JSON.stringify(medicationData),
      });
  
      if (response.ok) {
        Alert.alert('Sucesso', 'Medicamento cadastrado com sucesso!');
        // Realiza o redirecionamento para a Home com um trigger para recarregar a lista
        navigation.navigate('Home', { token, userId, refresh: true });
      } else {
        const errorMessage = await response.text();
        Alert.alert('Erro', `Erro ao cadastrar medicamento: ${errorMessage}`);
      }
    } catch (error) {
      console.error('Erro ao cadastrar medicamento:', error);
      Alert.alert('Erro', 'Não foi possível cadastrar o medicamento.');
    }
  };  

  const renderModalContent = (type) => (
    <View style={modalStyles.modalCard}>
      <Text style={modalStyles.modalTitle}>
        {type === 'type' ? 'Escolha o Tipo' : ''}
      </Text>
      {type === 'type' ? (
        <>
          <TouchableOpacity onPress={() => { setSelectedType('Comprimido'); setOpenTypeModal(false); }} >
            <Text style={modalStyles.modalOption}>Comprimido</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => { setSelectedType('Cápsula'); setOpenTypeModal(false); }} >
            <Text style={modalStyles.modalOption}>Cápsula</Text>
          </TouchableOpacity>
          {/* Adicione outras opções de tipo aqui */}
        </>
      ) : null}
      <TouchableOpacity
        style={modalStyles.modalButton}
        onPress={() => { setSelectedType(''); setOpenTypeModal(false); }}
      >
        <Text style={modalStyles.modalButtonText}>Limpar Seleção</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={{ height: 30 }} />
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.iconContainer}>
          <Feather name="x" size={30} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerText}>Cadastro de Medicamento</Text>
      </View>

      <View style={{ marginBottom: 10 }}>
        <InputComponent
          placeholder="Nome do medicamento"
          style={styles.input}
          value={nome}
          onChangeText={setNome}
        />
        <InputComponent
          placeholder="Descrição"
          multiline={true}
          style={[styles.input, { height: 80 }]}
          value={descricao}
          onChangeText={setDescricao}
        />
        <InputComponent
          placeholder="Quantidade"
          style={styles.input}
          value={quantidade}
          onChangeText={setQuantidade}
        />
        <InputComponent
          placeholder="Dosagem"
          style={styles.input}
          value={dosagem}
          onChangeText={setDosagem}
        />

        <Text style={{ color: '#999', marginBottom: 5 }}>Tipo</Text>
        <TouchableOpacity
          style={[styles.picker, { width: 312, height: 47, alignSelf: 'center' }]}
          onPress={() => setOpenTypeModal(true)}
        >
          <Text style={{ color: selectedType ? '#333' : '#999' }}>
            {selectedType || 'Selecione o Tipo'}
          </Text>
          <Feather name="chevron-down" size={20} color="#999" />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.frequencyButton}
          onPress={() => navigation.navigate('AlarmScreen')}
        >
          <Text style={styles.buttonText}>Frequência</Text>
          <Feather name="clock" size={20} color="#fff" style={styles.frequencyIcon} />
        </TouchableOpacity>

        <View style={styles.switchContainer}>
          <Text style={styles.switchLabel}>Habilitar Alarme</Text>
          <Switch value={alarmEnabled} onValueChange={(value) => setAlarmEnabled(value)} />
        </View>

        <View style={[footerStyles.footer, { marginTop: 10 }]}>
          <View style={footerStyles.secondaryButtonsContainer}>
            <TransparentButton title="Cadastrar" onPress={handleAddMedication} />
          </View>
        </View>
      </View>

      <FooterNavigation />

      <Modal
        transparent
        visible={openTypeModal}
        animationType="fade"
        onRequestClose={() => setOpenTypeModal(false)}
      >
        <View style={modalStyles.modalContainer}>
          {renderModalContent('type')}
        </View>
      </Modal>
    </View>
  );
};

const footerStyles = StyleSheet.create({
  footer: {
    marginTop: 10,
    width: '100%',
    alignItems: 'center',
  },
  secondaryButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    paddingHorizontal: 30,
    paddingVertical: 5,
  },
});

const modalStyles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalCard: {
    width: 330,
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    padding: 20,
    alignItems: 'center',
    justifyContent: 'space-between',
    maxHeight: 400,
    overflow: 'scroll',
    maxHeight: 500,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
  },
  modalOption: {
    fontSize: 16,
    color: '#333',
    paddingVertical: 5,
  },
  modalButton: {
    backgroundColor: '#60A2AE',
    borderRadius: 5,
    padding: 10,
    marginTop: 10,
    width: '100%',
    alignItems: 'center',
  },
  modalButtonText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
});

export default AddMedScreen;
