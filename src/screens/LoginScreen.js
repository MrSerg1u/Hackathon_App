import AsyncStorage from "@react-native-async-storage/async-storage";
import { useState } from "react";
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

export default function LoginScreen({ navigation }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState({}); // State pentru erori

  const handleLogin = async () => {
    let currentErrors = {};
    const cleanEmail = email.trim();
    const cleanPassword = password.trim();

    // 1. Validări simple UI
    if (!cleanEmail) currentErrors.email = "Introdu adresa de email.";
    if (!cleanPassword) currentErrors.password = "Introdu parola.";

    if (Object.keys(currentErrors).length > 0) {
      setErrors(currentErrors);
      return;
    }

    setErrors({}); // Resetăm dacă totul e ok vizual

    try {
      const usersString = await AsyncStorage.getItem("registered_users");
      const users = usersString ? JSON.parse(usersString) : [];

      const user = users.find(
        (u) => u.email === cleanEmail && u.password === cleanPassword
      );

      if (user) {
        await AsyncStorage.setItem("user_session", JSON.stringify(user));
        navigation.replace("MainTabs");
      } else {
        // Aici e o eroare generală, nu ține de un câmp anume, deci folosim Alert
        // Sau putem pune eroarea sub câmpul de parolă:
        setErrors({ password: "Email sau parolă incorectă." });
      }
    } catch (e) {
      Alert.alert("Eroare", "Nu am putut verifica datele.");
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Bine ai venit! 👋</Text>

      <View style={styles.inputGroup}>
        <TextInput
          style={[styles.input, errors.email && styles.inputError]}
          placeholder="Email"
          value={email}
          onChangeText={(text) => {
            setEmail(text);
            setErrors({ ...errors, email: null });
          }}
          autoCapitalize="none"
          keyboardType="email-address"
        />
        {errors.email && <Text style={styles.errorText}>{errors.email}</Text>}
      </View>

      <View style={styles.inputGroup}>
        <TextInput
          style={[styles.input, errors.password && styles.inputError]}
          placeholder="Parolă"
          value={password}
          onChangeText={(text) => {
            setPassword(text);
            setErrors({ ...errors, password: null });
          }}
          secureTextEntry
        />
        {errors.password && (
          <Text style={styles.errorText}>{errors.password}</Text>
        )}
      </View>

      <TouchableOpacity style={styles.button} onPress={handleLogin}>
        <Text style={styles.buttonText}>Logare</Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={() => navigation.navigate("Register")}>
        <Text style={styles.linkText}>Nu ai cont? Creează unul acum!</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    justifyContent: "center",
    padding: 20,
    backgroundColor: "#fff",
  },
  title: {
    fontSize: 30,
    fontWeight: "bold",
    marginBottom: 40,
    textAlign: "center",
    color: "#333",
  },
  inputGroup: { marginBottom: 15 },
  input: {
    backgroundColor: "#f9f9f9",
    borderWidth: 1,
    borderColor: "#ddd",
    padding: 15,
    borderRadius: 12,
    fontSize: 16,
  },
  inputError: {
    borderColor: "#ff4444",
    borderWidth: 1.5,
    backgroundColor: "#fff5f5",
  },
  errorText: {
    color: "#ff4444",
    fontSize: 12,
    marginTop: 4,
    marginLeft: 4,
    fontWeight: "600",
  },
  button: {
    backgroundColor: "#007AFF",
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 10,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 3,
  },
  buttonText: { color: "#fff", fontWeight: "bold", fontSize: 16 },
  linkText: {
    marginTop: 25,
    color: "#007AFF",
    textAlign: "center",
    fontWeight: "600",
  },
});
