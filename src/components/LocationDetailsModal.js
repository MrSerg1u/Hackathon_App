import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import {
  ActivityIndicator,
  Image,
  Linking, // Import necesar
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useTheme } from "../context/ThemeContext";

// --- CONFIGURARE GEMINI API ---

import { GEMINI_API_KEY } from '../keys';

// Import imaginea de WhatsApp
const WhatsAppIcon = require("../../assets/images/whatsapp.png");

// Initializare API AI Gemini
const API_KEY = GEMINI_API_KEY;
const MODEL_NAME = "gemini-2.5-flash-preview-09-2025";
const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL_NAME}:generateContent?key=${API_KEY}`;

export default function LocationDetailsModal({ visible, location, onClose }) {
  const { colors } = useTheme();

  const [aiModalVisible, setAiModalVisible] = useState(false);
  const [aiReviewText, setAiReviewText] = useState(null);
  const [isGeneratingAiReview, setIsGeneratingAiReview] = useState(false);
  const [hasRatedAiReview, setHasRatedAiReview] = useState(false);

  if (!location) return null;

  // --- FUNCȚIA REZERVARE WHATSAPP SIMPLIFICATĂ ---
  const handleWhatsAppReservation = () => {
    // Deschide doar aplicația WhatsApp (Main Screen)
    // "whatsapp://" este schema universală pentru a lansa aplicația
    Linking.openURL("whatsapp://").catch(() => {
      // Nu facem nimic dacă eșuează (fără alertă, conform cerinței)
      console.log("Nu s-a putut deschide WhatsApp");
    });
  };

  // --- LOGICA AI ---
  const generateAIReview = async () => {
    console.log("Generare AI Rezumat pornită...");
    if (isGeneratingAiReview) return;

    setAiModalVisible(true);
    setIsGeneratingAiReview(true);
    setAiReviewText(null);
    setHasRatedAiReview(false);

    const locationDetails = { ...location };
    delete locationDetails.image_url;

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

  const handleReportAIReview = () => {
    console.log("AI Review reported");
    setAiModalVisible(false);
  };

  return (
    <>
      {/* --- MODAL PRINCIPAL (DETALII) --- */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={visible}
        onRequestClose={onClose}
      >
        {/* Containerul principal */}
        <View style={styles.modalContainer}>
          {/* 1. BACKDROP */}
          <TouchableOpacity
            style={styles.backdrop}
            activeOpacity={1}
            onPress={onClose}
          />

          {/* 2. CONȚINUTUL */}
          <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
            {/* HEADER POZĂ + CLOSE */}
            <View>
              <Image
                source={{ uri: location.image_url }}
                style={styles.modalImage}
              />
              <TouchableOpacity style={styles.closeIconBtn} onPress={onClose}>
                <Ionicons name="close" size={24} color="#000" />
              </TouchableOpacity>
            </View>

            <View style={styles.modalBody}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>
                {location.name}
              </Text>

              {location.partener && (
                <Text
                  style={{
                    color: colors.primary,
                    fontWeight: "bold",
                    marginBottom: 10,
                  }}
                >
                  ⭐ LOCAȚIE PARTENER
                </Text>
              )}

              <View style={styles.rowCenter}>
                <Ionicons name="location" size={18} color={colors.primary} />
                <Text style={[styles.modalAddress, { color: colors.subtext }]}>
                  {location.address}
                </Text>
              </View>

              <Text
                style={{
                  color: colors.subtext,
                  fontStyle: "italic",
                  marginBottom: 5,
                }}
              >
                Tip: {location.type ? location.type.toUpperCase() : "N/A"}
              </Text>

              <Text style={[styles.modalDesc, { color: colors.text }]}>
                {location.short_description}
              </Text>

              <View style={styles.ratingContainer}>
                <Ionicons name="star" size={24} color="#D4AF37" />
                <Text style={[styles.ratingText, { color: colors.text }]}>
                  {location.rating}
                </Text>
              </View>

              {/* BUTOANE ACȚIUNE */}
              <View style={styles.modalActionButtons}>
                {/* Buton AI */}
                <TouchableOpacity
                  style={[
                    styles.aiReviewButton,
                    { borderColor: colors.primary },
                  ]}
                  onPress={generateAIReview}
                  activeOpacity={0.7}
                >
                  <Text
                    style={[styles.aiReviewTextBtn, { color: colors.primary }]}
                  >
                    ✨ AI Rezumat
                  </Text>
                </TouchableOpacity>

                {/* Buton WhatsApp */}
                <TouchableOpacity
                  style={styles.whatsappButton}
                  onPress={handleWhatsAppReservation} // Apelează funcția simplificată
                  activeOpacity={0.7}
                >
                  <Image
                    source={WhatsAppIcon}
                    style={styles.whatsappIcon}
                    resizeMode="contain"
                  />
                  <Text style={styles.whatsappText}>Rezervă</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>
      </Modal>

      {/* --- MODAL SECUNDAR (AI REZUMAT) --- */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={aiModalVisible}
        onRequestClose={() => setAiModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <TouchableOpacity
            style={styles.backdrop}
            activeOpacity={1}
            onPress={() => setAiModalVisible(false)}
          />

          <View
            style={[styles.aiModalContent, { backgroundColor: colors.card }]}
          >
            <TouchableOpacity
              style={styles.aiModalCloseIcon}
              onPress={() => setAiModalVisible(false)}
            >
              <Ionicons name="close" size={20} color={colors.text} />
            </TouchableOpacity>

            <Text style={[styles.aiModalTitle, { color: colors.primary }]}>
              AI Rezumat Locație
            </Text>

            {isGeneratingAiReview ? (
              <View style={styles.aiModalLoading}>
                <ActivityIndicator size="large" color={colors.primary} />
                <Text style={{ color: colors.subtext, marginTop: 10 }}>
                  Se generează...
                </Text>
              </View>
            ) : (
              aiReviewText && (
                <>
                  <Text style={[styles.aiReviewText, { color: colors.text }]}>
                    {aiReviewText}
                  </Text>

                  <View style={styles.aiModalFooter}>
                    {hasRatedAiReview ? (
                      <Text
                        style={{ color: colors.subtext, fontStyle: "italic" }}
                      >
                        Mulțumim pentru feedback!
                      </Text>
                    ) : (
                      <>
                        <Text style={{ color: colors.text, marginRight: 10 }}>
                          Te-a ajutat?
                        </Text>
                        <TouchableOpacity
                          onPress={() => handleRateAIReview("happy")}
                          style={{ marginRight: 10 }}
                        >
                          <Ionicons
                            name="happy-outline"
                            size={30}
                            color={colors.primary}
                          />
                        </TouchableOpacity>
                        <TouchableOpacity
                          onPress={() => handleRateAIReview("meh")}
                        >
                          <Ionicons
                            name="sad-outline"
                            size={30}
                            color={colors.primary}
                          />
                        </TouchableOpacity>
                      </>
                    )}
                  </View>

                  <TouchableOpacity
                    onPress={handleReportAIReview}
                    style={styles.reportButton}
                  >
                    <Ionicons
                      name="flag-outline"
                      size={16}
                      color={colors.subtext}
                    />
                    <Text
                      style={[
                        styles.reportButtonText,
                        { color: colors.subtext },
                      ]}
                    >
                      Raportează Inexactitatea
                    </Text>
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
  modalContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.6)",
    zIndex: 1,
  },
  modalContent: {
    width: "90%",
    borderRadius: 20,
    overflow: "hidden",
    paddingBottom: 20,
    elevation: 10,
    zIndex: 2,
  },
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
    zIndex: 10,
  },
  modalBody: { padding: 20 },
  modalTitle: { fontSize: 24, fontWeight: "bold", marginBottom: 5 },
  modalAddress: { fontSize: 14, marginLeft: 5 },
  modalDesc: { fontSize: 16, marginTop: 10, lineHeight: 22 },
  rowCenter: { flexDirection: "row", alignItems: "center", marginBottom: 10 },
  ratingContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 10,
    marginBottom: 20,
  },
  ratingText: { fontSize: 20, fontWeight: "bold", marginLeft: 5 },

  modalActionButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 10,
  },
  aiReviewButton: {
    flex: 1,
    marginRight: 10,
    paddingVertical: 12,
    borderRadius: 30,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
  },
  aiReviewTextBtn: { fontSize: 16, fontWeight: "bold" },
  whatsappButton: {
    flexDirection: "row",
    backgroundColor: "#25D366",
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 30,
    justifyContent: "center",
    alignItems: "center",
    elevation: 3,
  },
  whatsappIcon: { width: 24, height: 24, marginRight: 10 },
  whatsappText: { color: "#fff", fontSize: 18, fontWeight: "bold" },

  // AI Modal Styles
  aiModalContent: {
    width: "90%",
    borderRadius: 15,
    padding: 20,
    elevation: 12,
    minHeight: 250,
    zIndex: 2,
  },
  aiModalCloseIcon: {
    position: "absolute",
    top: 10,
    right: 10,
    padding: 5,
    zIndex: 10,
  },
  aiModalTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 15,
    textAlign: "center",
  },
  aiModalLoading: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    minHeight: 100,
  },
  aiReviewText: { fontSize: 15, lineHeight: 22, marginBottom: 20 },
  aiModalFooter: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: "#ccc",
  },
  reportButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 10,
    padding: 5,
  },
  reportButtonText: {
    marginLeft: 5,
    fontSize: 12,
  },
});
