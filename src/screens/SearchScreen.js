import { StyleSheet, Text, View } from "react-native";
import { useTheme } from "../context/ThemeContext";

export default function SearchScreen() {
  const { colors } = useTheme();

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Text style={[styles.text, { color: colors.text }]}>🔍 Search</Text>
      <Text style={[styles.subtext, { color: colors.subtext }]}>
        Caută locații sau prieteni...
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: "center", alignItems: "center" },
  text: { fontSize: 24, fontWeight: "bold" },
  subtext: { fontSize: 16, marginTop: 10 },
});
