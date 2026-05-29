import React, { useState } from 'react';
import { Image, Pressable, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';
import { useToast } from '../../hooks/useToast';
import { useTranslation } from 'react-i18next';

import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { useAuth } from '../../context/AuthContext';
import { colors } from '../../theme/colors';
import type { RootScreen } from '../../navigation/types';

export function LoginScreen({ navigation }: RootScreen<'Login'>) {
  const { t } = useTranslation();
  const { toast } = useToast();
  const { login } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [remember, setRemember] = useState(false);
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    if (!email.trim() || !password) return;
    setLoading(true);
    try {
      const res = await login(email.trim(), password, remember);
      if (res.requires2fa) {
        navigation.replace('TwoFactor');
      } else if (res.emailUnverified) {
        navigation.replace('VerifyEmail', { email: email.trim() });
      } else {
        navigation.replace('Tabs');
      }
    } catch (e: any) {
      toast(e?.message ?? t('common.errorOccurred'), 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
      <View style={styles.header}>
        <Image
          source={require('../../assets/adaptive-icon.png')}
          style={styles.logo}
          resizeMode="contain"
        />
        <Text style={styles.title}>{t('auth.loginTitle')}</Text>
      </View>

      <View style={styles.form}>
        <Input
          label={t('auth.email')}
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
          autoComplete="email"
        />
        <Input
          label={t('auth.password')}
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />

        <View style={styles.row}>
          <View style={styles.switch}>
            <Switch
              value={remember}
              onValueChange={setRemember}
              trackColor={{ true: colors.primary, false: colors.border }}
            />
            <Text style={styles.switchLabel}>{t('auth.rememberMe')}</Text>
          </View>
          <Pressable onPress={() => navigation.navigate('ForgotPassword')}>
            <Text style={styles.link}>{t('auth.forgot')}</Text>
          </Pressable>
        </View>

        <Button label={t('auth.loginCta')} onPress={submit} loading={loading} fullWidth />
      </View>

      <Pressable style={styles.footer} onPress={() => navigation.navigate('Register')}>
        <Text style={styles.footerText}>{t('auth.noAccount')} </Text>
        <Text style={[styles.footerText, styles.link]}>{t('auth.register')}</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20, gap: 32 },
  header: { alignItems: 'center', gap: 14, marginTop: 24 },
  logo: { width: 72, height: 72, borderRadius: 18 },
  title: { color: colors.text, fontSize: 28, fontWeight: '800', letterSpacing: -0.5 },
  form: { gap: 16 },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  switch: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  switchLabel: { color: colors.textSecondary, fontSize: 13 },
  link: { color: colors.primary, fontSize: 13, fontWeight: '600' },
  footer: { flexDirection: 'row', justifyContent: 'center' },
  footerText: { color: colors.textMuted, fontSize: 14 },
});
