import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Modal,
  TouchableWithoutFeedback,
  Alert,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { AntDesign, FontAwesome } from '@expo/vector-icons';
import InputComponent from '../../components/InputComponent';
import styles from '../../style/styleadduser';
import AsyncStorage from '@react-native-async-storage/async-storage';

const AddUserScreen = ({ navigation }) => {
  const [image, setImage] = useState(null);
  const [name, setname] = useState('');
  const [bio, setBio] = useState('');
  const [imageModalVisible, setImageModalVisible] = useState(false);
  const [profileModalVisible, setProfileModalVisible] = useState(false);
  const [token, setToken] = useState(null);
  const [profileId, setProfileId] = useState(null);

  const pickImage = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permissão negada', 'Precisamos da permissão para acessar a galeria.');
        return;
      }
      setImageModalVisible(true);
    } catch (error) {
      console.error('Erro ao solicitar permissão de galeria:', error);
    }
  };

  const launchGallery = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 1,
      });

      if (!result.cancelled) {
        setImage(result.uri);
      }
      setImageModalVisible(false);
    } catch (error) {
      console.error('Erro ao abrir a galeria:', error);
    }
  };

  const launchCamera = async () => {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permissão negada', 'Precisamos da permissão para acessar a câmera.');
        return;
      }
      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [4, 3],
        quality: 1,
      });

      if (!result.cancelled) {
        setImage(result.uri);
      }
      setImageModalVisible(false);
    } catch (error) {
      console.error('Erro ao abrir a câmera:', error);
    }
  };

  const saveProfile = async () => {
    const apiIp = await AsyncStorage.getItem('apiIp');
    if (name.trim() === '' || bio.trim() === '') {
      Alert.alert('Campos obrigatórios', 'Por favor, preencha o nome de usuário e a bio.');
      return;
    }
  
    try {
      const token = await AsyncStorage.getItem('token'); // Recupera o token do armazenamento
      const response = await fetch('https://'+ apiIp +'/profiles/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`, // Envia o token para autenticação
        },
        body: JSON.stringify({
          name,
          bio,
          image,
        }),
      });
  
      if (response.ok) {
        Alert.alert('Sucesso', 'Usuário adicionado com sucesso!');
        navigation.navigate('User', { refresh: true, token, profileId }); // Redireciona e força atualização
      } else {
        const error = await response.json();
        Alert.alert('Erro', error.message || 'Falha ao adicionar usuário.');
      }
    } catch (error) {
      console.error('Erro ao salvar o perfil:', error);
      Alert.alert('Erro', 'Ocorreu um erro ao adicionar o usuário.');
    }
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
          <Text style={styles.headerText}>Adicionar perfil</Text>
        </View>

        <View style={styles.card}>
          <TouchableOpacity onPress={pickImage} style={styles.cameraContainer}>
            {image ? (
              <Image source={{ uri: image }} style={styles.imagePreview} />
            ) : (
              <FontAwesome name="camera" size={60} color="#60A2AE" />
            )}
          </TouchableOpacity>

          <InputComponent
            value={name}
            onChangeText={setname}
            placeholder="Nome de usuário"
            width={300}
            height={47}
            marginVertical={10}
          />

          <InputComponent
            value={bio}
            onChangeText={setBio}
            placeholder="Bio..."
            width={300}
            height={100}
            marginVertical={10}
            multiline
            textAlignVertical="top"
          />

          <TouchableOpacity onPress={saveProfile} style={styles.addButton}>
            <Text style={styles.buttonText}>Adicionar</Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.cancelButton}>
            <Text style={styles.cancelButtonText}>Cancelar</Text>
          </TouchableOpacity>
        </View>

       
        <Modal visible={imageModalVisible} transparent>
          <TouchableWithoutFeedback onPress={() => setImageModalVisible(false)}>
            <View style={styles.modalContainer}>
              <View style={styles.modalContent}>
                <Text style={styles.modalTitle}>Escolher uma opção</Text>
                <TouchableOpacity onPress={launchGallery} style={styles.modalButton}>
                  <Text style={styles.modalButtonText}>Escolher da galeria</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={launchCamera} style={styles.modalButton}>
                  <Text style={styles.modalButtonText}>Tirar foto</Text>
                </TouchableOpacity>
              </View>
            </View>
          </TouchableWithoutFeedback>
        </Modal>

       
        <Modal visible={profileModalVisible} transparent>
          <TouchableWithoutFeedback onPress={() => setProfileModalVisible(false)}>
            <View style={styles.modalContainer}>
              <View style={styles.modalContent}>
                <Text style={styles.modalTitle}>Perfil atualizado!</Text>
              </View>
            </View>
          </TouchableWithoutFeedback>
        </Modal>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

export default AddUserScreen;
