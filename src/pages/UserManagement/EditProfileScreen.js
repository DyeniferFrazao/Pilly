import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Alert, Image } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import * as ImagePicker from 'expo-image-picker';
import { AntDesign, FontAwesome } from '@expo/vector-icons';
import InputComponent from '../../components/InputComponent';
import styles from '../../style/styleEditProfile';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { atualizarPerfil, excluirPerfil } from '../../services/profileService';

const EditProfileScreen = ({ route }) => {
  const { profile } = route.params;
  const navigation = useNavigation();

  const [nome, setNome] = useState(profile?.nome ?? '');
  const [bio, setBio] = useState(profile?.bio ?? '');
  const [fotoUrl, setFotoUrl] = useState(profile?.foto_url ?? null);
  const [saving, setSaving] = useState(false);

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permissão negada', 'Precisamos de acesso à galeria.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    if (!result.canceled) setFotoUrl(result.assets[0].uri);
  };

  const handleSave = async () => {
    if (!nome.trim()) {
      Alert.alert('Erro', 'O nome é obrigatório.');
      return;
    }

    setSaving(true);
    try {
      const atualizado = await atualizarPerfil(profile.id, {
        nome: nome.trim(),
        bio: bio.trim(),
        foto_url: fotoUrl,
      });

      // Atualiza AsyncStorage se este era o perfil ativo
      const perfilIdAtivo = await AsyncStorage.getItem('perfilId');
      if (perfilIdAtivo === profile.id) {
        await AsyncStorage.setItem('perfilNome', atualizado.nome);
      }

      Alert.alert('Sucesso', 'Perfil salvo com sucesso!');
      navigation.goBack();
    } catch (error) {
      Alert.alert('Erro', error.message || 'Não foi possível salvar o perfil.');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    Alert.alert('Cancelar', 'Tem certeza de que deseja cancelar as alterações?', [
      { text: 'Não', style: 'cancel' },
      { text: 'Sim', onPress: () => navigation.goBack() },
    ]);
  };

  const handleDelete = () => {
    Alert.alert('Excluir', 'Tem certeza de que deseja excluir este perfil?', [
      { text: 'Não', style: 'cancel' },
      {
        text: 'Sim',
        style: 'destructive',
        onPress: async () => {
          try {
            await excluirPerfil(profile.id);

            // Limpa AsyncStorage se era o perfil ativo
            const perfilIdAtivo = await AsyncStorage.getItem('perfilId');
            if (perfilIdAtivo === profile.id) {
              await AsyncStorage.multiRemove(['perfilId', 'perfilNome']);
            }

            Alert.alert('Sucesso', 'Perfil excluído com sucesso!');
            navigation.goBack();
          } catch (error) {
            Alert.alert('Erro', error.message || 'Não foi possível excluir o perfil.');
          }
        },
      },
    ]);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <AntDesign name="arrowleft" size={24} color="white" />
        </TouchableOpacity>
        <Text style={styles.headerText}>Editar Perfil</Text>
      </View>

      <View style={styles.card}>
        <TouchableOpacity onPress={pickImage} style={{ alignItems: 'center', marginBottom: 16 }}>
          {fotoUrl ? (
            <Image
              source={{ uri: fotoUrl }}
              style={{ width: 80, height: 80, borderRadius: 40 }}
            />
          ) : (
            <FontAwesome name="camera" size={48} color="#60A2AE" />
          )}
          <Text style={{ color: '#60A2AE', marginTop: 6, fontSize: 12 }}>Alterar foto</Text>
        </TouchableOpacity>

        <View style={styles.formContainer}>
          <Text style={{ fontSize: 18, fontWeight: 'bold', color: '#000', marginBottom: 20 }}>
            Editar Informações
          </Text>

          <InputComponent
            style={styles.input}
            value={nome}
            onChangeText={setNome}
            placeholder="Nome"
          />

          <InputComponent
            style={styles.input}
            value={bio}
            onChangeText={setBio}
            placeholder="Bio"
            multiline
            textAlignVertical="top"
          />

          <TouchableOpacity
            style={[styles.saveButton, saving && { opacity: 0.6 }]}
            onPress={handleSave}
            disabled={saving}
          >
            <Text style={styles.saveButtonText}>
              {saving ? 'Salvando...' : 'Salvar'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.cancelButton} onPress={handleCancel}>
            <Text style={styles.cancelButtonText}>Cancelar</Text>
          </TouchableOpacity>
        </View>
      </View>

      <TouchableOpacity style={styles.deleteButton} onPress={handleDelete}>
        <Text style={styles.deleteButtonText}>Excluir Perfil</Text>
      </TouchableOpacity>
    </View>
  );
};

export default EditProfileScreen;
