import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert } from 'react-native';
import MapView, { Marker, Callout } from 'react-native-maps';
import * as Location from 'expo-location';
import { Ionicons, Feather } from 'react-native-vector-icons';
import styles from '../../style/stylemap';

const MapScreen = ({ navigation }) => {
  const [location, setLocation] = useState(null);
  const [errorMsg, setErrorMsg] = useState(null);
  const [search, setSearch] = useState('');
  const [selectedPharmacy, setSelectedPharmacy] = useState(null);

  const pharmacies = [
    { name: 'Farmácia São João - São Cristóvão', coordinate: { latitude: -28.2629, longitude: -52.4064 }, rating: 4.5, address: 'Avenida Presidente Vargas, 1020', cep: '99070-000', phone: '(54) 3317-7070' },
    { name: 'Farmácia Panvel - Centro', coordinate: { latitude: -28.2635, longitude: -52.4050 }, rating: 4.8, address: 'Rua Morom, 285', cep: '99010-000', phone: '(54) 3314-1313' },
    { name: 'Farmácia Pague Menos', coordinate: { latitude: -28.2660, longitude: -52.4085 }, rating: 4.3, address: 'Avenida Brasil Leste, 1325', cep: '99050-000', phone: '(54) 3317-2323' },
    { name: 'Farmácia Econômica', coordinate: { latitude: -28.2640, longitude: -52.4030 }, rating: 4.0, address: 'Rua Bento Gonçalves, 740', cep: '99025-000', phone: '(54) 3313-1212' },
    { name: 'Farmácia São Lucas', coordinate: { latitude: -28.2670, longitude: -52.4045 }, rating: 4.6, address: 'Rua Coronel Chicuta, 145', cep: '99010-000', phone: '(54) 3315-7878' },
    { name: 'Farmácia Vida Farma', coordinate: { latitude: -28.2618, longitude: -52.4070 }, rating: 4.4, address: 'Rua Teixeira Soares, 990', cep: '99030-000', phone: '(54) 3316-6565' },
    { name: 'Farmácia do Trabalhador', coordinate: { latitude: -28.2652, longitude: -52.4080 }, rating: 4.1, address: 'Rua Uruguai, 305', cep: '99020-000', phone: '(54) 3314-4141' },
    { name: 'Farmácia São João - Vera Cruz', coordinate: { latitude: -28.2685, longitude: -52.4095 }, rating: 4.7, address: 'Avenida Salgado Filho, 890', cep: '99040-000', phone: '(54) 3318-9090' },
    { name: 'Farmácia Popular', coordinate: { latitude: -28.2690, longitude: -52.4025 }, rating: 4.2, address: 'Rua Paissandu, 645', cep: '99035-000', phone: '(54) 3317-7171' },
    { name: 'Farmácia Big Farma', coordinate: { latitude: -28.2700, longitude: -52.4060 }, rating: 4.5, address: 'Rua Independência, 1120', cep: '99045-000', phone: '(54) 3319-8989' },
  ];

  useEffect(() => {
    (async () => {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setErrorMsg('Permission to access location was denied');
        return;
      }
      let location = await Location.getCurrentPositionAsync({});
      setLocation(location);
    })();
  }, []);

  const handleSearch = (text) => {
    setSearch(text);
    const pharmacy = pharmacies.find((pharmacy) => pharmacy.name.toLowerCase().includes(text.toLowerCase()));
    setSelectedPharmacy(pharmacy || null);
  };

  const clearSearch = () => {
    setSearch('');
    setSelectedPharmacy(null);
  };

  const handleLupaPress = () => {
    if (!search.trim()) {
      Alert.alert('Aviso', 'Por favor, digite algo no campo de busca.');
    }
  };

  const resetMap = () => {
    setSelectedPharmacy(null);
    setSearch('');
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Feather name="arrow-left-circle" size={30} color="#62A4B0" />
        </TouchableOpacity>
      </View>

      <MapView
        style={styles.map}
        initialRegion={{
          latitude: -28.2632,
          longitude: -52.4064,
          latitudeDelta: 0.05,
          longitudeDelta: 0.05,
        }}
        showsUserLocation
        followsUserLocation
      >
        {selectedPharmacy ? (
          <Marker coordinate={selectedPharmacy.coordinate} pinColor="red">
            <Callout>
              <Text>{selectedPharmacy.name}</Text>
            </Callout>
          </Marker>
        ) : (
          pharmacies.map((pharmacy, index) => (
            <Marker
              key={index}
              coordinate={pharmacy.coordinate}
              pinColor="red"
              onPress={() => setSelectedPharmacy(pharmacy)}
            >
              <Callout>
                <Text>{pharmacy.name}</Text>
              </Callout>
            </Marker>
          ))
        )}

        {location && (
          <Marker
            coordinate={{
              latitude: location.coords.latitude,
              longitude: location.coords.longitude,
            }}
            pinColor="blue"
          />
        )}
      </MapView>

      <View style={styles.searchContainer}>
        <TouchableOpacity onPress={resetMap}>
          <Ionicons name="arrow-back" size={24} color="black" />
        </TouchableOpacity>
        <TextInput
          style={styles.searchInput}
          placeholder="Farmácias..."
          value={search}
          onChangeText={handleSearch}
        />
        {search ? (
          <TouchableOpacity onPress={clearSearch}>
            <Feather name="x" size={24} color="black" />
          </TouchableOpacity>
        ) : (
          <TouchableOpacity onPress={handleLupaPress}>
            <Feather name="search" size={24} color="black" />
          </TouchableOpacity>
        )}
      </View>

      {selectedPharmacy && (
        <View style={styles.pharmacyInfo}>
          <Text style={styles.pharmacyName}>{selectedPharmacy.name}</Text>
          <Text>{selectedPharmacy.rating} ★</Text>
          <Text>{selectedPharmacy.address}</Text>
          <Text>CEP: {selectedPharmacy.cep}</Text>
          <Text>Telefone: {selectedPharmacy.phone}</Text>
        </View>
      )}
    </View>
  );
};

export default MapScreen;
