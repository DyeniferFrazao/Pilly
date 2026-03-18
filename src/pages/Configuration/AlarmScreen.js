import React, { useState, useCallback } from 'react';
import { View, Text, FlatList, TouchableOpacity, Alert } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useNavigation } from '@react-navigation/native';
import * as Notifications from 'expo-notifications';
import styles from '../../style/stylealarm';

const AlarmScreen = () => {
  const [selectedTime, setSelectedTime] = useState(new Date());
  const [alarms, setAlarms] = useState([]);
  const [interval, setInterval] = useState(2);
  const [showPicker, setShowPicker] = useState(false);

  const navigation = useNavigation();

  // Função otimizada de cálculos
  const calculateNextAlarms = useCallback((baseTime, interval) => {
    const nextAlarms = [];
    
    for (let i = 1; i <= 4; i++) {
      const nextTime = new Date(baseTime);
      nextTime.setHours(baseTime.getHours() + interval * i);
      nextAlarms.push(nextTime);
    }

    const formattedAlarms = nextAlarms.map((time) =>
      time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    );

    setAlarms(formattedAlarms);
    scheduleNotifications(nextAlarms);
  }, []);

  // Função para agendar as notificações
  const scheduleNotifications = (alarmTimes) => {
    alarmTimes.forEach((time, index) => {
      const trigger = new Date(time);
      Notifications.scheduleNotificationAsync({
        content: {
          title: 'Lembrete de Medicamento',
          body: `Hora de tomar seu remédio. Alarme ${index + 1}`,
          sound: true,
        },
        trigger,
      }).then(() => {
        console.log(`Alarme ${index + 1} agendado para: ${trigger.toLocaleTimeString()}`);
      }).catch((error) => {
        console.error('Erro ao agendar notificação:', error);
        Alert.alert('Erro', 'Não foi possível agendar o alarme.');
      });
    });
  };

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

  // Função que salva e navega para a tela de notificações
  const handleCalculateAlarms = () => {
    Alert.alert('Alarmes Agendados');
    // Navegar para a tela de notificações e passar os horários calculados
    navigation.navigate('Notification', { alarms });  // Passando os horários para a tela de Notificação
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
