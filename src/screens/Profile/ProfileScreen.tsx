import React from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import {
  User as UserIcon,
  ShoppingBag,
  Repeat,
  MapPin,
  CreditCard,
  Shield,
  Settings,
  LogOut,
  LogIn,
  ChevronRight,
  FileText,
  LayoutDashboard,
  Pencil,
  Lock,
  DollarSign,
  Users,
  Package,
  MessageSquare,
  Tag,
  Home,
} from 'lucide-react-native';

import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { useAuth } from '../../context/AuthContext';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '../../theme/colors';

export function ProfileScreen() {
  const { t } = useTranslation();
  const { user, isAuthenticated, isAdmin, logout } = useAuth();
  const nav = useNavigation<any>();
  const insets = useSafeAreaInsets();

  if (!isAuthenticated) {
    return (
      <View style={[styles.guest, { paddingTop: insets.top }]}>
        <UserIcon color={colors.textDim} size={48} />
        <Text style={styles.guestTitle}>{t('auth.loginTitle')}</Text>
        <Text style={styles.guestText}>Connectez-vous pour accéder à votre espace.</Text>
        <Button
          label={t('auth.login')}
          onPress={() => nav.navigate('Login')}
          icon={<LogIn color="#fff" size={16} />}
        />
        <Pressable onPress={() => nav.navigate('Register')}>
          <Text style={styles.link}>{t('auth.register')}</Text>
        </Pressable>
      </View>
    );
  }

  const confirmLogout = () => {
    Alert.alert(t('profile.logoutConfirm'), '', [
      { text: t('common.cancel'), style: 'cancel' },
      { text: t('profile.logout'), style: 'destructive', onPress: () => logout() },
    ]);
  };

  return (
    <ScrollView style={styles.scroll} contentContainerStyle={[styles.content, { paddingTop: insets.top + 12 }]}>
      {/* Header */}
      <Pressable style={styles.header} onPress={() => nav.navigate('ProfileEdit')}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>
            {user?.firstName?.[0]}{user?.lastName?.[0]}
          </Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.name}>{user?.firstName} {user?.lastName}</Text>
          <Text style={styles.email}>{user?.email}</Text>
          {user?.totpEnabled && (
            <View style={styles.twofaTag}>
              <Shield color={colors.success} size={12} />
              <Text style={styles.twofaText}>2FA activée</Text>
            </View>
          )}
        </View>
        <Pencil color={colors.textDim} size={16} />
      </Pressable>

      {/* Mon espace */}
      <View style={styles.menuGroup}>
        <Text style={styles.menuGroupLabel}>MON ESPACE</Text>
        <Card padded={false} style={styles.menu}>
          <MenuItem icon={LayoutDashboard} label={t('profile.dashboard')} onPress={() => nav.navigate('UserDashboard')} />
          <MenuItem icon={ShoppingBag} label={t('profile.orders')} onPress={() => nav.navigate('MyOrders')} />
          <MenuItem icon={Repeat} label={t('profile.subscriptions')} onPress={() => nav.navigate('MySubscriptions')} />
          <MenuItem icon={DollarSign} label={t('profile.payments')} onPress={() => nav.navigate('MyPayments')} />
        </Card>
      </View>

      {/* Compte */}
      <View style={styles.menuGroup}>
        <Text style={styles.menuGroupLabel}>COMPTE</Text>
        <Card padded={false} style={styles.menu}>
          <MenuItem icon={MapPin} label={t('profile.addresses')} onPress={() => nav.navigate('Addresses')} />
          <MenuItem icon={CreditCard} label={t('profile.paymentMethods')} onPress={() => nav.navigate('PaymentMethods')} />
          <MenuItem icon={Lock} label={t('profile.security')} onPress={() => nav.navigate('Security')} />
          <MenuItem icon={Settings} label={t('profile.settings')} onPress={() => nav.navigate('Settings')} />
        </Card>
      </View>

      {/* Admin */}
      {isAdmin && (
        <View style={styles.menuGroup}>
        <Text style={styles.menuGroupLabel}>ADMINISTRATION</Text>
        <Card padded={false} style={styles.menu}>
          <View style={styles.sectionLabel}>
            <Text style={styles.sectionLabelText}>{t('profile.administration')}</Text>
          </View>
          <MenuItem icon={LayoutDashboard} label={t('admin.dashboard')} onPress={() => nav.navigate('AdminDashboard')} />
          <MenuItem icon={Home} label="Page d'accueil" onPress={() => nav.navigate('AdminHome')} />
          <MenuItem icon={Package} label={t('admin.services')} onPress={() => nav.navigate('AdminServices')} />
          <MenuItem icon={Users} label={t('admin.users')} onPress={() => nav.navigate('AdminUsers')} />
          <MenuItem icon={Repeat} label={t('admin.subscriptions')} onPress={() => nav.navigate('AdminSubscriptions')} />
          <MenuItem icon={CreditCard} label={t('admin.payments')} onPress={() => nav.navigate('AdminPayments')} />
          <MenuItem icon={MessageSquare} label={t('admin.contact')} onPress={() => nav.navigate('AdminContact')} />
          <MenuItem icon={Tag} label={t('admin.promos')} onPress={() => nav.navigate('AdminPromos')} />
        </Card>
        </View>
      )}

      {/* Légal */}
      <View style={styles.menuGroup}>
        <Text style={styles.menuGroupLabel}>LÉGAL</Text>
        <Card padded={false} style={styles.menu}>
        <MenuItem icon={FileText} label={t('legal.cgu')} onPress={() => nav.navigate('Legal', { page: 'cgu' })} />
        <MenuItem icon={FileText} label={t('legal.privacy')} onPress={() => nav.navigate('Legal', { page: 'privacy' })} />
        <MenuItem icon={FileText} label={t('legal.mentions')} onPress={() => nav.navigate('Legal', { page: 'mentions' })} />
        <MenuItem icon={FileText} label={t('legal.about')} onPress={() => nav.navigate('Legal', { page: 'about' })} />
        </Card>
      </View>

      <Button
        label={t('profile.logout')}
        variant="danger"
        onPress={confirmLogout}
        icon={<LogOut color="#fff" size={16} />}
        fullWidth
      />
    </ScrollView>
  );
}

function MenuItem({
  icon: Icon,
  label,
  onPress,
}: {
  icon: React.ElementType;
  label: string;
  onPress: () => void;
}) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.item, pressed && styles.itemPressed]}>
      <Icon color={colors.primary} size={18} />
      <Text style={styles.itemLabel}>{label}</Text>
      <ChevronRight color={colors.textDim} size={16} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  scroll: { backgroundColor: colors.background },
  content: { padding: 20, gap: 16, paddingBottom: 48 },
  menuGroup: { gap: 6 },
  menuGroupLabel: { color: colors.primary, fontSize: 11, fontWeight: '700', letterSpacing: 1.5, marginLeft: 4 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 14, backgroundColor: colors.surface, padding: 16, borderRadius: 14, borderWidth: 1, borderColor: colors.border },
  avatar: { width: 72, height: 72, borderRadius: 36, backgroundColor: colors.primary, borderWidth: 2, borderColor: colors.primaryLight, alignItems: 'center', justifyContent: 'center' },
  avatarText: { color: '#fff', fontSize: 24, fontWeight: '800' },
  name: { color: colors.text, fontSize: 17, fontWeight: '700' },
  email: { color: colors.textMuted, fontSize: 13 },
  twofaTag: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, backgroundColor: 'rgba(16,185,129,0.12)', alignSelf: 'flex-start' },
  twofaText: { color: colors.success, fontSize: 10, fontWeight: '600' },
  menu: { overflow: 'hidden' },
  sectionLabel: { paddingHorizontal: 16, paddingVertical: 8, backgroundColor: colors.surfaceHigh },
  sectionLabelText: { color: colors.textMuted, fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1 },
  item: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingVertical: 15, paddingHorizontal: 16, borderBottomWidth: 1, borderBottomColor: colors.borderSubtle },
  itemPressed: { backgroundColor: colors.surfaceElevated },
  itemLabel: { flex: 1, color: colors.text, fontSize: 14 },
  guest: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24, gap: 12 },
  guestTitle: { color: colors.text, fontSize: 22, fontWeight: '800' },
  guestText: { color: colors.textMuted, fontSize: 14, textAlign: 'center', marginBottom: 8 },
  link: { color: colors.primary, fontSize: 14, fontWeight: '600' },
});
