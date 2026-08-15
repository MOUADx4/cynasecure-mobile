import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
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
  ArrowRight,
  CheckCircle2,
  Package,
  TrendingUp,
  Users,
  XCircle,
} from 'lucide-react-native';
import { BarChart, PieChart } from 'react-native-gifted-charts';
import type { pieDataItem } from 'gifted-charts-core';

import { adminApi, type AdminStats, type AdminSubscription } from '../../api/admin';
import { adminStatsApi, type ChartData } from '../../api/adminStats';
import { colors, radius, spacing } from '../../theme/colors';
import type { RootScreen } from '../../navigation/types';

const { width: SCREEN_W } = Dimensions.get('window');
const CHART_W = SCREEN_W - spacing.screen * 2 - 36;

const PALETTE = ['#3B82F6', '#10B981', '#F59E0B', '#8B5CF6', '#EC4899', '#06B6D4'];

function fmtNum(n: number) {
  return n >= 1000 ? `${(n / 1000).toFixed(1)}k` : String(n);
}

function fmtEur(n: number) {
  return `${n.toLocaleString('fr-FR')} €`;
}

function fmtDate(iso: string) {
  try {
    return new Date(iso).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' });
  } catch {
    return iso;
  }
}

// KPI Card
function KpiCard({
  icon, label, value, accentColor, onPress,
}: {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  accentColor: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      style={({ pressed }) => [st.kpiCard, { borderColor: accentColor + '33' }, pressed && { opacity: 0.75 }]}
      onPress={onPress}
    >
      <View style={st.kpiCardTop}>
        <View style={[st.kpiIconWrap, { backgroundColor: accentColor + '1A' }]}>{icon}</View>
        <ArrowRight color={colors.textDim} size={14} />
      </View>
      <Text style={st.kpiLabel}>{label}</Text>
      <Text style={st.kpiValue}>{value}</Text>
    </Pressable>
  );
}

// Status badge
function StatusBadge({ status }: { status: string }) {
  const ok = status === 'ACTIVE';
  return (
    <View style={[st.badge, ok ? st.badgeOk : st.badgeErr]}>
      {ok
        ? <CheckCircle2 color={colors.success} size={9} />
        : <XCircle color={colors.danger} size={9} />
      }
      <Text style={[st.badgeText, { color: ok ? colors.success : colors.danger }]}>
        {ok ? 'Actif' : status === 'CANCELLED' ? 'Annulé' : status}
      </Text>
    </View>
  );
}

// Sales bar chart
function SalesBarChart({ data }: { data: ChartData['salesOverTime'] }) {
  const total = data.reduce((s, d) => s + d.total, 0);
  const isEmpty = total === 0;

  const barData = data.map(pt => ({
    value: pt.total,
    label: pt.label,
    frontColor: PALETTE[0],
    topLabelComponent: () => (
      <Text style={{ color: colors.textMuted, fontSize: 7, marginBottom: 2 }}>
        {pt.total >= 1000 ? `${(pt.total / 1000).toFixed(1)}k` : pt.total.toFixed(0)}
      </Text>
    ),
  }));

  return (
    <View style={st.chartCard}>
      <Text style={st.chartTitle}>Ventes par période</Text>
      <Text style={st.chartSub}>
        Total · <Text style={{ color: colors.text }}>{fmtEur(total)}</Text>
      </Text>
      {isEmpty ? (
        <View style={st.emptyChart}>
          <Text style={st.emptyText}>Pas encore de ventes sur la période</Text>
        </View>
      ) : (
        <View style={{ marginLeft: -10, marginTop: 12 }}>
          <BarChart
            data={barData}
            width={CHART_W}
            height={200}
            barWidth={SCREEN_W < 380 ? 16 : 22}
            spacing={SCREEN_W < 380 ? 8 : 12}
            noOfSections={4}
            yAxisTextStyle={{ color: colors.textMuted, fontSize: 9 }}
            xAxisLabelTextStyle={{ color: colors.textMuted, fontSize: 8 }}
            rulesColor={colors.borderSubtle}
            backgroundColor="transparent"
            isAnimated
            hideRules={false}
            showFractionalValues
            roundedTop
            yAxisLabelSuffix="€"
          />
        </View>
      )}
    </View>
  );
}

// Stacked category chart
function StackedSalesChart({ data }: { data: ChartData['salesByCategory'] }) {
  const allCategories = Array.from(new Set(data.flatMap(pt => Object.keys(pt.categories))));
  const isEmpty = allCategories.length === 0;

  const stackData = data.map(pt => ({
    stacks: allCategories.map((cat, i) => ({
      value: pt.categories[cat] ?? 0,
      color: PALETTE[i % PALETTE.length],
      marginBottom: 2,
    })),
    label: pt.label,
  }));

  return (
    <View style={st.chartCard}>
      <Text style={st.chartTitle}>Ventes par catégorie</Text>
      <Text style={st.chartSub}>Paniers moyens par catégorie</Text>
      {isEmpty ? (
        <View style={st.emptyChart}>
          <Text style={st.emptyText}>Pas encore de ventes sur la période</Text>
        </View>
      ) : (
        <>
          <View style={st.legend}>
            {allCategories.map((cat, i) => (
              <View key={cat} style={st.legendItem}>
                <View style={[st.legendDot, { backgroundColor: PALETTE[i % PALETTE.length] }]} />
                <Text style={st.legendText}>{cat}</Text>
              </View>
            ))}
          </View>
          <View style={{ marginLeft: -10, marginTop: 8 }}>
            <BarChart
              stackData={stackData}
              width={CHART_W}
              height={200}
              barWidth={SCREEN_W < 380 ? 16 : 22}
              spacing={SCREEN_W < 380 ? 8 : 12}
              noOfSections={4}
              yAxisTextStyle={{ color: colors.textMuted, fontSize: 9 }}
              xAxisLabelTextStyle={{ color: colors.textMuted, fontSize: 8 }}
              rulesColor={colors.borderSubtle}
              backgroundColor="transparent"
              isAnimated
            />
          </View>
        </>
      )}
    </View>
  );
}

// Pie chart
function CategoryPieChart({ data }: { data: ChartData['categoryDistribution'] }) {
  const [focused, setFocused] = useState<number | null>(null);
  const total = data.reduce((s, d) => s + d.total, 0);
  const isEmpty = data.length === 0;

  const pieData = data.map((item, i) => ({
    value: item.total,
    color: PALETTE[i % PALETTE.length],
    text: `${item.percentage.toFixed(0)}%`,
    focused: focused === i,
  }));

  const focusedItem = focused !== null ? data[focused] : null;

  return (
    <View style={st.chartCard}>
      <Text style={st.chartTitle}>Répartition par catégorie</Text>
      <Text style={st.chartSub}>
        Total période · <Text style={{ color: colors.text }}>{fmtEur(total)}</Text>
      </Text>
      {isEmpty ? (
        <View style={st.emptyChart}>
          <Text style={st.emptyText}>Pas encore de ventes sur la période</Text>
        </View>
      ) : (
        <View style={st.pieRow}>
          <PieChart
            data={pieData}
            donut
            radius={90}
            innerRadius={56}
            innerCircleColor={colors.surface}
            onPress={(_item: pieDataItem, index: number) =>
              setFocused(focused === index ? null : index)
            }
            centerLabelComponent={() => (
              <View style={st.pieCenter}>
                {focusedItem ? (
                  <>
                    <Text style={st.pieCenterValue}>{fmtEur(focusedItem.total)}</Text>
                    <Text style={st.pieCenterLabel} numberOfLines={2}>{focusedItem.category}</Text>
                  </>
                ) : (
                  <Text style={st.pieCenterHint}>Appuyez</Text>
                )}
              </View>
            )}
          />
          <View style={st.pieLegend}>
            {data.map((item, i) => (
              <Pressable
                key={item.category}
                onPress={() => setFocused(focused === i ? null : i)}
                style={st.pieLegendItem}
              >
                <View style={[st.legendDot, { backgroundColor: PALETTE[i % PALETTE.length] }]} />
                <View style={{ flex: 1 }}>
                  <Text style={st.legendText} numberOfLines={1}>{item.category}</Text>
                  <Text style={st.pieLegendPct}>{item.percentage.toFixed(1)}%</Text>
                </View>
              </Pressable>
            ))}
          </View>
        </View>
      )}
    </View>
  );
}

// Main screen
export function AdminDashboardScreen({ navigation }: RootScreen<'AdminDashboard'>) {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [recentSubs, setRecentSubs] = useState<AdminSubscription[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [period, setPeriod] = useState<'days' | 'weeks'>('days');
  const [chartData, setChartData] = useState<ChartData | null>(null);
  const [chartLoading, setChartLoading] = useState(false);

  const loadStats = () =>
    Promise.all([
      adminApi.getStats(),
      adminApi.getSubscriptions(1),
    ]).then(([s, subsPage]) => {
      setStats(s);
      const sorted = [...subsPage.items]
        .sort((a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime())
        .slice(0, 6);
      setRecentSubs(sorted);
    });

  useEffect(() => {
    loadStats().finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    setChartLoading(true);
    adminStatsApi.getCharts(period)
      .then(setChartData)
      .catch(() => {})
      .finally(() => setChartLoading(false));
  }, [period]);

  const onRefresh = () => {
    setRefreshing(true);
    Promise.all([loadStats(), adminStatsApi.getCharts(period).then(setChartData).catch(() => {})])
      .finally(() => setRefreshing(false));
  };

  if (loading) {
    return (
      <View style={st.loadWrap}>
        <View style={st.loadPulse} />
        <View style={[st.loadPulse, { height: 120, marginTop: 12 }]} />
        <View style={[st.loadPulse, { height: 220, marginTop: 12 }]} />
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
      {/* Header */}
      <View style={st.header}>
        <Text style={st.eyebrow}>CONSOLE ADMINISTRATEUR</Text>
        <Text style={st.pageTitle}>Tableau de bord</Text>
      </View>

      {/* KPI 2x2 */}
      <View style={st.kpiGrid}>
        <KpiCard
          icon={<Package color="#8B5CF6" size={17} />}
          label="Services"
          value={fmtNum(stats?.services ?? 0)}
          accentColor="#8B5CF6"
          onPress={() => navigation.navigate('AdminServices')}
        />
        <KpiCard
          icon={<Users color={colors.primary} size={17} />}
          label="Utilisateurs"
          value={fmtNum(stats?.users ?? 0)}
          accentColor={colors.primary}
          onPress={() => navigation.navigate('AdminUsers')}
        />
        <KpiCard
          icon={<Activity color={colors.success} size={17} />}
          label="Abonnements actifs"
          value={fmtNum(stats?.subscriptions ?? 0)}
          accentColor={colors.success}
          onPress={() => navigation.navigate('AdminSubscriptions')}
        />
        <KpiCard
          icon={<TrendingUp color={colors.warning} size={17} />}
          label="MRR"
          value={fmtEur(stats?.mrr ?? 0)}
          accentColor={colors.warning}
          onPress={() => navigation.navigate('AdminSubscriptions')}
        />
      </View>

      {/* Charts section */}
      <View style={st.chartSection}>
        <View style={st.chartSectionHead}>
          <Text style={st.sectionTitle}>Statistiques de ventes</Text>
          <View style={st.periodToggle}>
            {(['days', 'weeks'] as const).map(p => {
              const active = period === p;
              return (
                <Pressable
                  key={p}
                  onPress={() => setPeriod(p)}
                  style={[st.periodBtn, active && st.periodBtnActive]}
                >
                  <Text style={[st.periodLabel, active && st.periodLabelActive]}>
                    {p === 'days' ? '7J' : '5S'}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        {chartLoading ? (
          <View style={st.chartLoader}>
            <ActivityIndicator color={colors.primary} />
          </View>
        ) : chartData ? (
          <>
            <SalesBarChart data={chartData.salesOverTime} />
            <StackedSalesChart data={chartData.salesByCategory} />
            <CategoryPieChart data={chartData.categoryDistribution} />
          </>
        ) : (
          <View style={st.chartLoader}>
            <Text style={st.emptyText}>Données indisponibles</Text>
          </View>
        )}
      </View>

      {/* Recent subscriptions */}
      <View style={st.recentSection}>
        <View style={st.sectionHead}>
          <Text style={st.sectionTitle}>Abonnements récents</Text>
          <Pressable style={st.seeAll} onPress={() => navigation.navigate('AdminSubscriptions')}>
            <Text style={st.linkText}>Voir tous</Text>
            <ArrowRight color={colors.primary} size={13} />
          </Pressable>
        </View>

        {recentSubs.length === 0 ? (
          <View style={st.emptyCard}>
            <Text style={st.emptyText}>Aucun abonnement enregistré.</Text>
          </View>
        ) : (
          <View style={st.subList}>
            {recentSubs.map(sub => (
              <View key={sub.id} style={st.subRow}>
                <View style={{ flex: 1, minWidth: 0 }}>
                  <Text style={st.subUser} numberOfLines={1}>
                    {sub.user.firstName} {sub.user.lastName}
                  </Text>
                  <Text style={st.subService} numberOfLines={1}>{sub.service.name}</Text>
                </View>
                <View style={st.subRight}>
                  <Text style={st.subPrice}>
                    {sub.price} €
                    <Text style={st.subCycle}> /{sub.cycle === 'monthly' ? 'mois' : 'an'}</Text>
                  </Text>
                  <StatusBadge status={sub.status} />
                  <Text style={st.subDate}>{fmtDate(sub.startDate)}</Text>
                </View>
              </View>
            ))}
          </View>
        )}
      </View>
    </ScrollView>
  );
}

const st = StyleSheet.create({
  scroll: { backgroundColor: colors.background },
  content: { padding: spacing.screen, gap: 16, paddingBottom: 48 },

  loadWrap: { flex: 1, backgroundColor: colors.background, padding: spacing.screen, gap: 0 },
  loadPulse: { width: '100%', height: 60, borderRadius: radius.lg, backgroundColor: colors.surface },

  // Header
  header: { gap: 4 },
  eyebrow: {
    color: colors.primary,
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  },
  pageTitle: { color: colors.text, fontSize: 26, fontWeight: '900', letterSpacing: -0.5 },

  // KPI Grid
  kpiGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  kpiCard: {
    flex: 1,
    minWidth: '46%',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderRadius: radius.lg,
    padding: 16,
    gap: 8,
  },
  kpiCardTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  kpiIconWrap: {
    width: 34,
    height: 34,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  kpiLabel: {
    color: colors.textDim,
    fontSize: 10,
    fontWeight: '600',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  kpiValue: { color: colors.text, fontSize: 22, fontWeight: '900' },

  // Charts section
  chartSection: { gap: 12 },
  chartSectionHead: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sectionTitle: { color: colors.text, fontSize: 14, fontWeight: '700' },
  periodToggle: {
    flexDirection: 'row',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    overflow: 'hidden',
  },
  periodBtn: {
    paddingVertical: 6,
    paddingHorizontal: 14,
    backgroundColor: colors.surface,
  },
  periodBtnActive: { backgroundColor: colors.primary },
  periodLabel: { color: colors.textMuted, fontSize: 11, fontWeight: '700', letterSpacing: 0.5 },
  periodLabelActive: { color: '#fff' },

  chartLoader: { height: 120, alignItems: 'center', justifyContent: 'center' },

  chartCard: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    padding: 18,
    overflow: 'hidden',
  },
  chartTitle: { color: colors.text, fontSize: 14, fontWeight: '700' },
  chartSub: { color: colors.textMuted, fontSize: 11, marginTop: 2 },

  emptyChart: { alignItems: 'center', justifyContent: 'center', paddingVertical: 40 },
  emptyText: { color: colors.textMuted, fontSize: 13 },

  legend: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 10 },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  legendDot: { width: 8, height: 8, borderRadius: 4, flexShrink: 0 },
  legendText: { color: colors.textMuted, fontSize: 10 },

  pieRow: { flexDirection: 'row', alignItems: 'center', gap: 16, marginTop: 12 },
  pieLegend: { flex: 1, gap: 8 },
  pieLegendItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  pieLegendPct: { color: colors.textDim, fontSize: 10 },
  pieCenter: { alignItems: 'center', paddingHorizontal: 4 },
  pieCenterValue: { color: colors.text, fontSize: 13, fontWeight: '800', textAlign: 'center' },
  pieCenterLabel: { color: colors.textMuted, fontSize: 9, textAlign: 'center', marginTop: 2 },
  pieCenterHint: { color: colors.textDim, fontSize: 10 },

  // Recent subscriptions
  recentSection: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    overflow: 'hidden',
  },
  sectionHead: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderSubtle,
  },
  seeAll: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  linkText: { color: colors.primary, fontSize: 12, fontWeight: '600' },

  subList: {},
  subRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderSubtle,
  },
  subUser: { color: colors.text, fontSize: 13, fontWeight: '600' },
  subService: { color: colors.textMuted, fontSize: 11, marginTop: 2 },
  subRight: { alignItems: 'flex-end', gap: 4, flexShrink: 0 },
  subPrice: { color: colors.text, fontSize: 13, fontWeight: '700' },
  subCycle: { color: colors.textMuted, fontSize: 11, fontWeight: '400' },
  subDate: { color: colors.textDim, fontSize: 10 },

  emptyCard: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 32,
  },

  // Badge
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 7,
    paddingVertical: 3,
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
  badgeText: { fontSize: 10, fontWeight: '700' },
});
