import './reanimated-logger';
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Platform, View, Image, Text } from 'react-native';
import { useEffect, useState, useRef } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { loadAuthFromStorage } from '../lib/auth';
import { addNotificationResponseListener, handleNotificationNavigation, setupPushNotifications } from '../lib/pushNotifications';
import type * as Notifications from 'expo-notifications';

// Load Reanimated only on native. On web, we use lightweight shims.
if (Platform.OS !== 'web') {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  require('react-native-reanimated');
}

import { useColorScheme } from '@/hooks/useColorScheme';

const ONBOARDING_KEY = '@vi-sante:onboarding_completed';

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const router = useRouter();
  const segments = useSegments();
  const [loaded] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
  });
  const [onboardingCompleted, setOnboardingCompleted] = useState<boolean | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const notificationListener = useRef<any>();
  const responseListener = useRef<any>();

  // Check onboarding status on mount
  useEffect(() => {
    checkOnboardingStatus();
  }, []);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const auth = await loadAuthFromStorage();
        // Setup push if user is already logged in
        if (auth.token && auth.user) {
          try {
            await setupPushNotifications();
          } catch (error) {
            console.error('[Layout] Push setup failed:', error);
          }
        }
      } finally {
        if (mounted) setAuthReady(true);
      }
    })();
    return () => { mounted = false; };
  }, []);

  // Setup notification listeners
  useEffect(() => {
    // Listen for notification taps
    responseListener.current = addNotificationResponseListener((response: any) => {
      const data = response.notification.request.content.data;
      handleNotificationNavigation(data, router);
    });

    return () => {
      if (responseListener.current) {
        responseListener.current.remove();
      }
    };
  }, [router]);

  const checkOnboardingStatus = async () => {
    try {
      const value = await AsyncStorage.getItem(ONBOARDING_KEY);
      setOnboardingCompleted(value === 'true');
    } catch (error) {
      console.error('Error checking onboarding status:', error);
      setOnboardingCompleted(false);
    }
  };

  // Navigate to onboarding if not completed
  useEffect(() => {
    if (!loaded || onboardingCompleted === null) return;

    const inOnboarding = segments[0] === 'onboarding';
    const inAuth = segments[0] === 'auth';

    // Allow access to auth routes even if onboarding not completed
    // because auth screens will complete onboarding after successful login/register
    if (!onboardingCompleted && !inOnboarding && !inAuth) {
      router.replace('/onboarding');
    }
  }, [loaded, onboardingCompleted, segments]);

  if (!loaded || onboardingCompleted === null || !authReady) {
    return (
      <View style={{ flex: 1, backgroundColor: '#1E40AF', alignItems: 'center', justifyContent: 'center' }}>
        <Image
          source={require('../assets/images/visante.png')}
          style={{ width: 72, height: 72, marginBottom: 10 }}
          resizeMode="contain"
        />
        <Text style={{ color: '#DBEAFE', fontSize: 20, fontWeight: '800' }}>Vi-Santé</Text>
        <StatusBar style="light" />
      </View>
    );
  }

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <Stack>
        <Stack.Screen name="onboarding" options={{ headerShown: false }} />
        <Stack.Screen name="auth/patient" options={{ headerShown: false }} />
        <Stack.Screen name="auth/professional" options={{ headerShown: false }} />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="doctor/dashboard" options={{ headerShown: false }} />
        <Stack.Screen name="doctor/services/index" options={{ headerShown: false }} />
        <Stack.Screen name="doctor/profile/absence" options={{ headerShown: false }} />
        <Stack.Screen name="+not-found" />
      </Stack>
      <StatusBar style="auto" />
    </ThemeProvider>
  );
}
