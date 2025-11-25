import * as Location from "expo-location";
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  Animated,
  Dimensions,
  FlatList,
  Image,
  Modal,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import MapView, {
  Marker,
  PROVIDER_DEFAULT,
  PROVIDER_GOOGLE,
} from "react-native-maps";
import { useFocusEffect } from "@react-navigation/native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import locatii from "../../locatii.json";
import { useTheme } from "../context/ThemeContext";

// IMPORTURI COMPONENTE
import LocationCard from "../components/LocationCard";
import LocationDetailsModal from "../components/LocationDetailsModal";

const CoffeeBeanSVG = require("../../assets/images/coffee_bean.png");
const { height } = Dimensions.get("window");

// --- DIMENSIUNI FEED ---
const MAX_FEED_HEIGHT = height * 0.55;
const MIN_FEED_HEIGHT = height * 0.28;
const DRAG_RANGE = MAX_FEED_HEIGHT - MIN_FEED_HEIGHT;

// --- STIL HARTA DARK ---
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

// --- COMPONENTĂ MAPĂ IZOLATĂ ---
const MemoizedMap = React.memo(
  ({ mapRef, region, userLocation, markers, themeStyle }) => {
    return (
      <MapView
        ref={mapRef}
        provider={
          Platform.OS === "android" ? PROVIDER_GOOGLE : PROVIDER_DEFAULT
        }
        style={StyleSheet.absoluteFillObject}
        initialRegion={region}
        showsUserLocation={!!userLocation}
        showsMyLocationButton={false}
        loadingEnabled={true}
        customMapStyle={themeStyle}
        moveOnMarkerPress={false}
        rotateEnabled={false}
        pitchEnabled={false}
      >
        {markers}
      </MapView>
    );
  }
);

export default function HomeScreen({ navigation }) {
  const { colors, theme } = useTheme();

  const [referenceLocation, setReferenceLocation] = useState(null);
  const [userLocation, setUserLocation] = useState(null);
  const [topPlaces, setTopPlaces] = useState([]);
  const [allPlaces, setAllPlaces] = useState([]);
  const [selectedCity, setSelectedCity] = useState(CITY_OPTIONS[0]);

  const [isCityModalVisible, setIsCityModalVisible] = useState(false);
  const [detailsModalVisible, setDetailsModalVisible] = useState(false);
  const [selectedPlace, setSelectedPlace] = useState(null);

  const [isFeedExpanded, setIsFeedExpanded] = useState(false);
  
  const [coffeePoints, setCoffeePoints] = useState(0);
  const [isGiftModalVisible, setIsGiftModalVisible] = useState(false);

  // --- STATE FAVORITE ---
  const [favoritesIds, setFavoritesIds] = useState([]);

  const mapRef = useRef(null);
  const translateY = useRef(new Animated.Value(0)).current;

  // --- LOGICA PUNCTE & CADOU ---
  const loadUserDataAndCheckGift = async () => {
    try {
      const email = await AsyncStorage.getItem("user_session");
      if (!email) return;

      // 1. Încărcare puncte existente
      const pointsKey = `user_points_${email}`;
      const savedPoints = await AsyncStorage.getItem(pointsKey);
      
      let currentPoints = 0;
      if (savedPoints !== null) {
        currentPoints = parseInt(savedPoints, 10);
      }
      setCoffeePoints(currentPoints);

      // 2. Verificare dacă a primit cadoul
      const giftKey = `gift_claimed_${email}`;
      const giftClaimed = await AsyncStorage.getItem(giftKey);

      if (giftClaimed !== "true") {
        setTimeout(() => {
            setIsGiftModalVisible(true);
        }, 1000); 
      }

    } catch (e) {
      console.error("Eroare incarcare puncte home:", e);
    }
  };

  // --- LOGICA FAVORITE ---
  const loadFavorites = async () => {
    try {
      const email = await AsyncStorage.getItem("user_session");
      if (email) {
        const favKey = `favorite_locations_${email}`;
        const storedFavs = await AsyncStorage.getItem(favKey);
        if (storedFavs) {
          setFavoritesIds(JSON.parse(storedFavs));
        } else {
          setFavoritesIds([]);
        }
      }
    } catch (e) {
      console.error("Error loading favorites:", e);
    }
  };

  const handleAcceptGift = async () => {
    try {
      const email = await AsyncStorage.getItem("user_session");
      if (!email) return;

      const pointsKey = `user_points_${email}`;
      const giftKey = `gift_claimed_${email}`;

      const newPoints = coffeePoints + 200;

      await AsyncStorage.setItem(pointsKey, newPoints.toString());
      await AsyncStorage.setItem(giftKey, "true");

      setCoffeePoints(newPoints);
      setIsGiftModalVisible(false);
    } catch (e) {
      console.error("Eroare salvare cadou:", e);
    }
  };

  // Use Focus Effect
  useFocusEffect(
    useCallback(() => {
      loadUserDataAndCheckGift();
      loadFavorites(); // <--- Încărcăm favoritele
    }, [])
  );

  const toggleFeedSize = () => {
    const toValue = isFeedExpanded ? 0 : -DRAG_RANGE;

    Animated.timing(translateY, {
      toValue,
      duration: 300,
      useNativeDriver: true,
    }).start(() => {
      setIsFeedExpanded(!isFeedExpanded);
    });
  };

  const calculateDistance = useCallback((lat1, lon1, lat2, lon2) => {
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
  }, []);

  const updatePlaces = useCallback(
    (refLat, refLong) => {
      if (!refLat || !refLong) return;
      setReferenceLocation({ latitude: refLat, longitude: refLong });

      const placesWithDistance = locatii.map((place) => ({
        ...place,
        distance: calculateDistance(
          refLat,
          refLong,
          place.coordinates.lat,
          place.coordinates.long
        ),
      }));

      setAllPlaces(placesWithDistance);

      const nearby = [...placesWithDistance]
        .sort((a, b) => a.distance - b.distance)
        .slice(0, 15)
        .sort((a, b) => b.rating - a.rating)
        .slice(0, 5);

      setTopPlaces(nearby);
    },
    [calculateDistance]
  );

  const openDetailsModal = useCallback((item) => {
    setSelectedPlace(item);
    setDetailsModalVisible(true);
  }, []);

  const mapMarkers = useMemo(() => {
    return allPlaces.map((place) => (
      <Marker
        key={place.name}
        coordinate={{
          latitude: place.coordinates.lat,
          longitude: place.coordinates.long,
        }}
        title={place.name}
        pinColor={topPlaces.some((p) => p.name === place.name) ? "red" : "gold"}
        tracksViewChanges={false}
        onPress={() => openDetailsModal(place)}
      />
    ));
  }, [allPlaces, topPlaces, openDetailsModal]);

  const handleCityChange = (city) => {
    let newLocation = city;
    if (city.value === "User" && !userLocation) {
      const fallback =
        CITY_OPTIONS.find((c) => c.value === "Galati") || CITY_OPTIONS[0];
      newLocation = fallback;
      setSelectedCity(fallback);
    } else {
      setSelectedCity(city);
      if (city.value === "User" && userLocation) {
        newLocation = {
          ...city,
          latitude: userLocation.latitude,
          longitude: userLocation.longitude,
        };
      }
    }
    setIsCityModalVisible(false);

    if (mapRef.current && newLocation && newLocation.latitude) {
      mapRef.current.animateToRegion(
        {
          latitude: newLocation.latitude,
          longitude: newLocation.longitude,
          latitudeDelta: 0.0922,
          longitudeDelta: 0.0421,
        },
        800
      );
      updatePlaces(newLocation.latitude, newLocation.longitude);
    }
  };

  useEffect(() => {
    let isMounted = true;
    const initApp = async () => {
      try {
        let { status } = await Location.requestForegroundPermissionsAsync();
        if (!isMounted) return;
        if (status === "granted") {
          let loc = await Location.getCurrentPositionAsync({
            accuracy: Location.Accuracy.Balanced,
          });
          if (isMounted) setUserLocation(loc.coords);
        }
        const initialRef =
          CITY_OPTIONS.find((c) => c.value === "Galati") || CITY_OPTIONS[0];
        if (isMounted && initialRef)
          updatePlaces(initialRef.latitude, initialRef.longitude);
      } catch (e) {
        console.log(e);
      }
    };
    initApp();
    return () => {
      isMounted = false;
    };
  }, [updatePlaces]);

  const renderFeedItem = useCallback(
    ({ item }) => {
      const isFav = favoritesIds.includes(item.id || item.name);
      return (
        <LocationCard
          item={item}
          onPress={() => openDetailsModal(item)}
          showDistance={true}
          isFavorite={isFav} // <--- Trimitem starea
        />
      );
    },
    [openDetailsModal, favoritesIds] // <--- Adăugat dependință
  );

  const navigateToSearch = () => navigation?.navigate("Search");
  const navigateToProfile = () => navigation?.navigate("Profile");

  const initialRegion = useMemo(
    () =>
      referenceLocation
        ? {
            latitude: referenceLocation.latitude,
            longitude: referenceLocation.longitude,
            latitudeDelta: 0.0922,
            longitudeDelta: 0.0421,
          }
        : null,
    [referenceLocation]
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* HEADER */}
      <View style={styles.headerContainer}>
        <TouchableOpacity
          style={styles.searchBarWrapper}
          onPress={navigateToSearch}
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
              placeholder="Căutare locuri..."
              placeholderTextColor={colors.subtext}
              editable={false}
            />
          </View>
        </TouchableOpacity>
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

      {/* DROPDOWN */}
      <View style={styles.dropdownContainer}>
        <TouchableOpacity
          onPress={() => setIsCityModalVisible(true)}
          style={[
            styles.dropdownButton,
            { backgroundColor: colors.card, borderColor: "#D4AF37" },
          ]}
        >
          <Text style={[styles.dropdownText, { color: colors.text }]}>
            {selectedCity?.label || "Selectează"}
          </Text>
        </TouchableOpacity>
      </View>

      {/* MODAL ORAȘ */}
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
                  selectedCity?.value === city.value && {
                    backgroundColor: "#D4AF37" + "20",
                  },
                ]}
                onPress={() => handleCityChange(city)}
              >
                <Text style={[styles.modalItemText, { color: colors.text }]}>
                  {city.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>

      {/* --- MODAL CADOU (GIFT MODAL) --- */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={isGiftModalVisible}
        onRequestClose={() => {}} 
      >
        <View style={styles.giftBackdrop}>
           <View style={[styles.giftContainer, { backgroundColor: colors.card }]}>
              <Image source={CoffeeBeanSVG} style={styles.giftIcon} />
              <Text style={[styles.giftTitle, {color: colors.text}]}>
                Un mic cadou din partea noastră!
              </Text>
              <Text style={[styles.giftSubtitle, {color: colors.subtext}]}>
                Mulțumim că ești alături de noi. Ai primit:
              </Text>
              <Text style={[styles.giftPoints, {color: colors.primary}]}>
                200 Puncte
              </Text>
              <TouchableOpacity 
                style={[styles.giftButton, { backgroundColor: colors.primary }]}
                onPress={handleAcceptGift}
              >
                <Text style={styles.giftButtonText}>Acceptă</Text>
              </TouchableOpacity>
           </View>
        </View>
      </Modal>

      {/* MAPA IZOLATĂ */}
      <View style={styles.mapContainer}>
        {initialRegion && (
          <MemoizedMap
            mapRef={mapRef}
            region={initialRegion}
            userLocation={userLocation}
            markers={mapMarkers}
            themeStyle={theme === "dark" ? DARK_MAP_STYLE : []}
          />
        )}
      </View>

      {/* FEED ANIMAT */}
      <Animated.View
        style={[
          styles.feedContainer,
          {
            height: MAX_FEED_HEIGHT,
            backgroundColor:
              theme === "dark"
                ? "rgba(30, 30, 30, 0.98)"
                : "rgba(255, 255, 255, 0.98)",
            borderTopColor: colors.border,
            borderTopWidth: 1,
            transform: [{ translateY: translateY }],
            bottom: MIN_FEED_HEIGHT - MAX_FEED_HEIGHT,
          },
        ]}
      >
        <TouchableOpacity
          style={styles.notchHandleContainer}
          onPress={toggleFeedSize}
          activeOpacity={0.9}
        >
          <View
            style={[styles.notchHandle, { backgroundColor: colors.subtext }]}
          />
        </TouchableOpacity>

        <Text style={[styles.heading, { color: colors.text }]}>
          Recomandări
        </Text>

        <FlatList
          data={topPlaces}
          keyExtractor={(item) => item.name}
          renderItem={renderFeedItem}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.flatListContent}
          getItemLayout={(data, index) => ({
            length: 160,
            offset: 160 * index,
            index,
          })}
          initialNumToRender={4}
          maxToRenderPerBatch={2}
          windowSize={3}
          removeClippedSubviews={true}
          extraData={favoritesIds} // <--- IMPORTANT
          ListFooterComponent={
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
          }
        />
      </Animated.View>

      <LocationDetailsModal
        visible={detailsModalVisible}
        location={selectedPlace}
        onClose={() => setDetailsModalVisible(false)}
        onPointsUpdate={loadUserDataAndCheckGift}
        onFavoriteUpdate={loadFavorites} // <--- CALLBACK PENTRU UPDATE
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingTop: 40 },
  headerContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 15,
    paddingVertical: 10,
    zIndex: 10,
  },
  searchBarWrapper: { flex: 1, marginRight: 10 },
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
  coffeeBeanImage: { width: 20, height: 20, marginRight: 4 },
  coffeePointsText: { fontSize: 16, fontWeight: "bold" },
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
  dropdownText: { fontSize: 14 },
  mapContainer: { flex: 1 },
  feedContainer: {
    position: "absolute",
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
  notchHandle: { width: 40, height: 5, borderRadius: 5 },
  heading: {
    fontSize: 20,
    fontWeight: "bold",
    marginHorizontal: 15,
    marginTop: 5,
    marginBottom: 5,
  },
  flatListContent: { paddingVertical: 5 },
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
  seeMoreText: { fontSize: 16, fontWeight: "bold" },
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
  modalItem: { padding: 15, borderRadius: 8, marginVertical: 4 },
  modalItemText: { fontSize: 16 },

  // --- STILURI CADOU ---
  giftBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.85)", // Fundal întunecat opac
    justifyContent: "center",
    alignItems: "center",
  },
  giftContainer: {
    width: "80%",
    borderRadius: 20,
    padding: 30,
    alignItems: "center",
    elevation: 10,
  },
  giftIcon: {
    width: 60, 
    height: 60,
    resizeMode: 'contain',
    marginBottom: 20
  },
  giftTitle: {
    fontSize: 22,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 10,
  },
  giftSubtitle: {
    fontSize: 14,
    textAlign: "center",
    marginBottom: 20,
  },
  giftPoints: {
    fontSize: 32,
    fontWeight: "bold",
    marginBottom: 30,
  },
  giftButton: {
    paddingVertical: 12,
    paddingHorizontal: 40,
    borderRadius: 25,
  },
  giftButtonText: {
    color: "#000", // Sau #FFF in functie de contrastul cu primary
    fontSize: 16,
    fontWeight: "bold",
  },
});