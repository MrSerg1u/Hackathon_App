import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useState, useEffect } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  Linking,
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ScrollView,
} from "react-native";
import { useTheme } from "../context/ThemeContext";
import { GEMINI_API_KEY } from "../keys";

// --- CONFIGURARE GEMINI API ---
const API_KEY = GEMINI_API_KEY;
const MODEL_NAME = "gemini-2.5-flash-preview-09-2025";
const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL_NAME}:generateContent?key=${API_KEY}`;
const WhatsAppIcon = require("../../assets/images/whatsapp.png");

// --- DEFINIȚII OFERTE ---
const OFFER_TYPES = {
  1: { title: "10% Reducere", description: "Se aplică la nota finală.", emoji: "🏷️", price: 300 },
  2: { title: "O cafea gratis", description: "Primiți un Espresso la desert.", emoji: "☕", price: 500 },
  3: { title: "1+1 Gratis", description: "Valabil la cocktail-uri.", emoji: "🍹", price: 600 },
  4: { title: "Desert Cadou", description: "La comenzi peste 40 RON.", emoji: "🍰", price: 800 },
};

export default function LocationDetailsModal({ 
  visible, 
  location, 
  onClose, 
  onPointsUpdate, 
  onFavoriteUpdate // <--- Callback pentru actualizarea părintelui
}) {
  const { colors } = useTheme();

  // State
  const [aiModalVisible, setAiModalVisible] = useState(false);
  const [aiReviewText, setAiReviewText] = useState(null);
  const [isGeneratingAiReview, setIsGeneratingAiReview] = useState(false);
  const [hasRatedAiReview, setHasRatedAiReview] = useState(false);
  const [offersModalVisible, setOffersModalVisible] = useState(false);
  const [activeOffers, setActiveOffers] = useState([]);
  const [userPoints, setUserPoints] = useState(0);
  
  // State FAVORITE
  const [isFavorite, setIsFavorite] = useState(false);

  // --- EFFECT: Verifică status favorit și puncte la deschidere ---
  useEffect(() => {
    if (visible && location) {
      checkFavoriteStatus();
    }
    if (offersModalVisible) {
      loadUserPoints();
    }
  }, [visible, location, offersModalVisible]);

  // --- LOGICĂ FAVORITE ---
  const checkFavoriteStatus = async () => {
    try {
      const email = await AsyncStorage.getItem("user_session");
      if (!email) return;

      const favKey = `favorite_locations_${email}`;
      const storedFavs = await AsyncStorage.getItem(favKey);
      
      if (storedFavs) {
        const ids = JSON.parse(storedFavs);
        // Folosim ID sau Name ca identificator unic
        const locId = location.id || location.name;
        setIsFavorite(ids.includes(locId));
      } else {
        setIsFavorite(false);
      }
    } catch (e) {
      console.error("Eroare verificare favorite:", e);
    }
  };

  const handleToggleFavorite = async () => {
    try {
      const email = await AsyncStorage.getItem("user_session");
      if (!email) return;

      const favKey = `favorite_locations_${email}`;
      const storedFavs = await AsyncStorage.getItem(favKey);
      let ids = storedFavs ? JSON.parse(storedFavs) : [];
      
      const locId = location.id || location.name;

      if (ids.includes(locId)) {
        // Elimină din favorite
        ids = ids.filter(id => id !== locId);
        setIsFavorite(false);
      } else {
        // Adaugă la favorite
        ids.push(locId);
        setIsFavorite(true);
      }

      await AsyncStorage.setItem(favKey, JSON.stringify(ids));

      // Notificăm părintele (Home/Search) să reîmprospăteze lista
      if (onFavoriteUpdate) {
        onFavoriteUpdate();
      }

    } catch (e) {
      console.error("Eroare toggle favorite:", e);
    }
  };

  // --- LOGICĂ PUNCTE ---
  const loadUserPoints = async () => {
    try {
      const email = await AsyncStorage.getItem("user_session");
      if (email) {
        const pointsKey = `user_points_${email}`;
        const savedPoints = await AsyncStorage.getItem(pointsKey);
        setUserPoints(savedPoints ? parseInt(savedPoints, 10) : 0);
      }
    } catch (e) {
      console.error("Eroare la încărcarea punctelor:", e);
    }
  };

  if (!location) return null;

  // --- HANDLERS OFERTE ---
  const handleActivateOffer = async (offerId) => {
    if (activeOffers.includes(offerId)) return;

    const offerPrice = OFFER_TYPES[offerId]?.price || 0;

    if (userPoints >= offerPrice) {
      const newPoints = userPoints - offerPrice;
      setUserPoints(newPoints);
      setActiveOffers([...activeOffers, offerId]);

      try {
        const email = await AsyncStorage.getItem("user_session");
        if (email) {
          const pointsKey = `user_points_${email}`;
          await AsyncStorage.setItem(pointsKey, newPoints.toString());
          
          Alert.alert("Succes!", "Oferta a fost activată.");

          if (onPointsUpdate) {
            onPointsUpdate();
          }
        }
      } catch (e) {
        console.error("Eroare la salvarea punctelor:", e);
      }
    } else {
      Alert.alert(
        "Puncte insuficiente",
        `Ai nevoie de încă ${offerPrice - userPoints} puncte pentru a activa această ofertă.`
      );
    }
  };

  // --- ALTE HANDLERS ---
  const handleWhatsAppReservation = () => {
    Linking.openURL("whatsapp://").catch(() => {
      console.log("Nu s-a putut deschide WhatsApp");
    });
  };

  const generateAIReview = async () => {
    if (isGeneratingAiReview) return;
    setAiModalVisible(true);
    setIsGeneratingAiReview(true);
    setAiReviewText(null);
    setHasRatedAiReview(false);

    const locationDetails = { ...location };
    delete locationDetails.image_url;
    delete locationDetails.offers;

    const systemPrompt = `Ești un expert în recomandări locale. Generează un scurt și convingător rezumat pentru acest local. 
    Rezumatul trebuie să fie un paragraf scurt care să capteze atmosfera. 
    La final, adaugă O SINGURĂ FRAZĂ: "Perfect pentru...". Răspunde DOAR cu textul.`;

    const userQuery = `Rezumat pentru: ${JSON.stringify(locationDetails)}`;

    const payload = {
      contents: [{ parts: [{ text: userQuery }] }],
      systemInstruction: { parts: [{ text: systemPrompt }] },
    };

    let generatedText = "Nu s-a putut genera rezumatul.";

    try {
      const response = await fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const result = await response.json();
      const text = result.candidates?.[0]?.content?.parts?.[0]?.text;
      if (text) generatedText = text;
    } catch (error) {
      console.error("AI Error:", error);
    }

    setAiReviewText(generatedText);
    setIsGeneratingAiReview(false);
  };

  const handleRateAIReview = () => setHasRatedAiReview(true);
  const handleReportAIReview = () => setAiModalVisible(false);

  return (
    <>
      {/* --- MODAL PRINCIPAL --- */}
      <Modal animationType="fade" transparent={true} visible={visible} onRequestClose={onClose}>
        <View style={styles.modalContainer}>
          <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={onClose} />
          
          <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
            {/* Header Imagine */}
            <View>
              <Image source={{ uri: location.image_url }} style={styles.modalImage} />
              
              {/* BUTON FAVORIT (INIMIOARĂ) */}
              <TouchableOpacity 
                style={styles.favoriteIconBtn} 
                onPress={handleToggleFavorite}
                activeOpacity={0.8}
              >
                <Ionicons 
                  name={isFavorite ? "heart" : "heart-outline"} 
                  size={24} 
                  color={isFavorite ? "#FF4757" : "#000"} 
                />
              </TouchableOpacity>

              {/* BUTON ÎNCHIDERE */}
              <TouchableOpacity style={styles.closeIconBtn} onPress={onClose}>
                <Ionicons name="close" size={24} color="#000" />
              </TouchableOpacity>
            </View>

            <View style={styles.modalBody}>
              {/* Titlu */}
              <Text style={[styles.modalTitle, { color: colors.text }]}>{location.name}</Text>

              {/* Tag Partener */}
              {location.partener && (
                <Text style={{ color: colors.primary, fontWeight: "bold", marginBottom: 10 }}>
                  ⭐ LOCAȚIE PARTENER
                </Text>
              )}

              {/* Adresă */}
              <View style={styles.rowCenter}>
                <Ionicons name="location" size={18} color={colors.primary} />
                <Text style={[styles.modalAddress, { color: colors.subtext }]}>
                  {location.address}
                </Text>
              </View>

              {/* Tip */}
              <Text style={{ color: colors.subtext, fontStyle: "italic", marginBottom: 5 }}>
                Tip: {location.type ? location.type.toUpperCase() : "N/A"}
              </Text>

              {/* Descriere */}
              <Text style={[styles.modalDesc, { color: colors.text }]}>
                {location.short_description}
              </Text>

              {/* Rating */}
              <View style={styles.ratingContainer}>
                <Ionicons name="star" size={24} color="#D4AF37" />
                <Text style={[styles.ratingText, { color: colors.text }]}>
                  {location.rating}
                </Text>
              </View>

              {/* Butoane Actiune */}
              <View style={styles.actionButtonsContainer}>
                {/* Buton Oferte (Doar Parteneri) */}
                {location.partener && location.offers && location.offers.length > 0 && (
                  <TouchableOpacity
                    style={[styles.offersButton, { backgroundColor: colors.primary }]}
                    onPress={() => setOffersModalVisible(true)}
                  >
                    <Ionicons name="gift-outline" size={20} color="#000" />
                    <Text style={styles.offersButtonText}>Vezi oferte partenere</Text>
                  </TouchableOpacity>
                )}

                {/* Rând butoane AI și WhatsApp */}
                <View style={styles.modalActionButtonsRow}>
                  <TouchableOpacity 
                    style={[styles.aiReviewButton, { borderColor: colors.primary }]} 
                    onPress={generateAIReview}
                  >
                    <Text style={[styles.aiReviewTextBtn, { color: colors.primary }]}>✨ AI Rezumat</Text>
                  </TouchableOpacity>

                  <TouchableOpacity style={styles.whatsappButton} onPress={handleWhatsAppReservation}>
                    <Image source={WhatsAppIcon} style={styles.whatsappIcon} resizeMode="contain" />
                    <Text style={styles.whatsappText}>Rezervă</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </View>
        </View>
      </Modal>

      {/* --- MODAL OFERTE --- */}
      <Modal animationType="slide" transparent={true} visible={offersModalVisible} onRequestClose={() => setOffersModalVisible(false)}>
        <View style={styles.modalContainer}>
           <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={() => setOffersModalVisible(false)} />
           
           <View style={[styles.offersModalContent, { backgroundColor: colors.card }]}>
              <View style={styles.offersHeader}>
                 <View>
                    <Text style={[styles.offersTitle, { color: colors.primary }]}>Oferte Disponibile</Text>
                    <Text style={{ color: colors.subtext, fontSize: 12 }}>
                       Puncte disponibile: <Text style={{fontWeight:'bold', color: colors.text}}>{userPoints}</Text>
                    </Text>
                 </View>
                 <TouchableOpacity onPress={() => setOffersModalVisible(false)} style={styles.offersCloseBtn}>
                    <Ionicons name="close" size={24} color={colors.text} />
                 </TouchableOpacity>
              </View>
              
              <ScrollView contentContainerStyle={styles.offersList}>
                 {location?.offers && location.offers.length > 0 ? (
                    location.offers.map((offerId, index) => {
                       const offerData = OFFER_TYPES[offerId];
                       if (!offerData) return null;
                       const isActivated = activeOffers.includes(offerId);
                       return (
                          <View key={index} style={[styles.offerCard, { backgroundColor: colors.background, borderColor: colors.primary, opacity: isActivated ? 0.5 : 1 }]}>
                             <View style={styles.offerEmojiContainer}><Text style={styles.offerEmoji}>{offerData.emoji}</Text></View>
                             <View style={styles.offerTextContainer}>
                                <Text style={[styles.offerCardTitle, { color: colors.text }]}>{offerData.title}</Text>
                                <Text style={[styles.offerCardDesc, { color: colors.subtext }]}>{offerData.description}</Text>
                                <View style={styles.offerActionRow}>
                                   <Text style={[styles.offerPriceText, { color: colors.primary }]}>{offerData.price} pct</Text>
                                   <TouchableOpacity
                                      style={[styles.activateButton, { backgroundColor: isActivated ? "#555" : colors.primary }]}
                                      disabled={isActivated}
                                      onPress={() => handleActivateOffer(offerId)}
                                   >
                                      <Text style={[styles.activateButtonText, { color: isActivated ? "#AAA" : "#000" }]}>
                                         {isActivated ? "Activat" : "Activează"}
                                      </Text>
                                   </TouchableOpacity>
                                </View>
                             </View>
                          </View>
                       );
                    })
                 ) : (
                    <Text style={{ color: colors.subtext, textAlign: "center" }}>Nu există oferte.</Text>
                 )}
              </ScrollView>
           </View>
        </View>
      </Modal>
      
      {/* --- MODAL AI --- */}
      <Modal animationType="fade" transparent={true} visible={aiModalVisible} onRequestClose={() => setAiModalVisible(false)}>
        <View style={styles.modalContainer}>
            <TouchableOpacity style={styles.backdrop} onPress={() => setAiModalVisible(false)} />
            <View style={[styles.aiModalContent, { backgroundColor: colors.card }]}>
               <TouchableOpacity style={styles.aiModalCloseIcon} onPress={() => setAiModalVisible(false)}>
                  <Ionicons name="close" size={20} color={colors.text} />
               </TouchableOpacity>

               <Text style={[styles.aiModalTitle, { color: colors.primary }]}>AI Rezumat Locație</Text>

               {isGeneratingAiReview ? (
                 <View style={styles.aiModalLoading}>
                   <ActivityIndicator size="large" color={colors.primary} />
                   <Text style={{ color: colors.subtext, marginTop: 10 }}>Se generează...</Text>
                 </View>
               ) : (
                 aiReviewText && (
                   <>
                     <Text style={[styles.aiReviewText, { color: colors.text }]}>{aiReviewText}</Text>
                     <View style={styles.aiModalFooter}>
                        {hasRatedAiReview ? (
                           <Text style={{ color: colors.subtext, fontStyle: "italic" }}>Mulțumim pentru feedback!</Text>
                        ) : (
                           <>
                              <Text style={{ color: colors.text, marginRight: 10 }}>Te-a ajutat?</Text>
                              <TouchableOpacity onPress={handleRateAIReview} style={{ marginRight: 10 }}>
                                 <Ionicons name="happy-outline" size={30} color={colors.primary} />
                              </TouchableOpacity>
                              <TouchableOpacity onPress={handleRateAIReview}>
                                 <Ionicons name="sad-outline" size={30} color={colors.primary} />
                              </TouchableOpacity>
                           </>
                        )}
                     </View>
                     <TouchableOpacity onPress={handleReportAIReview} style={styles.reportButton}>
                        <Ionicons name="flag-outline" size={16} color={colors.subtext} />
                        <Text style={[styles.reportButtonText, { color: colors.subtext }]}>Raportează Inexactitatea</Text>
                     </TouchableOpacity>
                   </>
                 )
               )}
            </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  modalContainer: { flex: 1, justifyContent: "center", alignItems: "center" },
  backdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(0,0,0,0.6)", zIndex: 1 },
  modalContent: { width: "90%", borderRadius: 20, overflow: "hidden", paddingBottom: 20, elevation: 10, zIndex: 2, maxHeight: "90%" },
  modalImage: { width: "100%", height: 200, resizeMode: "cover" },
  
  closeIconBtn: { 
    position: "absolute", 
    top: 15, 
    right: 15, 
    backgroundColor: "rgba(255,255,255,0.8)", 
    borderRadius: 20, 
    width: 36, 
    height: 36, 
    justifyContent: "center", 
    alignItems: "center", 
    zIndex: 10 
  },

  favoriteIconBtn: {
    position: "absolute",
    top: 15,
    right: 60, // Lângă butonul Close
    backgroundColor: "rgba(255,255,255,0.8)",
    borderRadius: 20,
    width: 36,
    height: 36,
    justifyContent: "center",
    alignItems: "center",
    zIndex: 10,
  },

  modalBody: { padding: 20 },
  modalTitle: { fontSize: 24, fontWeight: "bold", marginBottom: 5 },
  modalAddress: { fontSize: 14, marginLeft: 5 },
  modalDesc: { fontSize: 16, marginTop: 10, lineHeight: 22 },
  rowCenter: { flexDirection: "row", alignItems: "center", marginBottom: 10 },
  ratingContainer: { flexDirection: "row", alignItems: "center", marginTop: 10, marginBottom: 20 },
  ratingText: { fontSize: 20, fontWeight: "bold", marginLeft: 5 },
  actionButtonsContainer: { marginTop: 10, gap: 15 },
  offersButton: { flexDirection: "row", paddingVertical: 12, borderRadius: 12, justifyContent: "center", alignItems: "center", elevation: 2, shadowColor: "#000", shadowOpacity: 0.2, shadowRadius: 4, width: "100%" },
  offersButtonText: { color: "#000", fontSize: 16, fontWeight: "bold", marginLeft: 8 },
  modalActionButtonsRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  aiReviewButton: { flex: 1, marginRight: 10, paddingVertical: 12, borderRadius: 30, justifyContent: "center", alignItems: "center", borderWidth: 1 },
  aiReviewTextBtn: { fontSize: 16, fontWeight: "bold" },
  whatsappButton: { flexDirection: "row", backgroundColor: "#25D366", paddingVertical: 12, paddingHorizontal: 20, borderRadius: 30, justifyContent: "center", alignItems: "center", elevation: 3 },
  whatsappIcon: { width: 24, height: 24, marginRight: 10 },
  whatsappText: { color: "#fff", fontSize: 18, fontWeight: "bold" },
  
  offersModalContent: { width: "85%", borderRadius: 20, padding: 20, elevation: 15, zIndex: 5, maxHeight: "60%" },
  offersHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 15, borderBottomWidth: 1, borderBottomColor: "#444", paddingBottom: 10 },
  offersTitle: { fontSize: 20, fontWeight: "bold" },
  offersCloseBtn: { padding: 5 },
  offersList: { paddingBottom: 10 },
  offerCard: { flexDirection: "row", borderRadius: 12, padding: 12, marginBottom: 12, borderWidth: 1, alignItems: "center" },
  offerEmojiContainer: { marginRight: 15, justifyContent: "center", alignItems: "center", width: 40 },
  offerEmoji: { fontSize: 32 },
  offerTextContainer: { flex: 1, flexDirection: "column" },
  offerCardTitle: { fontSize: 16, fontWeight: "bold", marginBottom: 4 },
  offerCardDesc: { fontSize: 12, marginBottom: 10, fontStyle: "italic" },
  offerActionRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 5 },
  offerPriceText: { fontSize: 14, fontWeight: 'bold' },
  activateButton: { paddingVertical: 6, paddingHorizontal: 12, borderRadius: 8 },
  activateButtonText: { fontSize: 12, fontWeight: "bold" },

  aiModalContent: { width: "90%", borderRadius: 15, padding: 20, elevation: 12, minHeight: 250, zIndex: 2 },
  aiModalCloseIcon: { position: "absolute", top: 10, right: 10, padding: 5, zIndex: 10 },
  aiModalTitle: { fontSize: 18, fontWeight: "bold", marginBottom: 15, textAlign: "center" },
  aiModalLoading: { flex: 1, justifyContent: "center", alignItems: "center", minHeight: 100 },
  aiReviewText: { fontSize: 15, lineHeight: 22, marginBottom: 20 },
  aiModalFooter: { flexDirection: "row", alignItems: "center", justifyContent: "center", paddingVertical: 10, borderTopWidth: 1, borderTopColor: "#ccc" },
  reportButton: { flexDirection: "row", alignItems: "center", justifyContent: "center", marginTop: 10, padding: 5 },
  reportButtonText: { marginLeft: 5, fontSize: 12 },
});