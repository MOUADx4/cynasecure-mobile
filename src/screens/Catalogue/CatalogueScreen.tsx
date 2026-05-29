import React, { useEffect, useMemo, useState } from 'react';
import { FlatList, Pressable, RefreshControl, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { Search, X, SlidersHorizontal, PackageSearch } from 'lucide-react-native';

import { ServiceCard } from '../../components/shared/ServiceCard';
import { SkeletonCard } from '../../components/ui/Skeleton';
import { servicesApi, type Service } from '../../api/services';
import { colors, radius } from '../../theme/colors';

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
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
        <Text style={styles.eyebrow}>CATALOGUE</Text>
        <Text style={styles.title}>{t('catalog.title')}</Text>

        <View style={styles.searchBox}>
          <Search color={colors.textDim} size={18} />
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder={t('catalog.searchPlaceholder')}
            placeholderTextColor={colors.textDim}
            style={styles.searchInput}
          />
          {query.length > 0 && (
            <Pressable onPress={() => setQuery('')} accessibilityLabel="Effacer la recherche" hitSlop={8}>
              <X color={colors.textMuted} size={16} />
            </Pressable>
          )}
        </View>

        {/* Type filter chips — always visible */}
        <View style={styles.typeRow}>
          {(['all', 'saas', 'one_shot'] as TypeFilter[]).map((t) => (
            <Pressable
              key={t}
              onPress={() => setActiveType(t)}
              style={[styles.typeChip, activeType === t && styles.typeChipActive]}
            >
              <Text style={[styles.typeChipText, activeType === t && styles.typeChipTextActive]}>
                {TYPE_LABELS[t]}
              </Text>
            </Pressable>
          ))}
        </View>

        <View style={styles.toolbar}>
          <Pressable
            style={styles.filterBtn}
            onPress={() => setShowFilters((v) => !v)}
            accessibilityLabel="Ouvrir les filtres"
          >
            <SlidersHorizontal color={showFilters ? colors.primary : colors.text} size={15} />
            <Text style={[styles.filterText, showFilters && { color: colors.primary }]}>{t('catalog.filters')}</Text>
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
          <PackageSearch color={colors.textDim} size={48} strokeWidth={1.5} />
          <Text style={styles.emptyTitle}>{t('catalog.noResults')}</Text>
          <Text style={styles.emptyHint}>Essayez d'autres mots-clés ou catégories.</Text>
        </View>
      ) : (
        <FlatList
          data={services}
          keyExtractor={(s) => String(s.id)}
          renderItem={({ item }) => (
            <ServiceCard
              service={item}
              onPress={() => nav.navigate('ServiceDetails', { id: item.id })}
            />
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
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: { padding: 20, gap: 12, borderBottomWidth: 1, borderBottomColor: colors.border },
  eyebrow: { color: colors.primary, fontSize: 11, fontWeight: '700', letterSpacing: 1.5, textTransform: 'uppercase' },
  title: { color: colors.text, fontSize: 30, fontWeight: '900', letterSpacing: -0.5 },
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
  filterText: { color: colors.text, fontSize: 13, fontWeight: '600' },
  count: { color: colors.textMuted, fontSize: 12 },
  typeRow: { flexDirection: 'row', gap: 6 },
  typeChip: {
    paddingHorizontal: 16,
    paddingVertical: 7,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.full,
    backgroundColor: colors.surfaceElevated,
  },
  typeChipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  typeChipText: { color: colors.textMuted, fontSize: 13, fontWeight: '600' },
  typeChipTextActive: { color: '#fff' },
  filters: { gap: 8 },
  filterLabel: { color: colors.textMuted, fontSize: 11, fontWeight: '700', letterSpacing: 0.8, textTransform: 'uppercase' },
  chipsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.full,
  },
  chipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  chipText: { color: colors.textMuted, fontSize: 12 },
  chipTextActive: { color: '#fff', fontWeight: '600' },
  skeletonList: { padding: 20, gap: 12 },
  list: { padding: 20, paddingBottom: 40 },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, padding: 32 },
  emptyTitle: { color: colors.text, fontSize: 17, fontWeight: '700', textAlign: 'center' },
  emptyHint: { color: colors.textMuted, fontSize: 13, textAlign: 'center' },
});
