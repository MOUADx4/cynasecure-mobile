import React, { useCallback, useEffect, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { MapPin, Plus, Star, Pencil, Trash2 } from 'lucide-react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';

import { Card } from '../../components/ui/Card';
import { Loader } from '../../components/ui/Loader';
import { Button } from '../../components/ui/Button';
import { addressesApi, type Address } from '../../api/addresses';
import { colors } from '../../theme/colors';

export function AddressesScreen() {
  const { t } = useTranslation();
  const nav = useNavigation<any>();
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(() => {
    setLoading(true);
    addressesApi.list()
      .then(setAddresses)
      .catch(() => setAddresses([]))
      .finally(() => setLoading(false));
  }, []);

  useFocusEffect(load);

  const remove = (id: number) => {
    Alert.alert(t('addresses.deleteConfirm'), '', [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('common.delete'),
        style: 'destructive',
        onPress: async () => {
          try {
            await addressesApi.remove(id);
            load();
          } catch (e: unknown) {
            Alert.alert(t('common.errorOccurred'), (e instanceof Error ? e.message : null) ?? '');
          }
        },
      },
    ]);
  };

  const setDefault = async (id: number) => {
    try {
      await addressesApi.setDefault(id);
      load();
    } catch (e: unknown) {
      Alert.alert(t('common.errorOccurred'), (e instanceof Error ? e.message : null) ?? '');
    }
  };

  if (loading) return <Loader />;

  return (
    <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
      <Button
        label={t('addresses.add')}
        icon={<Plus color="#fff" size={16} />}
        onPress={() => nav.navigate('AddressForm', {})}
        fullWidth
      />

      {addresses.length === 0 ? (
        <View style={styles.empty}>
          <MapPin color={colors.textDim} size={40} />
          <Text style={styles.emptyText}>{t('addresses.noAddresses')}</Text>
        </View>
      ) : (
        addresses.map(addr => (
          <Card key={addr.id} style={styles.card}>
            <View style={styles.cardHeader}>
              <View style={{ flex: 1 }}>
                <Text style={styles.name}>{addr.firstName} {addr.lastName}</Text>
                {addr.company && <Text style={styles.company}>{addr.company}</Text>}
                <Text style={styles.line}>{addr.line1}</Text>
                {addr.line2 && <Text style={styles.line}>{addr.line2}</Text>}
                <Text style={styles.line}>{addr.postalCode} {addr.city}{addr.region ? `, ${addr.region}` : ''}</Text>
                <Text style={styles.line}>{addr.country}</Text>
                {addr.phone && <Text style={styles.line}>{addr.phone}</Text>}
              </View>
              {addr.isDefault && (
                <View style={styles.defaultBadge}>
                  <Star color={colors.warning} size={12} fill={colors.warning} />
                  <Text style={styles.defaultText}>{t('common.default')}</Text>
                </View>
              )}
            </View>

            <View style={styles.actions}>
              {!addr.isDefault && (
                <Pressable style={styles.actionBtn} onPress={() => setDefault(addr.id)}>
                  <Star color={colors.textDim} size={14} />
                  <Text style={styles.actionText}>{t('addresses.setDefault')}</Text>
                </Pressable>
              )}
              <Pressable style={styles.actionBtn} onPress={() => nav.navigate('AddressForm', { id: addr.id })}>
                <Pencil color={colors.primary} size={14} />
                <Text style={[styles.actionText, { color: colors.primary }]}>{t('common.edit')}</Text>
              </Pressable>
              <Pressable style={styles.actionBtn} onPress={() => remove(addr.id)}>
                <Trash2 color={colors.danger} size={14} />
                <Text style={[styles.actionText, { color: colors.danger }]}>{t('common.delete')}</Text>
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
  card: { gap: 12 },
  cardHeader: { flexDirection: 'row', gap: 10 },
  name: { color: colors.text, fontSize: 14, fontWeight: '700', marginBottom: 4 },
  company: { color: colors.textSecondary, fontSize: 13, marginBottom: 2 },
  line: { color: colors.textSecondary, fontSize: 13 },
  defaultBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 4, backgroundColor: 'rgba(245,158,11,0.12)', borderRadius: 20, alignSelf: 'flex-start' },
  defaultText: { color: colors.warning, fontSize: 11, fontWeight: '600' },
  actions: { flexDirection: 'row', gap: 12, paddingTop: 8, borderTopWidth: 1, borderTopColor: colors.borderSubtle },
  actionBtn: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  actionText: { color: colors.textDim, fontSize: 12, fontWeight: '600' },
  empty: { alignItems: 'center', gap: 10, paddingVertical: 40 },
  emptyText: { color: colors.textMuted, fontSize: 14 },
});
