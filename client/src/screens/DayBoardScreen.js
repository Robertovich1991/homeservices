import React, {useCallback, useRef, useState} from 'react';
import {
  ActivityIndicator,
  Alert,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import {useFocusEffect} from '@react-navigation/native';
import {fetchSchedule} from '../../api';
import {CATEGORIES} from '../components/CategoryChips';
import {parseIsoDate, toIsoDate} from '../components/DateCalendar';
import OrderCard from '../components/OrderCard';
import {useAuth} from '../context/AuthContext';
import {useLanguage} from '../context/LanguageContext';
import {categoryLabelKey, errorText} from '../i18n/translations';
import {categoryColor, colors} from '../theme';

const TRADES = CATEGORIES.filter(category => category !== 'Все');

function shiftIso(iso, delta) {
  const parsed = parseIsoDate(iso);
  if (!parsed) {
    return iso;
  }
  return toIsoDate(
    new Date(
      parsed.getFullYear(),
      parsed.getMonth(),
      parsed.getDate() + delta,
    ),
  );
}

function formatDay(iso, t) {
  const parsed = parseIsoDate(iso);
  const months = t('calendar.months');
  if (!parsed || !Array.isArray(months)) {
    return iso;
  }
  return `${parsed.getDate()} ${months[parsed.getMonth()]} ${parsed.getFullYear()}`;
}

export default function DayBoardScreen({navigation}) {
  const {token} = useAuth();
  const {t} = useLanguage();
  const today = toIsoDate(new Date());
  const [date, setDate] = useState(today);
  const [board, setBoard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const shownDate = useRef(null);
  const requestId = useRef(0);

  const load = useCallback(async () => {
    const id = requestId.current + 1;
    requestId.current = id;
    const sameDay = shownDate.current === date;
    if (sameDay) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }
    try {
      const data = await fetchSchedule(token, date);
      if (id !== requestId.current) {
        return;
      }
      shownDate.current = data.date;
      setBoard(data);
    } catch (error) {
      if (id !== requestId.current) {
        return;
      }
      Alert.alert(t('board.loadFailed'), errorText(t, error));
    } finally {
      if (id === requestId.current) {
        setLoading(false);
        setRefreshing(false);
      }
    }
  }, [token, date, t]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  const openOrder = orderId =>
    navigation.navigate('OrderDetail', {orderId});

  const workers = board?.workers || [];
  const unassigned = board?.unassigned || [];

  return (
    <View style={styles.container}>
      <View style={styles.dayBar}>
        <TouchableOpacity
          onPress={() => setDate(current => shiftIso(current, -1))}
          accessibilityRole="button"
          accessibilityLabel={t('board.previousDay')}
          hitSlop={8}>
          <Text style={styles.nav}>‹</Text>
        </TouchableOpacity>
        <View style={styles.dayCenter}>
          <Text style={styles.dayLabel}>{formatDay(date, t)}</Text>
          {date !== today ? (
            <TouchableOpacity onPress={() => setDate(today)} hitSlop={8}>
              <Text style={styles.today}>{t('board.today')}</Text>
            </TouchableOpacity>
          ) : null}
        </View>
        <TouchableOpacity
          onPress={() => setDate(current => shiftIso(current, 1))}
          accessibilityRole="button"
          accessibilityLabel={t('board.nextDay')}
          hitSlop={8}>
          <Text style={styles.nav}>›</Text>
        </TouchableOpacity>
      </View>
      <TouchableOpacity
        style={styles.allOrders}
        onPress={() => navigation.navigate('OrderList')}>
        <Text style={styles.allOrdersText}>{t('board.allOrders')}</Text>
      </TouchableOpacity>
      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={styles.scroll}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={load}
              tintColor={colors.primary}
            />
          }>
          <Text style={styles.section}>{t('board.unassigned')}</Text>
          {unassigned.length === 0 ? (
            <Text style={styles.empty}>{t('board.emptyUnassigned')}</Text>
          ) : (
            unassigned.map(order => (
              <OrderCard
                key={order.id}
                order={order}
                onPress={() => openOrder(order.id)}
              />
            ))
          )}
          {TRADES.map(trade => {
            const group = workers.filter(worker => worker.category === trade);
            if (group.length === 0) {
              return null;
            }
            const labelKey = categoryLabelKey(trade);
            return (
              <View key={trade}>
                <Text style={[styles.section, {color: categoryColor(trade)}]}>
                  {labelKey ? t(labelKey) : trade}
                </Text>
                {group.map(worker => (
                  <View key={worker.id} style={styles.workerBlock}>
                    <View style={styles.workerHead}>
                      <View style={styles.workerIdentity}>
                        <Text style={styles.workerName}>{worker.name}</Text>
                        <Text style={styles.workerPhone}>{worker.phone}</Text>
                      </View>
                      {worker.free ? (
                        <Text style={styles.free}>{t('board.free')}</Text>
                      ) : null}
                    </View>
                    {worker.jobs.map(order => (
                      <OrderCard
                        key={order.id}
                        order={order}
                        onPress={() => openOrder(order.id)}
                      />
                    ))}
                  </View>
                ))}
              </View>
            );
          })}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {flex: 1, backgroundColor: colors.bg},
  dayBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingTop: 8,
  },
  dayCenter: {alignItems: 'center', flex: 1},
  dayLabel: {fontSize: 18, fontWeight: '800', color: colors.ink},
  today: {marginTop: 2, color: colors.primary, fontWeight: '700'},
  nav: {fontSize: 32, color: colors.primary, fontWeight: '600', paddingHorizontal: 8},
  allOrders: {alignSelf: 'center', paddingVertical: 8, paddingHorizontal: 12},
  allOrdersText: {color: colors.primary, fontWeight: '700', fontSize: 15},
  center: {flex: 1, alignItems: 'center', justifyContent: 'center'},
  scroll: {paddingBottom: 32},
  section: {
    marginHorizontal: 16,
    marginTop: 8,
    marginBottom: 8,
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 0.4,
    textTransform: 'uppercase',
    color: colors.muted,
  },
  empty: {
    marginHorizontal: 16,
    marginBottom: 12,
    color: colors.muted,
    fontSize: 15,
  },
  workerBlock: {marginBottom: 8},
  workerHead: {
    marginHorizontal: 16,
    marginBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  workerIdentity: {flex: 1},
  workerName: {fontSize: 16, fontWeight: '700', color: colors.ink},
  workerPhone: {fontSize: 13, color: colors.muted, marginTop: 2},
  free: {color: colors.success, fontWeight: '700', fontSize: 13},
});
