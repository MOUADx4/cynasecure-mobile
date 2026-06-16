import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
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
  CreditCard,
  Database,
  ShieldAlert,
  ShieldX,
  TrendingUp,
  User,
  XCircle,
} from 'lucide-react-native';

import { adminApi, type AdminPayment } from '../../api/admin';
import { colors, radius, spacing } from '../../theme/colors';

function fmt(iso: string) {
  try {
    return new Date(iso).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' });
  } catch {
    return iso;
  }
}

function fmtShort(iso: string) {
  try {
    return new Date(iso).toLocaleDateString('fr-FR');
  } catch {
    return iso;
  }
}

function userName(p: AdminPayment) {
  if (!p.user) return '—';
  if (p.user.displayName) return p.user.displayName;
  if (p.user.firstName || p.user.lastName) return `${p.user.firstName ?? ''} ${p.user.lastName ?? ''}`.trim();
  return p.user.email;
}

type RiskFilter = 'all' | 'review' | 'blocked';

// Stat card
function StatCard({ label, value, icon: Icon }: { label: string; value: string | number; icon: React.ElementType }) {
  return (
    <View style={st.statCard}>
      <View style={st.statCardTop}>
        <Text style={st.statLabel}>{label}</Text>
        <Icon color={colors.primary} size={18} />
      </View>
      <Text style={st.statValue}>{value}</Text>
    </View>
  );
}

// Status badge
function StatusBadge({ status }: { status: string }) {
  const s = status.toUpperCase();
  const paid = s === 'PAID' || s === 'SUCCEEDED';
  const failed = s === 'FAILED';
  return (
    <View style={[st.badge, paid ? st.badgeGreen : failed ? st.badgeRed : st.badgeYellow]}>
      <Text style={[st.badgeText, paid ? { color: colors.success } : failed ? { color: colors.danger } : { color: colors.warning }]}>
        {s}
      </Text>
    </View>
  );
}

// Fraud badge
function FraudBadge({ fraud }: { fraud: NonNullable<AdminPayment['fraud']> }) {
  if (fraud.level === 'ok') return null;
  const blocked = fraud.level === 'blocked';
  return (
    <View style={[st.badge, blocked ? st.badgeRed : st.badgeAmber]}>
      {blocked
        ? <ShieldX color={colors.danger} size={10} />
        : <ShieldAlert color={colors.warning} size={10} />}
      <Text style={[st.badgeText, { color: blocked ? colors.danger : colors.warning }]}>
        {blocked ? 'BLOQUÉ' : 'REVUE'}
      </Text>
    </View>
  );
}

// Payment row card
function PaymentCard({ item }: { item: AdminPayment }) {
  const dateStr = item.paidAt ? fmtShort(item.paidAt) : fmt(item.createdAt);

  return (
    <View style={st.payCard}>
      {/* Top row: user + amount */}
      <View style={st.payTop}>
        <View style={st.payUserBlock}>
          <View style={st.payUserIcon}>
            <User color={colors.primary} size={13} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={st.payUserName} numberOfLines={1}>{userName(item)}</Text>
            {item.user?.email && item.user.email !== userName(item) && (
              <Text style={st.payUserEmail} numberOfLines={1}>{item.user.email}</Text>
            )}
          </View>
        </View>
        <Text style={st.payAmount}>{item.amount.toFixed(2)} €</Text>
      </View>

      {/* Service + cycle */}
      {(item.service || item.cycle) && (
        <View style={st.payMeta}>
          {item.service && (
            <View style={st.payMetaItem}>
              <Activity color={colors.primary} size={11} />
              <Text style={st.payMetaText} numberOfLines={1}>{item.service.name}</Text>
            </View>
          )}
          {item.cycle && (
            <Text style={st.payMetaText}>· {item.cycle}</Text>
          )}
        </View>
      )}

      {/* Bottom: date + badges */}
      <View style={st.payBottom}>
        <View style={st.payDateBlock}>
          <Calendar color={colors.textDim} size={11} />
          <Text style={st.payDate}>{dateStr}</Text>
        </View>
        <View style={st.payBadges}>
          <StatusBadge status={item.status} />
          {item.fraud && item.fraud.level !== 'ok' && <FraudBadge fraud={item.fraud} />}
        </View>
      </View>
    </View>
  );
}

// Main screen
export function AdminPaymentsScreen() {
  const [items, setItems] = useState<AdminPayment[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [riskFilter, setRiskFilter] = useState<RiskFilter>('all');
  const [stats, setStats] = useState<{
    totalPaid: number;
    failed: number;
    pending: number;
    lastPayment: string;
  } | null>(null);

  const load = (p: number, initial = false) => {
    if (!initial) setLoading(true);
    return adminApi.getPayments(p)
      .then(data => {
        setItems(data.items);
        setTotal(data.total);
        setTotalPages(data.totalPages);
        if (initial || !stats) {
          const paid = data.items.filter(x => x.status.toUpperCase() === 'PAID' || x.status.toUpperCase() === 'SUCCEEDED');
          const totalPaid = paid.reduce((s, x) => s + x.amount, 0);
          const failed = data.items.filter(x => x.status.toUpperCase() === 'FAILED').length;
          const pending = data.items.filter(x => x.status.toUpperCase() === 'PENDING').length;
          const firstDate = data.items[0]?.paidAt ?? data.items[0]?.createdAt;
          setStats({ totalPaid, failed, pending, lastPayment: firstDate ? fmtShort(firstDate) : '—' });
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

  const displayed = riskFilter === 'all'
    ? items
    : items.filter(p => p.fraud?.level === riskFilter);

  const RISK_FILTERS: { key: RiskFilter; label: string }[] = [
    { key: 'all', label: 'Tous' },
    { key: 'review', label: 'À vérifier' },
    { key: 'blocked', label: 'Bloqués' },
  ];

  const ListHeader = (
    <View style={st.listHeader}>
      {/* Page header */}
      <View style={st.pageHeader}>
        <View style={st.eyebrowBadge}>
          <CreditCard color={colors.primary} size={11} />
          <Text style={st.eyebrowText}>GESTION DES PAIEMENTS</Text>
        </View>
        <Text style={st.pageTitle}>Paiements</Text>
        <Text style={st.pageDesc}>
          Suivi des transactions, paiements réussis, échoués et revenus encaissés.
        </Text>
      </View>

      {/* Stat cards */}
      {stats && (
        <View style={st.statsGrid}>
          <StatCard label="Total encaissé" value={`${stats.totalPaid.toLocaleString('fr-FR')} €`} icon={TrendingUp} />
          <StatCard label="Échecs" value={stats.failed} icon={XCircle} />
          <StatCard label="En attente" value={stats.pending} icon={Calendar} />
          <StatCard label="Dernier paiement" value={stats.lastPayment} icon={CheckCircle} />
        </View>
      )}

      {/* Table header */}
      <View style={st.tableHeader}>
        <View style={st.tableHeaderLeft}>
          <Database color={colors.primary} size={16} />
          <Text style={st.tableHeaderTitle}>Historique des paiements</Text>
        </View>
        <View style={st.riskFilters}>
          {RISK_FILTERS.map(f => {
            const active = riskFilter === f.key;
            const activeStyle = active
              ? f.key === 'blocked' ? st.riskBtnRed
              : f.key === 'review' ? st.riskBtnAmber
              : st.riskBtnBlue
              : st.riskBtnOff;
            const activeTextStyle = active
              ? f.key === 'blocked' ? { color: colors.danger }
              : f.key === 'review' ? { color: colors.warning }
              : { color: colors.primary }
              : {};
            return (
              <Pressable
                key={f.key}
                style={[st.riskBtn, activeStyle]}
                onPress={() => setRiskFilter(f.key)}
              >
                <Text style={[st.riskBtnText, activeTextStyle]}>{f.label}</Text>
              </Pressable>
            );
          })}
        </View>
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
      <Text style={st.pageTotal}>{total} résultat{total > 1 ? 's' : ''}</Text>
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
      <CreditCard color={colors.textDim} size={36} />
      <Text style={st.emptyText}>Aucun paiement trouvé.</Text>
    </View>
  ) : null;

  return (
    <FlatList
      style={st.list}
      contentContainerStyle={st.content}
      data={displayed}
      keyExtractor={p => String(p.id)}
          removeClippedSubviews
          maxToRenderPerBatch={5}
          windowSize={8}
          initialNumToRender={8}
      renderItem={({ item }) => <PaymentCard item={item} />}
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
  statLabel: {
    color: colors.textMuted,
    fontSize: 11,
    fontWeight: '500',
  },
  statValue: { color: colors.text, fontSize: 22, fontWeight: '900' },

  // Table header
  tableHeader: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  tableHeaderLeft: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8 },
  tableHeaderTitle: { color: colors.text, fontSize: 13, fontWeight: '700' },
  riskFilters: { flexDirection: 'row', gap: 6 },
  riskBtn: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderWidth: 1,
    borderRadius: radius.sm,
  },
  riskBtnOff: { borderColor: colors.border, backgroundColor: 'transparent' },
  riskBtnBlue: { backgroundColor: 'rgba(59,130,246,0.10)', borderColor: 'rgba(59,130,246,0.30)' },
  riskBtnAmber: { backgroundColor: 'rgba(245,158,11,0.10)', borderColor: 'rgba(245,158,11,0.30)' },
  riskBtnRed: { backgroundColor: 'rgba(239,68,68,0.10)', borderColor: 'rgba(239,68,68,0.30)' },
  riskBtnText: { color: colors.textMuted, fontSize: 10, fontWeight: '700', letterSpacing: 0.3 },

  loadingRow: { paddingVertical: 24, alignItems: 'center' },

  // Payment card
  payCard: {
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderSubtle,
    paddingHorizontal: spacing.screen,
    paddingVertical: 14,
    gap: 8,
  },
  payTop: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  payUserBlock: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8 },
  payUserIcon: {
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
  payUserName: { color: colors.text, fontSize: 13, fontWeight: '600' },
  payUserEmail: { color: colors.textMuted, fontSize: 11, marginTop: 1 },
  payAmount: { color: colors.text, fontSize: 15, fontWeight: '800', flexShrink: 0 },

  payMeta: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  payMetaItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  payMetaText: { color: colors.textMuted, fontSize: 11 },

  payBottom: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  payDateBlock: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  payDate: { color: colors.textDim, fontSize: 11 },
  payBadges: { flexDirection: 'row', alignItems: 'center', gap: 6 },

  // Badges
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radius.sm,
    borderWidth: 1,
  },
  badgeGreen: {
    backgroundColor: 'rgba(16,185,129,0.10)',
    borderColor: 'rgba(16,185,129,0.20)',
  },
  badgeRed: {
    backgroundColor: 'rgba(239,68,68,0.10)',
    borderColor: 'rgba(239,68,68,0.20)',
  },
  badgeYellow: {
    backgroundColor: 'rgba(245,158,11,0.10)',
    borderColor: 'rgba(245,158,11,0.20)',
  },
  badgeAmber: {
    backgroundColor: 'rgba(245,158,11,0.10)',
    borderColor: 'rgba(245,158,11,0.20)',
  },
  badgeText: { fontSize: 9, fontWeight: '800', letterSpacing: 0.5 },

  // Empty state
  empty: { alignItems: 'center', gap: 10, paddingVertical: 60 },
  emptyText: { color: colors.textMuted, fontSize: 13 },

  // Pagination
  pagination: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
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
  pageTotal: { color: colors.textMuted, fontSize: 12 },
});
