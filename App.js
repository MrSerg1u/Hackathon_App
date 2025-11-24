import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  DarkTheme,
  DefaultTheme,
  NavigationContainer,
} from "@react-navigation/native"; // Importăm temele native
import { createStackNavigator } from "@react-navigation/stack";
import { useEffect, useState } from "react";
import { ActivityIndicator, View } from "react-native";

// Importăm Contextul creat
import { ThemeProvider, useTheme } from "./src/context/ThemeContext";

import LoginScreen from "./src/screens/LoginScreen";
import MainTabs from "./src/screens/MainTabs";
import RegisterScreen from "./src/screens/RegisterScreen";

const Stack = createStackNavigator();

// Componenta care conține Navigația (separată pentru a putea folosi useTheme)
const AppNavigator = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [initialRoute, setInitialRoute] = useState("Login");
  const { theme } = useTheme(); // Luăm tema curentă pentru Navigație

  useEffect(() => {
    const checkUser = async () => {
      try {
        const user = await AsyncStorage.getItem("user_session");
        if (user) setInitialRoute("MainTabs");
      } finally {
        setIsLoading(false);
      }
    };
    checkUser();
  }, []);

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  return (
    // Setăm tema navigației ca să nu avem flash-uri albe în dark mode
    <NavigationContainer theme={theme === "dark" ? DarkTheme : DefaultTheme}>
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
