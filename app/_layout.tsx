import './reanimated-logger';
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Platform, View, Image, Text } from 'react-native';
import { useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

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

  // Check onboarding status on mount
  useEffect(() => {
    checkOnboardingStatus();
  }, []);

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

    if (!onboardingCompleted && !inOnboarding) {
      router.replace('/onboarding');
    }
  }, [loaded, onboardingCompleted, segments]);

  if (!loaded || onboardingCompleted === null) {
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
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="+not-found" />
      </Stack>
      <StatusBar style="auto" />
    </ThemeProvider>
  );
}
