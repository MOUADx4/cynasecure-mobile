import React, { useEffect, useState } from 'react';
import {
  Alert,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import {
  AlertCircle,
  ArrowRight,
  ArrowUpDown,
  Calendar,
  CheckCircle2,
  CreditCard,
  Layers,
  Package,
  RefreshCw,
  RotateCcw,
  Shield,
  XCircle,
} from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import type { NavigationProp } from '@react-navigation/native';

import { subscriptionsApi, type Subscription } from '../../api/subscriptions';
import { useToast } from '../../hooks/useToast';
import { useHaptic } from '../../hooks/useHaptic';
import { Skeleton } from '../../components/ui/Skeleton';
import { colors, radius, spacing } from '../../theme/colors';
import type { RootStackParams } from '../../navigation/types';

function fmt(iso?: string | null) {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
  } catch { return iso; }
}

function daysLeft(iso: string) {
  return Math.ceil((new Date(iso).getTime() - Date.now()) / 86400000);
}

// Status badge
function StatusBadge({ status }: { status: string }) {
  const isActive = status === 'ACTIVE';
  return (
    <View style={[st.badge, isActive ? st.badgeGreen : st.badgeRed]}>
      {isActive
        ? <CheckCircle2 color={colors.success} size={11} />
        : <XCircle color={colors.danger} size={11} />}
      <Text style={[st.badgeText, { color: isActive ? colors.success : colors.danger }]}>
        {isActive ? 'Actif' : status === 'CANCELLED' ? 'Annulé' : status}
      </Text>
    </View>
  );
}

// Info row
function InfoRow({
  icon: Icon, iconColor, label, value, valueColor,
}: {
  icon: React.ElementType;
  iconColor: string;
  label: string;
  value: string;
  valueColor?: string;
}) {
  return (
    <View style={st.infoRow}>
      <View style={st.infoLeft}>
        <Icon color={iconColor} size={14} />
        <Text style={st.infoLabel}>{label}</Text>
      </View>
      <Text style={[st.infoValue, valueColor ? { color: valueColor } : undefined]}>
        {value}
      </Text>
    </View>
  );
}

// Main screen
export function MySubscriptionsScreen() {
  const { toast } = useToast();
  const { light, medium, success: hapticSuccess, error: hapticError } = useHaptic();
  const nav = useNavigation<NavigationProp<RootStackParams>>();
  const [subs, setSubs] = useState<Subscription[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [cancelling, setCancelling] = useState<number | null>(null);
  const [renewing, setRenewing] = useState<number | null>(null);
  const [upgrading, setUpgrading] = useState<number | null>(null);
  const [togglingAutoRenew, setTogglingAutoRenew] = useState<number | null>(null);

  const load = (silent = false) => {
    if (!silent) setLoading(true);
    return subscriptionsApi.list()
      .then(setSubs)
      .catch(() => setSubs([]))
      .finally(() => { setLoading(false); setRefreshing(false); });
  };

  useEffect(() => { load(); }, []);

  const onRefresh = () => { setRefreshing(true); load(true); };

  const handleCancel = (sub: Subscription) => {
    Alert.alert(
      'Annuler l\'abonnement',
      `Annuler "${sub.service.title}" ? Vous conserverez l'accès jusqu'à la fin de la période en cours.`,
      [
        { text: 'Retour', style: 'cancel' },
        {
          text: 'Annuler l\'abonnement',
          style: 'destructive',
          onPress: async () => {
            medium();
            setCancelling(sub.id);
            try {
              await subscriptionsApi.cancel(sub.id);
              setSubs(prev => prev.map(s =>
                s.id === sub.id ? { ...s, status: 'CANCELLED' as const, endDate: s.nextBillingAt ?? undefined } : s
              ));
              hapticSuccess();
              toast('Abonnement annulé. Accès conservé jusqu\'à la fin de la période.', 'success');
            } catch (e: any) {
              hapticError();
              toast(e?.message ?? 'Erreur lors de l\'annulation', 'error');
            } finally {
              setCancelling(null);
            }
          },
        },
      ]
    );
  };

  const handleRenew = async (id: number) => {
    medium();
    setRenewing(id);
    try {
      await subscriptionsApi.renew(id);
      setSubs(prev => prev.map(s =>
        s.id === id ? { ...s, status: 'ACTIVE' as const, endDate: undefined } : s
      ));
      hapticSuccess();
      toast('Abonnement réactivé avec succès.', 'success');
    } catch (e: any) {
      hapticError();
      toast(e?.message ?? 'Erreur lors de la réactivation', 'error');
    } finally {
      setRenewing(null);
    }
  };

  const handleUpgrade = (sub: Subscription) => {
    const next = sub.cycle === 'monthly' ? 'yearly' : 'monthly';
    const label = next === 'yearly' ? 'annuelle (−17%)' : 'mensuelle';
    Alert.alert(
      'Changer de formule',
      `Passer à la formule ${label} ?`,
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Confirmer',
          onPress: async () => {
            medium();
            setUpgrading(sub.id);
            try {
              const res = await subscriptionsApi.switchCycle(sub.id, next);
              setSubs(prev => prev.map(s =>
                s.id === sub.id ? { ...s, cycle: res.cycle as 'monthly' | 'yearly', price: res.price } : s
              ));
              hapticSuccess();
              toast(`Formule mise à jour : ${label}.`, 'success');
            } catch (e: any) {
              hapticError();
              toast(e?.message ?? 'Erreur lors du changement', 'error');
            } finally {
              setUpgrading(null);
            }
          },
        },
      ]
    );
  };

  const handleToggleAutoRenew = async (sub: Subscription) => {
    light();
    setTogglingAutoRenew(sub.id);
    try {
      await subscriptionsApi.toggleAutoRenew(sub.id, !sub.autoRenew);
      setSubs(prev => prev.map(s => s.id === sub.id ? { ...s, autoRenew: !s.autoRenew } : s));
      toast(sub.autoRenew ? 'Renouvellement automatique désactivé.' : 'Renouvellement automatique activé.', 'success');
    } catch (e: any) {
      hapticError();
      toast(e?.message ?? 'Erreur', 'error');
    } finally {
      setTogglingAutoRenew(null);
    }
  };

  const activeSubs = subs.filter(s => s.status === 'ACTIVE');
  const monthlyTotal = activeSubs
    .filter(s => s.cycle === 'monthly')
    .reduce((sum, s) => sum + s.price, 0);

  if (loading) {
    return (
      <ScrollView style={st.scroll} contentContainerStyle={st.content} showsVerticalScrollIndicator={false}>
        <View style={{ gap: 8 }}>
          <Skeleton height={18} width="45%" />
          <Skeleton height={28} width="68%" />
          <Skeleton height={13} width="82%" />
        </View>
        <View style={st.kpiRow}>
          <Skeleton height={62} style={{ flex: 1, borderRadius: radius.lg }} />
          <Skeleton height={62} style={{ flex: 1, borderRadius: radius.lg }} />
        </View>
        {[0, 1].map(i => (
          <View key={i} style={st.subCard}>
            <View style={st.subTop}>
              <Skeleton height={40} width={40} borderRadius={radius.md} />
              <View style={{ flex: 1, gap: 8 }}>
                <Skeleton height={14} width="65%" />
                <Skeleton height={20} width="30%" borderRadius={radius.full} />
              </View>
            </View>
            <View style={[st.infoBlock, { gap: 10 }]}>
              <Skeleton height={12} />
              <Skeleton height={12} />
              <Skeleton height={12} width="80%" />
            </View>
          </View>
        ))}
      </ScrollView>
    );
  }

  return (
    <ScrollView
      style={st.scroll}
      contentContainerStyle={st.content}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
      }
    >
      {/* Header */}
      <View style={st.pageHeader}>
        <View style={st.eyebrowBadge}>
          <Shield color={colors.primary} size={10} />
          <Text style={st.eyebrowText}>GESTION DES SERVICES</Text>
        </View>
        <Text style={st.pageTitle}>Mes abonnements</Text>
        <Text style={st.pageDesc}>
          Gérez vos services de cybersécurité actifs, leurs cycles et leurs options.
        </Text>
      </View>

      {/* KPI chips */}
      <View style={st.kpiRow}>
        <View style={st.kpiChip}>
          <View style={[st.kpiChipIcon, { backgroundColor: 'rgba(16,185,129,0.10)', borderColor: 'rgba(16,185,129,0.20)' }]}>
            <CheckCircle2 color={colors.success} size={15} />
          </View>
          <View>
            <Text style={st.kpiChipLabel}>Services actifs</Text>
            <Text style={st.kpiChipValue}>{activeSubs.length}</Text>
          </View>
        </View>

        <View style={st.kpiChip}>
          <View style={[st.kpiChipIcon, { backgroundColor: 'rgba(59,130,246,0.10)', borderColor: 'rgba(59,130,246,0.20)' }]}>
            <CreditCard color={colors.primary} size={15} />
          </View>
          <View>
            <Text style={st.kpiChipLabel}>Dépenses / mois</Text>
            <Text style={st.kpiChipValue}>{monthlyTotal} €</Text>
          </View>
        </View>
      </View>

      {/* Empty state */}
      {subs.length === 0 && (
        <View style={st.empty}>
          <View style={st.emptyIconWrap}>
            <Package color={colors.primary} size={28} strokeWidth={1.5} />
          </View>
          <Text style={st.emptyEyebrow}>SERVICES ACTIFS</Text>
          <Text style={st.emptyTitle}>Aucun abonnement actif</Text>
          <Text style={st.emptyHint}>Protégez votre infrastructure avec nos solutions de cybersécurité managées.</Text>
          <Pressable
            style={({ pressed }) => [st.emptyBtn, pressed && { opacity: 0.8 }]}
            onPress={() => (nav as any).navigate('Catalog')}
          >
            <Text style={st.emptyBtnText}>Explorer le catalogue</Text>
            <ArrowRight color="#fff" size={14} />
          </Pressable>
        </View>
      )}

      {/* Subscription cards */}
      {subs.map(sub => {
        const days = sub.endDate ? daysLeft(sub.endDate) : null;
        const canRenew = sub.status === 'CANCELLED' && (days === null || days >= 0);
        const isActive = sub.status === 'ACTIVE';

        return (
          <View
            key={sub.id}
            style={[st.subCard, !isActive && { opacity: 0.65 }]}
          >
            {/* Card header: service + status */}
            <View style={st.subTop}>
              <View style={st.subIconWrap}>
                <Shield color={colors.primary} size={18} />
              </View>
              <Text style={st.subTitle} numberOfLines={2}>{sub.service.title}</Text>
              <StatusBadge status={sub.status} />
            </View>

            {/* Info rows */}
            <View style={st.infoBlock}>
              <InfoRow
                icon={Layers}
                iconColor={colors.primary}
                label="Cycle de facturation"
                value={sub.cycle === 'monthly' ? 'Mensuel' : 'Annuel'}
              />
              <InfoRow
                icon={CreditCard}
                iconColor={colors.primary}
                label="Montant"
                value={`${sub.price} € / ${sub.cycle === 'monthly' ? 'mois' : 'an'}`}
              />
              <InfoRow
                icon={Calendar}
                iconColor={colors.primary}
                label="Date de début"
                value={fmt(sub.startDate)}
              />
              {sub.nextBillingAt && isActive && (
                <InfoRow
                  icon={AlertCircle}
                  iconColor={colors.success}
                  label="Prochain renouvellement"
                  value={fmt(sub.nextBillingAt)}
                  valueColor={colors.success}
                />
              )}
              {sub.status === 'CANCELLED' && sub.endDate && (
                <InfoRow
                  icon={AlertCircle}
                  iconColor={colors.warning}
                  label="Accès jusqu'au"
                  value={`${fmt(sub.endDate)}${days !== null && days >= 0 ? ` (${days}j)` : ''}`}
                  valueColor={colors.warning}
                />
              )}
            </View>

            {/* Active actions */}
            {isActive && (
              <View style={st.actions}>
                <View style={st.actionsRow}>
                  <Pressable
                    style={({ pressed }) => [st.actionBtn, st.actionBtnOutline, { flex: 1 }, pressed && { opacity: 0.7 }]}
                    onPress={() => nav.navigate('ServiceDetails', { id: sub.service.id })}
                  >
                    <Text style={st.actionBtnText}>Voir le service</Text>
                    <ArrowRight color={colors.textSecondary} size={13} />
                  </Pressable>

                  <Pressable
                    style={({ pressed }) => [st.actionBtn, st.actionBtnOutline, pressed && { opacity: 0.7 }]}
                    onPress={() => handleUpgrade(sub)}
                    disabled={upgrading === sub.id}
                  >
                    <ArrowUpDown color={colors.textSecondary} size={13} />
                    <Text style={st.actionBtnText}>
                      {upgrading === sub.id ? '…' : sub.cycle === 'monthly' ? 'Passer annuel' : 'Passer mensuel'}
                    </Text>
                  </Pressable>

                  <Pressable
                    style={({ pressed }) => [st.actionBtn, st.actionBtnDanger, pressed && { opacity: 0.7 }]}
                    onPress={() => handleCancel(sub)}
                    disabled={cancelling === sub.id}
                  >
                    <Text style={[st.actionBtnText, { color: colors.danger }]}>
                      {cancelling === sub.id ? '…' : 'Annuler'}
                    </Text>
                  </Pressable>
                </View>

                {/* Auto-renew toggle */}
                <Pressable
                  style={({ pressed }) => [
                    st.autoRenewBtn,
                    sub.autoRenew ? st.autoRenewOn : st.autoRenewOff,
                    pressed && { opacity: 0.7 },
                  ]}
                  onPress={() => handleToggleAutoRenew(sub)}
                  disabled={togglingAutoRenew === sub.id}
                >
                  <RotateCcw color={sub.autoRenew ? colors.success : colors.textMuted} size={13} />
                  <Text style={[st.autoRenewText, { color: sub.autoRenew ? colors.success : colors.textMuted }]}>
                    {togglingAutoRenew === sub.id
                      ? '…'
                      : sub.autoRenew
                      ? 'Renouvellement auto : ON'
                      : 'Renouvellement auto : OFF'}
                  </Text>
                </Pressable>
              </View>
            )}

            {/* Renew button (if cancelled) */}
            {canRenew && (
              <Pressable
                style={({ pressed }) => [st.renewBtn, pressed && { opacity: 0.8 }]}
                onPress={() => handleRenew(sub.id)}
                disabled={renewing === sub.id}
              >
                <RefreshCw color="#fff" size={14} />
                <Text style={st.renewBtnText}>
                  {renewing === sub.id ? 'Réactivation…' : 'Réactiver l\'abonnement'}
                </Text>
              </Pressable>
            )}
          </View>
        );
      })}
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

  // KPI chips
  kpiRow: { flexDirection: 'row', gap: 12 },
  kpiChip: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  kpiChipIcon: {
    width: 36,
    height: 36,
    borderRadius: radius.md,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  kpiChipLabel: { color: colors.textDim, fontSize: 10, fontWeight: '600', letterSpacing: 0.5, textTransform: 'uppercase' },
  kpiChipValue: { color: colors.text, fontSize: 17, fontWeight: '800', marginTop: 2 },

  // Empty
  empty: { alignItems: 'center', justifyContent: 'center', gap: 12, paddingVertical: 40 },
  emptyIconWrap: {
    width: 72,
    height: 72,
    borderRadius: 20,
    backgroundColor: 'rgba(79,142,247,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(79,142,247,0.25)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  emptyEyebrow: { color: colors.primary, fontSize: 10, fontWeight: '700', letterSpacing: 1.6, textTransform: 'uppercase' as const },
  emptyTitle: { color: colors.text, fontSize: 18, fontWeight: '800' },
  emptyHint: { color: colors.textMuted, fontSize: 13, textAlign: 'center' as const, lineHeight: 20, maxWidth: 260 },
  emptyBtn: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 8,
    backgroundColor: colors.primary,
    paddingHorizontal: 20,
    paddingVertical: 11,
    borderRadius: radius.lg,
    marginTop: 4,
  },
  emptyBtnText: { color: '#fff', fontSize: 14, fontWeight: '700' },

  // Sub card
  subCard: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    overflow: 'hidden',
    gap: 0,
  },

  subTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 16,
  },
  subIconWrap: {
    width: 40,
    height: 40,
    borderRadius: radius.md,
    backgroundColor: 'rgba(59,130,246,0.10)',
    borderWidth: 1,
    borderColor: 'rgba(59,130,246,0.20)',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  subTitle: { flex: 1, color: colors.text, fontSize: 15, fontWeight: '700', lineHeight: 20 },

  // Info block
  infoBlock: {
    borderTopWidth: 1,
    borderTopColor: colors.borderSubtle,
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 10,
  },
  infoRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  infoLeft: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  infoLabel: { color: colors.textMuted, fontSize: 13 },
  infoValue: { color: colors.text, fontSize: 13, fontWeight: '600' },

  // Actions
  actions: {
    borderTopWidth: 1,
    borderTopColor: colors.borderSubtle,
    padding: 14,
    gap: 8,
  },
  actionsRow: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: radius.md,
    borderWidth: 1,
  },
  actionBtnOutline: { borderColor: colors.border, backgroundColor: 'transparent' },
  actionBtnDanger: {
    borderColor: 'rgba(239,68,68,0.25)',
    backgroundColor: 'rgba(239,68,68,0.08)',
  },
  actionBtnText: { color: colors.textSecondary, fontSize: 12, fontWeight: '600' },

  autoRenewBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 9,
    borderWidth: 1,
    borderRadius: radius.md,
  },
  autoRenewOn: {
    backgroundColor: 'rgba(16,185,129,0.10)',
    borderColor: 'rgba(16,185,129,0.20)',
  },
  autoRenewOff: {
    backgroundColor: colors.surfaceElevated,
    borderColor: colors.border,
  },
  autoRenewText: { fontSize: 12, fontWeight: '700', letterSpacing: 0.3 },

  renewBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    margin: 14,
    marginTop: 0,
    paddingVertical: 12,
    backgroundColor: colors.success,
    borderRadius: radius.md,
  },
  renewBtnText: { color: '#fff', fontSize: 13, fontWeight: '700' },

  // Badge
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: radius.full,
    borderWidth: 1,
    flexShrink: 0,
  },
  badgeGreen: { backgroundColor: 'rgba(16,185,129,0.10)', borderColor: 'rgba(16,185,129,0.20)' },
  badgeRed: { backgroundColor: 'rgba(239,68,68,0.10)', borderColor: 'rgba(239,68,68,0.20)' },
  badgeText: { fontSize: 11, fontWeight: '700' },
});
