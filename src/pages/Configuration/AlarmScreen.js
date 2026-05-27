/**
 * AlarmScreen — Gerenciamento de alarmes de medicamentos JÁ CADASTRADOS.
 *
 * Esta tela NÃO é mais usada no fluxo de cadastro de medicamentos.
 * A configuração de horários durante o cadastro é feita inline no AddMedScreen.
 *
 * Uso atual: editar/reconfigurar alarmes de um medicamento existente,
 * navegando a partir do ModalComponent (HomeScreen).
 */
import React, { useState, useCallback, useEffect } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, Alert, Platform,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useNavigation, useRoute } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { scheduleAlarms } from '../../services/alarmService';
import styles from '../../style/stylealarm';

const INTERVALOS = [2, 3, 4, 6, 8, 12];

const AlarmScreen = () => {
  const navigation = useNavigation();
  const route      = useRoute();
  const { medicationId, medicationName } = route.params || {};

  const [selectedTime, setSelectedTime] = useState(new Date());
  const [interval,     setIntervalValue] = useState(4);
  const [alarms,       setAlarms]        = useState([]);
  const [showPicker,   setShowPicker]    = useState(false);
  const [agendando,    setAgendando]     = useState(false);

  const calcularHorarios = useCallback((baseTime, intervalo) => {
    return Array.from({ length: 4 }, (_, i) => {
      const t = new Date(baseTime);
      t.setHours(t.getHours() + intervalo * (i + 1));
      return t.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    });
  }, []);

  useEffect(() => {
    setAlarms(calcularHorarios(selectedTime, interval));
  }, [selectedTime, interval, calcularHorarios]);

  const handleTimeChange = (_, time) => {
    setShowPicker(Platform.OS === 'ios');
    if (time) setSelectedTime(time);
  };

  const handleConfirmar = async () => {
    if (!medicationId) {
      Alert.alert('Erro', 'ID do medicamento não informado.');
      return;
    }
    setAgendando(true);
    try {
      const agendados = await scheduleAlarms(
        selectedTime,
        interval,
        medicationName || 'Medicamento',
        medicationId
      );
      Alert.alert(
        'Alarmes configurados',
        `Próximos horários:\n${agendados.join('\n')}`,
        [{ text: 'OK', onPress: () => navigation.goBack() }]
      );
    } catch (error) {
      Alert.alert('Erro', 'Não foi possível agendar os alarmes.');
    } finally {
      setAgendando(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Cabeçalho */}
      <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 8 }}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Feather name="arrow-left" size={24} color="#2E7D8A" />
        </TouchableOpacity>
        <Text style={{ marginLeft: 12, fontSize: 16, color: '#2E7D8A', fontWeight: 'bold' }}>
          {medicationName ? `Alarme — ${medicationName}` : 'Configurar alarme'}
        </Text>
      </View>

      <View style={styles.cardContainer}>
        <Text style={styles.title}>Repetir a cada:</Text>

        {/* Horário base */}
        <TouchableOpacity onPress={() => setShowPicker(true)} style={styles.timeDisplay}>
          <Text style={styles.timeText}>
            {selectedTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </Text>
        </TouchableOpacity>

        {showPicker && (
          <DateTimePicker
            value={selectedTime}
            mode="time"
            display={Platform.OS === 'ios' ? 'spinner' : 'default'}
            onChange={handleTimeChange}
          />
        )}

        {/* Intervalos */}
        <View style={styles.intervals}>
          {INTERVALOS.map(v => (
            <TouchableOpacity
              key={v}
              style={[styles.intervalButton, interval === v && styles.selectedButton]}
              onPress={() => setIntervalValue(v)}
            >
              <Text style={styles.intervalText}>{v}h</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Preview dos horários */}
        <FlatList
          data={alarms}
          keyExtractor={(_, i) => i.toString()}
          renderItem={({ item }) => <Text style={styles.alarm}>{item}</Text>}
          ListHeaderComponent={<Text style={styles.subtitle}>Próximos Horários:</Text>}
        />

        {/* Ações */}
        <View style={styles.buttonContainer}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.button}>
            <Text style={styles.buttonText}>Voltar</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={handleConfirmar}
            style={[styles.button, agendando && { opacity: 0.6 }]}
            disabled={agendando}
          >
            <Text style={styles.buttonText}>{agendando ? 'Agendando...' : 'Salvar alarme'}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
};

export default AlarmScreen;
