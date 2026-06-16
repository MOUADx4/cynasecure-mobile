import React, { useRef, useState, useEffect } from 'react';
import {
  Animated,
  Dimensions,
  FlatList,
  Image,
  Pressable,
  StyleSheet,
  Text,
  View,
  type ViewToken,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Shield, Eye, Lock, Zap, ArrowRight, ChevronRight } from 'lucide-react-native';
import { colors, radius } from '../../theme/colors';

const { width: W } = Dimensions.get('window');

/* Types */
type Slide = {
  id: string;
  eyebrow: string;
  title: string;
  subtitle: string;
  Icon: React.ElementType;
  accent: string;
  features?: string[];
};

type Props = {
  onComplete: (goTo?: 'login' | 'register') => void;
};

/* Slides data */
const SLIDES: Slide[] = [
  {
    id: '1',
    eyebrow: 'BIENVENUE',
    title: 'CynaSecure',
    subtitle:
      'La cybersécurité managée par des experts certifiés, disponibles 24h/24 et 7j/7.',
    Icon: Shield,
    accent: colors.primary,
  },
  {
    id: '2',
    eyebrow: 'DÉTECTION AVANCÉE',
    title: 'Protection\nen temps réel',
    subtitle:
      'Détecter et neutraliser les menaces avant qu\'elles impactent vos opérations.',
    Icon: Eye,
    accent: '#22D3EE',
    features: [
      'Endpoint Detection & Response',
      'Extended Detection & Response',
      'Security Operations Center',
    ],
  },
  {
    id: '3',
    eyebrow: 'CONFORMITÉ',
    title: 'Certifié &\nconforme',
    subtitle:
      'Vos données protégées selon les plus hauts standards de sécurité reconnus internationalement.',
    Icon: Lock,
    accent: '#10B981',
    features: ['ISO 27001', 'SOC 2 Type II', 'ANSSI · RGPD'],
  },
  {
    id: '4',
    eyebrow: 'C\'EST PARTI',
    title: 'Sécurisez votre\ninfrastructure',
    subtitle:
      'Rejoignez des centaines d\'entreprises qui font confiance à CynaSecure.',
    Icon: Zap,
    accent: colors.primary,
  },
];

/* Radar illustration */
function RadarIllustration({
  Icon,
  accent,
}: {
  Icon: React.ElementType;
  accent: string;
}) {
  const ring1 = useRef(new Animated.Value(0)).current;
  const ring2 = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.stagger(800, [
        Animated.sequence([
          Animated.timing(ring1, { toValue: 1, duration: 1800, useNativeDriver: true }),
          Animated.timing(ring1, { toValue: 0, duration: 0, useNativeDriver: true }),
        ]),
        Animated.sequence([
          Animated.timing(ring2, { toValue: 1, duration: 1800, useNativeDriver: true }),
          Animated.timing(ring2, { toValue: 0, duration: 0, useNativeDriver: true }),
        ]),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, []);

  const pulseStyle = (anim: Animated.Value) => ({
    ...StyleSheet.absoluteFillObject,
    borderRadius: 110,
    borderWidth: 1,
    borderColor: accent,
    opacity: anim.interpolate({
      inputRange: [0, 0.4, 1],
      outputRange: [0.55, 0.15, 0],
    }),
    transform: [
      {
        scale: anim.interpolate({
          inputRange: [0, 1],
          outputRange: [1, 1.9],
        }),
      },
    ],
  });

  return (
    <View style={il.wrap}>
      {/* Ambient glow */}
      <View style={[il.glow, { backgroundColor: accent + '16' }]} />

      {/* Static concentric rings */}
      <View style={[il.ring, il.r3, { borderColor: accent + '14' }]} />
      <View style={[il.ring, il.r2, { borderColor: accent + '22' }]} />
      <View style={[il.ring, il.r1, { borderColor: accent + '32' }]} />

      {/* Animated pulse rings */}
      <Animated.View style={pulseStyle(ring1)} />
      <Animated.View style={pulseStyle(ring2)} />

      {/* Central icon box */}
      <View style={[il.iconBox, { backgroundColor: accent + '1C', borderColor: accent + '50' }]}>
        <Icon color={accent} size={40} strokeWidth={1.3} />
      </View>
    </View>
  );
}

const il = StyleSheet.create({
  wrap: {
    width: 190,
    height: 190,
    alignItems: 'center',
    justifyContent: 'center',
  },
  glow: {
    position: 'absolute',
    width: 220,
    height: 220,
    borderRadius: 110,
  },
  ring: {
    position: 'absolute',
    borderWidth: 1,
    borderRadius: 110,
  },
  r3: { width: 180, height: 180 },
  r2: { width: 138, height: 138 },
  r1: { width: 104, height: 104 },
  iconBox: {
    width: 80,
    height: 80,
    borderRadius: 24,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

/* Single slide */
function SlideItem({ slide }: { slide: Slide }) {
  return (
    <View style={[s.slide, { width: W }]}>
      <RadarIllustration Icon={slide.Icon} accent={slide.accent} />

      <View style={s.textBlock}>
        <Text style={[s.eyebrow, { color: slide.accent }]}>{slide.eyebrow}</Text>
        <Text style={s.title}>{slide.title}</Text>
        <Text style={s.subtitle}>{slide.subtitle}</Text>

        {slide.features && (
          <View style={s.featureList}>
            {slide.features.map((f) => (
              <View
                key={f}
                style={[s.featureRow, { borderColor: slide.accent + '28' }]}
              >
                <View style={[s.featureDot, { backgroundColor: slide.accent }]} />
                <Text style={[s.featureText, { color: slide.accent + 'CC' }]}>{f}</Text>
              </View>
            ))}
          </View>
        )}
      </View>
    </View>
  );
}

/* Dot indicator */
function Dots({ current }: { current: number }) {
  return (
    <View style={s.dots}>
      {SLIDES.map((_, i) => (
        <View
          key={i}
          style={[
            s.dot,
            {
              width: i === current ? 24 : 6,
              backgroundColor:
                i === current ? colors.primary : 'rgba(255,255,255,0.16)',
            },
          ]}
        />
      ))}
    </View>
  );
}

/* Main component */
export function OnboardingScreen({ onComplete }: Props) {
  const insets = useSafeAreaInsets();
  const listRef = useRef<FlatList>(null);
  const [currentIndex, setCurrentIndex] = useState(0);

  const isLast = currentIndex === SLIDES.length - 1;

  const onViewableItemsChanged = useRef(
    ({ viewableItems }: { viewableItems: ViewToken[] }) => {
      const idx = viewableItems[0]?.index;
      if (idx !== null && idx !== undefined) setCurrentIndex(idx);
    }
  ).current;

  const goNext = () => {
    if (isLast) { onComplete(); return; }
    listRef.current?.scrollToIndex({ index: currentIndex + 1, animated: true });
  };

  return (
    <View style={[s.container, { paddingTop: insets.top }]}>
      {/* Background */}
      <LinearGradient
        colors={['#0D0D1C', colors.background]}
        style={StyleSheet.absoluteFill}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
      />

      {/* Top bar */}
      <View style={s.topBar}>
        <View style={s.logoRow}>
          <Image
            source={require('../../assets/adaptive-icon.png')}
            style={s.logoImg}
            resizeMode="contain"
          />
          <Text style={s.logoText}>CynaSecure</Text>
        </View>

        {!isLast && (
          <Pressable onPress={() => onComplete()} hitSlop={14} style={s.skipBtn}>
            <Text style={s.skipText}>Ignorer</Text>
          </Pressable>
        )}
      </View>

      {/* Slides list */}
      <FlatList
        ref={listRef}
        data={SLIDES}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <SlideItem slide={item} />}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        scrollEventThrottle={16}
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={{ itemVisiblePercentThreshold: 50 }}
        style={s.list}
      />

      {/* Bottom controls */}
      <View style={[s.bottom, { paddingBottom: Math.max(insets.bottom, 20) + 16 }]}>
        <Dots current={currentIndex} />

        {isLast ? (
          /* Last slide - auth CTAs */
          <View style={s.ctaBlock}>
            <Pressable
              style={({ pressed }) => [s.primaryBtn, pressed && s.pressed]}
              onPress={() => onComplete('register')}
            >
              <Text style={s.primaryBtnText}>Créer un compte</Text>
              <ArrowRight color="#fff" size={18} />
            </Pressable>

            <Pressable
              style={({ pressed }) => [s.ghostBtn, pressed && { opacity: 0.6 }]}
              onPress={() => onComplete('login')}
            >
              <Text style={s.ghostBtnText}>J'ai déjà un compte</Text>
              <ChevronRight color={colors.textDim} size={15} />
            </Pressable>
          </View>
        ) : (
          /* Next button */
          <Pressable
            style={({ pressed }) => [s.nextBtn, pressed && { opacity: 0.82 }]}
            onPress={goNext}
          >
            <Text style={s.nextBtnText}>Suivant</Text>
            <ChevronRight color={colors.primary} size={20} />
          </Pressable>
        )}
      </View>
    </View>
  );
}

/* Styles */
const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },

  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 14,
  },
  logoRow: { flexDirection: 'row', alignItems: 'center', gap: 9 },
  logoImg: { width: 28, height: 28, borderRadius: 8 },
  logoText: {
    color: colors.text,
    fontSize: 17,
    fontWeight: '900',
    letterSpacing: -0.5,
  },
  skipBtn: { paddingHorizontal: 4, paddingVertical: 6 },
  skipText: { color: colors.textDim, fontSize: 14, fontWeight: '500' },

  list: { flex: 1 },

  /* Slide */
  slide: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 28,
    gap: 36,
  },
  textBlock: { alignItems: 'center', gap: 12 },
  eyebrow: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 2.2,
    textTransform: 'uppercase',
  },
  title: {
    color: colors.text,
    fontSize: 36,
    fontWeight: '900',
    letterSpacing: -1.2,
    textAlign: 'center',
    lineHeight: 42,
  },
  subtitle: {
    color: colors.textMuted,
    fontSize: 15,
    lineHeight: 24,
    textAlign: 'center',
    maxWidth: 300,
  },

  /* Feature tags */
  featureList: { gap: 8, marginTop: 6, alignSelf: 'stretch' },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderWidth: 1,
    borderRadius: radius.md,
    backgroundColor: 'rgba(255,255,255,0.02)',
  },
  featureDot: { width: 6, height: 6, borderRadius: 3 },
  featureText: { fontSize: 13, fontWeight: '600', letterSpacing: 0.2 },

  /* Bottom */
  bottom: { paddingHorizontal: 24, paddingTop: 24, gap: 22 },

  dots: {
    flexDirection: 'row',
    gap: 7,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dot: { height: 6, borderRadius: 3 },

  /* Next button */
  nextBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 16,
    borderWidth: 1,
    borderColor: colors.primary + '45',
    borderRadius: radius.lg,
    backgroundColor: colors.primary + '10',
  },
  nextBtnText: { color: colors.primary, fontSize: 16, fontWeight: '700' },

  /* Last slide CTAs */
  ctaBlock: { gap: 12 },
  primaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 17,
    backgroundColor: colors.primary,
    borderRadius: radius.lg,
    shadowColor: colors.primary,
    shadowOpacity: 0.45,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 7 },
    elevation: 10,
  },
  pressed: { opacity: 0.86, transform: [{ scale: 0.98 }] },
  primaryBtnText: { color: '#fff', fontSize: 16, fontWeight: '800' },
  ghostBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingVertical: 13,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    borderRadius: radius.lg,
  },
  ghostBtnText: { color: colors.textMuted, fontSize: 14, fontWeight: '500' },
});
