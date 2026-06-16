import React from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
} from 'react-native';
import { Feather } from '@expo/vector-icons';

/**
 * Modal in-app exibido quando uma notificação de medicamento chega
 * com o app em primeiro plano.
 *
 * Props:
 *  visible        {boolean}
 *  medicationName {string}
 *  onTomei        {() => void}
 *  onAdiar        {() => void}  – adia 10 min
 *  onDismiss      {() => void}  – fecha sem ação
 */
const MedicacaoAlertModal = ({
  visible,
  medicationName,
  onTomei,
  onAdiar,
  onDismiss,
}) => {
  return (
    <Modal
      transparent
      animationType="fade"
      visible={visible}
      onRequestClose={onDismiss}
      statusBarTranslucent
    >
      <View style={S.overlay}>
        <View style={S.card}>
          {/* Ícone e título */}
          <View style={S.iconWrap}>
            <Text style={S.emoji}>💊</Text>
          </View>

          <Text style={S.titulo}>Hora da medicação</Text>
          <Text style={S.subtitulo}>
            Lembre-se de tomar:
          </Text>
          <Text style={S.medNome}>{medicationName}</Text>

          {/* Botões de ação */}
          <View style={S.acoes}>
            {/* Adiar */}
            <TouchableOpacity
              style={[S.btn, S.btnAdiar]}
              onPress={onAdiar}
              activeOpacity={0.8}
            >
              <Feather name="clock" size={16} color="#1D6B78" />
              <Text style={[S.btnText, S.btnTextAdiar]}>Adiar 10 min</Text>
            </TouchableOpacity>

            {/* Tomei */}
            <TouchableOpacity
              style={[S.btn, S.btnTomei]}
              onPress={onTomei}
              activeOpacity={0.8}
            >
              <Feather name="check-circle" size={16} color="#fff" />
              <Text style={[S.btnText, S.btnTextTomei]}>Já tomei</Text>
            </TouchableOpacity>
          </View>

          {/* Fechar discreto */}
          <TouchableOpacity onPress={onDismiss} style={S.dismissBtn}>
            <Text style={S.dismissText}>Fechar</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const S = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 28,
  },
  card: {
    width: '100%',
    backgroundColor: '#fff',
    borderRadius: 24,
    paddingVertical: 32,
    paddingHorizontal: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.18,
    shadowRadius: 16,
    elevation: 12,
  },

  iconWrap: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#EAF5F7',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  emoji: { fontSize: 30 },

  titulo: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1A3A40',
    marginBottom: 6,
  },
  subtitulo: {
    fontSize: 13,
    color: '#7AABB5',
    marginBottom: 4,
  },
  medNome: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1D6B78',
    marginBottom: 28,
    textAlign: 'center',
  },

  acoes: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  btn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 13,
    borderRadius: 14,
  },
  btnAdiar: {
    backgroundColor: '#EAF5F7',
    borderWidth: 1,
    borderColor: '#C8EDF2',
  },
  btnTomei: {
    backgroundColor: '#1D6B78',
  },
  btnText: {
    fontSize: 14,
    fontWeight: '600',
  },
  btnTextAdiar: { color: '#1D6B78' },
  btnTextTomei: { color: '#fff' },

  dismissBtn: { marginTop: 18 },
  dismissText: { fontSize: 12, color: '#AABFC4' },
});

export default MedicacaoAlertModal;
