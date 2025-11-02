import './reanimated-logger';
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Platform, View, Image, Text } from 'react-native';

// Load Reanimated only on native. On web, we use lightweight shims.
if (Platform.OS !== 'web') {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  require('react-native-reanimated');
}

import { useColorScheme } from '@/hooks/useColorScheme';

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const [loaded] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
  });

  if (!loaded) {
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
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="+not-found" />
      </Stack>
      <StatusBar style="auto" />
    </ThemeProvider>
  );
}
