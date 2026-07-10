import React, { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Check, Mail, User, X } from 'lucide-react-native';
import { useToast } from '../../hooks/useToast';
import { useTranslation } from 'react-i18next';

import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { FadeInView } from '../../components/ui/FadeInView';
import { useAuth } from '../../context/AuthContext';
import { colors, radius } from '../../theme/colors';
import type { RootScreen } from '../../navigation/types';

function passwordChecks(pw: string) {
  return {
    length: pw.length >= 8,
    upper: /[A-Z]/.test(pw),
    lower: /[a-z]/.test(pw),
    digit: /\d/.test(pw),
    special: /[!@#$%^&*(),.?":{}|<>_\-+=\[\]\\\/;'`~]/.test(pw),
  };
}

export function RegisterScreen({ navigation }: RootScreen<'Register'>) {
  const { t } = useTranslation();
  const { toast } = useToast();
  const { register } = useAuth();
  const insets = useSafeAreaInsets();

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const checks = passwordChecks(password);
  const allOk = Object.values(checks).every(Boolean);
  const canSubmit = firstName.trim() && lastName.trim() && email.trim() && allOk;

  const submit = async () => {
    if (!canSubmit) return;
    setLoading(true);
    try {
      const res = await register({
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        email: email.trim(),
        password,
      });
      if (res?.needsVerification) {
        navigation.replace('VerifyEmail', { email: email.trim() });
      } else {
        toast(t('auth.registerSuccess'), 'success');
        navigation.replace('Login');
      }
    } catch (e: unknown) {
      toast((e instanceof Error ? e.message : null) ?? t('common.errorOccurred'), 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <LinearGradient
        colors={['#0A0A18', '#080810']}
        style={StyleSheet.absoluteFill}
      />
      <View style={[styles.orb, styles.orbTR]} />

      <ScrollView
        contentContainerStyle={[styles.container, { paddingTop: insets.top + 20, paddingBottom: insets.bottom + 32 }]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <FadeInView delay={0}>
          <View style={styles.header}>
            <Text style={styles.eyebrow}>CRÉER UN COMPTE</Text>
            <Text style={styles.title}>{t('auth.registerTitle')}</Text>
            <Text style={styles.subtitle}>Rejoignez la plateforme CynaSecure</Text>
          </View>

          <View style={styles.card}>
            <View style={styles.cardAccent} />
            <View style={styles.form}>
              <View style={styles.nameRow}>
                <View style={styles.flex}>
                  <Input
                    label={t('auth.firstName')}
                    value={firstName}
                    onChangeText={setFirstName}
                    leftIcon={<User color={colors.textDim} size={16} />}
                    maxLength={100}
                  />
                </View>
                <View style={styles.flex}>
                  <Input
                    label={t('auth.lastName')}
                    value={lastName}
                    onChangeText={setLastName}
                    maxLength={100}
                  />
                </View>
              </View>

              <Input
                label={t('auth.email')}
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                leftIcon={<Mail color={colors.textDim} size={17} />}
                placeholder="votre@email.com"
                maxLength={254}
              />

              <Input
                label={t('auth.password')}
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                placeholder="••••••••"
              />

              {password.length > 0 && (
                <View style={styles.rulesCard}>
                  <Text style={styles.rulesTitle}>SÉCURITÉ DU MOT DE PASSE</Text>
                  <View style={styles.rules}>
                    <Rule ok={checks.length} label="8 caractères minimum" />
                    <Rule ok={checks.upper} label="Une majuscule" />
                    <Rule ok={checks.lower} label="Une minuscule" />
                    <Rule ok={checks.digit} label="Un chiffre" />
                    <Rule ok={checks.special} label="Un caractère spécial" />
                  </View>
                </View>
              )}

              <Button
                label={t('auth.registerCta')}
                onPress={submit}
                loading={loading}
                disabled={!canSubmit}
                fullWidth
                size="lg"
              />
            </View>
          </View>

          <Pressable style={styles.footer} onPress={() => navigation.replace('Login')}>
            <Text style={styles.footerText}>{t('auth.haveAccount')} </Text>
            <Text style={[styles.footerText, styles.link]}>{t('auth.login')}</Text>
          </Pressable>
        </FadeInView>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function Rule({ ok, label }: { ok: boolean; label: string }) {
  const Icon = ok ? Check : X;
  return (
    <View style={ruleStyles.row}>
      <View style={[ruleStyles.iconWrap, ok && ruleStyles.iconWrapOk]}>
        <Icon color={ok ? colors.success : colors.textDim} size={12} />
      </View>
      <Text style={[ruleStyles.label, ok && ruleStyles.labelOk]}>{label}</Text>
    </View>
  );
}

const ruleStyles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  iconWrap: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: colors.surfaceHigh,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconWrapOk: { backgroundColor: 'rgba(16,185,129,0.15)' },
  label: { color: colors.textDim, fontSize: 12 },
  labelOk: { color: colors.success },
});

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  orb: { position: 'absolute', borderRadius: 999 },
  orbTR: {
    top: -60,
    right: -80,
    width: 240,
    height: 240,
    backgroundColor: 'rgba(79,142,247,0.06)',
  },
  container: { paddingHorizontal: 24, gap: 24 },
  header: { gap: 6 },
  eyebrow: { color: colors.primary, fontSize: 11, fontWeight: '700', letterSpacing: 1.5 },
  title: { color: colors.text, fontSize: 28, fontWeight: '900', letterSpacing: -0.5 },
  subtitle: { color: colors.textDim, fontSize: 14 },
  card: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.xl,
    overflow: 'hidden',
  },
  cardAccent: { height: 2, backgroundColor: colors.primary, opacity: 0.8 },
  form: { padding: 20, gap: 16 },
  nameRow: { flexDirection: 'row', gap: 12 },
  flex: { flex: 1 },
  rulesCard: {
    backgroundColor: colors.surfaceElevated,
    borderRadius: radius.md,
    padding: 14,
    gap: 10,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
  },
  rulesTitle: {
    color: colors.textDim,
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  rules: { gap: 8 },
  footer: { flexDirection: 'row', justifyContent: 'center', paddingVertical: 4 },
  footerText: { color: colors.textMuted, fontSize: 14 },
  link: { color: colors.primary, fontWeight: '600' },
});
