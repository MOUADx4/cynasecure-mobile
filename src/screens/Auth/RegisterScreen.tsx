import React, { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useToast } from '../../hooks/useToast';
import { useTranslation } from 'react-i18next';
import { Check, X } from 'lucide-react-native';

import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { useAuth } from '../../context/AuthContext';
import { colors } from '../../theme/colors';
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

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const checks = passwordChecks(password);
  const allOk = Object.values(checks).every(Boolean);
  const canSubmit =
    firstName.trim() && lastName.trim() && email.trim() && allOk;

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
    } catch (e: any) {
      toast(e?.message ?? t('common.errorOccurred'), 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
      <Text style={styles.title}>{t('auth.registerTitle')}</Text>

      <View style={styles.form}>
        <View style={styles.row}>
          <View style={styles.flex}>
            <Input label={t('auth.firstName')} value={firstName} onChangeText={setFirstName} />
          </View>
          <View style={styles.flex}>
            <Input label={t('auth.lastName')} value={lastName} onChangeText={setLastName} />
          </View>
        </View>

        <Input
          label={t('auth.email')}
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
        />

        <Input
          label={t('auth.password')}
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />

        <View style={styles.rules}>
          <Rule ok={checks.length} label="8 caractères minimum" />
          <Rule ok={checks.upper} label="Une majuscule" />
          <Rule ok={checks.lower} label="Une minuscule" />
          <Rule ok={checks.digit} label="Un chiffre" />
          <Rule ok={checks.special} label="Un caractère spécial" />
        </View>

        <Button label={t('auth.registerCta')} onPress={submit} loading={loading} disabled={!canSubmit} fullWidth />
      </View>

      <Pressable style={styles.footer} onPress={() => navigation.replace('Login')}>
        <Text style={styles.footerText}>{t('auth.haveAccount')} </Text>
        <Text style={[styles.footerText, styles.link]}>{t('auth.login')}</Text>
      </Pressable>
    </ScrollView>
  );
}

function Rule({ ok, label }: { ok: boolean; label: string }) {
  const Icon = ok ? Check : X;
  return (
    <View style={styles.rule}>
      <Icon color={ok ? colors.success : colors.textDim} size={14} />
      <Text style={[styles.ruleText, ok && { color: colors.success }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20, gap: 24 },
  title: { color: colors.text, fontSize: 26, fontWeight: '900', marginTop: 16, letterSpacing: -0.3 },
  form: { gap: 16 },
  row: { flexDirection: 'row', gap: 12 },
  flex: { flex: 1 },
  rules: { gap: 4 },
  rule: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  ruleText: { color: colors.textDim, fontSize: 12 },
  footer: { flexDirection: 'row', justifyContent: 'center' },
  footerText: { color: colors.textMuted, fontSize: 14 },
  link: { color: colors.primary, fontWeight: '600' },
});
