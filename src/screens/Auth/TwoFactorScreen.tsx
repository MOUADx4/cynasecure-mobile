import React, { useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Shield } from 'lucide-react-native';

import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { authApi } from '../../api/auth';
import { useAuth } from '../../context/AuthContext';
import { colors } from '../../theme/colors';
import type { RootScreen } from '../../navigation/types';

export function TwoFactorScreen({ navigation }: RootScreen<'TwoFactor'>) {
  const { t } = useTranslation();
  const { setUser } = useAuth();
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);

  const verify = async () => {
    const trimmed = code.replace(/\s/g, '');
    if (trimmed.length !== 6) return;
    setLoading(true);
    try {
      const user = await authApi.verifyTotp(trimmed);
      setUser(user);
      navigation.replace('Tabs');
    } catch (e: unknown) {
      Alert.alert(t('common.errorOccurred'), (e instanceof Error ? e.message : null) ?? 'Code invalide');
      setCode('');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
      <View style={styles.header}>
        <Shield color={colors.primary} size={40} />
        <Text style={styles.title}>{t('auth.twoFactorTitle')}</Text>
        <Text style={styles.subtitle}>{t('auth.twoFactorHint')}</Text>
      </View>

      <View style={styles.form}>
        <Input
          label={t('auth.twoFactorCode')}
          value={code}
          onChangeText={setCode}
          keyboardType="number-pad"
          maxLength={6}
          autoFocus
        />
        <Button
          label={t('auth.twoFactorCta')}
          onPress={verify}
          loading={loading}
          disabled={code.replace(/\s/g, '').length !== 6}
          fullWidth
        />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 24, gap: 32 },
  header: { alignItems: 'center', gap: 10, marginTop: 32 },
  title: { color: colors.text, fontSize: 22, fontWeight: '800', textAlign: 'center' },
  subtitle: { color: colors.textMuted, fontSize: 14, textAlign: 'center' },
  form: { gap: 12 },
});
