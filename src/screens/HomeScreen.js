import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Image,
  Dimensions,
  TextInput, 
  TouchableOpacity,
  Modal, // Adăugat pentru meniul derulant simulat
} from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import * as Location from 'expo-location';
import { useTheme } from '../context/ThemeContext';
import locatii from '../../locatii.json';

const { height } = Dimensions.get('window');

const MAP_HEIGHT_PERCENTAGE = 0.55;

// Lista de orașe predefinite cu coordonate (inclusiv Galați ca default)
const CITY_OPTIONS = [
    { label: "Galați, România (Implicit)", value: "Galati", latitude: 45.4348, longitude: 28.0535 },
    { label: "București, România", value: "Bucuresti", latitude: 44.4268, longitude: 26.1025 },
    { label: "Cluj-Napoca, România", value: "Cluj", latitude: 46.7712, longitude: 23.6236 },
    { label: "Iași, România", value: "Iasi", latitude: 47.1585, longitude: 27.5959 },
    { label: "Utilizator (Locație Curentă)", value: "User", latitude: 0, longitude: 0 }, // Placeholder
];

// Extragem prima locație pentru a o folosi ca punct de pornire dacă locația utilizatorului nu e disponibilă
const firstPlace = locatii[0] || CITY_OPTIONS.find(c => c.value === 'Galati');

export default function HomeScreen({ navigation }) { 
  const { colors } = useTheme();
  const [referenceLocation, setReferenceLocation] = useState(null); 
  const [userLocation, setUserLocation] = useState(null); // Locația reală a utilizatorului
  const [topPlaces, setTopPlaces] = useState([]);
  const [allPlaces, setAllPlaces] = useState([]);
  const [selectedCity, setSelectedCity] = useState(CITY_OPTIONS[0]); // Galați ca default
  const [isModalVisible, setIsModalVisible] = useState(false); // Pentru meniul derulant
  
  // Referință la componenta MapView pentru a controla harta
  const mapRef = useRef(null); 

  const handleSearchPress = () => {
    if (navigation) {
      navigation.navigate('Search'); 
    } else {
      console.log("Navigația nu este disponibilă.");
    }
  };

  // Funcție pentru a schimba orașul și a centra harta
  const handleCityChange = (city) => {
    let newLocation;
    
    if (city.value === 'User' && userLocation) {
        newLocation = userLocation;
    } else if (city.value === 'User' && !userLocation) {
        // Dacă utilizatorul alege "User" dar locația nu e disponibilă, rămânem pe Galați
        newLocation = CITY_OPTIONS.find(c => c.value === 'Galati');
        setSelectedCity(newLocation);
    } else {
        newLocation = city;
    }
    
    setSelectedCity(city);
    setIsModalVisible(false); // Închide meniul
    
    // Mută harta la noua locație
    if (mapRef.current) {
        mapRef.current.animateToRegion({
            latitude: newLocation.latitude,
            longitude: newLocation.longitude,
            latitudeDelta: 0.0922,
            longitudeDelta: 0.0421,
        }, 1000); 
    }

    // Actualizează lista de locuri "Top" în funcție de noua referință
    updatePlaces(newLocation.latitude, newLocation.longitude);
  };
  
  // Haversine formula pentru distanță
  const getDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371; 
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * Math.PI / 180) *
        Math.cos(lat2 * Math.PI / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };
  
  // Funcție separată pentru a calcula și seta locurile (pentru reutilizare)
  const updatePlaces = (refLat, refLong) => {
      setReferenceLocation({ latitude: refLat, longitude: refLong });

      const placesWithDistance = locatii
        .map(place => ({
          ...place,
          distance: getDistance(
            refLat,
            refLong,
            place.coordinates.lat,
            place.coordinates.long
          ),
        }));

      setAllPlaces(placesWithDistance);

      const nearby = placesWithDistance
        .sort((a, b) => a.distance - b.distance) 
        .slice(0, 5) 
        .sort((a, b) => b.rating - a.rating)
        .slice(0, 2); 

      setTopPlaces(nearby);
  };


  useEffect(() => {
    (async () => {
      let currentCoords = null;
      let { status } = await Location.requestForegroundPermissionsAsync();
      
      if (status === 'granted') {
        try {
          let currentLocation = await Location.getCurrentPositionAsync({});
          currentCoords = currentLocation.coords;
          setUserLocation(currentLocation.coords); // Salvăm locația utilizatorului
        } catch (error) {
          console.log("Nu s-a putut prelua locația utilizatorului.");
        }
      }

      // La prima încărcare, se centrează pe orașul default (Galați)
      const initialRef = CITY_OPTIONS.find(c => c.value === 'Galati');
      
      updatePlaces(initialRef.latitude, initialRef.longitude);
      
    })();
  }, []);

  const initialRegion = referenceLocation ? {
    latitude: referenceLocation.latitude,
    longitude: referenceLocation.longitude,
    latitudeDelta: 0.0922,
    longitudeDelta: 0.0421,
  } : null;


  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      
      {/* Bara de Căutare */}
      <TouchableOpacity onPress={handleSearchPress} style={styles.searchContainer}>
        <TextInput
          style={[styles.searchBar, { backgroundColor: colors.card, color: colors.text }]}
          placeholder="Căutare locuri, adrese..."
          placeholderTextColor={colors.subtext}
          editable={false}
        />
      </TouchableOpacity>
      
      {/* Dropdown pentru Oraș */}
      <View style={styles.dropdownContainer}>
        <Text style={[styles.dropdownLabel, { color: colors.text }]}>Centrul hărții:</Text>
        <TouchableOpacity 
            onPress={() => setIsModalVisible(true)} 
            style={[styles.dropdownButton, { backgroundColor: colors.card, borderColor: colors.subtext }]}
        >
          <Text style={[styles.dropdownText, { color: colors.text }]}>
            {selectedCity.label}
          </Text>
        </TouchableOpacity>
      </View>

      {/* MODAL pentru Selectarea Orașului */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={isModalVisible}
        onRequestClose={() => setIsModalVisible(false)}
      >
        <TouchableOpacity 
            style={styles.modalOverlay} 
            activeOpacity={1}
            onPress={() => setIsModalVisible(false)}
        >
          <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
            {CITY_OPTIONS.map((city) => (
              <TouchableOpacity
                key={city.value}
                style={[styles.modalItem, city.value === selectedCity.value && { backgroundColor: colors.input }]}
                onPress={() => handleCityChange(city)}
                disabled={city.value === 'User' && !userLocation} // Dezactivează "Utilizator" dacă locația nu e disponibilă
              >
                <Text style={[styles.modalItemText, { color: colors.text }, city.value === 'User' && !userLocation && { color: colors.subtext }]}>
                  {city.label} 
                  {city.value === 'User' && !userLocation && ' (Indisponibil)'}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Harta */}
      {initialRegion && (
        <MapView
          ref={mapRef} // Adăugăm referința
          style={styles.map}
          initialRegion={initialRegion}
          showsUserLocation={!!userLocation} // Arată locația utilizatorului doar dacă a fost preluată
          loadingEnabled={true}
        >
          {/* TOATE locatiile sunt afișate ca Marker */}
          {allPlaces.map((place) => (
            <Marker
              key={place.name}
              coordinate={{
                latitude: place.coordinates.lat,
                longitude: place.coordinates.long,
              }}
              title={place.name}
              description={`${place.short_description} (${place.distance.toFixed(2)} km de ${selectedCity.label.split(',')[0]})`}
              pinColor={topPlaces.some(p => p.name === place.name) ? 'red' : 'blue'} 
            />
          ))}
        </MapView>
      )}

      <Text style={[styles.heading, { color: colors.text }]}>
        Top în zona ta:
      </Text>
      <FlatList
        data={topPlaces}
        keyExtractor={item => item.name}
        renderItem={({ item }) => (
          <View style={[styles.card, { backgroundColor: colors.card }]}>
            <Image 
                source={{ uri: item.image_url || 'https://placehold.co/100x100/CCCCCC/333333?text=Locatie' }} 
                style={styles.photo} 
                onError={(e) => console.log('Image load error:', e.nativeEvent.error)}
            />
            <View style={styles.cardText}>
              <Text style={[styles.placeName, { color: colors.text }]}>
                {item.name}
              </Text>
              <Text style={[styles.description, { color: colors.subtext }]}>
                {item.short_description}
              </Text>
              <Text style={[styles.distance, { color: colors.subtext }]}>
                {item.distance.toFixed(2)} km distanță
              </Text>
            </View>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingTop: 40 },
  searchContainer: {
    paddingHorizontal: 15,
    paddingVertical: 10,
    zIndex: 10,
  },
  searchBar: {
    padding: 12,
    borderRadius: 25,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#ccc',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  dropdownContainer: {
    paddingHorizontal: 15,
    paddingBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    zIndex: 9,
  },
  dropdownLabel: {
    fontSize: 14,
    marginRight: 10,
    fontWeight: '500',
  },
  dropdownButton: {
    flex: 1,
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
  },
  dropdownText: {
    fontSize: 14,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    width: '80%',
    borderRadius: 10,
    padding: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  modalItem: {
    padding: 15,
    borderRadius: 8,
    marginVertical: 4,
  },
  modalItemText: {
    fontSize: 16,
  },
  map: {
    width: '100%',
    height: height * MAP_HEIGHT_PERCENTAGE, 
  },
  heading: {
    fontSize: 18,
    fontWeight: 'bold',
    margin: 10,
    marginTop: 15,
  },
  card: {
    flexDirection: 'row',
    marginHorizontal: 10,
    borderRadius: 10,
    overflow: 'hidden',
    marginBottom: 10,
    elevation: 2, 
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1.41,
  },
  photo: {
    width: 100,
    height: 100,
    resizeMode: 'cover',
  },
  cardText: {
    flex: 1,
    padding: 10,
    justifyContent: 'center',
  },
  placeName: {
    fontWeight: 'bold',
    fontSize: 16,
    marginBottom: 2,
  },
  description: {
    fontSize: 12,
  },
  distance: {
    fontSize: 12,
    fontStyle: 'italic',
    marginTop: 5,
  }
});