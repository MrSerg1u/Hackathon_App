import { Ionicons } from "@expo/vector-icons";
import { useEffect, useState } from "react";
import {
  FlatList,
  StyleSheet, // Îl păstrăm doar pentru stilurile containerului principal
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import locationsData from "../../locatii.json";
import { useTheme } from "../context/ThemeContext";

// IMPORTĂM COMPONENTELE REUTILIZABILE
import LocationCard from "../components/LocationCard"; // <--- NOU
import LocationDetailsModal from "../components/LocationDetailsModal";

// ... (Păstrează constantele TYPE_OPTIONS și RATING_OPTIONS aici) ...
const TYPE_OPTIONS = [
  { label: "Restaurant", value: "restaurant" },
  { label: "Bar", value: "bar" },
  { label: "Fast Food", value: "fast food" },
  { label: "Coffee", value: "coffee" },
  { label: "Altele", value: "altele" },
];

const RATING_OPTIONS = [
  { label: "Excelent (4.0 - 5.0 ⭐)", min: 4.0, max: 5.0 },
  { label: "Foarte Bun (3.0 - 3.9 ⭐)", min: 3.0, max: 3.99 },
  { label: "Bun (2.0 - 2.9 ⭐)", min: 2.0, max: 2.99 },
  { label: "Slăbuț (1.0 - 1.9 ⭐)", min: 1.0, max: 1.99 },
  { label: "Nerecomandat (0 - 0.9 ⭐)", min: 0, max: 0.99 },
];

export default function SearchScreen() {
  const { colors } = useTheme();

  const [searchText, setSearchText] = useState("");
  const [filteredData, setFilteredData] = useState(locationsData);
  const [selectedTypes, setSelectedTypes] = useState([]);
  const [showTypeDropdown, setShowTypeDropdown] = useState(false);
  const [selectedRating, setSelectedRating] = useState(null);
  const [showRatingDropdown, setShowRatingDropdown] = useState(false);
  const [filterPartner, setFilterPartner] = useState(false);
  const [sortBy, setSortBy] = useState("default");

  const [modalVisible, setModalVisible] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState(null);

  useEffect(() => {
    let data = locationsData;
    if (searchText)
      data = data.filter((item) =>
        item.name.toLowerCase().includes(searchText.toLowerCase())
      );
    if (selectedTypes.length > 0)
      data = data.filter((item) => selectedTypes.includes(item.type));
    if (selectedRating)
      data = data.filter(
        (item) =>
          item.rating >= selectedRating.min && item.rating <= selectedRating.max
      );
    if (filterPartner) data = data.filter((item) => item.partener === true);
    if (sortBy === "rating")
      data = [...data].sort((a, b) => b.rating - a.rating);
    else if (sortBy === "name")
      data = [...data].sort((a, b) => a.name.localeCompare(b.name));
    setFilteredData(data);
  }, [searchText, selectedTypes, selectedRating, filterPartner, sortBy]);

  const toggleTypeSelection = (value) =>
    selectedTypes.includes(value)
      ? setSelectedTypes(selectedTypes.filter((t) => t !== value))
      : setSelectedTypes([...selectedTypes, value]);
  const selectRatingOption = (option) => {
    if (selectedRating && selectedRating.min === option.min)
      setSelectedRating(null);
    else setSelectedRating(option);
    setShowRatingDropdown(false);
  };

  const openModal = (location) => {
    setSelectedLocation(location);
    setModalVisible(true);
  };

  // --- FUNCTIA RENDER ITEM ESTE ACUM FOARTE SIMPLA ---
  const renderItem = ({ item }) => (
    <LocationCard item={item} onPress={() => openModal(item)} />
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Text style={[styles.headerTitle, { color: colors.text }]}>Search</Text>

      {/* Search Input */}
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
          placeholder="Caută..."
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

      {/* Filtre Dropdown */}
      <View style={[styles.filtersRow, { zIndex: 2000 }]}>
        <View style={{ flex: 1, marginRight: 10 }}>
          <TouchableOpacity
            style={[
              styles.dropdownButton,
              { borderColor: colors.border, backgroundColor: colors.card },
            ]}
            onPress={() => {
              setShowRatingDropdown(!showRatingDropdown);
              setShowTypeDropdown(false);
            }}
          >
            <Text style={{ color: colors.text, fontWeight: "600" }}>
              {selectedRating ? `Rating: ${selectedRating.min}+` : "Rating ▾"}
            </Text>
          </TouchableOpacity>
          {showRatingDropdown && (
            <View
              style={[
                styles.dropdownMenu,
                { backgroundColor: colors.card, borderColor: colors.border },
              ]}
            >
              <TouchableOpacity
                style={{ padding: 10 }}
                onPress={() => {
                  setSelectedRating(null);
                  setShowRatingDropdown(false);
                }}
              >
                <Text style={{ color: colors.primary, fontWeight: "bold" }}>
                  Arată Toate
                </Text>
              </TouchableOpacity>
              {RATING_OPTIONS.map((opt, index) => (
                <TouchableOpacity
                  key={index}
                  style={[
                    styles.dropdownItem,
                    selectedRating?.min === opt.min && {
                      backgroundColor: colors.primary + "20",
                    },
                  ]}
                  onPress={() => selectRatingOption(opt)}
                >
                  <Text style={{ color: colors.text }}>{opt.label}</Text>
                  {selectedRating?.min === opt.min && (
                    <Ionicons
                      name="checkmark"
                      size={16}
                      color={colors.primary}
                    />
                  )}
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>
        <View style={{ flex: 1 }}>
          <TouchableOpacity
            style={[
              styles.dropdownButton,
              { borderColor: colors.border, backgroundColor: colors.card },
            ]}
            onPress={() => {
              setShowTypeDropdown(!showTypeDropdown);
              setShowRatingDropdown(false);
            }}
          >
            <Text style={{ color: colors.text, fontWeight: "600" }}>
              {selectedTypes.length > 0
                ? `Tipuri (${selectedTypes.length}) ▾`
                : "Tip Locație ▾"}
            </Text>
          </TouchableOpacity>
          {showTypeDropdown && (
            <View
              style={[
                styles.dropdownMenu,
                { backgroundColor: colors.card, borderColor: colors.border },
              ]}
            >
              <TouchableOpacity
                style={{ padding: 10 }}
                onPress={() => {
                  setSelectedTypes([]);
                  setShowTypeDropdown(false);
                }}
              >
                <Text style={{ color: colors.primary, fontWeight: "bold" }}>
                  Resetează Filtrul
                </Text>
              </TouchableOpacity>
              {TYPE_OPTIONS.map((opt, index) => (
                <TouchableOpacity
                  key={index}
                  style={[
                    styles.dropdownItem,
                    selectedTypes.includes(opt.value) && {
                      backgroundColor: colors.primary,
                    },
                  ]}
                  onPress={() => toggleTypeSelection(opt.value)}
                >
                  <Text
                    style={{
                      color: selectedTypes.includes(opt.value)
                        ? "#fff"
                        : colors.text,
                      fontWeight: selectedTypes.includes(opt.value)
                        ? "bold"
                        : "normal",
                    }}
                  >
                    {opt.label}
                  </Text>
                  {selectedTypes.includes(opt.value) && (
                    <Ionicons name="checkmark" size={16} color="#fff" />
                  )}
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>
      </View>

      {/* List & Checkbox */}
      <View style={{ flex: 1, zIndex: 1 }}>
        <TouchableOpacity
          style={styles.checkboxContainer}
          onPress={() => setFilterPartner(!filterPartner)}
          activeOpacity={0.7}
        >
          <Ionicons
            name={filterPartner ? "checkbox" : "square-outline"}
            size={24}
            color={filterPartner ? colors.primary : colors.subtext}
          />
          <Text style={[styles.checkboxText, { color: colors.text }]}>
            Doar Locații Partener ⭐
          </Text>
        </TouchableOpacity>

        {/* Sort Container */}
        <View style={[styles.sortContainer, { marginBottom: 15 }]}>
          <Text
            style={{ color: colors.subtext, marginRight: 10, fontSize: 12 }}
          >
            Sort:
          </Text>
          <TouchableOpacity
            onPress={() =>
              setSortBy(sortBy === "rating" ? "default" : "rating")
            }
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
              Nume {sortBy === "name" ? "▼" : ""}
            </Text>
          </TouchableOpacity>
        </View>

        <Text style={[styles.resultsText, { color: colors.subtext }]}>
          Rezultate: {filteredData.length}
        </Text>

        <FlatList
          data={filteredData}
          keyExtractor={(item, index) => index.toString()}
          renderItem={renderItem}
          contentContainerStyle={{ paddingBottom: 100 }}
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
      </View>

      {/* MODAL REUTILIZABIL */}
      <LocationDetailsModal
        visible={modalVisible}
        location={selectedLocation}
        onClose={() => setModalVisible(false)}
      />
    </View>
  );
}

// Am păstrat doar stilurile strict necesare containerului și filtrelor
// Toate stilurile cardului au fost mutate în LocationCard.js
const styles = StyleSheet.create({
  container: { flex: 1, paddingHorizontal: 16, paddingTop: 50 },
  headerTitle: {
    fontSize: 22,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 20,
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 15,
    height: 50,
    marginBottom: 15,
  },
  filtersRow: { flexDirection: "row", marginBottom: 10, zIndex: 2000 },
  dropdownButton: {
    borderWidth: 1,
    padding: 10,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    height: 45,
  },
  dropdownMenu: {
    position: "absolute",
    top: 50,
    left: 0,
    right: 0,
    borderWidth: 1,
    borderRadius: 8,
    zIndex: 9999,
    elevation: 5,
    paddingVertical: 5,
  },
  dropdownItem: {
    padding: 10,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderBottomWidth: 0.5,
    borderBottomColor: "#ccc",
  },
  checkboxContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
    marginTop: 5,
  },
  checkboxText: { marginLeft: 8, fontSize: 14, fontWeight: "600" },
  sortContainer: { flexDirection: "row", alignItems: "center" },
  resultsText: { fontSize: 14, marginBottom: 10 },
});
