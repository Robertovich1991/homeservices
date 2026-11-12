import React from 'react';
import {Pressable, StatusBar, StyleSheet, Text} from 'react-native';
import {NavigationContainer, useNavigation} from '@react-navigation/native';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import {SafeAreaProvider} from 'react-native-safe-area-context';
import {AuthProvider, useAuth} from './src/context/AuthContext';
import {LanguageProvider, useLanguage} from './src/context/LanguageContext';
import LoginScreen from './src/screens/LoginScreen';
import DayBoardScreen from './src/screens/DayBoardScreen';
import OrderListScreen from './src/screens/OrderListScreen';
import OrderDetailScreen from './src/screens/OrderDetailScreen';
import SettingsScreen from './src/screens/SettingsScreen';
import {colors} from './src/theme';

const Stack = createNativeStackNavigator();

function SettingsHeaderButton() {
  const navigation = useNavigation<any>();
  const {t} = useLanguage();

  return (
    <Pressable onPress={() => navigation.navigate('Settings')} hitSlop={12}>
      <Text style={styles.headerAction}>{t('settings.title')}</Text>
    </Pressable>
  );
}

function LogoutHeaderButton() {
  const {logout} = useAuth();
  const {t} = useLanguage();

  return (
    <Pressable onPress={logout} hitSlop={12}>
      <Text style={styles.headerAction}>{t('auth.logout')}</Text>
    </Pressable>
  );
}

function RootNavigator() {
  const {isAuthenticated} = useAuth();
  const {t} = useLanguage();

  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: {backgroundColor: colors.card},
        headerShadowVisible: false,
        headerTintColor: colors.ink,
        headerTitleStyle: {fontWeight: '700'},
        contentStyle: {backgroundColor: colors.bg},
      }}>
      {isAuthenticated ? (
        <>
          <Stack.Screen
            name="DayBoard"
            component={DayBoardScreen}
            options={{
              title: t('board.title'),
              headerLeft: SettingsHeaderButton,
              headerRight: LogoutHeaderButton,
            }}
          />
          <Stack.Screen
            name="OrderList"
            component={OrderListScreen}
            options={{title: t('orders.title')}}
          />
          <Stack.Screen
            name="OrderDetail"
            component={OrderDetailScreen}
            options={{title: t('order.details')}}
          />
          <Stack.Screen
            name="Settings"
            component={SettingsScreen}
            options={{title: t('settings.title')}}
          />
        </>
      ) : (
        <>
          <Stack.Screen
            name="Login"
            component={LoginScreen}
            options={{headerShown: false}}
          />
          <Stack.Screen
            name="Settings"
            component={SettingsScreen}
            options={{title: t('settings.title')}}
          />
        </>
      )}
    </Stack.Navigator>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <StatusBar barStyle="dark-content" backgroundColor={colors.bg} />
      <LanguageProvider>
        <AuthProvider>
          <NavigationContainer>
            <RootNavigator />
          </NavigationContainer>
        </AuthProvider>
      </LanguageProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  headerAction: {color: colors.primary, fontWeight: '700', fontSize: 15},
});
