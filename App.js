import React, { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import * as Notifications from 'expo-notifications';
import StackNavigator from './src/routes/StackNavigator';
import { Platform, Alert } from 'react-native';

const App = () => {
  // Configurar o comportamento das notificações
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
    }),
  });

  // Função para solicitar permissão de notificações
  const requestNotificationPermission = async () => {
    const { status } = await Notifications.getPermissionsAsync();
    if (status !== 'granted') {
      const { status: newStatus } = await Notifications.requestPermissionsAsync();
      if (newStatus !== 'granted') {
        Alert.alert('Permissão Negada', 'O aplicativo precisa de permissão para enviar notificações.');
      }
    }
  };

  // Solicitar permissão ao iniciar o app
  useEffect(() => {
    requestNotificationPermission();
  }, []);

  return (
    <NavigationContainer>
      <StackNavigator />
    </NavigationContainer>
  );
};

export default App;
