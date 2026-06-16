import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import {
  ChevronDown,
  ChevronUp,
  Database,
  MessageSquare,
  Send,
  Shield,
} from 'lucide-react-native';

import { adminApi, type ContactMessage, type Paginated } from '../../api/admin';
import { colors, radius, spacing } from '../../theme/colors';

function fmt(iso: string) {
  try {
    return new Date(iso).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' });
  } catch { return iso; }
}

function statusLabel(s: string): string {
  const map: Record<string, string> = {
    open: 'Ouvert',
    in_progress: 'En cours',
    resolved: 'Résolu',
    closed: 'Clôturé',
  };
  return map[s] ?? s;
}

function StatusBadge({ status }: { status: string }) {
  const resolved = status === 'resolved' || status === 'closed';
  const inProgress = status === 'in_progress';
  const bg = resolved
    ? 'rgba(16,185,129,0.10)'
    : inProgress ? 'rgba(245,158,11,0.10)' : 'rgba(59,130,246,0.10)';
  const br = resolved
    ? 'rgba(16,185,129,0.20)'
    : inProgress ? 'rgba(245,158,11,0.20)' : 'rgba(59,130,246,0.20)';
  const col = resolved ? colors.success : inProgress ? colors.warning : colors.primary;
  return (
    <View style={{ backgroundColor: bg, borderColor: br, borderWidth: 1, borderRadius: radius.sm, paddingHorizontal: 7, paddingVertical: 2 }}>
      <Text style={{ color: col, fontSize: 9, fontWeight: '700', letterSpacing: 0.5 }}>{statusLabel(status)}</Text>
    </View>
  );
}

export function AdminContactScreen() {
  const [data, setData] = useState<Paginated<ContactMessage> | null>(null);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [expanded, setExpanded] = useState<Set<number>>(new Set());
  const [replyId, setReplyId] = useState<number | null>(null);
  const [replyText, setReplyText] = useState('');
  const [replying, setReplying] = useState(false);

  const load = (p = 1) =>
    adminApi.getContactMessages(p).then(setData).catch(() => {});

  useEffect(() => {
    setLoading(true);
    load(page).finally(() => setLoading(false));
  }, [page]);

  const onRefresh = () => {
    setRefreshing(true);
    load(page).finally(() => setRefreshing(false));
  };

  const toggleExpand = (id: number) => {
    setExpanded(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const openReply = (id: number) => {
    if (!expanded.has(id)) {
      setExpanded(prev => new Set([...prev, id]));
    }
    setReplyId(id);
    setReplyText('');
  };

  const sendReply = async (id: number) => {
    if (!replyText.trim()) return;
    setReplying(true);
    try {
      await adminApi.replyContact(id, replyText.trim());
      await adminApi.updateContactStatus(id, 'resolved');
      setReplyId(null);
      setReplyText('');
      load(page);
    } catch (e: any) {
      Alert.alert('Erreur', e?.message ?? '');
    } finally {
      setReplying(false);
    }
  };

  const markResolved = async (id: number) => {
    try {
      await adminApi.updateContactStatus(id, 'resolved');
      load(page);
    } catch (e: any) {
      Alert.alert('Erreur', e?.message ?? '');
    }
  };

  const items = data?.items ?? [];
  const total = data?.total ?? 0;
  const pending = items.filter(m => m.status !== 'resolved' && m.status !== 'closed').length;

  const ListHeader = (
    <View style={st.listHeader}>
      <View style={st.pageHeader}>
        <View style={st.eyebrowBadge}>
          <Shield color={colors.primary} size={10} />
          <Text style={st.eyebrowText}>CONSOLE ADMINISTRATEUR</Text>
        </View>
        <Text style={st.pageTitle}>Messages contact</Text>
        <Text style={st.pageDesc}>Répondez aux demandes de vos utilisateurs et prospects.</Text>
      </View>

      <View style={st.tableHeader}>
        <Database color={colors.textDim} size={13} />
        <Text style={st.tableHeaderText}>{total} message{total > 1 ? 's' : ''}</Text>
        {pending > 0 && (
          <View style={st.pendingBadge}>
            <Text style={st.pendingText}>{pending} en attente</Text>
          </View>
        )}
      </View>
    </View>
  );

  const ListFooter = data && data.totalPages > 1 ? (
    <View style={st.pagination}>
      <Pressable
        style={[st.pageBtn, page <= 1 && st.pageBtnDisabled]}
        onPress={() => setPage(p => Math.max(1, p - 1))}
        disabled={page <= 1}
      >
        <Text style={st.pageBtnText}>←</Text>
      </Pressable>
      <Text style={st.pageInfo}>Page {page} / {data.totalPages}</Text>
      <Pressable
        style={[st.pageBtn, page >= data.totalPages && st.pageBtnDisabled]}
        onPress={() => setPage(p => Math.min(data.totalPages, p + 1))}
        disabled={page >= data.totalPages}
      >
        <Text style={st.pageBtnText}>→</Text>
      </Pressable>
    </View>
  ) : null;

  return (
    <FlatList
      style={st.list}
      contentContainerStyle={st.content}
      data={items}
      keyExtractor={m => String(m.id)}
          removeClippedSubviews
          maxToRenderPerBatch={5}
          windowSize={8}
          initialNumToRender={8}
      ListHeaderComponent={ListHeader}
      ListEmptyComponent={
        loading ? (
          <View style={st.loadWrap}><ActivityIndicator color={colors.primary} /></View>
        ) : (
          <View style={st.empty}>
            <MessageSquare color={colors.textDim} size={40} strokeWidth={1.5} />
            <Text style={st.emptyTitle}>Aucun message</Text>
          </View>
        )
      }
      ListFooterComponent={ListFooter}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
      }
      renderItem={({ item: m }) => {
        const isOpen = expanded.has(m.id);
        const isResolved = m.status === 'resolved' || m.status === 'closed';

        return (
          <View style={st.msgCard}>
            {/* Clickable header */}
            <Pressable
              style={({ pressed }) => [st.msgHeader, pressed && { opacity: 0.8 }]}
              onPress={() => toggleExpand(m.id)}
            >
              <View style={st.msgIconWrap}>
                <MessageSquare color={colors.primary} size={14} />
              </View>

              <View style={{ flex: 1, gap: 2 }}>
                <View style={st.msgTopRow}>
                  <Text style={st.msgEmail} numberOfLines={1}>{m.email}</Text>
                  <StatusBadge status={m.status} />
                </View>
                <Text style={st.msgSubject} numberOfLines={1}>{m.subject}</Text>
                <Text style={st.msgDate}>{fmt(m.createdAt)}</Text>
              </View>

              {isOpen
                ? <ChevronUp color={colors.textDim} size={16} />
                : <ChevronDown color={colors.textDim} size={16} />}
            </Pressable>

            {/* Expanded content */}
            {isOpen && (
              <View style={st.msgBody}>
                <Text style={st.msgText}>{m.message}</Text>

                {replyId === m.id ? (
                  <View style={st.replyBox}>
                    <TextInput
                      style={st.replyInput}
                      value={replyText}
                      onChangeText={setReplyText}
                      placeholder="Rédigez votre réponse…"
                      placeholderTextColor={colors.textDim}
                      multiline
                      numberOfLines={4}
                      textAlignVertical="top"
                    />
                    <View style={st.replyActions}>
                      <Pressable
                        style={[st.replyBtn, st.replyBtnGhost]}
                        onPress={() => setReplyId(null)}
                      >
                        <Text style={st.replyBtnGhostText}>Annuler</Text>
                      </Pressable>
                      <Pressable
                        style={[st.replyBtn, st.replyBtnPrimary, (!replyText.trim() || replying) && { opacity: 0.5 }]}
                        onPress={() => sendReply(m.id)}
                        disabled={!replyText.trim() || replying}
                      >
                        <Send color="#fff" size={13} />
                        <Text style={st.replyBtnPrimaryText}>{replying ? 'Envoi…' : 'Envoyer'}</Text>
                      </Pressable>
                    </View>
                  </View>
                ) : (
                  <View style={st.msgActions}>
                    <Pressable style={st.actionLink} onPress={() => openReply(m.id)}>
                      <Text style={st.actionLinkText}>Répondre</Text>
                    </Pressable>
                    {!isResolved && (
                      <Pressable style={st.actionLink} onPress={() => markResolved(m.id)}>
                        <Text style={[st.actionLinkText, { color: colors.success }]}>Marquer résolu</Text>
                      </Pressable>
                    )}
                  </View>
                )}
              </View>
            )}
          </View>
        );
      }}
    />
  );
}

const st = StyleSheet.create({
  list: { backgroundColor: colors.background },
  content: { padding: spacing.screen, paddingBottom: 48 },

  listHeader: { gap: 16, marginBottom: 6 },

  pageHeader: { gap: 6 },
  eyebrowBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderColor: 'rgba(59,130,246,0.25)',
    backgroundColor: 'rgba(59,130,246,0.10)',
    borderRadius: radius.full,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  eyebrowText: { color: colors.primary, fontSize: 9, fontWeight: '700', letterSpacing: 1.4 },
  pageTitle: { color: colors.text, fontSize: 26, fontWeight: '900', letterSpacing: -0.5 },
  pageDesc: { color: colors.textMuted, fontSize: 13, lineHeight: 20 },

  tableHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  tableHeaderText: { color: colors.textMuted, fontSize: 12, fontWeight: '600' },
  pendingBadge: {
    backgroundColor: 'rgba(245,158,11,0.10)',
    borderWidth: 1,
    borderColor: 'rgba(245,158,11,0.20)',
    borderRadius: radius.sm,
    paddingHorizontal: 7,
    paddingVertical: 2,
  },
  pendingText: { color: colors.warning, fontSize: 10, fontWeight: '700' },

  loadWrap: { paddingVertical: 40, alignItems: 'center' },
  empty: { alignItems: 'center', gap: 10, paddingVertical: 48 },
  emptyTitle: { color: colors.text, fontSize: 16, fontWeight: '700' },

  msgCard: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    overflow: 'hidden',
    marginBottom: 10,
  },
  msgHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
  },
  msgIconWrap: {
    width: 34,
    height: 34,
    borderRadius: radius.md,
    backgroundColor: 'rgba(59,130,246,0.10)',
    borderWidth: 1,
    borderColor: 'rgba(59,130,246,0.20)',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  msgTopRow: { flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' },
  msgEmail: { color: colors.primary, fontSize: 13, fontWeight: '600', flex: 1 },
  msgSubject: { color: colors.text, fontSize: 14, fontWeight: '700' },
  msgDate: { color: colors.textDim, fontSize: 11 },

  msgBody: {
    borderTopWidth: 1,
    borderTopColor: colors.borderSubtle,
    padding: 14,
    gap: 12,
  },
  msgText: { color: colors.textSecondary, fontSize: 13, lineHeight: 20 },

  msgActions: {
    flexDirection: 'row',
    gap: 16,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: colors.borderSubtle,
  },
  actionLink: { paddingVertical: 4 },
  actionLinkText: { color: colors.primary, fontSize: 13, fontWeight: '600' },

  replyBox: { gap: 10 },
  replyInput: {
    backgroundColor: colors.surfaceHigh,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: colors.text,
    fontSize: 13,
    minHeight: 90,
    textAlignVertical: 'top',
  },
  replyActions: { flexDirection: 'row', gap: 10 },
  replyBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: radius.md,
    borderWidth: 1,
  },
  replyBtnGhost: { borderColor: colors.border, backgroundColor: 'transparent' },
  replyBtnGhostText: { color: colors.textMuted, fontSize: 13, fontWeight: '600' },
  replyBtnPrimary: { backgroundColor: colors.primary, borderColor: colors.primary },
  replyBtnPrimaryText: { color: '#fff', fontSize: 13, fontWeight: '700' },

  pagination: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 20,
    paddingTop: 20,
  },
  pageBtn: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: radius.md,
  },
  pageBtnDisabled: { opacity: 0.4 },
  pageBtnText: { color: colors.text, fontSize: 16 },
  pageInfo: { color: colors.textMuted, fontSize: 13 },
});
