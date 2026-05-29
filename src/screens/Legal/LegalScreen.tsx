import React, { useEffect } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { colors, radius } from '../../theme/colors';
import type { RootScreen } from '../../navigation/types';

const PAGES = {
  cgu: {
    eyebrow: 'CONTRACTUEL',
    title: "Conditions Générales d'Utilisation",
    intro: "Les présentes conditions régissent l'utilisation de la plateforme CynaSecure.",
    sections: [
      { title: 'Objet', body: "La plateforme CynaSecure propose des services SaaS de cybersécurité destinés aux entreprises." },
      { title: 'Acceptation', body: "L'utilisation des services implique l'acceptation pleine et entière des présentes conditions." },
      { title: 'Compte utilisateur', body: "L'utilisateur s'engage à fournir des informations exactes lors de la création de son compte. Il est responsable de la confidentialité de ses identifiants." },
      { title: 'Abonnements', body: "Les abonnements sont souscrits pour une durée mensuelle ou annuelle. Ils sont renouvelés automatiquement sauf résiliation préalable." },
      { title: 'Paiements', body: "Les paiements sont traités par des prestataires certifiés PCI-DSS (Stripe et PayPal). Aucune donnée bancaire n'est stockée sur nos serveurs." },
      { title: 'Résiliation', body: "L'utilisateur peut résilier son abonnement à tout moment depuis son espace personnel. La résiliation prend effet à la fin de la période en cours." },
    ],
  },
  privacy: {
    eyebrow: 'DONNÉES PERSONNELLES',
    title: 'Politique de confidentialité',
    intro: "CynaSecure attache une importance particulière à la protection de vos données personnelles.",
    sections: [
      { title: 'Données collectées', body: "Nous collectons uniquement les données nécessaires à la fourniture du service : nom, prénom, e-mail, adresse de facturation." },
      { title: 'Finalités', body: "Vos données servent à gérer votre compte, traiter vos commandes, vous envoyer les communications transactionnelles." },
      { title: 'Conservation', body: "Les données sont conservées pendant la durée de la relation contractuelle et jusqu'à 3 ans après son terme à des fins légales." },
      { title: 'Droits RGPD', body: "Vous disposez d'un droit d'accès, de rectification, de suppression et de portabilité de vos données. Pour exercer ces droits, contactez-nous via le formulaire dédié." },
      { title: 'Sécurité', body: "Les mots de passe sont hachés en Argon2id. La double authentification TOTP est disponible. Les communications sont chiffrées en TLS." },
    ],
  },
  mentions: {
    eyebrow: 'LÉGAL',
    title: 'Mentions légales',
    intro: '',
    sections: [
      { title: 'Éditeur', body: "CynaSecure SAS au capital de 100 000 €\nSiège social : 75008 Paris, France\nRCS Paris 123 456 789\nN° TVA intracommunautaire : FR12345678900" },
      { title: 'Directeur de la publication', body: "Le représentant légal de la société CynaSecure SAS." },
      { title: 'Hébergement', body: "Plateforme hébergée en France sur infrastructure SecNumCloud." },
      { title: 'Contact', body: "contact@cynasecure.com" },
    ],
  },
  about: {
    eyebrow: 'NOTRE MISSION',
    title: 'À propos de CynaSecure',
    intro: "CynaSecure conçoit et exploite une plateforme XDR de nouvelle génération destinée aux organisations critiques.",
    sections: [
      { title: 'Mission', body: "Offrir aux entreprises une protection unifiée et opérationnelle en 48 heures, sans compromis sur la souveraineté des données." },
      { title: 'Couverture', body: "Notre solution couvre l'ensemble de la surface d'attaque : endpoints, réseau, cloud, identités." },
      { title: 'Technologie', body: "Moteur d'IA comportementale entraîné sur 10 ans d'attaques réelles et plus de 140 flux de renseignement sur les menaces." },
      { title: 'Certifications', body: "CynaSecure est certifié ISO 27001, SOC 2 Type II, ANSSI PRIS et HDS." },
    ],
  },
} as const;

type PageKey = keyof typeof PAGES;

export function LegalScreen({ route, navigation }: RootScreen<'Legal'>) {
  const page = route.params.page as PageKey;
  const content = PAGES[page];

  useEffect(() => {
    if (content) navigation.setOptions({ title: '' });
  }, []);

  if (!content) return null;

  return (
    <ScrollView style={st.scroll} contentContainerStyle={st.content} showsVerticalScrollIndicator={false}>
      <View style={st.header}>
        <Text style={st.eyebrow}>{content.eyebrow}</Text>
        <Text style={st.title}>{content.title}</Text>
        {content.intro ? <Text style={st.intro}>{content.intro}</Text> : null}
      </View>

      <View style={st.sections}>
        {content.sections.map((section, i) => (
          <View key={i} style={st.card}>
            <View style={st.cardHead}>
              <View style={st.numBadge}>
                <Text style={st.numText}>{String(i + 1).padStart(2, '0')}</Text>
              </View>
              <Text style={st.sectionTitle}>{section.title}</Text>
            </View>
            <Text style={st.sectionBody}>{section.body}</Text>
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

const st = StyleSheet.create({
  scroll: { backgroundColor: colors.background },
  content: { padding: 20, gap: 24, paddingBottom: 48 },

  header: { gap: 6, paddingBottom: 8 },
  eyebrow: {
    color: colors.primary,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  },
  title: {
    color: colors.text,
    fontSize: 28,
    fontWeight: '900',
    lineHeight: 34,
    letterSpacing: -0.5,
  },
  intro: {
    color: colors.textMuted,
    fontSize: 14,
    lineHeight: 21,
    marginTop: 4,
  },

  sections: { gap: 12 },

  card: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    padding: 18,
    gap: 12,
  },
  cardHead: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  numBadge: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: 'rgba(59,130,246,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(59,130,246,0.22)',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  numText: {
    color: colors.primary,
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  sectionTitle: {
    color: colors.text,
    fontSize: 15,
    fontWeight: '700',
    flex: 1,
  },
  sectionBody: {
    color: colors.textSecondary,
    fontSize: 14,
    lineHeight: 22,
  },
});
