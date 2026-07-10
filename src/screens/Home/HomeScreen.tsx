import React, { useCallback, useEffect, useRef, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  Image, Pressable, ScrollView, StyleSheet, Text,
  useWindowDimensions, View, type ImageSourcePropType,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useVideoPlayer, VideoView } from 'expo-video';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, type CompositeNavigationProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import type { RootStackParams, TabsParams } from '../../navigation/types';

type HomeNavProp = CompositeNavigationProp<
  BottomTabNavigationProp<TabsParams, 'Home'>,
  NativeStackNavigationProp<RootStackParams>
>;
import { useTranslation } from 'react-i18next';
import Animated, {
  useSharedValue,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  withTiming,
  withDelay,
} from 'react-native-reanimated';
import {
  Activity, Clock, Database,
  ArrowRight, Zap, Eye, Lock, Shield, ChevronRight,
} from 'lucide-react-native';

import { SkeletonCard } from '../../components/ui/Skeleton';
import { ServiceCard } from '../../components/shared/ServiceCard';
import { ScrollReveal } from '../../components/ui/ScrollReveal';
import { CountUp } from '../../components/ui/CountUp';
import { homeApi, type CarouselSlide } from '../../api/home';
import type { Category, Service } from '../../api/services';
import { colors, radius, shadows } from '../../theme/colors';

// Data

const SLIDE_ENTRIES: Array<{ keywords: string[]; image: ImageSourcePropType }> = [
  { keywords: ['xdr', 'unifi', 'détect', 'detect', 'protection'], image: require('../../assets/slide_xdr.png') },
  { keywords: ['zero trust', 'trust', 'identit', 'accès', 'acces', 'vérif'], image: require('../../assets/slide_zerotrust.png') },
  { keywords: ['48', 'déploi', 'deploy', 'rapide', 'infra', 'opérationnel'], image: require('../../assets/slide_deploy48h.png') },
];

function resolveSlideImage(slide: CarouselSlide): ImageSourcePropType | null {
  const text = `${slide.title} ${slide.subtitle ?? ''}`.toLowerCase();
  for (const e of SLIDE_ENTRIES) {
    if (e.keywords.some((k) => text.includes(k))) return e.image;
  }
  return null;
}

const CAT_IMAGES: Record<string, ImageSourcePropType> = {
  edr: require('../../assets/edr.jpg'),
  xdr: require('../../assets/xdr.jpg'),
  soc: require('../../assets/soc.jpg'),
  cloud: require('../../assets/cloud.jpg'),
  network: require('../../assets/network.jpg'),
  iam: require('../../assets/iam.jpg'),
  data: require('../../assets/data.jpg'),
  support: require('../../assets/support.jpg'),
};

function resolveCatImage(cat: Category): ImageSourcePropType | null {
  const hay = `${cat.slug ?? ''} ${cat.name ?? ''}`.toLowerCase();
  for (const key of Object.keys(CAT_IMAGES)) {
    if (hay.includes(key)) return CAT_IMAGES[key];
  }
  return null;
}

const STATS = [
  { to: 500,  suffix: '+',   decimals: 0, label: 'Clients protégés' },
  { to: 99.9, suffix: '%',   decimals: 1, label: 'Disponibilité' },
  { to: 14,   suffix: 's',   decimals: 0, label: 'Temps de détection' },
  { to: 3.2,  suffix: ' Md', decimals: 1, label: 'Événements / jour' },
];

const CAPS = [
  { icon: Zap,    title: 'Détection IA',    desc: 'Comportementale · 99,4%' },
  { icon: Eye,    title: 'XDR unifié',      desc: '6 surfaces · 1 agent' },
  { icon: Lock,   title: 'Déploiement 48h', desc: 'Prise en charge incluse' },
  { icon: Shield, title: 'Sans engagement', desc: 'POC 30 jours offert' },
];

// Carousel

const SLIDE_GAP = 10;

function Carousel({ slides, width, onCtaPress }: {
  slides: CarouselSlide[];
  width: number;
  onCtaPress: (s: CarouselSlide) => void;
}) {
  const cardW = width - 48; // 20px padding each side + 8px peek du suivant
  const [current, setCurrent] = useState(0);
  const scrollRef = useRef<ScrollView>(null);

  useEffect(() => {
    if (slides.length <= 1) return;
    const id = setInterval(() => {
      setCurrent((prev) => {
        const next = (prev + 1) % slides.length;
        scrollRef.current?.scrollTo({ x: next * (cardW + SLIDE_GAP), animated: true });
        return next;
      });
    }, 4500);
    return () => clearInterval(id);
  }, [slides.length, cardW]);

  return (
    <View>
      <ScrollView
        ref={scrollRef}
        horizontal
        showsHorizontalScrollIndicator={false}
        snapToInterval={cardW + SLIDE_GAP}
        snapToAlignment="start"
        decelerationRate="fast"
        scrollEventThrottle={16}
        contentContainerStyle={{ paddingHorizontal: 20, gap: SLIDE_GAP }}
        onMomentumScrollEnd={(e) =>
          setCurrent(Math.round(e.nativeEvent.contentOffset.x / (cardW + SLIDE_GAP)))
        }
      >
        {slides.map((slide) => {
          const img = resolveSlideImage(slide);
          return (
            <View key={slide.id} style={[s.slide, { width: cardW }]}>
              {img
                ? <Image source={img} style={StyleSheet.absoluteFill} resizeMode="cover" />
                : <LinearGradient colors={['#0D1B3E', colors.primaryDark]} style={StyleSheet.absoluteFill} />
              }
              <LinearGradient
                colors={['transparent', 'rgba(0,0,0,0.7)']}
                locations={[0.4, 1]}
                style={[StyleSheet.absoluteFill, s.slideOverlay]}
              >
                <Text style={s.slideTitle}>{slide.title}</Text>
                {slide.subtitle ? <Text style={s.slideSub}>{slide.subtitle}</Text> : null}
                {slide.ctaLabel && (
                  <Pressable
                    style={({ pressed }) => [s.slideCta, pressed && { opacity: 0.8 }]}
                    onPress={() => onCtaPress(slide)}
                  >
                    <Text style={s.slideCtaText}>{slide.ctaLabel}</Text>
                    <ArrowRight color="#fff" size={12} />
                  </Pressable>
                )}
              </LinearGradient>
            </View>
          );
        })}
      </ScrollView>
      {slides.length > 1 && (
        <View style={s.slideIndicators}>
          {slides.map((_, i) => (
            <View key={i} style={[s.slideBar, i === current && s.slideBarActive]} />
          ))}
        </View>
      )}
    </View>
  );
}

// Section header

function SectionHead({ label, title, onMore }: { label: string; title: string; onMore?: () => void }) {
  return (
    <View style={s.sectionHead}>
      <View>
        <Text style={s.sectionLabel}>{label}</Text>
        <Text style={s.sectionTitle}>{title}</Text>
      </View>
      {onMore && (
        <Pressable onPress={onMore} hitSlop={12} style={s.seeAllBtn}>
          <Text style={s.seeAllText}>Tout voir</Text>
          <ChevronRight color={colors.primary} size={13} />
        </Pressable>
      )}
    </View>
  );
}

// Featured hero with video background

function FeaturedHero({
  onTrial,
  onExplore,
  insetTop,
  tagline,
  subtitle,
  trial,
}: {
  onTrial: () => void;
  onExplore: () => void;
  insetTop: number;
  tagline: string;
  subtitle: string;
  trial: string;
}) {
  const player = useVideoPlayer(require('../../assets/bg2.mp4'), (p) => {
    p.loop = true;
    p.muted = true;
    p.play();
  });

  return (
    <View style={s.featHero}>
      <VideoView
        player={player}
        style={StyleSheet.absoluteFill}
        contentFit="cover"
        nativeControls={false}
      />
      {/* Voile sombre très léger et uniforme sur toute la vidéo */}
      <View style={StyleSheet.absoluteFill} pointerEvents="none">
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.20)' }} />
      </View>
      {/* Gradient : sombre haut (logo) + sombre bas (texte) */}
      <LinearGradient
        colors={['rgba(0,0,0,0.68)', 'rgba(0,0,0,0.08)', 'rgba(0,0,0,0.08)', 'rgba(8,8,16,0.93)']}
        locations={[0, 0.28, 0.52, 1]}
        style={StyleSheet.absoluteFill}
      />

      {/* Logo + brand name - en haut dans la vidéo */}
      <View style={[s.featTopBar, { paddingTop: insetTop + 14 }]}>
        <Image source={require('../../assets/icon.png')} style={s.featLogo} resizeMode="contain" />
        <Text style={s.featBrand}>Cyna<Text style={s.featBrandAccent}>Secure</Text></Text>
      </View>

      {/* Contenu bas : texte + CTA + stats */}
      <View style={s.featBottom}>
        {/* Bloc texte */}
        <View style={s.featTextBlock}>
          <Text style={s.featEyebrow}>CYBERSECURITY SAAS</Text>
          <Text style={s.featTitle}>{tagline}</Text>
          <Text style={s.featSub} numberOfLines={2}>{subtitle}</Text>
        </View>

        {/* Boutons - même largeur, même alignement */}
        <View style={s.featBtns}>
          <Pressable
            style={({ pressed }) => [s.featBtn, pressed && { opacity: 0.88, transform: [{ scale: 0.98 }] }]}
            onPress={onTrial}
          >
            <Text style={s.featBtnText}>{trial}</Text>
            <ArrowRight color={colors.primaryDark} size={14} strokeWidth={2.5} />
          </Pressable>
          <Pressable
            style={({ pressed }) => [s.featLink, pressed && { opacity: 0.6 }]}
            onPress={onExplore}
          >
            <Text style={s.featLinkText}>Voir nos solutions</Text>
            <ArrowRight color="rgba(255,255,255,0.72)" size={13} strokeWidth={2} />
          </Pressable>
        </View>

        {/* Stats - dans la section vidéo, sur une ligne */}
        <View style={s.featStatsRow}>
          {STATS.map((stat, i) => (
            <React.Fragment key={stat.label}>
              {i > 0 && <View style={s.featStatDiv} />}
              <View style={s.featStatItem}>
                <CountUp
                  to={stat.to}
                  suffix={stat.suffix}
                  decimals={stat.decimals}
                  style={s.featStatVal}
                  startDelay={500 + i * 110}
                  duration={1200}
                />
                <Text style={s.featStatLabel}>{stat.label}</Text>
              </View>
            </React.Fragment>
          ))}
        </View>
      </View>
    </View>
  );
}

// Main screen

export function HomeScreen() {
  const { t } = useTranslation();
  const nav = useNavigation<HomeNavProp>();
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();

  const [slides, setSlides] = useState<CarouselSlide[]>([]);
  const [cats, setCats]     = useState<Category[]>([]);
  const [top, setTop]       = useState<Service[]>([]);
  const [topLoading, setTopLoading] = useState(true);

  // SWR helper: restore from AsyncStorage immediately, refresh from API in background
  const loadCached = useCallback(<T,>(key: string, setter: (v: T) => void, fetcher: () => Promise<T>, onDone?: () => void) => {
    AsyncStorage.getItem(key).then((raw) => {
      if (raw) { try { setter(JSON.parse(raw) as T); } catch {} }
    });
    fetcher()
      .then((data) => {
        setter(data);
        AsyncStorage.setItem(key, JSON.stringify(data)).catch(() => {});
      })
      .catch(() => {})
      .finally(() => onDone?.());
  }, []);

  const scrollY = useSharedValue(0);
  const scrollHandler = useAnimatedScrollHandler((e) => {
    scrollY.value = e.contentOffset.y;
  });

  // Staggered entrance for top sections
  const entryOpacity = useSharedValue(0);
  const entryY = useSharedValue(12);
  useEffect(() => {
    entryOpacity.value = withDelay(80, withTiming(1, { duration: 400 }));
    entryY.value = withDelay(80, withTiming(0, { duration: 400 }));
  }, []);
  const entryStyle = useAnimatedStyle(() => ({
    opacity: entryOpacity.value,
    transform: [{ translateY: entryY.value }],
  }));

  const handleCtaPress = (slide: CarouselSlide) => {
    const url = slide.ctaUrl ?? '';
    const m = url.match(/services\/(\d+)/);
    if (m) nav.navigate('ServiceDetails', { id: Number(m[1]) });
    else if (url.includes('register') || url.includes('poc') || url.includes('trial')) nav.navigate('Register');
    else nav.navigate('Catalog');
  };

  useEffect(() => {
    loadCached('@home_carousel', setSlides, homeApi.getCarousel);
    loadCached('@home_cats', setCats, homeApi.getCategories);
    loadCached('@home_top', setTop, homeApi.getTopProducts, () => setTopLoading(false));
  }, [loadCached]);

  return (
    <Animated.ScrollView
      style={s.root}
      contentContainerStyle={s.content}
      showsVerticalScrollIndicator={false}
      onScroll={scrollHandler}
      scrollEventThrottle={16}
    >
      {/* FEATURED HERO plein largeur (vidéo bg, logo, stats dedans) */}
      <Animated.View style={entryStyle}>
        <FeaturedHero
          onTrial={() => nav.navigate('Register')}
          onExplore={() => nav.navigate('Catalog')}
          insetTop={insets.top}
          tagline={t('home.tagline')}
          subtitle={t('home.subtitle')}
          trial={t('home.trial')}
        />
      </Animated.View>

      {/* CAROUSEL */}
      {slides.length > 0 && (
        <ScrollReveal scrollY={scrollY} delay={0} fromY={24} style={{ marginTop: 44 }}>
          <View style={s.sectionRow}>
            <SectionHead label="À LA UNE" title="Actualités" />
          </View>
          <View style={{ marginTop: 16 }}>
            <Carousel slides={slides} width={width} onCtaPress={handleCtaPress} />
          </View>
        </ScrollReveal>
      )}

      {/* CAPABILITIES */}
      <ScrollReveal scrollY={scrollY} delay={0} fromY={24} style={s.section}>
        <SectionHead label="POURQUOI CYNASECURE" title="Ce qui nous distingue" />
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={s.capsRow}
          style={{ marginTop: 16 }}
        >
          {CAPS.map((cap, i) => (
            <ScrollReveal key={cap.title} scrollY={scrollY} delay={i * 60} fromY={16}>
              <View style={s.capCard}>
                <View style={s.capIconWrap}>
                  <cap.icon color={colors.primary} size={18} strokeWidth={1.8} />
                </View>
                <Text style={s.capTitle}>{cap.title}</Text>
                <Text style={s.capDesc}>{cap.desc}</Text>
              </View>
            </ScrollReveal>
          ))}
        </ScrollView>
      </ScrollReveal>

      {/* CATEGORIES */}
      {cats.length > 0 && (
        <ScrollReveal scrollY={scrollY} delay={0} fromY={24} style={s.section}>
          <SectionHead label="DOMAINES" title="Nos spécialités" onMore={() => nav.navigate('Catalog')} />
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={s.catsRow}
            style={{ marginTop: 16 }}
          >
            {cats.map((cat, i) => {
              const img = resolveCatImage(cat);
              return (
                <ScrollReveal key={cat.slug} scrollY={scrollY} delay={i * 50} fromY={14}>
                  <Pressable
                    style={({ pressed }) => [s.catCard, pressed && { opacity: 0.82 }]}
                    onPress={() => nav.navigate('Catalog')}
                  >
                    {img
                      ? <Image source={img} style={StyleSheet.absoluteFill} resizeMode="cover" />
                      : (
                        <LinearGradient
                          colors={['#1A2B50', '#0D1B3E']}
                          style={[StyleSheet.absoluteFill, { alignItems: 'center', justifyContent: 'center' }]}
                        >
                          <Shield color={colors.primary} size={26} strokeWidth={1.5} />
                        </LinearGradient>
                      )
                    }
                    <LinearGradient
                      colors={['transparent', 'rgba(0,0,0,0.7)']}
                      locations={[0.35, 1]}
                      style={[StyleSheet.absoluteFill, s.catOverlay]}
                    >
                      <Text style={s.catName} numberOfLines={2}>{cat.name}</Text>
                      <Text style={s.catCount}>{cat.count} service{cat.count !== 1 ? 's' : ''}</Text>
                    </LinearGradient>
                  </Pressable>
                </ScrollReveal>
              );
            })}
          </ScrollView>
        </ScrollReveal>
      )}

      {/* TOP PRODUITS */}
      <ScrollReveal scrollY={scrollY} delay={0} fromY={24} style={s.section}>
        <SectionHead label="SOLUTIONS PHARES" title={t('home.topProducts')} onMore={() => nav.navigate('Catalog')} />
        <View style={{ marginTop: 16, gap: 12 }}>
          {topLoading ? (
            <>
              <SkeletonCard />
              <SkeletonCard />
            </>
          ) : top.map((svc, i) => (
            <ScrollReveal key={svc.id} scrollY={scrollY} delay={i * 80} fromY={16}>
              <ServiceCard
                service={svc}
                onPress={() => nav.navigate('ServiceDetails', { id: svc.id })}
              />
            </ScrollReveal>
          ))}
        </View>
      </ScrollReveal>

      {/* CTA BANNER */}
      <ScrollReveal scrollY={scrollY} delay={0} fromY={24} style={s.section}>
        <View style={s.ctaBanner}>
          <LinearGradient
            colors={['#1A3A8F', '#1E4BAD', '#2563EB']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={[StyleSheet.absoluteFill, { borderRadius: radius.xl }]}
          />
          <View style={s.bannerInner}>
            <Text style={s.bannerLabel}>SANS ENGAGEMENT</Text>
            <Text style={s.bannerTitle}>Prêt à sécuriser{'\n'}votre infrastructure ?</Text>
            <Text style={s.bannerSub}>POC de 30 jours · Déploiement pris en charge</Text>
            <Pressable
              style={({ pressed }) => [s.bannerBtn, pressed && { opacity: 0.9 }]}
              onPress={() => nav.navigate('Register')}
            >
              <Text style={s.bannerBtnText}>{t('home.trial')}</Text>
              <ArrowRight color={colors.primaryDark} size={14} strokeWidth={2.5} />
            </Pressable>
          </View>
        </View>
      </ScrollReveal>
    </Animated.ScrollView>
  );
}

// Styles

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  content: { paddingBottom: 90 },

  // Featured hero - pleine largeur, pas de bordure, pas de border-radius
  featHero: {
    minHeight: 600,
    backgroundColor: colors.surfaceHigh,
    justifyContent: 'space-between',
  },
  featTopBar: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    paddingHorizontal: 22,
  },
  featLogo: { width: 30, height: 30, borderRadius: 7 },
  featBrand: { color: '#fff', fontSize: 18, fontWeight: '800', letterSpacing: -0.3 },
  featBrandAccent: { color: colors.primary },
  featBottom: { paddingHorizontal: 22, paddingBottom: 0 },
  featTextBlock: { gap: 10, marginBottom: 32 },
  featEyebrow: {
    color: 'rgba(255,255,255,0.5)', fontSize: 9,
    fontWeight: '700', letterSpacing: 1.8, textTransform: 'uppercase',
  },
  featTitle: {
    color: '#fff', fontSize: 32,
    fontWeight: '900', lineHeight: 37, letterSpacing: -0.7,
  },
  featSub: { color: 'rgba(255,255,255,0.58)', fontSize: 13, lineHeight: 19 },

  // Boutons - même padding = même indentation = même taille visuelle
  featBtns: { gap: 12, marginBottom: 24, alignItems: 'flex-start' },
  featBtn: {
    flexDirection: 'row', alignItems: 'center',
    gap: 7, backgroundColor: '#fff',
    borderRadius: radius.full, paddingHorizontal: 20, paddingVertical: 13,
  },
  featBtnText: { color: colors.primaryDark, fontSize: 13, fontWeight: '700' },
  featLink: {
    flexDirection: 'row', alignItems: 'center', gap: 7,
    paddingHorizontal: 20, paddingVertical: 13,
  },
  featLinkText: { color: 'rgba(255,255,255,0.75)', fontSize: 13, fontWeight: '500' },

  // Stats row - à l'intérieur de la section vidéo
  featStatsRow: {
    flexDirection: 'row', alignItems: 'center',
    borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.1)',
    paddingVertical: 20,
  },
  featStatItem: { flex: 1, alignItems: 'center', gap: 3 },
  featStatDiv: { width: 1, height: 26, backgroundColor: 'rgba(255,255,255,0.12)' },
  featStatVal: { color: '#fff', fontSize: 17, fontWeight: '900', letterSpacing: -0.3 },
  featStatLabel: { color: 'rgba(255,255,255,0.45)', fontSize: 9, fontWeight: '500', textAlign: 'center' },

  // Carousel
  sectionRow: { paddingHorizontal: 20 },
  slide: { height: 270, borderRadius: radius.xl, overflow: 'hidden', backgroundColor: colors.surfaceHigh },
  slideOverlay: { justifyContent: 'flex-end', padding: 22, gap: 5 },
  slideTitle: { color: '#fff', fontSize: 21, fontWeight: '900', lineHeight: 26 },
  slideSub: { color: 'rgba(255,255,255,0.78)', fontSize: 13, lineHeight: 18 },
  slideCta: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    alignSelf: 'flex-start', marginTop: 6,
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: radius.full, paddingHorizontal: 12, paddingVertical: 6,
  },
  slideCtaText: { color: '#fff', fontSize: 12, fontWeight: '600' },
  slideIndicators: {
    flexDirection: 'row', justifyContent: 'center', gap: 4,
    paddingVertical: 10,
  },
  slideBar: { height: 3, width: 18, borderRadius: 2, backgroundColor: colors.borderStrong },
  slideBarActive: { width: 28, backgroundColor: colors.primary },

  // Sections
  section: { marginTop: 44, paddingHorizontal: 20 },
  sectionHead: {
    flexDirection: 'row', alignItems: 'flex-end',
    justifyContent: 'space-between',
  },
  sectionLabel: {
    color: colors.primary, fontSize: 10, fontWeight: '700',
    letterSpacing: 1.6, textTransform: 'uppercase',
  },
  sectionTitle: { color: colors.text, fontSize: 22, fontWeight: '800', letterSpacing: -0.3, marginTop: 4 },
  seeAllBtn: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  seeAllText: { color: colors.primary, fontSize: 13, fontWeight: '600' },

  // Capabilities - hauteur fixe identique pour toutes les cartes
  capsRow: { gap: 10, paddingRight: 4 },
  capCard: {
    width: 154, height: 148,
    backgroundColor: colors.surface,
    borderWidth: 1, borderColor: colors.border,
    borderRadius: radius.lg, padding: 16, gap: 10,
  },
  capIconWrap: {
    width: 38, height: 38, borderRadius: 10,
    backgroundColor: 'rgba(79,142,247,0.1)',
    alignItems: 'center', justifyContent: 'center',
  },
  capTitle: { color: colors.text, fontSize: 13, fontWeight: '700', lineHeight: 17 },
  capDesc: { color: colors.textMuted, fontSize: 11, lineHeight: 16 },

  // Categories
  catsRow: { gap: 10, paddingRight: 4 },
  catCard: { width: 148, height: 200, borderRadius: radius.lg, overflow: 'hidden', backgroundColor: colors.surfaceHigh },
  catOverlay: { justifyContent: 'flex-end', padding: 12, gap: 3 },
  catName: { color: '#fff', fontSize: 13, fontWeight: '700', lineHeight: 17 },
  catCount: { color: 'rgba(255,255,255,0.6)', fontSize: 11 },

  // CTA banner
  ctaBanner: {
    borderRadius: radius.xl, overflow: 'hidden',
    borderWidth: 1, borderColor: 'rgba(79,142,247,0.3)',
  },
  bannerInner: { padding: 24, gap: 10 },
  bannerLabel: {
    color: 'rgba(255,255,255,0.5)', fontSize: 10,
    fontWeight: '700', letterSpacing: 1.6,
  },
  bannerTitle: { color: '#fff', fontSize: 22, fontWeight: '900', lineHeight: 28, letterSpacing: -0.4 },
  bannerSub: { color: 'rgba(255,255,255,0.6)', fontSize: 13, lineHeight: 18 },
  bannerBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 7,
    alignSelf: 'flex-start', backgroundColor: '#fff',
    borderRadius: radius.full,
    paddingHorizontal: 20, paddingVertical: 11, marginTop: 4,
  },
  bannerBtnText: { color: colors.primaryDark, fontSize: 14, fontWeight: '700' },
});
