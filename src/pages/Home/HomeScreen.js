import React, { useState, useCallback } from 'react';
import { View, Text, ScrollView, Image, Alert, TouchableOpacity } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import stylehome from '../../style/stylehome';
import Card from '../../components/Card';
import FooterNavigation from '../../components/FooterNavigation';
import ModalComponent from '../../components/ModalComponent';
import { useAuth } from '../../contexts/AuthContext';
import { listarMedicamentos, removerMedicamento } from '../../services/medicService';
import { cancelAlarmsForMedication } from '../../services/alarmService';

const diasDesde = (dateStr) => {
  if (!dateStr) return null;
  const diff = Date.now() - new Date(dateStr).getTime();
  const dias = Math.floor(diff / (1000 * 60 * 60 * 24));
  if (dias < 30) return `${dias}d`;
  const meses = Math.floor(dias / 30);
  const restoDias = dias % 30;
  return restoDias > 0 ? `${meses}m e ${restoDias}d` : `${meses}m`;
};

const HomeScreen = ({ navigation, route }) => {
  const { user } = useAuth();
  const perfilId = route.params?.perfilId ?? null;
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedMedication, setSelectedMedication] = useState(null);
  const [medications, setMedications] = useState([]);

  const fetchMedications = useCallback(async () => {
    if (!user) return;
    try {
      const data = await listarMedicamentos(perfilId ?? user.id);
      setMedications(data);
    } catch (error) {
      Alert.alert('Erro', 'Não foi possível carregar os medicamentos.');
    }
  }, [user, perfilId]);

  useFocusEffect(
    useCallback(() => { fetchMedications(); }, [fetchMedications])
  );

  const handleDelete = async (id) => {
    try {
      await removerMedicamento(id);
      await cancelAlarmsForMedication(id);
      setMedications(prev => prev.filter(m => m.id !== id));
      setModalVisible(false);
    } catch {
      Alert.alert('Erro', 'Não foi possível excluir o medicamento.');
    }
  };

  return (
    <View style={stylehome.container}>
      <View style={{ height: 30 }} />
      <View style={stylehome.header}>
        <Text style={stylehome.headerText}>Medicamentos</Text>
      </View>

      <ScrollView contentContainerStyle={stylehome.scrollContent}>
        {medications.length > 0 ? (
          medications.map((med) => (
            <Card
              key={med.id}
              onPress={() => { setSelectedMedication(med); setModalVisible(true); }}
            >
              <View style={stylehome.cardContent}>
                <Image
                  source={require('../../../assets/icons/capsula.png')}
                  style={stylehome.cardImage}
                />
                <View style={stylehome.cardTextContainer}>
                  <Text style={stylehome.cardTitle}>{med.nome}</Text>
                  <Text style={stylehome.cardDescription}>{med.principio}</Text>
                </View>
              </View>
              <Text style={stylehome.cardDetails}>
                • {med.dose}{med.unidade ? ` ${med.unidade}` : ''}
              </Text>
              {med.created_at ? (
                <Text style={stylehome.cardDetails}>
                  • Iniciado à <Text style={stylehome.highlight}>{diasDesde(med.created_at)}</Text>
                </Text>
              ) : null}
              {med.estoque != null ? (
                <Text style={stylehome.cardDetails}>
                  • Restam <Text style={stylehome.highlight}>{med.estoque} {med.unidade || 'unidades'}</Text>
                </Text>
              ) : null}
            </Card>
          ))
        ) : (
          <Text style={stylehome.emptyListText}>Nenhum medicamento cadastrado.</Text>
        )}
      </ScrollView>

      <TouchableOpacity
        style={stylehome.fab}
        onPress={() => navigation.navigate('AddMedScreen', { perfilId })}
      >
        <Text style={stylehome.fabText}>+</Text>
      </TouchableOpacity>

      <FooterNavigation />

      {selectedMedication && (
        <ModalComponent
          visible={modalVisible}
          medication={selectedMedication}
          onClose={() => setModalVisible(false)}
          navigation={navigation}
          onDelete={handleDelete}
          onRefresh={fetchMedications}
        />
      )}
    </View>
  );
};

export default HomeScreen;
