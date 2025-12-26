import React, { useCallback, useEffect, useState } from 'react';
import { SafeAreaView, View, Text, StyleSheet, Pressable, ScrollView, ActivityIndicator, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import * as Application from 'expo-application';
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
      <ScrollView contentContainerStyle={{ padding: 16 }}>
        <View style={[styles.card, { marginBottom: 12 }]}>
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

        {user?.subscription && (
          <View style={[styles.card, { marginBottom: 12, flexDirection: 'column', alignItems: 'flex-start' }]}>
            <View style={styles.row}>
              <Ionicons name="star" size={20} color="#F59E0B" />
              <Text style={styles.label}>Abonnement</Text>
            </View>
            <Text style={styles.value}>{user.subscription.plan_name || 'Premium'}</Text>
            <Text style={styles.sub}>
              Expire le {new Date(user.subscription.end_date).toLocaleDateString('fr-FR')}
            </Text>
          </View>
        )}

        <View style={[styles.section, { marginBottom: 12 }]}>
          <Pressable style={styles.menuItem} onPress={() => router.push('/patient/sante')}>
            <View style={styles.menuLeft}>
              <Ionicons name="fitness" size={20} color="#2563EB" />
              <Text style={styles.rowText}>Dossier médical</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
          </Pressable>

          <View style={styles.divider} />

          <Pressable style={styles.menuItem} onPress={() => router.push('/patient/privacy')}>
            <View style={styles.menuLeft}>
              <Ionicons name="shield-checkmark" size={20} color="#2563EB" />
              <Text style={styles.rowText}>Confidentialité</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
          </Pressable>
        </View>

        <View style={styles.section}>
          <Pressable style={styles.menuItem} onPress={handleLogout}>
            <View style={styles.menuLeft}>
              <Ionicons name="log-out" size={20} color="#EF4444" />
              <Text style={[styles.rowText, { color: '#EF4444' }]}>Déconnexion</Text>
            </View>
          </Pressable>

          <View style={styles.divider} />

          <Pressable
            style={styles.menuItem}
            onPress={() => {
              Alert.alert(
                'Supprimer mon compte',
                'Cette action est irréversible. Toutes vos données seront définitivement supprimées. Êtes-vous sûr ?',
                [
                  { text: 'Annuler', style: 'cancel' },
                  {
                    text: 'Supprimer définitivement',
                    style: 'destructive',
                    onPress: async () => {
                      try {
                        await apiClient.delete('/user');
                        await clearAuth();
                        await AsyncStorage.removeItem(ONBOARDING_KEY);
                        Alert.alert('Compte supprimé', 'Votre compte a été supprimé avec succès.');
                        router.replace('/onboarding');
                      } catch (error: any) {
                        const msg = error?.response?.data?.message || 'Impossible de supprimer le compte';
                        Alert.alert('Erreur', msg);
                      }
                    },
                  },
                ]
              );
            }}
          >
            <View style={styles.menuLeft}>
              <Ionicons name="trash" size={20} color="#EF4444" />
              <Text style={[styles.rowText, { color: '#EF4444' }]}>Supprimer mon compte</Text>
            </View>
          </Pressable>
        </View>

        {/* App Version */}
        <Text style={styles.versionText}>
          Vi-Santé v{Application.nativeApplicationVersion || '1.0.0'}
        </Text>
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
  label: { fontWeight: '700', color: '#111827', fontSize: 14 },
  value: { fontWeight: '600', color: '#2563EB', fontSize: 16, marginTop: 4 },
  menuItem: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 12 },
  menuLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  divider: { height: StyleSheet.hairlineWidth, backgroundColor: '#E5E7EB', marginHorizontal: 12 },
  logout: { flexDirection: 'row', alignItems: 'center', gap: 8, justifyContent: 'center', marginTop: 16, padding: 12, borderRadius: 10, backgroundColor: '#FEE2E2', borderWidth: 1, borderColor: '#FCA5A5' },
  logoutText: { color: '#EF4444', fontWeight: '800' },
  subscriptionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#F3F4F6'
  },
  subscriptionBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  subscriptionType: {
    color: '#92400E',
    fontWeight: '700',
    fontSize: 13,
  },
  subscriptionStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  statusLabel: {
    color: '#10B981',
    fontWeight: '600',
    fontSize: 12,
  },
  deleteAccount: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    justifyContent: 'center',
    marginTop: 8,
    padding: 12,
    borderRadius: 10,
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  deleteAccountText: {
    color: '#9CA3AF',
    fontWeight: '600',
  },
  versionText: {
    textAlign: 'center',
    color: '#9CA3AF',
    fontSize: 12,
    marginTop: 24,
    marginBottom: 16,
  },
});