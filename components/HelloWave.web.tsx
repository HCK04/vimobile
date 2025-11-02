import React from 'react';
import { StyleSheet, View } from 'react-native';
import { ThemedText } from '@/components/ThemedText';

export function HelloWave() {
  // Simple static fallback for web to avoid Reanimated runtime issues
  return (
    <View style={styles.container}>
      <ThemedText style={styles.text}>👋</ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    transform: [{ rotate: '0deg' }],
  },
  text: {
    fontSize: 28,
    lineHeight: 32,
    marginTop: -6,
  },
});