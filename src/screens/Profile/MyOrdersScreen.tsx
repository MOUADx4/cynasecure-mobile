import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import {
  ChevronDown,
  ChevronUp,
  FileText,
  Filter,
  Package,
  Search,
  Shield,
  ShoppingBag,
} from 'lucide-react-native';

import { ordersApi, type Order } from '../../api/subscriptions';
import { downloadInvoice } from '../../utils/downloadInvoice';
import { colors, radius, spacing } from '../../theme/colors';

function fmt(iso: string) {
  try {
    return new Date(iso).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' });
  } catch { return iso; }
}

function statusLabel(s: string) {
  const map: Record<string, string> = {
    PAID: 'Payée', PENDING: 'En cours', FAILED: 'Échouée',
    REFUNDED: 'Remboursée', COMPLETED: 'Complété', CANCELLED: 'Annulé',
  };
  return map[s.toUpperCase()] ?? s;
}

function StatusChip({ status }: { status: string }) {
  const s = status.toUpperCase();
  const paid = s === 'PAID' || s === 'COMPLETED';
  const failed = s === 'FAILED' || s === 'CANCELLED';
  const style = paid ? st.chipGreen : failed ? st.chipRed : st.chipAmber;
  const textColor = paid ? colors.success : failed ? colors.danger : colors.warning;
  return (
    <View style={[st.chip, style]}>
      <Text style={[st.chipText, { color: textColor }]}>{statusLabel(status)}</Text>
    </View>
  );
}

const currentYear = new Date().getFullYear();
const YEARS = ['', ...Array.from({ length: 5 }, (_, i) => String(currentYear - i))];
const STATUS_FILTERS = [
  { key: '', label: 'Tous' },
  { key: 'PAID', label: 'Payée' },
  { key: 'PENDING', label: 'En cours' },
  { key: 'CANCELLED', label: 'Annulé' },
];

export function MyOrdersScreen() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [q, setQ] = useState('');
  const [year, setYear] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [expanded, setExpanded] = useState<Set<number>>(new Set());

  const load = (filters: { year?: string; q?: string } = {}) => {
    return ordersApi
      .list({ year: filters.year ? Number(filters.year) : undefined, q: filters.q })
      .then(setOrders)
      .catch(() => setOrders([]));
  };

  useEffect(() => {
    setLoading(true);
    load({ year, q }).finally(() => setLoading(false));
  }, [year, q]);

  const onRefresh = () => {
    setRefreshing(true);
    load({ year, q }).finally(() => setRefreshing(false));
  };

  const toggleExpand = (id: number) => {
    setExpanded(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const filtered = statusFilter
    ? orders.filter(o => o.status.toUpperCase() === statusFilter)
    : orders;

  const grouped: Record<number, Order[]> = {};
  for (const o of filtered) {
    const y = o.year ?? new Date(o.createdAt).getFullYear();
    if (!grouped[y]) grouped[y] = [];
    grouped[y].push(o);
  }
  const sortedYears = Object.keys(grouped).map(Number).sort((a, b) => b - a);

  return (
    <ScrollView
      style={st.scroll}
      contentContainerStyle={st.content}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
      }
    >
      {/* Header */}
      <View style={st.pageHeader}>
        <View style={st.eyebrowBadge}>
          <Shield color={colors.primary} size={10} />
          <Text style={st.eyebrowText}>HISTORIQUE</Text>
        </View>
        <Text style={st.pageTitle}>Mes commandes</Text>
        <Text style={st.pageDesc}>
          Consultez vos commandes passées et téléchargez vos factures.
        </Text>
      </View>

      {/* Filters */}
      <View style={st.filters}>
        {/* Search */}
        <View style={st.searchWrap}>
          <Search color={colors.textDim} size={14} />
          <TextInput
            style={st.searchInput}
            placeholder="Rechercher un service…"
            placeholderTextColor={colors.textDim}
            value={q}
            onChangeText={setQ}
            returnKeyType="search"
          />
        </View>

        {/* Year chips */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={st.chipRow}>
          <Filter color={colors.textDim} size={13} style={{ marginRight: 6, alignSelf: 'center' }} />
          {YEARS.map(y => (
            <Pressable
              key={y || 'all'}
              style={[st.filterChip, year === y && st.filterChipActive]}
              onPress={() => setYear(y)}
            >
              <Text style={[st.filterChipText, year === y && st.filterChipTextActive]}>
                {y || 'Toutes les années'}
              </Text>
            </Pressable>
          ))}
        </ScrollView>

        {/* Status chips */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={st.chipRow}>
          {STATUS_FILTERS.map(f => (
            <Pressable
              key={f.key || 'all'}
              style={[st.filterChip, statusFilter === f.key && st.filterChipActive]}
              onPress={() => setStatusFilter(f.key)}
            >
              <Text style={[st.filterChipText, statusFilter === f.key && st.filterChipTextActive]}>
                {f.label}
              </Text>
            </Pressable>
          ))}
        </ScrollView>
      </View>

      {/* Loading */}
      {loading && (
        <View style={st.loadingWrap}>
          <ActivityIndicator color={colors.primary} />
        </View>
      )}

      {/* Empty state */}
      {!loading && filtered.length === 0 && (
        <View style={st.empty}>
          <ShoppingBag color={colors.textDim} size={40} strokeWidth={1.5} />
          <Text style={st.emptyTitle}>Aucune commande trouvée</Text>
          <Text style={st.emptyHint}>
            {q || year || statusFilter
              ? 'Modifiez vos filtres pour voir plus de résultats.'
              : 'Vos futures commandes apparaîtront ici.'}
          </Text>
        </View>
      )}

      {/* Grouped orders */}
      {!loading && sortedYears.map(y => (
        <View key={y} style={st.yearGroup}>
          <Text style={st.yearLabel}>
            {y} · {grouped[y].length} commande{grouped[y].length > 1 ? 's' : ''}
          </Text>

          {grouped[y].map(order => {
            const isOpen = expanded.has(order.id);
            const isPaid = order.status.toUpperCase() === 'PAID' || order.status.toUpperCase() === 'COMPLETED';

            return (
              <View key={order.id} style={st.orderCard}>
                {/* Clickable header */}
                <Pressable
                  style={({ pressed }) => [st.orderHeader, pressed && { opacity: 0.75 }]}
                  onPress={() => toggleExpand(order.id)}
                >
                  <View style={st.orderIconWrap}>
                    <Package color={colors.primary} size={15} />
                  </View>

                  <View style={{ flex: 1 }}>
                    <View style={st.orderTopRow}>
                      <Text style={st.orderNum}>#{order.id}</Text>
                      <StatusChip status={order.status} />
                      {order.gateway && (
                        <Text style={st.gateway}>{order.gateway}</Text>
                      )}
                    </View>
                    <View style={st.orderMetaRow}>
                      <Text style={st.orderDate}>{fmt(order.createdAt)}</Text>
                      <Text style={st.orderMeta}>
                        · {order.items.length} article{order.items.length > 1 ? 's' : ''}
                      </Text>
                    </View>
                  </View>

                  <View style={st.orderRight}>
                    <Text style={st.orderTotal}>{order.total.toFixed(2)} €</Text>
                    {isOpen
                      ? <ChevronUp color={colors.textDim} size={16} />
                      : <ChevronDown color={colors.textDim} size={16} />}
                  </View>
                </Pressable>

                {/* Expanded detail */}
                {isOpen && (
                  <View style={st.orderDetail}>
                    {order.items.map(item => (
                      <View key={item.id} style={st.itemRow}>
                        <Text numberOfLines={1} style={{ flex: 1, color: colors.textSecondary, fontSize: 13 }}>
                          {item.serviceName}
                        </Text>
                        <View style={st.itemTags}>
                          <View style={st.tag}>
                            <Text style={st.tagText}>{item.serviceType === 'saas' ? 'SaaS' : 'One Shot'}</Text>
                          </View>
                          {item.billing && (
                            <View style={st.tag}>
                              <Text style={st.tagText}>{item.billing === 'yearly' ? 'annuel' : 'mensuel'}</Text>
                            </View>
                          )}
                        </View>
                        <Text style={st.itemPrice}>{item.price.toFixed(2)} €</Text>
                      </View>
                    ))}

                    {isPaid && order.paymentId && (
                      <Pressable
                        style={({ pressed }) => [st.invoiceBtn, pressed && { opacity: 0.7 }]}
                        onPress={() => downloadInvoice(order.paymentId!)}
                      >
                        <FileText color={colors.primary} size={13} />
                        <Text style={st.invoiceBtnText}>Télécharger la facture</Text>
                      </Pressable>
                    )}
                  </View>
                )}
              </View>
            );
          })}
        </View>
      ))}
    </ScrollView>
  );
}

const st = StyleSheet.create({
  scroll: { backgroundColor: colors.background },
  content: { padding: spacing.screen, gap: 20, paddingBottom: 48 },

  // Header
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

  // Filters
  filters: { gap: 10 },
  searchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  searchInput: { flex: 1, color: colors.text, fontSize: 14 },

  chipRow: { flexDirection: 'row', gap: 8, paddingVertical: 2 },
  filterChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  filterChipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  filterChipText: { color: colors.textMuted, fontSize: 12, fontWeight: '600' },
  filterChipTextActive: { color: '#fff' },

  loadingWrap: { paddingVertical: 32, alignItems: 'center' },

  // Empty
  empty: { alignItems: 'center', justifyContent: 'center', gap: 10, paddingVertical: 48 },
  emptyTitle: { color: colors.text, fontSize: 16, fontWeight: '700' },
  emptyHint: { color: colors.textMuted, fontSize: 13, textAlign: 'center' },

  // Year group
  yearGroup: { gap: 10 },
  yearLabel: {
    color: colors.textMuted,
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.5,
    paddingBottom: 6,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderSubtle,
  },

  // Order card
  orderCard: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    overflow: 'hidden',
  },
  orderHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
  },
  orderIconWrap: {
    width: 36,
    height: 36,
    borderRadius: radius.md,
    backgroundColor: 'rgba(59,130,246,0.10)',
    borderWidth: 1,
    borderColor: 'rgba(59,130,246,0.20)',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  orderTopRow: { flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' },
  orderNum: { color: colors.text, fontSize: 14, fontWeight: '700' },
  gateway: { color: colors.textDim, fontSize: 10 },
  orderMetaRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 3 },
  orderDate: { color: colors.textMuted, fontSize: 12 },
  orderMeta: { color: colors.textDim, fontSize: 12 },
  orderRight: { alignItems: 'flex-end', gap: 4, flexShrink: 0 },
  orderTotal: { color: colors.text, fontSize: 15, fontWeight: '800' },

  // Expanded detail
  orderDetail: {
    borderTopWidth: 1,
    borderTopColor: colors.borderSubtle,
    padding: 14,
    gap: 10,
  },
  itemRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  itemTags: { flexDirection: 'row', gap: 4 },
  tag: {
    backgroundColor: colors.surfaceHigh,
    borderRadius: radius.sm,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  tagText: { color: colors.textMuted, fontSize: 10, fontWeight: '600' },
  itemPrice: { color: colors.text, fontSize: 13, fontWeight: '700', flexShrink: 0 },

  invoiceBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: colors.borderSubtle,
  },
  invoiceBtnText: { color: colors.primary, fontSize: 13, fontWeight: '600' },

  // Status chip
  chip: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radius.sm,
    borderWidth: 1,
  },
  chipText: { fontSize: 10, fontWeight: '700', letterSpacing: 0.3 },
  chipGreen: { backgroundColor: 'rgba(16,185,129,0.10)', borderColor: 'rgba(16,185,129,0.20)' },
  chipRed: { backgroundColor: 'rgba(239,68,68,0.10)', borderColor: 'rgba(239,68,68,0.20)' },
  chipAmber: { backgroundColor: 'rgba(245,158,11,0.10)', borderColor: 'rgba(245,158,11,0.20)' },
});
