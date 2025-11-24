import { Ionicons } from "@expo/vector-icons";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { useTheme } from "../context/ThemeContext"; // <--- Import

import HomeScreen from "./HomeScreen";
import ProfileScreen from "./ProfileScreen";

const Tab = createBottomTabNavigator();

export default function MainTabs() {
  const { colors, theme } = useTheme(); // <--- Luăm culorile

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: colors.primary, // Culoarea activă din temă
        tabBarInactiveTintColor: "gray",
        tabBarStyle: {
          backgroundColor: colors.card, // Fundalul barei
          borderTopColor: colors.border, // Linia de sus
        },
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;
          if (route.name === "Explore")
            iconName = focused ? "map" : "map-outline";
          else if (route.name === "Profil")
            iconName = focused ? "person" : "person-outline";
          return <Ionicons name={iconName} size={size} color={color} />;
        },
      })}
    >
      <Tab.Screen name="Explore" component={HomeScreen} />
      <Tab.Screen name="Profil" component={ProfileScreen} />
    </Tab.Navigator>
  );
}
