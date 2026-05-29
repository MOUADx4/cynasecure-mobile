import React, { useEffect, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text } from 'react-native';
import { useTranslation } from 'react-i18next';

import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { addressesApi, type AddressPayload } from '../../api/addresses';
import { colors } from '../../theme/colors';
import type { RootScreen } from '../../navigation/types';

export function AddressFormScreen({ navigation, route }: RootScreen<'AddressForm'>) {
  const { t } = useTranslation();
  const editId = route.params?.id;
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(!!editId);

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [company, setCompany] = useState('');
  const [line1, setLine1] = useState('');
  const [line2, setLine2] = useState('');
  const [city, setCity] = useState('');
  const [region, setRegion] = useState('');
  const [postalCode, setPostalCode] = useState('');
  const [country, setCountry] = useState('FR');
  const [phone, setPhone] = useState('');

  useEffect(() => {
    if (!editId) return;
    addressesApi.list().then(list => {
      const addr = list.find(a => a.id === editId);
      if (addr) {
        setFirstName(addr.firstName);
        setLastName(addr.lastName);
        setCompany(addr.company ?? '');
        setLine1(addr.line1);
        setLine2(addr.line2 ?? '');
        setCity(addr.city);
        setRegion(addr.region ?? '');
        setPostalCode(addr.postalCode);
        setCountry(addr.country);
        setPhone(addr.phone ?? '');
      }
    }).finally(() => setFetching(false));
  }, [editId]);

  const save = async () => {
    if (!firstName.trim() || !lastName.trim() || !line1.trim() || !city.trim() || !postalCode.trim() || !country.trim()) {
      Alert.alert('Champs obligatoires', 'Veuillez remplir tous les champs requis.');
      return;
    }
    setLoading(true);
    const payload: AddressPayload = {
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      company: company.trim() || undefined,
      line1: line1.trim(),
      line2: line2.trim() || undefined,
      city: city.trim(),
      region: region.trim() || undefined,
      postalCode: postalCode.trim(),
      country: country.trim(),
      phone: phone.trim() || undefined,
    };
    try {
      if (editId) {
        await addressesApi.update(editId, payload);
      } else {
        await addressesApi.create(payload);
      }
      navigation.goBack();
    } catch (e: any) {
      Alert.alert(t('common.errorOccurred'), e?.message ?? '');
    } finally {
      setLoading(false);
    }
  };

  if (fetching) return null;

  return (
    <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
      <Text style={styles.title}>{editId ? t('addresses.edit') : t('addresses.add')}</Text>

      <Input label={`${t('addresses.firstName')} *`} value={firstName} onChangeText={setFirstName} />
      <Input label={`${t('addresses.lastName')} *`} value={lastName} onChangeText={setLastName} />
      <Input label={t('addresses.company')} value={company} onChangeText={setCompany} />
      <Input label={`${t('addresses.line1')} *`} value={line1} onChangeText={setLine1} />
      <Input label={t('addresses.line2')} value={line2} onChangeText={setLine2} />
      <Input label={`${t('addresses.city')} *`} value={city} onChangeText={setCity} />
      <Input label={t('addresses.region')} value={region} onChangeText={setRegion} />
      <Input label={`${t('addresses.postalCode')} *`} value={postalCode} onChangeText={setPostalCode} keyboardType="numeric" />
      <Input label={`${t('addresses.country')} *`} value={country} onChangeText={setCountry} autoCapitalize="characters" maxLength={2} />
      <Input label={t('addresses.phone')} value={phone} onChangeText={setPhone} keyboardType="phone-pad" />

      <Button label={t('common.save')} onPress={save} loading={loading} fullWidth />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20, gap: 12, paddingBottom: 40 },
  title: { color: colors.text, fontSize: 20, fontWeight: '800', marginBottom: 4 },
});
