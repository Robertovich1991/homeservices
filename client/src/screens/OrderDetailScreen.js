import React, {useCallback, useEffect, useState} from 'react';
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import {useFocusEffect} from '@react-navigation/native';
import {
  assignOrder,
  fetchOrderById,
  fetchWorkers,
  updateOrderStatus,
} from '../../api';
import DateCalendar from '../components/DateCalendar';
import TimeSlotPicker from '../components/TimeSlotPicker';
import {useAuth} from '../context/AuthContext';
import {useCategories} from '../context/CategoriesContext';
import {useLanguage} from '../context/LanguageContext';
import {errorText} from '../i18n/translations';
import {mapUrl, openLink, phoneUrl} from '../openLink';
import {colors, statusKey, statusMeta} from '../theme';

export default function OrderDetailScreen({route, navigation}) {
  const {orderId} = route.params;
  const {token} = useAuth();
  const {t} = useLanguage();
  const {label: categoryLabel, color: categoryColor} = useCategories();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [workers, setWorkers] = useState([]);
  const [workersLoading, setWorkersLoading] = useState(false);
  const [workerId, setWorkerId] = useState(null);
  const [date, setDate] = useState('');
  const [timeSlot, setTimeSlot] = useState('');
  const [pageScrollEnabled, setPageScrollEnabled] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchOrderById(token, orderId);
      setOrder(data);
      setWorkerId(data.workerId || null);
      setDate(data.date || '');
      setTimeSlot(data.timeSlot || '');
    } catch (error) {
      Alert.alert(t('order.loadFailed'), errorText(t, error));
      navigation.goBack();
    } finally {
      setLoading(false);
    }
  }, [token, orderId, navigation, t]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  const closed =
    order?.status === 'completed' || order?.status === 'cancelled';

  useEffect(() => {
    if (!order || closed) {
      return undefined;
    }
    let active = true;
    setWorkersLoading(true);
    fetchWorkers(token, {
      category: order.category,
      date,
      timeSlot,
      excludeOrderId: order.id,
    })
      .then(list => {
        if (active) {
          setWorkers(Array.isArray(list) ? list : []);
        }
      })
      .catch(error => {
        if (active) {
          Alert.alert(t('order.loadFailed'), errorText(t, error));
        }
      })
      .finally(() => {
        if (active) {
          setWorkersLoading(false);
        }
      });
    return () => {
      active = false;
    };
  }, [token, order, closed, date, timeSlot, t]);

  const onAssign = async () => {
    const chosen = workers.find(worker => worker.id === workerId);
    if (!workerId || !date || !timeSlot) {
      Alert.alert(t('order.formTitle'), t('order.formBody'));
      return;
    }
    if (chosen?.busy) {
      Alert.alert(t('order.assignFailed'), t('error.overlap'));
      return;
    }

    setSaving(true);
    try {
      const updated = await assignOrder(token, orderId, {
        workerId,
        date,
        timeSlot,
      });
      setOrder(updated);
      setWorkerId(updated.workerId || null);
      Alert.alert(t('order.assignedTitle'), t('order.assignedBody'));
    } catch (error) {
      Alert.alert(t('order.assignFailed'), errorText(t, error));
    } finally {
      setSaving(false);
    }
  };

  const applyStatus = async next => {
    setSaving(true);
    try {
      const updated = await updateOrderStatus(token, orderId, next);
      setOrder(updated);
      Alert.alert(
        next === 'completed'
          ? t('order.completedTitle')
          : t('order.cancelledTitle'),
        next === 'completed'
          ? t('order.completedBody')
          : t('order.cancelledBody'),
      );
    } catch (error) {
      Alert.alert(t('order.statusFailed'), errorText(t, error));
    } finally {
      setSaving(false);
    }
  };

  const onCancel = () => {
    Alert.alert(t('order.cancelTitle'), t('order.cancelBody'), [
      {text: t('order.keep'), style: 'cancel'},
      {
        text: t('order.cancel'),
        style: 'destructive',
        onPress: () => applyStatus('cancelled'),
      },
    ]);
  };

  if (loading || !order) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  const status = statusMeta(order.status);
  const catColor = categoryColor(order.category);
  const rows = [
    [t('order.client'), order.clientName],
    [t('order.phone'), order.clientPhone],
    [t('order.address'), order.address],
    [t('order.date'), order.date],
    [t('order.slot'), order.timeSlot],
  ];
  if (order.assignedTo) {
    rows.push([t('worker.pick'), order.assignedTo]);
  }
  if (order.workerPhone) {
    rows.push([t('order.workerPhone'), order.workerPhone]);
  }

  return (
    <ScrollView
      scrollEnabled={pageScrollEnabled}
      contentContainerStyle={styles.content}>
      <View style={styles.row}>
        <View style={[styles.badge, {backgroundColor: `${catColor}1A`}]}>
          <Text style={[styles.badgeText, {color: catColor}]}>
            {categoryLabel(order.category)}
          </Text>
        </View>
        <View style={[styles.badge, {backgroundColor: status.bg}]}>
          <Text style={[styles.badgeText, {color: status.color}]}>
            {t(`status.${statusKey(order.status)}`)}
          </Text>
        </View>
      </View>

      <Text style={styles.title}>{order.title}</Text>
      <Text style={styles.description}>{order.description}</Text>

      <View style={styles.actions}>
        <TouchableOpacity
          style={styles.secondary}
          onPress={() => openLink(phoneUrl(order.clientPhone), t)}>
          <Text style={styles.secondaryText}>{t('order.call')}</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.secondary}
          onPress={() => openLink(mapUrl(order.address), t)}>
          <Text style={styles.secondaryText}>{t('order.maps')}</Text>
        </TouchableOpacity>
      </View>
      {order.workerPhone ? (
        <TouchableOpacity
          style={[styles.secondary, styles.fullButton]}
          onPress={() => openLink(phoneUrl(order.workerPhone), t)}>
          <Text style={styles.secondaryText}>{t('order.callWorker')}</Text>
        </TouchableOpacity>
      ) : null}

      <View style={styles.card}>
        {rows.map(([label, value], index) => (
          <Meta
            key={label}
            label={label}
            value={value}
            last={index === rows.length - 1}
          />
        ))}
      </View>

      {order.status === 'assigned' ? (
        <TouchableOpacity
          style={[styles.button, saving && styles.buttonDisabled]}
          onPress={() => applyStatus('completed')}
          disabled={saving}>
          <Text style={styles.buttonText}>{t('order.complete')}</Text>
        </TouchableOpacity>
      ) : null}
      {order.status === 'new' || order.status === 'assigned' ? (
        <TouchableOpacity
          style={[styles.dangerButton, saving && styles.buttonDisabled]}
          onPress={onCancel}
          disabled={saving}>
          <Text style={styles.dangerText}>{t('order.cancel')}</Text>
        </TouchableOpacity>
      ) : null}

      {closed ? (
        <Text style={styles.note}>{t('order.closedNote')}</Text>
      ) : (
        <View>
          <Text style={styles.section}>{t('order.assignSection')}</Text>
          <Text style={styles.label}>{t('worker.pick')}</Text>
          {workersLoading ? (
            <ActivityIndicator color={colors.primary} style={styles.workerLoading} />
          ) : null}
          {workers.length === 0 && !workersLoading ? (
            <Text style={styles.note}>{t('worker.none')}</Text>
          ) : (
            workers.map(worker => {
              const selected = worker.id === workerId;
              return (
                <TouchableOpacity
                  key={worker.id}
                  disabled={worker.busy}
                  onPress={() => setWorkerId(worker.id)}
                  style={[
                    styles.worker,
                    selected && styles.workerSelected,
                    worker.busy && styles.workerBusy,
                  ]}
                  accessibilityRole="button"
                  accessibilityState={{selected, disabled: worker.busy}}>
                  <View style={styles.workerText}>
                    <Text style={styles.workerName}>{worker.name}</Text>
                    <Text style={styles.workerPhone}>{worker.phone}</Text>
                  </View>
                  {worker.busy ? (
                    <Text style={styles.busy}>{t('worker.busy')}</Text>
                  ) : null}
                </TouchableOpacity>
              );
            })
          )}
          <Text style={styles.label}>{t('order.date')}</Text>
          <DateCalendar value={date} onChange={setDate} />
          <Text style={styles.label}>{t('order.slot')}</Text>
          <TimeSlotPicker
            value={timeSlot}
            onChange={setTimeSlot}
            onInteractionStart={() => setPageScrollEnabled(false)}
            onInteractionEnd={() => setPageScrollEnabled(true)}
          />
          <TouchableOpacity
            style={[styles.button, saving && styles.buttonDisabled]}
            onPress={onAssign}
            disabled={saving}>
            {saving ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.buttonText}>
                {order.status === 'assigned'
                  ? t('order.reschedule')
                  : t('order.assign')}
              </Text>
            )}
          </TouchableOpacity>
        </View>
      )}
    </ScrollView>
  );
}

function Meta({label, value, last}) {
  return (
    <View style={[styles.metaRow, !last && styles.metaBorder]}>
      <Text style={styles.metaLabel}>{label}</Text>
      <Text style={styles.metaValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.bg,
  },
  content: {padding: 16, paddingBottom: 40},
  row: {flexDirection: 'row', gap: 8, marginBottom: 12},
  badge: {borderRadius: 999, paddingHorizontal: 10, paddingVertical: 4},
  badgeText: {fontSize: 12, fontWeight: '700'},
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: colors.ink,
    marginBottom: 10,
  },
  description: {
    fontSize: 15,
    lineHeight: 22,
    color: colors.muted,
    marginBottom: 16,
  },
  actions: {flexDirection: 'row', gap: 8, marginBottom: 8},
  secondary: {
    flex: 1,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
  },
  fullButton: {flex: 0, marginBottom: 16},
  secondaryText: {color: colors.primary, fontWeight: '700', fontSize: 15},
  card: {
    backgroundColor: colors.card,
    borderRadius: 16,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: colors.line,
    marginBottom: 16,
    marginTop: 8,
  },
  metaRow: {paddingVertical: 12},
  metaBorder: {borderBottomWidth: 1, borderBottomColor: colors.line},
  metaLabel: {fontSize: 12, color: colors.muted, marginBottom: 4},
  metaValue: {fontSize: 16, color: colors.ink, fontWeight: '600'},
  section: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.ink,
    marginBottom: 12,
    marginTop: 8,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.ink,
    marginBottom: 6,
    marginTop: 8,
  },
  button: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 8,
  },
  buttonDisabled: {opacity: 0.7},
  buttonText: {color: '#fff', fontSize: 16, fontWeight: '700'},
  dangerButton: {
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 8,
    borderWidth: 1,
    borderColor: colors.danger,
    backgroundColor: colors.card,
  },
  dangerText: {color: colors.danger, fontSize: 16, fontWeight: '700'},
  note: {color: colors.muted, fontSize: 15, lineHeight: 22, marginTop: 8},
  workerLoading: {marginVertical: 8},
  worker: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 8,
    gap: 12,
  },
  workerSelected: {borderColor: colors.primary, backgroundColor: colors.accent},
  workerBusy: {opacity: 0.55},
  workerText: {flex: 1},
  workerName: {fontSize: 16, fontWeight: '700', color: colors.ink},
  workerPhone: {fontSize: 13, color: colors.muted, marginTop: 2},
  busy: {color: colors.warning, fontWeight: '700', fontSize: 13},
});
