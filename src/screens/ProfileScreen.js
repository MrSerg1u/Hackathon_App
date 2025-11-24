import { Ionicons } from "@expo/vector-icons"; // Folosim iconițe pentru avatar
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useEffect, useState } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

export default function ProfileScreen({ navigation }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");

  // Această funcție rulează automat când intri pe pagina de profil
  useEffect(() => {
    const getUserData = async () => {
      try {
        const jsonValue = await AsyncStorage.getItem("user_session");
        if (jsonValue != null) {
          const user = JSON.parse(jsonValue);
          setName(user.name); // Setăm numele din memorie
          setEmail(user.email); // Setăm email-ul din memorie
        }
      } catch (e) {
        console.log("Eroare la citirea datelor utilizatorului");
      }
    };

    getUserData();
  }, []);

  const handleLogout = async () => {
    await AsyncStorage.removeItem("user_session");
    navigation.reset({
      index: 0,
      routes: [{ name: "Login" }],
    });
  };

  return (
    <View style={styles.container}>
      {/* Zona de Avatar */}
      <View style={styles.header}>
        <View style={styles.avatarContainer}>
          <Ionicons name="person" size={60} color="#fff" />
        </View>
        <Text style={styles.name}>{name || "Utilizator"}</Text>
        <Text style={styles.email}>{email || "guest@hackathon.app"}</Text>
      </View>

      {/* Zona de Acțiuni */}
      <View style={styles.body}>
        <View style={styles.infoBox}>
          <Ionicons
            name="ribbon-outline"
            size={24}
            color="#007AFF"
            style={{ marginRight: 10 }}
          />
          <Text style={styles.infoText}>Cont Membru Hackathon</Text>
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
  container: { flex: 1, backgroundColor: "#f8f9fa" },
  header: {
    backgroundColor: "#fff",
    paddingVertical: 40,
    alignItems: "center",
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    shadowColor: "#000",
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
    backgroundColor: "#007AFF", // Albastru
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 15,
    shadowColor: "#007AFF",
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 8,
  },
  name: { fontSize: 26, fontWeight: "bold", color: "#333" },
  email: { fontSize: 16, color: "gray", marginTop: 4 },
  body: { padding: 20, alignItems: "center" },
  infoBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    padding: 15,
    borderRadius: 12,
    width: "100%",
    marginBottom: 30,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2,
  },
  infoText: { fontSize: 16, color: "#333", fontWeight: "500" },
  logoutButton: {
    flexDirection: "row",
    backgroundColor: "#ff4757", // Roșu prietenos
    paddingVertical: 15,
    paddingHorizontal: 40,
    borderRadius: 25,
    alignItems: "center",
    shadowColor: "#ff4757",
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  logoutText: { color: "white", fontWeight: "bold", fontSize: 16 },
});
