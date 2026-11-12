import React, {useEffect, useMemo, useRef, useState} from 'react';
import {ScrollView, StyleSheet, Text, View} from 'react-native';
import {colors} from '../theme';

const ITEM_HEIGHT = 44;
const VISIBLE_ROWS = 5;

const DEFAULT_SLOTS = [
  '08:00 - 10:00',
  '09:00 - 11:00',
  '09:00 - 12:00',
  '09:00 - 13:00',
  '10:00 - 12:00',
  '10:00 - 14:00',
  '11:00 - 13:00',
  '11:00 - 15:00',
  '12:00 - 14:00',
  '13:00 - 15:00',
  '13:00 - 17:00',
  '14:00 - 16:00',
  '15:00 - 17:00',
  '16:00 - 18:00',
  '17:00 - 19:00',
  '18:00 - 20:00',
];

function slotMinutes(slot) {
  const match = /^(\d{2}):(\d{2})\s*-\s*(\d{2}):(\d{2})$/.exec(slot || '');
  if (!match) {
    return [24 * 60, 24 * 60];
  }
  return [
    Number(match[1]) * 60 + Number(match[2]),
    Number(match[3]) * 60 + Number(match[4]),
  ];
}

export function slotsIncluding(current) {
  const unique = new Set(DEFAULT_SLOTS);
  if (current) {
    unique.add(current);
  }
  return [...unique].sort((left, right) => {
    const [leftStart, leftEnd] = slotMinutes(left);
    const [rightStart, rightEnd] = slotMinutes(right);
    return leftStart - rightStart || leftEnd - rightEnd;
  });
}

export default function TimeSlotPicker({
  value,
  onChange,
  onInteractionStart,
  onInteractionEnd,
}) {
  const slots = useMemo(() => slotsIncluding(value), [value]);
  const listRef = useRef(null);
  const dragging = useRef(false);
  const [offset, setOffset] = useState(0);

  useEffect(() => {
    if (dragging.current) {
      return;
    }
    const found = slots.indexOf(value);
    const y = (found < 0 ? 0 : found) * ITEM_HEIGHT;
    listRef.current?.scrollTo({y, animated: false});
    setOffset(y);
  }, [value, slots]);

  const commit = y => {
    const index = Math.min(
      slots.length - 1,
      Math.max(0, Math.round(y / ITEM_HEIGHT)),
    );
    const next = slots[index];
    if (next && next !== value) {
      onChange(next);
    }
  };

  const centerIndex = Math.min(
    slots.length - 1,
    Math.max(0, Math.round(offset / ITEM_HEIGHT)),
  );

  return (
    <View style={styles.card}>
      <View pointerEvents="none" style={styles.band} />
      <ScrollView
        ref={listRef}
        style={styles.list}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        nestedScrollEnabled
        onLayout={() => {
          if (dragging.current) {
            return;
          }
          const found = slots.indexOf(value);
          const y = (found < 0 ? 0 : found) * ITEM_HEIGHT;
          listRef.current?.scrollTo({y, animated: false});
          setOffset(y);
        }}
        snapToInterval={ITEM_HEIGHT}
        decelerationRate="fast"
        onScrollBeginDrag={() => {
          dragging.current = true;
          onInteractionStart?.();
        }}
        onScroll={event => setOffset(event.nativeEvent.contentOffset.y)}
        scrollEventThrottle={16}
        onMomentumScrollEnd={event => {
          dragging.current = false;
          onInteractionEnd?.();
          commit(event.nativeEvent.contentOffset.y);
        }}
        onScrollEndDrag={event => {
          const velocity = event.nativeEvent.velocity?.y ?? 0;
          if (Math.abs(velocity) < 0.05) {
            dragging.current = false;
            onInteractionEnd?.();
            commit(event.nativeEvent.contentOffset.y);
          }
        }}>
        {slots.map((slot, index) => {
          const distance = Math.abs(index - centerIndex);
          return (
            <View key={slot} style={styles.item}>
              <Text
                style={[
                  styles.itemText,
                  distance === 0 && styles.centerText,
                  distance === 1 && styles.nearText,
                  distance > 1 && styles.farText,
                ]}>
                {slot}
              </Text>
            </View>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    height: ITEM_HEIGHT * VISIBLE_ROWS,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 16,
    marginBottom: 14,
    overflow: 'hidden',
  },
  band: {
    position: 'absolute',
    left: 8,
    right: 8,
    top: ITEM_HEIGHT * 2,
    height: ITEM_HEIGHT,
    borderRadius: 10,
    backgroundColor: colors.accent,
  },
  list: {flex: 1},
  content: {paddingVertical: ITEM_HEIGHT * 2},
  item: {
    height: ITEM_HEIGHT,
    alignItems: 'center',
    justifyContent: 'center',
  },
  itemText: {fontSize: 16, fontWeight: '600'},
  centerText: {color: colors.primary, fontWeight: '800'},
  nearText: {color: colors.ink},
  farText: {color: colors.muted},
});
