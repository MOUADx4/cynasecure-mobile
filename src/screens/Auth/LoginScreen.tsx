import React, { useState } from 'react';
import { Image, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Switch } from 'react-native';
import { Lock, Mail } from 'lucide-react-native';
import { useToast } from '../../hooks/useToast';
import { useTranslation } from 'react-i18next';

import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { FadeInView } from '../../components/ui/FadeInView';
import { useHaptic } from '../../hooks/useHaptic';
import { useAuth } from '../../context/AuthContext';
import { colors, radius } from '../../theme/colors';
import type { RootScreen } from '../../navigation/types';

export function LoginScreen({ navigation }: RootScreen<'Login'>) {
  const { t } = useTranslation();
  const { toast } = useToast();
  const { login } = useAuth();
  const { success, error: hapticError } = useHaptic();
  const insets = useSafeAreaInsets();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [remember, setRemember] = useState(false);
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    if (!email.trim() || !password) return;
    setLoading(true);
    try {
      const res = await login(email.trim(), password, remember);
      success();
      if (res.requires2fa) {
        navigation.replace('TwoFactor');
      } else if (res.emailUnverified) {
        navigation.replace('VerifyEmail', { email: email.trim() });
      } else {
        navigation.replace('Tabs');
      }
    } catch (e: any) {
      hapticError();
      toast(e?.message ?? t('common.errorOccurred'), 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      {/* Background */}
      <LinearGradient
        colors={['#0A0A18', '#080810']}
        style={StyleSheet.absoluteFill}
      />
      <View style={[styles.orb, styles.orbTL]} />
      <View style={[styles.orb, styles.orbBR]} />

      <ScrollView
        contentContainerStyle={[styles.container, { paddingTop: insets.top + 24, paddingBottom: insets.bottom + 32 }]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <FadeInView delay={0}>
          {/* Logo + brand */}
          <View style={styles.header}>
            <View style={styles.logoRing}>
              <Image
                source={require('../../assets/adaptive-icon.png')}
                style={styles.logo}
                resizeMode="contain"
              />
            </View>
            <Text style={styles.brand}>CynaSecure</Text>
            <Text style={styles.title}>{t('auth.loginTitle')}</Text>
            <Text style={styles.subtitle}>Accédez à votre espace sécurisé</Text>
          </View>

          {/* Form card */}
          <View style={styles.card}>
            <View style={styles.cardAccent} />
            <View style={styles.form}>
              <Input
                label={t('auth.email')}
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                autoComplete="email"
                leftIcon={<Mail color={colors.textDim} size={17} />}
                placeholder="votre@email.com"
              />
              <Input
                label={t('auth.password')}
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                leftIcon={<Lock color={colors.textDim} size={17} />}
                placeholder="••••••••"
              />

              <View style={styles.row}>
                <View style={styles.switchRow}>
                  <Switch
                    value={remember}
                    onValueChange={setRemember}
                    trackColor={{ true: colors.primary, false: colors.border }}
                    thumbColor={remember ? '#fff' : colors.textDim}
                    ios_backgroundColor={colors.border}
                  />
                  <Text style={styles.switchLabel}>{t('auth.rememberMe')}</Text>
                </View>
                <Pressable onPress={() => navigation.navigate('ForgotPassword')} hitSlop={8}>
                  <Text style={styles.link}>{t('auth.forgot')}</Text>
                </Pressable>
              </View>

              <Button label={t('auth.loginCta')} onPress={submit} loading={loading} fullWidth size="lg" />
            </View>
          </View>

          <Pressable style={styles.footer} onPress={() => navigation.navigate('Register')}>
            <Text style={styles.footerText}>{t('auth.noAccount')} </Text>
            <Text style={[styles.footerText, styles.link]}>{t('auth.register')}</Text>
          </Pressable>
        </FadeInView>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  orb: {
    position: 'absolute',
    borderRadius: 999,
  },
  orbTL: {
    top: -80,
    left: -60,
    width: 260,
    height: 260,
    backgroundColor: 'rgba(79,142,247,0.07)',
  },
  orbBR: {
    bottom: -100,
    right: -80,
    width: 300,
    height: 300,
    backgroundColor: 'rgba(34,211,238,0.04)',
  },
  container: { paddingHorizontal: 24, gap: 28 },
  header: { alignItems: 'center', gap: 8 },
  logoRing: {
    width: 80,
    height: 80,
    borderRadius: 24,
    backgroundColor: colors.surfaceElevated,
    borderWidth: 1.5,
    borderColor: colors.borderAccent,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  logo: { width: 54, height: 54, borderRadius: 14 },
  brand: { color: colors.textMuted, fontSize: 12, fontWeight: '700', letterSpacing: 2, textTransform: 'uppercase' },
  title: { color: colors.text, fontSize: 28, fontWeight: '800', letterSpacing: -0.5, marginTop: 2 },
  subtitle: { color: colors.textDim, fontSize: 14, marginTop: 2 },
  card: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.xl,
    overflow: 'hidden',
  },
  cardAccent: {
    height: 2,
    backgroundColor: colors.primary,
    opacity: 0.8,
  },
  form: { padding: 20, gap: 16 },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  switchRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  switchLabel: { color: colors.textSecondary, fontSize: 13 },
  link: { color: colors.primary, fontSize: 13, fontWeight: '600' },
  footer: { flexDirection: 'row', justifyContent: 'center', paddingVertical: 4 },
  footerText: { color: colors.textMuted, fontSize: 14 },
});
