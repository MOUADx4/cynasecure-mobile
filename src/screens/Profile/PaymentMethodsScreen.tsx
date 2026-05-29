import React, { useCallback, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, View, Pressable } from 'react-native';
import { useTranslation } from 'react-i18next';
import { CreditCard, Star, Trash2, Plus } from 'lucide-react-native';
import { useFocusEffect } from '@react-navigation/native';
import { CardField, useStripe } from '@stripe/stripe-react-native';

import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Loader } from '../../components/ui/Loader';
import { paymentMethodsApi, type PaymentMethod } from '../../api/paymentMethods';
import { colors } from '../../theme/colors';

const BRAND_ICONS: Record<string, string> = {
  visa: 'VISA',
  mastercard: 'MC',
  amex: 'AMEX',
  discover: 'DISC',
};

export function PaymentMethodsScreen() {
  const { t } = useTranslation();
  const { confirmSetupIntent } = useStripe();
  const [methods, setMethods] = useState<PaymentMethod[]>([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [saving, setSaving] = useState(false);
  const [cardComplete, setCardComplete] = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    paymentMethodsApi.list()
      .then(setMethods)
      .catch(() => setMethods([]))
      .finally(() => setLoading(false));
  }, []);

  useFocusEffect(load);

  const addCard = async () => {
    setSaving(true);
    try {
      const { clientSecret } = await paymentMethodsApi.setupIntent();
      const { error } = await confirmSetupIntent(clientSecret, {
        paymentMethodType: 'Card',
      });
      if (error) {
        Alert.alert(t('common.errorOccurred'), error.message);
      } else {
        Alert.alert(t('paymentMethods.saved'));
        setAdding(false);
        load();
      }
    } catch (e: any) {
      Alert.alert(t('common.errorOccurred'), e?.message ?? '');
    } finally {
      setSaving(false);
    }
  };

  const detach = (pmId: string) => {
    Alert.alert(t('paymentMethods.detachConfirm'), '', [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('common.delete'),
        style: 'destructive',
        onPress: async () => {
          try {
            await paymentMethodsApi.detach(pmId);
            load();
          } catch (e: any) {
            Alert.alert(t('common.errorOccurred'), e?.message ?? '');
          }
        },
      },
    ]);
  };

  const setDefault = async (pmId: string) => {
    try {
      await paymentMethodsApi.setDefault(pmId);
      load();
    } catch (e: any) {
      Alert.alert(t('common.errorOccurred'), e?.message ?? '');
    }
  };

  if (loading) return <Loader />;

  return (
    <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
      {!adding ? (
        <Button
          label={t('paymentMethods.add')}
          icon={<Plus color="#fff" size={16} />}
          onPress={() => setAdding(true)}
          fullWidth
        />
      ) : (
        <Card style={styles.addCard}>
          <Text style={styles.addTitle}>{t('paymentMethods.addInstructions')}</Text>
          <CardField
            postalCodeEnabled={false}
            style={styles.cardField}
            cardStyle={{
              backgroundColor: colors.surfaceHigh,
              textColor: colors.text,
              borderColor: colors.border,
              borderWidth: 1,
              borderRadius: 10,
            }}
            onCardChange={detail => setCardComplete(detail.complete)}
          />
          <View style={styles.row}>
            <Button label={t('common.cancel')} variant="ghost" onPress={() => setAdding(false)} style={{ flex: 1 }} />
            <Button
              label={t('common.save')}
              onPress={addCard}
              loading={saving}
              disabled={!cardComplete}
              style={{ flex: 1 }}
            />
          </View>
        </Card>
      )}

      {methods.length === 0 && !adding ? (
        <View style={styles.empty}>
          <CreditCard color={colors.textDim} size={40} />
          <Text style={styles.emptyText}>{t('paymentMethods.noMethods')}</Text>
        </View>
      ) : (
        methods.map(pm => (
          <Card key={pm.id} style={styles.card}>
            <View style={styles.cardRow}>
              <View style={styles.brandBox}>
                <Text style={styles.brand}>{BRAND_ICONS[pm.brand] ?? pm.brand.toUpperCase()}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.last4}>•••• •••• •••• {pm.last4}</Text>
                <Text style={styles.expiry}>
                  {t('paymentMethods.expires', { month: String(pm.expMonth).padStart(2, '0'), year: pm.expYear })}
                </Text>
              </View>
              {pm.isDefault && (
                <View style={styles.defaultBadge}>
                  <Star color={colors.warning} size={12} fill={colors.warning} />
                </View>
              )}
            </View>

            <View style={styles.actions}>
              {!pm.isDefault && (
                <Pressable style={styles.actionBtn} onPress={() => setDefault(pm.id)}>
                  <Star color={colors.textDim} size={14} />
                  <Text style={styles.actionText}>{t('common.setDefault')}</Text>
                </Pressable>
              )}
              <Pressable style={styles.actionBtn} onPress={() => detach(pm.id)}>
                <Trash2 color={colors.danger} size={14} />
                <Text style={[styles.actionText, { color: colors.danger }]}>{t('paymentMethods.detach')}</Text>
              </Pressable>
            </View>
          </Card>
        ))
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { backgroundColor: colors.background },
  content: { padding: 16, gap: 14, paddingBottom: 40 },
  addCard: { gap: 14 },
  addTitle: { color: colors.textMuted, fontSize: 13 },
  cardField: { width: '100%', height: 56 },
  row: { flexDirection: 'row', gap: 10 },
  card: { gap: 10 },
  cardRow: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  brandBox: { width: 44, height: 28, backgroundColor: colors.surfaceHigh, borderRadius: 4, alignItems: 'center', justifyContent: 'center' },
  brand: { color: colors.text, fontSize: 10, fontWeight: '800', fontFamily: 'Menlo' },
  last4: { color: colors.text, fontSize: 14, fontFamily: 'Menlo', fontWeight: '600' },
  expiry: { color: colors.textMuted, fontSize: 12, marginTop: 2 },
  defaultBadge: { width: 28, height: 28, borderRadius: 14, backgroundColor: 'rgba(245,158,11,0.12)', alignItems: 'center', justifyContent: 'center' },
  actions: { flexDirection: 'row', gap: 16, paddingTop: 8, borderTopWidth: 1, borderTopColor: colors.borderSubtle },
  actionBtn: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  actionText: { color: colors.textDim, fontSize: 12, fontWeight: '600' },
  empty: { alignItems: 'center', gap: 10, paddingVertical: 40 },
  emptyText: { color: colors.textMuted, fontSize: 14 },
});
