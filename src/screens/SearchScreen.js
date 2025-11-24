import { Ionicons } from "@expo/vector-icons";
import { useEffect, useState } from "react";
import {
  FlatList,
  Image,
  Modal,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useTheme } from "../context/ThemeContext";

// Importăm datele din fișierul JSON creat
import locationsData from "../../locatii.json";

export default function SearchScreen() {
  const { colors, theme } = useTheme();

  // State-uri
  const [searchText, setSearchText] = useState("");
  const [filteredData, setFilteredData] = useState(locationsData);
  const [sortBy, setSortBy] = useState("default"); // 'default', 'rating', 'name'

  // State pentru Modal
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState(null);

  // Funcția de căutare și sortare
  useEffect(() => {
    let data = locationsData.filter((item) =>
      item.name.toLowerCase().includes(searchText.toLowerCase())
    );

    if (sortBy === "rating") {
      data.sort((a, b) => b.rating - a.rating); // Descrescător după rating
    } else if (sortBy === "name") {
      data.sort((a, b) => a.name.localeCompare(b.name)); // Alfabetic
    }

    setFilteredData(data);
  }, [searchText, sortBy]);

  // Funcția pentru deschiderea modalului
  const openModal = (location) => {
    setSelectedLocation(location);
    setModalVisible(true);
  };

  // Renderizarea unui singur card (item)
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

      {/* Textul din dreapta */}
      <View style={styles.cardInfo}>
        <Text
          style={[styles.cardTitle, { color: colors.text }]}
          numberOfLines={1}
        >
          {item.name}
        </Text>
        <Text
          style={[styles.cardDescription, { color: colors.subtext }]}
          numberOfLines={2}
        >
          {item.short_description}
        </Text>

        {/* Rating Badge */}
        <View style={styles.ratingContainer}>
          <Ionicons name="star" size={14} color="#FFD700" />
          <Text style={[styles.ratingText, { color: colors.text }]}>
            {item.rating} / 5
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header Titlu */}
      <Text style={[styles.headerTitle, { color: colors.text }]}>Search</Text>

      {/* Zona de Search Input */}
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
          placeholder="Search by name..."
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

      {/* Zona de Filtre / Sortare */}
      <View style={styles.filtersContainer}>
        <TouchableOpacity
          style={[
            styles.filterButton,
            sortBy === "rating" && { backgroundColor: colors.primary },
            { borderColor: colors.border },
          ]}
          onPress={() => setSortBy(sortBy === "rating" ? "default" : "rating")}
        >
          <Text
            style={[
              styles.filterText,
              sortBy === "rating" ? { color: "#fff" } : { color: colors.text },
            ]}
          >
            Sort: Rating ⭐
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.filterButton,
            sortBy === "name" && { backgroundColor: colors.primary },
            { borderColor: colors.border },
          ]}
          onPress={() => setSortBy(sortBy === "name" ? "default" : "name")}
        >
          <Text
            style={[
              styles.filterText,
              sortBy === "name" ? { color: "#fff" } : { color: colors.text },
            ]}
          >
            Sort: A-Z 🔤
          </Text>
        </TouchableOpacity>
      </View>

      <Text style={[styles.resultsText, { color: colors.subtext }]}>
        Showing {filteredData.length} results:
      </Text>

      {/* Lista de rezultate */}
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
              marginTop: 20,
              color: colors.subtext,
            }}
          >
            Nu am găsit locații.
          </Text>
        }
      />

      {/* MODAL PENTRU DETALII */}
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

                {/* Buton Închidere */}
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
  container: { flex: 1, paddingHorizontal: 16, paddingTop: 50 }, // Padding top pt safe area
  headerTitle: {
    fontSize: 22,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 20,
  },

  // Search Bar
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 15,
    height: 50,
    marginBottom: 15,
  },

  // Filters
  filtersContainer: {
    flexDirection: "row",
    marginBottom: 15,
  },
  filterButton: {
    borderWidth: 1,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    marginRight: 10,
  },
  filterText: { fontSize: 14, fontWeight: "600" },

  resultsText: { fontSize: 14, marginBottom: 10 },

  // Card Styles
  card: {
    flexDirection: "row",
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 15,
    overflow: "hidden",
    elevation: 3, // Umbrita Android
    shadowColor: "#000", // Umbra iOS
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
    padding: 12,
    justifyContent: "center",
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 4,
  },
  cardDescription: {
    fontSize: 13,
    marginBottom: 8,
  },
  ratingContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  ratingText: {
    fontSize: 13,
    fontWeight: "bold",
    marginLeft: 4,
  },

  // Modal Styles
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
