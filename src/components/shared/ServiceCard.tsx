import React from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { ChevronRight } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { Badge } from '../ui/Badge';
import { colors, radius } from '../../theme/colors';
import type { Service } from '../../api/services';
import { getServiceImageSource } from '../../utils/serviceImage';

type Props = {
  service: Service;
  onPress: () => void;
};

export function ServiceCard({ service, onPress }: Props) {
  const { t } = useTranslation();
  const unavailable = service.availability && service.availability !== 'available';

  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.card, pressed && styles.pressed, pressed && { transform: [{ scale: 0.98 }] }]}>
      {getServiceImageSource(service.image) ? (
        <Image source={getServiceImageSource(service.image)!} style={styles.image} resizeMode="cover" />
      ) : (
        <View style={[styles.image, styles.imagePlaceholder]} />
      )}

      <View style={styles.body}>
        <View style={styles.row}>
          <Badge label={service.category?.toUpperCase() ?? '—'} tone="primary" />
          {service.badge && <Badge label={service.badge} tone="warning" />}
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
            {unavailable && (
              <Text style={styles.unavailable}>{t('service.unavailable')}</Text>
            )}
          </View>
          <ChevronRight color={colors.primary} size={20} />
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
  },
  pressed: { borderColor: colors.primary, opacity: 0.92 },
  image: {
    width: '100%',
    height: 140,
    backgroundColor: colors.surfaceElevated,
  },
  imagePlaceholder: { backgroundColor: colors.surfaceHigh },
  body: { padding: 14, gap: 10 },
  row: { flexDirection: 'row', gap: 6 },
  title: { color: colors.text, fontSize: 16, fontWeight: '700' },
  desc: { color: colors.textMuted, fontSize: 13 },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 6,
  },
  price: { color: colors.text, fontSize: 18, fontWeight: '800' },
  period: { color: colors.textMuted, fontSize: 12, fontWeight: '400' },
  unavailable: { color: colors.warning, fontSize: 11, marginTop: 2 },
});
