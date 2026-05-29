import React, { useEffect, useRef, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  ActivityIndicator,
} from 'react-native';
import { useToast } from '../../hooks/useToast';
import {
  MessageCircle,
  Send,
  ChevronDown,
  ChevronUp,
  ArrowLeft,
  Bot,
  Mail,
  CornerDownRight,
  Shield,
  Phone,
  MapPin,
  Clock,
} from 'lucide-react-native';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { useAuth } from '../../context/AuthContext';
import {
  contactApi,
  CONTACT_SUBJECTS,
  type ChatbotCategory,
  type ContactSubject,
  type UserMessage,
} from '../../api/contact';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, radius } from '../../theme/colors';

// helpers

function generateSessionId() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    return (c === 'x' ? r : (r & 0x3) | 0x8).toString(16);
  });
}

function fmt(iso: string) {
  try {
    return new Date(iso).toLocaleDateString('fr-FR', {
      day: 'numeric', month: 'short', year: 'numeric',
    });
  } catch { return iso; }
}

// types

type Message = { sender: 'user' | 'bot'; content: string; escalate?: boolean };

// Chatbot

function ChatbotView({ onEscalate }: { onEscalate: (msg: string) => void }) {
  const [categories, setCategories]   = useState<ChatbotCategory[]>([]);
  const [activeTab, setActiveTab]     = useState(0);
  const [view, setView]               = useState<'questions' | 'chat'>('questions');
  const [messages, setMessages]       = useState<Message[]>([
    { sender: 'bot', content: 'Bonjour ! Comment puis-je vous aider ? Choisissez une question ou posez la vôtre.' },
  ]);
  const [input, setInput]             = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  const [loadingSugg, setLoadingSugg] = useState(true);

  const sessionId = useRef(generateSessionId());
  const scrollRef = useRef<ScrollView>(null);

  useEffect(() => {
    contactApi.suggestions()
      .then(setCategories)
      .catch(() => {})
      .finally(() => setLoadingSugg(false));
  }, []);

  useEffect(() => {
    if (view === 'chat') {
      setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);
    }
  }, [messages, view]);

  const ask = async (question: string) => {
    setView('chat');
    setInput('');
    setMessages((prev) => [...prev, { sender: 'user', content: question }]);
    setChatLoading(true);

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
      setChatLoading(false);
    }
  };

  const handleSend = () => {
    if (!input.trim() || chatLoading) return;
    ask(input.trim());
  };

  const handleEscalate = () => {
    const lastUser = [...messages].reverse().find((m) => m.sender === 'user');
    onEscalate(lastUser?.content ?? '');
  };

  // Questions view

  if (view === 'questions') {
    return (
      <View style={styles.chatContainer}>
        <Text style={styles.welcomeText}>
          Bonjour ! Sélectionnez une question fréquente ou posez la vôtre directement.
        </Text>

        {loadingSugg ? (
          <View style={styles.loadingCenter}>
            <ActivityIndicator color={colors.primary} />
            <Text style={styles.loadingText}>Chargement des suggestions…</Text>
          </View>
        ) : (
          <>
            {/* Category tabs */}
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tabsScroll}>
              <View style={styles.tabsRow}>
                {categories.map((cat, i) => (
                  <Pressable
                    key={i}
                    style={[styles.catTab, activeTab === i && styles.catTabActive]}
                    onPress={() => setActiveTab(i)}
                  >
                    <Text style={[styles.catTabText, activeTab === i && styles.catTabTextActive]}>
                      {cat.label}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </ScrollView>

            {/* Questions list */}
            <ScrollView style={styles.questionsList} showsVerticalScrollIndicator={false}>
              {(categories[activeTab]?.questions ?? []).map((q, i) => (
                <Pressable
                  key={i}
                  style={({ pressed }) => [styles.questionRow, pressed && { opacity: 0.7 }]}
                  onPress={() => ask(q)}
                >
                  <Text style={styles.questionText}>{q}</Text>
                  <Text style={styles.questionArrow}>›</Text>
                </Pressable>
              ))}
              {(categories[activeTab]?.questions ?? []).length === 0 && (
                <Text style={styles.noQuestions}>Aucune question dans cette catégorie.</Text>
              )}
            </ScrollView>
          </>
        )}

        {/* Custom input */}
        <View style={styles.inputBar}>
          <TextInput
            style={styles.inputField}
            value={input}
            onChangeText={setInput}
            placeholder="Posez votre question…"
            placeholderTextColor={colors.textDim}
            returnKeyType="send"
            onSubmitEditing={handleSend}
          />
          <Pressable
            style={[styles.sendBtn, !input.trim() && styles.sendBtnDisabled]}
            onPress={handleSend}
            disabled={!input.trim()}
          >
            <Send color={input.trim() ? '#fff' : colors.textDim} size={16} />
          </Pressable>
        </View>
      </View>
    );
  }

  // Chat view

  return (
    <KeyboardAvoidingView
      style={styles.chatContainer}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={120}
    >
      {/* Back button */}
      <Pressable style={styles.backBtn} onPress={() => setView('questions')}>
        <ArrowLeft color={colors.primary} size={14} />
        <Text style={styles.backBtnText}>Questions fréquentes</Text>
      </Pressable>

      {/* Messages */}
      <ScrollView
        ref={scrollRef}
        style={styles.messagesList}
        contentContainerStyle={styles.messagesContent}
        showsVerticalScrollIndicator={false}
      >
        {messages.map((msg, i) => (
          <View key={i} style={[styles.msgRow, msg.sender === 'user' ? styles.msgRowUser : styles.msgRowBot]}>
            {msg.sender === 'bot' && (
              <View style={styles.botAvatar}>
                <Bot color={colors.primary} size={12} />
              </View>
            )}
            <View style={{ maxWidth: '80%' }}>
              <View style={[styles.bubble, msg.sender === 'user' ? styles.bubbleUser : styles.bubbleBot]}>
                <Text style={[styles.bubbleText, msg.sender === 'user' && styles.bubbleTextUser]}>
                  {msg.content}
                </Text>
              </View>
              {msg.escalate && (
                <Pressable style={styles.escalateBtn} onPress={handleEscalate}>
                  <Mail color="#fff" size={12} />
                  <Text style={styles.escalateBtnText}>Contacter le support</Text>
                </Pressable>
              )}
            </View>
          </View>
        ))}

        {chatLoading && (
          <View style={styles.msgRowBot}>
            <View style={styles.botAvatar}>
              <Bot color={colors.primary} size={12} />
            </View>
            <View style={[styles.bubble, styles.bubbleBot, styles.typingBubble]}>
              <Text style={styles.typingDots}>• • •</Text>
            </View>
          </View>
        )}
      </ScrollView>

      {/* Input bar */}
      <View style={styles.inputBar}>
        <TextInput
          style={styles.inputField}
          value={input}
          onChangeText={setInput}
          placeholder="Votre question…"
          placeholderTextColor={colors.textDim}
          returnKeyType="send"
          onSubmitEditing={handleSend}
          editable={!chatLoading}
        />
        <Pressable
          style={[styles.sendBtn, (!input.trim() || chatLoading) && styles.sendBtnDisabled]}
          onPress={handleSend}
          disabled={!input.trim() || chatLoading}
        >
          <Send color={input.trim() && !chatLoading ? '#fff' : colors.textDim} size={16} />
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}

// Contact form

function ContactForm({
  prefillMessage,
  prefillSubject,
  userEmail,
}: {
  prefillMessage: string;
  prefillSubject: string;
  userEmail?: string;
}) {
  const { toast } = useToast();
  const [email, setEmail]     = useState(userEmail ?? '');
  const [subject, setSubject] = useState<ContactSubject>(
    (prefillSubject as ContactSubject) || 'Assistance générale'
  );
  const [message, setMessage] = useState(prefillMessage);
  const [loading, setLoading] = useState(false);

  useEffect(() => { if (prefillMessage) setMessage(prefillMessage); }, [prefillMessage]);
  useEffect(() => { if (prefillSubject) setSubject(prefillSubject as ContactSubject); }, [prefillSubject]);

  const submit = async () => {
    if (!email.trim() || !message.trim()) return;
    if (message.trim().length < 10) {
      toast('Le message doit contenir au moins 10 caractères.', 'warning');
      return;
    }
    setLoading(true);
    try {
      await contactApi.send({ email: email.trim(), subject, message: message.trim() });
      toast('Message envoyé. Nous vous répondrons sous 4h ouvrées.', 'success');
      setMessage('');
    } catch (e: any) {
      toast(e?.message ?? 'Impossible d\'envoyer le message.', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card style={styles.formCard}>
      <Text style={styles.formTitle}>Envoyer un message</Text>

      <Input
        label="Votre email"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
      />

      <View>
        <Text style={styles.fieldLabel}>Sujet</Text>
        <View style={styles.subjectRow}>
          {CONTACT_SUBJECTS.map((s) => (
            <Pressable
              key={s}
              style={[styles.chip, subject === s && styles.chipActive]}
              onPress={() => setSubject(s)}
            >
              <Text style={[styles.chipText, subject === s && styles.chipTextActive]}>
                {s}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>

      <View>
        <Text style={styles.fieldLabel}>Message</Text>
        <TextInput
          style={styles.textarea}
          value={message}
          onChangeText={setMessage}
          placeholder="Décrivez votre demande…"
          placeholderTextColor={colors.textDim}
          multiline
          numberOfLines={5}
          textAlignVertical="top"
        />
      </View>

      <Button
        label="Envoyer"
        onPress={submit}
        loading={loading}
        disabled={!email.trim() || !message.trim()}
        icon={<Send color="#fff" size={16} />}
        fullWidth
      />
    </Card>
  );
}

// My messages

function MyMessages() {
  const [messages, setMessages] = useState<UserMessage[]>([]);
  const [loading, setLoading]   = useState(true);
  const [expanded, setExpanded] = useState<number | null>(null);

  useEffect(() => {
    contactApi.myMessages()
      .then((msgs) => { setMessages(msgs); contactApi.markRead().catch(() => {}); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <ActivityIndicator color={colors.primary} style={{ marginTop: 16 }} />;
  if (messages.length === 0) return null;

  const hasUnread = messages.some((m) => m.adminReply && !m.replyReadAt);

  return (
    <View style={styles.myMsgsSection}>
      <View style={styles.myMsgsHeader}>
        <Mail color={colors.primary} size={16} />
        <Text style={styles.myMsgsTitle}>Mes échanges</Text>
        {hasUnread && <View style={styles.unreadDot} />}
      </View>

      {messages.map((m) => {
        const isOpen = expanded === m.id;
        const hasNewReply = m.adminReply && !m.replyReadAt;

        return (
          <Card key={m.id} padded={false} style={[styles.msgCard, hasNewReply && styles.msgCardHighlight]}>
            <Pressable
              style={styles.msgCardHeader}
              onPress={() => setExpanded(isOpen ? null : m.id)}
            >
              <View style={{ flex: 1 }}>
                {hasNewReply && <View style={styles.newReplyDot} />}
                <Text style={styles.msgSubject}>{m.subject}</Text>
                <Text style={styles.msgDate}>{fmt(m.createdAt)}</Text>
              </View>
              <View style={styles.msgRight}>
                <View style={[styles.statusBadge, statusStyle(m.status)]}>
                  <Text style={[styles.statusText, statusTextStyle(m.status)]}>
                    {statusLabel(m.status)}
                  </Text>
                </View>
                {isOpen ? <ChevronUp color={colors.textDim} size={14} /> : <ChevronDown color={colors.textDim} size={14} />}
              </View>
            </Pressable>

            {isOpen && (
              <View style={styles.msgBody}>
                <Text style={styles.msgContent}>{m.message}</Text>
                {m.adminReply && (
                  <View style={styles.replyBlock}>
                    <View style={styles.replyHeader}>
                      <CornerDownRight color={colors.primary} size={12} />
                      <Text style={styles.replyLabel}>
                        Réponse de l'équipe{m.repliedAt ? ` · ${fmt(m.repliedAt)}` : ''}
                      </Text>
                    </View>
                    <Text style={styles.replyText}>{m.adminReply}</Text>
                  </View>
                )}
              </View>
            )}
          </Card>
        );
      })}
    </View>
  );
}

function statusLabel(status: string) {
  return status === 'new' ? 'Nouveau' : status === 'read' ? 'Lu' : 'Répondu';
}

function statusStyle(status: string) {
  if (status === 'answered') return { backgroundColor: 'rgba(16,185,129,0.15)', borderColor: 'rgba(16,185,129,0.3)' };
  if (status === 'read')     return { backgroundColor: 'rgba(245,158,11,0.15)', borderColor: 'rgba(245,158,11,0.3)' };
  return { backgroundColor: colors.surfaceHigh, borderColor: colors.border };
}

function statusTextStyle(status: string) {
  if (status === 'answered') return { color: colors.success };
  if (status === 'read')     return { color: colors.warning };
  return { color: colors.textMuted };
}

// Contact info cards

const INFO_CARDS = [
  {
    icon: Mail,
    label: 'Email',
    value: 'support@cynasecure.com',
    note: 'Réponse sous 4h ouvrées',
    color: '#3B82F6',
    bg: 'rgba(59,130,246,0.1)',
  },
  {
    icon: Shield,
    label: 'Sécurité',
    value: 'security@cynasecure.com',
    note: 'Assistance 24/7',
    color: '#10B981',
    bg: 'rgba(16,185,129,0.1)',
  },
  {
    icon: Phone,
    label: 'Téléphone',
    value: '+33 1 XX XX XX XX',
    note: 'Lun–Ven, 9h–18h',
    color: '#8B5CF6',
    bg: 'rgba(139,92,246,0.1)',
  },
  {
    icon: MapPin,
    label: 'Adresse',
    value: 'Paris, France',
    note: 'Siège social',
    color: '#F59E0B',
    bg: 'rgba(245,158,11,0.1)',
  },
];

const COMMITMENTS = [
  { icon: Clock, label: 'Réponse email', delay: '< 4h ouvrées' },
  { icon: Shield, label: 'Urgence sécurité', delay: '< 1h' },
  { icon: MessageCircle, label: 'Support chat', delay: 'Immédiat' },
];

// Main screen

export function ContactScreen() {
  const { isAuthenticated, user } = useAuth();
  const insets = useSafeAreaInsets();
  const [tab, setTab]                     = useState<'assistant' | 'contact'>('assistant');
  const [prefillMessage, setPrefillMessage] = useState('');
  const [prefillSubject, setPrefillSubject] = useState('');

  const handleEscalate = (msg: string) => {
    setPrefillMessage(msg);
    setPrefillSubject('Assistance générale');
    setTab('contact');
  };

  return (
    <View style={styles.root}>
      {/* Page header */}
      <View style={[styles.pageHeader, { paddingTop: insets.top + 12 }]}>
        <Text style={styles.pageEyebrow}>SUPPORT & CONTACT</Text>
        <Text style={styles.pageTitle}>Comment pouvons-nous{'\n'}vous aider ?</Text>
        <Text style={styles.pageSubtitle}>Notre équipe est disponible pour répondre à toutes vos questions.</Text>
      </View>

      {/* Tab selector */}
      <View style={styles.tabBar}>
        <Pressable
          style={[styles.tabBtn, tab === 'assistant' && styles.tabBtnActive]}
          onPress={() => setTab('assistant')}
        >
          <Bot color={tab === 'assistant' ? colors.primary : colors.textDim} size={15} />
          <Text style={[styles.tabBtnLabel, tab === 'assistant' && styles.tabBtnLabelActive]}>
            Assistant
          </Text>
        </Pressable>
        <Pressable
          style={[styles.tabBtn, tab === 'contact' && styles.tabBtnActive]}
          onPress={() => setTab('contact')}
        >
          <MessageCircle color={tab === 'contact' ? colors.primary : colors.textDim} size={15} />
          <Text style={[styles.tabBtnLabel, tab === 'contact' && styles.tabBtnLabelActive]}>
            Nous contacter
          </Text>
        </Pressable>
      </View>

      {/* Assistant tab */}
      {tab === 'assistant' && (
        <ChatbotView onEscalate={handleEscalate} />
      )}

      {/* Contact tab */}
      {tab === 'contact' && (
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          {/* Info cards */}
          <View style={styles.infoGrid}>
            {INFO_CARDS.map((card) => {
              const Icon = card.icon;
              return (
                <View key={card.label} style={[styles.infoCard, { borderColor: card.color + '33' }]}>
                  <View style={[styles.infoIconWrap, { backgroundColor: card.bg }]}>
                    <Icon color={card.color} size={16} />
                  </View>
                  <Text style={styles.infoLabel}>{card.label}</Text>
                  <Text style={styles.infoValue} numberOfLines={1}>{card.value}</Text>
                  <Text style={styles.infoNote}>{card.note}</Text>
                </View>
              );
            })}
          </View>

          {/* Commitment times */}
          <View style={styles.commitCard}>
            <Text style={styles.commitTitle}>Délais de réponse</Text>
            {COMMITMENTS.map((c) => {
              const Icon = c.icon;
              return (
                <View key={c.label} style={styles.commitRow}>
                  <Icon color={colors.primary} size={14} />
                  <Text style={styles.commitLabel}>{c.label}</Text>
                  <View style={styles.commitBadge}>
                    <Text style={styles.commitDelay}>{c.delay}</Text>
                  </View>
                </View>
              );
            })}
          </View>

          <ContactForm
            prefillMessage={prefillMessage}
            prefillSubject={prefillSubject}
            userEmail={isAuthenticated && user?.email ? user.email : undefined}
          />
          {isAuthenticated && <MyMessages />}
        </ScrollView>
      )}
    </View>
  );
}

// Styles

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },

  // Page header
  pageHeader: {
    paddingHorizontal: 20,
    paddingBottom: 16,
    backgroundColor: colors.background,
    gap: 4,
  },
  pageEyebrow: { color: colors.primary, fontSize: 11, fontWeight: '700', letterSpacing: 1.5, textTransform: 'uppercase' },
  pageTitle: { color: colors.text, fontSize: 24, fontWeight: '900', letterSpacing: -0.5, lineHeight: 30 },
  pageSubtitle: { color: colors.textMuted, fontSize: 13, lineHeight: 19, marginTop: 2 },

  // Tab bar
  tabBar: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.surface,
  },
  tabBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabBtnActive: { borderBottomColor: colors.primary },
  tabBtnLabel: { color: colors.textDim, fontSize: 13, fontWeight: '600' },
  tabBtnLabelActive: { color: colors.primary },

  // Chatbot
  chatContainer: { flex: 1 },
  welcomeText: {
    color: colors.textMuted,
    fontSize: 13,
    lineHeight: 20,
    padding: 16,
    paddingBottom: 8,
  },
  loadingCenter: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 10 },
  loadingText: { color: colors.textDim, fontSize: 12 },

  // Category tabs
  tabsScroll: { flexGrow: 0, borderBottomWidth: 1, borderBottomColor: colors.border },
  tabsRow: { flexDirection: 'row', paddingHorizontal: 12, gap: 0 },
  catTab: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
    marginBottom: -1,
  },
  catTabActive: { borderBottomColor: colors.primary },
  catTabText: { color: colors.textDim, fontSize: 12, fontWeight: '600' },
  catTabTextActive: { color: colors.primary },

  // Questions list
  questionsList: { flex: 1 },
  questionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 13,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderSubtle,
  },
  questionText: { flex: 1, color: colors.text, fontSize: 13, lineHeight: 18 },
  questionArrow: { color: colors.textDim, fontSize: 18, marginLeft: 8 },
  noQuestions: { color: colors.textDim, fontSize: 12, padding: 16, textAlign: 'center' },

  // Input bar (shared by both views)
  inputBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 12,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.surface,
  },
  inputField: {
    flex: 1,
    backgroundColor: colors.surfaceHigh,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: colors.text,
    fontSize: 14,
    maxHeight: 80,
  },
  sendBtn: {
    width: 40,
    height: 40,
    borderRadius: radius.md,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendBtnDisabled: { backgroundColor: colors.surfaceHigh },

  // Chat bubbles
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  backBtnText: { color: colors.primary, fontSize: 12, fontWeight: '600' },
  messagesList: { flex: 1 },
  messagesContent: { padding: 12, gap: 10 },
  msgRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 8 },
  msgRowUser: { justifyContent: 'flex-end' },
  msgRowBot: { justifyContent: 'flex-start' },
  botAvatar: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: 'rgba(99,102,241,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  bubble: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: radius.md,
    borderWidth: 1,
  },
  bubbleUser: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
    borderBottomRightRadius: 4,
  },
  bubbleBot: {
    backgroundColor: colors.surfaceHigh,
    borderColor: colors.border,
    borderBottomLeftRadius: 4,
  },
  bubbleText: { color: colors.text, fontSize: 13, lineHeight: 19 },
  bubbleTextUser: { color: '#fff' },
  typingBubble: { paddingVertical: 10 },
  typingDots: { color: colors.textDim, fontSize: 16, letterSpacing: 4 },
  escalateBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 6,
    backgroundColor: colors.primary,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: radius.sm,
    alignSelf: 'flex-start',
  },
  escalateBtnText: { color: '#fff', fontSize: 12, fontWeight: '600' },

  // Info cards
  infoGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  infoCard: {
    width: '47%',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderRadius: radius.md,
    padding: 14,
    gap: 4,
  },
  infoIconWrap: {
    width: 32,
    height: 32,
    borderRadius: radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  infoLabel: { color: colors.textMuted, fontSize: 10, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.8 },
  infoValue: { color: colors.text, fontSize: 12, fontWeight: '600' },
  infoNote: { color: colors.textDim, fontSize: 11 },

  // Commitments
  commitCard: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: 14,
    gap: 10,
  },
  commitTitle: { color: colors.text, fontSize: 13, fontWeight: '700', marginBottom: 2 },
  commitRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  commitLabel: { flex: 1, color: colors.textSecondary, fontSize: 13 },
  commitBadge: {
    backgroundColor: 'rgba(59,130,246,0.1)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: radius.full,
  },
  commitDelay: { color: colors.primary, fontSize: 11, fontWeight: '700' },

  // Contact form tab
  scroll: { flex: 1 },
  scrollContent: { padding: 20, gap: 16, paddingBottom: 48 },
  formCard: { gap: 14 },
  formTitle: { color: colors.text, fontSize: 16, fontWeight: '700' },
  fieldLabel: {
    color: colors.textMuted,
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  subjectRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  chip: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.full,
    backgroundColor: colors.surfaceHigh,
  },
  chipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  chipText: { color: colors.textMuted, fontSize: 11, fontWeight: '500' },
  chipTextActive: { color: '#fff', fontWeight: '600' },
  textarea: {
    backgroundColor: colors.surfaceHigh,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: colors.text,
    fontSize: 14,
    minHeight: 120,
    textAlignVertical: 'top',
  },

  // My messages
  myMsgsSection: { gap: 10 },
  myMsgsHeader: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  myMsgsTitle: { flex: 1, color: colors.text, fontSize: 15, fontWeight: '700' },
  unreadDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.primary },
  msgCard: { overflow: 'hidden' },
  msgCardHighlight: { borderColor: 'rgba(99,102,241,0.4)' },
  msgCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 12,
  },
  newReplyDot: {
    position: 'absolute',
    top: 0,
    left: -6,
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.primary,
  },
  msgSubject: { color: colors.text, fontSize: 13, fontWeight: '600' },
  msgDate: { color: colors.textMuted, fontSize: 11, marginTop: 2 },
  msgRight: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  statusBadge: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: radius.sm,
    borderWidth: 1,
  },
  statusText: { fontSize: 10, fontWeight: '700' },
  msgBody: {
    padding: 12,
    paddingTop: 0,
    borderTopWidth: 1,
    borderTopColor: colors.borderSubtle,
    gap: 10,
  },
  msgContent: { color: colors.textSecondary, fontSize: 13, lineHeight: 19 },
  replyBlock: {
    borderLeftWidth: 2,
    borderLeftColor: colors.primary,
    paddingLeft: 10,
    gap: 4,
  },
  replyHeader: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  replyLabel: { color: colors.primary, fontSize: 11, fontWeight: '600' },
  replyText: { color: colors.text, fontSize: 13, lineHeight: 19 },
});
