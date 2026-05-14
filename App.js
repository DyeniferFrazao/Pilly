import React, { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import * as Notifications from 'expo-notifications';
import { Alert } from 'react-native';
import { AuthProvider } from './src/contexts/AuthContext';
import StackNavigator from './src/routes/StackNavigator';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

const App = () => {
  useEffect(() => {
    (async () => {
      const { status } = await Notifications.getPermissionsAsync();
      if (status !== 'granted') {
        const { status: novo } = await Notifications.requestPermissionsAsync();
        if (novo !== 'granted') {
          Alert.alert('Permissão Negada', 'O app precisa de permissão para enviar notificações.');
        }
      }
    })();
  }, []);

  return (
    <AuthProvider>
      <NavigationContainer>
        <StackNavigator />
      </NavigationContainer>
    </AuthProvider>
  );
};

export default App;
