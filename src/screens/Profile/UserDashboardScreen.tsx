import React, { useEffect, useState } from 'react';
import {
  Dimensions,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import {
  Activity,
  AlertCircle,
  ArrowRight,
  Calendar,
  CreditCard,
  Fingerprint,
  Package,
  Shield,
  TrendingUp,
  CheckCircle2,
  XCircle,
} from 'lucide-react-native';
import { LineChart } from 'react-native-gifted-charts';

import { useAuth } from '../../context/AuthContext';
import { subscriptionsApi, type Subscription } from '../../api/subscriptions';
import { paymentsApi, type Payment } from '../../api/payments';
import { FadeInView } from '../../components/ui/FadeInView';
import { colors, radius, spacing } from '../../theme/colors';
import type { RootScreen } from '../../navigation/types';

const { width: SCREEN_W } = Dimensions.get('window');
const CHART_W = SCREEN_W - spacing.screen * 2 - 40;

function fmt(iso: string) {
  try {
    return new Date(iso).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' });
  } catch {
    return iso;
  }
}

function fmtShort(iso: string) {
  try {
    return new Date(iso).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
  } catch {
    return iso;
  }
}

function StatusBadge({ status }: { status: string }) {
  const ok = status === 'ACTIVE' || status === 'paid';
  return (
    <View style={[st.badge, ok ? st.badgeOk : st.badgeErr]}>
      {ok
        ? <CheckCircle2 color={colors.success} size={10} />
        : <XCircle color={colors.danger} size={10} />
      }
      <Text style={[st.badgeText, { color: ok ? colors.success : colors.danger }]}>
        {status === 'ACTIVE' ? 'Actif' : status === 'paid' ? 'Payé' : status === 'CANCELLED' ? 'Annulé' : status}
      </Text>
    </View>
  );
}

function KpiCard({
  icon, label, value, sub, accentColor,
}: {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  sub?: string;
  accentColor: string;
}) {
  return (
    <View style={[st.kpiCard, { borderColor: accentColor + '33' }]}>
      <View style={[st.kpiIconWrap, { backgroundColor: accentColor + '1A' }]}>
        {icon}
      </View>
      <Text style={st.kpiLabel}>{label}</Text>
      <Text style={st.kpiValue}>{value}</Text>
      {sub ? <Text style={st.kpiSub}>{sub}</Text> : null}
    </View>
  );
}

export function UserDashboardScreen({ navigation }: RootScreen<'UserDashboard'>) {
  const { user } = useAuth();
  const [subs, setSubs] = useState<Subscription[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = () =>
    Promise.all([
      subscriptionsApi.list().catch(() => [] as Subscription[]),
      paymentsApi.myPayments().catch(() => [] as Payment[]),
    ]).then(([s, p]) => {
      setSubs(s);
      setPayments(p);
    });

  useEffect(() => { load().finally(() => setLoading(false)); }, []);

  const onRefresh = () => {
    setRefreshing(true);
    load().finally(() => setRefreshing(false));
  };

  const activeSubs = subs.filter(s => s.status === 'ACTIVE');
  const totalPaid = payments.reduce((sum, p) => sum + p.amount, 0);
  const nextPayment = subs
    .filter(s => s.nextBillingAt)
    .sort((a, b) => new Date(a.nextBillingAt!).getTime() - new Date(b.nextBillingAt!).getTime())[0];

  const chartData = payments
    .filter(p => p.paidAt)
    .slice()
    .sort((a, b) => new Date(a.paidAt!).getTime() - new Date(b.paidAt!).getTime())
    .slice(-12)
    .map(p => ({
      value: p.amount,
      label: fmtShort(p.paidAt!),
    }));

  const initials = user?.firstName && user?.lastName
    ? (user.firstName[0] + user.lastName[0]).toUpperCase()
    : (user?.firstName?.[0] ?? '?').toUpperCase();

  if (loading) {
    return (
      <View style={st.loadWrap}>
        <View style={st.loadPulse} />
        <View style={[st.loadPulse, { width: '60%', height: 100, marginTop: 12 }]} />
        <View style={[st.loadPulse, { height: 200, marginTop: 12 }]} />
      </View>
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
      <FadeInView delay={0}>
      {/* Welcome banner */}
      <View style={st.banner}>
        <View style={st.bannerRow}>
          <View style={st.avatar}>
            <Text style={st.avatarText}>{initials}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <View style={st.securedBadge}>
              <Fingerprint color={colors.primary} size={10} />
              <Text style={st.securedText}>ESPACE SÉCURISÉ</Text>
            </View>
            <Text style={st.bannerName}>Bonjour, {user?.firstName ?? 'Utilisateur'} !</Text>
            <Text style={st.bannerSub}>
              {activeSubs.length > 0
                ? `${activeSubs.length} service${activeSubs.length > 1 ? 's' : ''} actif${activeSubs.length > 1 ? 's' : ''} · protection en cours`
                : 'Aucun service actif pour l\'instant'}
            </Text>
          </View>
        </View>
        <View style={st.bannerActions}>
          <Pressable
            style={({ pressed }) => [st.bannerBtn, pressed && { opacity: 0.7 }]}
            onPress={() => navigation.navigate('Tabs', { screen: 'Catalog' })}
          >
            <Package color={colors.primary} size={13} />
            <Text style={st.bannerBtnText}>Explorer les solutions</Text>
          </Pressable>
        </View>
      </View>

      {/* KPI 2×2 grid */}
      <View style={st.kpiGrid}>
        <KpiCard
          icon={<Shield color={colors.primary} size={18} />}
          label="Services actifs"
          value={activeSubs.length}
          sub={activeSubs.length === 0 ? 'Aucun souscrit' : undefined}
          accentColor={colors.primary}
        />
        <KpiCard
          icon={<CreditCard color={colors.success} size={18} />}
          label="Total dépensé"
          value={`${totalPaid.toLocaleString('fr-FR')} €`}
          accentColor={colors.success}
        />
        <KpiCard
          icon={<Calendar color="#8B5CF6" size={18} />}
          label="Prochain paiement"
          value={nextPayment?.nextBillingAt ? fmt(nextPayment.nextBillingAt) : '—'}
          accentColor="#8B5CF6"
        />
        <KpiCard
          icon={<Activity color={colors.warning} size={18} />}
          label="Transactions"
          value={payments.length}
          accentColor={colors.warning}
        />
      </View>

      {/* Spending chart */}
      <View style={st.chartCard}>
        <View style={st.chartHeader}>
          <TrendingUp color={colors.primary} size={15} />
          <Text style={st.sectionTitle}>Historique des dépenses</Text>
          <Pressable
            style={st.seeAll}
            onPress={() => navigation.navigate('MyPayments')}
          >
            <Text style={st.linkText}>Voir tout</Text>
            <ArrowRight color={colors.primary} size={13} />
          </Pressable>
        </View>

        {chartData.length === 0 ? (
          <View style={st.emptyChart}>
            <AlertCircle color={colors.textDim} size={30} />
            <Text style={st.emptyText}>Aucune dépense enregistrée</Text>
          </View>
        ) : (
          <View style={{ marginLeft: -10 }}>
            <LineChart
              data={chartData}
              width={CHART_W}
              height={190}
              color={colors.primary}
              thickness={2}
              startFillColor="rgba(59,130,246,0.20)"
              endFillColor="rgba(59,130,246,0.01)"
              areaChart
              curved
              hideDataPoints={false}
              dataPointsColor={colors.primary}
              dataPointsRadius={4}
              focusedDataPointColor={colors.primaryLight}
              focusedDataPointRadius={6}
              xAxisColor={colors.border}
              yAxisColor={colors.border}
              xAxisLabelTextStyle={{ color: colors.textDim, fontSize: 9 }}
              yAxisTextStyle={{ color: colors.textDim, fontSize: 9 }}
              noOfSections={4}
              rulesColor={colors.borderSubtle}
              rulesType="solid"
              yAxisLabelSuffix="€"
              backgroundColor="transparent"
              initialSpacing={14}
              endSpacing={10}
              isAnimated
              animationDuration={800}
            />
          </View>
        )}
      </View>

      {/* Active subscriptions */}
      <View style={st.section}>
        <View style={st.sectionHead}>
          <Text style={st.sectionTitle}>Mes abonnements actifs</Text>
          <Pressable style={st.seeAll} onPress={() => navigation.navigate('MySubscriptions')}>
            <Text style={st.linkText}>Gérer</Text>
            <ArrowRight color={colors.primary} size={13} />
          </Pressable>
        </View>

        {activeSubs.length === 0 ? (
          <View style={st.emptyCard}>
            <Shield color={colors.textDim} size={28} />
            <Text style={st.emptyText}>Aucun abonnement actif</Text>
            <Pressable
              style={({ pressed }) => [st.emptyBtn, pressed && { opacity: 0.7 }]}
              onPress={() => navigation.navigate('Tabs', { screen: 'Catalog' })}
            >
              <Package color={colors.primary} size={13} />
              <Text style={st.emptyBtnText}>Découvrir nos solutions</Text>
            </Pressable>
          </View>
        ) : (
          <View style={st.listWrap}>
            {activeSubs.map(s => (
              <View key={s.id} style={st.subRow}>
                <View style={st.subIcon}>
                  <Shield color={colors.primary} size={15} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={st.subName} numberOfLines={1}>{s.service.title}</Text>
                  <Text style={st.subMeta}>
                    {s.price} €/{s.cycle === 'monthly' ? 'mois' : 'an'}
                    {s.nextBillingAt ? ` · renouvellement le ${fmt(s.nextBillingAt)}` : ''}
                  </Text>
                </View>
                <StatusBadge status={s.status} />
              </View>
            ))}
          </View>
        )}
      </View>

      {/* Recent payments */}
      <View style={[st.section, { marginBottom: 8 }]}>
        <View style={st.sectionHead}>
          <Text style={st.sectionTitle}>Derniers paiements</Text>
          <Pressable style={st.seeAll} onPress={() => navigation.navigate('MyPayments')}>
            <Text style={st.linkText}>Voir tout</Text>
            <ArrowRight color={colors.primary} size={13} />
          </Pressable>
        </View>

        {payments.length === 0 ? (
          <View style={st.emptyCard}>
            <CreditCard color={colors.textDim} size={28} />
            <Text style={st.emptyText}>Aucun paiement effectué</Text>
          </View>
        ) : (
          <View style={st.listWrap}>
            {payments.slice(0, 5).map(p => (
              <View key={p.id} style={st.payRow}>
                <View style={st.payIcon}>
                  <CreditCard color={colors.textMuted} size={15} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={st.payAmount}>{p.amount} €</Text>
                  <Text style={st.payDate}>{p.paidAt ? fmt(p.paidAt) : '—'}</Text>
                </View>
                <StatusBadge status={p.status} />
              </View>
            ))}
          </View>
        )}
      </View>
      </FadeInView>
    </ScrollView>
  );
}

const st = StyleSheet.create({
  scroll: { backgroundColor: colors.background },
  content: { padding: spacing.screen, gap: 16, paddingBottom: 48 },

  loadWrap: { flex: 1, backgroundColor: colors.background, padding: spacing.screen, gap: 12 },
  loadPulse: { width: '100%', height: 80, borderRadius: radius.lg, backgroundColor: colors.surface },

  // Banner
  banner: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    padding: 18,
    gap: 14,
  },
  bannerRow: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  avatar: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: 'rgba(59,130,246,0.15)',
    borderWidth: 2,
    borderColor: 'rgba(59,130,246,0.30)',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  avatarText: { color: colors.primary, fontSize: 18, fontWeight: '900' },
  securedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderColor: 'rgba(59,130,246,0.20)',
    backgroundColor: 'rgba(59,130,246,0.10)',
    borderRadius: radius.full,
    paddingHorizontal: 8,
    paddingVertical: 3,
    marginBottom: 4,
  },
  securedText: {
    color: colors.primary,
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 1.2,
  },
  bannerName: { color: colors.text, fontSize: 16, fontWeight: '800' },
  bannerSub: { color: colors.textMuted, fontSize: 12, marginTop: 2 },
  bannerActions: { flexDirection: 'row' },
  bannerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  bannerBtnText: { color: colors.primary, fontSize: 13, fontWeight: '600' },

  // KPI Grid
  kpiGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  kpiCard: {
    flex: 1,
    minWidth: '46%',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderRadius: radius.lg,
    padding: 16,
    gap: 6,
  },
  kpiIconWrap: {
    width: 36,
    height: 36,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 2,
  },
  kpiLabel: {
    color: colors.textDim,
    fontSize: 10,
    fontWeight: '600',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  kpiValue: { color: colors.text, fontSize: 20, fontWeight: '900' },
  kpiSub: { color: colors.textMuted, fontSize: 10 },

  // Chart
  chartCard: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    padding: 18,
  },
  chartHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  emptyChart: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
    gap: 8,
  },

  // Sections
  section: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    padding: 18,
    gap: 12,
  },
  sectionHead: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sectionTitle: { flex: 1, color: colors.text, fontSize: 14, fontWeight: '700' },
  seeAll: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  linkText: { color: colors.primary, fontSize: 12, fontWeight: '600' },

  // List
  listWrap: { gap: 10 },

  // Sub row
  subRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    borderRadius: radius.md,
    padding: 12,
  },
  subIcon: {
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
  subName: { color: colors.text, fontSize: 13, fontWeight: '600' },
  subMeta: { color: colors.textMuted, fontSize: 11, marginTop: 2 },

  // Pay row
  payRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    borderRadius: radius.md,
    padding: 12,
  },
  payIcon: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: colors.surfaceElevated,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  payAmount: { color: colors.text, fontSize: 14, fontWeight: '700' },
  payDate: { color: colors.textMuted, fontSize: 11, marginTop: 2 },

  // Empty state
  emptyCard: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 28,
    gap: 8,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: colors.border,
    borderRadius: radius.md,
  },
  emptyText: { color: colors.textMuted, fontSize: 13 },
  emptyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 4,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  emptyBtnText: { color: colors.primary, fontSize: 13, fontWeight: '600' },

  // Status badge
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: radius.full,
    borderWidth: 1,
  },
  badgeOk: {
    backgroundColor: 'rgba(16,185,129,0.10)',
    borderColor: 'rgba(16,185,129,0.20)',
  },
  badgeErr: {
    backgroundColor: 'rgba(239,68,68,0.10)',
    borderColor: 'rgba(239,68,68,0.20)',
  },
  badgeText: { fontSize: 11, fontWeight: '700' },
});
