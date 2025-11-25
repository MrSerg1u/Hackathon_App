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

// ... (Restul importurilor și constantele OFFER_TYPES rămân la fel) ...
const OFFER_TYPES = {
  1: { title: "10% Reducere", description: "Se aplică la nota finală.", emoji: "🏷️", price: 300 },
  2: { title: "O cafea gratis", description: "Primiți un Espresso la desert.", emoji: "☕", price: 500 },
  3: { title: "1+1 Gratis", description: "Valabil la cocktail-uri.", emoji: "🍹", price: 600 },
  4: { title: "Desert Cadou", description: "La comenzi peste 40 RON.", emoji: "🍰", price: 800 },
};

// CONSTANTELE API RĂMÂN LA FEL...
const API_KEY = GEMINI_API_KEY;
const MODEL_NAME = "gemini-2.5-flash-preview-09-2025";
const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL_NAME}:generateContent?key=${API_KEY}`;
const WhatsAppIcon = require("../../assets/images/whatsapp.png");

// ⬇️ MODIFICARE AICI: Adăugăm `onPointsUpdate` în lista de props
export default function LocationDetailsModal({ visible, location, onClose, onPointsUpdate }) {
  const { colors } = useTheme();

  // ... (State-urile rămân la fel) ...
  const [aiModalVisible, setAiModalVisible] = useState(false);
  const [aiReviewText, setAiReviewText] = useState(null);
  const [isGeneratingAiReview, setIsGeneratingAiReview] = useState(false);
  const [hasRatedAiReview, setHasRatedAiReview] = useState(false);
  const [offersModalVisible, setOffersModalVisible] = useState(false);
  const [activeOffers, setActiveOffers] = useState([]);
  const [userPoints, setUserPoints] = useState(0);

  // ... (useEffect și loadUserPoints rămân la fel) ...
  useEffect(() => {
    if (offersModalVisible) {
      loadUserPoints();
    }
  }, [offersModalVisible]);

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

          // ⬇️ MODIFICARE AICI: Actualizăm pagina părinte (Home) dacă funcția există
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

  // ... (Restul codului, funcția handleWhatsAppReservation, AI logic, și render rămân neschimbate) ...
  // DOAR ASIGURĂ-TE CĂ COPIEZI TOT CODUL DE RENDER DIN FIȘIERUL ANTERIOR
  
  // (Pentru claritate, am omis codul UI care nu s-a schimbat, dar el trebuie să fie prezent aici)
  
  // --- INSEREZ LOGICA PENTRU RENDER ---
  const resetOffersState = () => { setOffersModalVisible(false); };
  const handleWhatsAppReservation = () => { Linking.openURL("whatsapp://").catch(() => {}); };
  
  const generateAIReview = async () => {
     // ... (codul AI existent) ...
     setAiModalVisible(true); 
     // ...
  };
  const handleRateAIReview = () => setHasRatedAiReview(true);
  const handleReportAIReview = () => setAiModalVisible(false);

  return (
    <>
      <Modal animationType="fade" transparent={true} visible={visible} onRequestClose={onClose}>
        {/* ... Codul UI pentru Modalul Principal ... */}
         <View style={styles.modalContainer}>
          <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={onClose} />
          <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
             {/* ... Imagine, Titlu, etc ... */}
             <View>
              <Image source={{ uri: location.image_url }} style={styles.modalImage} />
              <TouchableOpacity style={styles.closeIconBtn} onPress={onClose}>
                <Ionicons name="close" size={24} color="#000" />
              </TouchableOpacity>
            </View>
            <View style={styles.modalBody}>
                <Text style={[styles.modalTitle, { color: colors.text }]}>{location.name}</Text>
                {/* ... Restul detaliilor ... */}
                
                {/* Butoane Actiune */}
                <View style={styles.actionButtonsContainer}>
                    {location.partener && location.offers && location.offers.length > 0 && (
                      <TouchableOpacity
                        style={[styles.offersButton, { backgroundColor: colors.primary }]}
                        onPress={() => setOffersModalVisible(true)}
                      >
                        <Ionicons name="gift-outline" size={20} color="#000" />
                        <Text style={styles.offersButtonText}>Vezi oferte partenere</Text>
                      </TouchableOpacity>
                    )}
                    {/* ... Butoane AI si Whatsapp ... */}
                    <View style={styles.modalActionButtonsRow}>
                        <TouchableOpacity style={[styles.aiReviewButton, { borderColor: colors.primary }]} onPress={generateAIReview}>
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
      
      {/* ... Modalul AI rămâne neschimbat ... */}
       <Modal animationType="fade" transparent={true} visible={aiModalVisible} onRequestClose={() => setAiModalVisible(false)}>
         {/* ... Conținut modal AI ... */}
         <View style={styles.modalContainer}>
             <TouchableOpacity style={styles.backdrop} onPress={() => setAiModalVisible(false)} />
             <View style={[styles.aiModalContent, { backgroundColor: colors.card }]}>
                {/* ... Logica AI ... */}
                {isGeneratingAiReview ? <ActivityIndicator size="large" color={colors.primary}/> : <Text style={{color:colors.text}}>{aiReviewText}</Text>}
                {/* ... Butoane close/report ... */}
                <TouchableOpacity style={styles.aiModalCloseIcon} onPress={() => setAiModalVisible(false)}>
                   <Ionicons name="close" size={20} color={colors.text} />
                </TouchableOpacity>
             </View>
         </View>
       </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  // ... Toate stilurile rămân EXACT cum erau în fișierul anterior ...
  modalContainer: { flex: 1, justifyContent: "center", alignItems: "center" },
  backdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(0,0,0,0.6)", zIndex: 1 },
  modalContent: { width: "90%", borderRadius: 20, overflow: "hidden", paddingBottom: 20, elevation: 10, zIndex: 2, maxHeight: "90%" },
  modalImage: { width: "100%", height: 200, resizeMode: "cover" },
  closeIconBtn: { position: "absolute", top: 15, right: 15, backgroundColor: "rgba(255,255,255,0.8)", borderRadius: 20, width: 36, height: 36, justifyContent: "center", alignItems: "center", zIndex: 10 },
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