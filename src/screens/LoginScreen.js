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
import { useTheme } from "../context/ThemeContext"; // <--- 1. Importăm Hook-ul

export default function LoginScreen({ navigation }) {
  const { colors } = useTheme(); // <--- 2. Extragem culorile

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState({});

  const handleLogin = async () => {
    let currentErrors = {};
    const cleanEmail = email.trim();
    const cleanPassword = password.trim();

    if (!cleanEmail) currentErrors.email = "Introdu adresa de email.";
    if (!cleanPassword) currentErrors.password = "Introdu parola.";

    if (Object.keys(currentErrors).length > 0) {
      setErrors(currentErrors);
      return;
    }
    setErrors({});

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
        setErrors({ password: "Email sau parolă incorectă." });
      }
    } catch (e) {
      Alert.alert("Eroare", "Nu am putut verifica datele.");
    }
  };

  return (
    <ScrollView
      contentContainerStyle={[
        styles.container,
        { backgroundColor: colors.background },
      ]}
    >
      <Text style={[styles.title, { color: colors.text }]}>
        Bine ai venit! 👋
      </Text>

      <View style={styles.inputGroup}>
        <TextInput
          style={[
            styles.input,
            {
              backgroundColor: colors.inputBackground,
              color: colors.text,
              borderColor: colors.border,
            },
            errors.email && styles.inputError,
          ]}
          placeholder="Email"
          placeholderTextColor={colors.subtext} // Culoare dinamică pt placeholder
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
          style={[
            styles.input,
            {
              backgroundColor: colors.inputBackground,
              color: colors.text,
              borderColor: colors.border,
            },
            errors.password && styles.inputError,
          ]}
          placeholder="Parolă"
          placeholderTextColor={colors.subtext}
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

      <TouchableOpacity
        style={[styles.button, { backgroundColor: colors.primary }]}
        onPress={handleLogin}
      >
        <Text style={styles.buttonText}>Logare</Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={() => navigation.navigate("Register")}>
        <Text style={[styles.linkText, { color: colors.primary }]}>
          Nu ai cont? Creează unul acum!
        </Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flexGrow: 1, justifyContent: "center", padding: 20 }, // Fără bg color fix
  title: {
    fontSize: 30,
    fontWeight: "bold",
    marginBottom: 40,
    textAlign: "center",
  },
  inputGroup: { marginBottom: 15 },
  input: {
    borderWidth: 1,
    padding: 15,
    borderRadius: 12,
    fontSize: 16,
  },
  inputError: {
    borderColor: "#ff4444",
    borderWidth: 1.5,
  },
  errorText: {
    color: "#ff4444",
    fontSize: 12,
    marginTop: 4,
    marginLeft: 4,
    fontWeight: "600",
  },
  button: {
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 10,
    elevation: 3,
  },
  buttonText: { color: "#fff", fontWeight: "bold", fontSize: 16 },
  linkText: { marginTop: 25, textAlign: "center", fontWeight: "600" },
});
