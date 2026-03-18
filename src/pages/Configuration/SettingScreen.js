import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Feather, AntDesign } from '@expo/vector-icons';
import styleSettings from '../../style/stylesetting';

const SettingScreen = ({ navigation, route }) => {
  const { token, profileId } = route.params;

  return (
    <View style={styleSettings.container}>
      <View style={{ height: 30 }} />  

      <View style={styleSettings.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <AntDesign name="arrowleft" size={24} color="white" />
        </TouchableOpacity>
        <Text style={styleSettings.headerText}>Configurações</Text>
      </View>

      <View style={{ height: 50 }} /> 

      <TouchableOpacity 
        style={styleSettings.button} 
        onPress={() => navigation.navigate('UserSettings', { token, profileId })}
      >
        <Feather name="user" size={35} color="white" /> 
        <Text style={styleSettings.buttonText}>Usuário</Text>
      </TouchableOpacity>

     

      <View style={styleSettings.bottomBar} />
    </View>
  );
};

export default SettingScreen;
