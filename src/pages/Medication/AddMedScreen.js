import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity, Modal, StyleSheet,
  Switch, Alert, ScrollView,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import InputComponent from '../../components/InputComponent';
import FooterNavigation from '../../components/FooterNavigation';
import styles from '../../style/styleaddmed';
import { useAuth } from '../../contexts/AuthContext';
import { adicionarMedicamento } from '../../services/medicService';

const TIPOS = ['Comprimido', 'Cápsula', 'Líquido', 'Gotas', 'Injetável', 'Pomada', 'Adesivo'];

const AddMedScreen = ({ route, navigation }) => {
  const { user } = useAuth();
  const perfilId = route.params?.perfilId ?? null;

  const [alarmEnabled, setAlarmEnabled] = useState(false);
  const [openTypeModal, setOpenTypeModal] = useState(false);
  const [tipo, setTipo] = useState('');
  const [nome, setNome] = useState('');
  const [observacoes, setObservacoes] = useState('');
  const [estoque, setEstoque] = useState('');
  const [dose, setDose] = useState('');
  const [unidade, setUnidade] = useState('');
  const [principio, setPrincipio] = useState('');
  const [via, setVia] = useState('oral');
  // horarios e frequencia virão da AlarmScreen via params
  const horarios = route.params?.horarios ?? [];
  const frequencia = route.params?.frequencia ?? '';
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    if (!nome.trim()) {
      Alert.alert('Atenção', 'Informe o nome do medicamento.');
      return;
    }

    setLoading(true);
    try {
      const novo = await adicionarMedicamento(perfilId ?? user.id, {
        nome: nome.trim(),
        dose: dose.trim(),
        unidade: unidade.trim() || tipo,
        principio: principio.trim(),
        via: via.trim(),
        observacoes: observacoes.trim(),
        estoque: estoque ? parseInt(estoque) : 0,
        frequencia: frequencia || '',
        horarios,
      });

      if (alarmEnabled && novo?.id) {
        navigation.navigate('AlarmScreen', {
          medicationId: novo.id,
          medicationName: nome,
          perfilId,
        });
      } else {
        Alert.alert('Sucesso', 'Medicamento cadastrado!');
        navigation.navigate('Home', { perfilId });
      }
    } catch (error) {
      Alert.alert('Erro', error.message || 'Não foi possível cadastrar o medicamento.');
    } finally {
      setLoading(false);
    }
  };

  const handleFrequencia = () => {
    navigation.navigate('AlarmScreen', {
      medicationName: nome,
      perfilId,
      returnTo: 'AddMedScreen',
    });
  };

  return (
    <View style={styles.container}>
      <View style={{ height: 30 }} />
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.iconContainer}>
          <Feather name="arrow-left" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerText}>Cadastro de medicamento</Text>
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: 120, alignItems: 'center' }}>
        <InputComponent
          placeholder="Nome do medicamento"
          style={styles.input}
          value={nome}
          onChangeText={setNome}
        />
        <InputComponent
          placeholder="Descrição / Princípio ativo"
          style={styles.input}
          value={principio}
          onChangeText={setPrincipio}
        />

        {/* Dropdown Perfil substituído por perfilId via rota */}

        {/* Tipo */}
        <TouchableOpacity
          style={[styles.picker, { width: 312, height: 47, alignSelf: 'center' }]}
          onPress={() => setOpenTypeModal(true)}
        >
          <Text style={{ color: tipo ? '#333' : '#999' }}>{tipo || 'Tipo'}</Text>
          <Feather name="chevron-down" size={20} color="#999" />
        </TouchableOpacity>

        <View style={{ flexDirection: 'row', width: 312, gap: 10 }}>
          <InputComponent
            placeholder="Dose (ex: 25)"
            style={[styles.input, { flex: 1 }]}
            value={dose}
            onChangeText={setDose}
            keyboardType="numeric"
          />
          <InputComponent
            placeholder="Unidade (mg, ml…)"
            style={[styles.input, { flex: 1 }]}
            value={unidade}
            onChangeText={setUnidade}
          />
        </View>

        <InputComponent
          placeholder="Quantidade em estoque"
          style={styles.input}
          value={estoque}
          onChangeText={setEstoque}
          keyboardType="numeric"
        />

        {/* Frequência abre AlarmScreen */}
        <TouchableOpacity style={styles.frequencyButton} onPress={handleFrequencia}>
          <Text style={styles.buttonText}>
            {horarios.length > 0 ? `Horários: ${horarios.join(', ')}` : 'Frequência'}
          </Text>
          <Feather name="clock" size={20} color="#fff" style={styles.frequencyIcon} />
        </TouchableOpacity>

        <View style={styles.switchContainer}>
          <Text style={styles.switchLabel}>Habilitar Alarme</Text>
          <Switch value={alarmEnabled} onValueChange={setAlarmEnabled} />
        </View>

        <TouchableOpacity
          style={[styles.frequencyButton, { backgroundColor: '#60A2AE', marginTop: 10 }]}
          onPress={handleSave}
          disabled={loading}
        >
          <Text style={styles.buttonText}>{loading ? 'Salvando...' : 'Cadastrar'}</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.frequencyButton, { backgroundColor: 'transparent', borderWidth: 1, borderColor: '#60A2AE' }]}
          onPress={() => navigation.goBack()}
        >
          <Text style={[styles.buttonText, { color: '#60A2AE' }]}>Cancelar</Text>
        </TouchableOpacity>
      </ScrollView>

      <FooterNavigation />

      <Modal
        transparent
        visible={openTypeModal}
        animationType="fade"
        onRequestClose={() => setOpenTypeModal(false)}
      >
        <View style={modalStyles.modalContainer}>
          <View style={modalStyles.modalCard}>
            <Text style={modalStyles.modalTitle}>Tipo do medicamento</Text>
            {TIPOS.map(t => (
              <TouchableOpacity key={t} onPress={() => { setTipo(t); setOpenTypeModal(false); }}>
                <Text style={[modalStyles.modalOption, tipo === t && { color: '#60A2AE', fontWeight: 'bold' }]}>
                  {t}
                </Text>
              </TouchableOpacity>
            ))}
            <TouchableOpacity
              style={modalStyles.modalButton}
              onPress={() => setOpenTypeModal(false)}
            >
              <Text style={modalStyles.modalButtonText}>Fechar</Text>
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
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalCard: {
    width: 320,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  modalOption: {
    fontSize: 15,
    color: '#333',
    paddingVertical: 8,
  },
  modalButton: {
    backgroundColor: '#60A2AE',
    borderRadius: 8,
    padding: 10,
    marginTop: 12,
    width: '100%',
    alignItems: 'center',
  },
  modalButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
});

export default AddMedScreen;
