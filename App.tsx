import 'react-native-gesture-handler';
import React, { useEffect, useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { StripeProvider } from '@stripe/stripe-react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import Constants from 'expo-constants';
import {
  useFonts,
  PlusJakartaSans_300Light,
  PlusJakartaSans_400Regular,
  PlusJakartaSans_500Medium,
  PlusJakartaSans_600SemiBold,
  PlusJakartaSans_700Bold,
  PlusJakartaSans_800ExtraBold,
} from '@expo-google-fonts/plus-jakarta-sans';

import { initI18n } from './src/i18n';
import { AuthProvider } from './src/context/AuthContext';
import { CartProvider } from './src/context/CartContext';
import { ToastProvider } from './src/components/ui/Toast';
import { RootNavigator } from './src/navigation/RootNavigator';
import { Image, Text, View } from 'react-native';
import { colors } from './src/theme/colors';
import { jakartaFamily } from './src/theme/fonts';

const stripeKey =
  process.env.EXPO_PUBLIC_STRIPE_KEY ??
  (Constants.expoConfig?.extra?.stripePublishableKey as string) ??
  '';

let _fontPatched = false;
function patchTextFont() {
  if (_fontPatched) return;
  _fontPatched = true;
  // @ts-ignore
  Text.defaultProps = Text.defaultProps ?? {};
  // @ts-ignore
  Text.defaultProps.style = { fontFamily: 'PlusJakartaSans_400Regular' };
}

export default function App() {
  const [i18nReady, setI18nReady] = useState(false);

  const [fontsLoaded] = useFonts({
    PlusJakartaSans_300Light,
    PlusJakartaSans_400Regular,
    PlusJakartaSans_500Medium,
    PlusJakartaSans_600SemiBold,
    PlusJakartaSans_700Bold,
    PlusJakartaSans_800ExtraBold,
  });

  useEffect(() => {
    initI18n().finally(() => setI18nReady(true));
  }, []);

  if (fontsLoaded) patchTextFont();

  const ready = i18nReady && fontsLoaded;

  if (!ready) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.background, gap: 20 }}>
        <Image
          source={require('./src/assets/adaptive-icon.png')}
          style={{ width: 96, height: 96, borderRadius: 22 }}
          resizeMode="contain"
        />
        <Text style={{ color: colors.primary, fontSize: 26, fontFamily: jakartaFamily('800'), letterSpacing: -0.5 }}>
          CynaSecure
        </Text>
      </View>
    );
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <ToastProvider>
          <StripeProvider publishableKey={stripeKey} merchantIdentifier="merchant.com.cynasecure">
            <AuthProvider>
              <CartProvider>
                <StatusBar style="light" backgroundColor={colors.background} />
                <RootNavigator />
              </CartProvider>
            </AuthProvider>
          </StripeProvider>
        </ToastProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
