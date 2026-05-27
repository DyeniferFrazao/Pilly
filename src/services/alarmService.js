import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

// ─── ID da categoria de notificação ──────────────────────────────────────────
const CATEGORIA_MED = 'MEDICAMENTO';

/**
 * Configura permissões, canal Android e categoria de ações.
 * Deve ser chamada uma vez na inicialização do app (App.js).
 */
export async function configurarNotificacoes() {
  // 1. Permissões
  const { status } = await Notifications.getPermissionsAsync();
  if (status !== 'granted') {
    const { status: novo } = await Notifications.requestPermissionsAsync();
    if (novo !== 'granted') return false;
  }

  // 2. Canal Android (obrigatório no Android 8+)
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('medicamentos', {
      name: 'Lembretes de medicamentos',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 300, 200, 300],
      lightColor: '#60A2AE',
      sound: 'default',
      enableVibrate: true,
    });
  }

  // 3. Categoria com botões de ação (checkpoint visual)
  await Notifications.setNotificationCategoryAsync(CATEGORIA_MED, [
    {
      identifier: 'TOMEI',
      buttonTitle: '✅  Tomei',
      options: { opensAppToForeground: true },
    },
    {
      identifier: 'ADIAR',
      buttonTitle: '⏰  Adiar 15 min',
      options: { opensAppToForeground: false },
    },
  ]);

  return true;
}

/**
 * Agenda alarmes diários para um medicamento.
 *
 * @param {Date}   selectedTime   - Horário base (a partir do qual calcula cada dose)
 * @param {number} interval       - Intervalo em horas entre doses
 * @param {string} medicationName - Nome exibido na notificação
 * @param {string} medicationId   - UUID do medicamento
 * @param {string} [perfilId]     - UUID do perfil (para registrar dose pela notificação)
 * @param {string} [userId]       - UUID do usuário autenticado
 * @returns {string[]}  Horários formatados agendados
 */
export async function scheduleAlarms(
  selectedTime,
  interval,
  medicationName,
  medicationId,
  perfilId = null,
  userId   = null,
) {
  // Cancela alarmes anteriores deste medicamento
  await cancelAlarmsForMedication(medicationId);

  const base   = new Date(selectedTime);
  const alarms = [];

  for (let i = 1; i <= 4; i++) {
    const horario = new Date(base);
    horario.setHours(base.getHours() + interval * i);

    await Notifications.scheduleNotificationAsync({
      content: {
        title: '💊 Hora da medicação',
        body:  `Lembre-se de tomar: ${medicationName}`,
        sound: 'default',
        categoryIdentifier: CATEGORIA_MED,
        data: {
          medicationId,
          medicationName,
          perfilId,
          userId,
          horarioPrevisto: horario.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      },
      // trigger DAILY: dispara todo dia no mesmo horário
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DAILY,
        hour:   horario.getHours(),
        minute: horario.getMinutes(),
      },
    });

    alarms.push(horario.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
  }

  return alarms;
}

/**
 * Agenda um lembrete único em N minutos (usado pelo botão "Adiar").
 */
export async function adiarDose(medicationName, medicationId, perfilId, userId, minutos = 15) {
  await Notifications.scheduleNotificationAsync({
    content: {
      title: '⏰ Lembrete adiado',
      body:  `Não esqueça: ${medicationName}`,
      sound: 'default',
      categoryIdentifier: CATEGORIA_MED,
      data: {
        medicationId,
        medicationName,
        perfilId,
        userId,
        horarioPrevisto: null,
      },
    },
    trigger: {
      type:    Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
      seconds: minutos * 60,
      repeats: false,
    },
  });
}

/**
 * Cancela todos os alarmes de um medicamento específico.
 */
export async function cancelAlarmsForMedication(medicationId) {
  const agendadas = await Notifications.getAllScheduledNotificationsAsync();
  for (const notif of agendadas) {
    if (notif.content.data?.medicationId === medicationId) {
      await Notifications.cancelScheduledNotificationAsync(notif.identifier);
    }
  }
}
