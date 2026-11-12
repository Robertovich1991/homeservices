import React from 'react';
import {
  Alert,
  Linking,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import {useLanguage} from '../context/LanguageContext';
import {colors} from '../theme';

const SUPPORT_EMAIL = 'support@homeservices.dispatch';
const SUPPORT_PHONE_DISPLAY = '+374 10 555 010';
const SUPPORT_PHONE_TEL = '+37410555010';

export default function SettingsScreen() {
  const {t, language, languages, setLanguage} = useLanguage();

  const openLink = async url => {
    try {
      const supported = await Linking.canOpenURL(url);
      if (!supported) {
        Alert.alert(
          t('settings.unavailableTitle'),
          t('settings.unavailableBody'),
        );
        return;
      }
      await Linking.openURL(url);
    } catch {
      Alert.alert(t('settings.unavailableTitle'), t('settings.unavailableBody'));
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.content}>
      <Text style={styles.section}>{t('settings.language')}</Text>
      <Text style={styles.hint}>{t('settings.languageHint')}</Text>
      <View style={styles.card}>
        {languages.map((item, index) => {
          const active = item.code === language;
          const last = index === languages.length - 1;
          return (
            <TouchableOpacity
              key={item.code}
              style={[styles.row, !last && styles.rowBorder]}
              onPress={() => setLanguage(item.code)}
              accessibilityRole="button"
              accessibilityState={{selected: active}}>
              <Text style={[styles.rowLabel, active && styles.rowLabelActive]}>
                {item.label}
              </Text>
              {active ? <Text style={styles.check}>✓</Text> : null}
            </TouchableOpacity>
          );
        })}
      </View>

      <Text style={styles.section}>{t('settings.support')}</Text>
      <View style={styles.card}>
        <Text style={styles.supportBody}>{t('settings.supportBody')}</Text>
        <View style={styles.contact}>
          <Text style={styles.contactLabel}>{t('settings.email')}</Text>
          <Text style={styles.contactValue}>{SUPPORT_EMAIL}</Text>
        </View>
        <View style={[styles.contact, styles.contactLast]}>
          <Text style={styles.contactLabel}>{t('settings.phone')}</Text>
          <Text style={styles.contactValue}>{SUPPORT_PHONE_DISPLAY}</Text>
        </View>
      </View>

      <TouchableOpacity
        style={styles.button}
        onPress={() => openLink(`mailto:${SUPPORT_EMAIL}`)}>
        <Text style={styles.buttonText}>{t('settings.write')}</Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={styles.secondaryButton}
        onPress={() => openLink(`tel:${SUPPORT_PHONE_TEL}`)}>
        <Text style={styles.secondaryButtonText}>{t('settings.call')}</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: {padding: 16, paddingBottom: 40},
  section: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.ink,
    marginBottom: 6,
  },
  hint: {
    fontSize: 14,
    color: colors.muted,
    marginBottom: 12,
  },
  card: {
    backgroundColor: colors.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.line,
    marginBottom: 24,
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 14,
  },
  rowBorder: {borderBottomWidth: 1, borderBottomColor: colors.line},
  rowLabel: {fontSize: 16, color: colors.ink, fontWeight: '600'},
  rowLabelActive: {color: colors.primary, fontWeight: '800'},
  check: {fontSize: 18, color: colors.primary, fontWeight: '800'},
  supportBody: {
    fontSize: 15,
    lineHeight: 22,
    color: colors.ink,
    paddingHorizontal: 14,
    paddingTop: 14,
    paddingBottom: 8,
  },
  contact: {
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: colors.line,
  },
  contactLast: {paddingBottom: 14},
  contactLabel: {fontSize: 12, color: colors.muted, marginBottom: 4},
  contactValue: {fontSize: 16, color: colors.ink, fontWeight: '600'},
  button: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    marginBottom: 10,
  },
  buttonText: {color: '#fff', fontSize: 16, fontWeight: '700'},
  secondaryButton: {
    backgroundColor: colors.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.primary,
    paddingVertical: 14,
    alignItems: 'center',
  },
  secondaryButtonText: {color: colors.primary, fontSize: 16, fontWeight: '700'},
});
