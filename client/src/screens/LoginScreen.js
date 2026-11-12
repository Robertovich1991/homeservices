import React, {useState} from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import {useAuth} from '../context/AuthContext';
import {useLanguage} from '../context/LanguageContext';
import {errorText} from '../i18n/translations';
import {colors} from '../theme';

export default function LoginScreen({navigation}) {
  const {login, loading} = useAuth();
  const {t} = useLanguage();
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('123456');

  const onSubmit = async () => {
    if (!username.trim() || !password.trim()) {
      Alert.alert(t('login.missingTitle'), t('login.missingBody'));
      return;
    }

    try {
      await login(username.trim(), password);
    } catch (error) {
      Alert.alert(t('login.failedTitle'), errorText(t, error));
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={styles.container}>
        <Text style={styles.kicker}>{t('login.kicker')}</Text>
        <Text style={styles.title}>{t('login.title')}</Text>
        <Text style={styles.subtitle}>{t('login.subtitle')}</Text>

        <Text style={styles.label}>{t('login.username')}</Text>
        <TextInput
          value={username}
          onChangeText={setUsername}
          autoCapitalize="none"
          autoCorrect={false}
          placeholder="admin"
          placeholderTextColor={colors.muted}
          style={styles.input}
        />

        <Text style={styles.label}>{t('login.password')}</Text>
        <TextInput
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          placeholder="••••••"
          placeholderTextColor={colors.muted}
          style={styles.input}
        />

        <TouchableOpacity
          style={[styles.button, loading && styles.buttonDisabled]}
          onPress={onSubmit}
          disabled={loading}>
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>{t('login.submit')}</Text>
          )}
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => navigation.navigate('Settings')}
          style={styles.settingsLink}
          accessibilityRole="button">
          <Text style={styles.settingsLinkText}>{t('settings.title')}</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: {flex: 1, backgroundColor: colors.bg},
  container: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  kicker: {
    color: colors.primary,
    fontWeight: '700',
    letterSpacing: 0.6,
    marginBottom: 6,
  },
  title: {
    fontSize: 32,
    fontWeight: '800',
    color: colors.ink,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 15,
    color: colors.muted,
    marginBottom: 28,
    lineHeight: 22,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.ink,
    marginBottom: 6,
  },
  input: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: Platform.OS === 'ios' ? 14 : 10,
    fontSize: 16,
    color: colors.ink,
    marginBottom: 16,
  },
  button: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 8,
  },
  buttonDisabled: {opacity: 0.7},
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  settingsLink: {alignItems: 'center', marginTop: 18},
  settingsLinkText: {color: colors.primary, fontSize: 16, fontWeight: '700'},
});
