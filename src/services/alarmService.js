import * as Notifications from 'expo-notifications';

export const scheduleAlarms = async (selectedTime, interval, medicationName) => {
  // Cancelar alarmes antigos
  await Notifications.cancelAllScheduledNotificationsAsync();

  const baseTime = new Date(selectedTime);
  const alarms = [];

  // Criar 4 alarmes com base no intervalo selecionado
  for (let i = 1; i <= 4; i++) {
    const alarmTime = new Date(baseTime);
    alarmTime.setHours(baseTime.getHours() + interval * i);

    // Agendar a notificação
    await Notifications.scheduleNotificationAsync({
      content: {
        title: 'Hora de tomar o remédio!',
        body: `Lembre-se de tomar o remédio: ${medicationName}`,
        sound: true,
      },
      trigger: alarmTime,
    });

    alarms.push(alarmTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
  }

  return alarms;
};
