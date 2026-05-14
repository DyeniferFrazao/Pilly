import React, { useState, useCallback } from 'react';
import { View, Text, FlatList, TouchableOpacity, Alert } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useNavigation, useRoute } from '@react-navigation/native';
import { scheduleAlarms } from '../../services/alarmService';
import styles from '../../style/stylealarm';

const AlarmScreen = () => {
  const [selectedTime, setSelectedTime] = useState(new Date());
  const [alarms, setAlarms] = useState([]);
  const [interval, setInterval] = useState(2);
  const [showPicker, setShowPicker] = useState(false);

  const navigation = useNavigation();
  const route = useRoute();
  const { medicationId, medicationName } = route.params || {};

  // Calcula os horários para exibição (sem agendar ainda)
  const calculateNextAlarms = useCallback((baseTime, selectedInterval) => {
    const nextAlarms = [];
    for (let i = 1; i <= 4; i++) {
      const nextTime = new Date(baseTime);
      nextTime.setHours(baseTime.getHours() + selectedInterval * i);
      nextAlarms.push(nextTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
    }
    setAlarms(nextAlarms);
  }, []);

  const handleTimeChange = (event, time) => {
    setShowPicker(false);
    if (time) {
      setSelectedTime(time);
      calculateNextAlarms(time, interval);
    }
  };

  const handleIntervalChange = (value) => {
    setInterval(value);
    calculateNextAlarms(selectedTime, value);
  };

  const handleBackPress = () => {
    navigation.goBack();
  };

  // Agenda os alarmes via alarmService (vinculados ao medicationId) e navega
  const handleCalculateAlarms = async () => {
    try {
      const scheduled = await scheduleAlarms(selectedTime, interval, medicationName || 'Medicamento', medicationId);
      Alert.alert('Alarmes Agendados', `Próximos horários:\n${scheduled.join('\n')}`);
      navigation.navigate('Notification', { alarms: scheduled });
    } catch (error) {
      console.error('Erro ao agendar alarmes:', error);
      Alert.alert('Erro', 'Não foi possível agendar os alarmes.');
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.cardContainer}>
        <Text style={styles.title}>O alarme despertará a cada:</Text>
        <TouchableOpacity onPress={() => setShowPicker(true)} style={styles.timeDisplay}>
          <Text style={styles.timeText}>
            {selectedTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </Text>
        </TouchableOpacity>

        {showPicker && (
          <DateTimePicker
            value={selectedTime}
            mode="time"
            display="spinner"
            onChange={handleTimeChange}
          />
        )}

        <View style={styles.intervals}>
          {[2, 3, 4, 6, 8, 12].map((value) => (
            <TouchableOpacity
              key={value}
              style={[styles.intervalButton, interval === value && styles.selectedButton]}
              onPress={() => handleIntervalChange(value)}
            >
              <Text style={styles.intervalText}>{value}h</Text>
            </TouchableOpacity>
          ))}
        </View>

        <FlatList
          data={alarms}
          keyExtractor={(item, index) => index.toString()}
          renderItem={({ item }) => <Text style={styles.alarm}>{item}</Text>}
          ListHeaderComponent={<Text style={styles.subtitle}>Próximos Horários:</Text>}
        />

        <View style={styles.buttonContainer}>
          <TouchableOpacity onPress={handleBackPress} style={styles.button}>
            <Text style={styles.buttonText}>Voltar</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={handleCalculateAlarms} style={styles.button}>
            <Text style={styles.buttonText}>Calcular Alarmes</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

export default AlarmScreen;
