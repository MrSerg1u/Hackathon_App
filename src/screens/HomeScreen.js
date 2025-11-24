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
  View,
} from "react-native";
import MapView, { Marker } from "react-native-maps";
import locatii from "../../locatii.json";
import { useTheme } from "../context/ThemeContext";
// Importul imaginii PNG locale
const CoffeeBeanSVG = require("../../assets/images/coffee_bean.png");

const { height } = Dimensions.get("window");

const MAP_HEIGHT_PERCENTAGE = 0.55;

// Definirea înălțimilor Feed-ului
const INITIAL_FEED_HEIGHT = height * 0.25; // 25% din ecran (poziția implicită)
const FULL_FEED_HEIGHT = height * 0.5; // 50% din ecran (poziția extinsă)

// Culori personalizate pentru a se potrivi cu stilul întunecat/auriu din imagine
const CUSTOM_COLORS = {
  BACKGROUND: "#121212", // Fundal opac pentru întregul ecran (deasupra hărții)
  CARD: "#1E1E1E",
  TEXT_PRIMARY: "#FFFFFF",
  TEXT_SECONDARY: "#AAAAAA",
  ACCENT_GOLD: "#D4AF37", // Auriu pentru elemente de accent
  NOTCH_HANDLE: "#555555",
  // Fundalul Feed-ului cu transparență (50% opacitate)
  BACKGROUND_FEED_TRANSPARENT: "rgba(18, 18, 18, 0.5)",
};

// Stil JSON pentru harta Google Maps pentru a fi întunecată (Păstrat)
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

// Lista de orașe predefinite cu coordonate (inclusiv Galați ca default)
const CITY_OPTIONS = [
  {
    label: "Galați, România (Implicit)",
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

const firstPlace = locatii[0] || CITY_OPTIONS.find((c) => c.value === "Galati");

export default function HomeScreen({ navigation }) {
  const { colors } = useTheme();
  const [referenceLocation, setReferenceLocation] = useState(null);
  const [userLocation, setUserLocation] = useState(null);
  const [topPlaces, setTopPlaces] = useState([]);
  const [allPlaces, setAllPlaces] = useState([]);
  const [selectedCity, setSelectedCity] = useState(CITY_OPTIONS[0]);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isFeedFull, setIsFeedFull] = useState(false); // Starea Feed-ului (extins/restrâns)
  const [coffeePoints, setCoffeePoints] = useState(125); // Puncte de cafea (valoare random)

  const mapRef = useRef(null);
  // Variabila animată pentru înălțimea Feed-ului
  const feedHeight = useRef(new Animated.Value(INITIAL_FEED_HEIGHT)).current;

  // Funcția de animație pentru extindere/restrângere
  const animateFeed = (toValue) => {
    Animated.timing(feedHeight, {
      toValue,
      duration: 300,
      useNativeDriver: false, // Manipulăm proprietăți de layout (height)
    }).start(() => {
      setIsFeedFull(toValue === FULL_FEED_HEIGHT);
    });
  };

  // NOU: Funcție simplă de comutare la apăsare (click)
  const toggleFeedSize = () => {
    if (isFeedFull) {
      animateFeed(INITIAL_FEED_HEIGHT);
    } else {
      animateFeed(FULL_FEED_HEIGHT);
    }
  };

  // Funcție pentru navigarea la ecranul de căutare (folosită și de bara de căutare)
  const navigateToSearch = () => {
    if (navigation) {
      navigation.navigate("Search");
    } else {
      console.log(
        "Navigația nu este disponibilă. Nu s-a putut naviga la 'Search'."
      );
    }
  };

  // Funcție pentru navigarea la ecranul de Profil
  const navigateToProfile = () => {
    if (navigation) {
      navigation.navigate("Profile");
    } else {
      console.log(
        "Navigația nu este disponibilă. Nu s-a putut naviga la 'Profile'."
      );
    }
  };

  const handleSearchPress = navigateToSearch;

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
    setIsModalVisible(false);

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
      let currentCoords = null;
      let { status } = await Location.requestForegroundPermissionsAsync();

      if (status === "granted") {
        try {
          let currentLocation = await Location.getCurrentPositionAsync({});
          currentCoords = currentLocation.coords;
          setUserLocation(currentLocation.coords);
        } catch (error) {
          console.log("Nu s-a putut prelua locația utilizatorului.");
        }
      }

      let initialRef = CITY_OPTIONS.find((c) => c.value === "Galati");

      if (currentCoords) {
        // Lăsată comentată pentru a menține Galațiul ca default conform cerințelor anterioare.
      }

      // Încărcăm datele (markeri și feed) imediat cu coordonatele implicite (Galați)
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

  // Componenta Footer pentru FlatList (butonul "Vezi mai mult...")
  const ListFooter = () => (
    <TouchableOpacity
      style={[styles.seeMoreButton, { borderColor: CUSTOM_COLORS.ACCENT_GOLD }]}
      onPress={navigateToSearch}
    >
      <Text style={[styles.seeMoreText, { color: CUSTOM_COLORS.ACCENT_GOLD }]}>
        Vezi mai mult...
      </Text>
    </TouchableOpacity>
  );

  return (
    <View
      style={[styles.container, { backgroundColor: CUSTOM_COLORS.BACKGROUND }]}
    >
      {/* HEADER CONTAINER */}
      <View style={styles.headerContainer}>
        {/* --- BARA DE CĂUTARE CARE FACE REDIRECT --- */}
        <TouchableOpacity
          style={styles.searchBarWrapper}
          onPress={() => navigation.navigate("Search")} // <--- AICI ESTE NAVIGAREA
          activeOpacity={0.7}
        >
          {/* pointerEvents="none" este MAGIA. 
              Face ca TextInput să fie ignorat la click, 
              deci click-ul ajunge la TouchableOpacity */}
          <View pointerEvents="none">
            <TextInput
              style={[
                styles.searchBar,
                {
                  backgroundColor: CUSTOM_COLORS.CARD,
                  color: CUSTOM_COLORS.TEXT_PRIMARY,
                },
              ]}
              placeholder="Căutare locuri, adrese..."
              placeholderTextColor={CUSTOM_COLORS.TEXT_SECONDARY}
              editable={false} // Important: Nu lăsăm tastatura să apară aici
            />
          </View>
        </TouchableOpacity>

        {/* Buton Puncte de Cafea */}
        <TouchableOpacity
          style={[
            styles.coffeePointsButton,
            { backgroundColor: CUSTOM_COLORS.CARD },
          ]}
          onPress={navigateToProfile}
        >
          <Image
            source={CoffeeBeanSVG}
            style={styles.coffeeBeanImage}
            resizeMode="contain"
          />
          <Text
            style={[
              styles.coffeePointsText,
              { color: CUSTOM_COLORS.ACCENT_GOLD },
            ]}
          >
            {coffeePoints}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Dropdown pentru Oraș */}
      <View style={styles.dropdownContainer}>
        <TouchableOpacity
          onPress={() => setIsModalVisible(true)}
          style={[
            styles.dropdownButton,
            {
              backgroundColor: CUSTOM_COLORS.CARD,
              borderColor: CUSTOM_COLORS.ACCENT_GOLD,
            },
          ]}
        >
          <Text
            style={[styles.dropdownText, { color: CUSTOM_COLORS.TEXT_PRIMARY }]}
          >
            {selectedCity.label}
          </Text>
        </TouchableOpacity>
      </View>

      {/* MODAL pentru Selectarea Orașului (fără modificări) */}
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
          <View
            style={[
              styles.modalContent,
              { backgroundColor: CUSTOM_COLORS.CARD },
            ]}
          >
            {CITY_OPTIONS.map((city) => (
              <TouchableOpacity
                key={city.value}
                style={[
                  styles.modalItem,
                  city.value === selectedCity.value && {
                    backgroundColor: CUSTOM_COLORS.ACCENT_GOLD + "20",
                  },
                ]}
                onPress={() => handleCityChange(city)}
                disabled={city.value === "User" && !userLocation}
              >
                <Text
                  style={[
                    styles.modalItemText,
                    { color: CUSTOM_COLORS.TEXT_PRIMARY },
                    city.value === "User" &&
                      !userLocation && { color: CUSTOM_COLORS.TEXT_SECONDARY },
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

      {/* Harta ocupă spațiul rămas */}
      <View style={styles.mapContainer}>
        {initialRegion && (
          <MapView
            ref={mapRef}
            style={styles.map}
            initialRegion={initialRegion}
            showsUserLocation={!!userLocation}
            loadingEnabled={true}
            customMapStyle={DARK_MAP_STYLE}
          >
            {/* Markeri */}
            {allPlaces.map((place) => (
              <Marker
                key={place.name}
                coordinate={{
                  latitude: place.coordinates.lat,
                  longitude: place.coordinates.long,
                }}
                title={place.name}
                description={`${place.distance.toFixed(2)} km de ${
                  selectedCity.label.split(",")[0]
                })${
                  place.name.includes(selectedCity.label.split(",")[0])
                    ? " (Aici)"
                    : ""
                }`}
                pinColor={
                  topPlaces.some((p) => p.name === place.name) ? "red" : "gold"
                }
              />
            ))}
          </MapView>
        )}
      </View>

      {/* The Feed - Cu funcționalitate de tragere/extindere */}
      <Animated.View
        style={[
          styles.feedContainer,
          {
            height: feedHeight,
            backgroundColor: CUSTOM_COLORS.BACKGROUND_FEED_TRANSPARENT,
          },
        ]}
      >
        {/* Notch / Mâner de tragere */}
        <TouchableOpacity
          style={styles.notchHandleContainer}
          onPress={toggleFeedSize} // Comută Feed-ul la apăsare (click)
        >
          <View
            style={[
              styles.notchHandle,
              { backgroundColor: CUSTOM_COLORS.NOTCH_HANDLE },
            ]}
          />
        </TouchableOpacity>

        <Text style={[styles.heading, { color: CUSTOM_COLORS.TEXT_PRIMARY }]}>
          The Feed
        </Text>

        <FlatList
          data={topPlaces}
          keyExtractor={(item) => item.name}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.flatListContent}
          // ADAUGAREA LIST FOOTER COMPONENT
          ListFooterComponent={ListFooter}
          renderItem={({ item }) => (
            // Cardul folosește flex-direction: row pentru a alinia imaginea și textul
            <View
              style={[styles.cardRow, { backgroundColor: CUSTOM_COLORS.CARD }]}
            >
              {/* Imaginea la stânga (și mai mică) */}
              <Image
                source={{
                  uri:
                    item.image_url ||
                    "https://placehold.co/100x100/333333/D4AF37?text=LOC",
                }}
                style={styles.photoRow}
                onError={(e) =>
                  console.log("Image load error:", e.nativeEvent.error)
                }
              />
              {/* Textul la dreapta (alignat pe verticală) */}
              <View style={styles.cardTextRow}>
                <Text
                  style={[
                    styles.partnerTag,
                    {
                      color: CUSTOM_COLORS.ACCENT_GOLD,
                      borderColor: CUSTOM_COLORS.ACCENT_GOLD,
                    },
                  ]}
                >
                  PARTENER
                </Text>
                <Text
                  style={[
                    styles.placeNameRow,
                    { color: CUSTOM_COLORS.TEXT_PRIMARY },
                  ]}
                >
                  {item.name}
                </Text>
                <Text
                  style={[
                    styles.ratingRow,
                    { color: CUSTOM_COLORS.ACCENT_GOLD },
                  ]}
                >
                  ★ {item.rating}
                </Text>
                <Text
                  style={[
                    styles.descriptionRow,
                    { color: CUSTOM_COLORS.TEXT_SECONDARY },
                  ]}
                >
                  {item.short_description}
                </Text>
                <Text
                  style={[
                    styles.distanceRow,
                    { color: CUSTOM_COLORS.TEXT_SECONDARY },
                  ]}
                >
                  {item.distance.toFixed(2)} km distanță
                </Text>
              </View>
            </View>
          )}
        />
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 40,
  },
  // NOU: Container care include bara de căutare și punctele de cafea pe același rând
  headerContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 15,
    paddingVertical: 10,
    zIndex: 10,
  },
  searchBarWrapper: {
    flex: 1, // Permite barei de căutare să ocupe spațiul rămas
    marginRight: 10,
  },
  searchBar: {
    padding: 12,
    borderRadius: 15,
    fontSize: 16,
    borderWidth: 1,
    borderColor: "#333333",
    shadowColor: CUSTOM_COLORS.ACCENT_GOLD,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 5,
  },
  // NOU: Stil pentru butonul de puncte de cafea
  coffeePointsButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: CUSTOM_COLORS.ACCENT_GOLD,
    shadowColor: CUSTOM_COLORS.ACCENT_GOLD,
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 3,
  },
  // NOU: Stil pentru imaginea PNG
  coffeeBeanImage: {
    width: 20,
    height: 20,
    marginRight: 4,
    // Eliminăm tintColor, deoarece imaginea PNG este deja colorată
    // tintColor: CUSTOM_COLORS.ACCENT_GOLD, // COMENTAT/ELIMINAT
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
    // Flex direction este menținut, dar acum conține un singur element
  },
  dropdownLabel: {
    fontSize: 14,
    marginRight: 10,
    fontWeight: "500",
    // ELIMINAT din View, dar păstrat aici pentru a nu rupe styles.
  },
  dropdownButton: {
    flex: 1,
    padding: 10,
    borderRadius: 10,
    borderWidth: 1,
    shadowColor: CUSTOM_COLORS.ACCENT_GOLD,
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 3,
  },
  dropdownText: {
    fontSize: 14,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.7)",
  },
  modalContent: {
    width: "80%",
    borderRadius: 12,
    padding: 10,
    shadowColor: CUSTOM_COLORS.ACCENT_GOLD,
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
    shadowOpacity: 0.5,
    shadowRadius: 10,
    elevation: 15,
    paddingBottom: 20,
    // Culoarea este setată direct în componentă folosind CUSTOM_COLORS.BACKGROUND_FEED_TRANSPARENT
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
    paddingVertical: 5, // Spațiu vertical pentru lista
  },
  // Stilul cardului a fost ajustat la 150px (conform cerinței anterioare)
  cardRow: {
    flexDirection: "row", // Aliniere orizontală
    marginHorizontal: 15,
    borderRadius: 12,
    marginBottom: 10, // Spațiu redus între carduri
    padding: 0, // Eliminăm padding-ul din containerul cardului
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.4,
    shadowRadius: 4,
    overflow: "hidden",
    height: 150, // Înălțimea cardului este acum 150px
  },
  // NOU: Stil pentru imaginea din cardul Rând (mai mică și pătrată)
  photoRow: {
    width: 100,
    height: "100%", // Ocupă toată înălțimea cardului
    resizeMode: "cover",
    borderTopLeftRadius: 12,
    borderBottomLeftRadius: 12, // Imaginea rămâne rotunjită la colțul stânga
  },
  // NOU: Containerul de text din cardul Rând
  cardTextRow: {
    flex: 1,
    padding: 10, // Padding intern
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
    marginTop: -5, // Aliniat mai sus
  },
  placeNameRow: {
    fontWeight: "bold",
    fontSize: 16, // Font mai mic
    marginBottom: 1,
  },
  ratingRow: {
    fontSize: 14, // Font mai mic
    fontWeight: "bold",
    marginBottom: 2,
  },
  descriptionRow: {
    fontSize: 10, // Font foarte mic
    // Ascunde excesul de text dacă este necesar (opțional)
    // maxHeight: 20,
    // overflow: 'hidden'
  },
  distanceRow: {
    fontSize: 10,
    fontStyle: "italic",
    marginTop: 2,
  },

  // Stiluri pentru noul buton "Vezi mai mult..."
  seeMoreButton: {
    marginHorizontal: 15,
    marginTop: 5,
    marginBottom: 15,
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: "center",
    backgroundColor: CUSTOM_COLORS.CARD, // Fundalul butonului este la fel ca al cardului
    shadowColor: CUSTOM_COLORS.ACCENT_GOLD,
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 3,
  },
  seeMoreText: {
    fontSize: 16,
    fontWeight: "bold",
  },
});
