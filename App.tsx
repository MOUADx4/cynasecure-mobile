import 'react-native-gesture-handler';
import React, { useEffect, useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { StripeProvider } from '@stripe/stripe-react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import Constants from 'expo-constants';

import { initI18n } from './src/i18n';
import { AuthProvider } from './src/context/AuthContext';
import { CartProvider } from './src/context/CartContext';
import { ToastProvider } from './src/components/ui/Toast';
import { RootNavigator } from './src/navigation/RootNavigator';
import { Image, Text, View } from 'react-native';
import { colors } from './src/theme/colors';

const stripeKey = (Constants.expoConfig?.extra?.stripePublishableKey as string) ?? '';

export default function App() {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    initI18n().finally(() => setReady(true));
  }, []);

  if (!ready) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.background, gap: 20 }}>
        <Image
          source={require('./src/assets/adaptive-icon.png')}
          style={{ width: 96, height: 96, borderRadius: 22 }}
          resizeMode="contain"
        />
        <Text style={{ color: colors.primary, fontSize: 26, fontWeight: '800', letterSpacing: -0.5 }}>
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
