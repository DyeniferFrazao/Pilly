import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity, Image, ScrollView,
  KeyboardAvoidingView, Platform, Modal, TouchableWithoutFeedback, Alert,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { AntDesign, FontAwesome } from '@expo/vector-icons';
import InputComponent from '../../components/InputComponent';
import styles from '../../style/styleadduser';
import { useAuth } from '../../contexts/AuthContext';
import { criarPerfil } from '../../services/profileService';

const AddUserScreen = ({ navigation }) => {
  const { user } = useAuth();
  const [image, setImage] = useState(null);
  const [nome, setNome] = useState('');
  const [bio, setBio] = useState('');
  const [imageModalVisible, setImageModalVisible] = useState(false);
  const [loading, setLoading] = useState(false);

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permissão negada', 'Precisamos de acesso à galeria.');
      return;
    }
    setImageModalVisible(true);
  };

  const launchGallery = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    if (!result.canceled) setImage(result.assets[0].uri);
    setImageModalVisible(false);
  };

  const launchCamera = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permissão negada', 'Precisamos de acesso à câmera.');
      return;
    }
    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    if (!result.canceled) setImage(result.assets[0].uri);
    setImageModalVisible(false);
  };

  const saveProfile = async () => {
    if (!nome.trim()) {
      Alert.alert('Atenção', 'Preencha o nome do perfil.');
      return;
    }

    setLoading(true);
    try {
      await criarPerfil(user.id, { nome: nome.trim(), bio: bio.trim(), foto_url: image });
      Alert.alert('Sucesso', 'Perfil adicionado!');
      navigation.goBack();
    } catch (error) {
      Alert.alert('Erro', error.message || 'Falha ao adicionar perfil.');
    } finally {
      setLoading(false);
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
            value={nome}
            onChangeText={setNome}
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

          <TouchableOpacity
            onPress={saveProfile}
            style={[styles.addButton, loading && { opacity: 0.6 }]}
            disabled={loading}
          >
            <Text style={styles.buttonText}>{loading ? 'Salvando...' : 'Adicionar'}</Text>
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
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

export default AddUserScreen;
