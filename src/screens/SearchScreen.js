import { Ionicons } from "@expo/vector-icons";
import { useEffect, useState } from "react";
import {
  FlatList,
  Image,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useTheme } from "../context/ThemeContext";

// Importăm datele din fișierul JSON (asigură-te că path-ul e corect)
import locationsData from "../../locatii.json";

// Categoriile disponibile pentru filtrare (trebuie să corespundă cu 'type' din JSON)
const CATEGORIES = [
  "Toate",
  "restaurant",
  "coffee",
  "fast food",
  "bar",
  "altele",
];

export default function SearchScreen() {
  const { colors } = useTheme();

  // --- STATE-URI ---
  const [searchText, setSearchText] = useState("");
  const [filteredData, setFilteredData] = useState(locationsData);

  // State pentru filtre
  const [selectedCategory, setSelectedCategory] = useState("Toate");
  const [filterRatingHigh, setFilterRatingHigh] = useState(false); // True = Doar > 4.0
  const [sortBy, setSortBy] = useState("default"); // 'default', 'rating', 'name'

  // State pentru Modal
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState(null);

  // --- LOGICA DE FILTRARE ȘI SORTARE ---
  useEffect(() => {
    let data = locationsData;

    // 1. Filtrare după Text (Căutare)
    if (searchText) {
      data = data.filter((item) =>
        item.name.toLowerCase().includes(searchText.toLowerCase())
      );
    }

    // 2. Filtrare după Categorie (Tip)
    if (selectedCategory !== "Toate") {
      data = data.filter((item) => item.type === selectedCategory);
    }

    // 3. Filtrare după Rating (> 4.0)
    if (filterRatingHigh) {
      data = data.filter((item) => item.rating > 4.0);
    }

    // 4. Sortare
    if (sortBy === "rating") {
      // Facem o copie ca să nu mutăm array-ul original în timpul sortării
      data = [...data].sort((a, b) => b.rating - a.rating);
    } else if (sortBy === "name") {
      data = [...data].sort((a, b) => a.name.localeCompare(b.name));
    }

    setFilteredData(data);
  }, [searchText, selectedCategory, filterRatingHigh, sortBy]);

  const openModal = (location) => {
    setSelectedLocation(location);
    setModalVisible(true);
  };

  // --- RENDER ITEM (CARDUL) ---
  const renderItem = ({ item }) => (
    <TouchableOpacity
      style={[
        styles.card,
        { backgroundColor: colors.card, borderColor: colors.border },
      ]}
      onPress={() => openModal(item)}
      activeOpacity={0.8}
    >
      {/* Imaginea din stânga */}
      <Image source={{ uri: item.image_url }} style={styles.cardImage} />

      {/* Partea dreaptă (Info) */}
      <View style={styles.cardInfo}>
        {/* Header Card: Titlu + Badge Partener */}
        <View style={styles.cardHeaderRow}>
          <Text
            style={[styles.cardTitle, { color: colors.text, flex: 1 }]}
            numberOfLines={1}
          >
            {item.name}
          </Text>
          {/* BADGE PARTENER (Sus Dreapta) */}
          {item.partener && (
            <View style={styles.partnerBadge}>
              <Text style={styles.partnerText}>PARTENER</Text>
            </View>
          )}
        </View>

        <Text
          style={[styles.cardDescription, { color: colors.subtext }]}
          numberOfLines={2}
        >
          {item.short_description}
        </Text>

        {/* Footer Card: Rating + Tip Locație */}
        <View style={styles.cardFooterRow}>
          {/* Rating */}
          <View style={styles.ratingContainer}>
            <Ionicons name="star" size={14} color="#FFD700" />
            <Text style={[styles.ratingText, { color: colors.text }]}>
              {item.rating} / 5
            </Text>
          </View>

          {/* TIP LOCAȚIE (Jos Dreapta) */}
          <Text style={[styles.typeLabel, { color: colors.subtext }]}>
            {item.type.toUpperCase()}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* --- HEADER --- */}
      <Text style={[styles.headerTitle, { color: colors.text }]}>Search</Text>

      {/* --- INPUT CĂUTARE --- */}
      <View
        style={[
          styles.searchContainer,
          {
            backgroundColor: colors.inputBackground,
            borderColor: colors.border,
          },
        ]}
      >
        <Ionicons
          name="search"
          size={20}
          color={colors.subtext}
          style={{ marginRight: 10 }}
        />
        <TextInput
          style={{ flex: 1, color: colors.text, fontSize: 16 }}
          placeholder="Caută locații..."
          placeholderTextColor={colors.subtext}
          value={searchText}
          onChangeText={setSearchText}
        />
        {searchText.length > 0 && (
          <TouchableOpacity onPress={() => setSearchText("")}>
            <Ionicons name="close-circle" size={20} color={colors.subtext} />
          </TouchableOpacity>
        )}
      </View>

      {/* --- ZONA FILTRE (Scroll Orizontal) --- */}
      <View style={{ marginBottom: 10 }}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 5 }}
        >
          {/* Buton Filtru Rating > 4 */}
          <TouchableOpacity
            style={[
              styles.filterPill,
              filterRatingHigh && {
                backgroundColor: "#FFD700",
                borderColor: "#FFD700",
              },
              !filterRatingHigh && { borderColor: colors.border },
            ]}
            onPress={() => setFilterRatingHigh(!filterRatingHigh)}
          >
            <Text
              style={[
                styles.filterText,
                filterRatingHigh ? { color: "#000" } : { color: colors.text },
              ]}
            >
              Rating &gt; 4.0 ⭐
            </Text>
          </TouchableOpacity>

          {/* Separator mic vizual */}
          <View
            style={{
              width: 1,
              height: "80%",
              backgroundColor: colors.border,
              marginHorizontal: 8,
              alignSelf: "center",
            }}
          />

          {/* Categorii */}
          {CATEGORIES.map((cat) => (
            <TouchableOpacity
              key={cat}
              style={[
                styles.filterPill,
                selectedCategory === cat && {
                  backgroundColor: colors.primary,
                  borderColor: colors.primary,
                },
                selectedCategory !== cat && { borderColor: colors.border },
              ]}
              onPress={() => setSelectedCategory(cat)}
            >
              <Text
                style={[
                  styles.filterText,
                  selectedCategory === cat
                    ? { color: "#fff" }
                    : { color: colors.text },
                ]}
              >
                {cat.charAt(0).toUpperCase() + cat.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Butoane Sortare (Opțional, le putem păstra sub filtre sau scoate) */}
      <View style={[styles.sortContainer, { marginBottom: 15 }]}>
        <Text style={{ color: colors.subtext, marginRight: 10, fontSize: 12 }}>
          Sortează:
        </Text>
        <TouchableOpacity
          onPress={() => setSortBy(sortBy === "rating" ? "default" : "rating")}
        >
          <Text
            style={{
              color: sortBy === "rating" ? colors.primary : colors.text,
              fontWeight: "bold",
              marginRight: 15,
            }}
          >
            Rating {sortBy === "rating" ? "▼" : ""}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => setSortBy(sortBy === "name" ? "default" : "name")}
        >
          <Text
            style={{
              color: sortBy === "name" ? colors.primary : colors.text,
              fontWeight: "bold",
            }}
          >
            Nume (A-Z) {sortBy === "name" ? "▼" : ""}
          </Text>
        </TouchableOpacity>
      </View>

      <Text style={[styles.resultsText, { color: colors.subtext }]}>
        Rezultate: {filteredData.length}
      </Text>

      {/* --- LISTA REZULTATE --- */}
      <FlatList
        data={filteredData}
        keyExtractor={(item, index) => index.toString()}
        renderItem={renderItem}
        contentContainerStyle={{ paddingBottom: 20 }}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <Text
            style={{
              textAlign: "center",
              marginTop: 40,
              color: colors.subtext,
              fontSize: 16,
            }}
          >
            Nicio locație nu corespunde filtrelor.
          </Text>
        }
      />

      {/* --- MODAL DETALII --- */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
            {selectedLocation && (
              <>
                <Image
                  source={{ uri: selectedLocation.image_url }}
                  style={styles.modalImage}
                />
                <View style={styles.modalBody}>
                  <Text style={[styles.modalTitle, { color: colors.text }]}>
                    {selectedLocation.name}
                  </Text>
                  {/* Dacă e partener, arătăm și în modal */}
                  {selectedLocation.partener && (
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
                      style={[styles.modalAddress, { color: colors.subtext }]}
                    >
                      {selectedLocation.address}
                    </Text>
                  </View>

                  <Text
                    style={{
                      color: colors.subtext,
                      fontStyle: "italic",
                      marginBottom: 5,
                    }}
                  >
                    Tip: {selectedLocation.type.toUpperCase()}
                  </Text>

                  <Text style={[styles.modalDesc, { color: colors.text }]}>
                    {selectedLocation.short_description}
                  </Text>

                  <View style={[styles.ratingContainer, { marginTop: 10 }]}>
                    <Ionicons name="star" size={24} color="#FFD700" />
                    <Text
                      style={{
                        fontSize: 20,
                        fontWeight: "bold",
                        marginLeft: 5,
                        color: colors.text,
                      }}
                    >
                      {selectedLocation.rating}
                    </Text>
                  </View>
                </View>

                <TouchableOpacity
                  style={[
                    styles.closeButton,
                    { backgroundColor: colors.primary },
                  ]}
                  onPress={() => setModalVisible(false)}
                >
                  <Text style={styles.closeButtonText}>Închide</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingHorizontal: 16, paddingTop: 50 },
  headerTitle: {
    fontSize: 22,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 20,
  },

  // Search
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 15,
    height: 50,
    marginBottom: 15,
  },

  // Filters ScrollView
  filterPill: {
    borderWidth: 1,
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 20,
    marginRight: 8,
    justifyContent: "center",
  },
  filterText: { fontSize: 13, fontWeight: "600" },
  sortContainer: { flexDirection: "row", alignItems: "center" },

  resultsText: { fontSize: 14, marginBottom: 10 },

  // --- CARD STYLES ---
  card: {
    flexDirection: "row",
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 15,
    overflow: "hidden",
    height: 110, // Înălțime fixă pentru consistență
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  cardImage: {
    width: 100,
    height: "100%",
    resizeMode: "cover",
  },
  cardInfo: {
    flex: 1,
    padding: 10,
    justifyContent: "space-between", // Distribuie conținutul (Header sus, Footer jos)
  },

  // Card Header (Titlu + Badge)
  cardHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: "bold",
    marginRight: 5,
  },

  // Badge Partener (Dreapta Sus)
  partnerBadge: {
    borderWidth: 1, // <--- Adaugă grosimea border-ului
    borderColor: "#D4AF37", // <--- Culoare Galbenă (Auriu)
    backgroundColor: "transparent", // <--- Fundal transparent (ca să se vadă border-ul)
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  partnerText: {
    fontSize: 8,
    color: "#D4AF37", // <--- Text Negru
    fontWeight: "bold",
  },

  cardDescription: {
    fontSize: 11,
    marginTop: 2,
  },

  // Card Footer (Rating + Tip)
  cardFooterRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 5,
  },
  ratingContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  ratingText: {
    fontSize: 12,
    fontWeight: "bold",
    marginLeft: 4,
  },

  // Tip Locație (Dreapta Jos)
  typeLabel: {
    fontSize: 10,
    fontWeight: "bold",
    opacity: 0.8,
  },

  // --- MODAL STYLES ---
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  modalContent: {
    width: "100%",
    borderRadius: 20,
    overflow: "hidden",
    paddingBottom: 20,
    elevation: 10,
  },
  modalImage: {
    width: "100%",
    height: 200,
    resizeMode: "cover",
  },
  modalBody: {
    padding: 20,
  },
  modalTitle: { fontSize: 24, fontWeight: "bold", marginBottom: 5 },
  modalAddress: { fontSize: 14, marginLeft: 5 },
  modalDesc: { fontSize: 16, marginTop: 10, lineHeight: 22 },

  closeButton: {
    alignSelf: "center",
    paddingVertical: 12,
    paddingHorizontal: 40,
    borderRadius: 25,
    marginTop: 10,
  },
  closeButtonText: { color: "#fff", fontWeight: "bold", fontSize: 16 },
});
