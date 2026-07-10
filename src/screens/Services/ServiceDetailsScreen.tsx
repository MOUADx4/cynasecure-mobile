import React, { useEffect, useState } from 'react';
import { Alert, Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Check, X, Layers, Cpu, Lock, Sparkles, ShoppingCart } from 'lucide-react-native';

import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Loader } from '../../components/ui/Loader';
import { ServiceCard } from '../../components/shared/ServiceCard';
import { servicesApi, type Service } from '../../api/services';
import { useCart, type BillingCycle } from '../../context/CartContext';
import { useHaptic } from '../../hooks/useHaptic';
import { colors, radius } from '../../theme/colors';
import type { RootScreen } from '../../navigation/types';
import { getServiceImageSource } from '../../utils/serviceImage';

export function ServiceDetailsScreen({ route, navigation }: RootScreen<'ServiceDetails'>) {
  const { id } = route.params;
  const { t } = useTranslation();
  const { addToCart, items } = useCart();
  const { success: hapticSuccess } = useHaptic();

  const [service, setService] = useState<Service | null>(null);
  const [similar, setSimilar] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [cycle, setCycle] = useState<BillingCycle>('monthly');

  useEffect(() => {
    setLoading(true);
    servicesApi
      .getById(id)
      .then((s) => {
        setService(s);
        navigation.setOptions({ title: s.name });
        return servicesApi.getSimilar(id, 6).then(setSimilar).catch(() => {});
      })
      .catch(() => setService(null))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <Loader label={t('common.loading')} />;
  if (!service) return null;

  const yearlyPrice = service.priceYearly ?? Math.round(service.priceMonthly * 12 * 0.85);
  const yearlySaving = Math.round(service.priceMonthly * 12 - yearlyPrice);
  const inCart = items.some((i) => i.id === service.id);
  const unavailable = service.availability && service.availability !== 'available';

  const handleAdd = () => {
    if (inCart) {
      navigation.navigate('Tabs', { screen: 'Cart' });
      return;
    }
    addToCart({
      id: service.id,
      name: service.name,
      description: service.description,
      priceMonthly: service.priceMonthly,
      priceYearly: service.priceYearly,
      cycle,
      image: service.image,
    });
    hapticSuccess();
    Alert.alert(t('service.addedToCart'));
  };

  const ctaLabel = unavailable
    ? t('service.unavailable')
    : inCart
    ? t('cart.title')
    : service.type === 'one_shot'
    ? t('service.buy')
    : t('service.subscribe');

  return (
    <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
      {getServiceImageSource(service.image) && (
        <Image source={getServiceImageSource(service.image)!} style={styles.image} resizeMode="cover" />
      )}

      <View style={styles.header}>
        <View style={styles.tags}>
          <Badge label={service.category?.toUpperCase() ?? ''} tone="primary" />
          {service.badge && <Badge label={service.badge} tone="warning" />}
        </View>
        <Text style={styles.title}>{service.name}</Text>
        <Text style={styles.desc}>{service.longDescription || service.description}</Text>
      </View>

      {service.type === 'saas' && (
        <Card style={styles.pricing}>
          <View style={styles.cycleSwitch}>
            <CycleBtn label={t('service.monthly')} active={cycle === 'monthly'} onPress={() => setCycle('monthly')} />
            <CycleBtn label={t('service.yearly')} active={cycle === 'yearly'} onPress={() => setCycle('yearly')} />
          </View>

          <View style={styles.priceRow}>
            <Text style={styles.price}>
              {cycle === 'monthly' ? service.priceMonthly : yearlyPrice} €
            </Text>
            <Text style={styles.period}>/ {cycle === 'monthly' ? t('common.month') : t('common.year')}</Text>
          </View>

          {cycle === 'yearly' && (
            <Text style={styles.saving}>
              {t('service.saving', { amount: yearlySaving })}
            </Text>
          )}
        </Card>
      )}

      {service.type === 'one_shot' && (
        <Card style={styles.pricing}>
          <Text style={styles.price}>{service.priceMonthly} €</Text>
          <Text style={styles.period}>Paiement unique · Licence perpétuelle</Text>
        </Card>
      )}

      <Button
        label={ctaLabel}
        onPress={handleAdd}
        disabled={!!unavailable}
        icon={
          unavailable ? undefined : service.type === 'saas' ? (
            <Sparkles color="#fff" size={16} />
          ) : (
            <ShoppingCart color="#fff" size={16} />
          )
        }
        fullWidth
      />

      <View style={styles.secureRow}>
        <Lock color={colors.textDim} size={12} />
        <Text style={styles.secureText}>Paiement sécurisé · Résiliable à tout moment</Text>
      </View>

      {service.features && service.features.length > 0 && (
        <Card style={styles.block}>
          <View style={styles.blockHeader}>
            <Layers color={colors.primary} size={16} />
            <Text style={styles.blockTitle}>{t('service.features')}</Text>
          </View>
          {service.features.map((f, i) => (
            <View key={i} style={styles.featRow}>
              {f.included ? (
                <Check color={colors.primary} size={14} />
              ) : (
                <X color={colors.textDim} size={14} />
              )}
              <Text style={[styles.featText, !f.included && styles.featOff]}>{f.label}</Text>
            </View>
          ))}
        </Card>
      )}

      {service.technicalSpecs && service.technicalSpecs.length > 0 && (
        <Card style={styles.block}>
          <View style={styles.blockHeader}>
            <Cpu color={colors.primary} size={16} />
            <Text style={styles.blockTitle}>{t('service.specs')}</Text>
          </View>
          {service.technicalSpecs.map((s, i) => (
            <View key={i} style={styles.specRow}>
              <Text style={styles.specLabel}>{s.label}</Text>
              <Text style={styles.specValue}>{s.value}</Text>
            </View>
          ))}
        </Card>
      )}

      {similar.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('service.similar')}</Text>
          <View style={styles.similarList}>
            {similar.map((s) => (
              <ServiceCard
                key={s.id}
                service={s}
                onPress={() => navigation.push('ServiceDetails', { id: s.id })}
              />
            ))}
          </View>
        </View>
      )}
    </ScrollView>
  );
}

function CycleBtn({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  return (
    <Pressable style={[styles.cycleBtn, active && styles.cycleBtnActive]} onPress={onPress}>
      <Text style={[styles.cycleBtnText, active && styles.cycleBtnTextActive]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  scroll: { backgroundColor: colors.background },
  content: { padding: 20, gap: 20, paddingBottom: 48 },
  image: { width: '100%', height: 220, borderRadius: radius.lg },
  header: { gap: 8 },
  tags: { flexDirection: 'row', gap: 6 },
  title: { color: colors.text, fontSize: 26, fontWeight: '900' },
  desc: { color: colors.textSecondary, fontSize: 14, lineHeight: 20 },
  pricing: { gap: 12 },
  cycleSwitch: {
    flexDirection: 'row',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    overflow: 'hidden',
  },
  cycleBtn: { flex: 1, paddingVertical: 12, alignItems: 'center' },
  cycleBtnActive: { backgroundColor: colors.primary },
  cycleBtnText: { color: colors.textMuted, fontSize: 14, fontWeight: '600' },
  cycleBtnTextActive: { color: '#fff' },
  priceRow: { flexDirection: 'row', alignItems: 'baseline', gap: 4 },
  price: { color: colors.text, fontSize: 32, fontWeight: '900' },
  period: { color: colors.textMuted, fontSize: 14 },
  saving: { color: colors.success, fontSize: 13 },
  secureRow: { flexDirection: 'row', justifyContent: 'center', gap: 6, alignItems: 'center' },
  secureText: { color: colors.textDim, fontSize: 11 },
  block: { gap: 10 },
  blockHeader: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  blockTitle: { color: colors.text, fontSize: 14, fontWeight: '700' },
  featRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  featText: { color: colors.textSecondary, fontSize: 13 },
  featOff: { color: colors.textDim, textDecorationLine: 'line-through' },
  specRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderSubtle,
  },
  specLabel: { color: colors.textMuted, fontSize: 12 },
  specValue: { color: colors.text, fontSize: 12, fontWeight: '600' },
  section: { gap: 12 },
  sectionTitle: { color: colors.text, fontSize: 18, fontWeight: '700' },
  similarList: { gap: 12 },
});
