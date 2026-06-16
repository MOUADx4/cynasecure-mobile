import React, { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Dimensions,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Image } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MessageCircle, X, ChevronLeft, Shield } from 'lucide-react-native';
import { contactApi, type ChatbotCategory } from '../../api/contact';
import { colors, radius } from '../../theme/colors';

function generateSessionId() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    return (c === 'x' ? r : (r & 0x3) | 0x8).toString(16);
  });
}

type Message = { sender: 'user' | 'bot'; content: string; escalate?: boolean };
type ChatView = 'questions' | 'chat';

const { height: SCREEN_H } = Dimensions.get('window');
const SHEET_H = Math.min(SCREEN_H * 0.72, 580);

export function ChatbotFAB() {
  const insets = useSafeAreaInsets();
  const [open, setOpen] = useState(false);
  const [view, setView] = useState<ChatView>('questions');
  const [categories, setCategories] = useState<ChatbotCategory[]>([]);
  const [activeTab, setActiveTab] = useState(0);
  const [messages, setMessages] = useState<Message[]>([
    { sender: 'bot', content: 'Bonjour ! Comment puis-je vous aider ?' },
  ]);
  const [loading, setLoading] = useState(false);
  const [loadingSugg, setLoadingSugg] = useState(false);

  const sessionId = useRef(generateSessionId());
  const scrollRef = useRef<ScrollView>(null);
  const slideAnim = useRef(new Animated.Value(SHEET_H)).current;
  const fabScale = useRef(new Animated.Value(1)).current;

  // Sheet open/close animation
  useEffect(() => {
    if (open) {
      Animated.spring(slideAnim, {
        toValue: 0,
        damping: 22,
        stiffness: 260,
        useNativeDriver: true,
      }).start();
    } else {
      Animated.timing(slideAnim, {
        toValue: SHEET_H,
        duration: 220,
        useNativeDriver: true,
      }).start();
    }
  }, [open]);

  // Load suggestions on first open
  useEffect(() => {
    if (!open || categories.length > 0) return;
    setLoadingSugg(true);
    contactApi.suggestions()
      .then(setCategories)
      .catch(() => {})
      .finally(() => setLoadingSugg(false));
  }, [open]);

  // Scroll to bottom on new message
  useEffect(() => {
    if (view === 'chat') {
      setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);
    }
  }, [messages, view]);

  const openChat = () => {
    Animated.sequence([
      Animated.timing(fabScale, { toValue: 0.85, duration: 100, useNativeDriver: true }),
      Animated.spring(fabScale, { toValue: 1, damping: 12, useNativeDriver: true }),
    ]).start();
    setOpen(true);
  };

  const closeChat = () => setOpen(false);

  const ask = async (question: string) => {
    setView('chat');
    setMessages((prev) => [...prev, { sender: 'user', content: question }]);
    setLoading(true);
    try {
      const res = await contactApi.chat({ sessionId: sessionId.current, message: question });
      setMessages((prev) => [
        ...prev,
        { sender: 'bot', content: res.reply, escalate: !res.matched },
      ]);
    } catch {
      setMessages((prev) => [
        ...prev,
        { sender: 'bot', content: 'Une erreur est survenue. Veuillez réessayer.' },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const fabBottom = insets.bottom + 90;

  return (
    <>
      {/* Modal bottom sheet */}
      <Modal
        visible={open}
        transparent
        animationType="none"
        onRequestClose={closeChat}
        statusBarTranslucent
      >
        <KeyboardAvoidingView
          style={styles.modalRoot}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          {/* Backdrop */}
          <Pressable style={StyleSheet.absoluteFill} onPress={closeChat}>
            <View style={styles.backdrop} />
          </Pressable>

          {/* Sheet */}
          <Animated.View
            style={[
              styles.sheet,
              { height: SHEET_H, paddingBottom: insets.bottom + 8 },
              { transform: [{ translateY: slideAnim }] },
            ]}
          >
            {/* Handle */}
            <View style={styles.handle} />

            {/* Header */}
            <View style={styles.header}>
              <View style={styles.headerLeft}>
                <Image
                  source={require('../../assets/icon.png')}
                  style={styles.headerLogo}
                  resizeMode="contain"
                />
                <View>
                  <Text style={styles.headerTitle}>Assistant CynaSecure</Text>
                  <View style={styles.headerStatusRow}>
                    <View style={styles.onlineDot} />
                    <Text style={styles.headerStatus}>En ligne</Text>
                  </View>
                </View>
              </View>
              {view === 'chat' ? (
                <Pressable onPress={() => setView('questions')} style={styles.headerBtn} hitSlop={10}>
                  <ChevronLeft color={colors.textMuted} size={20} />
                </Pressable>
              ) : (
                <Pressable onPress={closeChat} style={styles.headerBtn} hitSlop={10}>
                  <X color={colors.textMuted} size={20} />
                </Pressable>
              )}
            </View>

            {/* Vue questions */}
            {view === 'questions' && (
              <View style={styles.flex}>
                <Text style={styles.welcomeText}>
                  Sélectionnez une question ou décrivez votre besoin.
                </Text>

                {loadingSugg ? (
                  <View style={styles.centerLoader}>
                    <Text style={styles.loadingText}>Chargement…</Text>
                  </View>
                ) : (
                  <>
                    {/* Tabs catégories */}
                    <ScrollView
                      horizontal
                      showsHorizontalScrollIndicator={false}
                      style={styles.tabsScrollWrap}
                      contentContainerStyle={styles.tabsRow}
                    >
                      {categories.map((cat, i) => (
                        <Pressable
                          key={i}
                          onPress={() => setActiveTab(i)}
                          style={[styles.tab, activeTab === i && styles.tabActive]}
                        >
                          <Text style={[styles.tabText, activeTab === i && styles.tabTextActive]}>
                            {cat.label}
                          </Text>
                        </Pressable>
                      ))}
                    </ScrollView>

                    {/* Questions */}
                    <ScrollView style={styles.flex} showsVerticalScrollIndicator={false}>
                      {(categories[activeTab]?.questions ?? []).map((q, i) => (
                        <Pressable
                          key={i}
                          onPress={() => ask(q)}
                          disabled={loading}
                          style={({ pressed }) => [styles.questionItem, pressed && styles.questionItemPressed]}
                        >
                          <Text style={styles.questionText}>{q}</Text>
                          <ChevronLeft
                            color={colors.primary}
                            size={15}
                            style={{ transform: [{ rotate: '180deg' }] }}
                          />
                        </Pressable>
                      ))}
                      {categories[activeTab]?.questions.length === 0 && (
                        <Text style={styles.emptyText}>Aucune question disponible.</Text>
                      )}
                    </ScrollView>
                  </>
                )}
              </View>
            )}

            {/* Vue chat */}
            {view === 'chat' && (
              <View style={styles.flex}>
                <ScrollView
                  ref={scrollRef}
                  style={styles.flex}
                  contentContainerStyle={styles.messagesContent}
                  showsVerticalScrollIndicator={false}
                >
                  {messages.map((msg, i) => (
                    <View
                      key={i}
                      style={[
                        styles.msgRow,
                        msg.sender === 'user' ? styles.msgRowUser : styles.msgRowBot,
                      ]}
                    >
                      {msg.sender === 'bot' && (
                        <View style={styles.botAvatar}>
                          <Shield color={colors.primary} size={13} />
                        </View>
                      )}
                      <View style={[
                        styles.bubble,
                        msg.sender === 'user' ? styles.bubbleUser : styles.bubbleBot,
                      ]}>
                        <Text style={[
                          styles.bubbleText,
                          msg.sender === 'user' ? styles.bubbleTextUser : styles.bubbleTextBot,
                        ]}>
                          {msg.content}
                        </Text>
                      </View>
                    </View>
                  ))}

                  {loading && (
                    <View style={styles.msgRowBot}>
                      <View style={styles.botAvatar}>
                        <Shield color={colors.primary} size={13} />
                      </View>
                      <View style={styles.bubbleBot}>
                        <TypingDots />
                      </View>
                    </View>
                  )}
                </ScrollView>
              </View>
            )}
          </Animated.View>
        </KeyboardAvoidingView>
      </Modal>

      {/* FAB */}
      <Animated.View
        style={[
          styles.fab,
          { bottom: fabBottom, transform: [{ scale: fabScale }] },
        ]}
        pointerEvents="box-none"
      >
        <Pressable
          onPress={open ? closeChat : openChat}
          accessibilityLabel={open ? 'Fermer le chat' : 'Ouvrir le chat'}
          accessibilityRole="button"
          style={({ pressed }) => [pressed && { opacity: 0.85 }]}
        >
          <LinearGradient
            colors={['#2563EB', '#4F8EF7']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.fabGradient}
          >
            {open
              ? <X color="#fff" size={22} />
              : <MessageCircle color="#fff" size={22} />
            }
          </LinearGradient>
        </Pressable>
      </Animated.View>
    </>
  );
}

function TypingDots() {
  const dots = [
    useRef(new Animated.Value(0)).current,
    useRef(new Animated.Value(0)).current,
    useRef(new Animated.Value(0)).current,
  ];

  useEffect(() => {
    const anims = dots.map((dot, i) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(i * 150),
          Animated.timing(dot, { toValue: 1, duration: 300, useNativeDriver: true }),
          Animated.timing(dot, { toValue: 0, duration: 300, useNativeDriver: true }),
          Animated.delay(600 - i * 150),
        ])
      )
    );
    anims.forEach((a) => a.start());
    return () => anims.forEach((a) => a.stop());
  }, []);

  return (
    <View style={{ flexDirection: 'row', gap: 4, paddingVertical: 2 }}>
      {dots.map((dot, i) => (
        <Animated.View
          key={i}
          style={{
            width: 6,
            height: 6,
            borderRadius: 3,
            backgroundColor: colors.textMuted,
            opacity: dot,
          }}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },

  // Modal
  modalRoot: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.55)',
  },
  sheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderTopWidth: 1,
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  handle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.borderStrong,
    alignSelf: 'center',
    marginTop: 10,
    marginBottom: 6,
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    backgroundColor: colors.surfaceElevated,
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  headerLogo: { width: 34, height: 34, borderRadius: 8 },
  headerStatusRow: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 2 },
  onlineDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: colors.success },
  headerTitle: { color: colors.text, fontSize: 14, fontWeight: '700' },
  headerStatus: { color: colors.textDim, fontSize: 10, fontFamily: 'Menlo' },
  headerBtn: { padding: 4 },

  // Questions view
  welcomeText: {
    color: colors.textMuted,
    fontSize: 13,
    lineHeight: 19,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  tabsScrollWrap: {
    flexGrow: 0,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  tabsRow: {
    flexDirection: 'row',
    paddingHorizontal: 12,
  },
  tab: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
    marginBottom: -1,
  },
  tabActive: {
    borderBottomColor: colors.primary,
  },
  tabText: { color: colors.textDim, fontSize: 12, fontWeight: '600' },
  tabTextActive: { color: colors.primary, fontWeight: '700' },
  questionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderSubtle,
    gap: 10,
  },
  questionItemPressed: { backgroundColor: colors.surfaceElevated },
  questionText: { flex: 1, color: colors.textSecondary, fontSize: 14, lineHeight: 20 },
  emptyText: { color: colors.textDim, fontSize: 13, textAlign: 'center', padding: 24 },
  centerLoader: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  loadingText: { color: colors.textDim, fontSize: 12, fontFamily: 'Menlo' },

  // Chat view
  messagesContent: { padding: 16, gap: 12 },
  msgRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 8 },
  msgRowUser: { justifyContent: 'flex-end' },
  msgRowBot: { justifyContent: 'flex-start' },
  botAvatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.primaryGlow,
    borderWidth: 1,
    borderColor: colors.borderAccent,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  bubble: {
    maxWidth: '78%',
    paddingHorizontal: 13,
    paddingVertical: 10,
    borderRadius: 16,
  },
  bubbleUser: {
    backgroundColor: colors.primary,
    borderBottomRightRadius: 4,
  },
  bubbleBot: {
    backgroundColor: colors.surfaceHigh,
    borderWidth: 1,
    borderColor: colors.border,
    borderBottomLeftRadius: 4,
  },
  bubbleText: { fontSize: 14, lineHeight: 20 },
  bubbleTextUser: { color: '#fff' },
  bubbleTextBot: { color: colors.textSecondary },

  // FAB
  fab: {
    position: 'absolute',
    right: 20,
    zIndex: 999,
  },
  fabGradient: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#4F8EF7',
    shadowOpacity: 0.5,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 6 },
    elevation: 12,
  },
});
