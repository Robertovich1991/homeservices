import React from 'react';
import {StyleSheet, Text, TouchableOpacity, View} from 'react-native';
import {useCategories} from '../context/CategoriesContext';
import {useLanguage} from '../context/LanguageContext';
import {colors, statusKey, statusMeta} from '../theme';

export default function OrderCard({order, onPress}) {
  const {t} = useLanguage();
  const {label, color} = useCategories();
  const status = statusMeta(order.status);
  const catColor = color(order.category);

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={onPress}
      activeOpacity={0.85}
      accessibilityRole="button">
      <View style={styles.top}>
        <View style={[styles.badge, {backgroundColor: `${catColor}1A`}]}>
          <Text style={[styles.badgeText, {color: catColor}]}>
            {label(order.category)}
          </Text>
        </View>
        <View style={[styles.badge, {backgroundColor: status.bg}]}>
          <Text style={[styles.badgeText, {color: status.color}]}>
            {t(`status.${statusKey(order.status)}`)}
          </Text>
        </View>
      </View>
      <Text style={styles.title}>{order.title}</Text>
      <Text style={styles.meta}>{order.address}</Text>
      <Text style={styles.meta}>
        {order.date} · {order.timeSlot}
      </Text>
      {order.assignedTo ? (
        <Text style={styles.worker}>
          {t('order.worker', {name: order.assignedTo})}
        </Text>
      ) : null}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 16,
    marginHorizontal: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.line,
    shadowColor: '#122033',
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: {width: 0, height: 3},
    elevation: 2,
  },
  top: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 10,
    flexWrap: 'wrap',
  },
  badge: {
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '700',
  },
  title: {
    fontSize: 17,
    fontWeight: '700',
    color: colors.ink,
    marginBottom: 8,
  },
  meta: {
    fontSize: 14,
    color: colors.muted,
    marginBottom: 2,
  },
  worker: {
    marginTop: 8,
    fontSize: 13,
    fontWeight: '600',
    color: colors.primary,
  },
});
