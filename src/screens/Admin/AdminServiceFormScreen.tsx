import React, { useEffect, useLayoutEffect, useState } from 'react';
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Plus, Trash2 } from 'lucide-react-native';

import { Button } from '../../components/ui/Button';
import { Loader } from '../../components/ui/Loader';
import { adminApi } from '../../api/admin';
import { colors, radius } from '../../theme/colors';
import type { RootScreen } from '../../navigation/types';

type Spec = { label: string; value: string };

const EMPTY = {
  name: '',
  categorySlug: '',
  type: 'saas' as 'saas' | 'one_shot',
  availability: 'available' as 'available' | 'maintenance' | 'unavailable',
  trialAvailable: false,
  priceMonthly: '',
  priceYearly: '',
  image: '',
  description: '',
  longDescription: '',
  images: [] as string[],
  technicalSpecs: [] as Spec[],
  features: [] as string[],
};

export function AdminServiceFormScreen({ route, navigation }: RootScreen<'AdminServiceForm'>) {
  const id = route.params?.id;
  const isEdit = id != null;

  const [loadingService, setLoadingService] = useState(isEdit);
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);

  useLayoutEffect(() => {
    navigation.setOptions({ title: isEdit ? 'Modifier le service' : 'Nouveau service' });
  }, [isEdit]);

  useEffect(() => {
    if (!isEdit) return;
    adminApi.getService(id!)
      .then(s => {
        setForm({
          name: s.name ?? '',
          categorySlug: s.categorySlug ?? s.category ?? '',
          type: s.type ?? 'saas',
          availability: s.availability ?? 'available',
          trialAvailable: s.trialAvailable ?? false,
          priceMonthly: s.priceMonthly != null ? String(s.priceMonthly) : '',
          priceYearly: s.priceYearly != null ? String(s.priceYearly) : '',
          image: s.image ?? '',
          description: s.description ?? '',
          longDescription: s.longDescription ?? '',
          images: s.images ?? [],
          technicalSpecs: s.technicalSpecs ?? [],
          features: s.features ?? [],
        });
      })
      .catch(() => Alert.alert('Erreur', 'Impossible de charger le service.'))
      .finally(() => setLoadingService(false));
  }, [id]);

  const set = (key: keyof typeof EMPTY, value: (typeof EMPTY)[keyof typeof EMPTY]) =>
    setForm(f => ({ ...f, [key]: value }));

  // Features helpers
  const addFeature = () => set('features', [...form.features, '']);
  const setFeature = (i: number, v: string) => {
    const arr = [...form.features];
    arr[i] = v;
    set('features', arr);
  };
  const removeFeature = (i: number) =>
    set('features', form.features.filter((_, j) => j !== i));

  // Specs helpers
  const addSpec = () => set('technicalSpecs', [...form.technicalSpecs, { label: '', value: '' }]);
  const setSpec = (i: number, key: 'label' | 'value', v: string) => {
    const arr = [...form.technicalSpecs];
    arr[i] = { ...arr[i], [key]: v };
    set('technicalSpecs', arr);
  };
  const removeSpec = (i: number) =>
    set('technicalSpecs', form.technicalSpecs.filter((_, j) => j !== i));

  // Images helpers
  const addImage = () => set('images', [...form.images, '']);
  const setImage = (i: number, v: string) => {
    const arr = [...form.images];
    arr[i] = v;
    set('images', arr);
  };
  const removeImage = (i: number) =>
    set('images', form.images.filter((_, j) => j !== i));

  const save = async () => {
    if (!form.name.trim()) {
      Alert.alert('Erreur', 'Le nom est requis.');
      return;
    }
    setSaving(true);
    try {
      const payload = {
        name: form.name.trim(),
        categorySlug: form.categorySlug.trim() || undefined,
        type: form.type,
        availability: form.availability,
        trialAvailable: form.trialAvailable,
        priceMonthly: form.priceMonthly ? parseFloat(form.priceMonthly) : undefined,
        priceYearly: form.priceYearly ? parseFloat(form.priceYearly) : null,
        image: form.image.trim() || null,
        description: form.description.trim() || undefined,
        longDescription: form.longDescription.trim() || undefined,
        images: form.images.filter(Boolean),
        technicalSpecs: form.technicalSpecs.filter(s => s.label.trim() && s.value.trim()),
        features: form.features.filter(Boolean),
      };

      if (isEdit) {
        await adminApi.updateService(id!, payload);
      } else {
        await adminApi.createService(payload);
      }

      navigation.goBack();
    } catch (e: unknown) {
      Alert.alert('Erreur', (e instanceof Error ? e.message : null) ?? 'Une erreur est survenue.');
    } finally {
      setSaving(false);
    }
  };

  if (loadingService) return <Loader />;

  return (
    <ScrollView style={styles.scroll} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">

      {/* Informations générales */}
      <SectionTitle label="Informations générales" />

      <FieldLabel label="Nom *" />
      <TextInput
        style={styles.input}
        value={form.name}
        onChangeText={v => set('name', v)}
        placeholder="Cyna EDR"
        placeholderTextColor={colors.textDim}
      />

      <FieldLabel label="Catégorie (slug)" />
      <TextInput
        style={styles.input}
        value={form.categorySlug}
        onChangeText={v => set('categorySlug', v)}
        placeholder="edr"
        placeholderTextColor={colors.textDim}
        autoCapitalize="none"
      />

      <FieldLabel label="Type" />
      <View style={styles.segmented}>
        {(['saas', 'one_shot'] as const).map(t => (
          <Pressable
            key={t}
            style={[styles.segment, form.type === t && styles.segmentActive]}
            onPress={() => set('type', t)}
          >
            <Text style={[styles.segmentText, form.type === t && styles.segmentTextActive]}>
              {t === 'saas' ? 'SaaS' : 'One Shot'}
            </Text>
          </Pressable>
        ))}
      </View>

      <FieldLabel label="Disponibilité" />
      <View style={styles.segmented}>
        {([
          ['available', 'Disponible'],
          ['maintenance', 'Maintenance'],
          ['unavailable', 'Indisponible'],
        ] as const).map(([val, lbl]) => (
          <Pressable
            key={val}
            style={[styles.segment, form.availability === val && styles.segmentActive]}
            onPress={() => set('availability', val)}
          >
            <Text style={[styles.segmentText, form.availability === val && styles.segmentTextActive]}>
              {lbl}
            </Text>
          </Pressable>
        ))}
      </View>

      <View style={styles.switchRow}>
        <FieldLabel label="Version d'essai disponible" />
        <Switch
          value={form.trialAvailable}
          onValueChange={v => set('trialAvailable', v)}
          trackColor={{ true: colors.primary }}
        />
      </View>

      {/* Prix */}
      <SectionTitle label="Prix" />

      <View style={styles.row}>
        <View style={{ flex: 1 }}>
          <FieldLabel label="Prix mensuel (€)" />
          <TextInput
            style={styles.input}
            value={form.priceMonthly}
            onChangeText={v => set('priceMonthly', v)}
            placeholder="149.99"
            placeholderTextColor={colors.textDim}
            keyboardType="decimal-pad"
          />
        </View>
        <View style={{ flex: 1 }}>
          <FieldLabel label="Prix annuel (€)" />
          <TextInput
            style={styles.input}
            value={form.priceYearly}
            onChangeText={v => set('priceYearly', v)}
            placeholder="1499.99"
            placeholderTextColor={colors.textDim}
            keyboardType="decimal-pad"
          />
        </View>
      </View>

      {/* Médias */}
      <SectionTitle label="Médias" />

      <FieldLabel label="Image principale (URL ou chemin)" />
      <TextInput
        style={styles.input}
        value={form.image}
        onChangeText={v => set('image', v)}
        placeholder="edr.jpg"
        placeholderTextColor={colors.textDim}
        autoCapitalize="none"
      />

      <View style={styles.listHeader}>
        <FieldLabel label={`Illustrations (${form.images.length}/10)`} />
        {form.images.length < 10 && (
          <Pressable onPress={addImage} style={styles.addBtn}>
            <Plus color={colors.primary} size={16} />
            <Text style={styles.addBtnText}>Ajouter</Text>
          </Pressable>
        )}
      </View>
      {form.images.length === 0 && (
        <Text style={styles.emptyHint}>Aucune illustration.</Text>
      )}
      {form.images.map((img, i) => (
        <View key={i} style={styles.listRow}>
          <TextInput
            style={[styles.input, { flex: 1 }]}
            value={img}
            onChangeText={v => setImage(i, v)}
            placeholder="https://..."
            placeholderTextColor={colors.textDim}
            autoCapitalize="none"
          />
          <Pressable onPress={() => removeImage(i)} style={styles.removeBtn}>
            <Trash2 color={colors.danger} size={16} />
          </Pressable>
        </View>
      ))}

      {/* Descriptions */}
      <SectionTitle label="Description" />

      <FieldLabel label="Description courte" />
      <TextInput
        style={styles.input}
        value={form.description}
        onChangeText={v => set('description', v)}
        placeholder="Protection avancée des endpoints."
        placeholderTextColor={colors.textDim}
      />

      <FieldLabel label="Description longue" />
      <TextInput
        style={[styles.input, styles.textarea]}
        value={form.longDescription}
        onChangeText={v => set('longDescription', v)}
        placeholder="Solution de protection des endpoints…"
        placeholderTextColor={colors.textDim}
        multiline
        textAlignVertical="top"
        numberOfLines={6}
      />

      {/* Caractéristiques techniques */}
      <View style={styles.listHeader}>
        <SectionTitle label={`Caractéristiques techniques (${form.technicalSpecs.length}/20)`} />
        {form.technicalSpecs.length < 20 && (
          <Pressable onPress={addSpec} style={styles.addBtn}>
            <Plus color={colors.primary} size={16} />
            <Text style={styles.addBtnText}>Ajouter</Text>
          </Pressable>
        )}
      </View>
      {form.technicalSpecs.length === 0 && (
        <Text style={styles.emptyHint}>Aucune caractéristique.</Text>
      )}
      {form.technicalSpecs.map((spec, i) => (
        <View key={i} style={styles.specRow}>
          <TextInput
            style={[styles.input, { flex: 1 }]}
            value={spec.label}
            onChangeText={v => setSpec(i, 'label', v)}
            placeholder="Label"
            placeholderTextColor={colors.textDim}
          />
          <TextInput
            style={[styles.input, { flex: 1 }]}
            value={spec.value}
            onChangeText={v => setSpec(i, 'value', v)}
            placeholder="Valeur"
            placeholderTextColor={colors.textDim}
          />
          <Pressable onPress={() => removeSpec(i)} style={styles.removeBtn}>
            <Trash2 color={colors.danger} size={16} />
          </Pressable>
        </View>
      ))}

      {/* Fonctionnalités incluses */}
      <View style={styles.listHeader}>
        <SectionTitle label="Fonctionnalités incluses" />
        <Pressable onPress={addFeature} style={styles.addBtn}>
          <Plus color={colors.primary} size={16} />
          <Text style={styles.addBtnText}>Ajouter</Text>
        </Pressable>
      </View>
      {form.features.length === 0 && (
        <Text style={styles.emptyHint}>Aucune fonctionnalité.</Text>
      )}
      {form.features.map((f, i) => (
        <View key={i} style={styles.listRow}>
          <TextInput
            style={[styles.input, { flex: 1 }]}
            value={f}
            onChangeText={v => setFeature(i, v)}
            placeholder="Protection antivirus nouvelle génération"
            placeholderTextColor={colors.textDim}
          />
          <Pressable onPress={() => removeFeature(i)} style={styles.removeBtn}>
            <Trash2 color={colors.danger} size={16} />
          </Pressable>
        </View>
      ))}

      {/* Enregistrer */}
      <View style={{ marginTop: 24 }}>
        <Button
          label={isEdit ? 'Enregistrer les modifications' : 'Créer le service'}
          onPress={save}
          loading={saving}
          fullWidth
        />
      </View>
    </ScrollView>
  );
}

function SectionTitle({ label }: { label: string }) {
  return <Text style={styles.sectionTitle}>{label}</Text>;
}

function FieldLabel({ label }: { label: string }) {
  return <Text style={styles.fieldLabel}>{label}</Text>;
}

const styles = StyleSheet.create({
  scroll: { backgroundColor: colors.background },
  content: { padding: 16, gap: 4, paddingBottom: 48 },

  sectionTitle: {
    color: colors.text,
    fontSize: 15,
    fontWeight: '700',
    marginTop: 20,
    marginBottom: 4,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderSubtle,
    paddingBottom: 6,
  },
  fieldLabel: {
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: '600',
    marginTop: 10,
    marginBottom: 4,
  },

  input: {
    backgroundColor: colors.surfaceHigh,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: 14,
    paddingVertical: 11,
    color: colors.text,
    fontSize: 14,
  },
  textarea: {
    minHeight: 120,
    paddingTop: 12,
  },

  row: { flexDirection: 'row', gap: 10 },

  segmented: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  segment: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 10,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    backgroundColor: colors.surfaceHigh,
  },
  segmentActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  segmentText: { color: colors.textMuted, fontSize: 13, fontWeight: '600' },
  segmentTextActive: { color: '#fff' },

  switchRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 10 },

  listHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 20, marginBottom: 4, borderBottomWidth: 1, borderBottomColor: colors.borderSubtle, paddingBottom: 6 },
  addBtn: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  addBtnText: { color: colors.primary, fontSize: 13, fontWeight: '600' },
  emptyHint: { color: colors.textMuted, fontSize: 13, fontStyle: 'italic', marginBottom: 4 },

  listRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 6 },
  specRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 6 },
  removeBtn: { padding: 8 },
});
