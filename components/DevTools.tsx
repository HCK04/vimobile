import React, { useState } from 'react';
import { View, Text, Pressable, StyleSheet, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import Constants from 'expo-constants';
import { setAuth, getAuth } from '../lib/api';

const ONBOARDING_KEY = '@vi-sante:onboarding_completed';

export function DevTools() {
  const router = useRouter();
  const [isVisible, setIsVisible] = useState(false);

  // Only show in development mode AND if not explicitly disabled
  // This ensures it won't show in production builds or Expo Go in production
  const isDevelopment = __DEV__ && Constants.expoConfig?.extra?.enableDevTools !== false;

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

  const skipToAccueil = async () => {
    try {
      await AsyncStorage.setItem(ONBOARDING_KEY, 'true');
      router.replace('/(tabs)/accueil');
    } catch (error) {
      Alert.alert('Error', 'Failed to skip to accueil');
      console.error('Error skipping to accueil:', error);
    }
  };

  const mockDoctorLogin = () => {
    const mockDoctor = {
      id: 999,
      name: 'Dr. Test (Dev)',
      email: 'doctor.test@dev.local',
      role_id: 2, // Doctor role
      role: { id: 2, name: 'medecin' },
    };
    const mockToken = 'dev-mock-token-' + Date.now();
    setAuth(mockToken, mockDoctor);
    Alert.alert(
      'Mock Login Success',
      'Logged in as Dr. Test (Dev)\nYou can now access doctor features.',
      [
        {
          text: 'Go to Dashboard',
          onPress: () => router.push('/doctor/dashboard' as any),
        },
        { text: 'OK' },
      ]
    );
  };

  const checkAuthStatus = () => {
    const { user, token } = getAuth();
    if (user && token) {
      Alert.alert(
        'Auth Status',
        `Logged in as: ${user.name || user.email || 'Unknown'}\nRole: ${user.role?.name || user.role_id || 'N/A'}`
      );
    } else {
      Alert.alert('Auth Status', 'Not logged in');
    }
  };

  const logout = () => {
    setAuth(null, null);
    Alert.alert('Logged Out', 'Auth cleared. You can now test login flows.');
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

  if (!isDevelopment) {
    return null; // Hide completely in production
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

          <Pressable style={[styles.button, { backgroundColor: '#F3F4F6' }]} onPress={skipToAccueil}>
            <Ionicons name="home" size={20} color="#16A34A" />
            <Text style={[styles.buttonText, { color: '#16A34A' }]}>Skip to Accueil</Text>
          </Pressable>

          {/* Auth Testing */}
          <View style={styles.divider} />
          <Text style={styles.sectionTitle}>Auth & Doctor Testing</Text>

          <Pressable style={[styles.button, { backgroundColor: '#EFF6FF' }]} onPress={mockDoctorLogin}>
            <Ionicons name="person-add" size={20} color="#2563EB" />
            <Text style={[styles.buttonText, { color: '#2563EB' }]}>Mock Doctor Login</Text>
          </Pressable>

          <Pressable style={styles.button} onPress={checkAuthStatus}>
            <Ionicons name="shield-checkmark" size={20} color="#2563EB" />
            <Text style={styles.buttonText}>Check Auth Status</Text>
          </Pressable>

          <Pressable style={styles.button} onPress={logout}>
            <Ionicons name="log-out" size={20} color="#F59E0B" />
            <Text style={[styles.buttonText, { color: '#F59E0B' }]}>Logout</Text>
          </Pressable>

          {/* Quick Navigate: Doctor Interfaces */}
          <Pressable style={styles.button} onPress={() => router.push('/doctor/dashboard' as any)}>
            <Ionicons name="medkit" size={20} color="#2563EB" />
            <Text style={styles.buttonText}>Go to Doctor Dashboard</Text>
          </Pressable>

          <Pressable style={styles.button} onPress={() => router.push('/auth/professional' as any)}>
            <Ionicons name="log-in" size={20} color="#2563EB" />
            <Text style={styles.buttonText}>Professional Login</Text>
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
  divider: {
    height: 1,
    backgroundColor: '#E5E7EB',
    marginVertical: 12,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#6B7280',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 8,
  },
});
