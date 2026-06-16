import React, { useState } from 'react';
import { StyleSheet, Switch, Text, View } from 'react-native';
import { ArrowRight } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { Card } from '../ui/Card';
import { colors } from '../../theme/colors';
import type { Subscription } from '../../api/subscriptions';

type StatusTone = 'success' | 'warning' | 'danger' | 'info';

function statusInfo(status: string): { tone: StatusTone; label: string } {
  switch (status) {
    case 'ACTIVE':         return { tone: 'success', label: 'Actif' };
    case 'CANCELLED':      return { tone: 'warning', label: 'Annulé' };
    case 'EXPIRED':        return { tone: 'danger',  label: 'Expiré' };
    case 'PAYMENT_FAILED': return { tone: 'danger',  label: 'Échec paiement' };
    default:               return { tone: 'info',    label: status };
  }
}

function formatDate(iso?: string | null) {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
  } catch { return iso; }
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.infoRow}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value}</Text>
    </View>
  );
}

type Props = {
  subscription: Subscription;
  onCancel?: () => void;
  onSwitchCycle?: (next: 'monthly' | 'yearly') => void;
  onToggleRenew?: (enabled: boolean) => Promise<void>;
};

function SubscriptionCardComponent({ subscription: sub, onCancel, onSwitchCycle, onToggleRenew }: Props) {
  const nav = useNavigation<any>();
  const [toggling, setToggling] = useState(false);
  const { tone, label } = statusInfo(sub.status);
  const isActive = sub.status === 'ACTIVE';
  const nextCycle: 'monthly' | 'yearly' = sub.cycle === 'monthly' ? 'yearly' : 'monthly';
  const switchLabel = sub.cycle === 'monthly' ? 'Passer annuel' : 'Passer mensuel';

  const handleToggle = async (val: boolean) => {
    if (!onToggleRenew) return;
    setToggling(true);
    try { await onToggleRenew(val); } finally { setToggling(false); }
  };

  return (
    <Card style={styles.card}>
      <View style={styles.head}>
        <Text style={styles.name}>{sub.service.title}</Text>
        <Badge label={label} tone={tone} />
      </View>

      <View style={styles.infoGrid}>
        <InfoRow label="Cycle" value={sub.cycle === 'yearly' ? 'Annuel' : 'Mensuel'} />
        <InfoRow
          label="Montant"
          value={`${sub.price.toFixed(2)} € / ${sub.cycle === 'yearly' ? 'an' : 'mois'}`}
        />
        <InfoRow label="Début" value={formatDate(sub.startDate)} />
        {sub.nextBillingAt && (
          <InfoRow label="Prochain renouvellement" value={formatDate(sub.nextBillingAt)} />
        )}
        {sub.endDate && !isActive && (
          <InfoRow label="Fin" value={formatDate(sub.endDate)} />
        )}
      </View>

      <View style={styles.actions}>
        <Button
          label="Voir le service"
          variant="ghost"
          size="sm"
          icon={<ArrowRight color={colors.text} size={14} />}
          onPress={() => nav.navigate('ServiceDetails', { id: sub.service.id })}
          accessibilityLabel={`Voir le service ${sub.service.title}`}
        />
        {isActive && onSwitchCycle && (
          <Button
            label={switchLabel}
            variant="secondary"
            size="sm"
            onPress={() => onSwitchCycle(nextCycle)}
            accessibilityLabel={`${switchLabel} pour ${sub.service.title}`}
          />
        )}
        {isActive && onCancel && (
          <Button
            label="Annuler"
            variant="danger"
            size="sm"
            onPress={onCancel}
            accessibilityLabel={`Résilier l'abonnement ${sub.service.title}`}
          />
        )}
      </View>

      {onToggleRenew && (
        <View style={styles.autoRenewRow}>
          <Text style={styles.autoRenewLabel}>
            Renouvellement auto :{' '}
            <Text style={sub.autoRenew ? styles.on : styles.off}>
              {sub.autoRenew ? 'ON' : 'OFF'}
            </Text>
          </Text>
          <Switch
            value={sub.autoRenew}
            onValueChange={handleToggle}
            disabled={toggling || !isActive}
            trackColor={{ true: colors.primary }}
            thumbColor="#fff"
          />
        </View>
      )}
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { gap: 14 },
  head: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 },
  name: { color: colors.text, fontSize: 17, fontWeight: '800', flex: 1 },
  infoGrid: {
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: colors.borderSubtle,
    paddingVertical: 8,
    gap: 8,
  },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  infoLabel: { color: colors.textMuted, fontSize: 13 },
  infoValue: { color: colors.text, fontSize: 13, fontWeight: '600' },
  actions: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  autoRenewRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 6,
    borderTopWidth: 1,
    borderTopColor: colors.borderSubtle,
  },
  autoRenewLabel: { color: colors.textMuted, fontSize: 13 },
  on: { color: colors.success, fontWeight: '700' },
  off: { color: colors.textDim, fontWeight: '700' },
});

export const SubscriptionCard = React.memo(SubscriptionCardComponent);
