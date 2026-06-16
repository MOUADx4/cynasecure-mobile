import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Modal,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Database, Pencil, Plus, RefreshCw, Shield, Tag, Trash2, X } from 'lucide-react-native';

import { adminApi, type AdminPromo, type Paginated } from '../../api/admin';
import { colors, radius, spacing } from '../../theme/colors';

const EMPTY_FORM = {
  code: '',
  type: 'percent' as 'percent' | 'fixed',
  value: '',
  maxUses: '',
  minAmount: '',
  validFrom: '',
  validUntil: '',
  isActive: true,
  appliesTo: 'all' as 'all' | 'saas' | 'one_shot',
};

function StatusBadge({ active }: { active: boolean }) {
  return (
    <View style={active ? st.badgeGreen : st.badgeGray}>
      <Text style={[st.badgeText, { color: active ? colors.success : colors.textDim }]}>
        {active ? 'ACTIF' : 'INACTIF'}
      </Text>
    </View>
  );
}

export function AdminPromosScreen() {
  const [data, setData] = useState<Paginated<AdminPromo> | null>(null);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editing, setEditing] = useState<AdminPromo | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  const load = (p = 1) =>
    adminApi.getPromos(p).then(res => setData(res)).catch(() => {});

  useEffect(() => {
    setLoading(true);
    load(page).finally(() => setLoading(false));
  }, [page]);

  const onRefresh = () => {
    setRefreshing(true);
    load(page).finally(() => setRefreshing(false));
  };

  const openCreate = () => {
    setEditing(null);
    setForm(EMPTY_FORM);
    setModalVisible(true);
  };

  const openEdit = (promo: AdminPromo) => {
    setEditing(promo);
    setForm({
      code: promo.code,
      type: promo.type,
      value: String(promo.value),
      maxUses: promo.maxUses != null ? String(promo.maxUses) : '',
      minAmount: promo.minAmount != null ? String(promo.minAmount) : '',
      validFrom: promo.validFrom ?? '',
      validUntil: promo.validUntil ?? '',
      isActive: promo.isActive,
      appliesTo: promo.appliesTo,
    });
    setModalVisible(true);
  };

  const generate = async () => {
    try {
      const res = await adminApi.generatePromoCode();
      setForm(f => ({ ...f, code: res.code }));
    } catch {}
  };

  const save = async () => {
    if (!form.code.trim()) {
      Alert.alert('Erreur', 'Le code est requis.');
      return;
    }
    const value = parseFloat(form.value);
    if (!value || value <= 0) {
      Alert.alert('Erreur', 'La valeur doit être positive.');
      return;
    }
    setSaving(true);
    try {
      const payload = {
        code: form.code.trim().toUpperCase(),
        type: form.type,
        value,
        isActive: form.isActive,
        appliesTo: form.appliesTo,
        maxUses: form.maxUses ? parseInt(form.maxUses) : null,
        minAmount: form.minAmount ? parseFloat(form.minAmount) : null,
        validFrom: form.validFrom || null,
        validUntil: form.validUntil || null,
      };
      if (editing) {
        await adminApi.updatePromo(editing.id, payload);
      } else {
        await adminApi.createPromo(payload);
      }
      setModalVisible(false);
      load(page);
    } catch (e: any) {
      Alert.alert('Erreur', e?.message ?? 'Une erreur est survenue.');
    } finally {
      setSaving(false);
    }
  };

  const remove = (promo: AdminPromo) => {
    Alert.alert('Supprimer ce code promo ?', promo.code, [
      { text: 'Annuler', style: 'cancel' },
      {
        text: 'Supprimer',
        style: 'destructive',
        onPress: async () => {
          try {
            await adminApi.deletePromo(promo.id);
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
          <Shield color={colors.primary} size={10} />
          <Text style={st.eyebrowText}>GESTION DES PROMOS</Text>
        </View>
        <Text style={st.pageTitle}>Codes promo</Text>
        <Text style={st.pageDesc}>Créez et gérez vos codes de réduction pour vos clients.</Text>
      </View>

      <Pressable
        style={({ pressed }) => [st.addBtn, pressed && { opacity: 0.8 }]}
        onPress={openCreate}
      >
        <Plus color="#fff" size={14} />
        <Text style={st.addBtnText}>Nouveau code promo</Text>
      </Pressable>

      <View style={st.tableHeader}>
        <Database color={colors.textDim} size={13} />
        <Text style={st.tableHeaderText}>{total} code{total > 1 ? 's' : ''}</Text>
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
    <>
      <FlatList
        style={st.list}
        contentContainerStyle={st.content}
        data={items}
        keyExtractor={p => String(p.id)}
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
              <Tag color={colors.textDim} size={40} strokeWidth={1.5} />
              <Text style={st.emptyTitle}>Aucun code promo</Text>
            </View>
          )
        }
        ListFooterComponent={ListFooter}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
        }
        renderItem={({ item: p }) => (
          <View style={st.promoCard}>
            <View style={st.promoIconWrap}>
              <Tag color={colors.primary} size={14} />
            </View>

            <View style={{ flex: 1, gap: 4 }}>
              <View style={st.promoTopRow}>
                <Text style={st.promoCode}>{p.code}</Text>
                <StatusBadge active={p.isActive} />
              </View>

              <View style={st.promoMetaRow}>
                <Text style={st.promoValue}>
                  {p.type === 'percent' ? `-${p.value}%` : `-${p.value} €`}
                </Text>
                {p.appliesTo !== 'all' && (
                  <View style={st.chip}>
                    <Text style={st.chipText}>{p.appliesTo === 'saas' ? 'SaaS' : 'One Shot'}</Text>
                  </View>
                )}
              </View>

              <View style={st.promoUsageRow}>
                <Text style={st.promoUsage}>
                  {p.maxUses != null
                    ? `${p.usedCount} / ${p.maxUses} utilisations`
                    : `${p.usedCount} utilisation${p.usedCount > 1 ? 's' : ''}`}
                </Text>
                {(p.validFrom || p.validUntil) && (
                  <Text style={st.promoDates}>
                    {p.validFrom ? `Du ${p.validFrom}` : ''}
                    {p.validFrom && p.validUntil ? ' ' : ''}
                    {p.validUntil ? `au ${p.validUntil}` : ''}
                  </Text>
                )}
              </View>
            </View>

            <View style={st.actions}>
              <Pressable onPress={() => openEdit(p)} style={st.actionBtn}>
                <Pencil color={colors.primary} size={15} />
              </Pressable>
              <Pressable onPress={() => remove(p)} style={st.actionBtn}>
                <Trash2 color={colors.danger} size={15} />
              </Pressable>
            </View>
          </View>
        )}
      />

      <Modal
        visible={modalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={st.modal}>
          <View style={st.modalHeader}>
            <Text style={st.modalTitle}>{editing ? 'Modifier le code promo' : 'Nouveau code promo'}</Text>
            <Pressable onPress={() => setModalVisible(false)}>
              <X color={colors.textDim} size={20} />
            </Pressable>
          </View>

          <ScrollView contentContainerStyle={st.modalBody} keyboardShouldPersistTaps="handled">
            <Text style={st.label}>Code *</Text>
            <View style={st.codeInputRow}>
              <TextInput
                style={[st.input, { flex: 1 }]}
                value={form.code}
                onChangeText={v => setForm(f => ({ ...f, code: v.toUpperCase() }))}
                placeholder="PROMO20"
                placeholderTextColor={colors.textDim}
                autoCapitalize="characters"
                maxLength={50}
              />
              <Pressable style={st.generateBtn} onPress={generate}>
                <RefreshCw color={colors.primary} size={18} />
              </Pressable>
            </View>

            <Text style={st.label}>Type *</Text>
            <View style={st.segmented}>
              {(['percent', 'fixed'] as const).map(t => (
                <Pressable
                  key={t}
                  style={[st.segment, form.type === t && st.segmentActive]}
                  onPress={() => setForm(f => ({ ...f, type: t }))}
                >
                  <Text style={[st.segmentText, form.type === t && st.segmentTextActive]}>
                    {t === 'percent' ? 'Pourcentage (%)' : 'Montant fixe (€)'}
                  </Text>
                </Pressable>
              ))}
            </View>

            <Text style={st.label}>Valeur * {form.type === 'percent' ? '(%)' : '(€)'}</Text>
            <TextInput
              style={st.input}
              value={form.value}
              onChangeText={v => setForm(f => ({ ...f, value: v }))}
              placeholder={form.type === 'percent' ? '20' : '10'}
              placeholderTextColor={colors.textDim}
              keyboardType="decimal-pad"
            />

            <Text style={st.label}>S'applique à</Text>
            <View style={st.segmented}>
              {([['all', 'Tous'], ['saas', 'SaaS'], ['one_shot', 'One Shot']] as const).map(([val, lbl]) => (
                <Pressable
                  key={val}
                  style={[st.segment, form.appliesTo === val && st.segmentActive]}
                  onPress={() => setForm(f => ({ ...f, appliesTo: val }))}
                >
                  <Text style={[st.segmentText, form.appliesTo === val && st.segmentTextActive]}>{lbl}</Text>
                </Pressable>
              ))}
            </View>

            <Text style={st.label}>Utilisations max (vide = illimité)</Text>
            <TextInput
              style={st.input}
              value={form.maxUses}
              onChangeText={v => setForm(f => ({ ...f, maxUses: v }))}
              placeholder="100"
              placeholderTextColor={colors.textDim}
              keyboardType="number-pad"
            />

            <Text style={st.label}>Montant minimum (€, vide = aucun)</Text>
            <TextInput
              style={st.input}
              value={form.minAmount}
              onChangeText={v => setForm(f => ({ ...f, minAmount: v }))}
              placeholder="50"
              placeholderTextColor={colors.textDim}
              keyboardType="decimal-pad"
            />

            <Text style={st.label}>Valide du (YYYY-MM-DD)</Text>
            <TextInput
              style={st.input}
              value={form.validFrom}
              onChangeText={v => setForm(f => ({ ...f, validFrom: v }))}
              placeholder="2026-01-01"
              placeholderTextColor={colors.textDim}
            />

            <Text style={st.label}>Valide jusqu'au (YYYY-MM-DD)</Text>
            <TextInput
              style={st.input}
              value={form.validUntil}
              onChangeText={v => setForm(f => ({ ...f, validUntil: v }))}
              placeholder="2026-12-31"
              placeholderTextColor={colors.textDim}
            />

            <View style={st.switchRow}>
              <Text style={st.label}>Actif</Text>
              <Switch
                value={form.isActive}
                onValueChange={v => setForm(f => ({ ...f, isActive: v }))}
                trackColor={{ false: colors.border, true: colors.primary }}
                thumbColor="#fff"
              />
            </View>

            <Pressable
              style={[st.saveBtn, saving && { opacity: 0.6 }]}
              onPress={save}
              disabled={saving}
            >
              <Text style={st.saveBtnText}>{saving ? 'Enregistrement…' : (editing ? 'Enregistrer' : 'Créer')}</Text>
            </Pressable>
          </ScrollView>
        </View>
      </Modal>
    </>
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

  promoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderSubtle,
  },
  promoIconWrap: {
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
  promoTopRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  promoCode: {
    color: colors.text,
    fontSize: 15,
    fontWeight: '700',
    fontFamily: 'Menlo',
    letterSpacing: 0.5,
  },
  promoMetaRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  promoValue: { color: colors.textSecondary, fontSize: 13, fontWeight: '600' },
  promoUsageRow: { flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' },
  promoUsage: { color: colors.textDim, fontSize: 11 },
  promoDates: { color: colors.textDim, fontSize: 11 },

  chip: {
    backgroundColor: colors.surfaceHigh,
    borderRadius: radius.sm,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  chipText: { color: colors.textMuted, fontSize: 10, fontWeight: '600' },

  badgeGreen: {
    backgroundColor: 'rgba(16,185,129,0.10)',
    borderColor: 'rgba(16,185,129,0.20)',
    borderWidth: 1,
    borderRadius: radius.sm,
    paddingHorizontal: 7,
    paddingVertical: 2,
  },
  badgeGray: {
    backgroundColor: 'rgba(107,114,128,0.10)',
    borderColor: 'rgba(107,114,128,0.20)',
    borderWidth: 1,
    borderRadius: radius.sm,
    paddingHorizontal: 7,
    paddingVertical: 2,
  },
  badgeText: { fontSize: 9, fontWeight: '700', letterSpacing: 0.5 },

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

  // Modal
  modal: { flex: 1, backgroundColor: colors.background },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    backgroundColor: colors.surface,
  },
  modalTitle: { color: colors.text, fontSize: 17, fontWeight: '700' },
  modalBody: { padding: 16, gap: 6, paddingBottom: 48 },
  label: { color: colors.textMuted, fontSize: 12, fontWeight: '600', marginTop: 8 },
  input: {
    backgroundColor: colors.surfaceHigh,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: colors.text,
    fontSize: 14,
  },
  codeInputRow: { flexDirection: 'row', gap: 8, alignItems: 'center' },
  generateBtn: {
    padding: 12,
    backgroundColor: colors.surfaceHigh,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
  },
  segmented: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  segment: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    backgroundColor: colors.surfaceHigh,
  },
  segmentActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  segmentText: { color: colors.textMuted, fontSize: 13, fontWeight: '600' },
  segmentTextActive: { color: '#fff' },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: 8,
  },
  saveBtn: {
    backgroundColor: colors.primary,
    borderRadius: radius.lg,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 16,
  },
  saveBtnText: { color: '#fff', fontSize: 15, fontWeight: '700' },
});
