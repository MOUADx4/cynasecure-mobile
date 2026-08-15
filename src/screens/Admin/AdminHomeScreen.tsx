import React, { useEffect, useState, useCallback } from 'react';
import {
  Alert,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
  ActivityIndicator,
} from 'react-native';
import {
  ChevronUp,
  ChevronDown,
  ChevronRight,
  Plus,
  Pencil,
  Trash2,
  Eye,
  EyeOff,
  X,
  Check,
  LayoutList,
  FileText,
  Grid3x3,
  Star,
} from 'lucide-react-native';

import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import {
  adminHomeApi,
  type CarouselSlide,
  type HomeCategory,
  type HomeService,
} from '../../api/home';
import { colors, radius } from '../../theme/colors';

// Toast

function Toast({ msg, ok }: { msg: string; ok: boolean }) {
  return (
    <View style={[styles.toast, ok ? styles.toastOk : styles.toastErr]}>
      {ok ? <Check color={colors.success} size={14} /> : <X color={colors.danger} size={14} />}
      <Text style={[styles.toastText, ok ? styles.toastTextOk : styles.toastTextErr]}>{msg}</Text>
    </View>
  );
}

// Section accordion

function Section({
  icon: Icon,
  title,
  subtitle,
  children,
  defaultOpen = false,
}: {
  icon: React.ElementType;
  title: string;
  subtitle: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <Card padded={false} style={styles.section}>
      <Pressable style={styles.sectionHeader} onPress={() => setOpen((v) => !v)}>
        <View style={styles.sectionHeaderLeft}>
          <Icon color={colors.primary} size={16} />
          <View>
            <Text style={styles.sectionSubtitle}>{subtitle}</Text>
            <Text style={styles.sectionTitle}>{title}</Text>
          </View>
        </View>
        {open ? <ChevronUp color={colors.textDim} size={18} /> : <ChevronRight color={colors.textDim} size={18} />}
      </Pressable>
      {open && <View style={styles.sectionBody}>{children}</View>}
    </Card>
  );
}

// Reorder row helper

function OrderBtns({
  idx,
  total,
  onUp,
  onDown,
}: {
  idx: number;
  total: number;
  onUp: () => void;
  onDown: () => void;
}) {
  return (
    <View style={styles.orderBtns}>
      <Pressable onPress={onUp} disabled={idx === 0} style={({ pressed }) => [styles.orderBtn, (idx === 0 || pressed) && { opacity: 0.3 }]}>
        <ChevronUp color={colors.textDim} size={14} />
      </Pressable>
      <Pressable onPress={onDown} disabled={idx === total - 1} style={({ pressed }) => [styles.orderBtn, (idx === total - 1 || pressed) && { opacity: 0.3 }]}>
        <ChevronDown color={colors.textDim} size={14} />
      </Pressable>
    </View>
  );
}

// A) CARROUSEL

type SlideForm = {
  title: string;
  subtitle: string;
  imagePath: string;
  ctaLabel: string;
  ctaUrl: string;
  isActive: boolean;
};

const SLIDE_EMPTY: SlideForm = {
  title: '', subtitle: '', imagePath: '', ctaLabel: '', ctaUrl: '', isActive: true,
};

function SlideModal({
  slide,
  onClose,
  onSave,
}: {
  slide: CarouselSlide | null;
  onClose: () => void;
  onSave: (data: SlideForm) => Promise<void>;
}) {
  const [form, setForm] = useState<SlideForm>(
    slide
      ? {
          title: slide.title,
          subtitle: slide.subtitle ?? '',
          imagePath: slide.imagePath ?? '',
          ctaLabel: slide.ctaLabel ?? '',
          ctaUrl: slide.ctaUrl ?? '',
          isActive: slide.isActive,
        }
      : SLIDE_EMPTY
  );
  const [saving, setSaving] = useState(false);

  const set = <K extends keyof SlideForm>(k: K, v: SlideForm[K]) =>
    setForm((f) => ({ ...f, [k]: v }));

  const submit = async () => {
    if (!form.title.trim()) {
      Alert.alert('Champ requis', 'Le titre est obligatoire.');
      return;
    }
    setSaving(true);
    try {
      await onSave(form);
      onClose();
    } catch (e: unknown) {
      Alert.alert('Erreur', (e instanceof Error ? e.message : null) ?? 'Impossible d\'enregistrer.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal visible animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <View style={styles.modal}>
        {/* Header */}
        <View style={styles.modalHeader}>
          <Text style={styles.modalTitle}>{slide ? 'Modifier la slide' : 'Nouvelle slide'}</Text>
          <Pressable onPress={onClose}><X color={colors.textDim} size={20} /></Pressable>
        </View>

        <ScrollView style={styles.modalBody} keyboardShouldPersistTaps="handled">
          <View style={styles.modalForm}>
            <Input label="Titre *" value={form.title} onChangeText={(v) => set('title', v)} maxLength={120} />
            <Input label="Sous-titre" value={form.subtitle} onChangeText={(v) => set('subtitle', v)} maxLength={240} />
            <Input label="Chemin image (ex: uploads/hero.jpg)" value={form.imagePath} onChangeText={(v) => set('imagePath', v)} autoCapitalize="none" />

            <View style={styles.row}>
              <View style={{ flex: 1 }}>
                <Input label="Bouton - texte" value={form.ctaLabel} onChangeText={(v) => set('ctaLabel', v)} maxLength={60} />
              </View>
              <View style={{ flex: 1 }}>
                <Input label="Bouton - lien" value={form.ctaUrl} onChangeText={(v) => set('ctaUrl', v)} maxLength={255} autoCapitalize="none" />
              </View>
            </View>

            <View style={styles.switchRow}>
              <Text style={styles.switchLabel}>Slide visible sur le site</Text>
              <Switch
                value={form.isActive}
                onValueChange={(v) => set('isActive', v)}
                trackColor={{ false: colors.border, true: colors.primary }}
                thumbColor="#fff"
              />
            </View>
          </View>
        </ScrollView>

        <View style={styles.modalFooter}>
          <Button label="Annuler" variant="ghost" onPress={onClose} />
          <Button label={saving ? 'Enregistrement…' : 'Enregistrer'} onPress={submit} loading={saving} />
        </View>
      </View>
    </Modal>
  );
}

function CarouselSection({ onToast }: { onToast: (m: string, ok: boolean) => void }) {
  const [slides, setSlides] = useState<CarouselSlide[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<CarouselSlide | null | 'new'>(null);

  const reload = useCallback(() =>
    adminHomeApi.listSlides().then(setSlides).finally(() => setLoading(false)), []);
  useEffect(() => { reload(); }, [reload]);

  const move = async (idx: number, dir: -1 | 1) => {
    const next = [...slides];
    [next[idx], next[idx + dir]] = [next[idx + dir], next[idx]];
    setSlides(next);
    try {
      await adminHomeApi.reorderSlides(next.map((s) => s.id));
      onToast('Ordre mis à jour', true);
    } catch { onToast('Erreur réordonnancement', false); }
  };

  const toggleActive = async (slide: CarouselSlide) => {
    try {
      const updated = await adminHomeApi.updateSlide(slide.id, { isActive: !slide.isActive });
      setSlides((prev) => prev.map((s) => (s.id === updated.id ? updated : s)));
      onToast(updated.isActive ? 'Slide activée' : 'Slide masquée', true);
    } catch { onToast('Erreur', false); }
  };

  const handleDelete = (slide: CarouselSlide) => {
    Alert.alert('Supprimer ?', `"${slide.title}" sera supprimée définitivement.`, [
      { text: 'Annuler', style: 'cancel' },
      {
        text: 'Supprimer', style: 'destructive',
        onPress: async () => {
          try {
            await adminHomeApi.deleteSlide(slide.id);
            setSlides((prev) => prev.filter((s) => s.id !== slide.id));
            onToast('Slide supprimée', true);
          } catch { onToast('Erreur suppression', false); }
        },
      },
    ]);
  };

  const handleSave = async (data: SlideForm) => {
    if (editing === 'new') {
      const created = await adminHomeApi.createSlide({ ...data, position: slides.length });
      setSlides((prev) => [...prev, created]);
      onToast('Slide créée', true);
    } else if (editing) {
      const updated = await adminHomeApi.updateSlide(editing.id, data);
      setSlides((prev) => prev.map((s) => (s.id === updated.id ? updated : s)));
      onToast('Slide mise à jour', true);
    }
  };

  return (
    <Section icon={LayoutList} title="Carrousel" subtitle="SECTION 1 - HERO" defaultOpen>
      {loading ? (
        <ActivityIndicator color={colors.primary} />
      ) : (
        <>
          {slides.map((s, i) => (
            <View key={s.id} style={styles.itemRow}>
              <OrderBtns idx={i} total={slides.length} onUp={() => move(i, -1)} onDown={() => move(i, 1)} />
              <View style={{ flex: 1 }}>
                <Text style={styles.itemName} numberOfLines={1}>{s.title}</Text>
                {s.subtitle ? <Text style={styles.itemSub} numberOfLines={1}>{s.subtitle}</Text> : null}
              </View>
              <Pressable onPress={() => toggleActive(s)} style={styles.iconBtn}>
                {s.isActive
                  ? <Eye color={colors.success} size={16} />
                  : <EyeOff color={colors.textDim} size={16} />}
              </Pressable>
              <Pressable onPress={() => setEditing(s)} style={styles.iconBtn}>
                <Pencil color={colors.primary} size={16} />
              </Pressable>
              <Pressable onPress={() => handleDelete(s)} style={styles.iconBtn}>
                <Trash2 color={colors.danger} size={16} />
              </Pressable>
            </View>
          ))}

          {slides.length === 0 && (
            <Text style={styles.emptyText}>Aucune slide. Ajoutez-en une ci-dessous.</Text>
          )}

          <Pressable style={styles.addBtn} onPress={() => setEditing('new')}>
            <Plus color={colors.primary} size={14} />
            <Text style={styles.addBtnText}>Ajouter une slide</Text>
          </Pressable>
        </>
      )}

      {editing !== null && (
        <SlideModal
          slide={editing === 'new' ? null : editing}
          onClose={() => setEditing(null)}
          onSave={handleSave}
        />
      )}
    </Section>
  );
}

// B) TEXTE INTRO

function ContentSection({ onToast }: { onToast: (m: string, ok: boolean) => void }) {
  const [title, setTitle]     = useState('');
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving]   = useState(false);

  useEffect(() => {
    adminHomeApi.getContent('hero_intro')
      .then((c) => { setTitle(c.title ?? ''); setContent(c.content); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const save = async () => {
    setSaving(true);
    try {
      await adminHomeApi.saveContent('hero_intro', { title, content });
      onToast('Texte enregistré', true);
    } catch { onToast('Erreur enregistrement', false); }
    finally { setSaving(false); }
  };

  return (
    <Section icon={FileText} title="Texte d'introduction" subtitle="SECTION 2 - HÉRO INTRO">
      {loading ? (
        <ActivityIndicator color={colors.primary} />
      ) : (
        <View style={{ gap: 12 }}>
          <Input label="Titre" value={title} onChangeText={setTitle} maxLength={120} />
          <View>
            <Text style={styles.fieldLabel}>Contenu</Text>
            <TextInput
              style={styles.textarea}
              value={content}
              onChangeText={setContent}
              multiline
              numberOfLines={5}
              textAlignVertical="top"
              placeholderTextColor={colors.textDim}
            />
          </View>
          <Button label={saving ? 'Enregistrement…' : 'Enregistrer'} onPress={save} loading={saving} />
        </View>
      )}
    </Section>
  );
}

// C) CATÉGORIES

function CategoriesSection({ onToast }: { onToast: (m: string, ok: boolean) => void }) {
  const [cats, setCats]   = useState<HomeCategory[]>([]);
  const [loading, setLoading] = useState(true);

  const reload = useCallback(() =>
    adminHomeApi.listCategories().then(setCats).finally(() => setLoading(false)), []);
  useEffect(() => { reload(); }, [reload]);

  const inHome = [...cats.filter((c) => c.homePosition !== null)]
    .sort((a, b) => (a.homePosition ?? 0) - (b.homePosition ?? 0));
  const notInHome = cats.filter((c) => c.homePosition === null);

  const add = async (cat: HomeCategory) => {
    const maxPos = Math.max(-1, ...inHome.map((c) => c.homePosition ?? -1));
    try {
      const updated = await adminHomeApi.updateCategoryHome(cat.id, { homePosition: maxPos + 1 });
      setCats((prev) => prev.map((c) => (c.id === updated.id ? updated : c)));
      onToast(`${cat.name} ajoutée à l'accueil`, true);
    } catch { onToast('Erreur', false); }
  };

  const remove = async (cat: HomeCategory) => {
    try {
      const updated = await adminHomeApi.updateCategoryHome(cat.id, { homePosition: null });
      setCats((prev) => prev.map((c) => (c.id === updated.id ? updated : c)));
      onToast(`${cat.name} retirée`, true);
    } catch { onToast('Erreur', false); }
  };

  const move = async (idx: number, dir: -1 | 1) => {
    const next = [...inHome];
    [next[idx], next[idx + dir]] = [next[idx + dir], next[idx]];
    setCats((prev) => {
      const copy = [...prev];
      next.forEach((c, i) => {
        const found = copy.find((x) => x.id === c.id);
        if (found) found.homePosition = i;
      });
      return [...copy];
    });
    try {
      await adminHomeApi.reorderCategories(next.map((c) => c.id));
      onToast('Ordre mis à jour', true);
    } catch { onToast('Erreur réordonnancement', false); }
  };

  return (
    <Section icon={Grid3x3} title="Catégories affichées" subtitle="SECTION 3 - GRILLE DOMAINES">
      {loading ? (
        <ActivityIndicator color={colors.primary} />
      ) : (
        <View style={{ gap: 16 }}>
          {/* In home */}
          <View>
            <Text style={styles.subLabel}>AFFICHÉES SUR L'ACCUEIL ({inHome.length})</Text>
            {inHome.length === 0 && <Text style={styles.emptyText}>Aucune catégorie affichée.</Text>}
            {inHome.map((cat, i) => (
              <View key={cat.id} style={styles.itemRow}>
                <OrderBtns idx={i} total={inHome.length} onUp={() => move(i, -1)} onDown={() => move(i, 1)} />
                <Text style={[styles.itemName, { flex: 1 }]} numberOfLines={1}>{cat.name}</Text>
                <Text style={styles.itemSub}>{cat.slug}</Text>
                <Pressable onPress={() => remove(cat)} style={styles.iconBtn}>
                  <X color={colors.danger} size={16} />
                </Pressable>
              </View>
            ))}
          </View>

          {/* Not in home */}
          {notInHome.length > 0 && (
            <View>
              <Text style={styles.subLabel}>AUTRES - appuyer pour ajouter</Text>
              <View style={styles.chips}>
                {notInHome.map((cat) => (
                  <Pressable key={cat.id} style={styles.chipAdd} onPress={() => add(cat)}>
                    <Plus color={colors.primary} size={12} />
                    <Text style={styles.chipAddText}>{cat.name}</Text>
                  </Pressable>
                ))}
              </View>
            </View>
          )}
        </View>
      )}
    </Section>
  );
}

// D) TOP PRODUITS

function TopProductsSection({ onToast }: { onToast: (m: string, ok: boolean) => void }) {
  const [services, setServices] = useState<HomeService[]>([]);
  const [loading, setLoading]   = useState(true);

  const reload = useCallback(() =>
    adminHomeApi.listTopProducts().then(setServices).finally(() => setLoading(false)), []);
  useEffect(() => { reload(); }, [reload]);

  const inTop = [...services.filter((s) => s.homePosition !== null)]
    .sort((a, b) => (a.homePosition ?? 0) - (b.homePosition ?? 0));
  const notInTop = services.filter((s) => s.homePosition === null);

  const add = async (svc: HomeService) => {
    try {
      const updated = await adminHomeApi.addTopProduct(svc.id);
      setServices((prev) => prev.map((s) => (s.id === updated.id ? updated : s)));
      onToast(`${svc.name} ajouté`, true);
    } catch { onToast('Erreur', false); }
  };

  const remove = async (svc: HomeService) => {
    try {
      await adminHomeApi.removeTopProduct(svc.id);
      setServices((prev) => prev.map((s) => (s.id === svc.id ? { ...s, homePosition: null } : s)));
      onToast(`${svc.name} retiré`, true);
    } catch { onToast('Erreur', false); }
  };

  const move = async (idx: number, dir: -1 | 1) => {
    const next = [...inTop];
    [next[idx], next[idx + dir]] = [next[idx + dir], next[idx]];
    setServices((prev) => {
      const copy = [...prev];
      next.forEach((s, i) => {
        const found = copy.find((x) => x.id === s.id);
        if (found) found.homePosition = i;
      });
      return [...copy];
    });
    try {
      await adminHomeApi.reorderTopProducts(next.map((s) => s.id));
      onToast('Ordre mis à jour', true);
    } catch { onToast('Erreur réordonnancement', false); }
  };

  return (
    <Section icon={Star} title="Solutions mises en avant" subtitle="SECTION 4 - TOP PRODUITS">
      {loading ? (
        <ActivityIndicator color={colors.primary} />
      ) : (
        <View style={{ gap: 16 }}>
          {/* In top */}
          <View>
            <Text style={styles.subLabel}>EN AVANT ({inTop.length})</Text>
            {inTop.length === 0 && <Text style={styles.emptyText}>Aucun produit mis en avant.</Text>}
            {inTop.map((svc, i) => (
              <View key={svc.id} style={styles.itemRow}>
                <OrderBtns idx={i} total={inTop.length} onUp={() => move(i, -1)} onDown={() => move(i, 1)} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.itemName} numberOfLines={1}>{svc.name}</Text>
                  {svc.category && <Text style={styles.itemSub}>{svc.category}</Text>}
                </View>
                {svc.priceMonthly != null && (
                  <Text style={styles.priceTag}>{svc.priceMonthly} €/m</Text>
                )}
                <Pressable onPress={() => remove(svc)} style={styles.iconBtn}>
                  <X color={colors.danger} size={16} />
                </Pressable>
              </View>
            ))}
          </View>

          {/* Not in top */}
          {notInTop.length > 0 && (
            <View>
              <Text style={styles.subLabel}>AUTRES SERVICES - appuyer pour ajouter</Text>
              <View style={styles.chips}>
                {notInTop.map((svc) => (
                  <Pressable key={svc.id} style={styles.chipAdd} onPress={() => add(svc)}>
                    <Plus color={colors.primary} size={12} />
                    <Text style={styles.chipAddText}>{svc.name}</Text>
                  </Pressable>
                ))}
              </View>
            </View>
          )}
        </View>
      )}
    </Section>
  );
}

// Page principale

export function AdminHomeScreen() {
  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null);

  const showToast = (msg: string, ok: boolean) => {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 3000);
  };

  return (
    <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
      {/* Header */}
      <View style={styles.pageHeader}>
        <View style={styles.eyebrowBadge}>
          <LayoutList color={colors.primary} size={10} />
          <Text style={styles.eyebrowText}>CONSOLE ADMINISTRATEUR</Text>
        </View>
        <Text style={styles.pageTitle}>Page d'accueil</Text>
        <Text style={styles.pageSubtitle}>Gérez le contenu affiché sur la page principale du site.</Text>
      </View>

      <CarouselSection onToast={showToast} />
      <ContentSection onToast={showToast} />
      <CategoriesSection onToast={showToast} />
      <TopProductsSection onToast={showToast} />

      {toast && <Toast msg={toast.msg} ok={toast.ok} />}
    </ScrollView>
  );
}

// Styles

const styles = StyleSheet.create({
  scroll: { backgroundColor: colors.background },
  content: { padding: 16, gap: 12, paddingBottom: 60 },

  pageHeader: { gap: 6, marginBottom: 4 },
  eyebrowBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderColor: 'rgba(59,130,246,0.25)',
    backgroundColor: 'rgba(59,130,246,0.10)',
    borderRadius: radius.full,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  eyebrowText: { color: colors.primary, fontSize: 9, fontWeight: '700', letterSpacing: 1.4 },
  pageTitle: { color: colors.text, fontSize: 26, fontWeight: '900', letterSpacing: -0.5 },
  pageSubtitle: { color: colors.textMuted, fontSize: 13, lineHeight: 20 },

  // Section accordion
  section: { overflow: 'hidden' },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 14,
  },
  sectionHeaderLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  sectionSubtitle: { color: colors.primary, fontSize: 9, fontWeight: '700', letterSpacing: 1.5 },
  sectionTitle: { color: colors.text, fontSize: 15, fontWeight: '700' },
  sectionBody: {
    padding: 14,
    paddingTop: 0,
    borderTopWidth: 1,
    borderTopColor: colors.borderSubtle,
    gap: 8,
  },

  // Item rows
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderSubtle,
  },
  itemName: { color: colors.text, fontSize: 13, fontWeight: '600' },
  itemSub: { color: colors.textDim, fontSize: 11, marginTop: 1 },
  priceTag: { color: colors.primary, fontSize: 11, fontFamily: 'Menlo' },

  orderBtns: { gap: 2 },
  orderBtn: { padding: 2 },
  iconBtn: { padding: 4 },

  // Add button
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 8,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: colors.border,
    borderRadius: radius.md,
    alignSelf: 'flex-start',
  },
  addBtnText: { color: colors.primary, fontSize: 13, fontWeight: '600' },

  // Labels
  subLabel: {
    color: colors.textDim,
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1,
    marginBottom: 6,
  },
  fieldLabel: {
    color: colors.textMuted,
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  emptyText: { color: colors.textDim, fontSize: 12, fontStyle: 'italic', paddingVertical: 4 },

  // Chips to add
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  chipAdd: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: colors.border,
    borderRadius: radius.full,
  },
  chipAddText: { color: colors.textMuted, fontSize: 12 },

  // Textarea
  textarea: {
    backgroundColor: colors.surfaceHigh,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: colors.text,
    fontSize: 14,
    minHeight: 110,
    textAlignVertical: 'top',
  },

  // Switch row
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 6,
  },
  switchLabel: { color: colors.text, fontSize: 14 },

  // Row helper
  row: { flexDirection: 'row', gap: 10 },

  // Modal
  modal: { flex: 1, backgroundColor: colors.background },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    backgroundColor: colors.surface,
  },
  modalTitle: { color: colors.text, fontSize: 17, fontWeight: '700' },
  modalBody: { flex: 1 },
  modalForm: { padding: 16, gap: 14 },
  modalFooter: {
    flexDirection: 'row',
    gap: 10,
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.surface,
  },

  // Toast
  toast: {
    position: 'absolute',
    bottom: 20,
    left: 16,
    right: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: radius.md,
    borderWidth: 1,
  },
  toastOk: { backgroundColor: 'rgba(16,185,129,0.15)', borderColor: 'rgba(16,185,129,0.3)' },
  toastErr: { backgroundColor: 'rgba(239,68,68,0.15)', borderColor: 'rgba(239,68,68,0.3)' },
  toastText: { fontSize: 13, fontWeight: '600', flex: 1 },
  toastTextOk: { color: colors.success },
  toastTextErr: { color: colors.danger },
});
