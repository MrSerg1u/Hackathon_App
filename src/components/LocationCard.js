import { Ionicons } from "@expo/vector-icons";
import { Image, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useTheme } from "../context/ThemeContext";

export default function LocationCard({
  item,
  onPress,
  showDistance = false,
  isFavorite = false, // Doar pentru afișare
}) {
  const { colors } = useTheme();

  return (
    <View style={styles.cardContainer}>
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

          {/* Footer: Rating + Tip + Distanță */}
          <View style={styles.cardFooterRow}>
            <View style={styles.ratingContainer}>
              <Ionicons name="star" size={14} color="#FFD700" />
              <Text style={[styles.ratingText, { color: colors.text }]}>
                {item.rating} / 5
              </Text>
            </View>

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

      {/* --- INDICATOR VIZUAL FAVORIT (Doar dacă este favorit) --- */}
      {isFavorite && (
        <View
          style={[
            styles.favoriteIndicator,
            { backgroundColor: colors.card }, // Fundalul se adaptează temei
          ]}
        >
          <Ionicons name="heart" size={16} color="#FF4757" />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  cardContainer: {
    marginBottom: 15,
    position: "relative",
  },
  card: {
    flexDirection: "row",
    borderRadius: 16,
    borderWidth: 1,
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
    // Nu mai avem nevoie de paddingRight mare pentru că indicatorul e mic și nu interactiv
    justifyContent: "space-between",
  },
  cardHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    paddingRight: 25, // Lăsăm puțin loc textului să nu intre peste inimioară
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
  // --- STIL INDICATOR FAVORIT (Non-interactiv) ---
  favoriteIndicator: {
    position: "absolute",
    top: 8,
    right: 8,
    width: 26,
    height: 26,
    borderRadius: 13, // Rotund
    justifyContent: "center",
    alignItems: "center",
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    zIndex: 10,
    borderWidth: 0.5,
    borderColor: "rgba(0,0,0,0.05)",
  },
});