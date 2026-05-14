import React, { useState } from 'react';
import { View, Text, Image, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useFocusEffect } from '@react-navigation/native';
import { AntDesign } from '@expo/vector-icons';
import Card from '../../components/Card';
import FooterNavigation from '../../components/FooterNavigation';
import styles from '../../style/styleuser';
import { useAuth } from '../../contexts/AuthContext';
import { listarPerfis, excluirPerfil } from '../../services/profileService';

const UserScreen = () => {
  const navigation = useNavigation();
  const { user } = useAuth();
  const [perfis, setPerfis] = useState([]);

  useFocusEffect(
    React.useCallback(() => {
      if (!user) return;
      listarPerfis(user.id)
        .then(setPerfis)
        .catch(() => Alert.alert('Erro', 'Não foi possível carregar os perfis.'));
    }, [user])
  );

  const handleSelectProfile = (perfil) => {
    navigation.navigate('Home', { perfilId: perfil.id, perfilNome: perfil.nome });
  };

  const handleDelete = (perfilId) => {
    Alert.alert('Confirmar', 'Excluir este perfil?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Excluir',
        style: 'destructive',
        onPress: async () => {
          try {
            await excluirPerfil(perfilId);
            setPerfis(prev => prev.filter(p => p.id !== perfilId));
          } catch {
            Alert.alert('Erro', 'Não foi possível excluir o perfil.');
          }
        },
      },
    ]);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerText}>Perfil</Text>
      </View>

      <View style={styles.subHeader}>
        <Text style={styles.subHeaderText}>Perfis</Text>
      </View>

      <ScrollView contentContainerStyle={styles.cardContainer}>
        {perfis.map((perfil) => (
          <View style={styles.cardSpacing} key={perfil.id}>
            <Card>
              <TouchableOpacity onPress={() => handleSelectProfile(perfil)}>
                <View style={styles.cardContent}>
                  <View style={styles.iconContainer}>
                    <Image
                      style={styles.profileImage}
                      source={
                        perfil.foto_url
                          ? { uri: perfil.foto_url }
                          : require('../../../assets/icons/Perfil.png')
                      }
                    />
                    <Text style={styles.usernameText}>{perfil.nome}</Text>
                  </View>
                  {perfil.bio ? <Text style={styles.bioText}>{perfil.bio}</Text> : null}
                </View>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.deleteIcon}
                onPress={() => handleDelete(perfil.id)}
              >
                <AntDesign name="delete" size={24} color="#60A2AE" />
              </TouchableOpacity>
            </Card>
          </View>
        ))}
      </ScrollView>

      <TouchableOpacity
        style={styles.addButton}
        onPress={() => navigation.navigate('AddUser')}
      >
        <Text style={styles.addButtonText}>Adicionar perfil</Text>
      </TouchableOpacity>

      <FooterNavigation />
    </View>
  );
};

export default UserScreen;
