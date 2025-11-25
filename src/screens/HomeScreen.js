import { Ionicons } from "@expo/vector-icons"; // Avem nevoie de Ionicons pentru Modal
import * as Location from "expo-location";
import { useEffect, useRef, useState } from "react";
import {
  Animated,
  Dimensions,
  FlatList,
  Image,
  Modal,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback, // Pentru închiderea modalului
  View,
} from "react-native";
import MapView, { Marker } from "react-native-maps";
import locatii from "../../locatii.json";
import { useTheme } from "../context/ThemeContext";

// Import imagini
const CoffeeBeanSVG = require("../../assets/images/coffee_bean.png");
const WhatsAppIcon = require("../../assets/images/whatsapp.png");

const { height } = Dimensions.get("window");

// Definirea înălțimilor Feed-ului
const INITIAL_FEED_HEIGHT = height * 0.25;
const FULL_FEED_HEIGHT = height * 0.5;

// Stil JSON pentru harta Dark Mode
const DARK_MAP_STYLE = [
  { elementType: "geometry", stylers: [{ color: "#242f3e" }] },
  { elementType: "labels.text.fill", stylers: [{ color: "#746855" }] },
  { elementType: "labels.text.stroke", stylers: [{ color: "#242f3e" }] },
  {
    featureType: "administrative.locality",
    elementType: "labels.text.fill",
    stylers: [{ color: "#d59563" }],
  },
  {
    featureType: "poi",
    elementType: "labels.text.fill",
    stylers: [{ color: "#d59563" }],
  },
  {
    featureType: "poi.park",
    elementType: "geometry",
    stylers: [{ color: "#263c3f" }],
  },
  {
    featureType: "poi.park",
    elementType: "labels.text.fill",
    stylers: [{ color: "#6b9a76" }],
  },
  {
    featureType: "road",
    elementType: "geometry",
    stylers: [{ color: "#38414e" }],
  },
  {
    featureType: "road",
    elementType: "geometry.stroke",
    stylers: [{ color: "#212a37" }],
  },
  {
    featureType: "road",
    elementType: "labels.text.fill",
    stylers: [{ color: "#9ca5b3" }],
  },
  {
    featureType: "road.highway",
    elementType: "geometry",
    stylers: [{ color: "#746855" }],
  },
  {
    featureType: "road.highway",
    elementType: "geometry.stroke",
    stylers: [{ color: "#1f2835" }],
  },
  {
    featureType: "road.highway",
    elementType: "labels.text.fill",
    stylers: [{ color: "#f3d19c" }],
  },
  {
    featureType: "transit",
    elementType: "geometry",
    stylers: [{ color: "#2f3948" }],
  },
  {
    featureType: "transit.station",
    elementType: "labels.text.fill",
    stylers: [{ color: "#d59563" }],
  },
  {
    featureType: "water",
    elementType: "geometry",
    stylers: [{ color: "#17263e" }],
  },
  {
    featureType: "water",
    elementType: "labels.text.fill",
    stylers: [{ color: "#515c6d" }],
  },
  {
    featureType: "water",
    elementType: "labels.text.stroke",
    stylers: [{ color: "#17263e" }],
  },
];

const CITY_OPTIONS = [
  {
    label: "Galați, România",
    value: "Galati",
    latitude: 45.4348,
    longitude: 28.0535,
  },
  {
    label: "București, România",
    value: "Bucuresti",
    latitude: 44.4268,
    longitude: 26.1025,
  },
  {
    label: "Cluj-Napoca, România",
    value: "Cluj",
    latitude: 46.7712,
    longitude: 23.6236,
  },
  {
    label: "Iași, România",
    value: "Iasi",
    latitude: 47.1585,
    longitude: 27.5959,
  },
  {
    label: "Utilizator (Locație Curentă)",
    value: "User",
    latitude: 0,
    longitude: 0,
  },
];

export default function HomeScreen({ navigation }) {
  // 1. Extragem culorile și tema curentă
  const { colors, theme } = useTheme();

  const [referenceLocation, setReferenceLocation] = useState(null);
  const [userLocation, setUserLocation] = useState(null);
  const [topPlaces, setTopPlaces] = useState([]);
  const [allPlaces, setAllPlaces] = useState([]);
  const [selectedCity, setSelectedCity] = useState(CITY_OPTIONS[0]);

  // State pentru Modalul de Oraș
  const [isCityModalVisible, setIsCityModalVisible] = useState(false);

  // State pentru Modalul de Detalii Locație (ca în SearchScreen)
  const [detailsModalVisible, setDetailsModalVisible] = useState(false);
  const [selectedPlace, setSelectedPlace] = useState(null);

  const [isFeedFull, setIsFeedFull] = useState(false);
  const [coffeePoints, setCoffeePoints] = useState(125);

  const mapRef = useRef(null);
  const feedHeight = useRef(new Animated.Value(INITIAL_FEED_HEIGHT)).current;

  // --- ANIMAȚIE FEED ---
  const animateFeed = (toValue) => {
    Animated.timing(feedHeight, {
      toValue,
      duration: 300,
      useNativeDriver: false,
    }).start(() => {
      setIsFeedFull(toValue === FULL_FEED_HEIGHT);
    });
  };

  const toggleFeedSize = () => {
    if (isFeedFull) {
      animateFeed(INITIAL_FEED_HEIGHT);
    } else {
      animateFeed(FULL_FEED_HEIGHT);
    }
  };

  // --- NAVIGARE ---
  const navigateToSearch = () => {
    if (navigation) navigation.navigate("Search");
  };

  const navigateToProfile = () => {
    if (navigation) navigation.navigate("Profile");
  };

  // --- LOGICĂ LOCAȚIE & HARTĂ ---
  const handleCityChange = (city) => {
    let newLocation;

    if (city.value === "User" && userLocation) {
      newLocation = userLocation;
    } else if (city.value === "User" && !userLocation) {
      newLocation = CITY_OPTIONS.find((c) => c.value === "Galati");
      setSelectedCity(newLocation);
    } else {
      newLocation = city;
    }

    setSelectedCity(city);
    setIsCityModalVisible(false);

    if (mapRef.current) {
      mapRef.current.animateToRegion(
        {
          latitude: newLocation.latitude,
          longitude: newLocation.longitude,
          latitudeDelta: 0.0922,
          longitudeDelta: 0.0421,
        },
        1000
      );
    }

    updatePlaces(newLocation.latitude, newLocation.longitude);
  };

  const getDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371;
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  const updatePlaces = (refLat, refLong) => {
    setReferenceLocation({ latitude: refLat, longitude: refLong });

    const placesWithDistance = locatii.map((place) => ({
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
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status === "granted") {
        try {
          let currentLocation = await Location.getCurrentPositionAsync({});
          setUserLocation(currentLocation.coords);
        } catch (error) {
          console.log("Nu s-a putut prelua locația utilizatorului.");
        }
      }
      let initialRef = CITY_OPTIONS.find((c) => c.value === "Galati");
      updatePlaces(initialRef.latitude, initialRef.longitude);
    })();
  }, []);

  const initialRegion = referenceLocation
    ? {
        latitude: referenceLocation.latitude,
        longitude: referenceLocation.longitude,
        latitudeDelta: 0.0922,
        longitudeDelta: 0.0421,
      }
    : null;

  // --- MODAL DETALII (Logica din SearchScreen) ---
  const openDetailsModal = (item) => {
    setSelectedPlace(item);
    setDetailsModalVisible(true);
  };

  // Componenta Footer pentru FlatList
  const ListFooter = () => (
    <TouchableOpacity
      style={[
        styles.seeMoreButton,
        { borderColor: "#D4AF37", backgroundColor: colors.card },
      ]}
      onPress={navigateToSearch}
    >
      <Text style={[styles.seeMoreText, { color: "#D4AF37" }]}>
        Vezi mai mult...
      </Text>
    </TouchableOpacity>
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* HEADER CONTAINER */}
      <View style={styles.headerContainer}>
        {/* Bara Căutare */}
        <TouchableOpacity
          style={styles.searchBarWrapper}
          onPress={() => navigation.navigate("Search")}
          activeOpacity={0.7}
        >
          <View pointerEvents="none">
            <TextInput
              style={[
                styles.searchBar,
                {
                  backgroundColor: colors.card,
                  color: colors.text,
                  borderColor: colors.border,
                },
              ]}
              placeholder="Căutare locuri, adrese..."
              placeholderTextColor={colors.subtext}
              editable={false}
            />
          </View>
        </TouchableOpacity>

        {/* Buton Puncte */}
        <TouchableOpacity
          style={[
            styles.coffeePointsButton,
            { backgroundColor: colors.card, borderColor: "#D4AF37" },
          ]}
          onPress={navigateToProfile}
        >
          <Image
            source={CoffeeBeanSVG}
            style={styles.coffeeBeanImage}
            resizeMode="contain"
          />
          <Text style={[styles.coffeePointsText, { color: "#D4AF37" }]}>
            {coffeePoints}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Dropdown Oraș */}
      <View style={styles.dropdownContainer}>
        <TouchableOpacity
          onPress={() => setIsCityModalVisible(true)}
          style={[
            styles.dropdownButton,
            {
              backgroundColor: colors.card,
              borderColor: "#D4AF37",
            },
          ]}
        >
          <Text style={[styles.dropdownText, { color: colors.text }]}>
            {selectedCity.label}
          </Text>
        </TouchableOpacity>
      </View>

      {/* MODAL ORAȘ (Listă simplă) */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={isCityModalVisible}
        onRequestClose={() => setIsCityModalVisible(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setIsCityModalVisible(false)}
        >
          <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
            {CITY_OPTIONS.map((city) => (
              <TouchableOpacity
                key={city.value}
                style={[
                  styles.modalItem,
                  city.value === selectedCity.value && {
                    backgroundColor: "#D4AF37" + "20",
                  },
                ]}
                onPress={() => handleCityChange(city)}
                disabled={city.value === "User" && !userLocation}
              >
                <Text
                  style={[
                    styles.modalItemText,
                    { color: colors.text },
                    city.value === "User" &&
                      !userLocation && { color: colors.subtext },
                  ]}
                >
                  {city.label}
                  {city.value === "User" && !userLocation && " (Indisponibil)"}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>

      {/* HARTA */}
      <View style={styles.mapContainer}>
        {initialRegion && (
          <MapView
            ref={mapRef}
            style={styles.map}
            initialRegion={initialRegion}
            showsUserLocation={!!userLocation}
            loadingEnabled={true}
            // Aplicăm Dark Style doar dacă tema este 'dark'
            customMapStyle={theme === "dark" ? DARK_MAP_STYLE : []}
          >
            {allPlaces.map((place) => (
              <Marker
                key={place.name}
                coordinate={{
                  latitude: place.coordinates.lat,
                  longitude: place.coordinates.long,
                }}
                title={place.name}
                description={`${place.distance.toFixed(2)} km`}
                pinColor={
                  topPlaces.some((p) => p.name === place.name) ? "red" : "gold"
                }
              />
            ))}
          </MapView>
        )}
      </View>

      {/* FEED (Lista Carduri) */}
      <Animated.View
        style={[
          styles.feedContainer,
          {
            height: feedHeight,
            // Folosim o culoare ușor transparentă bazată pe tema curentă
            backgroundColor:
              theme === "dark"
                ? "rgba(30, 30, 30, 0.95)"
                : "rgba(255, 255, 255, 0.95)",
            borderTopColor: colors.border,
            borderTopWidth: 1,
          },
        ]}
      >
        <TouchableOpacity
          style={styles.notchHandleContainer}
          onPress={toggleFeedSize}
        >
          <View
            style={[styles.notchHandle, { backgroundColor: colors.subtext }]}
          />
        </TouchableOpacity>

        <Text style={[styles.heading, { color: colors.text }]}>The Feed</Text>

        <FlatList
          data={topPlaces}
          keyExtractor={(item) => item.name}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.flatListContent}
          ListFooterComponent={ListFooter}
          renderItem={({ item }) => (
            // Aici am adăugat TouchableOpacity și onPress
            <TouchableOpacity
              activeOpacity={0.9}
              onPress={() => openDetailsModal(item)}
              style={[
                styles.cardRow,
                {
                  backgroundColor: colors.card,
                  borderColor: colors.border,
                  borderWidth: 1,
                },
              ]}
            >
              <Image
                source={{
                  uri:
                    item.image_url ||
                    "https://placehold.co/100x100/333333/D4AF37?text=LOC",
                }}
                style={styles.photoRow}
              />
              <View style={styles.cardTextRow}>
                {item.partener && (
                  <Text
                    style={[
                      styles.partnerTag,
                      { color: "#D4AF37", borderColor: "#D4AF37" },
                    ]}
                  >
                    PARTENER
                  </Text>
                )}

                <Text
                  style={[styles.placeNameRow, { color: colors.text }]}
                  numberOfLines={1}
                >
                  {item.name}
                </Text>
                <Text style={[styles.ratingRow, { color: "#D4AF37" }]}>
                  ★ {item.rating}
                </Text>
                <Text
                  style={[styles.descriptionRow, { color: colors.subtext }]}
                  numberOfLines={2}
                >
                  {item.short_description}
                </Text>
                <Text style={[styles.distanceRow, { color: colors.subtext }]}>
                  {item.distance.toFixed(2)} km distanță
                </Text>
              </View>
            </TouchableOpacity>
          )}
        />
      </Animated.View>

      {/* --- MODAL DETALII (Identic cu SearchScreen) --- */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={detailsModalVisible}
        onRequestClose={() => setDetailsModalVisible(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setDetailsModalVisible(false)}
        >
          <TouchableWithoutFeedback>
            <View
              style={[
                styles.detailsModalContent,
                { backgroundColor: colors.card },
              ]}
            >
              {selectedPlace && (
                <>
                  <View>
                    <Image
                      source={{ uri: selectedPlace.image_url }}
                      style={styles.detailsModalImage}
                    />
                    {/* Buton Close X */}
                    <TouchableOpacity
                      style={styles.closeIconBtn}
                      onPress={() => setDetailsModalVisible(false)}
                    >
                      <Ionicons name="close" size={24} color="#000" />
                    </TouchableOpacity>
                  </View>

                  <View style={styles.detailsModalBody}>
                    <Text
                      style={[styles.detailsModalTitle, { color: colors.text }]}
                    >
                      {selectedPlace.name}
                    </Text>

                    {selectedPlace.partener && (
                      <Text
                        style={{
                          color: colors.primary,
                          fontWeight: "bold",
                          marginBottom: 10,
                        }}
                      >
                        ⭐ LOCAȚIE PARTENER
                      </Text>
                    )}

                    <View
                      style={{
                        flexDirection: "row",
                        alignItems: "center",
                        marginBottom: 10,
                      }}
                    >
                      <Ionicons
                        name="location"
                        size={18}
                        color={colors.primary}
                      />
                      <Text
                        style={[
                          styles.detailsModalAddress,
                          { color: colors.subtext },
                        ]}
                      >
                        {selectedPlace.address}
                      </Text>
                    </View>

                    <Text
                      style={{
                        color: colors.subtext,
                        fontStyle: "italic",
                        marginBottom: 5,
                      }}
                    >
                      Tip:{" "}
                      {selectedPlace.type
                        ? selectedPlace.type.toUpperCase()
                        : "N/A"}
                    </Text>

                    <Text
                      style={[styles.detailsModalDesc, { color: colors.text }]}
                    >
                      {selectedPlace.short_description}
                    </Text>

                    <View
                      style={[
                        styles.ratingContainer,
                        { marginTop: 10, marginBottom: 20 },
                      ]}
                    >
                      <Ionicons name="star" size={24} color="#FFD700" />
                      <Text
                        style={{
                          fontSize: 20,
                          fontWeight: "bold",
                          marginLeft: 5,
                          color: colors.text,
                        }}
                      >
                        {selectedPlace.rating}
                      </Text>
                    </View>

                    {/* Buton WhatsApp */}
                    <TouchableOpacity
                      style={styles.whatsappButton}
                      onPress={() =>
                        console.log("Rezervă la " + selectedPlace.name)
                      }
                    >
                      <Image
                        source={WhatsAppIcon}
                        style={styles.whatsappIcon}
                        resizeMode="contain"
                      />
                      <Text style={styles.whatsappText}>Rezervă</Text>
                    </TouchableOpacity>
                  </View>
                </>
              )}
            </View>
          </TouchableWithoutFeedback>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 40,
  },
  headerContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 15,
    paddingVertical: 10,
    zIndex: 10,
  },
  searchBarWrapper: {
    flex: 1,
    marginRight: 10,
  },
  searchBar: {
    padding: 12,
    borderRadius: 15,
    fontSize: 16,
    borderWidth: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 5,
  },
  coffeePointsButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 15,
    borderWidth: 1,
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 3,
  },
  coffeeBeanImage: {
    width: 20,
    height: 20,
    marginRight: 4,
  },
  coffeePointsText: {
    fontSize: 16,
    fontWeight: "bold",
  },
  dropdownContainer: {
    paddingHorizontal: 15,
    paddingBottom: 10,
    flexDirection: "row",
    alignItems: "center",
    zIndex: 9,
  },
  dropdownButton: {
    flex: 1,
    padding: 10,
    borderRadius: 10,
    borderWidth: 1,
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 3,
  },
  dropdownText: {
    fontSize: 14,
  },
  mapContainer: {
    flex: 1,
  },
  map: {
    width: "100%",
    height: "100%",
  },
  feedContainer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -5 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 15,
    paddingBottom: 20,
  },
  notchHandleContainer: {
    alignItems: "center",
    paddingVertical: 10,
    backgroundColor: "transparent",
    marginTop: -5,
  },
  notchHandle: {
    width: 40,
    height: 5,
    borderRadius: 5,
  },
  heading: {
    fontSize: 20,
    fontWeight: "bold",
    marginHorizontal: 15,
    marginTop: 5,
    marginBottom: 5,
  },
  flatListContent: {
    paddingVertical: 5,
  },
  // --- STILURI CARD FEED ---
  cardRow: {
    flexDirection: "row",
    marginHorizontal: 15,
    borderRadius: 12,
    marginBottom: 10,
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    overflow: "hidden",
    height: 150,
  },
  photoRow: {
    width: 100,
    height: "100%",
    resizeMode: "cover",
    borderTopLeftRadius: 12,
    borderBottomLeftRadius: 12,
  },
  cardTextRow: {
    flex: 1,
    padding: 10,
    justifyContent: "center",
  },
  partnerTag: {
    fontSize: 10,
    fontWeight: "bold",
    alignSelf: "flex-end",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderWidth: 1,
    borderRadius: 4,
    marginTop: -5,
  },
  placeNameRow: {
    fontWeight: "bold",
    fontSize: 16,
    marginBottom: 1,
  },
  ratingRow: {
    fontSize: 14,
    fontWeight: "bold",
    marginBottom: 2,
  },
  descriptionRow: {
    fontSize: 10,
  },
  distanceRow: {
    fontSize: 10,
    fontStyle: "italic",
    marginTop: 2,
  },
  seeMoreButton: {
    marginHorizontal: 15,
    marginTop: 5,
    marginBottom: 15,
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: "center",
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  seeMoreText: {
    fontSize: 16,
    fontWeight: "bold",
  },

  // --- STILURI PENTRU MODALURI ---
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  modalContent: {
    width: "80%",
    borderRadius: 12,
    padding: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 8,
  },
  modalItem: {
    padding: 15,
    borderRadius: 8,
    marginVertical: 4,
  },
  modalItemText: {
    fontSize: 16,
  },

  // --- STILURI MODAL DETALII (Locație) ---
  detailsModalContent: {
    width: "100%",
    borderRadius: 20,
    overflow: "hidden",
    paddingBottom: 20,
    elevation: 10,
  },
  detailsModalImage: {
    width: "100%",
    height: 200,
    resizeMode: "cover",
  },
  detailsModalBody: {
    padding: 20,
  },
  detailsModalTitle: { fontSize: 24, fontWeight: "bold", marginBottom: 5 },
  detailsModalAddress: { fontSize: 14, marginLeft: 5 },
  detailsModalDesc: { fontSize: 16, marginTop: 10, lineHeight: 22 },

  closeIconBtn: {
    position: "absolute",
    top: 15,
    right: 15,
    backgroundColor: "rgba(255,255,255,0.8)",
    borderRadius: 20,
    width: 36,
    height: 36,
    justifyContent: "center",
    alignItems: "center",
    elevation: 5,
    zIndex: 10,
  },
  ratingContainer: { flexDirection: "row", alignItems: "center" },

  whatsappButton: {
    flexDirection: "row",
    backgroundColor: "#25D366",
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 30,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 10,
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    alignSelf: "flex-end",
  },
  whatsappIcon: {
    width: 24,
    height: 24,
    marginRight: 10,
  },
  whatsappText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
  },
});
