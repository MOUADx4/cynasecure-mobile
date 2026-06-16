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
import { useNavigation } from '@react-navigation/native';
import { Database, FolderTree, Package, Pencil, Plus, Trash2 } from 'lucide-react-native';

import { adminApi, type AdminService, type Paginated } from '../../api/admin';
import { colors, radius, spacing } from '../../theme/colors';

function availLabel(s: AdminService): string {
  if (s.availability === 'available' || s.available) return 'Disponible';
  if (s.availability === 'maintenance') return 'Maintenance';
  return 'Indisponible';
}

function AvailBadge({ service }: { service: AdminService }) {
  const avail = service.availability === 'available' || service.available;
  const maint = service.availability === 'maintenance';
  const bg = avail
    ? 'rgba(16,185,129,0.10)'
    : maint ? 'rgba(245,158,11,0.10)' : 'rgba(239,68,68,0.10)';
  const br = avail
    ? 'rgba(16,185,129,0.20)'
    : maint ? 'rgba(245,158,11,0.20)' : 'rgba(239,68,68,0.20)';
  const col = avail ? colors.success : maint ? colors.warning : colors.danger;
  return (
    <View style={{ backgroundColor: bg, borderColor: br, borderWidth: 1, borderRadius: radius.sm, paddingHorizontal: 7, paddingVertical: 2 }}>
      <Text style={{ color: col, fontSize: 9, fontWeight: '700', letterSpacing: 0.5 }}>{availLabel(service)}</Text>
    </View>
  );
}

export function AdminServicesScreen() {
  const nav = useNavigation<any>();
  const [data, setData] = useState<Paginated<AdminService> | null>(null);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = (p = 1) =>
    adminApi.getServices(p).then(setData).catch(() => {});

  useEffect(() => {
    setLoading(true);
    load(page).finally(() => setLoading(false));
  }, [page]);

  const onRefresh = () => {
    setRefreshing(true);
    load(page).finally(() => setRefreshing(false));
  };

  const remove = (id: number, name: string) => {
    Alert.alert('Supprimer ce service ?', name, [
      { text: 'Annuler', style: 'cancel' },
      {
        text: 'Supprimer',
        style: 'destructive',
        onPress: async () => {
          try {
            await adminApi.deleteService(id);
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
          <FolderTree color={colors.primary} size={10} />
          <Text style={st.eyebrowText}>GESTION DES SERVICES</Text>
        </View>
        <Text style={st.pageTitle}>Catalogue des services</Text>
        <Text style={st.pageDesc}>Gérez les services et solutions disponibles sur la plateforme.</Text>
      </View>

      <Pressable
        style={({ pressed }) => [st.addBtn, pressed && { opacity: 0.8 }]}
        onPress={() => nav.navigate('AdminServiceForm', {})}
      >
        <Plus color="#fff" size={14} />
        <Text style={st.addBtnText}>Nouveau service</Text>
      </Pressable>

      <View style={st.tableHeader}>
        <Database color={colors.textDim} size={13} />
        <Text style={st.tableHeaderText}>{total} service{total > 1 ? 's' : ''}</Text>
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
      keyExtractor={s => String(s.id)}
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
            <Package color={colors.textDim} size={40} strokeWidth={1.5} />
            <Text style={st.emptyTitle}>Aucun service</Text>
          </View>
        )
      }
      ListFooterComponent={ListFooter}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
      }
      renderItem={({ item: s }) => (
        <View style={st.serviceCard}>
          <View style={st.serviceIcon}>
            <Package color={colors.primary} size={15} />
          </View>

          <View style={{ flex: 1, gap: 4 }}>
            <View style={st.serviceTopRow}>
              <Text style={st.serviceName} numberOfLines={1}>{s.name}</Text>
              <AvailBadge service={s} />
            </View>
            <View style={st.serviceMetaRow}>
              {(s.category || s.categorySlug) && (
                <Text style={st.serviceMeta}>{s.category ?? s.categorySlug}</Text>
              )}
              <View style={st.typeChip}>
                <Text style={st.typeChipText}>{s.type === 'saas' ? 'SaaS' : 'One Shot'}</Text>
              </View>
            </View>
            <View style={st.priceRow}>
              {s.priceMonthly != null && (
                <Text style={st.price}>{s.priceMonthly.toFixed(2)} € /mois</Text>
              )}
              {s.priceYearly != null && (
                <Text style={st.priceAlt}>{s.priceYearly.toFixed(2)} € /an</Text>
              )}
            </View>
          </View>

          <View style={st.actions}>
            <Pressable onPress={() => nav.navigate('AdminServiceForm', { id: s.id })} style={st.actionBtn}>
              <Pencil color={colors.primary} size={15} />
            </Pressable>
            <Pressable onPress={() => remove(s.id, s.name)} style={st.actionBtn}>
              <Trash2 color={colors.danger} size={15} />
            </Pressable>
          </View>
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

  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: colors.primary,
    borderRadius: radius.lg,
    paddingVertical: 12,
    paddingHorizontal: 16,
    alignSelf: 'flex-start',
  },
  addBtnText: { color: '#fff', fontSize: 13, fontWeight: '700' },

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

  serviceCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderSubtle,
  },
  serviceIcon: {
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
  serviceTopRow: { flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' },
  serviceName: { color: colors.text, fontSize: 14, fontWeight: '700', flex: 1 },
  serviceMetaRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  serviceMeta: { color: colors.textDim, fontSize: 12 },
  typeChip: {
    backgroundColor: colors.surfaceHigh,
    borderRadius: radius.sm,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  typeChipText: { color: colors.textMuted, fontSize: 10, fontWeight: '600' },
  priceRow: { flexDirection: 'row', gap: 10 },
  price: { color: colors.text, fontSize: 12, fontWeight: '700' },
  priceAlt: { color: colors.textDim, fontSize: 12 },
  actions: { flexDirection: 'row', gap: 4, flexShrink: 0 },
  actionBtn: { padding: 8 },

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
