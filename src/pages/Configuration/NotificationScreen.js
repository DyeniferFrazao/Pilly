import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Switch, Modal, StyleSheet, Alert } from 'react-native';
import { AntDesign } from '@expo/vector-icons';
import styles from '../../style/notificationstyle';

const NotificationScreen = ({ navigation, route }) => {
  const { alarms } = route.params || { alarms: [] }; // Garantir que 'alarms' seja fornecido
  const [isEnabled, setIsEnabled] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(null);
  const [currentAlarms, setCurrentAlarms] = useState(alarms); // Estado local para os alarmes

  const toggleSwitch = () => setIsEnabled((prev) => !prev);

  const handleDelete = () => {
    if (selectedIndex !== null) {
      const updatedAlarms = currentAlarms.filter((_, index) => index !== selectedIndex); // Remover o alarme da lista local
      setCurrentAlarms(updatedAlarms); // Atualizar a lista de alarmes localmente
      setModalVisible(false);
      Alert.alert('Sucesso', 'Alarme excluído com sucesso.');
    }
  };

  const handleOpenModal = (index) => {
    setSelectedIndex(index);
    setModalVisible(true);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <AntDesign name="arrowleft" size={24} color="white" />
        </TouchableOpacity>
        <Text style={styles.headerText}>Configuração de Notificações</Text>
      </View>

      <ScrollView contentContainerStyle={styles.body}>
        <Text style={styles.nextAlarmText}>Próximos Alarmes:</Text>
        
        {/* Verifica se a notificação está permitida antes de exibir a lista de alarmes */}
        {isEnabled ? (
          currentAlarms && currentAlarms.length > 0 ? (
            currentAlarms.map((alarm, index) => (
              <TouchableOpacity
                key={index}
                style={styles.notificationCard}
                onPress={() => handleOpenModal(index)}
              >
                <Text style={styles.cardText}>
                  {alarm} - Lembrete de Medicamento
                </Text>
              </TouchableOpacity>
            ))
          ) : (
            <Text style={styles.noAlarmsText}>Nenhum alarme configurado.</Text>
          )
        ) : (
          <Text style={styles.noAlarmsText}>Notificações desativadas. Ative para ver os alarmes.</Text>
        )}

        <View style={styles.switchSection}>
          <Text style={styles.switchText}>Permitir Notificação</Text>
          <Switch
            trackColor={{ false: "#767577", true: "#b8f2ee" }}
            thumbColor={isEnabled ? "#00d8c1" : "#f4f3f4"}
            onValueChange={toggleSwitch}
            value={isEnabled}
          />
        </View>
      </ScrollView>

      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={modalStyles.modalContainer}>
          <View style={modalStyles.modalContent}>
            <Text style={modalStyles.modalTitle}>Escolha uma opção</Text>
            <TouchableOpacity style={modalStyles.modalButton} onPress={handleDelete}>
              <Text style={modalStyles.modalButtonText}>Excluir</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={modalStyles.modalButton}
              onPress={() => setModalVisible(false)}
            >
              <Text style={modalStyles.modalButtonText}>Cancelar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const modalStyles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    width: '80%',
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    padding: 20,
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
  },
  modalButton: {
    backgroundColor: '#62A4B0',
    padding: 10,
    width: '100%',
    alignItems: 'center',
    marginBottom: 10,
    borderRadius: 5,
  },
  modalButtonText: {
    color: '#fff',
    fontSize: 16,
  },
});

export default NotificationScreen;
