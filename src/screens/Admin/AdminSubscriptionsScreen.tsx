import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Linking,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import {
  Activity,
  Calendar,
  CheckCircle,
  Database,
  Download,
  Radar,
  TrendingUp,
  User,
  XCircle,
} from 'lucide-react-native';

import { adminApi, type AdminSubscription } from '../../api/admin';
import { checkoutApi } from '../../api/checkout';
import { colors, radius, spacing } from '../../theme/colors';

function fmt(iso?: string | null) {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' });
  } catch {
    return iso;
  }
}

function fmtShort(iso?: string | null) {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleDateString('fr-FR');
  } catch {
    return iso;
  }
}

function displayName(u: AdminSubscription['user']) {
  if (u.displayName) return u.displayName;
  return `${u.firstName} ${u.lastName}`.trim() || u.email;
}

// Stat card
function StatCard({ label, value, icon: Icon }: { label: string; value: string | number; icon: React.ElementType }) {
  return (
    <View style={st.statCard}>
      <View style={st.statCardTop}>
        <Text style={st.statLabel}>{label}</Text>
        <Icon color={colors.primary} size={18} />
      </View>
      <Text style={st.statValue} numberOfLines={1} adjustsFontSizeToFit>{value}</Text>
    </View>
  );
}

// Status badge
function StatusBadge({ status }: { status: string }) {
  const active = status === 'ACTIVE';
  return (
    <View style={[st.badge, active ? st.badgeGreen : st.badgeGray]}>
      <Text style={[st.badgeText, { color: active ? colors.success : colors.textMuted }]}>
        {status}
      </Text>
    </View>
  );
}

// Subscription row card
function SubCard({ item, onCancel }: { item: AdminSubscription; onCancel: (id: number) => void }) {
  const openInvoice = () => {
    if (!item.invoicePaymentId) return;
    const url = checkoutApi.invoiceUrl(item.invoicePaymentId);
    Linking.openURL(url).catch(() => {});
  };

  return (
    <View style={st.subCard}>
      {/* Top: user + status */}
      <View style={st.subTop}>
        <View style={st.subUserBlock}>
          <View style={st.subUserIcon}>
            <User color={colors.primary} size={13} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={st.subUserName} numberOfLines={1}>{displayName(item.user)}</Text>
            <Text style={st.subUserEmail} numberOfLines={1}>{item.user.email}</Text>
          </View>
        </View>
        <StatusBadge status={item.status} />
      </View>

      {/* Service */}
      <View style={st.subServiceRow}>
        <Activity color={colors.primary} size={12} />
        <Text style={st.subService} numberOfLines={1}>{item.service.name}</Text>
      </View>

      {/* Meta: cycle + prix */}
      <View style={st.subMetaRow}>
        <View style={st.subMetaChip}>
          <Text style={st.subMetaChipText}>{item.cycle}</Text>
        </View>
        <Text style={st.subPrice}>{item.price.toFixed(2)} €</Text>
      </View>

      {/* Dates */}
      <View style={st.subDates}>
        <View style={st.subDateItem}>
          <Calendar color={colors.textDim} size={11} />
          <Text style={st.subDateLabel}>Début</Text>
          <Text style={st.subDateVal}>{fmtShort(item.startDate)}</Text>
        </View>
        <View style={st.subDateSep} />
        <View style={st.subDateItem}>
          <Calendar color={colors.textDim} size={11} />
          <Text style={st.subDateLabel}>Prochaine facture</Text>
          <Text style={st.subDateVal}>{fmtShort(item.nextBillingAt)}</Text>
        </View>
      </View>

      {/* Actions */}
      {(item.status === 'ACTIVE' || item.invoicePaymentId) && (
        <View style={st.subActions}>
          {item.invoicePaymentId ? (
            <Pressable
              style={({ pressed }) => [st.invoiceBtn, pressed && { opacity: 0.7 }]}
              onPress={openInvoice}
            >
              <Download color={colors.primary} size={13} />
              <Text style={st.invoiceBtnText}>PDF</Text>
            </Pressable>
          ) : (
            <View />
          )}
          {item.status === 'ACTIVE' && (
            <Pressable
              style={({ pressed }) => [st.cancelBtn, pressed && { opacity: 0.7 }]}
              onPress={() => onCancel(item.id)}
            >
              <Text style={st.cancelBtnText}>Résilier</Text>
            </Pressable>
          )}
        </View>
      )}
    </View>
  );
}

// Main screen
export function AdminSubscriptionsScreen() {
  const [items, setItems] = useState<AdminSubscription[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState<{
    active: number;
    expired: number;
    mrr: number;
    cycle: string;
  } | null>(null);

  const load = (p: number, computeStats = false) => {
    if (!computeStats) setLoading(true);
    return adminApi.getSubscriptions(p)
      .then(data => {
        setItems(data.items);
        setTotal(data.total);
        setTotalPages(data.totalPages);
        if (computeStats || !stats) {
          const active = data.items.filter(s => s.status === 'ACTIVE').length;
          const expired = data.items.filter(s => s.status !== 'ACTIVE').length;
          const mrr = data.items.filter(s => s.status === 'ACTIVE').reduce((sum, s) => sum + s.price, 0);
          const cycles = data.items.reduce<Record<string, number>>((acc, s) => {
            acc[s.cycle] = (acc[s.cycle] || 0) + 1;
            return acc;
          }, {});
          const topCycle = Object.keys(cycles).length
            ? Object.entries(cycles).sort((a, b) => b[1] - a[1])[0][0]
            : '—';
          setStats({ active, expired, mrr, cycle: topCycle });
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load(page, page === 1);
  }, [page]);

  const onRefresh = () => {
    setRefreshing(true);
    load(1, true).finally(() => setRefreshing(false));
  };

  const cancel = (id: number) => {
    Alert.alert(
      'Résilier l\'abonnement',
      'Confirmer la résiliation de cet abonnement ?',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Résilier',
          style: 'destructive',
          onPress: async () => {
            try {
              await adminApi.cancelSubscription(id);
              load(page);
            } catch (e: any) {
              Alert.alert('Erreur', e?.message ?? 'Une erreur est survenue.');
            }
          },
        },
      ],
    );
  };

  const ListHeader = (
    <View style={st.listHeader}>
      {/* Page header */}
      <View style={st.pageHeader}>
        <View style={st.eyebrowBadge}>
          <Radar color={colors.primary} size={11} />
          <Text style={st.eyebrowText}>GESTION DES ABONNEMENTS</Text>
        </View>
        <Text style={st.pageTitle}>Abonnements</Text>
        <Text style={st.pageDesc}>
          Suivi complet des abonnements actifs, expirés, cycles et revenus récurrents.
        </Text>
      </View>

      {/* Stat cards 2×2 */}
      {stats && (
        <View style={st.statsGrid}>
          <StatCard label="Actifs" value={stats.active} icon={CheckCircle} />
          <StatCard label="Expirés / Annulés" value={stats.expired} icon={XCircle} />
          <StatCard label="MRR" value={`${stats.mrr.toLocaleString('fr-FR')} €`} icon={TrendingUp} />
          <StatCard label="Cycle dominant" value={stats.cycle} icon={Calendar} />
        </View>
      )}

      {/* Table header */}
      <View style={st.tableHeader}>
        <Database color={colors.primary} size={16} />
        <Text style={st.tableHeaderTitle}>Liste des abonnements</Text>
        {total > 0 && <Text style={st.tableCount}>{total} résultat{total > 1 ? 's' : ''}</Text>}
      </View>

      {loading && (
        <View style={st.loadingRow}>
          <ActivityIndicator color={colors.primary} />
        </View>
      )}
    </View>
  );

  const ListFooter = totalPages > 1 ? (
    <View style={st.pagination}>
      <Pressable
        style={[st.pageBtn, page <= 1 && st.pageBtnDisabled]}
        onPress={() => setPage(p => Math.max(1, p - 1))}
        disabled={page <= 1}
      >
        <Text style={st.pageBtnText}>←</Text>
      </Pressable>
      <Text style={st.pageInfo}>Page {page} / {totalPages}</Text>
      <Pressable
        style={[st.pageBtn, page >= totalPages && st.pageBtnDisabled]}
        onPress={() => setPage(p => Math.min(totalPages, p + 1))}
        disabled={page >= totalPages}
      >
        <Text style={st.pageBtnText}>→</Text>
      </Pressable>
    </View>
  ) : null;

  const ListEmpty = !loading ? (
    <View style={st.empty}>
      <Radar color={colors.textDim} size={36} />
      <Text style={st.emptyText}>Aucun abonnement trouvé.</Text>
    </View>
  ) : null;

  return (
    <FlatList
      style={st.list}
      contentContainerStyle={st.content}
      data={items}
      keyExtractor={s => String(s.id)}
          removeClippedSubviews
          maxToRenderPerBatch={5}
          windowSize={8}
          initialNumToRender={8}
      renderItem={({ item }) => <SubCard item={item} onCancel={cancel} />}
      ListHeaderComponent={ListHeader}
      ListFooterComponent={ListFooter}
      ListEmptyComponent={ListEmpty}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
      }
    />
  );
}

const st = StyleSheet.create({
  list: { backgroundColor: colors.background },
  content: { paddingBottom: 48 },

  listHeader: { padding: spacing.screen, gap: 16, paddingBottom: 8 },

  // Page header
  pageHeader: { gap: 6 },
  eyebrowBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderColor: 'rgba(59,130,246,0.30)',
    backgroundColor: 'rgba(59,130,246,0.10)',
    borderRadius: radius.full,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  eyebrowText: {
    color: colors.primary,
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 1.4,
  },
  pageTitle: { color: colors.text, fontSize: 26, fontWeight: '900', letterSpacing: -0.5 },
  pageDesc: { color: colors.textMuted, fontSize: 13, lineHeight: 20 },

  // Stats grid 2×2
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  statCard: {
    flex: 1,
    minWidth: '46%',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    padding: 16,
    gap: 10,
  },
  statCardTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  statLabel: { color: colors.textMuted, fontSize: 11, fontWeight: '500', flex: 1 },
  statValue: { color: colors.text, fontSize: 22, fontWeight: '900' },

  // Table header
  tableHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    padding: 16,
  },
  tableHeaderTitle: { flex: 1, color: colors.text, fontSize: 13, fontWeight: '700' },
  tableCount: { color: colors.textMuted, fontSize: 12 },

  loadingRow: { paddingVertical: 24, alignItems: 'center' },

  // Sub card
  subCard: {
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderSubtle,
    paddingHorizontal: spacing.screen,
    paddingVertical: 16,
    gap: 10,
  },

  subTop: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  subUserBlock: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8 },
  subUserIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(59,130,246,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(59,130,246,0.20)',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  subUserName: { color: colors.text, fontSize: 13, fontWeight: '600' },
  subUserEmail: { color: colors.textMuted, fontSize: 11, marginTop: 1 },

  subServiceRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  subService: { color: colors.textSecondary, fontSize: 13, flex: 1 },

  subMetaRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  subMetaChip: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.sm,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  subMetaChipText: { color: colors.textMuted, fontSize: 11, fontWeight: '600' },
  subPrice: { color: colors.text, fontSize: 14, fontWeight: '800' },

  subDates: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    borderRadius: radius.md,
    padding: 10,
    gap: 0,
  },
  subDateItem: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 5, flexWrap: 'wrap' },
  subDateSep: { width: 1, height: 28, backgroundColor: colors.borderSubtle, marginHorizontal: 10 },
  subDateLabel: { color: colors.textDim, fontSize: 10 },
  subDateVal: { color: colors.textSecondary, fontSize: 11, fontWeight: '600' },

  subActions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 4,
    borderTopWidth: 1,
    borderTopColor: colors.borderSubtle,
  },
  invoiceBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: 'rgba(59,130,246,0.30)',
    borderRadius: radius.sm,
    backgroundColor: 'rgba(59,130,246,0.08)',
  },
  invoiceBtnText: { color: colors.primary, fontSize: 12, fontWeight: '700', letterSpacing: 0.5 },
  cancelBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: 'rgba(239,68,68,0.25)',
    backgroundColor: 'rgba(239,68,68,0.08)',
  },
  cancelBtnText: { color: colors.danger, fontSize: 12, fontWeight: '600' },

  // Badge
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radius.sm,
    borderWidth: 1,
    flexShrink: 0,
  },
  badgeGreen: { backgroundColor: 'rgba(16,185,129,0.10)', borderColor: 'rgba(16,185,129,0.20)' },
  badgeGray: { backgroundColor: 'rgba(107,114,128,0.10)', borderColor: 'rgba(107,114,128,0.20)' },
  badgeText: { fontSize: 9, fontWeight: '800', letterSpacing: 0.5 },

  // Empty
  empty: { alignItems: 'center', gap: 10, paddingVertical: 60 },
  emptyText: { color: colors.textMuted, fontSize: 13 },

  // Pagination
  pagination: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
    paddingHorizontal: spacing.screen,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: colors.borderSubtle,
  },
  pageBtn: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: radius.md,
  },
  pageBtnDisabled: { opacity: 0.35 },
  pageBtnText: { color: colors.text, fontSize: 16, fontWeight: '700' },
  pageInfo: { color: colors.text, fontSize: 13, fontWeight: '600' },
});
