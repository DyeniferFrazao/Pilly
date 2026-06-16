import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity, Alert, StyleSheet,
  Image, TextInput, ScrollView, KeyboardAvoidingView, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import { Feather } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { atualizarPerfil, excluirPerfil } from '../../services/profileService';

// ─── Helpers ──────────────────────────────────────────────────────────────────
const iniciais = (nome = '') =>
  nome.trim().split(/\s+/).slice(0, 2).map(w => w[0]?.toUpperCase() ?? '').join('');

// ─── Tela ─────────────────────────────────────────────────────────────────────
const EditProfileScreen = ({ route, navigation }) => {
  const { profile } = route.params;

  const [nome,    setNome]    = useState(profile?.nome     ?? '');
  const [bio,     setBio]     = useState(profile?.bio      ?? '');
  const [fotoUrl, setFotoUrl] = useState(profile?.foto_url ?? null);
  const [saving,  setSaving]  = useState(false);

  // ── Selecionar imagem ──────────────────────────────────────────────────────
  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permissão negada', 'Precisamos de acesso à galeria.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    if (!result.canceled) setFotoUrl(result.assets[0].uri);
  };

  // ── Salvar ──────────────────────────────────────────────────────────────────
  const handleSave = async () => {
    if (!nome.trim()) {
      Alert.alert('Atenção', 'O nome é obrigatório.');
      return;
    }
    setSaving(true);
    try {
      const atualizado = await atualizarPerfil(profile.id, {
        nome: nome.trim(),
        bio: bio.trim(),
        foto_url: fotoUrl,
      });
      const ativoId = await AsyncStorage.getItem('perfilId');
      if (ativoId === profile.id) {
        await AsyncStorage.setItem('perfilNome', atualizado.nome);
      }
      Alert.alert('Salvo!', 'Perfil atualizado com sucesso.');
      navigation.goBack();
    } catch (err) {
      Alert.alert('Erro', err.message || 'Não foi possível salvar.');
    } finally {
      setSaving(false);
    }
  };

  // ── Excluir perfil ─────────────────────────────────────────────────────────
  const handleDelete = () => {
    Alert.alert(
      'Excluir perfil',
      `"${profile.nome}" será removido permanentemente.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Excluir',
          style: 'destructive',
          onPress: async () => {
            try {
              await excluirPerfil(profile.id);
              const ativoId = await AsyncStorage.getItem('perfilId');
              if (ativoId === profile.id) {
                await AsyncStorage.multiRemove(['perfilId', 'perfilNome']);
              }
              navigation.goBack();
            } catch (err) {
              Alert.alert('Erro', err.message || 'Não foi possível excluir.');
            }
          },
        },
      ]
    );
  };

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <SafeAreaView style={S.container} edges={['top']}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >

        {/* Header */}
        <View style={S.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} hitSlop={8}>
            <Feather name="arrow-left" size={22} color="#fff" />
          </TouchableOpacity>
          <Text style={S.headerTitle}>Editar Perfil</Text>
          <TouchableOpacity onPress={handleDelete} hitSlop={8}>
            <Feather name="trash-2" size={20} color="rgba(255,255,255,0.6)" />
          </TouchableOpacity>
        </View>

        <ScrollView
          contentContainerStyle={S.scroll}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >

          {/* Avatar */}
          <TouchableOpacity style={S.avatarSection} onPress={pickImage} activeOpacity={0.8}>
            {fotoUrl ? (
              <Image source={{ uri: fotoUrl }} style={S.avatarImg} />
            ) : (
              <View style={S.avatarFallback}>
                <Text style={S.avatarInitials}>{iniciais(nome || profile.nome)}</Text>
              </View>
            )}
            <View style={S.avatarEditBadge}>
              <Feather name="camera" size={12} color="#fff" />
            </View>
            <Text style={S.avatarHint}>Alterar foto</Text>
          </TouchableOpacity>

          {/* Formulário */}
          <View style={S.form}>
            <Text style={S.fieldLabel}>Nome</Text>
            <TextInput
              style={S.input}
              value={nome}
              onChangeText={setNome}
              placeholder="Nome do perfil"
              placeholderTextColor="#AAB5B8"
              returnKeyType="next"
            />

            <Text style={S.fieldLabel}>Bio <Text style={S.opcional}>(opcional)</Text></Text>
            <TextInput
              style={[S.input, S.inputMulti]}
              value={bio}
              onChangeText={setBio}
              placeholder="Uma breve descrição…"
              placeholderTextColor="#AAB5B8"
              multiline
              textAlignVertical="top"
              returnKeyType="done"
            />
          </View>

          {/* Botões */}
          <TouchableOpacity
            style={[S.btnPrimary, saving && { opacity: 0.6 }]}
            onPress={handleSave}
            disabled={saving}
          >
            <Text style={S.btnPrimaryText}>{saving ? 'Salvando…' : 'Salvar alterações'}</Text>
          </TouchableOpacity>

          <TouchableOpacity style={S.btnGhost} onPress={() => navigation.goBack()}>
            <Text style={S.btnGhostText}>Cancelar</Text>
          </TouchableOpacity>

          <TouchableOpacity style={S.btnDanger} onPress={handleDelete}>
            <Feather name="trash-2" size={15} color="#A32D2D" />
            <Text style={S.btnDangerText}>Excluir perfil</Text>
          </TouchableOpacity>

        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

// ─── Estilos ──────────────────────────────────────────────────────────────────
const S = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F0F4F8' },

  header: {
    backgroundColor: '#1D6B78',
    paddingHorizontal: 18,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerTitle: { fontSize: 17, fontWeight: '700', color: '#fff' },

  scroll: { paddingHorizontal: 20, paddingBottom: 40 },

  // Avatar
  avatarSection: { alignItems: 'center', paddingVertical: 28, position: 'relative' },
  avatarImg: { width: 90, height: 90, borderRadius: 45 },
  avatarFallback: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: '#C8EDF2',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarInitials: { fontSize: 32, fontWeight: 'bold', color: '#1D6B78' },
  avatarEditBadge: {
    position: 'absolute',
    bottom: 34,
    right: '38%',
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#1D6B78',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#F0F4F8',
  },
  avatarHint: { fontSize: 12, color: '#7AABB5', marginTop: 4 },

  // Formulário
  form: { marginBottom: 20 },
  fieldLabel: { fontSize: 12, fontWeight: '700', color: '#7AABB5', marginBottom: 6, marginLeft: 2 },
  opcional:   { fontWeight: '400', color: '#AAB5B8' },
  input: {
    backgroundColor: '#fff',
    borderRadius: 14,
    borderWidth: 0.5,
    borderColor: '#D5E8EA',
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 15,
    color: '#1A3A40',
    marginBottom: 16,
  },
  inputMulti: { height: 90, paddingTop: 12 },

  // Botões
  btnPrimary: {
    backgroundColor: '#1D6B78',
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    marginBottom: 10,
  },
  btnPrimaryText: { fontSize: 15, fontWeight: '700', color: '#fff' },

  btnGhost: {
    borderRadius: 14,
    paddingVertical: 13,
    alignItems: 'center',
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#D5E8EA',
    backgroundColor: '#fff',
  },
  btnGhostText: { fontSize: 15, fontWeight: '600', color: '#7AABB5' },

  btnDanger: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
  },
  btnDangerText: { fontSize: 14, fontWeight: '600', color: '#A32D2D' },
});

export default EditProfileScreen;
