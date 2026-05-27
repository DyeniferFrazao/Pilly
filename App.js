import React, { useEffect, useRef } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import * as Notifications from 'expo-notifications';
import { AuthProvider } from './src/contexts/AuthContext';
import StackNavigator from './src/routes/StackNavigator';
import { configurarNotificacoes, adiarDose } from './src/services/alarmService';
import { registrarDose } from './src/services/medicService';

// Exibe a notificação mesmo com o app em primeiro plano
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

const App = () => {
  const navigationRef = useRef(null);
  const responseListener = useRef(null);

  useEffect(() => {
    // 1. Configura permissões, canal Android e categoria de ações
    configurarNotificacoes().catch(console.error);

    // 2. Ouve respostas às ações dos botões da notificação
    responseListener.current = Notifications.addNotificationResponseReceivedListener(
      async (response) => {
        const { actionIdentifier, notification } = response;
        const data = notification.request.content.data ?? {};
        const {
          medicationId,
          medicationName,
          perfilId,
          userId,
          horarioPrevisto,
        } = data;

        if (actionIdentifier === 'TOMEI') {
          // Usuário marcou que tomou o medicamento diretamente da notificação
          try {
            await registrarDose(medicationId, userId, 'tomado', perfilId, horarioPrevisto);
          } catch (e) {
            console.warn('[Pilly] Erro ao registrar dose via notificação:', e.message);
          }

        } else if (actionIdentifier === 'ADIAR') {
          // Agenda um lembrete único em 15 minutos
          try {
            await adiarDose(medicationName, medicationId, perfilId, userId, 15);
          } catch (e) {
            console.warn('[Pilly] Erro ao adiar dose:', e.message);
          }

        } else {
          // Toque padrão na notificação → abre a Home
          if (navigationRef.current?.isReady()) {
            navigationRef.current.navigate('Home');
          }
        }
      }
    );

    return () => {
      if (responseListener.current) {
        Notifications.removeNotificationSubscription(responseListener.current);
      }
    };
  }, []);

  return (
    <AuthProvider>
      <NavigationContainer ref={navigationRef}>
        <StackNavigator />
      </NavigationContainer>
    </AuthProvider>
  );
};

export default App;
