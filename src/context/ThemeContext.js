import AsyncStorage from "@react-native-async-storage/async-storage";
import { StatusBar } from "expo-status-bar";
import { createContext, useContext, useEffect, useState } from "react";

// 1. Definim Paleta de Culori
export const Colors = {
  light: {
    background: "#ffffff",
    text: "#333333",
    card: "#f0f0f0",
    primary: "#D4AF37", // Auriu pentru accente
    border: "#ddd",
    subtext: "gray",
    inputBackground: "#f9f9f9",
    coffee: "#6F4E37", // Culoare de cafea
  },
  dark: {
    background: "#121212", // Negru soft
    text: "#ffffff",
    card: "#1E1E1E",
    primary: "#D4AF37", // Auriu pentru accente
    border: "#333",
    subtext: "#aaa",
    inputBackground: "#2C2C2C",
    coffee: "#A67B5B", // Culoare de cafea mai deschisă pentru dark mode
  },
};

const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {
  const [theme, setTheme] = useState("light"); // Default Light

  // Încărcăm preferința la pornire
  useEffect(() => {
    const loadTheme = async () => {
      const storedTheme = await AsyncStorage.getItem("app_theme");
      if (storedTheme) {
        setTheme(storedTheme);
      }
    };
    loadTheme();
  }, []);

  // Funcția de schimbare a temei
  const toggleTheme = async () => {
    const newTheme = theme === "light" ? "dark" : "light";
    setTheme(newTheme);
    await AsyncStorage.setItem("app_theme", newTheme);
  };

  const colors = Colors[theme];

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, colors }}>
      {/* StatusBar se schimbă automat (negru pe alb / alb pe negru) */}
      <StatusBar style={theme === "dark" ? "light" : "dark"} />
      {children}
    </ThemeContext.Provider>
  );
};

// Hook personalizat pentru a folosi tema ușor în alte pagini
export const useTheme = () => useContext(ThemeContext);