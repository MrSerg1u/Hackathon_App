import { Ionicons } from "@expo/vector-icons";
import { useEffect, useState, useRef } from "react";
import {
    FlatList,
    Image,
    Modal,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    TouchableWithoutFeedback, // Import necesar pentru a preveni închiderea accidentală
    View,
    ActivityIndicator, // Adăugat pentru loading wheel
} from "react-native";
import { useTheme } from "../context/ThemeContext";

// Importăm datele
import locationsData from "../../locatii.json";

// Import imaginea de WhatsApp
const WhatsAppIcon = require("../../assets/images/whatsapp.png");

// --- CONFIGURARE GEMINI API (CONFORM CERINȚEI) ---
const API_KEY = "AIzaSyB5ElionuS9ixO40Evrc6hLH2g4PYRfrKE"; // Lăsat gol, va fi furnizat de Canvas
const MODEL_NAME = "gemini-2.5-flash-preview-09-2025";
const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL_NAME}:generateContent?key=${API_KEY}`;

// --- CONSTANTE PENTRU FILTRE (Păstrate) ---
const TYPE_OPTIONS = [
    { label: "Restaurant", value: "restaurant" },
    { label: "Bar", value: "bar" },
    { label: "Fast Food", value: "fast food" },
    { label: "Coffee", value: "coffee" },
    { label: "Altele", value: "altele" },
];

const RATING_OPTIONS = [
    { label: "Excelent (4.0 - 5.0 ⭐)", min: 4.0, max: 5.0 },
    { label: "Foarte Bun (3.0 - 3.9 ⭐)", min: 3.0, max: 3.99 },
    { label: "Bun (2.0 - 2.9 ⭐)", min: 2.0, max: 2.99 },
    { label: "Slăbuț (1.0 - 1.9 ⭐)", min: 1.0, max: 1.99 },
    { label: "Nerecomandat (0 - 0.9 ⭐)", min: 0, max: 0.99 },
];

export default function SearchScreen() {
    const { colors } = useTheme();

    // --- STATE-URI ---
    const [searchText, setSearchText] = useState("");
    const [filteredData, setFilteredData] = useState(locationsData);

    // State FILTRE (Păstrate)
    const [selectedTypes, setSelectedTypes] = useState([]);
    const [showTypeDropdown, setShowTypeDropdown] = useState(false);
    const [selectedRating, setSelectedRating] = useState(null);
    const [showRatingDropdown, setShowRatingDropdown] = useState(false);
    const [filterPartner, setFilterPartner] = useState(false);
    const [sortBy, setSortBy] = useState("default");

    // State Modal Principal
    const [modalVisible, setModalVisible] = useState(false);
    const [selectedLocation, setSelectedLocation] = useState(null);

    // State MODAL AI REZUMAT (NOU)
    const [aiModalVisible, setAiModalVisible] = useState(false);
    const [aiReviewText, setAiReviewText] = useState(null);
    const [isGeneratingAiReview, setIsGeneratingAiReview] = useState(false);
    const [hasRatedAiReview, setHasRatedAiReview] = useState(false); // Pentru butoanele de rating

    // --- LOGICA DE FILTRARE (Păstrată) ---
    useEffect(() => {
        let data = locationsData;

        if (searchText) {
            data = data.filter((item) =>
                item.name.toLowerCase().includes(searchText.toLowerCase())
            );
        }

        if (selectedTypes.length > 0) {
            data = data.filter((item) => selectedTypes.includes(item.type));
        }

        if (selectedRating) {
            data = data.filter(
                (item) =>
                    item.rating >= selectedRating.min && item.rating <= selectedRating.max
            );
        }

        if (filterPartner) {
            data = data.filter((item) => item.partener === true);
        }

        if (sortBy === "rating") {
            data = [...data].sort((a, b) => b.rating - a.rating);
        } else if (sortBy === "name") {
            data = [...data].sort((a, b) => a.name.localeCompare(b.name));
        }

        setFilteredData(data);
    }, [searchText, selectedTypes, selectedRating, filterPartner, sortBy]);

    // --- HANDLERS ---
    const toggleTypeSelection = (value) => {
        if (selectedTypes.includes(value)) {
            setSelectedTypes(selectedTypes.filter((t) => t !== value));
        } else {
            setSelectedTypes([...selectedTypes, value]);
        }
    };

    const selectRatingOption = (option) => {
        if (selectedRating && selectedRating.min === option.min) {
            setSelectedRating(null);
        } else {
            setSelectedRating(option);
        }
        setShowRatingDropdown(false);
    };

    const openModal = (location) => {
        setSelectedLocation(location);
        setModalVisible(true);
        // Resetăm starea rezumatului AI la deschiderea modalei
        setAiReviewText(null);
        setHasRatedAiReview(false); 
    };

    // --- LOGICA GENERARE REZUMAT AI (NOU) ---
    const generateAIReview = async (location) => {
        if (isGeneratingAiReview) return;

        setAiModalVisible(true);
        setIsGeneratingAiReview(true);
        setAiReviewText(null);
        setHasRatedAiReview(false);

        // Curățăm datele pentru prompt (excluzând URL-ul)
        const locationDetails = { ...location };
        delete locationDetails.image_url;

        const systemPrompt = `Ești un expert în recomandări locale și ai sarcina de a genera un scurt și convingător rezumat AI pentru localul furnizat. 
        Rezumatul trebuie să fie format dintr-un paragraf scurt care să capteze esența, atmosfera și de ce este special localul. 
        La final, adaugă O SINGURĂ FRAZĂ de tipul "Perfect pentru..." sau "Îți va plăcea dacă...". 
        Răspunde DOAR cu textul rezumatului, fără alte introduceri.`;

        const userQuery = `Generează un rezumat AI pentru acest local: ${JSON.stringify(locationDetails)}`;

        const payload = {
            contents: [{ parts: [{ text: userQuery }] }],
            systemInstruction: {
                parts: [{ text: systemPrompt }]
            },
        };

        let generatedText = "Eroare la generarea rezumatului AI. Te rugăm să încerci din nou.";

        // Apel API cu Backoff Exponențial
        const maxRetries = 3;
        const baseDelay = 1000;

        for (let attempt = 0; attempt < maxRetries; attempt++) {
            try {
                const response = await fetch(API_URL, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                });

                if (!response.ok) {
                    throw new Error(`API error: ${response.status}`);
                }

                const result = await response.json();
                const text = result.candidates?.[0]?.content?.parts?.[0]?.text;

                if (text) {
                    generatedText = text;
                    break; 
                }
            } catch (error) {
                console.error(`Attempt ${attempt + 1} failed during AI review generation:`, error);
                if (attempt < maxRetries - 1) {
                    const delay = baseDelay * Math.pow(2, attempt) + Math.random() * 500;
                    await new Promise(resolve => setTimeout(resolve, delay));
                }
            }
        }

        setAiReviewText(generatedText);
        setIsGeneratingAiReview(false);
    };

    const handleRateAIReview = (rating) => {
        console.log(`AI Review for ${selectedLocation.name} rated: ${rating}`);
        setHasRatedAiReview(true);
        // Aici s-ar trimite feedback-ul către un server
    };

    const handleReportAIReview = () => {
        console.log(`AI Review for ${selectedLocation.name} reported as incorrect/inappropriate.`);
        // Aici s-ar deschide un alt modal/formular pentru raportare
        setAiModalVisible(false);
        // Opțional: arată un mesaj de succes
    };

    const renderItem = ({ item }) => (
        <TouchableOpacity
            style={[
                styles.card,
                { backgroundColor: colors.card, borderColor: colors.border },
            ]}
            onPress={() => openModal(item)}
            activeOpacity={0.8}
        >
            <Image source={{ uri: item.image_url }} style={styles.cardImage} />

            <View style={styles.cardInfo}>
                <View style={styles.cardHeaderRow}>
                    <Text
                        style={[styles.cardTitle, { color: colors.text, flex: 1 }]}
                        numberOfLines={1}
                    >
                        {item.name}
                    </Text>
                    {item.partener && (
                        <View style={styles.partnerBadge}>
                            <Text style={styles.partnerText}>PARTENER</Text>
                        </View>
                    )}
                </View>

                <Text
                    style={[styles.cardDescription, { color: colors.subtext }]}
                    numberOfLines={2}
                >
                    {item.short_description}
                </Text>

                <View style={styles.cardFooterRow}>
                    <View style={styles.ratingContainer}>
                        <Ionicons name="star" size={14} color={colors.primary} />
                        <Text style={[styles.ratingText, { color: colors.text }]}>
                            {item.rating} / 5
                        </Text>
                    </View>
                    <Text style={[styles.typeLabel, { color: colors.subtext }]}>
                        {item.type.toUpperCase()}
                    </Text>
                </View>
            </View>
        </TouchableOpacity>
    );

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            <Text style={[styles.headerTitle, { color: colors.text }]}>Search</Text>

            {/* SEARCH INPUT */}
            <View
                style={[
                    styles.searchContainer,
                    {
                        backgroundColor: colors.inputBackground,
                        borderColor: colors.border,
                    },
                ]}
            >
                <Ionicons
                    name="search"
                    size={20}
                    color={colors.subtext}
                    style={{ marginRight: 10 }}
                />
                <TextInput
                    style={{ flex: 1, color: colors.text, fontSize: 16 }}
                    placeholder="Caută locații..."
                    placeholderTextColor={colors.subtext}
                    value={searchText}
                    onChangeText={setSearchText}
                />
                {searchText.length > 0 && (
                    <TouchableOpacity onPress={() => setSearchText("")}>
                        <Ionicons name="close-circle" size={20} color={colors.subtext} />
                    </TouchableOpacity>
                )}
            </View>

            {/* FILTRE DROPDOWN */}
            {/* ... (Secțiunea Filtre RATING și TIP) ... */}
            <View style={[styles.filtersRow, { zIndex: 2000 }]}>
                <View style={{ flex: 1, marginRight: 10 }}>
                    <TouchableOpacity
                        style={[
                            styles.dropdownButton,
                            { borderColor: colors.border, backgroundColor: colors.card },
                        ]}
                        onPress={() => {
                            setShowRatingDropdown(!showRatingDropdown);
                            setShowTypeDropdown(false);
                        }}
                    >
                        <Text style={{ color: colors.text, fontWeight: "600" }}>
                            {selectedRating ? `Rating: ${selectedRating.min}+` : "Rating ▾"}
                        </Text>
                    </TouchableOpacity>

                    {showRatingDropdown && (
                        <View
                            style={[
                                styles.dropdownMenu,
                                { backgroundColor: colors.card, borderColor: colors.border },
                            ]}
                        >
                            <TouchableOpacity
                                style={{ padding: 10 }}
                                onPress={() => {
                                    setSelectedRating(null);
                                    setShowRatingDropdown(false);
                                }}
                            >
                                <Text style={{ color: colors.primary, fontWeight: "bold" }}>
                                    Arată Toate
                                </Text>
                            </TouchableOpacity>
                            {RATING_OPTIONS.map((opt, index) => (
                                <TouchableOpacity
                                    key={index}
                                    style={[
                                        styles.dropdownItem,
                                        selectedRating?.min === opt.min && {
                                            backgroundColor: colors.primary + "20",
                                        },
                                    ]}
                                    onPress={() => selectRatingOption(opt)}
                                >
                                    <Text style={{ color: colors.text }}>{opt.label}</Text>
                                    {selectedRating?.min === opt.min && (
                                        <Ionicons
                                            name="checkmark"
                                            size={16}
                                            color={colors.primary}
                                        />
                                    )}
                                </TouchableOpacity>
                            ))}
                        </View>
                    )}
                </View>

                <View style={{ flex: 1 }}>
                    <TouchableOpacity
                        style={[
                            styles.dropdownButton,
                            { borderColor: colors.border, backgroundColor: colors.card },
                        ]}
                        onPress={() => {
                            setShowTypeDropdown(!showTypeDropdown);
                            setShowRatingDropdown(false);
                        }}
                    >
                        <Text style={{ color: colors.text, fontWeight: "600" }}>
                            {selectedTypes.length > 0
                                ? `Tipuri (${selectedTypes.length}) ▾`
                                : "Tip Locație ▾"}
                        </Text>
                    </TouchableOpacity>

                    {showTypeDropdown && (
                        <View
                            style={[
                                styles.dropdownMenu,
                                { backgroundColor: colors.card, borderColor: colors.border },
                            ]}
                        >
                            <TouchableOpacity
                                style={{ padding: 10 }}
                                onPress={() => {
                                    setSelectedTypes([]);
                                    setShowTypeDropdown(false);
                                }}
                            >
                                <Text style={{ color: colors.primary, fontWeight: "bold" }}>
                                    Resetează Filtrul
                                </Text>
                            </TouchableOpacity>
                            {TYPE_OPTIONS.map((opt, index) => {
                                const isSelected = selectedTypes.includes(opt.value);
                                return (
                                    <TouchableOpacity
                                        key={index}
                                        style={[
                                            styles.dropdownItem,
                                            isSelected && { backgroundColor: colors.primary },
                                        ]}
                                        onPress={() => toggleTypeSelection(opt.value)}
                                    >
                                        <Text
                                            style={{
                                                color: isSelected ? "#fff" : colors.text,
                                                fontWeight: isSelected ? "bold" : "normal",
                                            }}
                                        >
                                            {opt.label}
                                        </Text>
                                        {isSelected && (
                                            <Ionicons name="checkmark" size={16} color="#fff" />
                                        )}
                                    </TouchableOpacity>
                                );
                            })}
                        </View>
                    )}
                </View>
            </View>

            {/* LISTA + RESTUL FILTRELOR */}
            <View style={{ flex: 1, zIndex: 1 }}>
                <TouchableOpacity
                    style={styles.checkboxContainer}
                    onPress={() => setFilterPartner(!filterPartner)}
                    activeOpacity={0.7}
                >
                    <Ionicons
                        name={filterPartner ? "checkbox" : "square-outline"}
                        size={24}
                        color={filterPartner ? colors.primary : colors.subtext}
                    />
                    <Text style={[styles.checkboxText, { color: colors.text }]}>
                        Doar Locații Partener ⭐
                    </Text>
                </TouchableOpacity>

                <View style={[styles.sortContainer, { marginBottom: 15 }]}>
                    <Text
                        style={{ color: colors.subtext, marginRight: 10, fontSize: 12 }}
                    >
                        Sort:
                    </Text>
                    <TouchableOpacity
                        onPress={() =>
                            setSortBy(sortBy === "rating" ? "default" : "rating")
                        }
                    >
                        <Text
                            style={{
                                color: sortBy === "rating" ? colors.primary : colors.text,
                                fontWeight: "bold",
                                marginRight: 15,
                            }}
                        >
                            Rating {sortBy === "rating" ? "▼" : ""}
                        </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        onPress={() => setSortBy(sortBy === "name" ? "default" : "name")}
                    >
                        <Text
                            style={{
                                color: sortBy === "name" ? colors.primary : colors.text,
                                fontWeight: "bold",
                            }}
                        >
                            Nume {sortBy === "name" ? "▼" : ""}
                        </Text>
                    </TouchableOpacity>
                </View>

                <Text style={[styles.resultsText, { color: colors.subtext }]}>
                    Rezultate: {filteredData.length}
                </Text>

                <FlatList
                    data={filteredData}
                    keyExtractor={(item, index) => index.toString()}
                    renderItem={renderItem}
                    contentContainerStyle={{ paddingBottom: 100 }}
                    showsVerticalScrollIndicator={false}
                    ListEmptyComponent={
                        <Text
                            style={{
                                textAlign: "center",
                                marginTop: 40,
                                color: colors.subtext,
                                fontSize: 16,
                            }}
                        >
                            Nicio locație nu corespunde filtrelor.
                        </Text>
                    }
                />
            </View>

            {/* --- MODAL DETALII (Vizibil la click pe Card) --- */}
            <Modal
                animationType="fade"
                transparent={true}
                visible={modalVisible}
                onRequestClose={() => setModalVisible(false)}
            >
                <TouchableOpacity
                    style={styles.modalOverlay}
                    activeOpacity={1}
                    onPress={() => setModalVisible(false)}
                >
                    <TouchableWithoutFeedback>
                        <View
                            style={[styles.modalContent, { backgroundColor: colors.card }]}
                        >
                            {selectedLocation && (
                                <>
                                    {/* IMAGINEA HEADER */}
                                    <View>
                                        <Image
                                            source={{ uri: selectedLocation.image_url }}
                                            style={styles.modalImage}
                                        />

                                        {/* Butonul Rotund "X" pentru închidere (Dreapta Sus) */}
                                        <TouchableOpacity
                                            style={styles.closeIconBtn}
                                            onPress={() => setModalVisible(false)}
                                        >
                                            <Ionicons name="close" size={24} color="#000" />
                                        </TouchableOpacity>
                                    </View>

                                    <View style={styles.modalBody}>
                                        <Text style={[styles.modalTitle, { color: colors.text }]}>
                                            {selectedLocation.name}
                                        </Text>

                                        {selectedLocation.partener && (
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

                                        <View
                                            style={{
                                                flexDirection: "row",
                                                alignItems: "center",
                                                marginBottom: 10,
                                            }}
                                        >
                                            <Ionicons
                                                name="location"
                                                size={18}
                                                color={colors.primary}
                                            />
                                            <Text
                                                style={[styles.modalAddress, { color: colors.subtext }]}
                                            >
                                                {selectedLocation.address}
                                            </Text>
                                        </View>

                                        <Text
                                            style={{
                                                color: colors.subtext,
                                                fontStyle: "italic",
                                                marginBottom: 5,
                                            }}
                                        >
                                            Tip: {selectedLocation.type.toUpperCase()}
                                        </Text>

                                        <Text style={[styles.modalDesc, { color: colors.text }]}>
                                            {selectedLocation.short_description}
                                        </Text>

                                        <View
                                            style={[
                                                styles.ratingContainer,
                                                { marginTop: 10, marginBottom: 20 },
                                            ]}
                                        >
                                            <Ionicons name="star" size={24} color="#FFD700" />
                                            <Text
                                                style={{
                                                    fontSize: 20,
                                                    fontWeight: "bold",
                                                    marginLeft: 5,
                                                    color: colors.text,
                                                }}
                                            >
                                                {selectedLocation.rating}
                                            </Text>
                                        </View>

                                        {/* Butoane acțiune modală */}
                                        <View style={styles.modalActionButtons}>
                                            {/* Buton AI Rezumat (NOU) */}
                                            <TouchableOpacity
                                                style={[styles.aiReviewButton, { backgroundColor: colors.background, borderColor: colors.primary }]}
                                                onPress={() => generateAIReview(selectedLocation)}
                                            >
                                                <Text style={[styles.aiReviewTextBtn, { color: colors.primary }]}>AI Rezumat</Text>
                                            </TouchableOpacity>
                                            
                                            {/* Butonul "Rezervă" cu WhatsApp */}
                                            <TouchableOpacity
                                                style={styles.whatsappButton}
                                                onPress={() => {
                                                    // Aici poți adăuga logica de deschidere WhatsApp (Linking.openURL)
                                                    console.log("Rezervare la " + selectedLocation.name);
                                                }}
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
                                </>
                            )}
                        </View>
                    </TouchableWithoutFeedback>
                </TouchableOpacity>
            </Modal>

            {/* --- MODAL AI REZUMAT (Vizibil la click pe AI Rezumat) --- */}
            <Modal
                animationType="fade"
                transparent={true}
                visible={aiModalVisible}
                onRequestClose={() => setAiModalVisible(false)}
            >
                 <TouchableOpacity
                    style={styles.modalOverlay}
                    activeOpacity={1}
                    onPress={() => setAiModalVisible(false)}
                >
                    <TouchableWithoutFeedback>
                        <View style={[styles.aiModalContent, { backgroundColor: colors.card }]}>
                            {/* Buton X de închidere */}
                            <TouchableOpacity
                                style={styles.aiModalCloseIcon}
                                onPress={() => setAiModalVisible(false)}
                            >
                                <Ionicons name="close" size={20} color={colors.text} />
                            </TouchableOpacity>

                            <Text style={[styles.aiModalTitle, { color: colors.primary }]}>AI Rezumat Locație</Text>
                            
                            {isGeneratingAiReview ? (
                                <View style={styles.aiModalLoading}>
                                    <ActivityIndicator size="large" color={colors.primary} />
                                    <Text style={{ color: colors.subtext, marginTop: 10 }}>Generare rezumat...</Text>
                                </View>
                            ) : (
                                aiReviewText && (
                                    <>
                                        {/* Textul Rezumatului */}
                                        <Text style={[styles.aiModalReviewText, { color: colors.text }]}>
                                            {aiReviewText}
                                        </Text>

                                        {/* Butoane de Feedback */}
                                        <View style={styles.aiModalFooter}>
                                            {hasRatedAiReview ? (
                                                <Text style={{ color: colors.subtext, fontStyle: 'italic' }}>Mulțumim pentru feedback!</Text>
                                            ) : (
                                                <>
                                                    <Text style={{ color: colors.text, marginRight: 10 }}>Te-a ajutat?</Text>
                                                    <TouchableOpacity onPress={() => handleRateAIReview('happy')} disabled={hasRatedAiReview}>
                                                        <Ionicons name="happy-outline" size={30} color={colors.primary} style={{ marginRight: 10 }} />
                                                    </TouchableOpacity>
                                                    <TouchableOpacity onPress={() => handleRateAIReview('meh')} disabled={hasRatedAiReview}>
                                                        <Ionicons name="sad-outline" size={30} color={colors.primary} />
                                                    </TouchableOpacity>
                                                </>
                                            )}
                                        </View>

                                        {/* Buton Raportare */}
                                        <TouchableOpacity onPress={handleReportAIReview} style={styles.reportButton}>
                                            <Ionicons name="flag-outline" size={16} color={colors.subtext} />
                                            <Text style={[styles.reportButtonText, { color: colors.subtext }]}>Raportează Inexactitatea</Text>
                                        </TouchableOpacity>
                                    </>
                                )
                            )}
                        </View>
                    </TouchableWithoutFeedback>
                </TouchableOpacity>
            </Modal>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, paddingHorizontal: 16, paddingTop: 50 },
    headerTitle: {
        fontSize: 22,
        fontWeight: "bold",
        textAlign: "center",
        marginBottom: 20,
    },
    searchContainer: {
        flexDirection: "row",
        alignItems: "center",
        borderWidth: 1,
        borderRadius: 12,
        paddingHorizontal: 15,
        height: 50,
        marginBottom: 15,
    },

    filtersRow: {
        flexDirection: "row",
        marginBottom: 10,
    },
    dropdownButton: {
        borderWidth: 1,
        padding: 10,
        borderRadius: 8,
        alignItems: "center",
        justifyContent: "center",
        height: 45,
    },
    dropdownMenu: {
        position: "absolute",
        top: 50,
        left: 0,
        right: 0,
        borderWidth: 1,
        borderRadius: 8,
        zIndex: 9999,
        elevation: 5,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
        paddingVertical: 5,
    },
    dropdownItem: {
        padding: 10,
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        borderBottomWidth: 0.5,
        borderBottomColor: "#ccc",
    },

    checkboxContainer: {
        flexDirection: "row",
        alignItems: "center",
        marginBottom: 10,
        marginTop: 5,
    },
    checkboxText: {
        marginLeft: 8,
        fontSize: 14,
        fontWeight: "600",
    },

    sortContainer: { flexDirection: "row", alignItems: "center" },
    resultsText: { fontSize: 14, marginBottom: 10 },

    card: {
        flexDirection: "row",
        borderRadius: 16,
        borderWidth: 1,
        marginBottom: 15,
        overflow: "hidden",
        height: 110,
        elevation: 3,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
    },
    cardImage: { width: 100, height: "100%", resizeMode: "cover" },
    cardInfo: { flex: 1, padding: 10, justifyContent: "space-between" },
    cardHeaderRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "flex-start",
    },
    cardTitle: { fontSize: 15, fontWeight: "bold", marginRight: 5 },

    partnerBadge: {
        borderWidth: 1,
        borderColor: "#D4AF37",
        backgroundColor: "transparent",
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 4,
    },
    partnerText: {
        fontSize: 8,
        color: "#D4AF37",
        fontWeight: "bold",
    },

    cardDescription: { fontSize: 11, marginTop: 2 },
    cardFooterRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginTop: 5,
    },
    ratingContainer: { flexDirection: "row", alignItems: "center" },
    ratingText: { fontSize: 12, fontWeight: "bold", marginLeft: 4 },
    typeLabel: { fontSize: 10, fontWeight: "bold", opacity: 0.8 },

    // --- MODAL STYLES UPDATED ---
    modalOverlay: {
        flex: 1,
        backgroundColor: "rgba(0,0,0,0.6)", 
        justifyContent: "center",
        alignItems: "center",
        padding: 20,
    },
    modalContent: {
        width: "100%",
        borderRadius: 20,
        overflow: "hidden", 
        paddingBottom: 20,
        elevation: 10,
    },
    modalImage: {
        width: "100%",
        height: 200,
        resizeMode: "cover",
    },
    modalBody: {
        padding: 20,
    },
    modalTitle: { fontSize: 24, fontWeight: "bold", marginBottom: 5 },
    modalAddress: { fontSize: 14, marginLeft: 5 },
    modalDesc: { fontSize: 16, marginTop: 10, lineHeight: 22 },

    // STIL BUTON "X" (CLOSE)
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
        elevation: 5,
        zIndex: 10,
    },

    // STIL BUTOANE ACȚIUNE MODALĂ
    modalActionButtons: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: 15,
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
    aiReviewTextBtn: {
        fontSize: 16,
        fontWeight: "bold",
    },
    
    // STIL BUTON WHATSAPP (REZERVA)
    whatsappButton: {
        flexDirection: "row",
        backgroundColor: "#25D366",
        paddingVertical: 12,
        paddingHorizontal: 20,
        borderRadius: 30,
        justifyContent: "center",
        alignItems: "center",
        elevation: 3,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 3,
    },
    whatsappIcon: {
        width: 24,
        height: 24,
        marginRight: 10,
    },
    whatsappText: {
        color: "#fff",
        fontSize: 18,
        fontWeight: "bold",
    },

    // --- AI REVIEW MODAL STYLES (NOU) ---
    aiModalContent: {
        width: "90%",
        borderRadius: 15,
        padding: 20,
        elevation: 12,
        minHeight: 250,
        justifyContent: 'space-between',
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
        textAlign: 'center',
    },
    aiModalLoading: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: 150,
    },
    aiModalReviewText: {
        fontSize: 15,
        lineHeight: 22,
        marginBottom: 20,
    },
    aiModalFooter: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 10,
        borderTopWidth: 1,
        borderTopColor: '#333',
    },
    reportButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 15,
        padding: 5,
    },
    reportButtonText: {
        marginLeft: 5,
        fontSize: 12,
    }
});