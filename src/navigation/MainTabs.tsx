import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { useTranslation } from 'react-i18next';
import { House, LayoutGrid, ShoppingBag, Mail, CircleUser } from 'lucide-react-native';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated';
import { useHaptic } from '../hooks/useHaptic';

import { HomeScreen } from '../screens/Home/HomeScreen';
import { CatalogueScreen } from '../screens/Catalogue/CatalogueScreen';
import { CartScreen } from '../screens/Cart/CartScreen';
import { ProfileScreen } from '../screens/Profile/ProfileScreen';
import { ContactScreen } from '../screens/Contact/ContactScreen';

import { colors } from '../theme/colors';
import { useCart } from '../context/CartContext';
import type { TabsParams } from './types';

const Tab = createBottomTabNavigator<TabsParams>();

interface TabButtonProps {
  focused: boolean;
  icon: React.ReactNode;
  label: string;
  onPress: () => void;
}

function TabButton({ focused, icon, label, onPress }: TabButtonProps) {
  const { light } = useHaptic();
  const scale = useSharedValue(1);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePress = () => {
    light();
    scale.value = withSpring(0.88, { damping: 20, stiffness: 400 });
    setTimeout(() => {
      scale.value = withSpring(1, { damping: 18, stiffness: 280 });
    }, 110);
    onPress();
  };

  return (
    <Pressable
      onPress={handlePress}
      style={s.tabItem}
      accessibilityRole="button"
      accessibilityState={{ selected: focused }}
      accessibilityLabel={label}
    >
      {/* Indicateur actif - pill en haut */}
      <View style={[s.pill, focused && s.pillActive]} />

      <Animated.View style={[s.iconWrap, animStyle]}>
        {icon}
      </Animated.View>

      <Text style={[s.tabLabel, focused && s.tabLabelActive]} numberOfLines={1}>
        {label}
      </Text>
    </Pressable>
  );
}

function CartBadge({ count }: { count: number }) {
  if (count === 0) return null;
  return (
    <View style={s.badge}>
      <Text style={s.badgeText}>{count}</Text>
    </View>
  );
}

function DockTabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();
  const { count } = useCart();

  return (
    <View style={[s.dockOuter, { paddingBottom: Math.max(insets.bottom, 8) + 4 }]}>
      <View style={s.dockInner}>
        {state.routes.map((route, index) => {
          const { options } = descriptors[route.key];
          const focused = state.index === index;

          const onPress = () => {
            const event = navigation.emit({
              type: 'tabPress',
              target: route.key,
              canPreventDefault: true,
            });
            if (!focused && !event.defaultPrevented) {
              navigation.navigate(route.name as never);
            }
          };

          const activeColor   = colors.primary;
          const inactiveColor = 'rgba(255,255,255,0.30)';
          const color  = focused ? activeColor : inactiveColor;
          const stroke = focused ? 2.0 : 1.6;
          const size   = 22;

          const icon = (() => {
            switch (route.name) {
              case 'Home':
                return <House color={color} size={size} strokeWidth={stroke} />;
              case 'Catalog':
                return <LayoutGrid color={color} size={size} strokeWidth={stroke} />;
              case 'Cart':
                return (
                  <View>
                    <ShoppingBag color={color} size={size} strokeWidth={stroke} />
                    <CartBadge count={count} />
                  </View>
                );
              case 'Contact':
                return <Mail color={color} size={size} strokeWidth={stroke} />;
              case 'Profile':
                return <CircleUser color={color} size={size} strokeWidth={stroke} />;
              default:
                return null;
            }
          })();

          const label = String(options.title ?? route.name);

          return (
            <TabButton
              key={route.key}
              focused={focused}
              icon={icon}
              label={label}
              onPress={onPress}
            />
          );
        })}
      </View>
    </View>
  );
}

export function MainTabs() {
  const { t } = useTranslation();

  return (
    <Tab.Navigator
      tabBar={(props) => <DockTabBar {...props} />}
      screenOptions={{ headerShown: false, tabBarHideOnKeyboard: true }}
    >
      <Tab.Screen name="Home"    component={HomeScreen}      options={{ title: t('nav.home') }} />
      <Tab.Screen name="Catalog" component={CatalogueScreen} options={{ title: t('nav.catalog') }} />
      <Tab.Screen name="Cart"    component={CartScreen}      options={{ title: t('nav.cart') }} />
      <Tab.Screen name="Contact" component={ContactScreen}   options={{ title: t('nav.contact') }} />
      <Tab.Screen name="Profile" component={ProfileScreen}   options={{ title: t('nav.profile') }} />
    </Tab.Navigator>
  );
}

const s = StyleSheet.create({
  dockOuter: {
    paddingHorizontal: 16,
    paddingTop: 10,
    backgroundColor: colors.background,
  },

  dockInner: {
    flexDirection: 'row',
    backgroundColor: 'rgba(16, 16, 20, 0.97)',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.07)',
    paddingHorizontal: 4,
    shadowColor: '#000',
    shadowOpacity: 0.6,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 8 },
    elevation: 18,
  },

  tabItem: {
    flex: 1,
    alignItems: 'center',
    paddingBottom: 8,
  },

  // Pill actif en haut du tab item
  pill: {
    width: 24,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: 'transparent',
    marginBottom: 7,
  },
  pillActive: {
    backgroundColor: colors.primary,
  },

  iconWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },

  tabLabel: {
    fontSize: 10,
    fontWeight: '500',
    color: 'rgba(255,255,255,0.28)',
    letterSpacing: 0.1,
  },
  tabLabelActive: {
    color: colors.primary,
    fontWeight: '700',
  },

  // Badge panier
  badge: {
    position: 'absolute',
    top: -4,
    right: -8,
    backgroundColor: colors.primary,
    borderRadius: 10,
    minWidth: 16,
    height: 16,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
  },
  badgeText: { color: '#fff', fontSize: 9, fontWeight: '800' },
});
