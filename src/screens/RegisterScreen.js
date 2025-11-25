import AsyncStorage from "@react-native-async-storage/async-storage";
import { useState } from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useTheme } from "../context/ThemeContext";

export default function RegisterScreen({ navigation }) {
  const { colors } = useTheme();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [errors, setErrors] = useState({});

  const handleRegister = async () => {
    let currentErrors = {};
    const cleanName = name.trim();
    const cleanEmail = email.trim();
    const cleanPassword = password.trim();

    if (!cleanName) currentErrors.name = "Te rog introdu numele tău.";
    if (!cleanEmail) currentErrors.email = "Email-ul este obligatoriu.";
    else if (!cleanEmail.includes("@"))
      currentErrors.email = "Format invalid.";
    if (!cleanPassword) currentErrors.password = "Parola este obligatorie.";
    else if (cleanPassword.length < 6)
      currentErrors.password = "Minim 6 caractere.";

    if (Object.keys(currentErrors).length > 0) {
      setErrors(currentErrors);
      return;
    }
    setErrors({});

    try {
      const existingUsers = await AsyncStorage.getItem("registered_users");
      let users = existingUsers ? JSON.parse(existingUsers) : [];

      if (users.some((u) => u.email === cleanEmail)) {
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

      // Salvăm sesiunea (Email simplu)
      await AsyncStorage.setItem("user_session", cleanEmail);

      // Navigăm la Welcome (User nou -> trebuie să vadă onboarding)
      navigation.replace("Welcome");
    } catch (e) {
      console.error("Eroare la register:", e);
      setErrors({ general: "A apărut o eroare la salvare." });
    }
  };

  return (
    <ScrollView
      contentContainerStyle={[
        styles.container,
        { backgroundColor: colors.background },
      ]}
    >
      <Text style={[styles.title, { color: colors.text }]}>Creează Cont</Text>

      {errors.general && <Text style={styles.errorText}>{errors.general}</Text>}

      <View style={styles.inputGroup}>
        <TextInput
          style={[
            styles.input,
            {
              backgroundColor: colors.inputBackground,
              color: colors.text,
              borderColor: colors.border,
            },
            errors.name && styles.inputError,
          ]}
          placeholder="Nume"
          placeholderTextColor={colors.subtext}
          value={name}
          onChangeText={(text) => {
            setName(text);
            setErrors({ ...errors, name: null });
          }}
        />
        {errors.name && <Text style={styles.errorText}>{errors.name}</Text>}
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
            errors.email && styles.inputError,
          ]}
          placeholder="Email"
          placeholderTextColor={colors.subtext}
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
        onPress={handleRegister}
      >
        <Text style={styles.buttonText}>Înregistrează-te</Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={() => navigation.navigate("Login")}>
        <Text style={[styles.linkText, { color: colors.primary }]}>
          Ai deja cont? Autentifică-te
        </Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flexGrow: 1, justifyContent: "center", padding: 20 },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    marginBottom: 30,
    textAlign: "center",
  },
  inputGroup: { marginBottom: 10 },
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
  linkText: { marginTop: 20, textAlign: "center", fontWeight: "500" },
});