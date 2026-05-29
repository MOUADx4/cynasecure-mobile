import React from 'react';
import { NavigationContainer, DefaultTheme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { VerifyEmailChangeScreen } from '../screens/Auth/VerifyEmailChangeScreen';

import { MainTabs } from './MainTabs';

// Auth
import { LoginScreen } from '../screens/Auth/LoginScreen';
import { RegisterScreen } from '../screens/Auth/RegisterScreen';
import { ForgotPasswordScreen } from '../screens/Auth/ForgotPasswordScreen';
import { VerifyEmailScreen } from '../screens/Auth/VerifyEmailScreen';
import { TwoFactorScreen } from '../screens/Auth/TwoFactorScreen';

// Services & Checkout
import { ServiceDetailsScreen } from '../screens/Services/ServiceDetailsScreen';
import { CheckoutScreen } from '../screens/Checkout/CheckoutScreen';

// Profile
import { MyOrdersScreen } from '../screens/Profile/MyOrdersScreen';
import { MySubscriptionsScreen } from '../screens/Profile/MySubscriptionsScreen';
import { MyPaymentsScreen } from '../screens/Profile/MyPaymentsScreen';
import { UserDashboardScreen } from '../screens/Profile/UserDashboardScreen';
import { ProfileEditScreen } from '../screens/Profile/ProfileEditScreen';
import { SecurityScreen } from '../screens/Profile/SecurityScreen';
import { AddressesScreen } from '../screens/Profile/AddressesScreen';
import { AddressFormScreen } from '../screens/Profile/AddressFormScreen';
import { PaymentMethodsScreen } from '../screens/Profile/PaymentMethodsScreen';
import { SettingsScreen } from '../screens/Profile/SettingsScreen';

// Admin
import { AdminDashboardScreen } from '../screens/Admin/AdminDashboardScreen';
import { AdminHomeScreen } from '../screens/Admin/AdminHomeScreen';
import { AdminServicesScreen } from '../screens/Admin/AdminServicesScreen';
import { AdminUsersScreen } from '../screens/Admin/AdminUsersScreen';
import { AdminSubscriptionsScreen } from '../screens/Admin/AdminSubscriptionsScreen';
import { AdminPaymentsScreen } from '../screens/Admin/AdminPaymentsScreen';
import { AdminContactScreen } from '../screens/Admin/AdminContactScreen';
import { AdminPromosScreen } from '../screens/Admin/AdminPromosScreen';
import { AdminServiceFormScreen } from '../screens/Admin/AdminServiceFormScreen';

// Legal
import { LegalScreen } from '../screens/Legal/LegalScreen';

import { colors } from '../theme/colors';
import { navigationRef } from './navigationRef';
import type { RootStackParams } from './types';

const Stack = createNativeStackNavigator<RootStackParams>();

const navTheme = {
  ...DefaultTheme,
  dark: true,
  colors: {
    ...DefaultTheme.colors,
    background: colors.background,
    card: colors.surface,
    text: colors.text,
    border: colors.border,
    primary: colors.primary,
    notification: colors.primary,
  },
};

const linking = {
  prefixes: ['cynasecure://', 'https://cynasecure.com'],
  config: {
    screens: {
      VerifyEmailChange: 'verify-email-change',
    },
  },
};

export function RootNavigator() {
  return (
    <NavigationContainer ref={navigationRef} theme={navTheme} linking={linking}>
      <Stack.Navigator
        screenOptions={{
          headerStyle: { backgroundColor: colors.background },
          headerTitleStyle: { color: colors.text, fontWeight: '700', fontSize: 17 },
          headerTintColor: colors.text,
          headerShadowVisible: false,
          contentStyle: { backgroundColor: colors.background },
        }}
      >
        <Stack.Screen name="Tabs" component={MainTabs} options={{ headerShown: false }} />

        {/* Auth */}
        <Stack.Screen name="Login" component={LoginScreen} options={{ title: 'Connexion' }} />
        <Stack.Screen name="Register" component={RegisterScreen} options={{ title: 'Inscription' }} />
        <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} options={{ title: 'Mot de passe oublié' }} />
        <Stack.Screen name="VerifyEmail" component={VerifyEmailScreen} options={{ title: 'Vérification e-mail' }} />
        <Stack.Screen name="TwoFactor" component={TwoFactorScreen} options={{ title: 'Double authentification', headerLeft: () => null }} />

        {/* Services */}
        <Stack.Screen name="ServiceDetails" component={ServiceDetailsScreen} options={{ title: '' }} />
        <Stack.Screen name="Checkout" component={CheckoutScreen} options={{ title: 'Commande' }} />

        {/* Profile */}
        <Stack.Screen name="UserDashboard" component={UserDashboardScreen} options={{ title: 'Tableau de bord' }} />
        <Stack.Screen name="MyOrders" component={MyOrdersScreen} options={{ title: 'Mes commandes' }} />
        <Stack.Screen name="MySubscriptions" component={MySubscriptionsScreen} options={{ title: 'Mes abonnements' }} />
        <Stack.Screen name="MyPayments" component={MyPaymentsScreen} options={{ title: 'Mes paiements' }} />
        <Stack.Screen name="ProfileEdit" component={ProfileEditScreen} options={{ title: 'Modifier le profil' }} />
        <Stack.Screen name="Security" component={SecurityScreen} options={{ title: 'Sécurité' }} />
        <Stack.Screen name="Addresses" component={AddressesScreen} options={{ title: 'Carnet d\'adresses' }} />
        <Stack.Screen name="AddressForm" component={AddressFormScreen} options={{ title: '' }} />
        <Stack.Screen name="PaymentMethods" component={PaymentMethodsScreen} options={{ title: 'Moyens de paiement' }} />
        <Stack.Screen name="Settings" component={SettingsScreen} options={{ title: 'Paramètres' }} />

        {/* Admin */}
        <Stack.Screen name="AdminDashboard" component={AdminDashboardScreen} options={{ title: 'Administration' }} />
        <Stack.Screen name="AdminHome" component={AdminHomeScreen} options={{ title: 'Page d\'accueil' }} />
        <Stack.Screen name="AdminServices" component={AdminServicesScreen} options={{ title: 'Services' }} />
        <Stack.Screen name="AdminUsers" component={AdminUsersScreen} options={{ title: 'Utilisateurs' }} />
        <Stack.Screen name="AdminSubscriptions" component={AdminSubscriptionsScreen} options={{ title: 'Abonnements' }} />
        <Stack.Screen name="AdminPayments" component={AdminPaymentsScreen} options={{ title: 'Paiements' }} />
        <Stack.Screen name="AdminContact" component={AdminContactScreen} options={{ title: 'Messages contact' }} />
        <Stack.Screen name="AdminPromos" component={AdminPromosScreen} options={{ title: 'Codes promo' }} />
        <Stack.Screen name="AdminServiceForm" component={AdminServiceFormScreen} options={{ title: '' }} />

        <Stack.Screen name="VerifyEmailChange" component={VerifyEmailChangeScreen} options={{ title: 'Vérification e-mail' }} />

        {/* Legal */}
        <Stack.Screen name="Legal" component={LegalScreen} options={{ title: '' }} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
