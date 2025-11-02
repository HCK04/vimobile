// Ensure Reanimated logger config is set before Expo Router initializes anything.
import './app/reanimated-logger';
// Hand off to Expo Router's standard entry.
import 'expo-router/entry';