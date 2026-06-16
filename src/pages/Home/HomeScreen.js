import React, { useState, useCallback, useRef } from 'react';
import {
  View, Text, ScrollView, Alert, Modal,
  TouchableOpacity, StyleSheet,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import FooterNavigation from '../../components/FooterNavigation';
import AvatarComponent from '../../components/AvatarComponent';
import { useAuth } from '../../contexts/AuthContext';
import {
  listarMedicamentos,
  removerMedicamento,
  buscarDosesHoje,
  registrarDose,
} from '../../services/medicService';
import { cancelAlarmsForMedication } from '../../services/alarmService';
import { garantirPerfilPadrao } from '../../services/profileService';
import {
  sincronizarGamificacao,
  sincronizarLeaderboard,
  buscarLeaderboard,
  buscarAdesaoSemana,
  buscarPresencaAnonima,
  TODOS_BADGES,
} from '../../services/gamificationService';
import {
  calcularPillyScore,
  getNivel,
  getProximoNivel,
  buscarProximasConquistas,
  verificarEDesbloquearConquistas,
  buscarAvatarEquipado,
  sincronizarAvatarLeaderboard,
} from '../../services/avatarService';

// ─── Paleta de cores para perfis (por posição no ranking) ─────────────────────
const COR_PERFIS = ['#1D6B78', '#D4537E', '#BA7517', '#7F77DD', '#3B6D11'];
const BG_PERFIS  = ['#C8EDF2', '#F4C0D1', '#FAC775', '#CECBF6', '#C0DD97'];

// ─── Helpers ──────────────────────────────────────────────────────────────────
const iniciais = (nome = '') =>
  nome.trim().split(/\s+/).slice(0, 2).map((w) => w[0]?.toUpperCase() ?? '').join('');

const saudacao = () => {
  const h = new Date().getHours();
  if (h < 12) return 'Bom dia';
  if (h < 18) return 'Boa tarde';
  return 'Boa noite';
};

const mensagemProgresso = (pct) => {
  if (pct === 0)  return 'Comece o dia! Sua 1ª dose te espera 💊';
  if (pct < 0.5)  return 'Bom começo! Continue assim 💪';
  if (pct < 1)    return 'Quase lá! Não deixe a sequência cair ⭐';
  return 'Missão cumprida! Todas as doses de hoje ✅';
};

const DIAS_SEMANA = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

// ─── Componente: Anel de progresso (puro View, sem SVG) ───────────────────────
/**
 * Técnica dos dois semi-círculos:
 *  - right clip: mostra de 0% a 50%
 *  - left clip:  mostra de 50% a 100%
 */
const AnelProgresso = ({ tomadas, total, size = 80 }) => {
  const strokeWidth = 9;
  const pct  = total > 0 ? Math.min(tomadas / total, 1) : 0;
  const half = size / 2;
  const innerSize = size - strokeWidth * 2;

  // right half: -180 → 0 deg enquanto pct vai de 0 → 0.5
  const rightRot = -180 + Math.min(pct, 0.5) * 360;
  // left half:  0 → 180 deg enquanto pct vai de 0.5 → 1
  const leftRot  = Math.max(pct - 0.5, 0) * 360;

  const fillColor = pct > 0 ? '#1D6B78' : 'transparent';

  return (
    <View style={{ width: size, height: size }}>
      {/* Trilha cinza */}
      <View
        style={{
          position: 'absolute', width: size, height: size,
          borderRadius: half, borderWidth: strokeWidth, borderColor: '#DFF0F3',
        }}
      />

      {/* Semi-círculo direito (0%–50%) */}
      <View
        style={{
          position: 'absolute', width: half, height: size,
          right: 0, overflow: 'hidden',
        }}
      >
        <View
          style={{
            position: 'absolute', left: -half, width: size, height: size,
            borderRadius: half, borderWidth: strokeWidth, borderColor: fillColor,
            transform: [{ rotate: `${rightRot}deg` }],
          }}
        />
      </View>

      {/* Semi-círculo esquerdo (50%–100%) */}
      {pct > 0.5 && (
        <View
          style={{
            position: 'absolute', width: half, height: size,
            left: 0, overflow: 'hidden',
          }}
        >
          <View
            style={{
              position: 'absolute', right: -half, width: size, height: size,
              borderRadius: half, borderWidth: strokeWidth, borderColor: '#1D6B78',
              transform: [{ rotate: `${leftRot}deg` }],
            }}
          />
        </View>
      )}

      {/* Buraco interno (donut) */}
      <View
        style={{
          position: 'absolute',
          top: strokeWidth, left: strokeWidth,
          width: innerSize, height: innerSize,
          borderRadius: innerSize / 2,
          backgroundColor: '#FFFFFF',
          justifyContent: 'center', alignItems: 'center',
        }}
      >
        <Text style={S.anel_contagem}>{tomadas}/{total}</Text>
        <Text style={S.anel_sub}>doses</Text>
      </View>
    </View>
  );
};

// ─── Modal de detalhe do medicamento (inline, substituindo ModalComponent) ────
const MedDetailModal = ({ visible, medication: med, onClose, navigation, onDelete, onRefresh, perfilNome }) => {
  if (!med) return null;

  const doseStr     = med.dose ? `${med.dose}${med.unidade ? ' ' + med.unidade : ''}` : null;
  const horasStr    = Array.isArray(med.horarios) && med.horarios.length > 0 ? med.horarios.join(' · ') : null;
  const duracaoStr  = med.duracao_tipo || null;

  const handleEdit = () => {
    onClose();
    navigation.navigate('AddMedScreen', { medicamento: med, perfilNome });
  };

  const confirmDelete = () => {
    Alert.alert(
      'Remover medicamento',
      `Deseja remover "${med.nome}"? Os alarmes também serão cancelados.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Remover', style: 'destructive', onPress: () => onDelete(med.id) },
      ]
    );
  };

  return (
    <Modal transparent animationType="slide" visible={visible} onRequestClose={onClose}>
      <TouchableOpacity style={md.overlay} activeOpacity={1} onPress={onClose}>
        <TouchableOpacity activeOpacity={1} style={md.sheet}>
          <View style={md.handle} />

          {/* Nome + tipo */}
          <Text style={md.nome}>{med.nome}</Text>
          {med.tipo ? <Text style={md.tipo}>{med.tipo}</Text> : null}

          {/* Linha de infos */}
          <View style={md.infoBox}>
            {doseStr  && <InfoPill icon="package"  label={doseStr} />}
            {horasStr && <InfoPill icon="clock"     label={horasStr} />}
            {med.via  && <InfoPill icon="navigation" label={med.via} />}
            {duracaoStr && <InfoPill icon="calendar" label={duracaoStr} />}
          </View>

          {med.principio ? (
            <Text style={md.principio}>{med.principio}</Text>
          ) : null}

          {med.observacoes ? (
            <View style={md.obsBox}>
              <Feather name="info" size={13} color="#7AABB5" />
              <Text style={md.obs}>{med.observacoes}</Text>
            </View>
          ) : null}

          {/* Ações */}
          <View style={md.actions}>
            <TouchableOpacity style={md.btnEdit} onPress={handleEdit} activeOpacity={0.8}>
              <Feather name="edit-2" size={15} color="#1D6B78" />
              <Text style={md.btnEditText}>Editar</Text>
            </TouchableOpacity>
            <TouchableOpacity style={md.btnDelete} onPress={confirmDelete} activeOpacity={0.8}>
              <Feather name="trash-2" size={15} color="#C0392B" />
              <Text style={md.btnDeleteText}>Remover</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity style={md.btnClose} onPress={onClose}>
            <Text style={md.btnCloseText}>Fechar</Text>
          </TouchableOpacity>
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  );
};

const InfoPill = ({ icon, label }) => (
  <View style={md.pill}>
    <Feather name={icon} size={12} color="#1D6B78" />
    <Text style={md.pillText}>{label}</Text>
  </View>
);

const md = StyleSheet.create({
  overlay:  { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'flex-end' },
  sheet:    { backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20, paddingBottom: 36, gap: 10 },
  handle:   { width: 40, height: 4, backgroundColor: '#D5E8EA', borderRadius: 2, alignSelf: 'center', marginBottom: 6 },
  nome:     { fontSize: 18, fontWeight: '800', color: '#1A3A40' },
  tipo:     { fontSize: 13, color: '#7AABB5', marginTop: -4 },
  infoBox:  { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 4 },
  pill:     { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: '#EAF5F7', borderRadius: 20, paddingHorizontal: 10, paddingVertical: 5 },
  pillText: { fontSize: 12, color: '#1D6B78', fontWeight: '600' },
  principio:{ fontSize: 13, color: '#4A6B70', fontStyle: 'italic' },
  obsBox:   { flexDirection: 'row', alignItems: 'flex-start', gap: 6, backgroundColor: '#F7FBFC', borderRadius: 10, padding: 10 },
  obs:      { fontSize: 12, color: '#7AABB5', flex: 1 },
  actions:  { flexDirection: 'row', gap: 10, marginTop: 6 },
  btnEdit:  { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, backgroundColor: '#EAF5F7', borderRadius: 14, paddingVertical: 13 },
  btnEditText:   { fontSize: 14, fontWeight: '700', color: '#1D6B78' },
  btnDelete:     { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, backgroundColor: '#FCEBEB', borderRadius: 14, paddingVertical: 13 },
  btnDeleteText: { fontSize: 14, fontWeight: '700', color: '#C0392B' },
  btnClose:      { alignItems: 'center', paddingVertical: 10 },
  btnCloseText:  { fontSize: 14, color: '#7AABB5', fontWeight: '600' },
});

// ─── Componente: Card de usuário na arena ────────────────────────────────────
const iniciaisArena = (apelido = '') =>
  apelido.trim().split(/\s+/).slice(0, 2).map((w) => w[0]?.toUpperCase() ?? '').join('');

const ArenaCard = ({ usuario, posicao, euSou }) => {
  const idx    = Math.min(posicao - 1, COR_PERFIS.length - 1);
  const cor    = COR_PERFIS[idx];
  const bgCor  = BG_PERFIS[idx];
  const barPct = Math.min(Math.round((usuario.xp / 1000) * 100), 100);

  const rankBg =
    posicao === 1 ? '#FAC775' :
    posicao === 2 ? '#D3D1C7' :
    posicao === 3 ? '#F5C4B3' : '#EEEDFE';
  const rankColor =
    posicao === 1 ? '#633806' :
    posicao === 2 ? '#2C2C2A' :
    posicao === 3 ? '#712B13' : '#3C3489';

  // Sempre monta o objeto de avatar (com defaults) para garantir renderização
  const avatarEquipado = {
    roupa:   usuario.roupa_equipada   ?? 'shirt_green',
    cabelo:  usuario.cabelo_equipado  ?? 'hair_default',
    chapeu:  usuario.chapeu_equipado  ?? null,
    pet:     usuario.pet_equipado     ?? null,
    moldura: usuario.moldura_equipada ?? null,
  };

  return (
    <View style={[arena.card, euSou && arena.cardAtivo]}>
      {posicao === 1 && (
        <View style={arena.coroaWrap}>
          <Feather name="award" size={14} color="#c8a020" />
        </View>
      )}
      {euSou && <Text style={arena.ativoBadge}>você</Text>}

      {/* Avatar sempre renderizado com AvatarComponent */}
      <View style={[arena.avatarBox, { borderColor: `${cor}40` }]}>
        <AvatarComponent
          equipado={avatarEquipado}
          size="sm"
          showPet={false}
          showFrame={false}
        />
      </View>

      <Text style={arena.nome} numberOfLines={1}>{usuario.apelido}</Text>

      {/* Barra de XP */}
      <View style={arena.miniBarBg}>
        <View style={[arena.miniBarFill, { width: `${barPct}%`, backgroundColor: cor }]} />
      </View>

      <View style={arena.xpRow}>
        <Feather name="zap" size={10} color={cor} />
        <Text style={[arena.pct, { color: cor }]}> {usuario.xp} XP</Text>
      </View>

      {usuario.streak > 0 && (
        <View style={arena.streakRow}>
          <Feather name="trending-up" size={9} color="#AAB5B8" />
          <Text style={arena.streak}> {usuario.streak}d</Text>
        </View>
      )}

      <View style={[arena.rankBadge, { backgroundColor: rankBg }]}>
        <Text style={[arena.rankText, { color: rankColor }]}>{posicao}°</Text>
      </View>
    </View>
  );
};

// ─── Componente: Presença anônima ─────────────────────────────────────────────
const PresencaAnonima = ({ count }) => {
  if (!count || count === 0) return null;
  return (
    <View style={pres.card}>
      <View style={pres.pulseWrap}>
        <View style={pres.pulseOuter} />
        <View style={pres.pulseDot} />
      </View>
      <Text style={pres.texto}>
        <Text style={pres.destaque}>{count} </Text>
        {count === 1 ? 'dose registrada' : 'doses registradas'} na última hora
      </Text>
    </View>
  );
};

// ─── Componente: Calendário semanal ──────────────────────────────────────────
const CalendarioSemana = ({ dados }) => (
  <View style={cal.row}>
    {dados.map((dia, i) => {
      const label = DIAS_SEMANA[dia.date.getDay()];
      const st    = dia.status;

      return (
        <View key={i} style={cal.col}>
          <Text style={cal.label}>{label}</Text>

          <View
            style={[
              cal.dot,
              st === 'full'    ? cal.dotFull    :
              st === 'partial' ? cal.dotPartial :
              st === 'today'   ? cal.dotToday   :
                                 cal.dotMiss,
            ]}
          >
            {st === 'full'    && <Feather name="check" size={11} color="#fff" />}
            {st === 'partial' && <Text style={cal.halfText}>½</Text>}
            {st === 'miss'    && <Text style={cal.missText}>–</Text>}
            {st === 'today'   && <Text style={cal.todayText}>{'hj'}</Text>}
          </View>
        </View>
      );
    })}
  </View>
);

// ─── Componente: Item de missão (medicamento do dia) ─────────────────────────
const CORES_MISSAO = ['#1D6B78', '#D4537E', '#BA7517', '#7F77DD', '#3B6D11'];
const BG_MISSAO    = ['#C8EDF2', '#F4C0D1', '#FAC775', '#CECBF6', '#C0DD97'];

/** Retorna o próximo horário pendente (string HH:MM) dado quantas doses já foram tomadas */
const proximoHorario = (horarios, dosesTomadas) => {
  if (!Array.isArray(horarios) || horarios.length === 0) return null;
  const sorted = [...horarios].sort(); // HH:MM sort alfabético = cronológico
  const i = Math.min(dosesTomadas, sorted.length - 1);
  return sorted[i];
};

const MissaoItem = ({ med, idx, dosesTomadas, onPress, onCheck, onNaoTomado }) => {
  const cor = CORES_MISSAO[idx % CORES_MISSAO.length];
  const bg  = BG_MISSAO[idx % BG_MISSAO.length];

  const total       = Math.max(1, med.horarios?.length ?? 0);
  const todosFeitos = dosesTomadas >= total;
  const proximo     = proximoHorario(med.horarios, dosesTomadas);
  const doseStr     = med.dose ? `${med.dose}${med.unidade ? ' ' + med.unidade : ''}` : null;

  const subText = [
    doseStr,
    !todosFeitos && proximo ? `próximo: ${proximo}` : null,
    `${Math.min(dosesTomadas, total)}/${total}`,
  ].filter(Boolean).join(' · ');

  return (
    <TouchableOpacity
      style={[miss.item, todosFeitos && miss.itemTomado]}
      onPress={onPress}
      onLongPress={() => {
        if (todosFeitos) return;
        Alert.alert(med.nome, 'O que deseja fazer?', [
          { text: 'Cancelar', style: 'cancel' },
          { text: 'Não tomei (pular)', onPress: onNaoTomado, style: 'destructive' },
        ]);
      }}
      activeOpacity={0.75}
    >
      {/* Ícone */}
      <View style={[miss.icone, { backgroundColor: bg }]}>
        <Feather name="package" size={16} color={cor} />
      </View>

      {/* Textos */}
      <View style={miss.info}>
        <Text style={miss.nome}>{med.nome}</Text>
        <Text style={miss.sub} numberOfLines={1}>{subText}</Text>
      </View>

      {/* Checkbox — toque separado para registrar dose sem abrir o modal */}
      <TouchableOpacity
        onPress={onCheck}
        hitSlop={10}
        activeOpacity={0.7}
        disabled={todosFeitos}
        style={[miss.check, todosFeitos && { backgroundColor: cor, borderColor: cor }]}
      >
        {todosFeitos && <Feather name="check" size={12} color="#fff" />}
      </TouchableOpacity>
    </TouchableOpacity>
  );
};

// Mapeia o id da conquista para um ícone Feather + cor
const conquistaIcone = (id = '') => {
  if (id.startsWith('streak'))    return { name: 'zap',        color: '#E25822' };
  if (id.startsWith('doses'))     return { name: 'layers',     color: '#1D6B78' };
  if (id.startsWith('adherence')) return { name: 'star',       color: '#c8a020' };
  if (id.startsWith('rank'))      return { name: 'award',      color: '#c8a020' };
  if (id.startsWith('mes'))       return { name: 'shield',     color: '#2d7a55' };
  if (id.startsWith('night'))     return { name: 'moon',       color: '#5540c8' };
  if (id === 'starter')           return { name: 'package',    color: '#1D6B78' };
  return { name: 'target', color: '#BA7517' };
};

// ─── Componente: Card de próxima conquista ────────────────────────────────────
const ProximaConquistaCard = ({ conquista }) => {
  const { progresso, pct } = conquista;
  const icone = conquistaIcone(conquista.id);
  return (
    <View style={prox.card}>
      <View style={[prox.iconWrap, { backgroundColor: `${icone.color}18` }]}>
        <Feather name={icone.name} size={20} color={icone.color} />
      </View>
      <Text style={prox.nome} numberOfLines={2}>{conquista.nome}</Text>
      <Text style={prox.desc} numberOfLines={2}>{conquista.desc}</Text>
      <View style={prox.barBg}>
        <View style={[prox.barFill, { width: `${Math.round(pct)}%` }]} />
      </View>
      <Text style={prox.pct}>{progresso.atual}/{progresso.total}</Text>
      <Text style={prox.recompensa}>→ desbloqueio</Text>
    </View>
  );
};

// ─── Componente: Badge de conquista ──────────────────────────────────────────
const BadgeItem = ({ badge, earned }) => (
  <View style={bdg.item}>
    <View style={[bdg.circulo, earned ? bdg.earned : bdg.locked]}>
      <Feather
        name={badge.featherIcon}
        size={20}
        color={earned ? badge.iconColor : '#AAB5B8'}
      />
    </View>
    <Text style={bdg.label} numberOfLines={2}>{badge.label}</Text>
  </View>
);

// ─── Tela principal ───────────────────────────────────────────────────────────
const HomeScreen = ({ navigation, route }) => {
  const { user } = useAuth();

  // ── Estado ────────────────────────────────────────────────────────────────────
  const [perfilId,   setPerfilId]   = useState(null);
  const [perfilNome, setPerfilNome] = useState('');

  const [medicamentos,        setMedicamentos]        = useState([]);
  const [loading,             setLoading]             = useState(true);
  const [modalVisible,        setModalVisible]        = useState(false);
  const [selectedMedication,  setSelectedMedication]  = useState(null);

  const [dosesTomadas,   setDosesTomadas]   = useState(0);
  const [dosesTotal,     setDosesTotal]     = useState(0);
  const [dosesHojeMap,   setDosesHojeMap]   = useState({});  // { [medicamento_id]: countTomadas }

  const [gamificacao,       setGamificacao]       = useState(null);
  const [arenaData,         setArenaData]         = useState([]);   // usuários do leaderboard
  const [presencaCount,     setPresencaCount]     = useState(0);
  const [calendarioData,    setCalendarioData]    = useState([]);
  const [missionsY,         setMissionsY]         = useState(0);
  const [proximasConquistas,setProximasConquistas]= useState([]);

  const scrollRef    = useRef(null);
  const hasLoadedRef = useRef(false); // evita flicker em refetches

  // ── Fetch principal ────────────────────────────────────────────────────────────
  const fetchDados = useCallback(async () => {
    if (!user) return;
    if (!hasLoadedRef.current) setLoading(true); // loading só na 1ª carga
    try {
      // Garante perfil único por conta (cria se não existir)
      const perfil = await garantirPerfilPadrao(user.id, user.email ?? '');
      setPerfilId(perfil.id);
      setPerfilNome(perfil.nome);
      // Persiste para outras telas (MedicamentosScreen, AddMedScreen, etc.)
      await AsyncStorage.setItem('perfilId', perfil.id ?? '');
      await AsyncStorage.setItem('perfilNome', perfil.nome ?? '');

      // Dados principais em paralelo
      const [meds, dosesHoje, gam] = await Promise.all([
        listarMedicamentos(perfil.id),
        buscarDosesHoje(perfil.id),
        sincronizarGamificacao(user.id, perfil.id),
      ]);

      setMedicamentos(meds);
      setGamificacao(gam);

      // Atualiza o leaderboard público deste usuário (+ avatar em background)
      // Prioridade: username cadastrado → nome do perfil → prefixo do e-mail
      const apelido =
        user.user_metadata?.username ||
        perfil.nome ||
        user.email?.split('@')[0] ||
        'Usuário';
      sincronizarLeaderboard(user.id, gam, apelido);
      buscarAvatarEquipado(user.id).then((av) => {
        if (av) sincronizarAvatarLeaderboard(user.id, av);
      }).catch(() => {});

      // Progresso de hoje
      const totalProg = meds.reduce((acc, m) => acc + (Array.isArray(m.horarios) ? m.horarios.length : 0), 0);
      const tomadas   = (dosesHoje ?? []).filter((d) => d.status === 'tomado').length;
      setDosesTotal(totalProg);
      setDosesTomadas(tomadas);

      // Mapa de quantas doses foram tomadas hoje por medicamento
      const mapaHoje = {};
      for (const d of dosesHoje ?? []) {
        if (d.status === 'tomado') {
          mapaHoje[d.medicamento_id] = (mapaHoje[d.medicamento_id] ?? 0) + 1;
        }
      }
      setDosesHojeMap(mapaHoje);

      // Calendário + leaderboard de usuários + presença — em paralelo
      const [calendario, leaderboard, presenca] = await Promise.all([
        buscarAdesaoSemana(perfil.id, meds),
        buscarLeaderboard(),
        buscarPresencaAnonima(),
      ]);

      setCalendarioData(calendario);
      setArenaData(leaderboard);
      setPresencaCount(presenca);

      // Busca próximas conquistas + verifica desbloqueios
      const rankPos = leaderboard.findIndex((u) => u.user_id === user.id) + 1 || 999;
      const [proximas] = await Promise.all([
        buscarProximasConquistas(user.id, gam, { rankPosition: rankPos }, 3),
        verificarEDesbloquearConquistas(user.id, gam, { rankPosition: rankPos }),
      ]);
      setProximasConquistas(proximas);

    } catch {
      Alert.alert('Erro', 'Não foi possível carregar os dados.');
    } finally {
      setLoading(false);
      hasLoadedRef.current = true;
    }
  }, [user]);

  // ── Focus effect ──────────────────────────────────────────────────────────────
  useFocusEffect(
    useCallback(() => {
      fetchDados();

      // Scroll para missões se o botão central da nav foi pressionado
      if (route.params?.focusMissions && missionsY > 0) {
        setTimeout(() => {
          scrollRef.current?.scrollTo({ y: missionsY - 8, animated: true });
        }, 350);
      }
    }, [fetchDados, route.params?.focusMissions, missionsY])
  );

  // ── Ações ─────────────────────────────────────────────────────────────────────
  const handleDelete = async (id) => {
    try {
      await removerMedicamento(id);
      await cancelAlarmsForMedication(id);
      setMedicamentos((prev) => prev.filter((m) => m.id !== id));
      setModalVisible(false);
    } catch {
      Alert.alert('Erro', 'Não foi possível excluir o medicamento.');
    }
  };

  // ── Registrar dose diretamente pelo checkbox da missão ────────────────────────
  const handleCheckDose = async (med) => {
    const tomadas = dosesHojeMap[med.id] ?? 0;
    const total   = Math.max(1, med.horarios?.length ?? 0);
    if (tomadas >= total) return; // todas as doses já registradas

    // Atualização otimista
    setDosesHojeMap((prev) => ({ ...prev, [med.id]: (prev[med.id] ?? 0) + 1 }));
    setDosesTomadas((prev) => prev + 1);

    try {
      await registrarDose(med.id, user.id, 'tomado', perfilId);

      // Ressincroniza gamificação + leaderboard em background
      sincronizarGamificacao(user.id, perfilId).then(async (gam) => {
        if (gam) {
          setGamificacao(gam);
          const apelido =
            user.user_metadata?.username ||
            perfilNome ||
            user.email?.split('@')[0] ||
            'Usuário';
          sincronizarLeaderboard(user.id, gam, apelido);
          const lb = await buscarLeaderboard().catch(() => []);
          setArenaData(lb);
          const rankPos = lb.findIndex((u) => u.user_id === user.id) + 1 || 999;
          const [novas, proximas] = await Promise.all([
            verificarEDesbloquearConquistas(user.id, gam, { rankPosition: rankPos }),
            buscarProximasConquistas(user.id, gam, { rankPosition: rankPos }, 3),
          ]);
          setProximasConquistas(proximas);
          if (novas.length > 0) {
            Alert.alert('🎉 Nova conquista!', `Você desbloqueou: ${novas.map(c => c.emoji + ' ' + c.nome).join(', ')}`);
          }
        }
      }).catch(() => {});
    } catch {
      // Reverte em caso de falha
      setDosesHojeMap((prev) => ({ ...prev, [med.id]: Math.max(0, (prev[med.id] ?? 0) - 1) }));
      setDosesTomadas((prev) => Math.max(0, prev - 1));
      Alert.alert('Erro', 'Não foi possível registrar a dose.');
    }
  };

  // ── Pular dose (sem XP, sem penalidade no ranking) ───────────────────────────
  const handleNaoTomado = (med) => {
    const tomadas = dosesHojeMap[med.id] ?? 0;
    const total   = Math.max(1, med.horarios?.length ?? 0);
    if (tomadas >= total) return;
    // Avança o contador localmente apenas — não chama API, não gera XP
    setDosesHojeMap((prev) => ({ ...prev, [med.id]: (prev[med.id] ?? 0) + 1 }));
  };

  // ── Dados derivados ───────────────────────────────────────────────────────────
  const pctHoje  = dosesTotal > 0 ? dosesTomadas / dosesTotal : 0;
  const badges   = Array.isArray(gamificacao?.badges) ? gamificacao.badges : [];
  const nomeUser = user?.email?.split('@')[0] ?? 'usuário';

  // ── Render ────────────────────────────────────────────────────────────────────
  return (
    <SafeAreaView style={S.container} edges={['top']}>

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <View style={S.header}>
        <TouchableOpacity
          onPress={() => navigation.navigate('Setting')}
          activeOpacity={0.8}
        >
          <Text style={S.headerGreeting}>{saudacao()},</Text>
          <Text style={S.headerNome} numberOfLines={1}>
            {perfilNome || nomeUser}
          </Text>
        </TouchableOpacity>

        <View style={S.headerBadges}>
          {(gamificacao?.streak ?? 0) > 0 && (
            <View style={S.streakBadge}>
              <Feather name="activity" size={11} color="#FFD580" />
              <Text style={S.streakText}> {gamificacao.streak}d</Text>
            </View>
          )}
          {(gamificacao?.xp ?? 0) > 0 && (
            <View style={S.xpBadge}>
              <Feather name="zap" size={11} color="#C8EDF2" />
              <Text style={S.xpText}> {gamificacao.xp} XP</Text>
            </View>
          )}
        </View>
      </View>

      {/* ── Conteúdo scrollável ─────────────────────────────────────────────── */}
      <ScrollView
        ref={scrollRef}
        contentContainerStyle={S.scroll}
        showsVerticalScrollIndicator={false}
      >

        {/* PRESENÇA ANÔNIMA ───────────────────────────────────────────────────── */}
        {presencaCount > 0 && (
          <PresencaAnonima count={presencaCount} />
        )}

        {/* ARENA DE USUÁRIOS ──────────────────────────────────────────────────── */}
        {arenaData.length > 0 && !loading && (
          <View style={S.section}>
            <View style={S.sectionRow}>
              <Feather name="award" size={14} color="#BA7517" />
              <Text style={S.sectionTitle}> Ranking Pilly</Text>
            </View>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ flexDirection: 'row', paddingTop: 18, paddingBottom: 4 }}
            >
              {arenaData.map((u, i) => (
                <ArenaCard
                  key={u.user_id}
                  usuario={u}
                  posicao={i + 1}
                  euSou={u.user_id === user?.id}
                />
              ))}
            </ScrollView>
          </View>
        )}

        {/* CALENDÁRIO ─────────────────────────────────────────────────────────── */}
        {calendarioData.length > 0 && (
          <View style={S.section}>
            <Text style={S.sectionLabel}>Sua semana</Text>
            <CalendarioSemana dados={calendarioData} />
          </View>
        )}

        {/* PROGRESSO DE HOJE ──────────────────────────────────────────────────── */}
        {dosesTotal > 0 && !loading && (
          <View style={S.section}>
            <Text style={S.sectionLabel}>Progresso de hoje</Text>
            <View style={S.progressRow}>
              <AnelProgresso tomadas={dosesTomadas} total={dosesTotal} />
              <View style={S.progressInfo}>
                <Text style={S.progressMsg}>{mensagemProgresso(pctHoje)}</Text>
                {(gamificacao?.streak ?? 0) > 0 && (
                  <View style={S.progressStreakRow}>
                    <Feather name="activity" size={11} color="#1D6B78" />
                    <Text style={S.progressStreak}>
                      {' '}Sequência: {gamificacao.streak} dias
                    </Text>
                  </View>
                )}
              </View>
            </View>
          </View>
        )}

        {/* PRÓXIMAS CONQUISTAS ────────────────────────────────────────────────── */}
        {proximasConquistas.length > 0 && !loading && (
          <View style={S.section}>
            <View style={S.sectionRow}>
              <Feather name="target" size={14} color="#BA7517" />
              <Text style={S.sectionTitle}> Próximas conquistas</Text>
              <TouchableOpacity
                onPress={() => navigation.navigate('AvatarEditor')}
                hitSlop={10}
                style={{ marginLeft: 'auto', padding: 2 }}
              >
                <Text style={{ fontSize: 11, color: '#1D6B78', fontWeight: '700' }}>Ver avatar →</Text>
              </TouchableOpacity>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View style={{ flexDirection: 'row', gap: 10, paddingVertical: 4 }}>
                {proximasConquistas.map((c) => (
                  <ProximaConquistaCard key={c.id} conquista={c} />
                ))}
              </View>
            </ScrollView>
          </View>
        )}

        {/* MISSÕES DO DIA ─────────────────────────────────────────────────────── */}
        <View
          style={S.section}
          onLayout={(e) => setMissionsY(e.nativeEvent.layout.y)}
        >
          <View style={S.sectionRow}>
            <Feather name="zap" size={14} color="#1D6B78" />
            <Text style={[S.sectionTitle, { flex: 1 }]}> Missões de hoje</Text>
            {/* Atalho para adicionar novo medicamento */}
            <TouchableOpacity
              onPress={() => navigation.navigate('AddMedScreen', { perfilId, perfilNome })}
              hitSlop={10}
              style={{ padding: 2 }}
            >
              <Feather name="plus-circle" size={18} color="#7AABB5" />
            </TouchableOpacity>
          </View>

          {loading ? (
            <Text style={S.emptyText}>Carregando…</Text>
          ) : medicamentos.length > 0 ? (
            medicamentos.map((med, idx) => (
              <MissaoItem
                key={med.id}
                med={med}
                idx={idx}
                dosesTomadas={dosesHojeMap[med.id] ?? 0}
                onPress={() => {
                  setSelectedMedication(med);
                  setModalVisible(true);
                }}
                onCheck={() => handleCheckDose(med)}
                onNaoTomado={() => handleNaoTomado(med)}
              />
            ))
          ) : (
            <Text style={S.emptyText}>
              {perfilNome
                ? `Nenhum medicamento para ${perfilNome}.`
                : 'Selecione um perfil para ver os medicamentos.'}
            </Text>
          )}
        </View>

        {/* CONQUISTAS ─────────────────────────────────────────────────────────── */}
        <View style={[S.section, { marginBottom: 100 }]}>
          <Text style={S.sectionLabel}>Conquistas</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={{ flexDirection: 'row', paddingVertical: 4 }}>
              {Object.values(TODOS_BADGES).map((badge) => (
                <BadgeItem
                  key={badge.id}
                  badge={badge}
                  earned={badges.includes(badge.id)}
                />
              ))}
            </View>
          </ScrollView>
        </View>

      </ScrollView>

      {/* ── Footer fixo ─────────────────────────────────────────────────────── */}
      <FooterNavigation />

      {/* ── Modal de detalhe do medicamento ─────────────────────────────────── */}
      <MedDetailModal
        visible={modalVisible}
        medication={selectedMedication}
        onClose={() => setModalVisible(false)}
        navigation={navigation}
        onDelete={handleDelete}
        onRefresh={fetchDados}
        perfilNome={perfilNome}
      />
    </SafeAreaView>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
// ESTILOS
// ═══════════════════════════════════════════════════════════════════════════════

// ─── Principal ────────────────────────────────────────────────────────────────
const S = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F0F4F8',
  },
  // Header
  header: {
    backgroundColor: '#1D6B78',
    paddingHorizontal: 18,
    paddingTop: 12,
    paddingBottom: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  headerGreeting: {
    fontSize: 12,
    color: '#A8D8E0',
  },
  headerNome: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginTop: 2,
    maxWidth: 200,
  },
  headerBadges: {
    flexDirection: 'row',
    gap: 6,
    marginTop: 4,
    alignItems: 'center',
  },
  streakBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  streakText: {
    color: '#FFD580',
    fontSize: 12,
    fontWeight: 'bold',
  },
  xpBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.10)',
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  xpText: {
    color: '#C8EDF2',
    fontSize: 12,
    fontWeight: '600',
  },
  // Scroll
  scroll: {
    paddingTop: 12,
    paddingHorizontal: 14,
  },
  // Seções
  section: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 14,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#7AABB5',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 12,
  },
  sectionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1A3A40',
  },
  // Progresso
  progressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  progressInfo: {
    flex: 1,
  },
  progressMsg: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1A3A40',
    lineHeight: 20,
    marginBottom: 4,
  },
  progressStreakRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  progressStreak: {
    fontSize: 12,
    color: '#1D6B78',
    fontWeight: '600',
  },
  // Anel
  anel_contagem: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#1D6B78',
  },
  anel_sub: {
    fontSize: 9,
    color: '#7AABB5',
    marginTop: 1,
  },
  // Vazio / loading
  emptyText: {
    fontSize: 13,
    color: '#AAB5B8',
    marginTop: 4,
    marginBottom: 4,
  },
});

// ─── Arena de usuários ────────────────────────────────────────────────────────
const arena = StyleSheet.create({
  card: {
    width: 92,
    backgroundColor: '#F7FBFC',
    borderRadius: 14,
    borderWidth: 0.5,
    borderColor: '#D5E8EA',
    padding: 10,
    paddingTop: 12,
    alignItems: 'center',
    marginRight: 8,
    gap: 5,
    position: 'relative',
    minHeight: 172,
    justifyContent: 'flex-start',
  },
  cardAtivo: {
    borderWidth: 1.5,
    borderColor: '#1D6B78',
    backgroundColor: '#EAF5F7',
  },
  coroaWrap: {
    position: 'absolute',
    top: -12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ativoBadge: {
    position: 'absolute',
    top: -8,
    right: 6,
    backgroundColor: '#1D6B78',
    color: '#fff',
    fontSize: 9,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    overflow: 'hidden',
  },
  avatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
  },
  avatarBox: {
    width: 54,
    height: 62,
    borderRadius: 10,
    overflow: 'hidden',
    borderWidth: 1.5,
    backgroundColor: '#EAF5F7',
    marginTop: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 15,
    fontWeight: 'bold',
  },
  nome: {
    fontSize: 10,
    fontWeight: '600',
    color: '#1A3A40',
    textAlign: 'center',
    maxWidth: 74,
    lineHeight: 14,
  },
  miniBarBg: {
    width: 64,
    height: 5,
    backgroundColor: '#E0EDF0',
    borderRadius: 3,
    overflow: 'hidden',
  },
  miniBarFill: {
    height: 5,
    borderRadius: 3,
  },
  xpRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  pct: {
    fontSize: 11,
    fontWeight: 'bold',
  },
  streakRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: -3,
  },
  streak: {
    fontSize: 9,
    color: '#AAB5B8',
  },
  rankBadge: {
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  rankText: {
    fontSize: 10,
    fontWeight: 'bold',
  },
});

// ─── Presença anônima ─────────────────────────────────────────────────────────
const pres = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#EAF5F7',
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginBottom: 12,
    borderWidth: 0.5,
    borderColor: '#C8EDF2',
  },
  pulseWrap: {
    width: 18,
    height: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  pulseOuter: {
    position: 'absolute',
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: 'rgba(29,107,120,0.15)',
  },
  pulseDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#1D6B78',
  },
  texto: {
    flex: 1,
    fontSize: 12,
    color: '#2A6470',
    lineHeight: 17,
  },
  destaque: {
    fontWeight: 'bold',
    fontSize: 13,
    color: '#1D6B78',
  },
});

// ─── Calendário ───────────────────────────────────────────────────────────────
const cal = StyleSheet.create({
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  col: {
    alignItems: 'center',
    gap: 4,
  },
  label: {
    fontSize: 9,
    color: '#AAB5B8',
  },
  dot: {
    width: 30,
    height: 30,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dotFull: {
    backgroundColor: '#1D6B78',
  },
  dotPartial: {
    backgroundColor: '#C8EDF2',
  },
  dotMiss: {
    backgroundColor: '#F4F4F4',
    borderWidth: 0.5,
    borderColor: '#D5E8EA',
  },
  dotToday: {
    backgroundColor: '#EAF5F7',
    borderWidth: 1.5,
    borderColor: '#1D6B78',
  },
  halfText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#1D6B78',
  },
  missText: {
    fontSize: 12,
    color: '#C0CACC',
  },
  todayText: {
    fontSize: 9,
    fontWeight: 'bold',
    color: '#1D6B78',
  },
});

// ─── Missões ──────────────────────────────────────────────────────────────────
const miss = StyleSheet.create({
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#F7FBFC',
    borderRadius: 12,
    padding: 10,
    marginBottom: 8,
    borderWidth: 0.5,
    borderColor: '#D5E8EA',
  },
  itemTomado: {
    opacity: 0.55,
  },
  icone: {
    width: 34,
    height: 34,
    borderRadius: 9,
    justifyContent: 'center',
    alignItems: 'center',
  },
  info: {
    flex: 1,
  },
  nome: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1A3A40',
  },
  sub: {
    fontSize: 11,
    color: '#7AABB5',
    marginTop: 2,
  },
  check: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 1.5,
    borderColor: '#C0CACC',
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkDone: {
    // backgroundColor e borderColor são aplicados inline com a cor do perfil
  },
});

// ─── Badges/Conquistas ────────────────────────────────────────────────────────
const bdg = StyleSheet.create({
  item: {
    width: 66,
    alignItems: 'center',
    gap: 5,
    marginRight: 10,
  },
  circulo: {
    width: 46,
    height: 46,
    borderRadius: 23,
    justifyContent: 'center',
    alignItems: 'center',
  },
  earned: {
    backgroundColor: '#FAC775',
    borderWidth: 1.5,
    borderColor: '#E8A93A',
  },
  locked: {
    backgroundColor: '#F0F0F0',
    borderWidth: 1.5,
    borderColor: '#DDD',
    opacity: 0.45,
  },
  label: {
    fontSize: 9,
    color: '#7AABB5',
    textAlign: 'center',
    lineHeight: 13,
  },
});

// ─── Próximas Conquistas ──────────────────────────────────────────────────────
const prox = StyleSheet.create({
  card: {
    width: 120,
    backgroundColor: '#F7FBFC',
    borderRadius: 14,
    padding: 12,
    alignItems: 'center',
    gap: 4,
    borderWidth: 0.5,
    borderColor: '#D5E8EA',
    marginRight: 8,
  },
  iconWrap: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center', marginBottom: 2 },
  nome:     { fontSize: 11, fontWeight: '700', color: '#1A3A40', textAlign: 'center', lineHeight: 15 },
  desc:     { fontSize: 9,  color: '#7AABB5', textAlign: 'center', lineHeight: 13 },
  barBg:    { width: '100%', height: 5, backgroundColor: '#E0EDF0', borderRadius: 3, overflow: 'hidden', marginTop: 4 },
  barFill:  { height: 5, borderRadius: 3, backgroundColor: '#1D6B78' },
  pct:      { fontSize: 10, fontWeight: '700', color: '#1D6B78' },
  recompensa: { fontSize: 8, color: '#BA7517', fontWeight: '600' },
});

export default HomeScreen;
