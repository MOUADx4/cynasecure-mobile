import React from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { Shield } from 'lucide-react-native';
import { Badge } from '../ui/Badge';
import { colors, radius } from '../../theme/colors';
import type { Category } from '../../api/services';

type Props = { category: Category; onPress: () => void };

function CategoryCardComponent({ category, onPress }: Props) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.card, pressed && styles.pressed]}
      accessibilityRole="button"
      accessibilityLabel={`${category.name}, ${category.count} service${category.count !== 1 ? 's' : ''}`}
    >
      {category.imagePath ? (
        <Image source={{ uri: category.imagePath }} style={styles.image} resizeMode="cover" />
      ) : (
        <View style={[styles.image, styles.placeholder]}>
          <Shield color={colors.textDim} size={28} />
        </View>
      )}
      <View style={styles.body}>
        <Text style={styles.name} numberOfLines={1}>{category.name}</Text>
        {category.description ? (
          <Text style={styles.desc} numberOfLines={2}>{category.description}</Text>
        ) : null}
        <Badge label={`${category.count} service${category.count !== 1 ? 's' : ''}`} tone="primary" />
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    overflow: 'hidden',
    height: 100,
  },
  pressed: { borderColor: colors.primary, opacity: 0.92 },
  image: { width: 80, height: 100, backgroundColor: colors.surfaceHigh },
  placeholder: { alignItems: 'center', justifyContent: 'center' },
  body: { flex: 1, padding: 12, justifyContent: 'space-between' },
  name: { color: colors.text, fontSize: 15, fontWeight: '700' },
  desc: { color: colors.textMuted, fontSize: 12, lineHeight: 17 },
});

export const CategoryCard = React.memo(CategoryCardComponent);
