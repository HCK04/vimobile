import React, { useCallback, useEffect, useState } from 'react';
import { SafeAreaView, View, Text, StyleSheet, Pressable, ScrollView, ActivityIndicator, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import { apiClient } from '../../lib/apiClient';
import { clearAuth } from '../../lib/auth';
import AsyncStorage from '@react-native-async-storage/async-storage';

const ONBOARDING_KEY = '@vi-sante:onboarding_completed';

export default function ProfilScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);

  const loadProfile = useCallback(async () => {
    try {
      setLoading(true);
      const { data } = await apiClient.get('/user/profile');
      setUser(data);
    } catch (error: any) {
      console.error('Failed to load profile:', error);
      if (error?.response?.status === 401) {
        // Unauthorized - redirect to login
        router.replace('/auth/patient');
      }
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  // Reload profile when tab is focused
  useFocusEffect(
    useCallback(() => {
      loadProfile();
    }, [loadProfile])
  );

  const handleLogout = async () => {
    Alert.alert(
      'Déconnexion',
      'Êtes-vous sûr de vouloir vous déconnecter ?',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Déconnecter',
          style: 'destructive',
          onPress: async () => {
            await clearAuth();
            await AsyncStorage.removeItem(ONBOARDING_KEY);
            router.replace('/onboarding');
          },
        },
      ]
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Mon profil</Text>
        </View>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator size="large" color="#2563EB" />
        </View>
      </SafeAreaView>
    );
  }

  const fullName = user?.name || 'Utilisateur Vi-santé';
  const email = user?.email || 'Email non renseigné';
  const initials = fullName
    .split(' ')
    .map((n: string) => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Mon profil</Text>
      </View>
      <ScrollView contentContainerStyle={{ padding: 16, gap: 12 }}>
        <View style={styles.card}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{initials}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.name}>{fullName}</Text>
            <Text style={styles.sub}>{email}</Text>
          </View>
          <Pressable style={styles.editBtn} onPress={() => router.push('/profile/edit')}>
            <Ionicons name="create" size={16} color="#2563EB" />
            <Text style={styles.editText}>Modifier</Text>
          </Pressable>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Santé</Text>
          <Pressable style={styles.row} onPress={() => router.push('/patient/sante' as any)}>
            <Ionicons name="medical" size={20} color="#10B981" />
            <Text style={styles.rowText}>Mon Dossier Santé</Text>
            <Ionicons name="chevron-forward" size={20} color="#9CA3AF" style={{ marginLeft: 'auto' }} />
          </Pressable>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Paramètres</Text>
          <Pressable style={styles.row} onPress={() => router.push('/patient/notifications' as any)}>
            <Ionicons name="notifications" size={20} color="#2563EB" />
            <Text style={styles.rowText}>Notifications</Text>
            <Ionicons name="chevron-forward" size={20} color="#9CA3AF" style={{ marginLeft: 'auto' }} />
          </Pressable>
          <View style={styles.row}>
            <Ionicons name="shield-checkmark" size={20} color="#2563EB" />
            <Text style={styles.rowText}>Confidentialité</Text>
            <Ionicons name="chevron-forward" size={20} color="#9CA3AF" style={{ marginLeft: 'auto' }} />
          </View>
          <View style={styles.row}>
            <Ionicons name="help-circle" size={20} color="#2563EB" />
            <Text style={styles.rowText}>Aide</Text>
            <Ionicons name="chevron-forward" size={20} color="#9CA3AF" style={{ marginLeft: 'auto' }} />
          </View>
        </View>

        <Pressable style={styles.logout} onPress={handleLogout}>
          <Ionicons name="log-out" size={18} color="#EF4444" />
          <Text style={styles.logoutText}>Se déconnecter</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#E5E7EB',
  },
  headerTitle: { fontSize: 20, fontWeight: '800', color: '#111827' },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  avatar: { width: 48, height: 48, borderRadius: 24, backgroundColor: '#60A5FA', alignItems: 'center', justifyContent: 'center' },
  avatarText: { color: '#fff', fontWeight: '800' },
  name: { fontWeight: '800', color: '#111827' },
  sub: { color: '#6B7280', fontSize: 12 },
  editBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 10, backgroundColor: '#EFF6FF' },
  editText: { color: '#2563EB', fontWeight: '700' },
  section: { backgroundColor: '#fff', borderRadius: 12, borderWidth: 1, borderColor: '#E5E7EB', padding: 8 },
  sectionTitle: { fontWeight: '800', color: '#111827', padding: 8 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 12, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: '#F3F4F6' },
  rowText: { color: '#111827', fontWeight: '600' },
  logout: { flexDirection: 'row', alignItems: 'center', gap: 8, justifyContent: 'center', marginTop: 16, padding: 12, borderRadius: 10, backgroundColor: '#FEE2E2', borderWidth: 1, borderColor: '#FCA5A5' },
  logoutText: { color: '#EF4444', fontWeight: '800' },
});