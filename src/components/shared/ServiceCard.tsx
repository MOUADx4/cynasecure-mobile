import React from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { ChevronRight, ShieldCheck } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTranslation } from 'react-i18next';
import { Badge } from '../ui/Badge';
import { colors, radius, shadows } from '../../theme/colors';
import type { Service } from '../../api/services';
import { getServiceImageSource } from '../../utils/serviceImage';

type Props = {
  service: Service;
  onPress: () => void;
};

function ServiceCardComponent({ service, onPress }: Props) {
  const { t } = useTranslation();
  const unavailable = service.availability && service.availability !== 'available';
  const imgSrc = getServiceImageSource(service.image);

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.card,
        pressed && styles.pressed,
        shadows.card,
      ]}
    >
      {/* Image / placeholder */}
      <View style={styles.imageWrapper}>
        {imgSrc ? (
          <Image source={imgSrc} style={styles.image} resizeMode="cover" />
        ) : (
          <LinearGradient colors={['#0D1B3E', '#111827']} style={styles.imagePlaceholder}>
            <ShieldCheck color={colors.primaryLight} size={36} strokeWidth={1.2} />
          </LinearGradient>
        )}
        {imgSrc && (
          <LinearGradient
            colors={['transparent', 'rgba(8,8,16,0.65)']}
            locations={[0.3, 1]}
            style={StyleSheet.absoluteFill}
            pointerEvents="none"
          />
        )}
        {service.badge && (
          <View style={styles.imageBadge}>
            <Badge label={service.badge} tone="warning" />
          </View>
        )}
      </View>

      {/* Left accent bar */}
      <View style={styles.accentBar} />

      {/* Body */}
      <View style={styles.body}>
        <View style={styles.categoryRow}>
          <Badge label={service.category?.toUpperCase() ?? '—'} tone="primary" />
          {unavailable && <Badge label={t('service.unavailable')} tone="warning" />}
        </View>

        <Text style={styles.title} numberOfLines={2}>
          {service.name}
        </Text>

        <Text style={styles.desc} numberOfLines={2}>
          {service.description}
        </Text>

        <View style={styles.footer}>
          <View>
            <Text style={styles.price}>
              {service.priceMonthly} €
              <Text style={styles.period}> / {t('common.month')}</Text>
            </Text>
          </View>
          <View style={styles.cta}>
            <Text style={styles.ctaText}>Voir</Text>
            <ChevronRight color={colors.primary} size={15} />
          </View>
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    overflow: 'hidden',
    flexDirection: 'column',
  },
  pressed: {
    borderColor: colors.borderAccent,
    opacity: 0.93,
    transform: [{ scale: 0.985 }],
  },
  imageWrapper: {
    width: '100%',
    height: 160,
    overflow: 'hidden',
    backgroundColor: colors.surfaceHigh,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  imagePlaceholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  imageBadge: {
    position: 'absolute',
    top: 10,
    right: 10,
  },
  accentBar: {
    height: 2,
    backgroundColor: colors.primary,
    opacity: 0.7,
  },
  body: { padding: 14, gap: 9 },
  categoryRow: { flexDirection: 'row', gap: 6, flexWrap: 'wrap' },
  title: { color: colors.text, fontSize: 16, fontWeight: '700', lineHeight: 22 },
  desc: { color: colors.textMuted, fontSize: 13, lineHeight: 19 },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: colors.borderSubtle,
  },
  price: { color: colors.text, fontSize: 20, fontWeight: '800', letterSpacing: -0.3 },
  period: { color: colors.textMuted, fontSize: 12, fontWeight: '400' },
  cta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    backgroundColor: colors.primaryGlow,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: radius.full,
  },
  ctaText: { color: colors.primaryLight, fontSize: 12, fontWeight: '700' },
});

export const ServiceCard = React.memo(ServiceCardComponent);
