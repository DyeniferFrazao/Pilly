import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity, Alert, StyleSheet,
  Image, TextInput, ScrollView, KeyboardAvoidingView, Platform, Modal,
  TouchableWithoutFeedback,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import { Feather } from '@expo/vector-icons';
import { useAuth } from '../../contexts/AuthContext';
import { criarPerfil } from '../../services/profileService';

// ─── Tela ─────────────────────────────────────────────────────────────────────
const AddUserScreen = ({ navigation }) => {
  const { user } = useAuth();

  const [image,       setImage]       = useState(null);
  const [nome,        setNome]        = useState('');
  const [bio,         setBio]         = useState('');
  const [loading,     setLoading]     = useState(false);
  const [modalFoto,   setModalFoto]   = useState(false);

  // ── Foto: galeria ──────────────────────────────────────────────────────────
  const launchGallery = async () => {
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
    setModalFoto(false);
    if (!result.canceled) setImage(result.assets[0].uri);
  };

  // ── Foto: câmera ───────────────────────────────────────────────────────────
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
    setModalFoto(false);
    if (!result.canceled) setImage(result.assets[0].uri);
  };

  // ── Salvar ──────────────────────────────────────────────────────────────────
  const handleSave = async () => {
    if (!nome.trim()) {
      Alert.alert('Atenção', 'Preencha o nome do perfil.');
      return;
    }
    setLoading(true);
    try {
      await criarPerfil(user.id, {
        nome: nome.trim(),
        bio: bio.trim(),
        foto_url: image,
      });
      navigation.goBack();
    } catch (err) {
      Alert.alert('Erro', err.message || 'Falha ao criar perfil.');
    } finally {
      setLoading(false);
    }
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
            <Feather name="x" size={22} color="#fff" />
          </TouchableOpacity>
          <Text style={S.headerTitle}>Novo Perfil</Text>
          <View style={{ width: 30 }} />
        </View>

        <ScrollView
          contentContainerStyle={S.scroll}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >

          {/* Seletor de foto */}
          <TouchableOpacity
            style={S.avatarSection}
            onPress={() => setModalFoto(true)}
            activeOpacity={0.8}
          >
            {image ? (
              <Image source={{ uri: image }} style={S.avatarImg} />
            ) : (
              <View style={S.avatarPlaceholder}>
                <Feather name="camera" size={30} color="#7AABB5" />
              </View>
            )}
            <Text style={S.avatarHint}>
              {image ? 'Trocar foto' : 'Adicionar foto'}
            </Text>
          </TouchableOpacity>

          {/* Formulário */}
          <View style={S.form}>
            <Text style={S.fieldLabel}>Nome do perfil</Text>
            <TextInput
              style={S.input}
              value={nome}
              onChangeText={setNome}
              placeholder="Ex: Maria, Vovô, João…"
              placeholderTextColor="#AAB5B8"
              returnKeyType="next"
              autoFocus
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

          {/* Botão criar */}
          <TouchableOpacity
            style={[S.btnPrimary, loading && { opacity: 0.6 }]}
            onPress={handleSave}
            disabled={loading}
          >
            <Feather name="user-plus" size={17} color="#fff" />
            <Text style={S.btnPrimaryText}>
              {loading ? 'Criando…' : 'Criar perfil'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity style={S.btnGhost} onPress={() => navigation.goBack()}>
            <Text style={S.btnGhostText}>Cancelar</Text>
          </TouchableOpacity>

        </ScrollView>
      </KeyboardAvoidingView>

      {/* Modal escolha de foto */}
      <Modal visible={modalFoto} transparent animationType="slide">
        <TouchableWithoutFeedback onPress={() => setModalFoto(false)}>
          <View style={S.modalOverlay}>
            <TouchableWithoutFeedback>
              <View style={S.modalCard}>
                <Text style={S.modalTitle}>Escolher foto</Text>

                <TouchableOpacity style={S.modalRow} onPress={launchGallery}>
                  <Feather name="image" size={20} color="#1D6B78" />
                  <Text style={S.modalRowText}>Escolher da galeria</Text>
                </TouchableOpacity>

                <View style={S.modalDivider} />

                <TouchableOpacity style={S.modalRow} onPress={launchCamera}>
                  <Feather name="camera" size={20} color="#1D6B78" />
                  <Text style={S.modalRowText}>Tirar foto</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={S.modalCancel}
                  onPress={() => setModalFoto(false)}
                >
                  <Text style={S.modalCancelText}>Cancelar</Text>
                </TouchableOpacity>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
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
  avatarSection: { alignItems: 'center', paddingVertical: 28 },
  avatarImg: { width: 90, height: 90, borderRadius: 45, marginBottom: 8 },
  avatarPlaceholder: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: '#EAF5F7',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#C8EDF2',
    borderStyle: 'dashed',
    marginBottom: 8,
  },
  avatarHint: { fontSize: 13, color: '#7AABB5' },

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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 10,
  },
  btnPrimaryText: { fontSize: 15, fontWeight: '700', color: '#fff' },

  btnGhost: {
    borderRadius: 14,
    paddingVertical: 13,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#D5E8EA',
    backgroundColor: '#fff',
  },
  btnGhostText: { fontSize: 15, fontWeight: '600', color: '#7AABB5' },

  // Modal
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  modalCard: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    paddingBottom: 36,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1A3A40',
    textAlign: 'center',
    marginBottom: 20,
  },
  modalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 14,
    paddingHorizontal: 4,
  },
  modalRowText: { fontSize: 15, color: '#1A3A40', fontWeight: '500' },
  modalDivider: { height: 0.5, backgroundColor: '#E8F0F2' },
  modalCancel: {
    marginTop: 14,
    alignItems: 'center',
    paddingVertical: 13,
    backgroundColor: '#F0F4F8',
    borderRadius: 14,
  },
  modalCancelText: { fontSize: 15, color: '#7AABB5', fontWeight: '600' },
});

export default AddUserScreen;
