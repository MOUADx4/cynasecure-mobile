import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Database, Fingerprint, Trash2, Users } from 'lucide-react-native';

import { adminApi, type AdminUser, type Paginated } from '../../api/admin';
import { colors, radius, spacing } from '../../theme/colors';

function fmt(iso: string) {
  try { return new Date(iso).toLocaleDateString('fr-FR'); } catch { return iso; }
}

function initials(u: AdminUser): string {
  if (u.displayName) {
    const parts = u.displayName.trim().split(' ');
    return (parts[0][0] + (parts[1]?.[0] ?? '')).toUpperCase();
  }
  return u.email[0].toUpperCase();
}

function RoleBadge({ roles }: { roles?: string[] }) {
  const isAdmin = (roles ?? []).includes('ROLE_ADMIN');
  return (
    <View style={[st.badge, isAdmin ? st.badgeBlue : st.badgeGray]}>
      <Text style={[st.badgeText, { color: isAdmin ? colors.primary : colors.textDim }]}>
        {isAdmin ? 'ADMIN' : 'USER'}
      </Text>
    </View>
  );
}

export function AdminUsersScreen() {
  const [data, setData] = useState<Paginated<AdminUser> | null>(null);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = (p = 1) =>
    adminApi.getUsers(p).then(res => setData(res)).catch(() => {});

  useEffect(() => {
    setLoading(true);
    load(page).finally(() => setLoading(false));
  }, [page]);

  const onRefresh = () => {
    setRefreshing(true);
    load(page).finally(() => setRefreshing(false));
  };

  const remove = (id: number, email: string) => {
    Alert.alert('Supprimer cet utilisateur ?', email, [
      { text: 'Annuler', style: 'cancel' },
      {
        text: 'Supprimer',
        style: 'destructive',
        onPress: async () => {
          try {
            await adminApi.deleteUser(id);
            load(page);
          } catch (e: any) {
            Alert.alert('Erreur', e?.message ?? '');
          }
        },
      },
    ]);
  };

  const items = data?.items ?? [];
  const total = data?.total ?? 0;

  const ListHeader = (
    <View style={st.listHeader}>
      <View style={st.pageHeader}>
        <View style={st.eyebrowBadge}>
          <Fingerprint color={colors.primary} size={10} />
          <Text style={st.eyebrowText}>GESTION DES UTILISATEURS</Text>
        </View>
        <Text style={st.pageTitle}>Utilisateurs</Text>
        <Text style={st.pageDesc}>Gérez les comptes utilisateurs de la plateforme.</Text>
      </View>

      <View style={st.tableHeader}>
        <Database color={colors.textDim} size={13} />
        <Text style={st.tableHeaderText}>{total} utilisateur{total > 1 ? 's' : ''}</Text>
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
      keyExtractor={u => String(u.id)}
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
            <Users color={colors.textDim} size={40} strokeWidth={1.5} />
            <Text style={st.emptyTitle}>Aucun utilisateur</Text>
          </View>
        )
      }
      ListFooterComponent={ListFooter}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
      }
      renderItem={({ item: u }) => (
        <View style={st.userCard}>
          <View style={st.avatar}>
            <Text style={st.avatarText}>{initials(u)}</Text>
          </View>

          <View style={{ flex: 1, gap: 3 }}>
            <View style={st.nameRow}>
              <Text style={st.name} numberOfLines={1}>{u.displayName || u.email}</Text>
              <RoleBadge roles={u.roles} />
              {!u.emailVerifiedAt && (
                <View style={st.unverifiedBadge}>
                  <Text style={st.unverifiedText}>Non vérifié</Text>
                </View>
              )}
            </View>
            <Text style={st.email} numberOfLines={1}>{u.email}</Text>
            {u.createdAt && <Text style={st.date}>Inscrit le {fmt(u.createdAt)}</Text>}
          </View>

          <Pressable
            onPress={() => remove(u.id, u.email)}
            style={({ pressed }) => [st.deleteBtn, pressed && { opacity: 0.6 }]}
          >
            <Trash2 color={colors.danger} size={16} />
          </Pressable>
        </View>
      )}
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

  loadWrap: { paddingVertical: 40, alignItems: 'center' },
  empty: { alignItems: 'center', gap: 10, paddingVertical: 48 },
  emptyTitle: { color: colors.text, fontSize: 16, fontWeight: '700' },

  userCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderSubtle,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: radius.full,
    backgroundColor: 'rgba(59,130,246,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  avatarText: { color: colors.primary, fontSize: 14, fontWeight: '800' },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' },
  name: { color: colors.text, fontSize: 14, fontWeight: '700' },
  email: { color: colors.textSecondary, fontSize: 12 },
  date: { color: colors.textDim, fontSize: 11 },
  deleteBtn: { padding: 8, flexShrink: 0 },

  badge: { paddingHorizontal: 7, paddingVertical: 2, borderRadius: radius.sm, borderWidth: 1 },
  badgeBlue: { backgroundColor: 'rgba(59,130,246,0.10)', borderColor: 'rgba(59,130,246,0.20)' },
  badgeGray: { backgroundColor: 'rgba(107,114,128,0.10)', borderColor: 'rgba(107,114,128,0.20)' },
  badgeText: { fontSize: 9, fontWeight: '700', letterSpacing: 0.5 },

  unverifiedBadge: {
    backgroundColor: 'rgba(245,158,11,0.10)',
    borderColor: 'rgba(245,158,11,0.20)',
    borderWidth: 1,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: radius.sm,
  },
  unverifiedText: { color: colors.warning, fontSize: 9, fontWeight: '700' },

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
