import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import {
  Mail,
  Send,
  ChevronDown as ChevronDownIcon,
  ChevronUp as ChevronUpIcon,
  CornerDownRight,
  Shield,
  Phone,
  MapPin,
  Clock,
  MessageCircle,
} from 'lucide-react-native';
import { useToast } from '../../hooks/useToast';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { useAuth } from '../../context/AuthContext';
import {
  contactApi,
  CONTACT_SUBJECTS,
  type ContactSubject,
  type UserMessage,
} from '../../api/contact';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, radius } from '../../theme/colors';

function fmt(iso: string) {
  try {
    return new Date(iso).toLocaleDateString('fr-FR', {
      day: 'numeric', month: 'short', year: 'numeric',
    });
  } catch { return iso; }
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

const INFO_CARDS = [
  { icon: Mail,    label: 'Email',      value: 'support@cynasecure.com', note: 'Réponse sous 4h ouvrées', color: '#4F8EF7', bg: 'rgba(79,142,247,0.1)' },
  { icon: Shield,  label: 'Sécurité',   value: 'security@cynasecure.com', note: 'Assistance 24/7',         color: '#10B981', bg: 'rgba(16,185,129,0.1)' },
  { icon: Phone,   label: 'Téléphone',  value: '+33 1 XX XX XX XX',       note: 'Lun–Ven, 9h–18h',         color: '#8B5CF6', bg: 'rgba(139,92,246,0.1)' },
  { icon: MapPin,  label: 'Adresse',    value: 'Paris, France',            note: 'Siège social',             color: '#F59E0B', bg: 'rgba(245,158,11,0.1)' },
];

const COMMITMENTS = [
  { icon: Clock,         label: 'Réponse email',    delay: '< 4h ouvrées' },
  { icon: Shield,        label: 'Urgence sécurité', delay: '< 1h' },
  { icon: MessageCircle, label: 'Support chat',      delay: 'Immédiat' },
];

function ContactForm({ userEmail }: { userEmail?: string }) {
  const { toast } = useToast();
  const [email, setEmail]     = useState(userEmail ?? '');
  const [subject, setSubject] = useState<ContactSubject>('Assistance générale');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    if (!email.trim() || !message.trim()) return;
    if (message.trim().length < 10) {
      toast('Le message doit contenir au moins 10 caractères.', 'warning');
      return;
    }
    if (message.length > 5000) {
      toast('Le message ne peut pas dépasser 5000 caractères.', 'warning');
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
        leftIcon={<Mail color={colors.textDim} size={16} />}
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
              <Text style={[styles.chipText, subject === s && styles.chipTextActive]}>{s}</Text>
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
          maxLength={5000}
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
            <Pressable style={styles.msgCardHeader} onPress={() => setExpanded(isOpen ? null : m.id)}>
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
                {isOpen
                  ? <ChevronUpIcon color={colors.textDim} size={14} />
                  : <ChevronDownIcon color={colors.textDim} size={14} />
                }
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

export function ContactScreen() {
  const { isAuthenticated, user } = useAuth();
  const insets = useSafeAreaInsets();

  return (
    <ScrollView
      style={styles.root}
      contentContainerStyle={[styles.content, { paddingTop: insets.top + 16 }]}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
    >
      {/* Header */}
      <View style={styles.pageHeader}>
        <Text style={styles.pageEyebrow}>SUPPORT & CONTACT</Text>
        <Text style={styles.pageTitle}>Comment pouvons-nous{'\n'}vous aider ?</Text>
        <Text style={styles.pageSubtitle}>
          Notre équipe est disponible pour répondre à toutes vos questions.
        </Text>
      </View>

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

      {/* Délais de réponse */}
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

      {/* Formulaire */}
      <ContactForm userEmail={isAuthenticated && user?.email ? user.email : undefined} />

      {/* Historique messages */}
      {isAuthenticated && <MyMessages />}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  content: { padding: 20, gap: 24, paddingBottom: 120 },

  pageHeader: { gap: 8 },
  pageEyebrow: { color: colors.primary, fontSize: 10, fontWeight: '700', letterSpacing: 1.8, textTransform: 'uppercase' },
  pageTitle: { color: colors.text, fontSize: 28, fontWeight: '900', letterSpacing: -0.5, lineHeight: 34, marginTop: 2 },
  pageSubtitle: { color: colors.textMuted, fontSize: 14, lineHeight: 21 },

  // Info grid
  infoGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  infoCard: {
    width: '47%',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderRadius: radius.md,
    padding: 14,
    gap: 4,
  },
  infoIconWrap: { width: 32, height: 32, borderRadius: radius.sm, alignItems: 'center', justifyContent: 'center', marginBottom: 4 },
  infoLabel: { color: colors.textMuted, fontSize: 10, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.8 },
  infoValue: { color: colors.text, fontSize: 12, fontWeight: '600' },
  infoNote: { color: colors.textDim, fontSize: 11 },

  // Commitments
  commitCard: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, padding: 14, gap: 10 },
  commitTitle: { color: colors.text, fontSize: 13, fontWeight: '700', marginBottom: 2 },
  commitRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  commitLabel: { flex: 1, color: colors.textSecondary, fontSize: 13 },
  commitBadge: { backgroundColor: 'rgba(79,142,247,0.1)', paddingHorizontal: 8, paddingVertical: 2, borderRadius: radius.full },
  commitDelay: { color: colors.primary, fontSize: 11, fontWeight: '700' },

  // Form
  formCard: { gap: 14 },
  formTitle: { color: colors.text, fontSize: 16, fontWeight: '700' },
  fieldLabel: { color: colors.textMuted, fontSize: 11, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 6 },
  subjectRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  chip: { paddingHorizontal: 10, paddingVertical: 6, borderWidth: 1, borderColor: colors.border, borderRadius: radius.full, backgroundColor: colors.surfaceElevated },
  chipActive: { backgroundColor: colors.primaryGlow, borderColor: colors.borderAccent },
  chipText: { color: colors.textMuted, fontSize: 11, fontWeight: '500' },
  chipTextActive: { color: colors.primaryLight, fontWeight: '700' },
  textarea: {
    backgroundColor: colors.surfaceElevated,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: radius.lg,
    paddingHorizontal: 14,
    paddingVertical: 12,
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
  msgCardHighlight: { borderColor: colors.borderAccent },
  msgCardHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 12 },
  newReplyDot: { position: 'absolute', top: 0, left: -6, width: 6, height: 6, borderRadius: 3, backgroundColor: colors.primary },
  msgSubject: { color: colors.text, fontSize: 13, fontWeight: '600' },
  msgDate: { color: colors.textMuted, fontSize: 11, marginTop: 2 },
  msgRight: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  statusBadge: { paddingHorizontal: 7, paddingVertical: 2, borderRadius: radius.sm, borderWidth: 1 },
  statusText: { fontSize: 10, fontWeight: '700' },
  msgBody: { padding: 12, paddingTop: 0, borderTopWidth: 1, borderTopColor: colors.borderSubtle, gap: 10 },
  msgContent: { color: colors.textSecondary, fontSize: 13, lineHeight: 19 },
  replyBlock: { borderLeftWidth: 2, borderLeftColor: colors.primary, paddingLeft: 10, gap: 4 },
  replyHeader: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  replyLabel: { color: colors.primary, fontSize: 11, fontWeight: '600' },
  replyText: { color: colors.text, fontSize: 13, lineHeight: 19 },
});
