import * as Notifications from 'expo-notifications';

/**
 * Agenda alarmes para um medicamento específico.
 * Cancela apenas os alarmes anteriores desse medicamento (pelo medicationId).
 *
 * @param {Date} selectedTime - Horário base do primeiro alarme
 * @param {number} interval - Intervalo em horas entre alarmes
 * @param {string} medicationName - Nome do medicamento (exibido na notificação)
 * @param {string} medicationId - ID único do medicamento (para cancelar alarmes antigos)
 * @returns {string[]} Lista de horários formatados dos alarmes agendados
 */
export const scheduleAlarms = async (selectedTime, interval, medicationName, medicationId) => {
  // Cancelar apenas os alarmes deste medicamento específico
  const scheduled = await Notifications.getAllScheduledNotificationsAsync();
  for (const notif of scheduled) {
    if (notif.content.data?.medicationId === medicationId) {
      await Notifications.cancelScheduledNotificationAsync(notif.identifier);
    }
  }

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
        body: `Lembre-se de tomar: ${medicationName}`,
        sound: true,
        data: { medicationId },
      },
      trigger: alarmTime,
    });

    alarms.push(alarmTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
  }

  return alarms;
};

/**
 * Cancela todos os alarmes de um medicamento específico.
 *
 * @param {string} medicationId - ID do medicamento cujos alarmes serão cancelados
 */
export const cancelAlarmsForMedication = async (medicationId) => {
  const scheduled = await Notifications.getAllScheduledNotificationsAsync();
  for (const notif of scheduled) {
    if (notif.content.data?.medicationId === medicationId) {
      await Notifications.cancelScheduledNotificationAsync(notif.identifier);
    }
  }
};
