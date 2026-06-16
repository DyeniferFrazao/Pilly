import React from 'react';
import { ActivityIndicator, View } from 'react-native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useAuth } from '../contexts/AuthContext';

import LoginScreen from '../pages/Authentication/LoginScreen';
import SignUpScreen from '../pages/Authentication/SignUpScreen';
import HomeScreen from '../pages/Home/HomeScreen';
import SettingScreen from '../pages/Configuration/SettingScreen';
import UserSettings from '../pages/UserManagement/UserSettings';
import AddMedScreen from '../pages/Medication/AddMedScreen';
import MedicamentosScreen from '../pages/Medication/MedicamentosScreen';
import MapScreen from '../pages/Map/MapScreen';
import NotificationScreen from '../pages/Configuration/NotificationScreen';
import AlarmScreen from '../pages/Configuration/AlarmScreen';
import AvatarEditorScreen from '../pages/Avatar/AvatarEditorScreen';

const Stack = createNativeStackNavigator();

const StackNavigator = () => {
  const { session, carregando } = useAuth();

  if (carregando) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#1D6B78" />
      </View>
    );
  }

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {!session ? (
        <>
          <Stack.Screen name="Login" component={LoginScreen} />
          <Stack.Screen name="SignUp" component={SignUpScreen} />
        </>
      ) : (
        <>
          <Stack.Screen name="Home" component={HomeScreen} />
          <Stack.Screen name="Medicamentos" component={MedicamentosScreen} />
          <Stack.Screen name="AddMedScreen" component={AddMedScreen} />
          <Stack.Screen name="AlarmScreen" component={AlarmScreen} />
          <Stack.Screen name="Notification" component={NotificationScreen} />
          <Stack.Screen name="Map" component={MapScreen} />
          <Stack.Screen name="Setting" component={SettingScreen} />
          <Stack.Screen name="UserSettings" component={UserSettings} />
          <Stack.Screen name="AvatarEditor" component={AvatarEditorScreen} />
        </>
      )}
    </Stack.Navigator>
  );
};

export default StackNavigator;
