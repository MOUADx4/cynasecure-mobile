import React, { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useToast } from '../../hooks/useToast';
import { useTranslation } from 'react-i18next';
import { CheckCircle2, MapPin, CreditCard, Lock, Download, ChevronRight, Tag, X } from 'lucide-react-native';
import { CardField, useStripe } from '@stripe/stripe-react-native';
import * as WebBrowser from 'expo-web-browser';
import * as Linking from 'expo-linking';

import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { Input } from '../../components/ui/Input';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';
import { checkoutApi } from '../../api/checkout';
import { colors, radius } from '../../theme/colors';
import type { RootScreen } from '../../navigation/types';
import { downloadInvoice } from '../../utils/downloadInvoice';

type Step = 'auth' | 'address' | 'payment' | 'confirmation';

const EMPTY = {
  firstName: '',
  lastName: '',
  company: '',
  address: '',
  city: '',
  zipCode: '',
  country: 'France',
  phone: '',
};

export function CheckoutScreen({ navigation }: RootScreen<'Checkout'>) {
  const { t } = useTranslation();
  const { toast } = useToast();
  const { isAuthenticated } = useAuth();
  const { items, total, clearCart, promo, setPromo } = useCart();
  const { confirmPayment } = useStripe();

  const [step, setStep] = useState<Step>(isAuthenticated ? 'address' : 'auth');
  const [guestEmail, setGuestEmail] = useState('');
  const [form, setForm] = useState(EMPTY);
  const [loading, setLoading] = useState(false);
  const [cardComplete, setCardComplete] = useState(false);
  const [result, setResult] = useState<{ paymentId: number; invoiceNumber: string; total: number } | null>(null);
  const [promoCode, setPromoCode] = useState(promo?.code ?? '');
  const [promoApplying, setPromoApplying] = useState(false);
  const [gateway, setGateway] = useState<'stripe' | 'paypal'>('stripe');

  if (items.length === 0 && step !== 'confirmation') {
    return (
      <View style={styles.center}>
        <Text style={styles.empty}>{t('cart.empty')}</Text>
      </View>
    );
  }

  const validAddress =
    form.firstName.trim() &&
    form.lastName.trim() &&
    form.address.trim() &&
    form.city.trim() &&
    form.zipCode.trim() &&
    form.country.trim();

  const applyPromo = async () => {
    if (!promoCode.trim()) return;
    setPromoApplying(true);
    try {
      const res = await checkoutApi.applyPromo(promoCode.trim().toUpperCase(), total);
      if (res.valid) {
        setPromo({ code: promoCode.trim().toUpperCase(), discount: res.discount, discountedTotal: res.discountedTotal, type: '' });
      } else {
        toast('Code promo invalide ou expiré.', 'warning');
        setPromo(null);
      }
    } catch {
      toast('Impossible d\'appliquer ce code promo.', 'error');
    } finally {
      setPromoApplying(false);
    }
  };

  const removePromo = () => {
    setPromoCode('');
    setPromo(null);
  };

  const submitPayment = async () => {
    if (!cardComplete) {
      toast('Veuillez entrer les informations de votre carte.', 'warning');
      return;
    }
    setLoading(true);
    try {
      // 1. Créer l'intent côté backend
      const intent = await checkoutApi.intent(
        items.map((i) => ({ serviceId: i.id, billing: i.cycle })),
        form,
        !isAuthenticated && guestEmail ? guestEmail : undefined,
        promo?.code
      );

      // 2. Confirmer le paiement côté Stripe (charge réelle de la carte)
      const { error, paymentIntent } = await confirmPayment(intent.clientSecret, {
        paymentMethodType: 'Card',
        paymentMethodData: {
          billingDetails: {
            name: `${form.firstName} ${form.lastName}`,
            email: guestEmail || undefined,
            address: {
              line1: form.address,
              city: form.city,
              postalCode: form.zipCode,
              country: form.country.length === 2 ? form.country : 'FR',
            },
          },
        },
      });

      if (error) {
        toast(error.message ?? t('common.errorOccurred'), 'error');
        return;
      }

      // 3. Notifier le backend que le paiement est confirmé
      const res = await checkoutApi.confirm({
        orderId: intent.orderId,
        gateway: 'stripe',
        paymentIntentId: paymentIntent?.id,
      });

      setResult({ paymentId: res.paymentId, invoiceNumber: res.invoiceNumber, total: res.total });
      clearCart();
      setStep('confirmation');
    } catch (e: any) {
      toast(e?.message ?? t('common.errorOccurred'), 'error');
    } finally {
      setLoading(false);
    }
  };

  const submitPayPal = async () => {
    setLoading(true);
    try {
      const returnUrl = Linking.createURL('checkout/paypal-success');

      const intent = await checkoutApi.intent(
        items.map((i) => ({ serviceId: i.id, billing: i.cycle })),
        form,
        !isAuthenticated && guestEmail ? guestEmail : undefined,
        promo?.code,
        returnUrl,
      );

      if (!intent.paypalApproveUrl || !intent.paypalOrderId) {
        toast('PayPal n\'est pas disponible pour ce paiement.', 'error');
        return;
      }

      const result = await WebBrowser.openAuthSessionAsync(intent.paypalApproveUrl, returnUrl);

      if (result.type !== 'success') {
        toast('Paiement PayPal annulé ou interrompu.', 'info');
        return;
      }

      const res = await checkoutApi.confirm({
        orderId: intent.orderId,
        gateway: 'paypal',
        paypalOrderId: intent.paypalOrderId,
      });

      setResult({ paymentId: res.paymentId, invoiceNumber: res.invoiceNumber, total: res.total });
      clearCart();
      setStep('confirmation');
    } catch (e: any) {
      toast(e?.message ?? t('common.errorOccurred'), 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
      <Stepper step={step} />

      {step === 'auth' && (
        <Card style={styles.section}>
          <Text style={styles.sectionTitle}>{t('checkout.loginRequired')}</Text>

          <Button label={t('auth.login')} onPress={() => navigation.navigate('Login')} fullWidth />
          <Button label={t('auth.register')} variant="ghost" onPress={() => navigation.navigate('Register')} fullWidth />

          <View style={styles.divider}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>OU</Text>
            <View style={styles.dividerLine} />
          </View>

          <Input
            label={t('checkout.guestEmail')}
            value={guestEmail}
            onChangeText={setGuestEmail}
            keyboardType="email-address"
            autoCapitalize="none"
          />
          <Button
            label={t('checkout.continueAsGuest')}
            variant="secondary"
            onPress={() => setStep('address')}
            disabled={!guestEmail.includes('@')}
            fullWidth
          />
        </Card>
      )}

      {step === 'address' && (
        <Card style={styles.section}>
          <View style={styles.sectionHeader}>
            <MapPin color={colors.primary} size={16} />
            <Text style={styles.sectionTitle}>{t('checkout.billingAddress')}</Text>
          </View>

          <View style={styles.row}>
            <View style={styles.flex}>
              <Input label={t('auth.firstName')} value={form.firstName} onChangeText={(v) => setForm({ ...form, firstName: v })} />
            </View>
            <View style={styles.flex}>
              <Input label={t('auth.lastName')} value={form.lastName} onChangeText={(v) => setForm({ ...form, lastName: v })} />
            </View>
          </View>

          <Input label="Adresse" value={form.address} onChangeText={(v) => setForm({ ...form, address: v })} />

          <View style={styles.row}>
            <View style={styles.flex}>
              <Input label="Ville" value={form.city} onChangeText={(v) => setForm({ ...form, city: v })} />
            </View>
            <View style={styles.flex}>
              <Input label="Code postal" value={form.zipCode} onChangeText={(v) => setForm({ ...form, zipCode: v })} keyboardType="number-pad" />
            </View>
          </View>

          <Input label="Pays (code 2 lettres, ex: FR)" value={form.country} onChangeText={(v) => setForm({ ...form, country: v.toUpperCase() })} autoCapitalize="characters" maxLength={2} />
          <Input label="Téléphone (optionnel)" value={form.phone} onChangeText={(v) => setForm({ ...form, phone: v })} keyboardType="phone-pad" />

          <Button
            label={t('common.continue')}
            onPress={() => setStep('payment')}
            disabled={!validAddress}
            icon={<ChevronRight color="#fff" size={16} />}
            fullWidth
          />
        </Card>
      )}

      {step === 'payment' && (
        <Card style={styles.section}>
          <View style={styles.sectionHeader}>
            <CreditCard color={colors.primary} size={16} />
            <Text style={styles.sectionTitle}>{t('checkout.stepPayment')}</Text>
          </View>

          <View style={styles.testBanner}>
            <Lock color={colors.warning} size={14} />
            <Text style={styles.testText}>{t('checkout.testModeBanner')}</Text>
          </View>

          {/* Gateway selector */}
          <View style={styles.gatewayRow}>
            <Pressable
              style={[styles.gatewayBtn, gateway === 'stripe' && styles.gatewayBtnActive]}
              onPress={() => setGateway('stripe')}
            >
              <CreditCard color={gateway === 'stripe' ? colors.primary : colors.textDim} size={14} />
              <Text style={[styles.gatewayLabel, gateway === 'stripe' && styles.gatewayLabelActive]}>Carte bancaire</Text>
            </Pressable>
            <Pressable
              style={[styles.gatewayBtn, gateway === 'paypal' && styles.gatewayBtnActive]}
              onPress={() => setGateway('paypal')}
            >
              <Text style={[styles.paypalIcon, gateway === 'paypal' && styles.paypalIconActive]}>P</Text>
              <Text style={[styles.gatewayLabel, gateway === 'paypal' && styles.gatewayLabelActive]}>PayPal</Text>
            </Pressable>
          </View>

          {/* Promo code */}
          {promo ? (
            <View style={styles.promoApplied}>
              <Tag color={colors.success} size={14} />
              <View style={{ flex: 1 }}>
                <Text style={styles.promoAppliedCode}>{promo.code}</Text>
                <Text style={styles.promoDiscount}>-{promo.discount.toFixed(2)} €</Text>
              </View>
              <Pressable onPress={removePromo}>
                <X color={colors.textDim} size={16} />
              </Pressable>
            </View>
          ) : (
            <View style={styles.promoRow}>
              <TextInput
                style={styles.promoInput}
                value={promoCode}
                onChangeText={v => setPromoCode(v.toUpperCase())}
                placeholder={t('cart.promo')}
                placeholderTextColor={colors.textDim}
                autoCapitalize="characters"
              />
              <Button
                label={t('cart.applyPromo')}
                variant="secondary"
                size="sm"
                onPress={applyPromo}
                loading={promoApplying}
                disabled={!promoCode.trim()}
              />
            </View>
          )}

          {promo && (
            <View style={styles.discountRow}>
              <Text style={styles.discountLabel}>Réduction</Text>
              <Text style={styles.discountValue}>-{promo.discount.toFixed(2)} €</Text>
            </View>
          )}
          <Text style={styles.totalLabel}>Total à payer</Text>
          <Text style={styles.totalValue}>{(promo?.discountedTotal ?? total).toFixed(2)} €</Text>

          {gateway === 'stripe' ? (
            <>
              <View style={styles.cardFieldWrap}>
                <CardField
                  postalCodeEnabled={false}
                  style={styles.cardField}
                  cardStyle={{
                    backgroundColor: colors.surfaceHigh,
                    textColor: colors.text,
                    borderColor: colors.border,
                    borderWidth: 1,
                    borderRadius: 10,
                    placeholderColor: colors.textDim,
                  }}
                  onCardChange={(detail) => setCardComplete(detail.complete)}
                />
              </View>
              <Button
                label={t('checkout.payWithCard')}
                onPress={submitPayment}
                loading={loading}
                disabled={!cardComplete}
                fullWidth
              />
            </>
          ) : (
            <Button
              label="Payer avec PayPal"
              onPress={submitPayPal}
              loading={loading}
              fullWidth
            />
          )}

          <View style={styles.secureRow}>
            <Lock color={colors.textDim} size={12} />
            <Text style={styles.secureText}>{t('checkout.secure')}</Text>
          </View>
        </Card>
      )}

      {step === 'confirmation' && result && (
        <Card style={styles.confirmCard}>
          <View style={styles.confirmIcon}>
            <CheckCircle2 color={colors.success} size={48} />
          </View>
          <Text style={styles.confirmTitle}>{t('checkout.success')}</Text>
          <Text style={styles.confirmNumber}>{result.invoiceNumber}</Text>
          <Text style={styles.confirmTotal}>{result.total.toFixed(2)} €</Text>
          <Text style={styles.confirmHint}>{t('checkout.successHint')}</Text>

          <Button
            label={t('checkout.downloadInvoice')}
            onPress={() => downloadInvoice(result.paymentId, result.invoiceNumber)}
            icon={<Download color="#fff" size={16} />}
            fullWidth
          />
          <Button
            label={t('checkout.viewSubscriptions')}
            variant="ghost"
            onPress={() => navigation.replace('MySubscriptions')}
            fullWidth
          />
        </Card>
      )}
    </ScrollView>
  );
}

function Stepper({ step }: { step: Step }) {
  const steps: Step[] = ['auth', 'address', 'payment', 'confirmation'];
  const idx = steps.indexOf(step);
  const labels = ['Identité', 'Adresse', 'Paiement', 'OK'];

  return (
    <View style={styles.stepper}>
      {steps.map((s, i) => (
        <React.Fragment key={s}>
          <View style={styles.stepWrap}>
            <View style={[styles.stepDot, i <= idx && styles.stepDotActive]}>
              <Text style={[styles.stepNum, i <= idx && styles.stepNumActive]}>{i + 1}</Text>
            </View>
            <Text style={[styles.stepLabel, i === idx && styles.stepLabelActive]}>{labels[i]}</Text>
          </View>
          {i < steps.length - 1 && <View style={[styles.stepLine, i < idx && styles.stepLineActive]} />}
        </React.Fragment>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  scroll: { backgroundColor: colors.background },
  content: { padding: 20, gap: 16, paddingBottom: 48 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  empty: { color: colors.textMuted, fontSize: 14 },
  stepper: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8 },
  stepWrap: { alignItems: 'center', gap: 4 },
  stepDot: { width: 26, height: 26, borderRadius: 13, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center' },
  stepDotActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  stepNum: { color: colors.textMuted, fontSize: 12, fontWeight: '700' },
  stepNumActive: { color: '#fff' },
  stepLabel: { color: colors.textDim, fontSize: 10 },
  stepLabelActive: { color: colors.text, fontWeight: '600' },
  stepLine: { flex: 1, height: 1, backgroundColor: colors.border, marginHorizontal: 4, marginTop: -16 },
  stepLineActive: { backgroundColor: colors.primary },
  section: { gap: 14 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  sectionTitle: { color: colors.text, fontSize: 16, fontWeight: '700' },
  row: { flexDirection: 'row', gap: 12 },
  flex: { flex: 1 },
  divider: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  dividerLine: { flex: 1, height: 1, backgroundColor: colors.border },
  dividerText: { color: colors.textDim, fontSize: 11 },
  testBanner: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: 'rgba(245,158,11,0.12)', borderWidth: 1, borderColor: 'rgba(245,158,11,0.3)', padding: 10, borderRadius: radius.sm },
  testText: { color: colors.warning, fontSize: 11, flex: 1 },
  discountRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  discountLabel: { color: colors.success, fontSize: 13 },
  discountValue: { color: colors.success, fontSize: 13, fontWeight: '700' },
  totalLabel: { color: colors.textMuted, fontSize: 12 },
  totalValue: { color: colors.text, fontSize: 32, fontWeight: '900' },
  cardFieldWrap: { borderRadius: 10, overflow: 'hidden' },
  cardField: { width: '100%', height: 56 },
  secureRow: { flexDirection: 'row', justifyContent: 'center', gap: 6, alignItems: 'center' },
  secureText: { color: colors.textDim, fontSize: 11 },
  promoRow: { flexDirection: 'row', gap: 8, alignItems: 'center' },
  promoInput: { flex: 1, backgroundColor: colors.surfaceHigh, borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, paddingHorizontal: 12, paddingVertical: 10, color: colors.text, fontSize: 14, fontFamily: 'Menlo' },
  gatewayRow: { flexDirection: 'row', gap: 8 },
  gatewayBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 10, borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, backgroundColor: colors.surfaceHigh },
  gatewayBtnActive: { borderColor: colors.primary, backgroundColor: 'rgba(99,102,241,0.1)' },
  gatewayLabel: { color: colors.textDim, fontSize: 13, fontWeight: '600' },
  gatewayLabelActive: { color: colors.primary },
  paypalIcon: { color: colors.textDim, fontSize: 16, fontWeight: '900', fontFamily: 'Menlo' },
  paypalIconActive: { color: colors.primary },
  promoApplied: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: 'rgba(16,185,129,0.1)', borderWidth: 1, borderColor: 'rgba(16,185,129,0.3)', borderRadius: radius.md, padding: 10 },
  promoAppliedCode: { color: colors.success, fontSize: 13, fontWeight: '700', fontFamily: 'Menlo' },
  promoDiscount: { color: colors.success, fontSize: 12 },
  confirmCard: { alignItems: 'center', gap: 10, padding: 24 },
  confirmIcon: { width: 80, height: 80, borderRadius: 40, backgroundColor: 'rgba(16,185,129,0.12)', alignItems: 'center', justifyContent: 'center' },
  confirmTitle: { color: colors.text, fontSize: 22, fontWeight: '900' },
  confirmNumber: { color: colors.textMuted, fontSize: 12, fontFamily: 'Menlo' },
  confirmTotal: { color: colors.text, fontSize: 28, fontWeight: '800', marginVertical: 8 },
  confirmHint: { color: colors.textMuted, fontSize: 13, textAlign: 'center', marginBottom: 8 },
});
