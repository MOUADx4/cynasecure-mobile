import React, { useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Mail } from 'lucide-react-native';

import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { authApi } from '../../api/auth';
import { colors } from '../../theme/colors';
import type { RootScreen } from '../../navigation/types';

export function VerifyEmailScreen({ navigation, route }: RootScreen<'VerifyEmail'>) {
  const { t } = useTranslation();
  const { email } = route.params;
  const [token, setToken] = useState('');
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);

  const verify = async () => {
    if (!token.trim()) return;
    setLoading(true);
    try {
      await authApi.verifyEmail(token.trim());
      Alert.alert(t('auth.verifyEmailSuccess'), '', [
        { text: 'OK', onPress: () => navigation.replace('Login') },
      ]);
    } catch (e: any) {
      Alert.alert(t('common.errorOccurred'), e?.message ?? '');
    } finally {
      setLoading(false);
    }
  };

  const resend = async () => {
    setResending(true);
    try {
      await authApi.resendVerification(email);
      Alert.alert('E-mail renvoyé', 'Vérifiez votre boîte de réception.');
    } catch (e: any) {
      Alert.alert(t('common.errorOccurred'), e?.message ?? '');
    } finally {
      setResending(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
      <View style={styles.header}>
        <Mail color={colors.primary} size={40} />
        <Text style={styles.title}>{t('auth.verifyEmailTitle')}</Text>
        <Text style={styles.subtitle}>{t('auth.verifyEmailHint')}</Text>
        <Text style={styles.email}>{email}</Text>
      </View>

      <View style={styles.form}>
        <Input
          label={t('auth.verifyEmailToken')}
          value={token}
          onChangeText={setToken}
          autoCapitalize="characters"
          autoCorrect={false}
        />
        <Button label={t('auth.verifyEmailCta')} onPress={verify} loading={loading} fullWidth />
        <Button
          label={t('auth.verifyEmailResend')}
          variant="ghost"
          onPress={resend}
          loading={resending}
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
  email: { color: colors.primary, fontSize: 14, fontWeight: '600' },
  form: { gap: 12 },
});
