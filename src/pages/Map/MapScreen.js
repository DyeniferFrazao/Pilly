import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  Linking,
  Alert,
  StyleSheet,
  Dimensions,
  Platform,
} from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE, PROVIDER_DEFAULT } from 'react-native-maps';
import * as Location from 'expo-location';
import { Feather } from '@expo/vector-icons';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { GOOGLE_MAPS_API_KEY } from '../../config';

// iOS: usa Apple Maps (não requer GoogleMaps CocoaPod instalado)
// Android: usa Google Maps (configurado via AndroidManifest meta-data)
const MAP_PROVIDER = Platform.OS === 'android' ? PROVIDER_GOOGLE : PROVIDER_DEFAULT;

const { width, height } = Dimensions.get('window');

// ─── Haversine: distância em km entre dois pontos ────────────────────────────
function haversine(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function formatarDistancia(km) {
  if (km < 1) return `${Math.round(km * 1000)} m`;
  return `${km.toFixed(1)} km`;
}

// ─── Componente principal ─────────────────────────────────────────────────────
const MapScreen = ({ navigation }) => {
  const mapRef  = useRef(null);
  const insets  = useSafeAreaInsets();

  const [userLocation, setUserLocation]     = useState(null);
  const [pharmacies,   setPharmacies]       = useState([]);
  const [filtered,     setFiltered]         = useState([]);
  const [selected,     setSelected]         = useState(null);
  const [search,       setSearch]           = useState('');
  const [loading,      setLoading]          = useState(true);
  const [loadingMsg,   setLoadingMsg]       = useState('Obtendo localização…');
  const [error,        setError]            = useState(null);
  const [safeTopH,     setSafeTopH]         = useState(120); // atualizado via onLayout

  // ── Busca farmácias na Places API ─────────────────────────────────────────
  const buscarFarmacias = useCallback(async (lat, lng) => {
    setLoadingMsg('Buscando farmácias próximas…');
    try {
      const url =
        `https://maps.googleapis.com/maps/api/place/nearbysearch/json` +
        `?location=${lat},${lng}` +
        `&radius=5000` +
        `&type=pharmacy` +
        `&language=pt-BR` +
        `&key=${GOOGLE_MAPS_API_KEY}`;

      const response = await fetch(url);
      const json     = await response.json();

      if (json.status !== 'OK' && json.status !== 'ZERO_RESULTS') {
        throw new Error(json.error_message || json.status);
      }

      const results = (json.results ?? []).map((place) => ({
        id:        place.place_id,
        nome:      place.name,
        endereco:  place.vicinity ?? '',
        rating:    place.rating ?? null,
        aberta:    place.opening_hours?.open_now ?? null,
        lat:       place.geometry.location.lat,
        lng:       place.geometry.location.lng,
        distancia: haversine(lat, lng, place.geometry.location.lat, place.geometry.location.lng),
      }));

      // Ordena por distância
      results.sort((a, b) => a.distancia - b.distancia);

      setPharmacies(results);
      setFiltered(results);
    } catch (e) {
      setError('Não foi possível carregar as farmácias. Verifique sua conexão e a chave de API.');
      console.error('[MapScreen] buscarFarmacias:', e);
    } finally {
      setLoading(false);
    }
  }, []);

  // ── Permissão de localização e posição do usuário ─────────────────────────
  useEffect(() => {
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setError('Permissão de localização negada. Ative-a nas configurações do dispositivo.');
        setLoading(false);
        return;
      }
      try {
        const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
        const { latitude, longitude } = pos.coords;
        setUserLocation({ latitude, longitude });
        await buscarFarmacias(latitude, longitude);
      } catch {
        setError('Não foi possível obter sua localização.');
        setLoading(false);
      }
    })();
  }, [buscarFarmacias]);

  // ── Filtro por nome ───────────────────────────────────────────────────────
  const handleSearch = (text) => {
    setSearch(text);
    if (!text.trim()) {
      setFiltered(pharmacies);
      setSelected(null);
      return;
    }
    const lc = text.toLowerCase();
    setFiltered(pharmacies.filter(p => p.nome.toLowerCase().includes(lc)));
  };

  const limparBusca = () => {
    setSearch('');
    setFiltered(pharmacies);
    setSelected(null);
  };

  // ── Selecionar farmácia ───────────────────────────────────────────────────
  const selecionarFarmacia = (farm) => {
    setSelected(farm);
    mapRef.current?.animateToRegion(
      { latitude: farm.lat, longitude: farm.lng, latitudeDelta: 0.01, longitudeDelta: 0.01 },
      600,
    );
  };

  // ── Abrir rota no Google Maps ─────────────────────────────────────────────
  const abrirRota = (farm) => {
    const url = Platform.select({
      ios:     `maps://app?daddr=${farm.lat},${farm.lng}`,
      android: `google.navigation:q=${farm.lat},${farm.lng}`,
    });
    const fallback = `https://www.google.com/maps/dir/?api=1&destination=${farm.lat},${farm.lng}`;
    Linking.canOpenURL(url)
      .then(ok => Linking.openURL(ok ? url : fallback))
      .catch(() => Linking.openURL(fallback));
  };

  // ── Recentrar no usuário ──────────────────────────────────────────────────
  const recentrar = () => {
    if (!userLocation) return;
    mapRef.current?.animateToRegion(
      { ...userLocation, latitudeDelta: 0.03, longitudeDelta: 0.03 },
      600,
    );
    setSelected(null);
  };

  // ─── Estado de loading / erro ─────────────────────────────────────────────
  if (loading) {
    return (
      <View style={s.center}>
        <ActivityIndicator size="large" color="#2E7D8A" />
        <Text style={s.loadingText}>{loadingMsg}</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={s.center}>
        <Feather name="alert-circle" size={40} color="#E57373" />
        <Text style={s.errorText}>{error}</Text>
        <TouchableOpacity style={s.retryBtn} onPress={() => navigation.goBack()}>
          <Text style={s.retryText}>Voltar</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const initialRegion = userLocation
    ? { ...userLocation, latitudeDelta: 0.03, longitudeDelta: 0.03 }
    : { latitude: -15.7801, longitude: -47.9292, latitudeDelta: 0.1, longitudeDelta: 0.1 };

  // ─── Render ───────────────────────────────────────────────────────────────
  return (
    <View style={s.flex}>
      {/* Mapa */}
      <MapView
        ref={mapRef}
        provider={MAP_PROVIDER}
        style={StyleSheet.absoluteFillObject}
        initialRegion={initialRegion}
        showsUserLocation
        showsMyLocationButton={false}
      >
        {filtered.map((farm) => (
          <Marker
            key={farm.id}
            coordinate={{ latitude: farm.lat, longitude: farm.lng }}
            pinColor={selected?.id === farm.id ? '#E53935' : '#2E7D8A'}
            onPress={() => selecionarFarmacia(farm)}
          />
        ))}
      </MapView>

      {/* Botão voltar + busca */}
      <SafeAreaView
        edges={['top']}
        style={s.safeTop}
        onLayout={(e) => setSafeTopH(e.nativeEvent.layout.height)}
      >
        <TouchableOpacity style={s.backBtn} onPress={() => navigation.goBack()}>
          <Feather name="arrow-left" size={22} color="#2E7D8A" />
        </TouchableOpacity>

        {/* Barra de busca */}
        <View style={s.searchBar}>
          <Feather name="search" size={18} color="#8aaab0" style={{ marginRight: 6 }} />
          <TextInput
            style={s.searchInput}
            placeholder="Buscar farmácia…"
            placeholderTextColor="#aaa"
            value={search}
            onChangeText={handleSearch}
            returnKeyType="search"
          />
          {search.length > 0 && (
            <TouchableOpacity onPress={limparBusca}>
              <Feather name="x" size={18} color="#666" />
            </TouchableOpacity>
          )}
        </View>
      </SafeAreaView>

      {/* Botão recentrar — acima do painel inferior */}
      <TouchableOpacity
        style={[s.recenterBtn, { bottom: insets.bottom + 155 }]}
        onPress={recentrar}
      >
        <Feather name="navigation" size={20} color="#2E7D8A" />
      </TouchableOpacity>

      {/* Contador de resultados — logo abaixo da search bar */}
      <View style={[s.countBadge, { top: safeTopH + 8 }]}>
        <Text style={s.countText}>
          {filtered.length} farmácia{filtered.length !== 1 ? 's' : ''} encontrada{filtered.length !== 1 ? 's' : ''}
        </Text>
      </View>

      {/* Card da farmácia selecionada */}
      {selected ? (
        <View style={[s.detailCard, { bottom: insets.bottom + 16 }]}>
          {/* Indicador aberto/fechado */}
          {selected.aberta !== null && (
            <View style={[s.statusBadge, selected.aberta ? s.aberta : s.fechada]}>
              <Text style={s.statusText}>{selected.aberta ? 'Aberta agora' : 'Fechada'}</Text>
            </View>
          )}

          <Text style={s.detailNome} numberOfLines={2}>{selected.nome}</Text>
          <Text style={s.detailEnd} numberOfLines={2}>{selected.endereco}</Text>

          <View style={s.detailRow}>
            {selected.rating && (
              <View style={s.ratingRow}>
                <Feather name="star" size={14} color="#F9A825" />
                <Text style={s.ratingText}>{selected.rating.toFixed(1)}</Text>
              </View>
            )}
            <View style={s.distRow}>
              <Feather name="map-pin" size={14} color="#2E7D8A" />
              <Text style={s.distText}>{formatarDistancia(selected.distancia)}</Text>
            </View>
          </View>

          <View style={s.actionRow}>
            <TouchableOpacity
              style={s.routeBtn}
              onPress={() => abrirRota(selected)}
            >
              <Feather name="navigation-2" size={16} color="#fff" />
              <Text style={s.routeText}>Abrir rota</Text>
            </TouchableOpacity>
            <TouchableOpacity style={s.closeBtn} onPress={() => setSelected(null)}>
              <Feather name="x" size={18} color="#666" />
            </TouchableOpacity>
          </View>
        </View>
      ) : (
        /* Lista compacta de farmácias próximas */
        <View style={[s.listContainer, { paddingBottom: insets.bottom + 20 }]}>
          <Text style={s.listTitle}>Farmácias próximas</Text>
          <FlatList
            data={filtered.slice(0, 8)}
            keyExtractor={item => item.id}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: 16, gap: 10 }}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={s.listCard}
                onPress={() => selecionarFarmacia(item)}
              >
                <Text style={s.listCardNome} numberOfLines={2}>{item.nome}</Text>
                <View style={s.listCardFooter}>
                  {item.rating ? (
                    <View style={s.ratingRow}>
                      <Feather name="star" size={11} color="#F9A825" />
                      <Text style={s.ratingSmall}>{item.rating.toFixed(1)}</Text>
                    </View>
                  ) : null}
                  <Text style={s.distSmall}>{formatarDistancia(item.distancia)}</Text>
                </View>
              </TouchableOpacity>
            )}
          />
        </View>
      )}
    </View>
  );
};

// ─── Estilos ──────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  flex:   { flex: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },

  // Loading / erro
  loadingText: { marginTop: 14, fontSize: 15, color: '#555' },
  errorText:   { marginTop: 12, fontSize: 14, color: '#555', textAlign: 'center' },
  retryBtn:    { marginTop: 20, backgroundColor: '#2E7D8A', paddingHorizontal: 24, paddingVertical: 10, borderRadius: 8 },
  retryText:   { color: '#fff', fontWeight: '600' },

  // Topo
  safeTop: { position: 'absolute', top: 0, left: 0, right: 0, zIndex: 10 },

  backBtn: {
    alignSelf: 'flex-start',
    marginLeft: 16,
    marginTop: 8,
    backgroundColor: '#fff',
    borderRadius: 50,
    padding: 8,
    elevation: 4,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
  },

  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginTop: 8,
    marginBottom: 4,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    elevation: 4,
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
  },
  searchInput: { flex: 1, fontSize: 15, color: '#222' },

  // Recentrar — bottom definido dinamicamente via insets no JSX
  recenterBtn: {
    position: 'absolute',
    right: 16,
    backgroundColor: '#fff',
    borderRadius: 50,
    padding: 10,
    elevation: 4,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
  },

  // Contador — top definido dinamicamente via safeTopH no JSX
  countBadge: {
    position: 'absolute',
    alignSelf: 'center',
    left: 0,
    right: 0,
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  countText: {
    backgroundColor: 'rgba(46,125,138,0.85)',
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 5,
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
    overflow: 'hidden',
  },

  // Card de detalhe — bottom definido dinamicamente via insets no JSX
  detailCard: {
    position: 'absolute',
    left: 16,
    right: 16,
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    elevation: 8,
    shadowColor: '#000',
    shadowOpacity: 0.18,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 8,
  },
  statusBadge:  { alignSelf: 'flex-start', borderRadius: 20, paddingHorizontal: 10, paddingVertical: 3, marginBottom: 6 },
  aberta:       { backgroundColor: '#E8F5E9' },
  fechada:      { backgroundColor: '#FFEBEE' },
  statusText:   { fontSize: 11, fontWeight: '700', color: '#333' },

  detailNome: { fontSize: 17, fontWeight: '700', color: '#1A3C44', marginBottom: 4 },
  detailEnd:  { fontSize: 13, color: '#666', marginBottom: 10 },

  detailRow:  { flexDirection: 'row', alignItems: 'center', gap: 16, marginBottom: 14 },
  ratingRow:  { flexDirection: 'row', alignItems: 'center', gap: 4 },
  ratingText: { fontSize: 13, color: '#555', fontWeight: '600' },
  distRow:    { flexDirection: 'row', alignItems: 'center', gap: 4 },
  distText:   { fontSize: 13, color: '#2E7D8A', fontWeight: '600' },

  actionRow:  { flexDirection: 'row', alignItems: 'center', gap: 10 },
  routeBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#2E7D8A',
    borderRadius: 10,
    paddingVertical: 10,
    gap: 8,
  },
  routeText: { color: '#fff', fontWeight: '700', fontSize: 14 },
  closeBtn: {
    backgroundColor: '#f0f0f0',
    borderRadius: 10,
    padding: 10,
  },

  // Lista horizontal — paddingBottom definido dinamicamente via insets no JSX
  listContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(255,255,255,0.97)',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: 14,
    elevation: 8,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowOffset: { width: 0, height: -2 },
    shadowRadius: 6,
  },
  listTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#2E7D8A',
    marginLeft: 16,
    marginBottom: 10,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  listCard: {
    width: 150,
    backgroundColor: '#EAF4F6',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#C8E6EA',
  },
  listCardNome:   { fontSize: 13, fontWeight: '600', color: '#1A3C44', marginBottom: 8, lineHeight: 18 },
  listCardFooter: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  ratingSmall:    { fontSize: 11, color: '#555', fontWeight: '600' },
  distSmall:      { fontSize: 11, color: '#2E7D8A', fontWeight: '600' },
});

export default MapScreen;
