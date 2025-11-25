import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRef, useState } from "react";
import {
  Dimensions,
  FlatList,
  Image,
  ImageBackground,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useTheme } from "../context/ThemeContext";

const { width, height } = Dimensions.get("window");

// --- CONSTANTE & IMAGINI ---
const PLACE_TYPES = ["Restaurant", "Coffee Shop", "Bar", "Fast Food"];
const WelcomeBackground = require("../../assets/images/welcome_background.png");
const CoffeeBeanIcon = require("../../assets/images/coffee_bean.png");

const Slide = ({ item, colors, styles }) => (
  <ImageBackground
    source={WelcomeBackground}
    style={styles.imageBackground}
    blurRadius={5}
  >
    <View style={styles.darkOverlay} />
    <View style={[styles.slideContent]}>
      {/* Titlul rămâne AURIU (Important) */}
      <Text style={[styles.title, { color: colors.primary }]}>
        {item.title}
      </Text>

      {/* Subtitlul devine ALB (Text basic) */}
      <Text style={[styles.subtitle, { color: "#FFFFFF" }]}>
        {item.subtitle}
      </Text>

      {item.content && <View style={styles.contentArea}>{item.content}</View>}
    </View>
  </ImageBackground>
);

export default function WelcomeScreen({ navigation }) {
  const { colors } = useTheme();
  const [currentIndex, setCurrentIndex] = useState(0);
  const flatListRef = useRef(null);

  const SLIDES = [
    {
      key: "slide1",
      title: "Bine ai venit în SipSpot!",
      subtitle: "Descoperă locurile perfecte pentru tine.",
      content: null,
    },
    {
      key: "slide2",
      title: "Selecție de Calitate",
      subtitle:
        "Găsește localuri unde merită să-ți petreci timpul. Poți rezerva:",
      content: (
        <View style={styles.tagContainer}>
          {PLACE_TYPES.map((type, index) => (
            <View
              key={index}
              style={[styles.tag, { borderColor: colors.primary }]}
            >
              {/* Tag-urile rămân AURII (Cuvinte cheie) */}
              <Text style={[styles.tagText, { color: colors.primary }]}>
                {type}
              </Text>
            </View>
          ))}
        </View>
      ),
    },
    {
      key: "slide3",
      title: "Asistență AI Inteligentă",
      subtitle: "Lasă-ne să te ajutăm să alegi rapid și informat.",
      content: (
        <View style={styles.aiContent}>
          <View
            style={[
              styles.aiFeature,
              {
                backgroundColor: "rgba(0,0,0,0.6)",
                borderColor: colors.primary,
              },
            ]}
          >
            <Ionicons
              name="chatbubbles-outline"
              size={24}
              color={colors.primary}
            />
            {/* Titlu funcție: AURIU */}
            <Text style={[styles.aiFeatureTitle, { color: colors.primary }]}>
              AI Chat
            </Text>
            {/* Descriere funcție: ALB (Text basic) */}
            <Text style={[styles.aiFeatureDesc, { color: "#FFFFFF" }]}>
              Îți rafinează selecția până la localul perfect.
            </Text>
          </View>
          <View
            style={[
              styles.aiFeature,
              {
                backgroundColor: "rgba(0,0,0,0.6)",
                borderColor: colors.primary,
              },
            ]}
          >
            <Ionicons name="bulb-outline" size={24} color={colors.primary} />
            {/* Titlu funcție: AURIU */}
            <Text style={[styles.aiFeatureTitle, { color: colors.primary }]}>
              AI Rezumat
            </Text>
            {/* Descriere funcție: ALB (Text basic) */}
            <Text style={[styles.aiFeatureDesc, { color: "#FFFFFF" }]}>
              Te ajută să te decizi dacă locul este potrivit pentru tine.
            </Text>
          </View>
        </View>
      ),
    },
    {
      key: "slide4",
      title: "Program de Loialitate",
      subtitle: "Colecționează 'Boabe' și bucură-te de recompense.",
      content: (
        <View
          style={[
            styles.loyaltyContent,
            {
              backgroundColor: "rgba(0,0,0,0.6)",
              borderColor: colors.primary,
            },
          ]}
        >
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              marginBottom: 15,
            }}
          >
            <Image source={CoffeeBeanIcon} style={styles.coffeeBeanIcon} />
            {/* Numele programului: AURIU */}
            <Text style={[styles.loyaltyTitle, { color: colors.primary }]}>
              Boabe de Loialitate
            </Text>
          </View>

          {/* Descrierea lungă: ALB (Text basic) */}
          <Text style={[styles.loyaltyDesc, { color: "#FFFFFF" }]}>
            Sunt câștigate la localurile Partenere și pot fi cheltuite pe oferte
            exclusive:
          </Text>

          <View style={styles.loyaltyBenefits}>
            {/* Beneficiile rămân AURII (Sunt importante/recompense) */}
            <Text style={[styles.benefitText, { color: colors.primary }]}>
              • Reduceri de preț
            </Text>
            <Text style={[styles.benefitText, { color: colors.primary }]}>
              • Produse gratuite
            </Text>
            <Text style={[styles.benefitText, { color: colors.primary }]}>
              • Acces prioritar
            </Text>
          </View>
        </View>
      ),
    },
  ];

  const finishOnboarding = async () => {
    try {
      const userEmail = await AsyncStorage.getItem("user_session");

      if (userEmail) {
        const onboardingKey = `onboarding_complete:${userEmail}`;
        await AsyncStorage.setItem(onboardingKey, "true");
      }

      navigation.replace("MainTabs");
    } catch (e) {
      console.error("Eroare salvare onboarding:", e);
      navigation.replace("MainTabs");
    }
  };

  const nextSlide = () => {
    if (currentIndex < SLIDES.length - 1) {
      flatListRef.current.scrollToIndex({
        index: currentIndex + 1,
        animated: true,
      });
    }
  };

  const handleScroll = (event) => {
    const offset = event.nativeEvent.contentOffset.x;
    const newIndex = Math.round(offset / width);
    setCurrentIndex(newIndex);
  };

  const renderFooter = () => {
    const isLastSlide = currentIndex === SLIDES.length - 1;

    return (
      <View style={styles.footerContainer}>
        <View style={styles.dotContainer}>
          {SLIDES.map((_, index) => (
            <View
              key={index}
              style={[
                styles.dot,
                {
                  backgroundColor:
                    index === currentIndex
                      ? colors.primary
                      : "rgba(212, 175, 55, 0.3)",
                },
              ]}
            />
          ))}
        </View>

        <TouchableOpacity
          style={[styles.nextButton, { backgroundColor: colors.primary }]}
          onPress={isLastSlide ? finishOnboarding : nextSlide}
        >
          <Text style={styles.nextButtonText}>
            {isLastSlide ? "Start utilizare :D" : "Next >"}
          </Text>
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <View style={styles.mainContainer}>
      <StatusBar barStyle="light-content" />
      <FlatList
        ref={flatListRef}
        data={SLIDES}
        keyExtractor={(item) => item.key}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        renderItem={({ item }) => (
          <Slide item={item} colors={colors} styles={styles} />
        )}
      />
      {renderFooter()}
    </View>
  );
}

const styles = StyleSheet.create({
  mainContainer: { flex: 1, backgroundColor: "#000" },
  imageBackground: {
    width: width,
    height: height,
    justifyContent: "center",
    alignItems: "center",
  },
  darkOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 0, 0, 0.85)",
    zIndex: 1,
  },
  slideContent: {
    flex: 1,
    zIndex: 2,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
    width: "100%",
    paddingBottom: 100,
  },
  title: {
    fontSize: 32,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 20,
    textShadowColor: "rgba(0, 0, 0, 0.9)",
    textShadowOffset: { width: -1, height: 1 },
    textShadowRadius: 10,
  },
  subtitle: {
    fontSize: 18,
    textAlign: "center",
    marginBottom: 40,
    maxWidth: "90%",
    lineHeight: 24,
    fontWeight: "500",
    // Culoarea este setată dinamic în componentă la #FFFFFF
  },
  contentArea: {
    width: "100%",
    justifyContent: "center",
    alignItems: "center",
  },
  tagContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    gap: 10,
    marginTop: 20,
  },
  tag: {
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    borderWidth: 1,
  },
  tagText: { fontWeight: "bold", fontSize: 14 },
  aiContent: {
    flexDirection: "row",
    justifyContent: "space-around",
    width: "100%",
  },
  aiFeature: {
    width: "45%",
    alignItems: "center",
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
  },
  aiFeatureTitle: {
    fontWeight: "bold",
    marginTop: 10,
    fontSize: 16,
    marginBottom: 8,
  },
  aiFeatureDesc: { textAlign: "center", fontSize: 13, lineHeight: 18 },
  loyaltyContent: {
    alignItems: "center",
    padding: 25,
    borderRadius: 16,
    borderWidth: 1,
    width: "95%",
  },
  coffeeBeanIcon: {
    width: 20,
    height: 20,
    resizeMode: "contain",
    marginRight: 10,
  },
  loyaltyTitle: { fontSize: 24, fontWeight: "bold" },
  loyaltyDesc: {
    textAlign: "center",
    marginBottom: 20,
    fontSize: 16,
    lineHeight: 22,
  },
  loyaltyBenefits: { alignSelf: "flex-start", marginLeft: "5%" },
  benefitText: { fontSize: 16, marginBottom: 8, fontWeight: "500" },
  footerContainer: {
    position: "absolute",
    bottom: 40,
    width: width,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 30,
    zIndex: 10,
  },
  dotContainer: { flexDirection: "row", justifyContent: "center" },
  dot: { width: 10, height: 10, borderRadius: 5, marginHorizontal: 6 },
  nextButton: {
    paddingVertical: 12,
    paddingHorizontal: 30,
    borderRadius: 25,
    elevation: 5,
    shadowColor: "#D4AF37",
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  nextButtonText: { color: "#000000", fontSize: 16, fontWeight: "bold" },
});
