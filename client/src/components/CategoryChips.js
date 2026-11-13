import React from 'react';
import {ScrollView, StyleSheet, Text, TouchableOpacity} from 'react-native';
import {useCategories} from '../context/CategoriesContext';
import {useLanguage} from '../context/LanguageContext';
import {colors} from '../theme';

export const ALL_CATEGORIES = 'all';

export default function CategoryChips({selected, onSelect}) {
  const {t} = useLanguage();
  const {categories, label, color} = useCategories();
  const options = [ALL_CATEGORIES, ...categories.map(category => category.id)];

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.row}>
      {options.map(category => {
        const active = selected === category;
        const tint =
          category === ALL_CATEGORIES ? colors.primary : color(category);
        return (
          <TouchableOpacity
            key={category}
            onPress={() => onSelect(category)}
            style={[
              styles.chip,
              active && {backgroundColor: tint, borderColor: tint},
            ]}
            accessibilityRole="button"
            accessibilityState={{selected: active}}>
            <Text style={[styles.label, active && styles.labelActive]}>
              {category === ALL_CATEGORIES
                ? t('category.all')
                : label(category)}
            </Text>
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  row: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 8,
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.line,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.ink,
  },
  labelActive: {
    color: '#FFFFFF',
  },
});
