import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import InputComponent from '../../components/InputComponent';
import { AntDesign } from 'react-native-vector-icons';
import styles from '../../style/styleEditProfile';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_URL } from '../../config';

const EditProfileScreen = ({ route }) => {
  const { profile } = route.params;
  const navigation = useNavigation();

  const [editedProfile, setEditedProfile] = useState(
    profile || { username: '', bio: '', medications: [], id: null }
  );
  const [saving, setSaving] = useState(false);

  // Função para salvar alterações no perfil (agora chama a API)
  const handleSave = async () => {
    if (!editedProfile.username || editedProfile.username.trim() === '') {
      Alert.alert('Erro', 'O nome de usuário é obrigatório.');
      return;
    }

    setSaving(true);

    try {
      const token = await AsyncStorage.getItem('token');
      const profileId = await AsyncStorage.getItem('profileId');

      if (!token || !profileId) {
        Alert.alert('Erro', 'Não foi possível localizar as informações de autenticação.');
        return;
      }

      const response = await fetch(`${API_URL}/profiles/update/${profileId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: editedProfile.username,
          bio: editedProfile.bio,
        }),
      });

      if (response.ok) {
        // Atualiza o nome no AsyncStorage para refletir em outras telas
        await AsyncStorage.setItem('name', editedProfile.username);
        Alert.alert('Sucesso', 'Perfil salvo com sucesso!');
        navigation.goBack();
      } else {
        const errorMessage = await response.text();
        Alert.alert('Erro', `Erro ao salvar o perfil: ${errorMessage}`);
      }
    } catch (error) {
      console.error('Erro ao salvar o perfil:', error);
      Alert.alert('Erro', 'Não foi possível salvar o perfil. Verifique sua conexão.');
    } finally {
      setSaving(false);
    }
  };

  // Função para cancelar edições no perfil
  const handleCancel = () => {
    Alert.alert(
      'Cancelar',
      'Tem certeza de que deseja cancelar as alterações?',
      [
        { text: 'Não', style: 'cancel' },
        { text: 'Sim', onPress: () => navigation.goBack() },
      ]
    );
  };

  // Função para excluir o perfil
  const handleDelete = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      const profileId = await AsyncStorage.getItem('profileId');

      if (!token || !profileId) {
        Alert.alert('Erro', 'Não foi possível localizar as informações do perfil ou autenticação.');
        return;
      }

      Alert.alert(
        'Excluir',
        'Tem certeza de que deseja excluir este perfil?',
        [
          { text: 'Não', style: 'cancel' },
          {
            text: 'Sim',
            style: 'destructive',
            onPress: async () => {
              try {
                const response = await fetch(`${API_URL}/profiles/delete/${profileId}`, {
                  method: 'DELETE',
                  headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                  },
                });

                if (response.ok) {
                  await AsyncStorage.removeItem('profileId');
                  Alert.alert('Sucesso', 'Perfil excluído com sucesso!');
                  navigation.goBack();
                } else {
                  const errorMessage = await response.text();
                  Alert.alert('Erro', `Erro ao excluir o perfil: ${errorMessage}`);
                }
              } catch (error) {
                console.error('Erro ao excluir o perfil:', error);
                Alert.alert('Erro', 'Não foi possível excluir o perfil.');
              }
            },
          },
        ]
      );
    } catch (error) {
      console.error('Erro ao acessar informações do AsyncStorage:', error);
      Alert.alert('Erro', 'Falha ao acessar informações locais.');
    }
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
        <View style={styles.formContainer}>
          <Text style={{ fontSize: 18, fontWeight: 'bold', color: '#000', fontFamily: 'System', marginBottom: 20 }}>
            Editar Informações
          </Text>

          <InputComponent
            style={styles.input}
            value={editedProfile.username}
            onChangeText={(text) =>
              setEditedProfile({ ...editedProfile, username: text })
            }
            placeholder="Nome de usuário"
          />

          <InputComponent
            style={styles.input}
            value={editedProfile.bio}
            onChangeText={(text) =>
              setEditedProfile({ ...editedProfile, bio: text })
            }
            placeholder="Bio"
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
