import React from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
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
  UserPlus,
} from 'lucide-react-native';

import { Button } from '../../components/ui/Button';
import { FadeInView } from '../../components/ui/FadeInView';
import { useAuth } from '../../context/AuthContext';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, radius } from '../../theme/colors';

type MenuItemProps = {
  icon: React.ElementType;
  label: string;
  onPress: () => void;
  iconColor?: string;
  danger?: boolean;
};

function MenuItem({ icon: Icon, label, onPress, iconColor, danger }: MenuItemProps) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.item, pressed && styles.itemPressed]}>
      <View style={[styles.itemIconWrap, { backgroundColor: danger ? 'rgba(239,68,68,0.1)' : 'rgba(79,142,247,0.1)' }]}>
        <Icon color={iconColor ?? (danger ? colors.danger : colors.primary)} size={17} />
      </View>
      <Text style={[styles.itemLabel, danger && { color: colors.danger }]}>{label}</Text>
      <ChevronRight color={colors.textDim} size={15} />
    </Pressable>
  );
}

function MenuGroup({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <View style={styles.menuGroup}>
      <Text style={styles.menuGroupLabel}>{label}</Text>
      <View style={styles.menu}>
        {children}
      </View>
    </View>
  );
}

export function ProfileScreen() {
  const { t } = useTranslation();
  const { user, isAuthenticated, isAdmin, logout } = useAuth();
  const nav = useNavigation<any>();
  const insets = useSafeAreaInsets();

  if (!isAuthenticated) {
    return (
      <View style={[styles.guest, { paddingTop: insets.top }]}>
        <LinearGradient
          colors={['rgba(79,142,247,0.1)', 'transparent']}
          style={StyleSheet.absoluteFill}
        />
        <View style={styles.guestIconWrap}>
          <UserIcon color={colors.primary} size={32} />
        </View>
        <Text style={styles.guestTitle}>{t('auth.loginTitle')}</Text>
        <Text style={styles.guestText}>Connectez-vous pour accéder à votre espace.</Text>
        <Button
          label={t('auth.login')}
          onPress={() => nav.navigate('Login')}
          icon={<LogIn color="#fff" size={16} />}
          fullWidth
        />
        <Pressable onPress={() => nav.navigate('Register')} style={styles.guestRegister}>
          <UserPlus color={colors.primary} size={15} />
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

  const initials = `${user?.firstName?.[0] ?? ''}${user?.lastName?.[0] ?? ''}`.toUpperCase();

  return (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={[styles.content, { paddingTop: insets.top + 12 }]}
      showsVerticalScrollIndicator={false}
    >
      <FadeInView delay={0}>
        {/* Header card */}
        <Pressable style={styles.header} onPress={() => nav.navigate('ProfileEdit')}>
          <View style={styles.avatarWrap}>
            <LinearGradient
              colors={['#2563EB', '#4F8EF7']}
              style={styles.avatar}
            >
              <Text style={styles.avatarText}>{initials}</Text>
            </LinearGradient>
            <View style={styles.editBadge}>
              <Pencil color={colors.text} size={10} />
            </View>
          </View>
          <View style={{ flex: 1, gap: 3 }}>
            <Text style={styles.name}>{user?.firstName} {user?.lastName}</Text>
            <Text style={styles.email} numberOfLines={1}>{user?.email}</Text>
            {user?.totpEnabled && (
              <View style={styles.twofaTag}>
                <Shield color={colors.success} size={11} />
                <Text style={styles.twofaText}>2FA activée</Text>
              </View>
            )}
          </View>
          <ChevronRight color={colors.textDim} size={18} />
        </Pressable>

        {/* Mon espace */}
        <MenuGroup label="MON ESPACE">
          <MenuItem icon={LayoutDashboard} label={t('profile.dashboard')} onPress={() => nav.navigate('UserDashboard')} />
          <MenuItem icon={ShoppingBag} label={t('profile.orders')} onPress={() => nav.navigate('MyOrders')} />
          <MenuItem icon={Repeat} label={t('profile.subscriptions')} onPress={() => nav.navigate('MySubscriptions')} />
          <MenuItem icon={DollarSign} label={t('profile.payments')} onPress={() => nav.navigate('MyPayments')} />
        </MenuGroup>

        {/* Compte */}
        <MenuGroup label="COMPTE">
          <MenuItem icon={MapPin} label={t('profile.addresses')} onPress={() => nav.navigate('Addresses')} />
          <MenuItem icon={CreditCard} label={t('profile.paymentMethods')} onPress={() => nav.navigate('PaymentMethods')} />
          <MenuItem icon={Lock} label={t('profile.security')} onPress={() => nav.navigate('Security')} />
          <MenuItem icon={Settings} label={t('profile.settings')} onPress={() => nav.navigate('Settings')} />
        </MenuGroup>

        {/* Admin */}
        {isAdmin && (
          <MenuGroup label="ADMINISTRATION">
            <MenuItem icon={LayoutDashboard} label={t('admin.dashboard')} onPress={() => nav.navigate('AdminDashboard')} iconColor={colors.accent} />
            <MenuItem icon={Home} label="Page d'accueil" onPress={() => nav.navigate('AdminHome')} iconColor={colors.accent} />
            <MenuItem icon={Package} label={t('admin.services')} onPress={() => nav.navigate('AdminServices')} iconColor={colors.accent} />
            <MenuItem icon={Users} label={t('admin.users')} onPress={() => nav.navigate('AdminUsers')} iconColor={colors.accent} />
            <MenuItem icon={Repeat} label={t('admin.subscriptions')} onPress={() => nav.navigate('AdminSubscriptions')} iconColor={colors.accent} />
            <MenuItem icon={CreditCard} label={t('admin.payments')} onPress={() => nav.navigate('AdminPayments')} iconColor={colors.accent} />
            <MenuItem icon={MessageSquare} label={t('admin.contact')} onPress={() => nav.navigate('AdminContact')} iconColor={colors.accent} />
            <MenuItem icon={Tag} label={t('admin.promos')} onPress={() => nav.navigate('AdminPromos')} iconColor={colors.accent} />
          </MenuGroup>
        )}

        {/* Légal */}
        <MenuGroup label="LÉGAL">
          <MenuItem icon={FileText} label={t('legal.cgu')} onPress={() => nav.navigate('Legal', { page: 'cgu' })} />
          <MenuItem icon={FileText} label={t('legal.privacy')} onPress={() => nav.navigate('Legal', { page: 'privacy' })} />
          <MenuItem icon={FileText} label={t('legal.mentions')} onPress={() => nav.navigate('Legal', { page: 'mentions' })} />
          <MenuItem icon={FileText} label={t('legal.about')} onPress={() => nav.navigate('Legal', { page: 'about' })} />
        </MenuGroup>

        <Pressable
          style={({ pressed }) => [styles.logoutBtn, pressed && { opacity: 0.8 }]}
          onPress={confirmLogout}
        >
          <LogOut color={colors.danger} size={17} />
          <Text style={styles.logoutText}>{t('profile.logout')}</Text>
        </Pressable>
      </FadeInView>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { backgroundColor: colors.background },
  content: { padding: 20, gap: 24, paddingBottom: 48 },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    backgroundColor: colors.surface,
    padding: 16,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.borderStrong,
  },
  avatarWrap: { position: 'relative' },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { color: '#fff', fontSize: 22, fontWeight: '800' },
  editBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: colors.surfaceHigh,
    borderWidth: 1.5,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  name: { color: colors.text, fontSize: 17, fontWeight: '700' },
  email: { color: colors.textMuted, fontSize: 12 },
  twofaTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 4,
    backgroundColor: 'rgba(16,185,129,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(16,185,129,0.2)',
    alignSelf: 'flex-start',
    marginTop: 2,
  },
  twofaText: { color: colors.success, fontSize: 10, fontWeight: '700' },

  // Menu group
  menuGroup: { gap: 10 },
  menuGroupLabel: {
    color: colors.textDim,
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1.5,
    marginLeft: 4,
    textTransform: 'uppercase',
  },
  menu: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 13,
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderSubtle,
  },
  itemPressed: { backgroundColor: colors.surfaceElevated },
  itemIconWrap: {
    width: 34,
    height: 34,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  itemLabel: { flex: 1, color: colors.text, fontSize: 14, fontWeight: '500' },

  // Logout
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingVertical: 15,
    backgroundColor: 'rgba(239,68,68,0.08)',
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: 'rgba(239,68,68,0.2)',
    marginTop: 4,
  },
  logoutText: { color: colors.danger, fontSize: 15, fontWeight: '700' },

  // Guest
  guest: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32, gap: 14 },
  guestIconWrap: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(79,142,247,0.1)',
    borderWidth: 1,
    borderColor: colors.borderAccent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  guestTitle: { color: colors.text, fontSize: 22, fontWeight: '800' },
  guestText: { color: colors.textMuted, fontSize: 14, textAlign: 'center', marginBottom: 4, lineHeight: 21 },
  guestRegister: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 },
  link: { color: colors.primary, fontSize: 14, fontWeight: '600' },
});
