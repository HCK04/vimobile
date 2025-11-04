import React, { useState } from 'react';
import { View, Text, Pressable, StyleSheet, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

const ONBOARDING_KEY = '@vi-sante:onboarding_completed';

export function DevTools() {
  const router = useRouter();
  const [isVisible, setIsVisible] = useState(false);

  const resetOnboarding = async () => {
    try {
      await AsyncStorage.removeItem(ONBOARDING_KEY);
      Alert.alert(
        'Onboarding Reset',
        'Onboarding has been reset. Restart the app to see it again.',
        [
          {
            text: 'Go to Onboarding',
            onPress: () => router.replace('/onboarding'),
          },
          { text: 'OK' },
        ]
      );
    } catch (error) {
      Alert.alert('Error', 'Failed to reset onboarding');
      console.error('Error resetting onboarding:', error);
    }
  };

  const checkOnboardingStatus = async () => {
    try {
      const value = await AsyncStorage.getItem(ONBOARDING_KEY);
      Alert.alert(
        'Onboarding Status',
        value === 'true' ? 'Completed ✓' : 'Not completed ✗'
      );
    } catch (error) {
      Alert.alert('Error', 'Failed to check status');
    }
  };

  const clearAllData = async () => {
    Alert.alert(
      'Clear All Data',
      'This will clear all AsyncStorage data. Are you sure?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Clear',
          style: 'destructive',
          onPress: async () => {
            try {
              await AsyncStorage.clear();
              Alert.alert('Success', 'All data cleared');
            } catch (error) {
              Alert.alert('Error', 'Failed to clear data');
            }
          },
        },
      ]
    );
  };

  if (!__DEV__) {
    return null; // Only show in development mode
  }

  return (
    <>
      {/* Floating Dev Button */}
      <Pressable
        style={styles.floatingButton}
        onPress={() => setIsVisible(!isVisible)}
      >
        <Ionicons name="bug" size={24} color="#FFFFFF" />
      </Pressable>

      {/* Dev Tools Panel */}
      {isVisible && (
        <View style={styles.panel}>
          <View style={styles.header}>
            <Text style={styles.headerText}>Dev Tools</Text>
            <Pressable onPress={() => setIsVisible(false)}>
              <Ionicons name="close" size={24} color="#111827" />
            </Pressable>
          </View>

          <Pressable style={styles.button} onPress={resetOnboarding}>
            <Ionicons name="refresh" size={20} color="#2563EB" />
            <Text style={styles.buttonText}>Reset Onboarding</Text>
          </Pressable>

          <Pressable style={styles.button} onPress={checkOnboardingStatus}>
            <Ionicons name="information-circle" size={20} color="#2563EB" />
            <Text style={styles.buttonText}>Check Status</Text>
          </Pressable>

          <Pressable style={styles.button} onPress={() => router.push('/onboarding')}>
            <Ionicons name="eye" size={20} color="#2563EB" />
            <Text style={styles.buttonText}>View Onboarding</Text>
          </Pressable>

          <Pressable style={[styles.button, styles.dangerButton]} onPress={clearAllData}>
            <Ionicons name="trash" size={20} color="#EF4444" />
            <Text style={[styles.buttonText, styles.dangerText]}>Clear All Data</Text>
          </Pressable>
        </View>
      )}
    </>
  );
}

const styles = StyleSheet.create({
  floatingButton: {
    position: 'absolute',
    bottom: 100,
    left: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#8B5CF6',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 8,
    zIndex: 9999,
  },
  panel: {
    position: 'absolute',
    bottom: 170,
    left: 20,
    right: 20,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 10,
    zIndex: 9998,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  headerText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: '#F8FAFC',
    marginBottom: 8,
  },
  buttonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
    marginLeft: 12,
  },
  dangerButton: {
    backgroundColor: '#FEF2F2',
  },
  dangerText: {
    color: '#EF4444',
  },
});
