import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, TouchableOpacity, Modal, StyleSheet,
  Switch, Alert, ScrollView, Platform,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Feather } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SafeAreaView } from 'react-native-safe-area-context';
import InputComponent from '../../components/InputComponent';
import FooterNavigation from '../../components/FooterNavigation';
import { useAuth } from '../../contexts/AuthContext';
import { adicionarMedicamento, editarMedicamento } from '../../services/medicService';
import { scheduleAlarms, cancelAlarmsForMedication } from '../../services/alarmService';

// ─── Constantes ──────────────────────────────────────────────────────────────

const TIPOS = ['Comprimido', 'Cápsula', 'Líquido', 'Gotas', 'Injetável', 'Pomada', 'Adesivo'];

const DURACAO_TIPOS = [
  { valor: 'dias',          label: 'Dias',         temQuantidade: true  },
  { valor: 'semanas',       label: 'Semanas',       temQuantidade: true  },
  { valor: 'meses',         label: 'Meses',         temQuantidade: true  },
  { valor: 'cronica',       label: 'Crônico',       temQuantidade: false },
  { valor: 'indeterminado', label: 'Indeterminado', temQuantidade: false },
];

const INTERVALOS = [2, 3, 4, 6, 8, 12];

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatarDuracao(tipo, valor) {
  if (!tipo) return null;
  const item = DURACAO_TIPOS.find(d => d.valor === tipo);
  if (!item) return null;
  if (item.temQuantidade && valor) return `${valor} ${item.label.toLowerCase()}`;
  return item.label;
}

function calcularHorarios(baseTime, intervaloHoras) {
  return Array.from({ length: 4 }, (_, i) => {
    const t = new Date(baseTime);
    t.setHours(t.getHours() + intervaloHoras * (i + 1));
    return t.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  });
}

/** Reconstrói um Date a partir de uma string "HH:MM" */
function horarioParaDate(str) {
  const d = new Date();
  if (!str) return d;
  const [hh, mm] = str.split(':').map(Number);
  if (!isNaN(hh) && !isNaN(mm)) d.setHours(hh, mm, 0, 0);
  return d;
}

// ─── Sub-componente: cabeçalho de seção ──────────────────────────────────────

const Secao = ({ titulo }) => (
  <View style={layout.secao}>
    <Text style={layout.secaoTitulo}>{titulo}</Text>
    <View style={layout.secaoDivisor} />
  </View>
);

// ─── Tela principal ──────────────────────────────────────────────────────────

const AddMedScreen = ({ route, navigation }) => {
  const { user } = useAuth();

  // Detecta modo edição
  const medicamentoExistente = route.params?.medicamento ?? null;
  const modoEdicao = !!medicamentoExistente;

  // Perfil ativo
  const [perfilId,   setPerfilId]   = useState(route.params?.perfilId   ?? medicamentoExistente?.perfil_id ?? null);
  const [perfilNome, setPerfilNome] = useState(route.params?.perfilNome ?? '');

  useEffect(() => {
    (async () => {
      if (perfilId) return;
      const storedId   = await AsyncStorage.getItem('perfilId');
      const storedNome = await AsyncStorage.getItem('perfilNome');
      if (storedId)   setPerfilId(storedId);
      if (storedNome) setPerfilNome(storedNome);
    })();
  }, [perfilId]);

  // ── Campos do formulário (pré-preenchidos no modo edição) ──────────────────
  const [nome,        setNome]        = useState(medicamentoExistente?.nome        ?? '');
  const [principio,   setPrincipio]   = useState(medicamentoExistente?.principio   ?? '');
  const [tipo,        setTipo]        = useState(medicamentoExistente?.tipo        ?? '');
  const [dose,        setDose]        = useState(medicamentoExistente?.dose        ?? '');
  const [unidade,     setUnidade]     = useState(medicamentoExistente?.unidade     ?? '');
  const [via,         setVia]         = useState(medicamentoExistente?.via         ?? 'oral');
  const [estoque,     setEstoque]     = useState(
    medicamentoExistente?.estoque != null ? String(medicamentoExistente.estoque) : ''
  );
  const [observacoes, setObservacoes] = useState(medicamentoExistente?.observacoes ?? '');

  // ── Duração ────────────────────────────────────────────────────────────────
  const [duracaoTipo,     setDuracaoTipo]     = useState(medicamentoExistente?.duracao_tipo  ?? '');
  const [duracaoValor,    setDuracaoValor]    = useState(
    medicamentoExistente?.duracao_valor != null ? String(medicamentoExistente.duracao_valor) : ''
  );
  const [duracaoTipoTemp, setDuracaoTipoTemp] = useState('');
  const duracaoItem = DURACAO_TIPOS.find(d => d.valor === duracaoTipoTemp);

  // ── Alarme ─────────────────────────────────────────────────────────────────
  // Reconstrói intervalo a partir de "4h"
  const intervaloInicial = modoEdicao
    ? (parseInt(medicamentoExistente?.frequencia ?? '4', 10) || 4)
    : 4;

  // Reconstrói horário base: primeiro horário da lista − intervalo
  const horariosIniciais = Array.isArray(medicamentoExistente?.horarios)
    ? medicamentoExistente.horarios
    : [];
  const baseInicial = horariosIniciais.length > 0
    ? (() => {
        const d = horarioParaDate(horariosIniciais[0]);
        d.setHours(d.getHours() - intervaloInicial);
        return d;
      })()
    : new Date();

  const [alarmEnabled,    setAlarmEnabled]    = useState(medicamentoExistente?.alarme ?? false);
  const [alarmTime,       setAlarmTime]       = useState(baseInicial);
  const [alarmInterval,   setAlarmInterval]   = useState(intervaloInicial);
  const [horariosPreview, setHorariosPreview] = useState(horariosIniciais);

  const [showTimePicker,   setShowTimePicker]   = useState(false);
  const [openTypeModal,    setOpenTypeModal]    = useState(false);
  const [openDuracaoModal, setOpenDuracaoModal] = useState(false);
  const [openAlarmModal,   setOpenAlarmModal]   = useState(false);
  const [loading,          setLoading]          = useState(false);

  // Recalcula preview toda vez que base/intervalo mudarem
  const atualizarPreview = useCallback((time, intervalo) => {
    setHorariosPreview(calcularHorarios(time, intervalo));
  }, []);

  useEffect(() => {
    if (openAlarmModal) atualizarPreview(alarmTime, alarmInterval);
  }, [alarmTime, alarmInterval, openAlarmModal, atualizarPreview]);

  // ── Duração: confirmar ─────────────────────────────────────────────────────
  const handleConfirmarDuracao = () => {
    if (!duracaoTipoTemp) { Alert.alert('Atenção', 'Selecione um tipo de duração.'); return; }
    if (duracaoItem?.temQuantidade && !duracaoValor.trim()) {
      Alert.alert('Atenção', 'Informe a quantidade.'); return;
    }
    setDuracaoTipo(duracaoTipoTemp);
    if (!duracaoItem?.temQuantidade) setDuracaoValor('');
    setOpenDuracaoModal(false);
  };

  // ── Time picker ────────────────────────────────────────────────────────────
  const handleTimeChange = (_, time) => {
    setShowTimePicker(Platform.OS === 'ios');
    if (time) setAlarmTime(time);
  };

  // ── Salvar ─────────────────────────────────────────────────────────────────
  const handleSave = async () => {
    if (!nome.trim()) { Alert.alert('Atenção', 'Informe o nome do medicamento.'); return; }
    if (!perfilId) {
      Alert.alert('Atenção', 'Selecione um perfil antes de continuar.');
      navigation.navigate('User');
      return;
    }
    if (alarmEnabled && horariosPreview.length === 0) {
      Alert.alert('Atenção', 'Configure os horários do alarme antes de salvar.');
      return;
    }

    setLoading(true);
    try {
      const duracaoItemFinal = DURACAO_TIPOS.find(d => d.valor === duracaoTipo);
      const dados = {
        nome:         nome.trim(),
        principio:    principio.trim(),
        tipo:         tipo || null,
        dose:         dose.trim(),
        unidade:      unidade.trim() || tipo || '',
        via:          via.trim(),
        estoque:      estoque ? parseInt(estoque, 10) : 0,
        observacoes:  observacoes.trim(),
        alarme:       alarmEnabled,
        frequencia:   alarmEnabled ? `${alarmInterval}h` : '',
        horarios:     alarmEnabled ? horariosPreview : [],
        duracao_tipo:  duracaoTipo || null,
        duracao_valor: duracaoTipo && duracaoItemFinal?.temQuantidade && duracaoValor
          ? parseInt(duracaoValor, 10)
          : null,
      };

      if (modoEdicao) {
        // ── Modo edição: atualiza medicamento existente ────────────────────
        await editarMedicamento(medicamentoExistente.id, dados);

        if (alarmEnabled) {
          // Cancela alarmes antigos e agenda novos
          await cancelAlarmsForMedication(medicamentoExistente.id);
          await scheduleAlarms(alarmTime, alarmInterval, nome.trim(), medicamentoExistente.id, perfilId, user?.id);
        } else {
          await cancelAlarmsForMedication(medicamentoExistente.id);
        }

        Alert.alert('Sucesso', 'Medicamento atualizado!', [
          { text: 'OK', onPress: () => navigation.navigate('Home', { perfilId, perfilNome }) },
        ]);
      } else {
        // ── Modo adição: cria novo medicamento ────────────────────────────
        const novo = await adicionarMedicamento(perfilId, dados, user?.id);

        if (alarmEnabled && novo?.id) {
          await scheduleAlarms(alarmTime, alarmInterval, nome.trim(), novo.id, perfilId, user?.id);
        }

        Alert.alert('Sucesso', 'Medicamento cadastrado!', [
          { text: 'OK', onPress: () => navigation.navigate('Home', { perfilId, perfilNome }) },
        ]);
      }
    } catch (error) {
      Alert.alert('Erro', error.message || 'Não foi possível salvar o medicamento.');
    } finally {
      setLoading(false);
    }
  };

  // ── Labels dinâmicos ───────────────────────────────────────────────────────
  const labelHorarios = alarmEnabled && horariosPreview.length > 0
    ? `${alarmInterval}h — ${horariosPreview.slice(0, 2).join(', ')}${horariosPreview.length > 2 ? '…' : ''}`
    : 'Configurar horários';

  const labelDuracao = formatarDuracao(duracaoTipo, duracaoValor) ?? 'Selecionar duração';

  // ─────────────────────────────────────────────────────────────────────────
  // RENDER
  // ─────────────────────────────────────────────────────────────────────────
  return (
    <SafeAreaView style={layout.screen} edges={['top']}>

      {/* Cabeçalho */}
      <View style={layout.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <Feather name="arrow-left" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={layout.headerText}>
          {modoEdicao ? 'Editar medicamento' : 'Novo medicamento'}
        </Text>
      </View>

      {/* Indicador de perfil */}
      {perfilNome ? (
        <View style={layout.perfilBar}>
          <Text style={layout.perfilBarTexto}>
            Perfil: <Text style={layout.perfilBarNome}>{perfilNome}</Text>
          </Text>
        </View>
      ) : null}

      <ScrollView
        contentContainerStyle={layout.scroll}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >

        {/* ── SEÇÃO 1: Identificação ─────────────────────────────────────── */}
        <Secao titulo="Identificação" />

        <InputComponent
          placeholder="Nome do medicamento *"
          value={nome}
          onChangeText={setNome}
          width={LARGURA}
          height={48}
          marginVertical={6}
        />
        <InputComponent
          placeholder="Princípio ativo / descrição"
          value={principio}
          onChangeText={setPrincipio}
          width={LARGURA}
          height={48}
          marginVertical={6}
        />

        {/* ── SEÇÃO 2: Forma e Dosagem ───────────────────────────────────── */}
        <Secao titulo="Forma e Dosagem" />

        {/* Tipo */}
        <TouchableOpacity
          style={comp.pickerRow}
          onPress={() => setOpenTypeModal(true)}
          activeOpacity={0.7}
        >
          <Text style={[comp.pickerText, !tipo && comp.pickerPlaceholder]}>
            {tipo || 'Forma farmacêutica (comprimido, líquido…)'}
          </Text>
          <Feather name="chevron-down" size={18} color="#999" />
        </TouchableOpacity>

        {/* Dose + Unidade lado a lado */}
        <View style={layout.row}>
          <InputComponent
            placeholder="Dose  (ex: 500)"
            value={dose}
            onChangeText={setDose}
            keyboardType="numeric"
            width={LARGURA / 2 - 6}
            height={48}
            marginVertical={6}
          />
          <InputComponent
            placeholder="Unidade  (mg, ml…)"
            value={unidade}
            onChangeText={setUnidade}
            width={LARGURA / 2 - 6}
            height={48}
            marginVertical={6}
          />
        </View>

        {/* ── SEÇÃO 3: Estoque ───────────────────────────────────────────── */}
        <Secao titulo="Controle de Estoque" />

        <InputComponent
          placeholder="Quantidade disponível em estoque"
          value={estoque}
          onChangeText={setEstoque}
          keyboardType="numeric"
          width={LARGURA}
          height={48}
          marginVertical={6}
        />

        {/* ── SEÇÃO 4: Duração do tratamento ────────────────────────────── */}
        <Secao titulo="Duração do Tratamento" />

        <TouchableOpacity
          style={comp.pickerRow}
          onPress={() => { setDuracaoTipoTemp(duracaoTipo); setOpenDuracaoModal(true); }}
          activeOpacity={0.7}
        >
          <Text style={[comp.pickerText, !duracaoTipo && comp.pickerPlaceholder]}>
            {labelDuracao}
          </Text>
          <Feather name="calendar" size={18} color="#999" />
        </TouchableOpacity>

        {/* ── SEÇÃO 5: Alarme e Lembretes ───────────────────────────────── */}
        <Secao titulo="Alarme e Lembretes" />

        <View style={comp.switchRow}>
          <View style={{ flex: 1 }}>
            <Text style={comp.switchLabel}>Habilitar alarme de doses</Text>
            <Text style={comp.switchSubLabel}>Receba lembretes nos horários configurados</Text>
          </View>
          <Switch
            value={alarmEnabled}
            onValueChange={setAlarmEnabled}
            trackColor={{ true: '#60A2AE', false: '#ccc' }}
            thumbColor={alarmEnabled ? '#2E7D8A' : '#f4f3f4'}
          />
        </View>

        {alarmEnabled ? (
          <TouchableOpacity
            style={comp.alarmBtn}
            onPress={() => { atualizarPreview(alarmTime, alarmInterval); setOpenAlarmModal(true); }}
            activeOpacity={0.8}
          >
            <Feather name="clock" size={18} color="#fff" />
            <Text style={comp.alarmBtnText} numberOfLines={1}>
              {'  '}{labelHorarios}
            </Text>
          </TouchableOpacity>
        ) : null}

        {/* ── SEÇÃO 6: Observações ──────────────────────────────────────── */}
        <Secao titulo="Observações (opcional)" />

        <InputComponent
          placeholder="Instruções especiais, reações, notas…"
          value={observacoes}
          onChangeText={setObservacoes}
          width={LARGURA}
          height={90}
          marginVertical={6}
          multiline
          textAlignVertical="top"
        />

        {/* ── Botões de ação ────────────────────────────────────────────── */}
        <View style={layout.acoes}>
          <TouchableOpacity
            style={[comp.btnPrimary, loading && { opacity: 0.6 }]}
            onPress={handleSave}
            disabled={loading}
            activeOpacity={0.8}
          >
            <Text style={comp.btnPrimaryText}>
              {loading
                ? 'Salvando…'
                : modoEdicao ? 'Salvar alterações' : 'Cadastrar medicamento'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={comp.btnGhost}
            onPress={() => navigation.goBack()}
            activeOpacity={0.7}
          >
            <Text style={comp.btnGhostText}>Cancelar</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      <FooterNavigation />

      {/* ── MODAL: Tipo do medicamento ──────────────────────────────────── */}
      <Modal transparent visible={openTypeModal} animationType="fade" onRequestClose={() => setOpenTypeModal(false)}>
        <View style={ms.overlay}>
          <View style={ms.card}>
            <Text style={ms.title}>Forma farmacêutica</Text>
            {TIPOS.map(t => (
              <TouchableOpacity
                key={t}
                style={[ms.optionRow, tipo === t && ms.optionRowActive]}
                onPress={() => { setTipo(t); setOpenTypeModal(false); }}
              >
                <Text style={[ms.optionText, tipo === t && ms.optionTextActive]}>{t}</Text>
                {tipo === t ? <Feather name="check" size={16} color="#60A2AE" /> : null}
              </TouchableOpacity>
            ))}
            <TouchableOpacity style={ms.btnGhostFull} onPress={() => setOpenTypeModal(false)}>
              <Text style={ms.btnGhostText}>Fechar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* ── MODAL: Duração do tratamento ───────────────────────────────── */}
      <Modal transparent visible={openDuracaoModal} animationType="fade" onRequestClose={() => setOpenDuracaoModal(false)}>
        <View style={ms.overlay}>
          <View style={ms.card}>
            <Text style={ms.title}>Duração do tratamento</Text>
            <Text style={ms.subtitle}>Por quanto tempo será usado este medicamento?</Text>

            <View style={ms.chips}>
              {DURACAO_TIPOS.map(d => (
                <TouchableOpacity
                  key={d.valor}
                  style={[ms.chip, duracaoTipoTemp === d.valor && ms.chipOn]}
                  onPress={() => { setDuracaoTipoTemp(d.valor); if (!d.temQuantidade) setDuracaoValor(''); }}
                >
                  <Text style={[ms.chipText, duracaoTipoTemp === d.valor && ms.chipTextOn]}>
                    {d.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {duracaoItem?.temQuantidade ? (
              <>
                <Text style={ms.inputLabel}>
                  Quantidade de {duracaoItem.label.toLowerCase()}:
                </Text>
                <InputComponent
                  placeholder="Ex: 14"
                  value={duracaoValor}
                  onChangeText={setDuracaoValor}
                  keyboardType="numeric"
                  width={260}
                  height={44}
                  marginVertical={6}
                />
              </>
            ) : duracaoTipoTemp === 'cronica' ? (
              <Text style={ms.hint}>
                Tratamento contínuo sem prazo definido, sujeito a revisão médica.
              </Text>
            ) : duracaoTipoTemp === 'indeterminado' ? (
              <Text style={ms.hint}>
                Duração ainda não definida pelo profissional de saúde.
              </Text>
            ) : null}

            <TouchableOpacity style={ms.btnPrimary} onPress={handleConfirmarDuracao}>
              <Text style={ms.btnPrimaryText}>Confirmar</Text>
            </TouchableOpacity>
            <TouchableOpacity style={ms.btnGhostFull} onPress={() => setOpenDuracaoModal(false)}>
              <Text style={ms.btnGhostText}>Cancelar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* ── MODAL: Configurar alarme ────────────────────────────────────── */}
      <Modal transparent visible={openAlarmModal} animationType="slide" onRequestClose={() => setOpenAlarmModal(false)}>
        <View style={ms.overlay}>
          <View style={[ms.card, { paddingBottom: 24 }]}>
            <Text style={ms.title}>Configurar alarme</Text>

            <Text style={ms.sectionLabel}>Horário da primeira dose:</Text>
            <TouchableOpacity style={ms.timeBtn} onPress={() => setShowTimePicker(true)}>
              <Text style={ms.timeText}>
                {alarmTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </Text>
              <Feather name="edit-2" size={14} color="#fff" style={{ marginLeft: 10 }} />
            </TouchableOpacity>

            {showTimePicker && (
              <DateTimePicker
                value={alarmTime}
                mode="time"
                display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                onChange={handleTimeChange}
              />
            )}

            <Text style={[ms.sectionLabel, { marginTop: 16 }]}>Repetir a cada:</Text>
            <View style={ms.intervalRow}>
              {INTERVALOS.map(v => (
                <TouchableOpacity
                  key={v}
                  style={[ms.intervalBtn, alarmInterval === v && ms.intervalBtnOn]}
                  onPress={() => setAlarmInterval(v)}
                >
                  <Text style={[ms.intervalText, alarmInterval === v && { color: '#fff' }]}>{v}h</Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={[ms.sectionLabel, { marginTop: 16 }]}>Lembretes gerados:</Text>
            <View style={ms.horariosRow}>
              {horariosPreview.map((h, i) => (
                <View key={i} style={ms.horarioBadge}>
                  <Text style={ms.horarioText}>{h}</Text>
                </View>
              ))}
            </View>

            <TouchableOpacity style={[ms.btnPrimary, { marginTop: 20 }]} onPress={() => setOpenAlarmModal(false)}>
              <Text style={ms.btnPrimaryText}>Confirmar horários</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

// ─── Constante de largura ─────────────────────────────────────────────────────
const LARGURA = 312;

// ─── Estilos de layout ────────────────────────────────────────────────────────
const layout = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#FAFAFA',
  },
  header: {
    backgroundColor: '#60A2AE',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
  },
  headerText: {
    color: '#fff',
    fontSize: 17,
    fontWeight: 'bold',
    marginLeft: 12,
    flex: 1,
  },
  perfilBar: {
    backgroundColor: '#EAF4F6',
    paddingVertical: 7,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#D0E8EC',
  },
  perfilBarTexto: {
    fontSize: 12,
    color: '#5A6B70',
  },
  perfilBarNome: {
    fontWeight: 'bold',
    color: '#2E7D8A',
  },
  scroll: {
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 130,
    alignItems: 'center',
  },
  row: {
    flexDirection: 'row',
    width: LARGURA,
    gap: 12,
  },
  secao: {
    width: LARGURA,
    marginTop: 22,
    marginBottom: 8,
  },
  secaoTitulo: {
    fontSize: 12,
    fontWeight: '700',
    color: '#2E7D8A',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 6,
  },
  secaoDivisor: {
    height: 1,
    backgroundColor: '#D0E8EC',
    borderRadius: 1,
  },
  acoes: {
    width: LARGURA,
    marginTop: 28,
    gap: 12,
  },
});

// ─── Estilos de componentes inline ───────────────────────────────────────────
const comp = StyleSheet.create({
  pickerRow: {
    width: LARGURA,
    height: 48,
    backgroundColor: '#F3F3F3',
    borderRadius: 24,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 18,
    justifyContent: 'space-between',
    marginVertical: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 1,
  },
  pickerText: {
    fontSize: 14,
    color: '#333',
    flex: 1,
    marginRight: 8,
  },
  pickerPlaceholder: {
    color: '#999',
  },
  switchRow: {
    width: LARGURA,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F3F3',
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginVertical: 6,
  },
  switchLabel: {
    fontSize: 14,
    color: '#333',
    fontWeight: '600',
  },
  switchSubLabel: {
    fontSize: 11,
    color: '#888',
    marginTop: 2,
  },
  alarmBtn: {
    width: LARGURA,
    height: 48,
    backgroundColor: '#60A2AE',
    borderRadius: 24,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 18,
    marginVertical: 6,
  },
  alarmBtnText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
    flex: 1,
  },
  btnPrimary: {
    backgroundColor: '#2E7D8A',
    borderRadius: 14,
    paddingVertical: 15,
    alignItems: 'center',
  },
  btnPrimaryText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  btnGhost: {
    borderWidth: 1.5,
    borderColor: '#60A2AE',
    borderRadius: 14,
    paddingVertical: 13,
    alignItems: 'center',
  },
  btnGhostText: {
    color: '#60A2AE',
    fontSize: 15,
    fontWeight: '600',
  },
});

// ─── Estilos dos modais ───────────────────────────────────────────────────────
const ms = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  card: {
    width: 320,
    backgroundColor: '#fff',
    borderRadius: 18,
    padding: 22,
    alignItems: 'center',
  },
  title: {
    fontSize: 17,
    fontWeight: 'bold',
    color: '#222',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 13,
    color: '#777',
    textAlign: 'center',
    marginBottom: 14,
  },
  optionRow: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 11,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  optionRowActive: {
    backgroundColor: '#F0F8FA',
    borderRadius: 8,
  },
  optionText: { fontSize: 15, color: '#333' },
  optionTextActive: { color: '#2E7D8A', fontWeight: '700' },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    marginVertical: 10,
    gap: 8,
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: '#60A2AE',
    margin: 3,
  },
  chipOn: { backgroundColor: '#60A2AE' },
  chipText: { color: '#60A2AE', fontSize: 13, fontWeight: '600' },
  chipTextOn: { color: '#fff' },
  inputLabel: { fontSize: 13, color: '#555', alignSelf: 'flex-start', marginBottom: 4 },
  hint: {
    fontSize: 12,
    color: '#777',
    textAlign: 'center',
    marginVertical: 10,
    lineHeight: 18,
  },
  btnPrimary: {
    backgroundColor: '#2E7D8A',
    borderRadius: 10,
    paddingVertical: 13,
    marginTop: 10,
    width: '100%',
    alignItems: 'center',
  },
  btnPrimaryText: { color: '#fff', fontWeight: 'bold', fontSize: 15 },
  btnGhostFull: {
    paddingVertical: 11,
    marginTop: 6,
    width: '100%',
    alignItems: 'center',
  },
  btnGhostText: { color: '#60A2AE', fontWeight: '600', fontSize: 14 },
  // Alarme
  sectionLabel: { fontSize: 13, color: '#555', fontWeight: '600', alignSelf: 'flex-start', marginBottom: 6 },
  timeBtn: {
    backgroundColor: '#2E7D8A',
    borderRadius: 12,
    paddingHorizontal: 28,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  timeText: { fontSize: 30, color: '#fff', fontWeight: 'bold', letterSpacing: 1.5 },
  intervalRow: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 8, marginTop: 2 },
  intervalBtn: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: '#60A2AE',
    margin: 3,
  },
  intervalBtnOn: { backgroundColor: '#60A2AE' },
  intervalText: { color: '#60A2AE', fontWeight: '700', fontSize: 14 },
  horariosRow: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 6, marginTop: 4 },
  horarioBadge: {
    backgroundColor: '#EAF4F6',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
    margin: 3,
  },
  horarioText: { color: '#2E7D8A', fontSize: 13, fontWeight: '600' },
});

export default AddMedScreen;
