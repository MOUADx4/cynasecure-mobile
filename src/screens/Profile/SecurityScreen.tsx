import React, { useCallback, useEffect, useState } from 'react';
import { Alert, Linking, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Shield, Lock, Mail } from 'lucide-react-native';

import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Card } from '../../components/ui/Card';
import { Loader } from '../../components/ui/Loader';
import { authApi } from '../../api/auth';
import { useAuth } from '../../context/AuthContext';
import { colors } from '../../theme/colors';

type TwoFAState = 'idle' | 'setup' | 'disable';

export function SecurityScreen() {
  const { t } = useTranslation();
  const { user, refresh } = useAuth();

  // Change password
  const [currentPwd, setCurrentPwd] = useState('');
  const [newPwd, setNewPwd] = useState('');
  const [confirmPwd, setConfirmPwd] = useState('');
  const [pwdLoading, setPwdLoading] = useState(false);

  // 2FA
  const [twoFAEnabled, setTwoFAEnabled] = useState(user?.totpEnabled ?? false);
  const [twoFAState, setTwoFAState] = useState<TwoFAState>('idle');
  const [twoFASecret, setTwoFASecret] = useState('');
  const [twoFAQrContent, setTwoFAQrContent] = useState('');
  const [twoFACode, setTwoFACode] = useState('');
  const [disablePwd, setDisablePwd] = useState('');
  const [disableCode, setDisableCode] = useState('');
  const [twoFALoading, setTwoFALoading] = useState(false);

  // Email change
  const [emailPwd, setEmailPwd] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [emailLoading, setEmailLoading] = useState(false);

  const changePassword = async () => {
    if (!currentPwd || !newPwd) return;
    if (newPwd !== confirmPwd) {
      Alert.alert(t('security.passwordMismatch'));
      return;
    }
    setPwdLoading(true);
    try {
      await authApi.changePassword({ currentPassword: currentPwd, newPassword: newPwd });
      Alert.alert(t('security.passwordUpdated'));
      setCurrentPwd(''); setNewPwd(''); setConfirmPwd('');
    } catch (e: any) {
      Alert.alert(t('common.errorOccurred'), e?.message ?? '');
    } finally {
      setPwdLoading(false);
    }
  };

  const startSetup2FA = async () => {
    setTwoFALoading(true);
    try {
      const { secret, qrContent } = await authApi.twoFactorSetup();
      setTwoFASecret(secret);
      setTwoFAQrContent(qrContent);
      setTwoFAState('setup');
    } catch (e: any) {
      Alert.alert(t('common.errorOccurred'), e?.message ?? '');
    } finally {
      setTwoFALoading(false);
    }
  };

  const confirm2FA = async () => {
    if (twoFACode.length !== 6) return;
    setTwoFALoading(true);
    try {
      await authApi.twoFactorConfirm(twoFACode);
      setTwoFAEnabled(true);
      setTwoFAState('idle');
      setTwoFACode('');
      await refresh();
    } catch (e: any) {
      Alert.alert(t('common.errorOccurred'), e?.message ?? '');
    } finally {
      setTwoFALoading(false);
    }
  };

  const disable2FA = async () => {
    if (!disablePwd || disableCode.length !== 6) return;
    setTwoFALoading(true);
    try {
      await authApi.twoFactorDisable(disablePwd, disableCode);
      setTwoFAEnabled(false);
      setTwoFAState('idle');
      setDisablePwd(''); setDisableCode('');
      await refresh();
    } catch (e: any) {
      Alert.alert(t('common.errorOccurred'), e?.message ?? '');
    } finally {
      setTwoFALoading(false);
    }
  };

  const requestEmailChange = async () => {
    if (!emailPwd || !newEmail.trim()) return;
    setEmailLoading(true);
    try {
      await authApi.requestEmailChange(emailPwd, newEmail.trim());
      Alert.alert(t('security.emailChangeSent'));
      setEmailPwd(''); setNewEmail('');
    } catch (e: any) {
      Alert.alert(t('common.errorOccurred'), e?.message ?? '');
    } finally {
      setEmailLoading(false);
    }
  };

  return (
    <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
      {/* Change password */}
      <Card>
        <View style={styles.sectionHeader}>
          <Lock color={colors.primary} size={18} />
          <Text style={styles.sectionTitle}>{t('security.changePassword')}</Text>
        </View>
        <Input label={t('security.currentPassword')} value={currentPwd} onChangeText={setCurrentPwd} secureTextEntry />
        <Input label={t('security.newPassword')} value={newPwd} onChangeText={setNewPwd} secureTextEntry />
        <Input label={t('security.confirmPassword')} value={confirmPwd} onChangeText={setConfirmPwd} secureTextEntry />
        <Button
          label={t('common.save')}
          onPress={changePassword}
          loading={pwdLoading}
          disabled={!currentPwd || !newPwd || !confirmPwd}
          fullWidth
        />
      </Card>

      {/* 2FA */}
      <Card>
        <View style={styles.sectionHeader}>
          <Shield color={twoFAEnabled ? colors.success : colors.textDim} size={18} />
          <Text style={styles.sectionTitle}>{t('security.twoFactor')}</Text>
          <View style={[styles.badge, { backgroundColor: twoFAEnabled ? 'rgba(16,185,129,0.15)' : 'rgba(107,114,128,0.15)' }]}>
            <Text style={[styles.badgeText, { color: twoFAEnabled ? colors.success : colors.textDim }]}>
              {twoFAEnabled ? t('security.twoFactorEnabled') : t('security.twoFactorDisabled')}
            </Text>
          </View>
        </View>

        {twoFAState === 'idle' && !twoFAEnabled && (
          <Button label={t('security.enable2fa')} onPress={startSetup2FA} loading={twoFALoading} fullWidth />
        )}
        {twoFAState === 'idle' && twoFAEnabled && (
          <Button label={t('security.disable2fa')} variant="danger" onPress={() => setTwoFAState('disable')} fullWidth />
        )}

        {twoFAState === 'setup' && (
          <View style={styles.setupBox}>
            <Text style={styles.setupHint}>{t('security.setup2faInstructions')}</Text>
            <View style={styles.secretBox}>
              <Text style={styles.secretLabel}>{t('security.secretKey')}</Text>
              <Text style={styles.secret} selectable>{twoFASecret}</Text>
            </View>
            <Button
              label={t('security.openAuthApp')}
              variant="secondary"
              onPress={() => Linking.openURL(twoFAQrContent)}
              fullWidth
            />
            <Input
              label={t('security.enterCode')}
              value={twoFACode}
              onChangeText={setTwoFACode}
              keyboardType="number-pad"
              maxLength={6}
            />
            <View style={styles.row}>
              <Button label={t('common.cancel')} variant="ghost" onPress={() => setTwoFAState('idle')} style={{ flex: 1 }} />
              <Button
                label={t('security.confirm2fa')}
                onPress={confirm2FA}
                loading={twoFALoading}
                disabled={twoFACode.length !== 6}
                style={{ flex: 1 }}
              />
            </View>
          </View>
        )}

        {twoFAState === 'disable' && (
          <View style={styles.setupBox}>
            <Text style={styles.setupHint}>{t('security.disable2faInstructions')}</Text>
            <Input label={t('security.currentPassword')} value={disablePwd} onChangeText={setDisablePwd} secureTextEntry />
            <Input
              label={t('auth.twoFactorCode')}
              value={disableCode}
              onChangeText={setDisableCode}
              keyboardType="number-pad"
              maxLength={6}
            />
            <View style={styles.row}>
              <Button label={t('common.cancel')} variant="ghost" onPress={() => setTwoFAState('idle')} style={{ flex: 1 }} />
              <Button
                label={t('security.confirmDisable')}
                variant="danger"
                onPress={disable2FA}
                loading={twoFALoading}
                disabled={!disablePwd || disableCode.length !== 6}
                style={{ flex: 1 }}
              />
            </View>
          </View>
        )}
      </Card>

      {/* Email change */}
      <Card>
        <View style={styles.sectionHeader}>
          <Mail color={colors.primary} size={18} />
          <Text style={styles.sectionTitle}>{t('security.emailChange')}</Text>
        </View>
        <Text style={styles.currentEmail}>{user?.email}</Text>
        <Input label={t('security.currentPassword')} value={emailPwd} onChangeText={setEmailPwd} secureTextEntry />
        <Input
          label={t('security.newEmail')}
          value={newEmail}
          onChangeText={setNewEmail}
          keyboardType="email-address"
          autoCapitalize="none"
        />
        <Button
          label={t('security.requestEmailChange')}
          onPress={requestEmailChange}
          loading={emailLoading}
          disabled={!emailPwd || !newEmail.trim()}
          fullWidth
        />
      </Card>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { backgroundColor: colors.background },
  content: { padding: 16, gap: 16, paddingBottom: 40 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 14 },
  sectionTitle: { flex: 1, color: colors.text, fontSize: 15, fontWeight: '700' },
  badge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 20 },
  badgeText: { fontSize: 11, fontWeight: '600' },
  setupBox: { gap: 12 },
  setupHint: { color: colors.textMuted, fontSize: 13, lineHeight: 18 },
  secretBox: { backgroundColor: colors.surfaceHigh, borderRadius: 8, padding: 12, gap: 4 },
  secretLabel: { color: colors.textMuted, fontSize: 11 },
  secret: { color: colors.text, fontSize: 13, fontFamily: 'Menlo', letterSpacing: 1 },
  row: { flexDirection: 'row', gap: 10 },
  currentEmail: { color: colors.textSecondary, fontSize: 14, marginBottom: 10 },
});
