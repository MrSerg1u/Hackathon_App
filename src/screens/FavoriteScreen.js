import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFocusEffect } from "@react-navigation/native";
import React, { useCallback, useState } from "react";
import {
  FlatList,
  SafeAreaView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import locationsData from "../../locatii.json"; 
import LocationCard from "../components/LocationCard";
import LocationDetailsModal from "../components/LocationDetailsModal";
import { useTheme } from "../context/ThemeContext";

export default function FavoriteScreen() {
  const { colors } = useTheme();
  const [favoritePlaces, setFavoritePlaces] = useState([]);
  
  // Modal State
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState(null);

  // Funcție pentru încărcarea favoritelor
  const loadFavorites = async () => {
    try {
      const email = await AsyncStorage.getItem("user_session");
      if (email) {
        const favKey = `favorite_locations_${email}`;
        const storedFavs = await AsyncStorage.getItem(favKey);
        
        if (storedFavs) {
          const savedIdsOrNames = JSON.parse(storedFavs); // Aici sunt salvate ID-urile SAU Numele

          // --- MODIFICAREA IMPORTANTĂ ---
          // Filtrăm locațiile verificând dacă ID-ul sau NUMELE lor se află în lista salvată
          const filtered = locationsData.filter((item) => {
             // Verificăm ambele variante pentru siguranță
             const isIdMatch = item.id && savedIdsOrNames.includes(item.id);
             const isNameMatch = savedIdsOrNames.includes(item.name);
             
             return isIdMatch || isNameMatch;
          });
          
          setFavoritePlaces(filtered);
        } else {
          setFavoritePlaces([]);
        }
      }
    } catch (e) {
      console.error("Failed to load favorites:", e);
    }
  };

  // Reîncărcăm datele când ecranul devine activ
  useFocusEffect(
    useCallback(() => {
      loadFavorites();
    }, [])
  );

  const openModal = (location) => {
    setSelectedLocation(location);
    setModalVisible(true);
  };

  const renderItem = ({ item }) => (
    <LocationCard
      item={item}
      onPress={() => openModal(item)}
      isFavorite={true} // Aici sunt sigur favorite
    />
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <Text style={[styles.headerTitle, { color: colors.text }]}>
          Favorite ❤️
        </Text>
      </View>

      <FlatList
        data={favoritePlaces}
        // Folosim name ca fallback sigur pentru key
        keyExtractor={(item, index) => item.id || item.name || index.toString()}
        renderItem={renderItem}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="heart-dislike-outline" size={60} color={colors.subtext} />
            <Text style={[styles.emptyText, { color: colors.subtext }]}>
              Nu ai nicio locație favorită încă.
            </Text>
          </View>
        }
      />

      <LocationDetailsModal
        visible={modalVisible}
        location={selectedLocation}
        onClose={() => setModalVisible(false)}
        onFavoriteUpdate={loadFavorites} // Reîncarcă lista dacă scoți de la favorite din modal
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    padding: 20,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(0,0,0,0.1)",
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "bold",
  },
  listContent: {
    padding: 16,
    paddingBottom: 100,
  },
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    marginTop: 100,
  },
  emptyText: {
    marginTop: 15,
    fontSize: 16,
  },
});