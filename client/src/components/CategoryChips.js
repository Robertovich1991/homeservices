import React from 'react';
import {ScrollView, StyleSheet, Text, TouchableOpacity} from 'react-native';
import {useLanguage} from '../context/LanguageContext';
import {categoryLabelKey} from '../i18n/translations';
import {categoryColor, colors} from '../theme';

export const CATEGORIES = ['Все', 'Сантехника', 'Чистота', 'Покраска'];

export default function CategoryChips({selected, onSelect}) {
  const {t} = useLanguage();

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.row}>
      {CATEGORIES.map(category => {
        const active = selected === category;
        const tint =
          category === 'Все' ? colors.primary : categoryColor(category);
        const labelKey = categoryLabelKey(category);
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
              {labelKey ? t(labelKey) : category}
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
