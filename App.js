import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  DarkTheme,
  DefaultTheme,
  NavigationContainer,
} from "@react-navigation/native";
import { createStackNavigator } from "@react-navigation/stack";
import { useEffect, useState } from "react";
import { ActivityIndicator, View } from "react-native";

// Importăm Contextul creat
import { ThemeProvider, useTheme } from "./src/context/ThemeContext";

import LoginScreen from "./src/screens/LoginScreen";
import MainTabs from "./src/screens/MainTabs";
import RegisterScreen from "./src/screens/RegisterScreen";
import WelcomeScreen from "./src/screens/WelcomeScreen"; // Importă WelcomeScreen

const Stack = createStackNavigator();

// Componenta care conține Navigația (separată pentru a putea folosi useTheme)
const AppNavigator = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [initialRoute, setInitialRoute] = useState("Login");
  const { theme } = useTheme();

  useEffect(() => {
    const checkUserAndOnboarding = async () => {
      let sessionCorrupted = false;
      let userEmail = null;

      try {
        // Citim sesiunea stocată
        const storedSession = await AsyncStorage.getItem("user_session");

        if (storedSession) {
          // VERIFICARE CRITICĂ: Dacă sesiunea începe cu '{', înseamnă că e un JSON vechi (corupt)
          // sau dacă nu conține '@', o considerăm nesigură.
          if (storedSession.startsWith("{") || !storedSession.includes("@")) {
            console.error(
              "Sesiunea de utilizator este în format JSON vechi sau corupt. Resetare."
            );
            sessionCorrupted = true;
          } else {
            // Dacă trece de verificări, o tratăm ca string simplu (e-mail)
            userEmail = storedSession;
          }
        }

        if (sessionCorrupted) {
          // Ștergem sesiunea coruptă și mergem la Login
          await AsyncStorage.removeItem("user_session");
          setInitialRoute("Login");
        } else if (userEmail) {
          // Logica de navigare WelcomeScreen
          const onboardingKey = `onboarding_complete${userEmail}`;
          const onboardingComplete = await AsyncStorage.getItem(onboardingKey);

          if (onboardingComplete === "true") {
            setInitialRoute("MainTabs");
          } else {
            setInitialRoute("Welcome");
          }
        } else {
          setInitialRoute("Login");
        }
      } catch (e) {
        // Acest catch prinde erorile de citire/stocare
        console.error("Eroare la citirea sesiunii de utilizator:", e);
        setInitialRoute("Login");
      } finally {
        setIsLoading(false);
      }
    };
    checkUserAndOnboarding();
  }, []);

  if (isLoading) {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
          backgroundColor: theme === "dark" ? "#121212" : "#fff",
        }}
      >
        <ActivityIndicator
          size="large"
          color={theme === "dark" ? "#D4AF37" : "#007AFF"}
        />
      </View>
    );
  }

  // Definirea temei de navigare
  const navTheme = theme === "dark" ? DarkTheme : DefaultTheme;
  // Setăm culoarea primară a temei la auriu pentru un aspect unitar
  navTheme.colors.primary = "#D4AF37";

  return (
    <NavigationContainer theme={navTheme}>
      <Stack.Navigator initialRouteName={initialRoute}>
        <Stack.Screen
          name="Login"
          component={LoginScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="Register"
          component={RegisterScreen}
          options={{ title: "Creează Cont" }}
        />
        <Stack.Screen
          name="Welcome" // Ruta pentru Welcome Screen
          component={WelcomeScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="MainTabs"
          component={MainTabs}
          options={{ headerShown: false }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default function App() {
  return (
    <ThemeProvider>
      <AppNavigator />
    </ThemeProvider>
  );
}
