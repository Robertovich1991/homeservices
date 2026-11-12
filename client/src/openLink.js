import {Alert, Linking, Platform} from 'react-native';

export async function openLink(url, t) {
  try {
    await Linking.openURL(url);
  } catch {
    Alert.alert(t('settings.unavailableTitle'), t('settings.unavailableBody'));
  }
}

export function phoneUrl(phone) {
  return `tel:${String(phone || '').replace(/[^\d+]/g, '')}`;
}

export function mapUrl(address) {
  const query = encodeURIComponent(address || '');
  if (Platform.OS === 'ios') {
    return `https://maps.apple.com/?q=${query}`;
  }
  return `https://www.google.com/maps/search/?api=1&query=${query}`;
}
