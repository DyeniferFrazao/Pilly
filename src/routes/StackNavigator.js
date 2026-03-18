import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import LoginScreen from '../pages/Authentication/LoginScreen';
import SignUpScreen from '../pages/Authentication/SignUpScreen';
import HomeScreen from '../pages/Home/HomeScreen';
import SettingScreen from '../pages/Configuration/SettingScreen';
import UserSettings from '../pages/UserManagement/UserSettings';
import UserScreen from '../pages/UserManagement/UserScreen';
import AddUserScreen from '../pages/UserManagement/AddUserScreen';
import AddMedScreen from '../pages/Medication/AddMedScreen';
import MapScreen from '../pages/Map/MapScreen';
import  NotificationScreen  from '../pages/Configuration/NotificationScreen'; // Correção de importação
import EditProfileScreen from '../pages/UserManagement/EditProfileScreen';
import AlarmScreen from '../pages/Configuration/AlarmScreen';

const Stack = createNativeStackNavigator();

const StackNavigator = () => {
  return (
    <Stack.Navigator initialRouteName="Login" screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="SignUp" component={SignUpScreen} />
      <Stack.Screen name="Home" component={HomeScreen} />
      <Stack.Screen name="Setting" component={SettingScreen} />
      <Stack.Screen name="UserSettings" component={UserSettings} />
      <Stack.Screen name="User" component={UserScreen} />
      <Stack.Screen name="AddUser" component={AddUserScreen} />
      <Stack.Screen name="AddMedScreen" component={AddMedScreen} />
      <Stack.Screen name="Map" component={MapScreen} />
      <Stack.Screen name="Notification" component={NotificationScreen} />
      <Stack.Screen name="AlarmScreen" component={AlarmScreen} />
      <Stack.Screen name="EditProfileScreen" component={EditProfileScreen} />
    </Stack.Navigator>
  );
};

export default StackNavigator;
