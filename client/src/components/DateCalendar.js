import React, {useEffect, useMemo, useState} from 'react';
import {StyleSheet, Text, TouchableOpacity, View} from 'react-native';
import {useLanguage} from '../context/LanguageContext';
import {colors} from '../theme';

export function parseIsoDate(value) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value || '');
  if (!match) {
    return null;
  }
  const year = Number(match[1]);
  const month = Number(match[2]) - 1;
  const day = Number(match[3]);
  const date = new Date(year, month, day);
  if (
    date.getFullYear() !== year ||
    date.getMonth() !== month ||
    date.getDate() !== day
  ) {
    return null;
  }
  return date;
}

export function toIsoDate(date) {
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${date.getFullYear()}-${month}-${day}`;
}

function startOfMonth(date) {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

export function monthCells(year, month) {
  const firstWeekday = (new Date(year, month, 1).getDay() + 6) % 7;
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells = [];
  for (let index = 0; index < firstWeekday; index += 1) {
    cells.push(null);
  }
  for (let day = 1; day <= daysInMonth; day += 1) {
    cells.push(new Date(year, month, day));
  }
  while (cells.length % 7 !== 0) {
    cells.push(null);
  }
  return cells;
}

export default function DateCalendar({value, onChange}) {
  const {t} = useLanguage();
  const weekdays = t('calendar.weekdays');
  const months = t('calendar.months');
  const selected = parseIsoDate(value);
  const [visibleMonth, setVisibleMonth] = useState(() =>
    startOfMonth(selected || new Date()),
  );

  useEffect(() => {
    const parsed = parseIsoDate(value);
    if (parsed) {
      setVisibleMonth(startOfMonth(parsed));
    }
  }, [value]);

  const cells = useMemo(
    () => monthCells(visibleMonth.getFullYear(), visibleMonth.getMonth()),
    [visibleMonth],
  );
  const todayIso = toIsoDate(new Date());
  const selectedIso = selected ? toIsoDate(selected) : '';

  const shiftMonth = delta => {
    setVisibleMonth(
      current => new Date(current.getFullYear(), current.getMonth() + delta, 1),
    );
  };

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => shiftMonth(-1)}
          style={styles.navButton}
          accessibilityRole="button"
          accessibilityLabel={t('calendar.previousMonth')}>
          <Text style={styles.navText}>‹</Text>
        </TouchableOpacity>
        <Text style={styles.month}>
          {months[visibleMonth.getMonth()]} {visibleMonth.getFullYear()}
        </Text>
        <TouchableOpacity
          onPress={() => shiftMonth(1)}
          style={styles.navButton}
          accessibilityRole="button"
          accessibilityLabel={t('calendar.nextMonth')}>
          <Text style={styles.navText}>›</Text>
        </TouchableOpacity>
      </View>
      <View style={styles.weekdays}>
        {weekdays.map((day, index) => (
          <Text key={`weekday-${index}`} style={styles.weekday}>
            {day}
          </Text>
        ))}
      </View>
      <View style={styles.grid}>
        {cells.map((date, index) => {
          if (!date) {
            return <View key={`empty-${index}`} style={styles.day} />;
          }
          const iso = toIsoDate(date);
          const isSelected = iso === selectedIso;
          const isToday = iso === todayIso;
          return (
            <TouchableOpacity
              key={iso}
              style={styles.day}
              onPress={() => onChange(iso)}
              accessibilityRole="button"
              accessibilityLabel={iso}
              accessibilityState={{selected: isSelected}}>
              <View
                style={[
                  styles.dayFace,
                  isToday && !isSelected && styles.todayFace,
                  isSelected && styles.selectedFace,
                ]}>
                <Text
                  style={[styles.dayText, isSelected && styles.selectedText]}>
                  {date.getDate()}
                </Text>
              </View>
            </TouchableOpacity>
          );
        })}
      </View>
      <Text style={styles.selected}>
        {selectedIso || t('calendar.pickDate')}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 16,
    padding: 12,
    marginBottom: 14,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  month: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.ink,
  },
  navButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  navText: {
    fontSize: 24,
    lineHeight: 26,
    color: colors.primary,
    fontWeight: '700',
  },
  weekdays: {flexDirection: 'row', marginBottom: 4},
  weekday: {
    flex: 1,
    textAlign: 'center',
    fontSize: 12,
    fontWeight: '700',
    color: colors.muted,
  },
  grid: {flexDirection: 'row', flexWrap: 'wrap'},
  day: {
    width: `${100 / 7}%`,
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayFace: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
  },
  todayFace: {borderWidth: 1, borderColor: colors.primary},
  selectedFace: {backgroundColor: colors.primary},
  dayText: {fontSize: 15, color: colors.ink, fontWeight: '600'},
  selectedText: {color: '#fff'},
  selected: {
    marginTop: 8,
    textAlign: 'center',
    fontSize: 13,
    fontWeight: '700',
    color: colors.primary,
  },
});
