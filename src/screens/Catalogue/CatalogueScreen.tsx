import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Animated, FlatList, Pressable, RefreshControl, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { PackageSearch, Search, SlidersHorizontal, X } from 'lucide-react-native';

import { ServiceCard } from '../../components/shared/ServiceCard';
import { SkeletonCard } from '../../components/ui/Skeleton';
import { FadeInView } from '../../components/ui/FadeInView';
import { servicesApi, type Service } from '../../api/services';
import { colors, radius } from '../../theme/colors';

function AnimatedCard({ index, children }: { index: number; children: React.ReactNode }) {
  const anim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(anim, {
      toValue: 1,
      duration: 380,
      delay: index * 70,
      useNativeDriver: true,
    }).start();
  }, []);
  return (
    <Animated.View style={{
      opacity: anim,
      transform: [{ translateY: anim.interpolate({ inputRange: [0, 1], outputRange: [24, 0] }) }],
    }}>
      {children}
    </Animated.View>
  );
}

type Sort = 'relevance' | 'price_asc' | 'price_desc' | 'newest';
type TypeFilter = 'all' | 'saas' | 'one_shot';

const TYPE_LABELS: Record<TypeFilter, string> = {
  all: 'Tous',
  saas: 'SaaS',
  one_shot: 'One Shot',
};

export function CatalogueScreen() {
  const { t } = useTranslation();
  const nav = useNavigation<any>();
  const insets = useSafeAreaInsets();

  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [query, setQuery] = useState('');
  const [activeCat, setActiveCat] = useState<string>('all');
  const [activeType, setActiveType] = useState<TypeFilter>('all');
  const [sort, setSort] = useState<Sort>('relevance');
  const [showFilters, setShowFilters] = useState(false);

  const fetch = (opts?: { silent?: boolean }) => {
    if (!opts?.silent) setLoading(true);
    return servicesApi
      .search({
        q: query || undefined,
        categories: activeCat !== 'all' ? [activeCat] : undefined,
        type: activeType,
        sort,
      })
      .then((res) => setServices(res.items ?? []))
      .catch(() => setServices([]))
      .finally(() => { setLoading(false); setRefreshing(false); });
  };

  useEffect(() => {
    setLoading(true);
    const id = setTimeout(() => fetch(), 250);
    return () => clearTimeout(id);
  }, [query, activeCat, activeType, sort]);

  const onRefresh = () => {
    setRefreshing(true);
    fetch({ silent: true });
  };

  const categories = useMemo(() => {
    const map = new Map<string, string>();
    services.forEach((s) => {
      if (s.categorySlug && !map.has(s.categorySlug)) {
        map.set(s.categorySlug, s.category);
      }
    });
    return Array.from(map, ([slug, name]) => ({ slug, name }));
  }, [services]);

  return (
    <FadeInView delay={0} style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
        <View style={styles.headingRow}>
          <View>
            <Text style={styles.eyebrow}>CATALOGUE</Text>
            <Text style={styles.title}>{t('catalog.title')}</Text>
          </View>
          {!loading && (
            <View style={styles.countBadge}>
              <Text style={styles.countText}>{services.length}</Text>
            </View>
          )}
        </View>

        {/* Search */}
        <View style={styles.searchBox}>
          <Search color={colors.textDim} size={17} />
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder={t('catalog.searchPlaceholder')}
            placeholderTextColor={colors.textDim}
            style={styles.searchInput}
          />
          {query.length > 0 && (
            <Pressable onPress={() => setQuery('')} accessibilityLabel="Effacer" hitSlop={10}>
              <View style={styles.clearBtn}>
                <X color={colors.textMuted} size={13} />
              </View>
            </Pressable>
          )}
        </View>

        {/* Type filter chips */}
        <View style={styles.typeRow}>
          {(['all', 'saas', 'one_shot'] as TypeFilter[]).map((type) => (
            <Pressable
              key={type}
              onPress={() => setActiveType(type)}
              style={[styles.typeChip, activeType === type && styles.typeChipActive]}
            >
              <Text style={[styles.typeChipText, activeType === type && styles.typeChipTextActive]}>
                {TYPE_LABELS[type]}
              </Text>
            </Pressable>
          ))}
        </View>

        <View style={styles.toolbar}>
          <Pressable
            style={[styles.filterBtn, showFilters && styles.filterBtnActive]}
            onPress={() => setShowFilters((v) => !v)}
            accessibilityLabel="Filtres"
          >
            <SlidersHorizontal color={showFilters ? colors.primary : colors.textMuted} size={14} />
            <Text style={[styles.filterText, showFilters && { color: colors.primary }]}>
              {t('catalog.filters')}
            </Text>
          </Pressable>
          <Text style={styles.count}>
            {loading ? '…' : t('catalog.resultsCount', { count: services.length })}
          </Text>
        </View>

        {showFilters && (
          <View style={styles.filters}>
            <Text style={styles.filterLabel}>{t('catalog.sort')}</Text>
            <View style={styles.chipsRow}>
              {(['relevance', 'price_asc', 'price_desc', 'newest'] as Sort[]).map((s) => (
                <Pressable
                  key={s}
                  onPress={() => setSort(s)}
                  style={[styles.chip, sort === s && styles.chipActive]}
                >
                  <Text style={[styles.chipText, sort === s && styles.chipTextActive]}>
                    {t(`catalog.sort${s === 'relevance' ? 'Relevance' : s === 'price_asc' ? 'PriceAsc' : s === 'price_desc' ? 'PriceDesc' : 'Newest'}`)}
                  </Text>
                </Pressable>
              ))}
            </View>
            <Text style={styles.filterLabel}>{t('catalog.category')}</Text>
            <View style={styles.chipsRow}>
              <Pressable
                onPress={() => setActiveCat('all')}
                style={[styles.chip, activeCat === 'all' && styles.chipActive]}
              >
                <Text style={[styles.chipText, activeCat === 'all' && styles.chipTextActive]}>
                  {t('catalog.allCategories')}
                </Text>
              </Pressable>
              {categories.map((c) => (
                <Pressable
                  key={c.slug}
                  onPress={() => setActiveCat(c.slug)}
                  style={[styles.chip, activeCat === c.slug && styles.chipActive]}
                >
                  <Text style={[styles.chipText, activeCat === c.slug && styles.chipTextActive]}>
                    {c.name}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>
        )}
      </View>

      {loading ? (
        <View style={styles.skeletonList}>
          {[0, 1, 2].map((i) => <SkeletonCard key={i} />)}
        </View>
      ) : services.length === 0 ? (
        <View style={styles.empty}>
          <View style={styles.emptyIconWrap}>
            <PackageSearch color={colors.primary} size={34} strokeWidth={1.5} />
          </View>
          <Text style={styles.emptyTitle}>{t('catalog.noResults')}</Text>
          <Text style={styles.emptyHint}>Essayez d'autres mots-clés ou catégories.</Text>
        </View>
      ) : (
        <FlatList
          data={services}
          keyExtractor={(s) => String(s.id)}
          removeClippedSubviews
          maxToRenderPerBatch={5}
          windowSize={8}
          initialNumToRender={6}
          renderItem={({ item, index }) => (
            <AnimatedCard index={index}>
              <ServiceCard
                service={item}
                onPress={() => nav.navigate('ServiceDetails', { id: item.id })}
              />
            </AnimatedCard>
          )}
          ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={colors.primary}
            />
          }
        />
      )}
    </FadeInView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: {
    paddingHorizontal: 20,
    paddingBottom: 16,
    gap: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    backgroundColor: colors.background,
  },
  headingRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' },
  eyebrow: { color: colors.primary, fontSize: 10, fontWeight: '700', letterSpacing: 1.8, textTransform: 'uppercase' },
  title: { color: colors.text, fontSize: 30, fontWeight: '900', letterSpacing: -0.5, marginTop: 4 },
  countBadge: {
    backgroundColor: colors.primaryGlow,
    borderRadius: radius.full,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderWidth: 1,
    borderColor: colors.borderAccent,
    marginBottom: 4,
  },
  countText: { color: colors.primaryLight, fontSize: 14, fontWeight: '800' },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: colors.surfaceElevated,
    borderWidth: 1.5,
    borderColor: colors.border,
    paddingHorizontal: 14,
    height: 48,
    borderRadius: radius.lg,
  },
  searchInput: { flex: 1, color: colors.text, fontSize: 15 },
  clearBtn: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: colors.surfaceHigh,
    alignItems: 'center',
    justifyContent: 'center',
  },
  toolbar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  filterBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    backgroundColor: colors.surfaceElevated,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
  },
  filterBtnActive: { borderColor: colors.borderAccent, backgroundColor: colors.primaryGlow },
  filterText: { color: colors.textMuted, fontSize: 13, fontWeight: '600' },
  count: { color: colors.textDim, fontSize: 12 },
  typeRow: { flexDirection: 'row', gap: 6 },
  typeChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.full,
    backgroundColor: colors.surfaceElevated,
  },
  typeChipActive: { backgroundColor: colors.primaryGlow, borderColor: colors.borderAccent },
  typeChipText: { color: colors.textMuted, fontSize: 13, fontWeight: '600' },
  typeChipTextActive: { color: colors.primaryLight, fontWeight: '700' },
  filters: { gap: 10 },
  filterLabel: { color: colors.textDim, fontSize: 10, fontWeight: '700', letterSpacing: 1, textTransform: 'uppercase' },
  chipsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.full,
    backgroundColor: colors.surfaceElevated,
  },
  chipActive: { backgroundColor: colors.primaryGlow, borderColor: colors.borderAccent },
  chipText: { color: colors.textMuted, fontSize: 12 },
  chipTextActive: { color: colors.primaryLight, fontWeight: '700' },
  skeletonList: { padding: 20, gap: 12 },
  list: { padding: 20, paddingBottom: 48 },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 14, padding: 40 },
  emptyIconWrap: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: colors.primaryGlow,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.borderAccent,
  },
  emptyTitle: { color: colors.text, fontSize: 18, fontWeight: '700', textAlign: 'center' },
  emptyHint: { color: colors.textMuted, fontSize: 13, textAlign: 'center', lineHeight: 20 },
});
