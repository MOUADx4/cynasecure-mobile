import React, { useState } from 'react';
import { ActivityIndicator, Alert, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { ArrowRight, ShoppingCart, Tag, Trash2, X } from 'lucide-react-native';

import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { useHaptic } from '../../hooks/useHaptic';
import { useCart } from '../../context/CartContext';
import { checkoutApi } from '../../api/checkout';
import { colors, radius, shadows } from '../../theme/colors';

export function CartScreen() {
  const { t } = useTranslation();
  const nav = useNavigation<any>();
  const { items, total, removeFromCart, changeCycle, promo, setPromo } = useCart();
  const insets = useSafeAreaInsets();
  const { medium } = useHaptic();
  const [promoCode, setPromoCode] = useState('');
  const [promoApplying, setPromoApplying] = useState(false);

  const applyPromo = async () => {
    if (!promoCode.trim()) return;
    setPromoApplying(true);
    try {
      const res = await checkoutApi.applyPromo(promoCode.trim().toUpperCase(), total);
      if (res.valid) {
        setPromo({ code: promoCode.trim().toUpperCase(), discount: res.discount, discountedTotal: res.discountedTotal, type: '' });
        setPromoCode('');
      } else {
        Alert.alert('Code invalide', 'Ce code promo est invalide ou expiré.');
      }
    } catch {
      Alert.alert('Erreur', "Impossible d'appliquer ce code promo.");
    } finally {
      setPromoApplying(false);
    }
  };

  if (items.length === 0) {
    return (
      <View style={[styles.emptyBox, { paddingTop: insets.top }]}>
        <View style={styles.emptyIconBg}>
          <ShoppingCart color={colors.textDim} size={32} strokeWidth={1.5} />
        </View>
        <Text style={styles.emptyTitle}>{t('cart.empty')}</Text>
        <Text style={styles.emptyText}>{t('cart.emptyHint')}</Text>
        <Button
          label={t('cart.exploreCatalog')}
          onPress={() => nav.navigate('Catalog')}
          icon={<ArrowRight color="#fff" size={16} />}
        />
      </View>
    );
  }

  return (
    <ScrollView style={styles.scroll} contentContainerStyle={[styles.content, { paddingTop: insets.top + 16 }]}>
      <View style={styles.pageHead}>
        <Text style={styles.eyebrow}>COMMANDE</Text>
        <Text style={styles.title}>{t('cart.title')}</Text>
      </View>

      <View style={styles.list}>
        {items.map((item) => {
          const price =
            item.cycle === 'yearly'
              ? item.priceYearly ?? Math.round(item.priceMonthly * 12 * 0.85)
              : item.priceMonthly;
          return (
            <Card key={item.id} padded={false} style={styles.item}>
              <View style={styles.itemBody}>
                <View style={styles.itemHeader}>
                  <Text style={styles.itemName} numberOfLines={1}>{item.name}</Text>
                  <Pressable
                    onPress={() => { medium(); removeFromCart(item.id); }}
                    accessibilityLabel={t('cart.remove')}
                    hitSlop={10}
                  >
                    <Trash2 color={colors.danger} size={17} />
                  </Pressable>
                </View>

                <Text style={styles.itemDesc} numberOfLines={2}>{item.description}</Text>

                <View style={styles.cycleRow}>
                  <Pressable
                    onPress={() => changeCycle(item.id, 'monthly')}
                    style={[styles.cyc, item.cycle === 'monthly' && styles.cycActive]}
                  >
                    <Text style={[styles.cycText, item.cycle === 'monthly' && styles.cycTextActive]}>
                      {t('service.monthly')}
                    </Text>
                  </Pressable>
                  <Pressable
                    onPress={() => changeCycle(item.id, 'yearly')}
                    style={[styles.cyc, item.cycle === 'yearly' && styles.cycActive]}
                  >
                    <Text style={[styles.cycText, item.cycle === 'yearly' && styles.cycTextActive]}>
                      {t('service.yearly')} <Text style={styles.cycSave}>-15%</Text>
                    </Text>
                  </Pressable>
                </View>

                <Text style={styles.itemPrice}>
                  {price} €{' '}
                  <Text style={styles.itemPeriod}>/ {item.cycle === 'monthly' ? t('common.month') : t('common.year')}</Text>
                </Text>
              </View>
            </Card>
          );
        })}
      </View>

      <Card style={styles.summary}>
        <SummaryLine label={t('cart.subtotal')} value={`${(total / 1.2).toFixed(2)} €`} />
        <SummaryLine label={t('cart.tva')} value={`${(total - total / 1.2).toFixed(2)} €`} />

        {promo ? (
          <View style={styles.promoApplied}>
            <Tag color={colors.success} size={13} />
            <Text style={styles.promoAppliedCode}>{promo.code}</Text>
            <Text style={styles.promoSaving}>-{promo.discount.toFixed(2)} €</Text>
            <Pressable onPress={() => setPromo(null)} hitSlop={8}>
              <X color={colors.textDim} size={14} />
            </Pressable>
          </View>
        ) : (
          <View style={styles.promoRow}>
            <TextInput
              style={styles.promoInput}
              value={promoCode}
              onChangeText={v => setPromoCode(v.toUpperCase())}
              placeholder={t('cart.promo')}
              placeholderTextColor={colors.textDim}
              autoCapitalize="characters"
              returnKeyType="done"
              onSubmitEditing={applyPromo}
            />
            <Pressable
              style={[styles.promoBtn, (!promoCode.trim() || promoApplying) && { opacity: 0.5 }]}
              onPress={applyPromo}
              disabled={!promoCode.trim() || promoApplying}
            >
              {promoApplying
                ? <ActivityIndicator color="#fff" size="small" />
                : <Text style={styles.promoBtnText}>{t('cart.applyPromo')}</Text>
              }
            </Pressable>
          </View>
        )}

        <View style={styles.divider} />
        {promo && (
          <SummaryLine label="Réduction" value={`-${promo.discount.toFixed(2)} €`} />
        )}
        <SummaryLine label={t('cart.total')} value={`${(promo?.discountedTotal ?? total).toFixed(2)} €`} large />
      </Card>

      <Pressable
        style={({ pressed }) => [styles.checkoutBtn, pressed && { opacity: 0.85, transform: [{ scale: 0.98 }] }]}
        onPress={() => { medium(); nav.navigate('Checkout'); }}
      >
        <Text style={styles.checkoutText}>{t('cart.checkout')}</Text>
        <ArrowRight color="#fff" size={18} />
      </Pressable>
    </ScrollView>
  );
}

function SummaryLine({ label, value, large }: { label: string; value: string; large?: boolean }) {
  return (
    <View style={styles.summaryRow}>
      <Text style={[styles.summaryLabel, large && styles.summaryLabelLarge]}>{label}</Text>
      <Text style={[styles.summaryValue, large && styles.summaryValueLarge]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  scroll: { backgroundColor: colors.background },
  content: { padding: 20, gap: 20, paddingBottom: 48 },

  pageHead: { gap: 2 },
  eyebrow: { color: colors.primary, fontSize: 11, fontWeight: '700', letterSpacing: 1.5, textTransform: 'uppercase' },
  title: { color: colors.text, fontSize: 30, fontWeight: '900', letterSpacing: -0.5 },

  list: { gap: 12 },
  item: { overflow: 'hidden' },
  itemBody: { padding: 16, gap: 10 },
  itemHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  itemName: { color: colors.text, fontSize: 15, fontWeight: '700', flex: 1, marginRight: 10 },
  itemDesc: { color: colors.textMuted, fontSize: 12, lineHeight: 17 },
  cycleRow: {
    flexDirection: 'row',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    overflow: 'hidden',
    alignSelf: 'flex-start',
  },
  cyc: { paddingHorizontal: 14, paddingVertical: 7 },
  cycActive: { backgroundColor: colors.primary },
  cycText: { color: colors.textMuted, fontSize: 12, fontWeight: '600' },
  cycTextActive: { color: '#fff' },
  cycSave: { color: 'rgba(255,255,255,0.7)', fontSize: 10 },
  itemPrice: { color: colors.text, fontSize: 17, fontWeight: '800' },
  itemPeriod: { color: colors.textMuted, fontSize: 12, fontWeight: '400' },

  summary: { gap: 10 },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  summaryLabel: { color: colors.textMuted, fontSize: 13 },
  summaryLabelLarge: { color: colors.text, fontSize: 15, fontWeight: '600' },
  summaryValue: { color: colors.text, fontSize: 13 },
  summaryValueLarge: { color: colors.text, fontSize: 24, fontWeight: '900', letterSpacing: -0.5 },
  divider: { height: 1, backgroundColor: colors.border, marginVertical: 2 },

  promoRow: { flexDirection: 'row', gap: 8, alignItems: 'center' },
  promoInput: {
    flex: 1,
    backgroundColor: colors.surfaceHigh,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: colors.text,
    fontSize: 13,
    fontFamily: 'Menlo',
  },
  promoBtn: {
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    paddingHorizontal: 14,
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 72,
  },
  promoBtnText: { color: '#fff', fontSize: 12, fontWeight: '700' },
  promoApplied: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(16,185,129,0.10)',
    borderWidth: 1,
    borderColor: 'rgba(16,185,129,0.25)',
    borderRadius: radius.md,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  promoAppliedCode: { color: colors.success, fontSize: 13, fontWeight: '700', fontFamily: 'Menlo', flex: 1 },
  promoSaving: { color: colors.success, fontSize: 12, fontWeight: '600' },

  checkoutBtn: {
    height: 56,
    backgroundColor: colors.primary,
    borderRadius: radius.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    ...shadows.button,
  },
  checkoutText: { color: '#fff', fontSize: 16, fontWeight: '700' },

  emptyBox: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 14, padding: 32 },
  emptyIconBg: {
    width: 80,
    height: 80,
    borderRadius: 24,
    backgroundColor: colors.surfaceElevated,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  emptyTitle: { color: colors.text, fontSize: 20, fontWeight: '800' },
  emptyText: { color: colors.textMuted, textAlign: 'center', fontSize: 13, lineHeight: 19 },
});
