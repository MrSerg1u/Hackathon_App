import { Ionicons } from "@expo/vector-icons";
import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Image,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useTheme } from "../context/ThemeContext"; 

// Asumăm că locatii.json este accesibil
import locatiiRaw from "../../locatii.json";

const GEMINI_API_KEY = process.env.EXPO_PUBLIC_GEMINI_API_KEY;

// IMPORTĂM COMPONENTA REUTILIZABILĂ
import LocationDetailsModal from "../components/LocationDetailsModal";

// --- CONSTANTE STATICE ---
const ACCENT_GOLD = "#D4AF37";

// --- PRE-PROCESAREA DATELOR ---
const locatii = locatiiRaw.map((p, index) => ({
  ...p,
  id: index.toString(),
}));

// --- CONFIGURARE GEMINI API ---
const API_KEY = GEMINI_API_KEY;
const MODEL_NAME = "gemini-2.5-flash-preview-09-2025";
const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL_NAME}:generateContent?key=${API_KEY}`;

const RESPONSE_SCHEMA = {
  type: "OBJECT",
  properties: {
    text: { type: "STRING" },
    mentionedPlacesIds: {
      type: "ARRAY",
      items: { type: "STRING" },
    },
  },
  propertyOrdering: ["text", "mentionedPlacesIds"],
};

const buildSystemInstruction = () => {
  const detailedLocatii = locatii.map((p) => ({
    id: p.id,
    name: p.name,
    type: p.type,
    partener: p.partener,
    address: p.address,
    short_description: p.short_description,
    rating: p.rating,
  }));

  return `Ești un asistent AI prietenos și profesionist. Rolul tău este să ajuți clientul să găsească localul perfect în funcție de preferințele sale. 
    Oferă recomandări și asistență generală bazându-te EXCLUSIV pe lista de localuri de mai jos. 
    Răspunsurile tale trebuie să fie foarte scurte, concise și directe. NU include detalii despre local în corpul textului.
    Odată ce ai decis ce localuri recomanzi, include ID-urile lor în lista 'mentionedPlacesIds' a răspunsului JSON.
    
    Lista de localuri:
    ${JSON.stringify(detailedLocatii, null, 2)}`;
};

const findPlaceById = (id) => {
  return locatii.find((p) => p.id === id);
};

// --- COMPONENTA PRINCIPALĂ CHATSCREEN ---

export default function ChatScreen() {
  const { colors, theme } = useTheme();

  const [messages, setMessages] = useState([
    {
      id: 1,
      text: "Salut! Sunt asistentul tău AI. Cum te pot ajuta să găsești localul perfect?",
      role: "model",
      mentionedPlacesIds: [],
    },
  ]);
  const [inputMessage, setInputMessage] = useState("");
  const [isThinking, setIsThinking] = useState(false);

  // --- MODIFICARE NUME VARIABILE PENTRU A EVITA CONFUZIA ---
  const [detailsModalVisible, setDetailsModalVisible] = useState(false);
  const [currentChatSelectedPlace, setCurrentChatSelectedPlace] = useState(null);

  const flatListRef = useRef(null);
  const systemInstruction = useRef(buildSystemInstruction()).current;

  // --- HANDLER REDENUMIT ---
  const handleShowDetails = (locationItem) => {
    setCurrentChatSelectedPlace(locationItem);
    setDetailsModalVisible(true);
  };

  const handleSendMessage = async () => {
    const text = inputMessage.trim();
    if (!text || isThinking) return;

    const newUserMessage = { id: Date.now(), text: text, role: "user" };
    setMessages((prev) => [...prev, newUserMessage]);
    setInputMessage("");
    setIsThinking(true);

    const chatHistory = messages.map((msg) => ({
      role: msg.role === "user" ? "user" : "model",
      parts: [{ text: msg.text }],
    }));

    const payload = {
      contents: chatHistory.concat([{ role: "user", parts: [{ text: text }] }]),
      systemInstruction: { parts: [{ text: systemInstruction }] },
      generationConfig: {
        responseMimeType: "application/json",
        responseSchema: RESPONSE_SCHEMA,
      },
    };

    let responseText =
      "Ne pare rău, a apărut o eroare la comunicarea cu AI-ul.";
    let mentionedIds = [];
    const maxRetries = 3;

    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        const response = await fetch(API_URL, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

        if (!response.ok) throw new Error(`API error: ${response.status}`);

        const result = await response.json();
        const jsonString = result.candidates?.[0]?.content?.parts?.[0]?.text;

        if (jsonString) {
          try {
            const parsedJson = JSON.parse(jsonString);
            responseText = parsedJson.text || responseText;
            mentionedIds = parsedJson.mentionedPlacesIds || [];
            break;
          } catch (parseError) {
            responseText = jsonString;
            break;
          }
        }
      } catch (error) {
        if (attempt < maxRetries - 1) {
          await new Promise((resolve) =>
            setTimeout(resolve, 1000 * Math.pow(2, attempt))
          );
        }
      }
    }

    const newBotMessage = {
      id: Date.now() + 1,
      text: responseText,
      role: "model",
      mentionedPlacesIds: mentionedIds,
    };
    setMessages((prev) => [...prev, newBotMessage]);
    setIsThinking(false);
  };

  useEffect(() => {
    if (flatListRef.current) {
      flatListRef.current.scrollToEnd({ animated: true });
    }
  }, [messages]);

  // --- COMPONENTA CARD (Theme Aware) ---
  const PlaceCard = ({ place }) => (
    <TouchableOpacity
      style={[
        styles.placeCard,
        { backgroundColor: colors.card, borderColor: colors.border },
      ]}
      // APELĂM HANDLER-UL REDENUMIT
      onPress={() => handleShowDetails(place)}
    >
      <Image
        source={{
          uri:
            place.image_url ||
            "https://placehold.co/80x80/1E1E1E/D4AF37?text=LOC",
        }}
        style={styles.placeCardImage}
      />
      <View style={styles.placeCardDetails}>
        <Text style={[styles.placeCardName, { color: colors.text }]}>
          {place.name}
        </Text>
        <Text style={[styles.placeCardType, { color: colors.subtext }]}>
          {place.type.toUpperCase()}
        </Text>
        <Text style={[styles.placeCardRating, { color: ACCENT_GOLD }]}>
          ★ {place.rating}
          {place.partener && (
            <Text
              style={{
                marginLeft: 5,
                fontWeight: "normal",
                color: ACCENT_GOLD,
              }}
            >
              {" "}
              (Partener)
            </Text>
          )}
        </Text>
      </View>
    </TouchableOpacity>
  );

  // --- COMPONENTE MESAJE (Theme Aware) ---
  const UserMessage = ({ text }) => (
    <View style={styles.userMessageContainer}>
      <View
        style={[
          styles.messageBubble,
          styles.userBubble,
          { backgroundColor: ACCENT_GOLD },
        ]}
      >
        <Text style={[styles.userText, { color: "#000" }]}>{text}</Text>
      </View>
      <View
        style={[
          styles.avatar,
          styles.userAvatar,
          { backgroundColor: colors.card },
        ]}
      >
        <Ionicons name="person" size={16} color={colors.text} />
      </View>
    </View>
  );

  const BotMessage = ({ text, mentionedPlacesIds }) => {
    const recommendedPlaces = (mentionedPlacesIds || [])
      .map((id) => findPlaceById(id))
      .filter((p) => p);

    return (
      <View style={styles.botMessageBlock}>
        <View style={styles.botMessageContainer}>
          <View
            style={[
              styles.avatar,
              styles.botAvatar,
              { backgroundColor: colors.card },
            ]}
          >
            <Ionicons
              name="chatbubble-ellipses"
              size={16}
              color={colors.primary}
            />
          </View>
          <View
            style={[
              styles.messageBubble,
              styles.botBubble,
              { backgroundColor: colors.card, borderColor: colors.border },
            ]}
          >
            <Text style={[styles.botText, { color: colors.text }]}>{text}</Text>
          </View>
        </View>

        {recommendedPlaces.length > 0 && (
          <View style={styles.recommendedPlacesContainer}>
            {recommendedPlaces.map((place) => (
              <PlaceCard key={place.id} place={place} />
            ))}
          </View>
        )}
      </View>
    );
  };

  const renderItem = ({ item }) => {
    if (item.role === "user") return <UserMessage text={item.text} />;
    return (
      <BotMessage
        text={item.text}
        mentionedPlacesIds={item.mentionedPlacesIds}
      />
    );
  };

  return (
    <SafeAreaView
      style={[styles.safeArea, { backgroundColor: colors.background }]}
    >
      <View
        style={[styles.titleContainer, { borderBottomColor: colors.border }]}
      >
        <Text style={[styles.title, { color: colors.text }]}>
          Asistent Local AI
        </Text>
        {isThinking && <ActivityIndicator size="small" color={ACCENT_GOLD} />}
      </View>

      <FlatList
        ref={flatListRef}
        data={messages}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderItem}
        contentContainerStyle={styles.chatListContent}
        onContentSizeChange={() =>
          flatListRef.current.scrollToEnd({ animated: true })
        }
      />

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 0}
      >
        <View
          style={[
            styles.inputContainer,
            {
              borderTopColor: colors.border,
              backgroundColor: colors.background,
            },
          ]}
        >
          <TextInput
            style={[
              styles.input,
              {
                backgroundColor: colors.inputBackground,
                color: colors.text,
                borderColor: colors.border,
              },
            ]}
            value={inputMessage}
            onChangeText={setInputMessage}
            placeholder="Trimite un mesaj..."
            placeholderTextColor={colors.subtext}
            editable={!isThinking}
            multiline
          />
          <TouchableOpacity
            style={[styles.sendButton, { backgroundColor: ACCENT_GOLD }]}
            onPress={handleSendMessage}
            disabled={isThinking || inputMessage.trim().length === 0}
          >
            {isThinking ? (
              <ActivityIndicator size="small" color="#FFF" />
            ) : (
              <Ionicons name="send" size={20} color="#FFF" />
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>

      {/* --- MODAL DETALII LOCAȚIE (CU PROPS NOI) --- */}
      <LocationDetailsModal
        visible={detailsModalVisible}
        location={currentChatSelectedPlace}
        onClose={() => setDetailsModalVisible(false)}
        // onPointsUpdate nu este necesar aici, deoarece Chat-ul nu afișează punctele
      />
    </SafeAreaView>
  );
}

// --- STILURI ---

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  titleContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    padding: 15,
    borderBottomWidth: 1,
  },
  title: {
    fontSize: 18,
    fontWeight: "bold",
    marginRight: 10,
  },
  chatListContent: {
    paddingVertical: 10,
    paddingHorizontal: 10,
    paddingBottom: 20,
  },
  botMessageBlock: {
    marginBottom: 10,
  },

  // --- BUBBLE STYLES ---
  messageBubble: {
    maxWidth: "80%",
    padding: 12,
    borderRadius: 15,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 1,
    elevation: 1,
  },
  botMessageContainer: {
    flexDirection: "row",
    justifyContent: "flex-start",
    alignItems: "flex-end",
  },
  botBubble: {
    marginLeft: 8,
    borderTopLeftRadius: 0,
    borderWidth: 1,
  },
  botText: {
    fontSize: 15,
  },
  userMessageContainer: {
    flexDirection: "row",
    justifyContent: "flex-end",
    alignItems: "flex-end",
    marginVertical: 5,
  },
  userBubble: {
    marginRight: 8,
    borderTopRightRadius: 0,
  },
  userText: {
    fontSize: 15,
    fontWeight: "500",
  },
  avatar: {
    width: 30,
    height: 30,
    borderRadius: 15,
    justifyContent: "center",
    alignItems: "center",
    overflow: "hidden",
  },
  botAvatar: {
    alignSelf: "flex-start",
  },
  userAvatar: {
    alignSelf: "flex-end",
  },

  // --- RECOMANDATION CARD STYLES ---
  recommendedPlacesContainer: {
    marginTop: 10,
    marginLeft: 40,
    gap: 8,
  },
  placeCard: {
    flexDirection: "row",
    padding: 10,
    borderRadius: 12,
    borderWidth: 1,
    maxWidth: "90%",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  placeCardImage: {
    width: 60,
    height: 60,
    borderRadius: 8,
    marginRight: 10,
  },
  placeCardDetails: {
    flex: 1,
    justifyContent: "center",
  },
  placeCardName: {
    fontSize: 16,
    fontWeight: "bold",
  },
  placeCardType: {
    fontSize: 12,
    marginBottom: 2,
  },
  placeCardRating: {
    fontSize: 14,
    fontWeight: "bold",
  },

  // --- INPUT STYLES ---
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    padding: 10,
    borderTopWidth: 1,
  },
  input: {
    flex: 1,
    minHeight: 40,
    maxHeight: 120,
    borderRadius: 20,
    paddingHorizontal: 15,
    paddingVertical: 8,
    fontSize: 16,
    marginRight: 10,
    borderWidth: 1,
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 5,
  },
});