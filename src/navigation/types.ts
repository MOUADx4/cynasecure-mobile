import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';

export type RootStackParams = {
  Tabs: { screen?: keyof TabsParams } | undefined;
  Login: undefined;
  Register: undefined;
  ForgotPassword: undefined;
  VerifyEmail: { email: string };
  TwoFactor: undefined;
  ServiceDetails: { id: number };
  Checkout: undefined;
  MyOrders: undefined;
  MySubscriptions: undefined;
  MyPayments: undefined;
  UserDashboard: undefined;
  ProfileEdit: undefined;
  Security: undefined;
  Addresses: undefined;
  AddressForm: { id?: number } | undefined;
  PaymentMethods: undefined;
  Settings: undefined;
  Legal: { page: 'cgu' | 'privacy' | 'mentions' | 'about' };
  AdminDashboard: undefined;
  AdminServices: undefined;
  AdminUsers: undefined;
  AdminSubscriptions: undefined;
  AdminPayments: undefined;
  AdminHome: undefined;
  AdminContact: undefined;
  AdminPromos: undefined;
  AdminServiceForm: { id?: number } | undefined;
  VerifyEmailChange: { token?: string };
};

export type TabsParams = {
  Home: undefined;
  Catalog: undefined;
  Cart: undefined;
  Profile: undefined;
  Contact: undefined;
};

export type RootScreen<T extends keyof RootStackParams> = NativeStackScreenProps<RootStackParams, T>;
export type TabScreen<T extends keyof TabsParams> = BottomTabScreenProps<TabsParams, T>;
