import React from 'react';
import {
  View, Text, Modal, TouchableOpacity,
  TouchableWithoutFeedback, Alert, Switch, ScrollView, StyleSheet,
} from 'react-native';
import { cancelAlarmsForMedication } from '../services/alarmService';
import { removerMedicamento } from '../services/medicService';

/** Converte duracao_tipo + duracao_valor para texto legível */
function formatarDuracao(tipo, valor) {
  if (!tipo) return null;
  const labels = {
    dias:          (v) => v ? `${v} dia${v > 1 ? 's' : ''}` : 'Dias',
    semanas:       (v) => v ? `${v} semana${v > 1 ? 's' : ''}` : 'Semanas',
    meses:         (v) => v ? `${v} ${v > 1 ? 'meses' : 'mês'}` : 'Meses',
    cronica:       ()  => 'Crônico (contínuo)',
    indeterminado: ()  => 'Indeterminado',
  };
  return labels[tipo]?.(valor) ?? null;
}

const ModalComponent = ({ visible, medication, onClose, navigation, onDelete, onRefresh, perfilNome }) => {
  if (!medication) return null;

  const horarios = Array.isArray(medication.horarios) ? medication.horarios : [];
  const duracaoTexto = formatarDuracao(medication.duracao_tipo, medication.duracao_valor);

  const handleDelete = () => {
    Alert.alert(
      'Excluir medicamento',
      `Deseja excluir "${medication.nome}"?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Excluir',
          style: 'destructive',
          onPress: async () => {
            try {
              await removerMedicamento(medication.id);
              await cancelAlarmsForMedication(medication.id);
              onClose();
              if (onDelete) onDelete(medication.id);
            } catch {
              Alert.alert('Erro', 'Não foi possível excluir o medicamento.');
            }
          },
        },
      ]
    );
  };

  const diasDesde = (dateStr) => {
    if (!dateStr) return null;
    const diff = Date.now() - new Date(dateStr).getTime();
    const dias = Math.floor(diff / (1000 * 60 * 60 * 24));
    if (dias < 30) return `${dias}d`;
    const meses = Math.floor(dias / 30);
    const restoDias = dias % 30;
    return restoDias > 0 ? `${meses}m e ${restoDias}d` : `${meses}m`;
  };

  return (
    <Modal
      transparent
      visible={visible}
      animationType="slide"
      onRequestClose={onClose}
    >
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={s.overlay}>
          <TouchableWithoutFeedback>
            <View style={s.card}>
              <ScrollView showsVerticalScrollIndicator={false}>
                <Text style={s.nome}>{medication.nome}</Text>

                {medication.dose ? (
                  <Text style={s.detalhe}>• {medication.dose}{medication.unidade ? ` ${medication.unidade}` : ''}</Text>
                ) : null}
                {medication.principio ? (
                  <Text style={s.detalhe}>• {medication.principio}</Text>
                ) : null}
                {medication.created_at ? (
                  <Text style={s.detalhe}>• Iniciado à {diasDesde(medication.created_at)}</Text>
                ) : null}
                {medication.estoque != null ? (
                  <Text style={s.destaque}>
                    • Restam <Text style={s.realce}>{medication.estoque} {medication.unidade || 'unidades'}</Text>
                  </Text>
                ) : null}
                {medication.observacoes ? (
                  <Text style={s.detalhe}>• {medication.observacoes}</Text>
                ) : null}

                {duracaoTexto ? (
                  <View style={s.duracaoRow}>
                    <Text style={s.duracaoLabel}>Duração do tratamento</Text>
                    <Text style={s.duracaoValor}>{duracaoTexto}</Text>
                  </View>
                ) : null}

                <View style={s.alarmRow}>
                  <Text style={s.label}>Habilitar Alarme</Text>
                  <Switch
                    value={horarios.length > 0}
                    disabled
                    trackColor={{ true: '#60A2AE' }}
                  />
                </View>

                {horarios.length > 0 ? (
                  <View style={s.horariosContainer}>
                    <Text style={s.label}>Horários por dia:</Text>
                    {horarios.map((h, i) => (
                      <Text key={i} style={s.horario}>
                        {i === 0 ? '✓ ' : '   '}{h}
                      </Text>
                    ))}
                  </View>
                ) : null}

                <TouchableOpacity
                  style={s.btnPrimary}
                  onPress={() => {
                    onClose();
                    navigation.navigate('AddMedScreen', {
                      perfilId:   medication.perfil_id,
                      perfilNome: perfilNome ?? '',
                    });
                  }}
                >
                  <Text style={s.btnPrimaryText}>Adicionar mais</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={s.btnSecondary}
                  onPress={() => {
                    onClose();
                    // Abre AddMedScreen em modo edição, com todos os dados pré-preenchidos
                    navigation.navigate('AddMedScreen', {
                      medicamento: medication,
                      perfilId:    medication.perfil_id,
                      perfilNome:  perfilNome ?? '',
                    });
                  }}
                >
                  <Text style={s.btnSecondaryText}>Editar</Text>
                </TouchableOpacity>

                <TouchableOpacity style={s.btnSecondary} onPress={handleDelete}>
                  <Text style={s.btnSecondaryText}>Excluir</Text>
                </TouchableOpacity>
              </ScrollView>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
};

const s = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.45)',
  },
  card: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 24,
    maxHeight: '80%',
  },
  nome: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#222',
    marginBottom: 12,
    textAlign: 'center',
  },
  detalhe: {
    fontSize: 14,
    color: '#444',
    marginBottom: 4,
  },
  destaque: {
    fontSize: 14,
    color: '#444',
    marginBottom: 4,
  },
  realce: {
    color: '#C25B8C',
    fontWeight: 'bold',
  },
  alarmRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 16,
    marginBottom: 8,
  },
  label: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
  },
  horariosContainer: {
    marginBottom: 16,
  },
  horario: {
    fontSize: 14,
    color: '#444',
    paddingLeft: 8,
    marginTop: 2,
  },
  btnPrimary: {
    backgroundColor: '#60A2AE',
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
    marginBottom: 10,
    marginTop: 8,
  },
  btnPrimaryText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 15,
  },
  btnSecondary: {
    borderWidth: 1,
    borderColor: '#60A2AE',
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
    marginBottom: 10,
  },
  btnSecondaryText: {
    color: '#60A2AE',
    fontWeight: 'bold',
    fontSize: 15,
  },
  duracaoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F0F8FA',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginTop: 8,
    marginBottom: 4,
  },
  duracaoLabel: {
    fontSize: 13,
    color: '#555',
    fontWeight: '600',
  },
  duracaoValor: {
    fontSize: 13,
    color: '#2E7D8A',
    fontWeight: 'bold',
  },
});

export default ModalComponent;
