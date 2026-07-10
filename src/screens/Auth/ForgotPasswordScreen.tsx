import React, { useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useToast } from '../../hooks/useToast';
import { useTranslation } from 'react-i18next';

import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { authApi } from '../../api/auth';
import { colors } from '../../theme/colors';
import type { RootScreen } from '../../navigation/types';

export function ForgotPasswordScreen({ navigation }: RootScreen<'ForgotPassword'>) {
  const { t } = useTranslation();
  const { toast } = useToast();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    if (!email.trim()) return;
    setLoading(true);
    try {
      await authApi.forgotPassword(email.trim());
      toast(t('auth.forgotSuccess'), 'success');
      navigation.goBack();
    } catch (e: unknown) {
      toast((e instanceof Error ? e.message : null) ?? t('common.errorOccurred'), 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>{t('auth.forgot')}</Text>
      <Text style={styles.subtitle}>{t('auth.forgotInstructions')}</Text>

      <View style={styles.form}>
        <Input
          label={t('auth.email')}
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
        />
        <Button label={t('auth.forgotSubmit')} onPress={submit} loading={loading} fullWidth />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20, gap: 16 },
  title: { color: colors.text, fontSize: 24, fontWeight: '800', marginTop: 16, letterSpacing: -0.3 },
  subtitle: { color: colors.textMuted, fontSize: 14 },
  form: { gap: 16, marginTop: 16 },
});
