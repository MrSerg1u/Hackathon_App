import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useEffect, useState } from "react";
import { StyleSheet, Switch, Text, TouchableOpacity, View } from "react-native";
import { useTheme } from "../context/ThemeContext"; // <--- Importăm Hook-ul

export default function ProfileScreen({ navigation }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");

  // Aducem culorile și funcția de toggle
  const { colors, theme, toggleTheme } = useTheme();

  useEffect(() => {
    const getUserData = async () => {
      const jsonValue = await AsyncStorage.getItem("user_session");
      if (jsonValue) {
        const user = JSON.parse(jsonValue);
        setName(user.name);
        setEmail(user.email);
      }
    };
    getUserData();
  }, []);

  const handleLogout = async () => {
    await AsyncStorage.removeItem("user_session");
    navigation.reset({ index: 0, routes: [{ name: "Login" }] });
  };

  return (
    // Folosim style array pentru a aplica background dinamic
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View
        style={[
          styles.header,
          { backgroundColor: colors.card, shadowColor: colors.text },
        ]}
      >
        <View style={styles.avatarContainer}>
          <Ionicons name="person" size={60} color="#fff" />
        </View>
        <Text style={[styles.name, { color: colors.text }]}>
          {name || "Utilizator"}
        </Text>
        <Text style={[styles.email, { color: colors.subtext }]}>
          {email || "guest@hackathon.app"}
        </Text>
      </View>

      <View style={styles.body}>
        {/* Setare: DARK MODE */}
        <View style={[styles.infoBox, { backgroundColor: colors.card }]}>
          <View style={{ flexDirection: "row", alignItems: "center" }}>
            <Ionicons
              name={theme === "dark" ? "moon" : "sunny"}
              size={24}
              color={colors.primary}
              style={{ marginRight: 10 }}
            />
            <Text style={[styles.infoText, { color: colors.text }]}>
              {theme === "dark" ? "Mod Întunecat" : "Mod Luminos"}
            </Text>
          </View>
          <Switch
            value={theme === "dark"}
            onValueChange={toggleTheme}
            trackColor={{ false: "#767577", true: "#007AFF" }}
            thumbColor={"#f4f3f4"}
          />
        </View>

        {/* Setare: Info */}
        <View style={[styles.infoBox, { backgroundColor: colors.card }]}>
          <Ionicons
            name="ribbon-outline"
            size={24}
            color={colors.primary}
            style={{ marginRight: 10 }}
          />
          <Text style={[styles.infoText, { color: colors.text }]}>
            Cont Membru Hackathon
          </Text>
        </View>

        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Ionicons
            name="log-out-outline"
            size={20}
            color="#fff"
            style={{ marginRight: 8 }}
          />
          <Text style={styles.logoutText}>Deconectare</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 }, // Scoatem background fix de aici
  header: {
    paddingVertical: 40,
    alignItems: "center",
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
    marginBottom: 20,
  },
  avatarContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: "#007AFF",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 15,
    elevation: 8,
  },
  name: { fontSize: 26, fontWeight: "bold" },
  email: { fontSize: 16, marginTop: 4 },
  body: { padding: 20, alignItems: "center" },
  infoBox: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between", // Ca să punem switch-ul în dreapta
    padding: 15,
    borderRadius: 12,
    width: "100%",
    marginBottom: 15, // Distanță mai mică între cutii
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2,
  },
  infoText: { fontSize: 16, fontWeight: "500" },
  logoutButton: {
    flexDirection: "row",
    backgroundColor: "#ff4757",
    paddingVertical: 15,
    paddingHorizontal: 40,
    borderRadius: 25,
    alignItems: "center",
    marginTop: 20,
    elevation: 5,
  },
  logoutText: { color: "white", fontWeight: "bold", fontSize: 16 },
});
