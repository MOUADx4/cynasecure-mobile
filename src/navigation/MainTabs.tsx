import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { useTranslation } from 'react-i18next';
import { Home, Grid3x3, ShoppingCart, User, MessageCircle } from 'lucide-react-native';
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

// TabButton animé avec haptique

interface TabButtonProps {
  route: { key: string; name: string };
  focused: boolean;
  icon: React.ReactNode;
  label: string;
  onPress: () => void;
}

function TabButton({ focused, icon, label, onPress }: TabButtonProps) {
  const { light } = useHaptic();
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePress = () => {
    light();
    scale.value = withSpring(0.9, { damping: 20, stiffness: 400 });
    setTimeout(() => {
      scale.value = withSpring(1, { damping: 20, stiffness: 300 });
    }, 100);
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
      <Animated.View style={animatedStyle}>
        <View style={[s.iconFrame, focused && s.iconFrameActive]}>
          {focused && <View style={s.iconGlow} />}
          {icon}
        </View>
      </Animated.View>
      <Text style={[s.tabLabel, focused && s.tabLabelActive]} numberOfLines={1}>
        {label}
      </Text>
      {focused && <Animated.View style={s.activeIndicator} />}
    </Pressable>
  );
}

// Badge panier

function CartBadge({ count }: { count: number }) {
  if (count === 0) return null;
  return (
    <View style={s.badge}>
      <Text style={s.badgeText}>{count}</Text>
    </View>
  );
}

// Barre de navigation custom (style dock)

function DockTabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();
  const { count } = useCart();

  return (
    <View style={[s.dockOuter, { paddingBottom: Math.max(insets.bottom, 8) + 6 }]}>
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

          const icon = (() => {
            const color = focused ? colors.primary : colors.textDim;
            const size = 22;
            switch (route.name) {
              case 'Home':    return <Home    color={color} size={size} />;
              case 'Catalog': return <Grid3x3 color={color} size={size} />;
              case 'Cart':
                return (
                  <View>
                    <ShoppingCart color={color} size={size} />
                    <CartBadge count={count} />
                  </View>
                );
              case 'Contact': return <MessageCircle color={color} size={size} />;
              case 'Profile': return <User color={color} size={size} />;
              default:        return null;
            }
          })();

          const label = String(options.title ?? route.name);

          return (
            <TabButton
              key={route.key}
              route={route}
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

// Navigator

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

// Styles

const ICON_FRAME_W = 54;
const ICON_FRAME_H = 40;

const s = StyleSheet.create({
  // Wrapper en flow normal → réserve l'espace → le contenu ne passe pas dessous
  dockOuter: {
    paddingHorizontal: 20,
    paddingTop: 10,
    backgroundColor: colors.background,
  },

  // La barre flottante visuelle — style dock macOS
  dockInner: {
    flexDirection: 'row',
    backgroundColor: 'rgba(18, 18, 22, 0.96)',
    borderRadius: 28,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    paddingVertical: 8,
    paddingHorizontal: 6,
    // Ombre portée pour effet de profondeur / flottement
    shadowColor: '#000',
    shadowOpacity: 0.55,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 6 },
    elevation: 20,
  },

  // Un onglet
  tabItem: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
  },
  activeIndicator: {
    position: 'absolute',
    bottom: -4,
    left: '50%' as unknown as number,
    marginLeft: -2,
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.primary,
  },

  // Cadre autour de l'icône
  iconFrame: {
    width: ICON_FRAME_W,
    height: ICON_FRAME_H,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // État actif : cadre cristallisé
  iconFrameActive: {
    backgroundColor: 'rgba(59, 130, 246, 0.13)',
    borderWidth: 1,
    borderColor: 'rgba(59, 130, 246, 0.38)',
    // Lueur bleue subtile
    shadowColor: '#3B82F6',
    shadowOpacity: 0.35,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 0 },
  },

  // Halo interne (couche de brillance sur le cadre)
  iconGlow: {
    position: 'absolute',
    top: 1,
    left: 1,
    right: 1,
    height: '50%',
    borderTopLeftRadius: 13,
    borderTopRightRadius: 13,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
  },

  // Label
  tabLabel: {
    fontSize: 10,
    fontWeight: '500',
    color: colors.textDim,
    letterSpacing: 0.2,
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
    minWidth: 17,
    height: 17,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
  },
  badgeText: { color: '#fff', fontSize: 9, fontWeight: '800' },
});
