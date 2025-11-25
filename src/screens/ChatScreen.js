import React, { useState, useRef, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    TextInput,
    TouchableOpacity,
    ActivityIndicator,
    SafeAreaView,
    KeyboardAvoidingView,
    Platform,
    Modal, // Adăugat explicit
    Image, // Adăugat explicit
} from 'react-native';
// Asumăm că locatii.json este accesibil și are aceeași structură ca în HomeScreen
import locatiiRaw from '../../locatii.json';

// --- CONFIGURARE CULORI (Preluate din HomeScreen.js) ---
const CUSTOM_COLORS = {
    BACKGROUND: '#121212', 
    CARD: '#1E1E1E',
    TEXT_PRIMARY: '#FFFFFF',
    TEXT_SECONDARY: '#AAAAAA',
    ACCENT_GOLD: '#D4AF37', // Auriu pentru elemente de accent
    BOT_BUBBLE: '#333333',
    USER_BUBBLE: '#D4AF37',
    INPUT_BACKGROUND: '#242424',
    OVERLAY: 'rgba(0, 0, 0, 0.8)',
};

// --- PRE-PROCESAREA DATELOR: Adăugăm un ID unic fiecărui local ---
const locatii = locatiiRaw.map((p, index) => ({
    ...p,
    id: index.toString(), // Folosim indexul ca ID unic (string)
}));

// --- CONFIGURARE GEMINI API ---
const API_KEY = "AIzaSyB5ElionuS9ixO40Evrc6hLH2g4PYRfrKE"; // Lăsat gol, va fi furnizat de Canvas
const MODEL_NAME = "gemini-2.5-flash-preview-09-2025";
const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL_NAME}:generateContent?key=${API_KEY}`;

// Schema JSON solicitată pentru răspunsul AI-ului
const RESPONSE_SCHEMA = {
    type: "OBJECT",
    properties: {
        text: { 
            type: "STRING", 
            description: "Răspunsul conversațional al asistentului (scurt și concis)." 
        },
        mentionedPlacesIds: {
            type: "ARRAY",
            description: "Lista de ID-uri (string) ale localurilor recomandate sau menționate.",
            items: { type: "STRING" }
        }
    },
    propertyOrdering: ["text", "mentionedPlacesIds"]
};

// Construiește instrucțiunea de sistem care include lista de localuri
const buildSystemInstruction = () => {
    // Includem toate câmpurile esențiale și ID-ul
    const detailedLocatii = locatii.map(p => ({
        id: p.id, // ID-ul esențial pentru referință
        name: p.name,
        type: p.type,
        partener: p.partener,
        address: p.address,
        short_description: p.short_description,
        rating: p.rating,
    }));

    return `Ești un asistent AI prietenos și profesionist. Rolul tău este să ajuți clientul să găsească localul perfect în funcție de preferințele sale (tip, rating, atmosferă, parteneriat). 
    Oferă recomandări și asistență generală bazându-te EXCLUSIV pe lista de localuri de mai jos. 
    Răspunsurile tale trebuie să fie foarte scurte, concise și directe. NU include detalii despre local în corpul textului.
    Odată ce ai decis ce localuri recomanzi, include ID-urile lor în lista 'mentionedPlacesIds' a răspunsului JSON. Dacă nu faci nicio recomandare, lasă lista goală.

    Lista de localuri (cu ID-uri):
    ${JSON.stringify(detailedLocatii, null, 2)}`;
};

// --- HELPER FUNCTIONS ---

const findPlaceById = (id) => {
    return locatii.find(p => p.id === id);
};

// --- COMPONENTA PRINCIPALĂ CHATSCREEN ---

export default function ChatScreen() {
    // Formatul mesajului: { id: number, text: string, role: 'user' | 'model', mentionedPlacesIds?: string[] }
    const [messages, setMessages] = useState([
        { id: 1, text: "Salut! Sunt asistentul tău AI. Cum te pot ajuta să găsești localul perfect?", role: 'model', mentionedPlacesIds: [] }
    ]);
    const [inputMessage, setInputMessage] = useState('');
    const [isThinking, setIsThinking] = useState(false);
    const [modalVisible, setModalVisible] = useState(false); // Starea modalului
    const [selectedLocation, setSelectedLocation] = useState(null); // Locația pentru detalii în modal
    
    const flatListRef = useRef(null);
    const systemInstruction = useRef(buildSystemInstruction()).current;
    
    const handleOpenModal = (location) => {
        setSelectedLocation(location);
        setModalVisible(true);
    };

    // Funcție pentru a trimite mesajul către AI
    const handleSendMessage = async () => {
        const text = inputMessage.trim();
        if (!text || isThinking) return;

        // 1. Adaugă mesajul utilizatorului în istoric
        const newUserMessage = { id: Date.now(), text: text, role: 'user' };
        setMessages(prev => [...prev, newUserMessage]);
        setInputMessage('');
        setIsThinking(true);

        // 2. Construiește payload-ul API (incluzând istoricul chat-ului)
        // Reconstruim istoricul pentru AI, ignorând mentionedPlacesIds (care sunt doar pentru UI)
        const chatHistory = messages.map(msg => ({
            role: msg.role === 'user' ? 'user' : 'model',
            parts: [{ text: msg.text }]
        }));

        const payload = {
            contents: chatHistory.concat([{ role: 'user', parts: [{ text: text }] }]),
            systemInstruction: {
                parts: [{ text: systemInstruction }]
            },
            generationConfig: {
                responseMimeType: "application/json",
                responseSchema: RESPONSE_SCHEMA
            }
        };

        let responseText = "Ne pare rău, a apărut o eroare la comunicarea cu AI-ul.";
        let mentionedIds = [];
        
        // --- LOGICA DE APEL API CU BACKOFF EXPONENȚIAL ---
        const maxRetries = 3;
        const baseDelay = 1000;
        let success = false;

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
                const jsonString = result.candidates?.[0]?.content?.parts?.[0]?.text;
                
                if (jsonString) {
                    try {
                        const parsedJson = JSON.parse(jsonString);
                        responseText = parsedJson.text || responseText;
                        mentionedIds = parsedJson.mentionedPlacesIds || [];
                        success = true;
                        break; 
                    } catch (parseError) {
                        // Dacă AI-ul nu a returnat JSON valid, tratăm răspunsul ca text simplu
                        console.error("AI returned invalid JSON:", jsonString, parseError);
                        responseText = jsonString;
                        success = true;
                        break;
                    }
                }
            } catch (error) {
                console.error(`Attempt ${attempt + 1} failed:`, error);
                if (attempt < maxRetries - 1) {
                    const delay = baseDelay * Math.pow(2, attempt) + Math.random() * 1000;
                    await new Promise(resolve => setTimeout(resolve, delay));
                }
            }
        }

        // 3. Adaugă răspunsul AI-ului în istoric (inclusiv ID-urile)
        const newBotMessage = { 
            id: Date.now() + 1, 
            text: responseText, 
            role: 'model', 
            mentionedPlacesIds: mentionedIds 
        };
        setMessages(prev => [...prev, newBotMessage]);
        setIsThinking(false);
    };

    // Auto-scroll la ultimul mesaj
    useEffect(() => {
        if (flatListRef.current) {
            flatListRef.current.scrollToEnd({ animated: true });
        }
    }, [messages]);
    
    // --- SUB-COMPONENTA CARD LOCAȚIE ---
    
    const PlaceCard = ({ place }) => (
        <TouchableOpacity 
            style={[styles.placeCard, { backgroundColor: CUSTOM_COLORS.CARD, borderColor: CUSTOM_COLORS.ACCENT_GOLD }]}
            onPress={() => handleOpenModal(place)}
        >
            <Image 
                source={{ uri: place.image_url || 'https://placehold.co/80x80/1E1E1E/D4AF37?text=LOC' }} 
                style={styles.placeCardImage}
            />
            <View style={styles.placeCardDetails}>
                <Text style={[styles.placeCardName, { color: CUSTOM_COLORS.TEXT_PRIMARY }]}>
                    {place.name}
                </Text>
                <Text style={[styles.placeCardType, { color: CUSTOM_COLORS.TEXT_SECONDARY }]}>
                    {place.type.toUpperCase()}
                </Text>
                <Text style={[styles.placeCardRating, { color: CUSTOM_COLORS.ACCENT_GOLD }]}>
                    ★ {place.rating}
                    {place.partener && <Text style={{ marginLeft: 5, fontWeight: 'normal' }}> (Partener)</Text>}
                </Text>
            </View>
        </TouchableOpacity>
    );

    // --- SUB-COMPONENTE PENTRU AFIȘARE MESAJ ---

    // Bula de chat a utilizatorului
    const UserMessage = ({ text }) => (
        <View style={styles.userMessageContainer}>
            <View style={[styles.messageBubble, styles.userBubble, { backgroundColor: CUSTOM_COLORS.USER_BUBBLE }]}>
                <Text style={styles.userText}>{text}</Text>
            </View>
            {/* Iconița utilizatorului pe dreapta (conform schiței) */}
            <View style={[styles.avatar, styles.userAvatar, { backgroundColor: CUSTOM_COLORS.TEXT_SECONDARY }]}>
                <Text style={styles.avatarText}>🧑</Text>
            </View>
        </View>
    );

    // Bula de chat a AI-ului (Bot)
    const BotMessage = ({ text, mentionedPlacesIds }) => {
        const recommendedPlaces = (mentionedPlacesIds || [])
            .map(id => findPlaceById(id))
            .filter(p => p); // Filtrează localurile găsite

        return (
            <View style={styles.botMessageBlock}>
                <View style={styles.botMessageContainer}>
                    {/* Iconița botului pe stânga */}
                    <View style={[styles.avatar, styles.botAvatar, { backgroundColor: CUSTOM_COLORS.BOT_BUBBLE }]}>
                        <Text style={styles.avatarText}>🤖</Text>
                    </View>
                    {/* Bula de chat */}
                    <View style={[styles.messageBubble, styles.botBubble, { backgroundColor: CUSTOM_COLORS.BOT_BUBBLE, borderColor: CUSTOM_COLORS.ACCENT_GOLD }]}>
                        <Text style={styles.botText}>{text}</Text>
                    </View>
                </View>
                
                {/* Afișează cardurile sub bula de chat (dacă există recomandări) */}
                {recommendedPlaces.length > 0 && (
                    <View style={styles.recommendedPlacesContainer}>
                        {recommendedPlaces.map(place => (
                            <PlaceCard key={place.id} place={place} />
                        ))}
                    </View>
                )}
            </View>
        );
    };

    const renderItem = ({ item }) => {
        if (item.role === 'user') {
            return <UserMessage text={item.text} />;
        }
        return <BotMessage text={item.text} mentionedPlacesIds={item.mentionedPlacesIds} />;
    };

    // --- RENDER COMPONENT ---

    return (
        <SafeAreaView style={[styles.safeArea, { backgroundColor: CUSTOM_COLORS.BACKGROUND }]}>
            <View style={styles.titleContainer}>
                <Text style={[styles.title, { color: CUSTOM_COLORS.TEXT_PRIMARY }]}>Asistent Local AI</Text>
                {isThinking && <ActivityIndicator size="small" color={CUSTOM_COLORS.ACCENT_GOLD} />}
            </View>
            
            <FlatList
                ref={flatListRef}
                data={messages}
                keyExtractor={(item) => item.id.toString()}
                renderItem={renderItem}
                contentContainerStyle={styles.chatListContent}
                onContentSizeChange={() => flatListRef.current.scrollToEnd({ animated: true })}
            />

            <KeyboardAvoidingView 
                behavior={Platform.OS === "ios" ? "padding" : "height"}
                keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 0} 
            >
                <View style={[styles.inputContainer, { borderTopColor: CUSTOM_COLORS.ACCENT_GOLD }]}>
                    <TextInput
                        style={[styles.input, { backgroundColor: CUSTOM_COLORS.INPUT_BACKGROUND, color: CUSTOM_COLORS.TEXT_PRIMARY }]}
                        value={inputMessage}
                        onChangeText={setInputMessage}
                        placeholder="Trimite un mesaj..."
                        placeholderTextColor={CUSTOM_COLORS.TEXT_SECONDARY}
                        editable={!isThinking}
                        multiline
                    />
                    <TouchableOpacity
                        style={[styles.sendButton, { backgroundColor: CUSTOM_COLORS.ACCENT_GOLD }]}
                        onPress={handleSendMessage}
                        disabled={isThinking || inputMessage.trim().length === 0}
                    >
                        {isThinking ? (
                            <ActivityIndicator size="small" color={CUSTOM_COLORS.BACKGROUND} />
                        ) : (
                            <Text style={styles.sendButtonText}>→</Text>
                        )}
                    </TouchableOpacity>
                </View>
            </KeyboardAvoidingView>

            {/* --- MODAL DETALII LOCAȚIE --- */}
            <Modal
                animationType="slide"
                transparent={true}
                visible={modalVisible}
                onRequestClose={() => setModalVisible(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={[styles.modalContent, { backgroundColor: CUSTOM_COLORS.CARD }]}>
                        {selectedLocation && (
                            <>
                                <Image
                                    source={{ uri: selectedLocation.image_url || 'https://placehold.co/300x150/1E1E1E/D4AF37?text=LOCATIE' }}
                                    style={styles.modalImage}
                                />
                                <View style={styles.modalBody}>
                                    <Text style={[styles.modalTitle, { color: CUSTOM_COLORS.TEXT_PRIMARY }]}>
                                        {selectedLocation.name}
                                    </Text>
                                    
                                    {/* Dacă e partener, arătăm */}
                                    {selectedLocation.partener && (
                                        <Text
                                            style={[styles.partnerBadge, { color: CUSTOM_COLORS.ACCENT_GOLD }]}
                                        >
                                            ⭐ LOCAȚIE PARTENER
                                        </Text>
                                    )}

                                    <View style={styles.modalDetailRow}>
                                        <Text style={[styles.modalIcon, { color: CUSTOM_COLORS.ACCENT_GOLD }]}>📍</Text>
                                        <Text style={[styles.modalAddress, { color: CUSTOM_COLORS.TEXT_SECONDARY }]}>
                                            {selectedLocation.address}
                                        </Text>
                                    </View>

                                    <Text
                                        style={[styles.modalType, { color: CUSTOM_COLORS.TEXT_SECONDARY }]}
                                    >
                                        Tip: {selectedLocation.type.toUpperCase()}
                                    </Text>

                                    <Text style={[styles.modalDesc, { color: CUSTOM_COLORS.TEXT_PRIMARY }]}>
                                        {selectedLocation.short_description}
                                    </Text>

                                    <View style={styles.ratingContainer}>
                                        <Text style={[styles.modalIcon, { color: CUSTOM_COLORS.ACCENT_GOLD }]}>★</Text>
                                        <Text
                                            style={[styles.modalRatingText, { color: CUSTOM_COLORS.TEXT_PRIMARY }]}
                                        >
                                            {selectedLocation.rating}
                                        </Text>
                                    </View>
                                </View>

                                <TouchableOpacity
                                    style={[
                                        styles.closeButton,
                                        { backgroundColor: CUSTOM_COLORS.ACCENT_GOLD },
                                    ]}
                                    onPress={() => setModalVisible(false)}
                                >
                                    <Text style={styles.closeButtonText}>Închide</Text>
                                </TouchableOpacity>
                            </>
                        )}
                    </View>
                </View>
            </Modal>
        </SafeAreaView>
    );
}

// --- STILURI ---

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
    },
    titleContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 15,
        borderBottomWidth: 1,
        borderBottomColor: '#222',
    },
    title: {
        fontSize: 18,
        fontWeight: 'bold',
        marginRight: 10,
    },
    chatListContent: {
        paddingVertical: 10,
        paddingHorizontal: 10,
    },
    // Bot message block container to align bubble and cards
    botMessageBlock: {
        marginBottom: 10,
    },

    // --- BUBBLE STYLES ---
    messageBubble: {
        maxWidth: '80%',
        padding: 12,
        borderRadius: 15,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.2,
        shadowRadius: 1,
        elevation: 2,
    },
    
    // BOT (Model)
    botMessageContainer: {
        flexDirection: 'row',
        justifyContent: 'flex-start',
        alignItems: 'flex-end',
    },
    botBubble: {
        marginLeft: 8,
        borderTopLeftRadius: 0,
        borderWidth: 1,
        borderColor: 'transparent',
    },
    botText: {
        color: CUSTOM_COLORS.TEXT_PRIMARY,
        fontSize: 15,
    },

    // USER (Utilizator)
    userMessageContainer: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        alignItems: 'flex-end',
        marginVertical: 5,
    },
    userBubble: {
        marginRight: 8,
        borderTopRightRadius: 0,
    },
    userText: {
        color: CUSTOM_COLORS.BACKGROUND, // Text negru pe fundal auriu
        fontSize: 15,
        fontWeight: '500',
    },

    // AVATAR
    avatar: {
        width: 30,
        height: 30,
        borderRadius: 15,
        justifyContent: 'center',
        alignItems: 'center',
        overflow: 'hidden',
    },
    avatarText: {
        fontSize: 16,
    },
    botAvatar: {
        alignSelf: 'flex-start',
        backgroundColor: CUSTOM_COLORS.BOT_BUBBLE, 
    },
    userAvatar: {
        alignSelf: 'flex-end',
        backgroundColor: CUSTOM_COLORS.USER_BUBBLE, 
    },

    // --- RECOMANDATION CARD STYLES ---
    recommendedPlacesContainer: {
        marginTop: 10,
        marginLeft: 40, // Aliniat sub bula de chat
        gap: 8, // Spațiu între carduri
    },
    placeCard: {
        flexDirection: 'row',
        padding: 10,
        borderRadius: 12,
        borderWidth: 1,
        maxWidth: '90%',
        shadowColor: CUSTOM_COLORS.ACCENT_GOLD,
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
        justifyContent: 'center',
    },
    placeCardName: {
        fontSize: 16,
        fontWeight: 'bold',
    },
    placeCardType: {
        fontSize: 12,
        color: CUSTOM_COLORS.TEXT_SECONDARY,
    },
    placeCardRating: {
        fontSize: 14,
        fontWeight: 'bold',
    },

    // --- INPUT STYLES ---
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
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
    },
    sendButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 3,
        elevation: 5,
    },
    sendButtonText: {
        color: CUSTOM_COLORS.BACKGROUND,
        fontSize: 20,
        lineHeight: 20,
    },

    // --- MODAL STYLES ---
    modalOverlay: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: CUSTOM_COLORS.OVERLAY,
    },
    modalContent: {
        width: '90%',
        borderRadius: 15,
        overflow: 'hidden',
        paddingBottom: 20,
    },
    modalImage: {
        width: '100%',
        height: 180,
        resizeMode: 'cover',
    },
    modalBody: {
        padding: 15,
    },
    modalTitle: {
        fontSize: 22,
        fontWeight: 'bold',
        marginBottom: 8,
    },
    partnerBadge: {
        color: CUSTOM_COLORS.ACCENT_GOLD,
        fontWeight: "bold",
        marginBottom: 10,
        fontSize: 14,
    },
    modalDetailRow: {
        flexDirection: "row",
        alignItems: "center",
        marginBottom: 10,
    },
    modalIcon: {
        fontSize: 18,
        marginRight: 5,
    },
    modalAddress: {
        fontSize: 14,
    },
    modalType: {
        fontStyle: "italic",
        marginBottom: 5,
        fontSize: 14,
    },
    modalDesc: {
        fontSize: 14,
        marginTop: 5,
    },
    ratingContainer: { 
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 10,
    },
    modalRatingText: {
        fontSize: 20,
        fontWeight: "bold",
        marginLeft: 5,
    },
    closeButton: {
        marginHorizontal: 15,
        padding: 15,
        borderRadius: 10,
        alignItems: 'center',
    },
    closeButtonText: {
        color: CUSTOM_COLORS.BACKGROUND,
        fontSize: 16,
        fontWeight: 'bold',
    },
});