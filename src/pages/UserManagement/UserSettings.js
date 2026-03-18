import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
  StyleSheet,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { AntDesign, Feather, FontAwesome } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import InputComponent from '../../components/InputComponent';
import styles from '../../style/styleusersettings';

const UserSettings = ({ navigation, route }) => {
  const { token, profileId } = route.params;
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [image, setImage] = useState(null);
  const [email, setEmail] = useState(null);
  const [name, setName] = useState(null);

  const getProfileImage = async (userId) => {
    const apiIp = await AsyncStorage.getItem('apiIp');
    try {
      const response = await fetch('https://' + apiIp + '/auth/' + userId.toString() + '/profile-image', {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
          'Active-Profile': profileId,
        },
      });

      if (response.ok) {
        const imageUrl = await response.text();
        setImage(imageUrl);
      }
    } catch (error) {
      console.error('Erro ao buscar imagem de perfil:', error);
    }
  };

  const handleUploadImage = async () => {
    try {
      const apiIp = await AsyncStorage.getItem('apiIp');
      const token = await AsyncStorage.getItem('token');
      const profileId = await AsyncStorage.getItem('profileId');
      const userId = await AsyncStorage.getItem('userId');
      
      if (!token || !profileId || !userId) {
        Alert.alert('Erro', 'Não foi possível obter as credenciais para upload.');
        return;
      }

      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permissão necessária', 'É necessário permitir o acesso à galeria para continuar.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        quality: 1,
      });

      if (!result.canceled) {
        const { uri } = result.assets[0];

        const formData = new FormData();
        formData.append('file', {
          uri: Platform.OS === 'ios' ? uri.replace('file://', '') : uri,
          type: 'image/jpeg',
          name: `profile_${profileId}.jpg`,
        });

        const response = await fetch(`https://${apiIp}/auth/${userId}/upload-image`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'Active-Profile': profileId,
            'file': 'multipart/form-data',
          },
          body: formData,
        });

        if (response.ok) {
          const message = await response.text();
          navigation.navigate('UserSettings', { refresh: true });
          Alert.alert('Sucesso', message);
        } else {
          const errorMessage = await response.text();
          Alert.alert('Erro', `Falha no upload: ${errorMessage}`);
        }
      }
    } catch (error) {
      console.error('Erro no upload de imagem:', error);
      Alert.alert('Erro', 'Não foi possível carregar a imagem.');
    }
  };

  useEffect(() => {
    const fetchUserProfileImage = async () => {
      const userId = await AsyncStorage.getItem('userId');
      if (userId) {
        await getProfileImage(userId);
      }
      const fetchEmail = async () => {
        const storedEmail = await AsyncStorage.getItem('email');
        setEmail(storedEmail);
      };
      fetchEmail();
      const fetchName = async () => {
        const storedName = await AsyncStorage.getItem('name');
        setName(storedName);
      };
      fetchName();
    };

    fetchUserProfileImage();
  }, [token]);

  const handleDeleteAccount = async () => {
    const apiIp = await AsyncStorage.getItem('apiIp');
    try {
      const response = await fetch('http://' + apiIp + ':8080/auth/delete', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
          'Active-Profile': profileId,
        },
      });

      if (response.ok) {
        Alert.alert('Sucesso', 'Usuário deletado com sucesso.');
        navigation.navigate('Login'); 
      } else {
        Alert.alert('Erro');
      }
    } catch (error) {
      Alert.alert('Erro', error.message);
    }
  };

  const handleLogout = async () => {
    Alert.alert(
      'Confirmação',
      'Você deseja realmente sair da conta?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'OK',
          onPress: async () => {
            try {
              await AsyncStorage.multiRemove(['token', 'profileId']);
              navigation.navigate('Login');
            } catch (error) {
              Alert.alert('Erro', 'Não foi possível realizar o logout.');
            }
          },
        },
      ],
      { cancelable: true }
    );
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <AntDesign name="arrowleft" size={24} color="white" />
          </TouchableOpacity>
          <Text style={styles.headerText}>Configuração de usuário</Text>
        </View>

        <View style={styles.card}>
          <View style={styles.profileContainer}>
            <TouchableOpacity onPress={handleUploadImage} style={styles.cameraContainer}>
              {image ? (
                <Image source={{ uri: image }} style={styles.imagePreview} />
              ) : (
                <FontAwesome name="camera" size={60} color="#60A2AE" />
              )}
            </TouchableOpacity>

            <TouchableOpacity onPress={handleUploadImage} style={styles.uploadButtonInsideCard}>
              <Text style={styles. uploadButtonText}>Editar Perfil</Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.label}>Email</Text>
          {email ? (
            <Text style={styles.label}>{email}</Text>
          ) : (
            <Text style={styles.label}>Carregando</Text>
          )}

          <Text style={styles.label}>Perfil Ativo</Text>
          {name ? (
            <Text style={styles.label}>{name}</Text>
          ) : (
            <Text style={styles.label}>Carregando</Text>
          )}

          <TouchableOpacity onPress={handleDeleteAccount} style={styles.deleteContainer}>
            <Feather name="delete" size={24} color="#60A2AE" />
            <Text style={styles.deleteText}>Deletar Conta</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity onPress={handleLogout} style={styles.logoutContainer}>
          <Feather name="log-out" size={54} color="#60A2AE" />
          <Text style={styles.logoutText}>Sair da Conta</Text>
        </TouchableOpacity>
      </ScrollView>

      <View style={styles.bottomBar}></View>
    </KeyboardAvoidingView>
  );
};



export default UserSettings;
