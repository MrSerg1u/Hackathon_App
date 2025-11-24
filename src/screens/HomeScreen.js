import { StyleSheet, Text, View } from "react-native";
import { useTheme } from "../context/ThemeContext"; // <--- Import

export default function HomeScreen() {
  const { colors } = useTheme(); // <--- Extragere culori

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Text style={[styles.text, { color: colors.text }]}>🏠 Home Screen</Text>
      <Text style={[styles.subtext, { color: colors.subtext }]}>
        Aici va fi Harta și Lista cu locații.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: "center", alignItems: "center" },
  text: { fontSize: 24, fontWeight: "bold" },
  subtext: { fontSize: 16, marginTop: 10 },
});
