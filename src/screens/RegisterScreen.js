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

export default function RegisterScreen({ navigation }) {
  // State pentru date
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");

  // State pentru erori (obiect gol inițial)
  const [errors, setErrors] = useState({});

  const handleRegister = async () => {
    // 1. Resetăm erorile la fiecare apăsare
    let currentErrors = {};
    const cleanName = name.trim();
    const cleanEmail = email.trim();
    const cleanPassword = password.trim();

    // 2. Validări (colectăm erorile)
    if (!cleanName) {
      currentErrors.name = "Te rog introdu numele tău.";
    }

    if (!cleanEmail) {
      currentErrors.email = "Email-ul este obligatoriu.";
    } else if (!cleanEmail.includes("@")) {
      currentErrors.email = "Formatul email-ului nu este valid.";
    }

    if (!cleanPassword) {
      currentErrors.password = "Parola este obligatorie.";
    } else if (cleanPassword.length < 6) {
      currentErrors.password = "Parola trebuie să aibă minim 6 caractere.";
    }

    // 3. Dacă avem erori, le afișăm și oprim funcția
    if (Object.keys(currentErrors).length > 0) {
      setErrors(currentErrors);
      return;
    }

    // Dacă ajungem aici, formularul e valid, ștergem erorile vizuale
    setErrors({});

    try {
      const existingUsers = await AsyncStorage.getItem("registered_users");
      let users = existingUsers ? JSON.parse(existingUsers) : [];

      // Verificăm duplicat
      if (users.some((u) => u.email === cleanEmail)) {
        // Setăm eroare specifică pe câmpul de email
        setErrors({ email: "Acest email este deja folosit." });
        return;
      }

      const newUser = {
        name: cleanName,
        email: cleanEmail,
        password: cleanPassword,
      };
      users.push(newUser);

      await AsyncStorage.setItem("registered_users", JSON.stringify(users));
      await AsyncStorage.setItem("user_session", JSON.stringify(newUser));

      Alert.alert("Succes", `Cont creat! Bine ai venit, ${cleanName}.`);
      navigation.replace("MainTabs");
    } catch (e) {
      Alert.alert("Eroare Sistem", "Ceva nu a mers la salvare.");
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Creează Cont</Text>

      {/* INPUT NUME */}
      <View style={styles.inputGroup}>
        <TextInput
          style={[styles.input, errors.name && styles.inputError]}
          placeholder="Nume"
          value={name}
          onChangeText={(text) => {
            setName(text);
            setErrors({ ...errors, name: null });
          }}
        />
        {errors.name && <Text style={styles.errorText}>{errors.name}</Text>}
      </View>

      {/* INPUT EMAIL */}
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

      {/* INPUT PAROLĂ */}
      <View style={styles.inputGroup}>
        <TextInput
          style={[styles.input, errors.password && styles.inputError]}
          placeholder="Parolă (min 6 caractere)"
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

      <TouchableOpacity style={styles.button} onPress={handleRegister}>
        <Text style={styles.buttonText}>Înregistrează-te</Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={() => navigation.navigate("Login")}>
        <Text style={styles.linkText}>Ai deja cont? Autentifică-te</Text>
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
    fontSize: 28,
    fontWeight: "bold",
    marginBottom: 30,
    textAlign: "center",
    color: "#333",
  },
  inputGroup: { marginBottom: 10 },
  input: {
    backgroundColor: "#f9f9f9",
    borderWidth: 1,
    borderColor: "#ddd",
    padding: 15,
    borderRadius: 12,
    fontSize: 16,
  },
  inputError: {
    borderColor: "#ff4444", // BORDER ROȘU
    borderWidth: 1.5,
    backgroundColor: "#fff5f5", // Fundal ușor roșiatic
  },
  errorText: {
    color: "#ff4444",
    fontSize: 12,
    marginTop: 4,
    marginLeft: 4,
    fontWeight: "600",
  },
  button: {
    backgroundColor: "#28a745",
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
    marginTop: 20,
    color: "#007AFF",
    textAlign: "center",
    fontWeight: "500",
  },
});
