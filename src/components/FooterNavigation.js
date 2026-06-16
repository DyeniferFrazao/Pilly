import React, { useState, useEffect } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
} from 'react-native';
import { useNavigation, useNavigationState } from '@react-navigation/native';
import { Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../contexts/AuthContext';
import AvatarComponent from './AvatarComponent';
import { buscarAvatarEquipado } from '../services/avatarService';

// ─── Cores base ────────────────────────────────────────────────────────────────
const TEAL_DARK = '#1D6B78';
const GREY_ICON = '#A8B5B8';
const BAR_BG    = '#FFFFFF';

// ─── Itens da barra (exceto o central) ────────────────────────────────────────
const NAV_ITEMS = [
  { route: 'Home',         icon: 'home',     label: 'Início'  },
  { route: 'Map',          icon: 'map-pin',  label: 'Mapa'    },
  // slot central (avatar) fica entre Map e Medicamentos
  { route: 'Medicamentos', icon: 'list',     label: 'Meds'    },
  { route: 'Setting',      icon: 'settings', label: 'Config.' },
];

const FooterNavigation = () => {
  const { user }     = useAuth();
  const navigation   = useNavigation();
  const insets       = useSafeAreaInsets();
  const currentRoute = useNavigationState(
    (state) => state?.routes?.[state?.index]?.name ?? ''
  );

  const [avatarEquipado, setAvatarEquipado] = useState(null);

  // Carrega avatar ao montar (uma vez — não precisa refetch em cada focus)
  useEffect(() => {
    if (!user?.id) return;
    buscarAvatarEquipado(user.id)
      .then(setAvatarEquipado)
      .catch(() => {});
  }, [user]);

  const navegar            = (route) => navigation.navigate(route);
  const irParaAvatarEditor = () => navigation.navigate('AvatarEditor');

  // ── Render ─────────────────────────────────────────────────────────────────
  const bottomPadding = Math.max(insets.bottom, 8);

  return (
    <View style={[styles.bar, { paddingBottom: bottomPadding }]}>

      {/* Itens esquerda: Início + Mapa */}
      {NAV_ITEMS.slice(0, 2).map((item) => {
        const active = currentRoute === item.route;
        return (
          <NavItem
            key={item.route}
            icon={item.icon}
            label={item.label}
            active={active}
            onPress={() => navegar(item.route)}
          />
        );
      })}

      {/* ── Botão central — Avatar do usuário ──────────────────────────────── */}
      <View style={styles.centralWrapper}>
        <TouchableOpacity
          style={[
            styles.centralBtn,
            currentRoute === 'AvatarEditor' && styles.centralBtnAtivo,
          ]}
          onPress={irParaAvatarEditor}
          activeOpacity={0.85}
          accessibilityLabel="Editar avatar"
        >
          {avatarEquipado ? (
            <AvatarComponent
              equipado={avatarEquipado}
              size="sm"
              showPet={false}
              showFrame={false}
            />
          ) : (
            // Fallback enquanto carrega
            <Feather name="user" size={26} color="#FFFFFF" />
          )}
          {/* Pet badge sobreposto no canto inferior direito */}
          {avatarEquipado?.pet && (
            <View style={styles.petBadge}>
              <Text style={styles.petEmoji}>
                {{ pet_seed:'🌱', pet_cat:'🐱', pet_bunny:'🐰', pet_dog:'🐶', pet_dragon:'🐉' }[avatarEquipado.pet] ?? ''}
              </Text>
            </View>
          )}
        </TouchableOpacity>
        <Text style={styles.centralLabel}>Avatar</Text>
      </View>

      {/* Itens direita: Meds + Config */}
      {NAV_ITEMS.slice(2).map((item) => {
        const active = currentRoute === item.route;
        return (
          <NavItem
            key={item.route}
            icon={item.icon}
            label={item.label}
            active={active}
            onPress={() => navegar(item.route)}
          />
        );
      })}
    </View>
  );
};

// ─── Sub-componente: item de navegação ────────────────────────────────────────
const NavItem = ({ icon, label, active, onPress }) => (
  <TouchableOpacity
    style={styles.navItem}
    onPress={onPress}
    activeOpacity={0.7}
    accessibilityLabel={label}
  >
    <Feather
      name={icon}
      size={22}
      color={active ? TEAL_DARK : GREY_ICON}
    />
    <Text style={[styles.navLabel, active && styles.navLabelActive]}>
      {label}
    </Text>
    {active && <View style={styles.activeDot} />}
  </TouchableOpacity>
);

// ─── Estilos ──────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  bar: {
    width: '100%',
    backgroundColor: BAR_BG,
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'flex-end',
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#E8F0F2',
    shadowColor: '#1D6B78',
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 12,
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
  },
  navItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-end',
    paddingBottom: 4,
    gap: 3,
    minHeight: 50,
    position: 'relative',
  },
  navLabel: {
    fontSize: 10,
    color: GREY_ICON,
    fontWeight: '500',
  },
  navLabelActive: {
    color: TEAL_DARK,
    fontWeight: '700',
  },
  activeDot: {
    position: 'absolute',
    top: 0,
    width: 20,
    height: 3,
    borderRadius: 2,
    backgroundColor: TEAL_DARK,
  },
  // ── Botão central ───────────────────────────────────────────────────────────
  centralWrapper: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-end',
    paddingBottom: 4,
  },
  centralBtn: {
    width: 62,
    height: 62,
    borderRadius: 31,
    backgroundColor: '#C8EDF2',   // fundo claro para o avatar aparecer bem
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 2,
    marginTop: -26,               // sobe acima da barra
    overflow: 'hidden',
    // Sombra + borda teal
    shadowColor: TEAL_DARK,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.30,
    shadowRadius: 8,
    elevation: 10,
    borderWidth: 3,
    borderColor: TEAL_DARK,
  },
  centralBtnAtivo: {
    borderColor: '#BA7517',       // dourado quando a tela de avatar está ativa
  },
  petBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: BAR_BG,
    borderRadius: 10,
    width: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#C8EDF2',
  },
  petEmoji: {
    fontSize: 10,
  },
  centralLabel: {
    fontSize: 10,
    color: TEAL_DARK,
    fontWeight: '700',
    marginTop: 1,
  },
});

export default FooterNavigation;
