import React, { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { CreditCard, Download } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';

import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Loader } from '../../components/ui/Loader';
import { paymentsApi, type Payment } from '../../api/payments';
import { colors } from '../../theme/colors';
import { downloadInvoice } from '../../utils/downloadInvoice';

function fmt(iso?: string) {
  if (!iso) return '—';
  try { return new Date(iso).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' }); }
  catch { return iso; }
}

function statusTone(status: string): 'success' | 'danger' | 'warning' | 'info' {
  if (status === 'paid' || status === 'succeeded') return 'success';
  if (status === 'failed') return 'danger';
  return 'warning';
}

function statusLabel(status: string) {
  const map: Record<string, string> = {
    paid: 'Payé', succeeded: 'Payé', failed: 'Échoué',
    pending: 'En attente', refunded: 'Remboursé',
  };
  return map[status] ?? status;
}

export function MyPaymentsScreen() {
  const { t } = useTranslation();
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    paymentsApi
      .myPayments()
      .then(setPayments)
      .catch(() => setPayments([]))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <Loader />;

  if (payments.length === 0) {
    return (
      <View style={styles.empty}>
        <CreditCard color={colors.textDim} size={48} />
        <Text style={styles.emptyText}>{t('profile.noPayments')}</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
      {payments.map(p => {
        const isPaid = p.status === 'paid' || p.status === 'succeeded';

        return (
          <Card key={p.id} style={styles.card}>
            <View style={styles.row}>
              <View style={{ flex: 1 }}>
                <Text style={styles.invoice}>{p.invoiceNumber ?? `#${p.id}`}</Text>
                {p.cycle && (
                  <Text style={styles.desc}>
                    {p.cycle === 'monthly' ? 'Mensuel' : p.cycle === 'yearly' ? 'Annuel' : p.cycle}
                    {p.gateway && ` · ${p.gateway}`}
                    {p.last4 && ` · ****${p.last4}`}
                  </Text>
                )}
                <Text style={styles.date}>{fmt(p.paidAt)}</Text>
              </View>
              <View style={styles.right}>
                <Text style={styles.amount}>{Number(p.amount).toFixed(2)} €</Text>
                <Badge label={statusLabel(p.status)} tone={statusTone(p.status)} />
              </View>
            </View>
            {isPaid && (
              <Pressable style={styles.invoiceBtn} onPress={() => downloadInvoice(p.id, p.invoiceNumber)}>
                <Download color={colors.primary} size={14} />
                <Text style={styles.invoiceText}>{t('profile.downloadInvoice')}</Text>
              </Pressable>
            )}
          </Card>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { backgroundColor: colors.background },
  content: { padding: 16, gap: 12, paddingBottom: 40 },
  card: { gap: 8 },
  row: { flexDirection: 'row', gap: 12 },
  invoice: { color: colors.text, fontSize: 13, fontFamily: 'Menlo', fontWeight: '600' },
  desc: { color: colors.textSecondary, fontSize: 12, marginTop: 2 },
  date: { color: colors.textMuted, fontSize: 11, marginTop: 4 },
  right: { alignItems: 'flex-end', gap: 6 },
  amount: { color: colors.text, fontSize: 16, fontWeight: '700' },
  invoiceBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingTop: 6, borderTopWidth: 1, borderTopColor: colors.borderSubtle },
  invoiceText: { color: colors.primary, fontSize: 12, fontWeight: '600' },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, padding: 24 },
  emptyText: { color: colors.textMuted, fontSize: 15 },
});
