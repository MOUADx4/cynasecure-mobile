import React, { useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text } from 'react-native';
import { useTranslation } from 'react-i18next';

import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { useAuth } from '../../context/AuthContext';
import { colors } from '../../theme/colors';
import type { RootScreen } from '../../navigation/types';

export function ProfileEditScreen({ navigation }: RootScreen<'ProfileEdit'>) {
  const { t } = useTranslation();
  const { user, updateProfile } = useAuth();

  const [firstName, setFirstName] = useState(user?.firstName ?? '');
  const [lastName, setLastName] = useState(user?.lastName ?? '');
  const [phone, setPhone] = useState(user?.phone ?? '');
  const [company, setCompany] = useState(user?.company ?? '');
  const [loading, setLoading] = useState(false);

  const save = async () => {
    if (!firstName.trim() || !lastName.trim()) return;
    setLoading(true);
    try {
      await updateProfile({
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        phone: phone.trim() || undefined,
        company: company.trim() || undefined,
      });
      navigation.goBack();
    } catch (e: any) {
      Alert.alert(t('common.errorOccurred'), e?.message ?? '');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
      <Text style={styles.title}>{t('profile.editProfile')}</Text>

      <Input label={t('auth.firstName')} value={firstName} onChangeText={setFirstName} />
      <Input label={t('auth.lastName')} value={lastName} onChangeText={setLastName} />
      <Input
        label={t('auth.email')}
        value={user?.email ?? ''}
        editable={false}
        style={{ opacity: 0.5 }}
      />
      <Input
        label={`${t('profile.phone')} (${t('common.optional')})`}
        value={phone}
        onChangeText={setPhone}
        keyboardType="phone-pad"
      />
      <Input
        label={`${t('profile.company')} (${t('common.optional')})`}
        value={company}
        onChangeText={setCompany}
      />

      <Button label={t('common.save')} onPress={save} loading={loading} fullWidth />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20, gap: 14 },
  title: { color: colors.text, fontSize: 20, fontWeight: '800', marginBottom: 4 },
});
