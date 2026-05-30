import React, { useEffect, useRef, useState } from 'react';
import {
  Animated, Image, Pressable, ScrollView, StyleSheet, Text,
  useWindowDimensions, View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import {
  Shield, Activity, Clock, Database,
  ArrowRight, Zap, Eye, Lock, ChevronRight,
} from 'lucide-react-native';

import { SkeletonCard } from '../../components/ui/Skeleton';
import { ServiceCard } from '../../components/shared/ServiceCard';
import { FadeInView } from '../../components/ui/FadeInView';
import { homeApi, type CarouselSlide } from '../../api/home';
import type { Category, Service } from '../../api/services';
import { colors, radius, shadows } from '../../theme/colors';

// Slides — matched by title keywords (imagePath from API is a backend URL unusable in mobile)
const SLIDE_ENTRIES: Array<{ keywords: string[]; image: any }> = [
  {
    keywords: ['xdr', 'unifi', 'détect', 'detect', 'protection'],
    image: require('../../assets/slide_xdr.png'),
  },
  {
    keywords: ['zero trust', 'trust', 'identit', 'accès', 'acces', 'vérif'],
    image: require('../../assets/slide_zerotrust.png'),
  },
  {
    keywords: ['48', 'déploi', 'deploy', 'rapide', 'infra', 'opérationnel'],
    image: require('../../assets/slide_deploy48h.png'),
  },
];

function resolveSlideImage(slide: CarouselSlide): any | null {
  const text = `${slide.title} ${slide.subtitle ?? ''}`.toLowerCase();
  for (const entry of SLIDE_ENTRIES) {
    if (entry.keywords.some((k) => text.includes(k))) return entry.image;
  }
  return null;
}

// Categories — matched by slug keywords
const CAT_IMAGES: Record<string, any> = {
  edr:     require('../../assets/edr.jpg'),
  xdr:     require('../../assets/xdr.jpg'),
  soc:     require('../../assets/soc.jpg'),
  cloud:   require('../../assets/cloud.jpg'),
  network: require('../../assets/network.jpg'),
  iam:     require('../../assets/iam.jpg'),
  data:    require('../../assets/data.jpg'),
  support: require('../../assets/support.jpg'),
};

function resolveCatImage(cat: Category): any | null {
  const hay = `${cat.slug ?? ''} ${cat.name ?? ''}`.toLowerCase();
  for (const key of Object.keys(CAT_IMAGES)) {
    if (hay.includes(key)) return CAT_IMAGES[key];
  }
  return null;
}

const STATS = [
  { icon: Shield, value: '500+', label: 'Clients' },
  { icon: Activity, value: '99,9%', label: 'Disponibilité' },
  { icon: Clock, value: '14s', label: 'MTTD moyen' },
  { icon: Database, value: '3,2 Md', label: 'Événements/j' },
];

const CAPS = [
  { icon: Zap,      title: 'Détection IA',     desc: 'Comportementale · 99,4% précision' },
  { icon: Eye,      title: 'XDR unifié',        desc: '6 surfaces, un seul agent' },
  { icon: Lock,     title: 'En 48h',            desc: 'Déploiement pris en charge' },
  { icon: Shield,   title: 'Sans engagement',   desc: 'POC 30 jours offert' },
];

// Animated hero background

function HeroBackground() {
  const pulse = useRef(new Animated.Value(0)).current;
  const drift = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1, duration: 3200, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 0, duration: 3200, useNativeDriver: true }),
      ])
    ).start();
    Animated.loop(
      Animated.sequence([
        Animated.timing(drift, { toValue: 1, duration: 5000, useNativeDriver: true }),
        Animated.timing(drift, { toValue: 0, duration: 5000, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  const scale = pulse.interpolate({ inputRange: [0, 1], outputRange: [1, 1.18] });
  const scaleB = pulse.interpolate({ inputRange: [0, 1], outputRange: [1.1, 0.92] });
  const opacity = pulse.interpolate({ inputRange: [0, 1], outputRange: [0.55, 0.85] });
  const translateY = drift.interpolate({ inputRange: [0, 1], outputRange: [0, -16] });

  return (
    <>
      <LinearGradient
        colors={['rgba(59,130,246,0.22)', 'rgba(59,130,246,0.05)', colors.background]}
        locations={[0, 0.55, 1]}
        style={StyleSheet.absoluteFill}
      />
      <Animated.View style={[s.orbLarge, { transform: [{ scale }, { translateY }], opacity }]} />
      <Animated.View style={[s.orbSmall, { transform: [{ scale: scaleB }] }]} />
      <Animated.View style={[s.orbAccent, { transform: [{ scale: scaleB }, { translateY }] }]} />
    </>
  );
}

// Carousel

function Carousel({
  slides,
  onCtaPress,
}: {
  slides: CarouselSlide[];
  onCtaPress: (slide: CarouselSlide) => void;
}) {
  const { width } = useWindowDimensions();
  const [current, setCurrent] = useState(0);
  const scrollRef = useRef<ScrollView>(null);
  const itemW = width - 48;
  const gap = 12;

  // Auto-advance every 4 s
  useEffect(() => {
    if (slides.length <= 1) return;
    const id = setInterval(() => {
      setCurrent((prev) => {
        const next = (prev + 1) % slides.length;
        scrollRef.current?.scrollTo({ x: next * (itemW + gap), animated: true });
        return next;
      });
    }, 4000);
    return () => clearInterval(id);
  }, [slides.length, itemW, gap]);

  return (
    <View style={{ gap: 10 }}>
      <ScrollView
        ref={scrollRef}
        horizontal
        snapToInterval={itemW + gap}
        snapToAlignment="start"
        decelerationRate="fast"
        showsHorizontalScrollIndicator={false}
        scrollEventThrottle={16}
        contentContainerStyle={{ paddingHorizontal: 20, gap }}
        onMomentumScrollEnd={(e) =>
          setCurrent(Math.round(e.nativeEvent.contentOffset.x / (itemW + gap)))
        }
      >
        {slides.map((slide) => {
          const localImg = resolveSlideImage(slide);
          return (
            <View key={slide.id} style={[s.slide, { width: itemW }]}>
              {localImg ? (
                <Image source={localImg} style={StyleSheet.absoluteFill} resizeMode="cover" />
              ) : (
                <LinearGradient
                  colors={[colors.primaryDark, '#0D1B3E']}
                  style={StyleSheet.absoluteFill}
                />
              )}
              <LinearGradient
                colors={['transparent', 'rgba(0,0,0,0.62)']}
                locations={[0.28, 1]}
                style={[StyleSheet.absoluteFill, s.slideGrad]}
              >
                <Text style={s.slideTitle}>{slide.title}</Text>
                {slide.subtitle ? <Text style={s.slideSub}>{slide.subtitle}</Text> : null}
                {slide.ctaLabel ? (
                  <Pressable
                    style={({ pressed }) => [s.slideCta, pressed && { opacity: 0.75 }]}
                    onPress={() => onCtaPress(slide)}
                  >
                    <Text style={s.slideCtaText}>{slide.ctaLabel}</Text>
                    <ArrowRight color="#fff" size={12} />
                  </Pressable>
                ) : null}
              </LinearGradient>
            </View>
          );
        })}
      </ScrollView>
      {slides.length > 1 && (
        <View style={s.dots}>
          {slides.map((_, i) => (
            <View key={i} style={[s.dot, i === current && s.dotActive]} />
          ))}
        </View>
      )}
    </View>
  );
}

// Section header

function SectionHead({
  eyebrow, title, onMore,
}: { eyebrow: string; title: string; onMore?: () => void }) {
  return (
    <View style={s.sectionHead}>
      <Text style={s.eyebrow}>{eyebrow}</Text>
      <View style={s.sectionRow}>
        <Text style={s.sectionTitle}>{title}</Text>
        {onMore && (
          <Pressable onPress={onMore} style={s.seeAllBtn} hitSlop={10}>
            <Text style={s.seeAll}>Tout voir</Text>
            <ChevronRight color={colors.primary} size={14} />
          </Pressable>
        )}
      </View>
    </View>
  );
}

// Main screen

export function HomeScreen() {
  const { t } = useTranslation();
  const nav = useNavigation<any>();
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();

  const [slides, setSlides] = useState<CarouselSlide[]>([]);
  const [cats, setCats] = useState<Category[]>([]);
  const [top, setTop] = useState<Service[]>([]);
  const [topLoading, setTopLoading] = useState(true);

  const handleCtaPress = (slide: CarouselSlide) => {
    const url = slide.ctaUrl ?? '';
    const serviceMatch = url.match(/services\/(\d+)/);
    if (serviceMatch) {
      nav.navigate('ServiceDetails', { id: Number(serviceMatch[1]) });
    } else if (url.includes('register') || url.includes('poc') || url.includes('trial')) {
      nav.navigate('Register');
    } else {
      nav.navigate('Catalog');
    }
  };

  useEffect(() => {
    homeApi.getCarousel().then(setSlides).catch(() => {});
    homeApi.getCategories().then(setCats).catch(() => {});
    homeApi.getTopProducts()
      .then(setTop).catch(() => {}).finally(() => setTopLoading(false));
  }, []);

  const capW = (width - 52) / 2;

  return (
    <ScrollView
      style={s.scroll}
      contentContainerStyle={s.content}
      showsVerticalScrollIndicator={false}
    >
      <FadeInView delay={0}>
      {/* HERO */}
      <View style={[s.heroWrapper, { paddingTop: insets.top + 8 }]}>
        <HeroBackground />

        <View style={s.hero}>
          {/* Logo + brand */}
          <View style={s.brandRow}>
            <Image
              source={require('../../assets/icon.png')}
              style={s.brandLogo}
              resizeMode="contain"
            />
            <Text style={s.brandName}>CynaSecure</Text>
          </View>

          <Text style={s.heroTitle}>{t('home.tagline')}</Text>
          <Text style={s.heroSub}>{t('home.subtitle')}</Text>

          <View style={s.heroActions}>
            <Pressable
              style={({ pressed }) => [s.btnPrimary, pressed && s.btnPressed]}
              onPress={() => nav.navigate('Register')}
            >
              <Text style={s.btnPrimaryText}>{t('home.trial')}</Text>
              <ArrowRight color="#fff" size={16} />
            </Pressable>
            <Pressable
              style={({ pressed }) => [s.btnGhost, pressed && { opacity: 0.7 }]}
              onPress={() => nav.navigate('Catalog')}
            >
              <Text style={s.btnGhostText}>{t('home.explore')}</Text>
            </Pressable>
          </View>
        </View>
      </View>

      {/* STATS SCROLL */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={s.statsRow}
      >
        {STATS.map((stat) => (
          <View key={stat.label} style={s.statPill}>
            <stat.icon color={colors.primary} size={15} />
            <View style={s.statTexts}>
              <Text style={s.statValue}>{stat.value}</Text>
              <Text style={s.statLabel}>{stat.label}</Text>
            </View>
          </View>
        ))}
      </ScrollView>

      {/* CAROUSEL */}
      {slides.length > 0 && <Carousel slides={slides} onCtaPress={handleCtaPress} />}

      {/* CAPABILITIES */}
      <View style={s.section}>
        <SectionHead eyebrow="POURQUOI CYNASECURE" title={'Six capacités,\nun seul agent'} />
        <View style={s.capsGrid}>
          {CAPS.map((cap) => (
            <View key={cap.title} style={[s.capCard, { width: capW }]}>
              <View style={s.capIconBg}>
                <cap.icon color={colors.primary} size={18} />
              </View>
              <Text style={s.capTitle}>{cap.title}</Text>
              <Text style={s.capDesc}>{cap.desc}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* CATÉGORIES */}
      {cats.length > 0 && (
        <View style={s.sectionNoH}>
          <View style={s.sectionPad}>
            <SectionHead
              eyebrow="DOMAINES DE SÉCURITÉ"
              title="Nos spécialités"
              onMore={() => nav.navigate('Catalog')}
            />
          </View>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={s.catRow}
          >
            {cats.map((cat) => {
              const catImg = resolveCatImage(cat);
              return (
                <Pressable
                  key={cat.slug}
                  style={({ pressed }) => [s.catCard, pressed && { opacity: 0.85 }]}
                  onPress={() => nav.navigate('Catalog')}
                >
                  {catImg ? (
                    <Image
                      source={catImg}
                      style={StyleSheet.absoluteFill}
                      resizeMode="cover"
                    />
                  ) : (
                    <LinearGradient
                      colors={['#1E3A6E', '#0D1B3E']}
                      style={[StyleSheet.absoluteFill, { alignItems: 'center', justifyContent: 'center' }]}
                    >
                      <Shield color={colors.primary} size={28} strokeWidth={1.5} />
                    </LinearGradient>
                  )}
                  <LinearGradient
                    colors={['transparent', 'rgba(0,0,0,0.65)']}
                    locations={[0.4, 1]}
                    style={[StyleSheet.absoluteFill, s.catOverlay]}
                  >
                    <Text style={s.catName} numberOfLines={2}>{cat.name}</Text>
                    <Text style={s.catCount}>{cat.count} service{cat.count !== 1 ? 's' : ''}</Text>
                  </LinearGradient>
                </Pressable>
              );
            })}
          </ScrollView>
        </View>
      )}

      {/* TOP PRODUITS */}
      <View style={s.section}>
        <SectionHead
          eyebrow="SOLUTIONS PHARES"
          title={t('home.topProducts')}
          onMore={() => nav.navigate('Catalog')}
        />
        {topLoading ? (
          <View style={{ gap: 12 }}>
            <SkeletonCard />
            <SkeletonCard />
          </View>
        ) : top.length > 0 ? (
          <View style={{ gap: 12 }}>
            {top.map((svc) => (
              <ServiceCard
                key={svc.id}
                service={svc}
                onPress={() => nav.navigate('ServiceDetails', { id: svc.id })}
              />
            ))}
          </View>
        ) : null}
      </View>

      {/* BANNIÈRE FINALE */}
      <View style={s.section}>
        <LinearGradient
          colors={['#1D4ED8', '#2563EB', '#3B82F6']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={s.ctaBanner}
        >
          <View style={s.ctaOrb} />
          <Text style={s.ctaEyebrow}>SANS ENGAGEMENT</Text>
          <Text style={s.ctaTitle}>Évaluez la plateforme{'\n'}sur votre infrastructure</Text>
          <Text style={s.ctaText}>POC de 30 jours · Déploiement pris en charge</Text>
          <Pressable
            style={({ pressed }) => [s.ctaBtn, pressed && { opacity: 0.9 }]}
            onPress={() => nav.navigate('Register')}
          >
            <Text style={s.ctaBtnText}>{t('home.trial')}</Text>
            <ArrowRight color={colors.primary} size={16} />
          </Pressable>
        </LinearGradient>
      </View>

      </FadeInView>
    </ScrollView>
  );
}

// Styles

const s = StyleSheet.create({
  scroll: { backgroundColor: colors.background },
  content: { paddingBottom: 56 },

  // Hero
  heroWrapper: {
    overflow: 'hidden',
    paddingTop: 4,
    paddingBottom: 48,
  },
  orbLarge: {
    position: 'absolute',
    top: -80,
    right: -60,
    width: 300,
    height: 300,
    borderRadius: 150,
    backgroundColor: 'rgba(59,130,246,0.12)',
  },
  orbSmall: {
    position: 'absolute',
    top: 60,
    left: -80,
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: 'rgba(59,130,246,0.07)',
  },
  orbAccent: {
    position: 'absolute',
    bottom: -30,
    right: 40,
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(99,102,241,0.08)',
  },
  hero: {
    paddingHorizontal: 20,
    gap: 16,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 4,
  },
  brandLogo: {
    width: 34,
    height: 34,
    borderRadius: 8,
  },
  brandName: {
    color: colors.text,
    fontSize: 20,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  heroTitle: {
    color: colors.text,
    fontSize: 46,
    fontWeight: '900',
    lineHeight: 52,
    letterSpacing: -1.5,
  },
  heroSub: {
    color: colors.textMuted,
    fontSize: 16,
    lineHeight: 24,
  },
  heroActions: {
    flexDirection: 'column',
    gap: 12,
    marginTop: 12,
  },
  btnPrimary: {
    height: 60,
    backgroundColor: colors.primary,
    borderRadius: radius.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    ...shadows.button,
  },
  btnPrimaryText: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  btnGhost: {
    height: 54,
    borderWidth: 1.5,
    borderColor: colors.borderStrong,
    borderRadius: radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnGhostText: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '600',
  },
  btnPressed: {
    opacity: 0.82,
    transform: [{ scale: 0.98 }],
  },

  // Stats
  statsRow: {
    paddingHorizontal: 20,
    gap: 10,
    paddingVertical: 4,
  },
  statPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.full,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  statTexts: { gap: 1 },
  statValue: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '800',
  },
  statLabel: {
    color: colors.textMuted,
    fontSize: 10,
    fontWeight: '500',
  },

  // Carousel
  slide: {
    height: 260,
    borderRadius: radius.xl,
    overflow: 'hidden',
    backgroundColor: colors.surfaceHigh,
  },
  slideGrad: {
    justifyContent: 'flex-end',
    padding: 20,
    gap: 5,
  },
  slideTitle: { color: '#fff', fontSize: 19, fontWeight: '800', lineHeight: 24 },
  slideSub: { color: 'rgba(255,255,255,0.82)', fontSize: 13, lineHeight: 18 },
  slideCta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 8,
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255,255,255,0.15)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: radius.full,
  },
  slideCtaText: { color: '#fff', fontSize: 12, fontWeight: '600' },
  dots: { flexDirection: 'row', justifyContent: 'center', gap: 5 },
  dot: { width: 5, height: 5, borderRadius: 3, backgroundColor: colors.borderStrong },
  dotActive: { backgroundColor: colors.primary, width: 16 },

  // Sections
  section: {
    paddingHorizontal: 20,
    gap: 16,
    marginTop: 36,
  },
  sectionNoH: { gap: 16, marginTop: 36 },
  sectionPad: { paddingHorizontal: 20 },
  sectionHead: { gap: 4 },
  eyebrow: {
    color: colors.primary,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  },
  sectionTitle: {
    color: colors.text,
    fontSize: 24,
    fontWeight: '800',
    letterSpacing: -0.5,
    flex: 1,
  },
  sectionRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    gap: 8,
  },
  seeAllBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    paddingBottom: 2,
  },
  seeAll: {
    color: colors.primary,
    fontSize: 13,
    fontWeight: '600',
  },

  // Capabilities grid
  capsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  capCard: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    padding: 16,
    gap: 10,
  },
  capIconBg: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: 'rgba(59,130,246,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  capTitle: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '700',
  },
  capDesc: {
    color: colors.textMuted,
    fontSize: 12,
    lineHeight: 17,
  },

  // Categories
  catRow: {
    paddingHorizontal: 20,
    gap: 12,
  },
  catCard: {
    width: 165,
    height: 210,
    borderRadius: radius.lg,
    overflow: 'hidden',
    backgroundColor: colors.surfaceHigh,
  },
  catOverlay: {
    justifyContent: 'flex-end',
    padding: 14,
    gap: 4,
  },
  catName: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '700',
    lineHeight: 19,
  },
  catCount: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 12,
  },

  // Final CTA
  ctaBanner: {
    borderRadius: radius.xl,
    padding: 24,
    gap: 10,
    overflow: 'hidden',
  },
  ctaOrb: {
    position: 'absolute',
    top: -40,
    right: -40,
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  ctaEyebrow: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.5,
  },
  ctaTitle: {
    color: '#fff',
    fontSize: 22,
    fontWeight: '900',
    lineHeight: 28,
    letterSpacing: -0.5,
  },
  ctaText: {
    color: 'rgba(255,255,255,0.75)',
    fontSize: 13,
    lineHeight: 18,
  },
  ctaBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    alignSelf: 'flex-start',
    backgroundColor: '#fff',
    borderRadius: radius.full,
    paddingHorizontal: 20,
    paddingVertical: 12,
    marginTop: 6,
  },
  ctaBtnText: {
    color: colors.primary,
    fontSize: 14,
    fontWeight: '700',
  },
});
