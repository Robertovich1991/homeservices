import React, {useCallback, useRef, useState} from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import {useFocusEffect} from '@react-navigation/native';
import {fetchOrders} from '../../api';
import CategoryChips from '../components/CategoryChips';
import DateCalendar from '../components/DateCalendar';
import OrderCard from '../components/OrderCard';
import {useAuth} from '../context/AuthContext';
import {useLanguage} from '../context/LanguageContext';
import {errorText} from '../i18n/translations';
import {colors} from '../theme';

const STATUSES = ['all', 'new', 'assigned', 'completed', 'cancelled'];

export default function OrderListScreen({navigation}) {
  const {token} = useAuth();
  const {t} = useLanguage();
  const [category, setCategory] = useState('Все');
  const [status, setStatus] = useState('all');
  const [date, setDate] = useState('');
  const [showDate, setShowDate] = useState(false);
  const [query, setQuery] = useState('');
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const hasLoaded = useRef(false);
  const requestId = useRef(0);

  const load = useCallback(
    async (isRefresh = false) => {
      const id = requestId.current + 1;
      requestId.current = id;
      if (isRefresh || hasLoaded.current) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      try {
        const data = await fetchOrders(token, {
          category,
          status,
          date,
          q: query,
        });
        if (id !== requestId.current) {
          return;
        }
        hasLoaded.current = true;
        setOrders(Array.isArray(data) ? data : []);
      } catch (error) {
        if (id !== requestId.current) {
          return;
        }
        Alert.alert(t('orders.loadFailed'), errorText(t, error));
      } finally {
        if (id === requestId.current) {
          setLoading(false);
          setRefreshing(false);
        }
      }
    },
    [token, category, status, date, query, t],
  );

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  const filtered =
    category !== 'Все' || status !== 'all' || Boolean(date) || Boolean(query.trim());

  return (
    <View style={styles.container}>
      <CategoryChips selected={category} onSelect={setCategory} />
      <View style={styles.filters}>
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder={t('orders.searchPlaceholder')}
          placeholderTextColor={colors.muted}
          style={styles.search}
          autoCorrect={false}
          clearButtonMode="while-editing"
        />
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.statusRow}>
          {STATUSES.map(item => {
            const active = status === item;
            return (
              <TouchableOpacity
                key={item}
                onPress={() => setStatus(item)}
                style={[styles.chip, active && styles.chipActive]}
                accessibilityRole="button"
                accessibilityState={{selected: active}}>
                <Text style={[styles.chipLabel, active && styles.chipLabelActive]}>
                  {t(`status.${item}`)}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
        <View style={styles.dateRow}>
          <TouchableOpacity
            onPress={() => setShowDate(current => !current)}
            style={styles.dateButton}>
            <Text style={styles.dateButtonText}>
              {date || t('orders.pickDate')}
            </Text>
          </TouchableOpacity>
          {date ? (
            <TouchableOpacity
              onPress={() => {
                setDate('');
                setShowDate(false);
              }}
              hitSlop={8}>
              <Text style={styles.clearDate}>{t('orders.clearDate')}</Text>
            </TouchableOpacity>
          ) : null}
        </View>
        {showDate ? (
          <DateCalendar value={date} onChange={setDate} />
        ) : null}
      </View>
      {loading && !refreshing ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <FlatList
          data={orders}
          keyExtractor={item => item.id}
          renderItem={({item}) => (
            <OrderCard
              order={item}
              onPress={() =>
                navigation.navigate('OrderDetail', {orderId: item.id})
              }
            />
          )}
          contentContainerStyle={
            orders.length === 0 ? styles.emptyList : styles.list
          }
          ListEmptyComponent={
            <Text style={styles.empty}>
              {filtered ? t('orders.emptyFiltered') : t('orders.empty')}
            </Text>
          }
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => load(true)}
              tintColor={colors.primary}
            />
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {flex: 1, backgroundColor: colors.bg},
  filters: {paddingHorizontal: 16, paddingBottom: 8},
  search: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 16,
    color: colors.ink,
  },
  statusRow: {gap: 8, paddingVertical: 10},
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.line,
  },
  chipActive: {backgroundColor: colors.primary, borderColor: colors.primary},
  chipLabel: {fontSize: 13, fontWeight: '600', color: colors.ink},
  chipLabelActive: {color: '#FFFFFF'},
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  dateButton: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  dateButtonText: {color: colors.ink, fontWeight: '600'},
  clearDate: {color: colors.primary, fontWeight: '700'},
  list: {paddingBottom: 24, paddingTop: 4},
  emptyList: {flexGrow: 1, justifyContent: 'center', padding: 24},
  center: {flex: 1, alignItems: 'center', justifyContent: 'center'},
  empty: {textAlign: 'center', color: colors.muted, fontSize: 15},
});
