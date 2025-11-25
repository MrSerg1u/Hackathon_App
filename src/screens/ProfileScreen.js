import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFocusEffect } from "@react-navigation/native"; // IMPORT NOU
import * as ImagePicker from "expo-image-picker";
import { useCallback, useState } from "react"; // ADDED useCallback
import {
  Alert,
  Image,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useTheme } from "../context/ThemeContext";

export default function ProfileScreen({ navigation }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [points, setPoints] = useState(0); // Initial 0
  const [profileImage, setProfileImage] = useState(null);

  const [modalVisible, setModalVisible] = useState(false);

  const { colors, theme, toggleTheme } = useTheme();

  // Funcția de încărcare a datelor
  const getUserData = async () => {
    try {
      // 1. Încărcăm sesiunea
      const sessionEmail = await AsyncStorage.getItem("user_session");

      if (sessionEmail) {
        setEmail(sessionEmail);

        // 2. Căutăm detaliile (Nume)
        const usersString = await AsyncStorage.getItem("registered_users");
        if (usersString) {
          const users = JSON.parse(usersString);
          const currentUser = users.find((u) => u.email === sessionEmail);
          if (currentUser) {
            setName(currentUser.name);
          }
        }

        // 3. Încărcăm imaginea SPECIFICĂ
        const uniqueImageKey = `profile_image_${sessionEmail}`;
        const savedImage = await AsyncStorage.getItem(uniqueImageKey);
        if (savedImage) {
          setProfileImage(savedImage);
        } else {
          setProfileImage(null);
        }

        // 4. Încărcăm PUNCTELE specifice utilizatorului
        const pointsKey = `user_points_${sessionEmail}`;
        const savedPoints = await AsyncStorage.getItem(pointsKey);
        if (savedPoints !== null) {
          setPoints(parseInt(savedPoints, 10));
        } else {
          setPoints(0);
        }
      }
    } catch (e) {
      console.error("Failed to load user data", e);
    }
  };

  // Folosim useFocusEffect ca să fim siguri că punctele sunt actualizate
  // dacă tocmai le-am primit în HomeScreen
  useFocusEffect(
    useCallback(() => {
      getUserData();
    }, [])
  );

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (status !== "granted") {
      Alert.alert(
        "Permisiune refuzată",
        "Avem nevoie de acces la galerie pentru a schimba poza."
      );
      return;
    }

    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 1,
    });

    if (!result.canceled) {
      const imageUri = result.assets[0].uri;
      setProfileImage(imageUri);

      // Salvăm imaginea folosind cheia UNICĂ a utilizatorului (email)
      if (email) {
        const uniqueImageKey = `profile_image_${email}`;
        await AsyncStorage.setItem(uniqueImageKey, imageUri);
      }
    }
  };

  const handleLogout = async () => {
    await AsyncStorage.removeItem("user_session");
    navigation.reset({ index: 0, routes: [{ name: "Login" }] });
  };

  const handleExploreOffers = () => {
    navigation.navigate("Search", { onlyPartners: true });
  };

  return (
    <View style={{ flex: 1 }}>
      <ScrollView
        style={[styles.container, { backgroundColor: colors.background }]}
        contentContainerStyle={styles.contentContainer}
      >
        {/* --- SECTIUNEA 1: Avatar + Text Editare --- */}
        <View style={styles.headerContainer}>
          <TouchableOpacity
            onPress={pickImage}
            style={[
              styles.avatarContainer,
              { backgroundColor: colors.card, borderColor: colors.text },
            ]}
          >
            {profileImage ? (
              <Image
                source={{ uri: profileImage }}
                style={styles.avatarImage}
              />
            ) : (
              <Ionicons name="person" size={50} color={colors.primary} />
            )}
          </TouchableOpacity>

          <TouchableOpacity
            onPress={pickImage}
            style={styles.editPhotoTextContainer}
          >
            <Ionicons
              name="pencil"
              size={14}
              color={colors.primary}
              style={{ marginRight: 4 }}
            />
            <Text style={[styles.editPhotoText, { color: colors.primary }]}>
              Editeaza foto
            </Text>
          </TouchableOpacity>
        </View>

        {/* --- SECTIUNEA 2: Account Personal Info --- */}
        <View
          style={[
            styles.card,
            { borderColor: colors.text, backgroundColor: colors.card },
          ]}
        >
          <Text style={[styles.cardTitle, { color: colors.text }]}>
            Date personale:
          </Text>

          <View style={styles.infoRow}>
            <Text style={[styles.label, { color: colors.subtext }]}>Nume:</Text>
            <Text style={[styles.value, { color: colors.text }]}>
              {name || "Utilizator"}
            </Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={[styles.label, { color: colors.subtext }]}>
              Email:
            </Text>
            <Text style={[styles.value, { color: colors.text }]}>
              {email || "guest@app.com"}
            </Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={[styles.label, { color: colors.subtext }]}>
              Telefon:
            </Text>
            <Text style={[styles.value, { color: colors.text }]}>
              +40 712 345 678
            </Text>
          </View>
        </View>

        {/* --- SECTIUNEA 3: Loyalty Info --- */}
        <View
          style={[
            styles.card,
            { borderColor: colors.text, backgroundColor: colors.card },
          ]}
        >
          <Text style={[styles.cardTitle, { color: colors.text }]}>
            Loialitate:
          </Text>

          <View style={styles.diamondContainer}>
            <View
              style={[
                styles.diamondShape,
                { backgroundColor: colors.background },
              ]}
            />
            <View style={styles.diamondContent}>
              <Text style={[styles.pointsText, { color: colors.primary }]}>
                {points}
              </Text>
              <Text style={[styles.pointsLabel, { color: colors.subtext }]}>
                Puncte
              </Text>
            </View>
          </View>

          <TouchableOpacity
            style={[styles.exploreButton, { borderColor: colors.text }]}
            onPress={handleExploreOffers}
          >
            <Text style={[styles.exploreText, { color: colors.text }]}>
              Explorează oferte...
            </Text>
          </TouchableOpacity>
        </View>

        {/* --- SECTIUNEA 4: Setări & Logout --- */}

        <View style={[styles.settingRow, { backgroundColor: colors.card }]}>
          <View style={{ flexDirection: "row", alignItems: "center" }}>
            <Ionicons
              name={theme === "dark" ? "moon" : "sunny"}
              size={20}
              color={colors.primary}
              style={{ marginRight: 10 }}
            />
            <Text style={{ color: colors.text, fontWeight: "500" }}>
              Temă întunecată
            </Text>
          </View>
          <Switch
            value={theme === "dark"}
            onValueChange={toggleTheme}
            trackColor={{ false: "#767577", true: "#007AFF" }}
            thumbColor={"#f4f3f4"}
          />
        </View>

        <TouchableOpacity
          style={[
            styles.logoutButton,
            { backgroundColor: "#ff4757", borderColor: "#ff4757" },
          ]}
          onPress={handleLogout}
        >
          <Ionicons
            name="log-out-outline"
            size={24}
            color={theme === "dark" ? "#000000" : "#FFFFFF"}
            style={{ marginRight: 8 }}
          />
          <Text
            style={[
              styles.logoutText,
              { color: theme === "dark" ? "#000000" : "#FFFFFF" },
            ]}
          >
            Ieșire din cont
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  contentContainer: {
    padding: 20,
    paddingTop: 60,
    alignItems: "center",
  },
  headerContainer: {
    marginBottom: 20,
    alignItems: "center",
  },
  avatarContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 2,
    justifyContent: "center",
    alignItems: "center",
    elevation: 5,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    overflow: "hidden",
  },
  avatarImage: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },
  editPhotoTextContainer: {
    marginTop: 10,
    flexDirection: "row",
    alignItems: "center",
    padding: 5,
  },
  editPhotoText: {
    fontSize: 16,
    fontWeight: "600",
    textDecorationLine: "underline",
  },
  card: {
    width: "100%",
    borderWidth: 2,
    borderRadius: 15,
    padding: 15,
    marginBottom: 20,
    elevation: 2,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#ccc",
    paddingBottom: 5,
  },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  label: {
    fontSize: 15,
    fontWeight: "500",
  },
  value: {
    fontSize: 15,
    fontWeight: "bold",
  },
  diamondContainer: {
    alignItems: "center",
    justifyContent: "center",
    height: 120,
    marginVertical: 10,
    position: "relative",
  },
  diamondShape: {
    width: 100,
    height: 100,
    transform: [{ rotate: "45deg" }],
    elevation: 3,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    borderRadius: 10,
  },
  diamondContent: {
    position: "absolute",
    alignItems: "center",
  },
  pointsText: {
    fontSize: 24,
    fontWeight: "bold",
  },
  pointsLabel: {
    fontSize: 12,
  },
  exploreButton: {
    borderWidth: 2,
    borderRadius: 25,
    paddingVertical: 12,
    alignItems: "center",
    marginTop: 10,
  },
  exploreText: {
    fontSize: 16,
    fontWeight: "bold",
  },

  settingRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    width: "100%",
    padding: 15,
    borderRadius: 12,
    marginBottom: 20,
  },
  logoutButton: {
    flexDirection: "row",
    justifyContent: "center",
    paddingVertical: 12,
    paddingHorizontal: 30,
    borderWidth: 2,
    borderRadius: 25,
    alignItems: "center",
    width: "100%",
    elevation: 3,
  },
  logoutText: {
    fontWeight: "bold",
    fontSize: 16,
  },
  modalContainer: {
    flex: 1,
  },
  modalHeader: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#ccc",
  },
  backButton: {
    flexDirection: "row",
    alignItems: "center",
  },
  backText: {
    fontSize: 18,
    fontWeight: "500",
    marginLeft: 5,
  },
  modalBody: {
    flex: 1,
  },
});
