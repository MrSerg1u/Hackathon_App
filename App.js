import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  DarkTheme,
  DefaultTheme,
  NavigationContainer,
} from "@react-navigation/native";
import { createStackNavigator } from "@react-navigation/stack";
import * as NavigationBar from "expo-navigation-bar";
import { useEffect, useRef, useState } from "react";
import { ActivityIndicator, AppState, Platform, View } from "react-native";

import { ThemeProvider, useTheme } from "./src/context/ThemeContext";

import LoginScreen from "./src/screens/LoginScreen";
import MainTabs from "./src/screens/MainTabs";
import RegisterScreen from "./src/screens/RegisterScreen";
import WelcomeScreen from "./src/screens/WelcomeScreen";

const Stack = createStackNavigator();

const AppNavigator = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [initialRoute, setInitialRoute] = useState("Login");
  const { theme } = useTheme();

  const appState = useRef(AppState.currentState);

  // --- FUNCȚIA CHEIE PENTRU ANDROID ---
  const setAndroidNavigationBar = async () => {
    try {
      // 1. Setăm poziția absolută: Asta previne "săritura" layout-ului.
      // Aplicația va ocupa tot ecranul din start, ignorând spațiul barei.
      await NavigationBar.setPositionAsync("absolute");

      // 2. O facem complet transparentă pentru a nu se vedea urât dacă apare accidental
      await NavigationBar.setBackgroundColorAsync("#ffffff00");

      // 3. O ascundem efectiv
      await NavigationBar.setVisibilityAsync("hidden");

      // 4. Comportament la swipe (reapare temporar peste aplicație)
      await NavigationBar.setBehaviorAsync("overlay-swipe");
    } catch (e) {
      console.log("Eroare la setarea NavigationBar:", e);
    }
  };

  useEffect(() => {
    const initializeApp = async () => {
      try {
        if (Platform.OS === "android") {
          await setAndroidNavigationBar();
        }

        const storedSession = await AsyncStorage.getItem("user_session");
        let userEmail = null;

        if (storedSession) {
          try {
            const userObj = JSON.parse(storedSession);
            if (userObj && userObj.email) {
              userEmail = userObj.email;
            }
          } catch (e) {
            if (storedSession.includes("@")) {
              userEmail = storedSession;
            }
          }
        }

        if (userEmail) {
          const onboardingKey = `onboarding_complete_${userEmail}`;
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
        console.error("Eroare la inițializare:", e);
        setInitialRoute("Login");
      } finally {
        setIsLoading(false);
      }
    };

    initializeApp();

    const subscription = AppState.addEventListener("change", (nextAppState) => {
      if (
        appState.current.match(/inactive|background/) &&
        nextAppState === "active"
      ) {
        if (Platform.OS === "android") {
          setAndroidNavigationBar();
        }
      }
      appState.current = nextAppState;
    });

    return () => {
      subscription.remove();
    };
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

  const navTheme = theme === "dark" ? DarkTheme : DefaultTheme;
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
          name="Welcome"
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
