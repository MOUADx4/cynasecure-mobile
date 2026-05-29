import React, { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Check } from 'lucide-react-native';

import { Card } from '../../components/ui/Card';
import { changeLang } from '../../i18n';
import { colors, radius } from '../../theme/colors';
import i18n from '../../i18n';

const LANGUAGES = [
  { code: 'fr', label: 'Français' },
  { code: 'en', label: 'English' },
  { code: 'es', label: 'Español' },
] as const;

export function SettingsScreen() {
  const { t } = useTranslation();
  const [current, setCurrent] = useState(i18n.language);

  const select = async (code: 'fr' | 'en' | 'es') => {
    await changeLang(code);
    setCurrent(code);
  };

  return (
    <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
      <Text style={styles.label}>{t('profile.language')}</Text>
      <Card padded={false}>
        {LANGUAGES.map((l) => (
          <Pressable
            key={l.code}
            onPress={() => select(l.code)}
            style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}
          >
            <Text style={styles.lang}>{l.label}</Text>
            {current === l.code && <Check color={colors.primary} size={18} />}
          </Pressable>
        ))}
      </Card>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { backgroundColor: colors.background },
  content: { padding: 16, gap: 12, paddingBottom: 40 },
  label: { color: colors.textMuted, fontSize: 11, fontWeight: '700', letterSpacing: 1, textTransform: 'uppercase' },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderSubtle,
  },
  rowPressed: { backgroundColor: colors.surfaceElevated },
  lang: { color: colors.text, fontSize: 15 },
});
