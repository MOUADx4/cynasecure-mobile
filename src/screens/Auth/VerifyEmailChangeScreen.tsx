import React, { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { CheckCircle2, AlertCircle } from 'lucide-react-native';

import { Button } from '../../components/ui/Button';
import { authApi } from '../../api/auth';
import { useAuth } from '../../context/AuthContext';
import { colors } from '../../theme/colors';
import type { RootScreen } from '../../navigation/types';

export function VerifyEmailChangeScreen({ navigation, route }: RootScreen<'VerifyEmailChange'>) {
  const { t } = useTranslation();
  const { isAuthenticated, refresh } = useAuth();
  const token = route.params?.token ?? '';
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [error, setError] = useState('');

  const verify = async () => {
    setStatus('loading');
    setError('');
    try {
      await authApi.verifyEmailChange(token);
      if (isAuthenticated) await refresh();
      setStatus('success');
    } catch (e: any) {
      setError(e?.message ?? t('verifyEmailChange.errorText'));
      setStatus('error');
    }
  };

  useEffect(() => { verify(); }, []);

  if (status === 'loading') {
    return (
      <View style={styles.container}>
        <ActivityIndicator
          color={colors.primary}
          size="large"
          accessibilityRole="progressbar"
          accessibilityState={{ busy: true }}
        />
        <Text style={styles.text}>{t('verifyEmailChange.loading')}</Text>
      </View>
    );
  }

  if (status === 'success') {
    return (
      <View style={styles.container}>
        <CheckCircle2 color={colors.success} size={56} />
        <Text style={styles.title}>{t('verifyEmailChange.successTitle')}</Text>
        <Text style={styles.text}>{t('verifyEmailChange.successText')}</Text>
        <Button
          label={t('verifyEmailChange.backProfile')}
          onPress={() => navigation.navigate('Tabs')}
          fullWidth
        />
      </View>
    );
  }

  return (
    <View style={styles.container} accessibilityRole="alert">
      <AlertCircle color={colors.danger} size={56} />
      <Text style={styles.title}>{t('verifyEmailChange.errorTitle')}</Text>
      <Text style={styles.text}>{error || t('verifyEmailChange.errorText')}</Text>
      <Button label={t('verifyEmailChange.retry')} onPress={verify} fullWidth />
      <Button
        label={t('common.back')}
        variant="ghost"
        onPress={() => navigation.canGoBack() ? navigation.goBack() : navigation.navigate('Tabs')}
        fullWidth
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
  },
  title: { color: colors.text, fontSize: 22, fontWeight: '800', textAlign: 'center' },
  text: { color: colors.textMuted, fontSize: 14, textAlign: 'center' },
});
