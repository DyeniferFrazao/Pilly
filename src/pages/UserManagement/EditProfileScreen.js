import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import InputComponent from '../../components/InputComponent';
import { AntDesign } from 'react-native-vector-icons';
import styles from '../../style/styleEditProfile';
import AsyncStorage from '@react-native-async-storage/async-storage';

const EditProfileScreen = ({ route }) => {
  const { profile } = route.params;
  const navigation = useNavigation();

  const [editedProfile, setEditedProfile] = useState(
    profile || { username: '', bio: '', medications: [], id: null }
  );

  // Função para salvar alterações no perfil
  const handleSave = () => {
    Alert.alert('Sucesso', 'Perfil salvo com sucesso!');
    navigation.goBack();
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
      // Obtém o token e profileId do AsyncStorage
      const token = await AsyncStorage.getItem('token');
      const profileId = await AsyncStorage.getItem('profileId');
      const apiIp = await AsyncStorage.getItem('apiIp');
  
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
            onPress: async () => {
              try {
                console.log('https://' + apiIp + '/profiles/delete/' + profileId)
                const response = await fetch('https://' + apiIp + '/profiles/delete/' + profileId, {
                  method: 'DELETE',
                  headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                  },
                });
  
                if (response.ok) {
                  Alert.alert('Sucesso', 'Perfil excluído com sucesso!');
                  navigation.goBack(); // Retorna à tela anterior
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
      {/* Cabeçalho com botão de voltar */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <AntDesign name="arrowleft" size={24} color="white" />
        </TouchableOpacity>
        <Text style={styles.headerText}>Editar Perfil</Text>
      </View>

      {/* Card centralizado para edição do perfil */}
      <View style={styles.card}>
        <View style={styles.formContainer}>
          {/* Título dentro do card */}
          <Text style={{ fontSize: 18, fontWeight: 'bold', color: '#000', fontFamily: 'System', marginBottom: 20 }}>
            Editar Informações
          </Text>

          {/* Input para o nome de usuário */}
          <InputComponent
            style={styles.input}
            value={editedProfile.username}
            onChangeText={(text) =>
              setEditedProfile({ ...editedProfile, username: text })
            }
            placeholder="Nome de usuário"
          />

          {/* Input para a bio */}
          <InputComponent
            style={styles.input}
            value={editedProfile.bio}
            onChangeText={(text) =>
              setEditedProfile({ ...editedProfile, bio: text })
            }
            placeholder="Bio"
          />

          

          {/* Botões de ação */}
          <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
            <Text style={styles.saveButtonText}>Salvar</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.cancelButton} onPress={handleCancel}>
            <Text style={styles.cancelButtonText}>Cancelar</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Botão Excluir Perfil fora do card */}
      <TouchableOpacity style={styles.deleteButton} onPress={handleDelete}>
        <Text style={styles.deleteButtonText}>Excluir Perfil</Text>
      </TouchableOpacity>
    </View>
  );
};

export default EditProfileScreen;
