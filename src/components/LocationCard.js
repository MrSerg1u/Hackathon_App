import { Ionicons } from "@expo/vector-icons";
import { Image, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useTheme } from "../context/ThemeContext";

export default function LocationCard({ item, onPress, showDistance = false }) {
  const { colors } = useTheme();

  return (
    <TouchableOpacity
      style={[
        styles.card,
        { backgroundColor: colors.card, borderColor: colors.border },
      ]}
      onPress={onPress}
      activeOpacity={0.8}
    >
      {/* Imagine Stânga */}
      <Image
        source={{
          uri:
            item.image_url ||
            "https://placehold.co/100x100/333333/D4AF37?text=FOTO",
        }}
        style={styles.cardImage}
      />

      {/* Conținut Dreapta */}
      <View style={styles.cardInfo}>
        {/* Header: Titlu + Badge */}
        <View style={styles.cardHeaderRow}>
          <Text
            style={[styles.cardTitle, { color: colors.text, flex: 1 }]}
            numberOfLines={1}
          >
            {item.name}
          </Text>
          {item.partener && (
            <View style={styles.partnerBadge}>
              <Text style={styles.partnerText}>PARTENER</Text>
            </View>
          )}
        </View>

        {/* Descriere */}
        <Text
          style={[styles.cardDescription, { color: colors.subtext }]}
          numberOfLines={2}
        >
          {item.short_description}
        </Text>

        {/* Footer: Rating + Tip + Distanță (Opțional) */}
        <View style={styles.cardFooterRow}>
          <View style={styles.ratingContainer}>
            <Ionicons name="star" size={14} color="#FFD700" />
            <Text style={[styles.ratingText, { color: colors.text }]}>
              {item.rating} / 5
            </Text>
          </View>

          {/* Dacă avem distanță (doar în Home de obicei), o afișăm */}
          {showDistance && item.distance !== undefined ? (
            <Text style={[styles.distanceText, { color: colors.subtext }]}>
              {item.distance.toFixed(2)} km
            </Text>
          ) : (
            <Text style={[styles.typeLabel, { color: colors.subtext }]}>
              {item.type ? item.type.toUpperCase() : "N/A"}
            </Text>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: "row",
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 15,
    overflow: "hidden",
    height: 110,
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
    justifyContent: "space-between",
  },
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
  partnerBadge: {
    borderWidth: 1,
    borderColor: "#D4AF37",
    backgroundColor: "transparent",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  partnerText: {
    fontSize: 8,
    color: "#D4AF37",
    fontWeight: "bold",
  },
  cardDescription: {
    fontSize: 11,
    marginTop: 2,
  },
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
  typeLabel: {
    fontSize: 10,
    fontWeight: "bold",
    opacity: 0.8,
  },
  distanceText: {
    fontSize: 10,
    fontStyle: "italic",
  },
});
