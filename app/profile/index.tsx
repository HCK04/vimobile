import React, { useEffect, useState } from 'react';
import { View, Text, ActivityIndicator, StyleSheet, ScrollView, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { apiClient } from '../../lib/apiClient';

export default function ProfileScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [user, setUser] = useState<any>(null);

  const load = async () => {
    try {
      const { data } = await apiClient.get('/user/profile');
      setUser(data);
    } catch (e) {
      setUser(null);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    load();
  };

  if (loading) return (
    <SafeAreaView style={styles.container}>
      <View style={styles.center}><ActivityIndicator size="large" color="#2563EB" /></View>
    </SafeAreaView>
  );
  
  if (!user) return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#111827" />
        </Pressable>
        <Text style={styles.headerTitle}>Mon Profil</Text>
        <View style={{ width: 40 }} />
      </View>
      <View style={styles.center}>
        <Ionicons name="person-circle-outline" size={64} color="#D1D5DB" />
        <Text style={styles.emptyTitle}>Profil introuvable</Text>
        <Text style={styles.emptyText}>Veuillez vous connecter pour accéder à votre profil</Text>
        <Pressable onPress={() => router.push('/auth/patient' as any)} style={styles.loginButton}>
          <Ionicons name="log-in" size={20} color="#FFFFFF" />
          <Text style={styles.loginButtonText}>Se connecter</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );

  const fullName = user.name || `${user.first_name || ''} ${user.last_name || ''}`.trim() || 'Utilisateur';
  const initials = fullName.split(' ').map((n: string) => n[0]).slice(0, 2).join('').toUpperCase();
  
  // Extract patient profile data
  const profile = user.profile || user.patientProfile || user.patient_profile || {};
  const age = profile.age;
  const gender = profile.gender;
  const bloodType = profile.blood_type;
  
  // Parse allergies and chronic diseases (can be array or JSON string)
  const parseList = (value: any): string[] => {
    if (!value) return [];
    if (Array.isArray(value)) return value;
    if (typeof value === 'string') {
      try {
        const parsed = JSON.parse(value);
        return Array.isArray(parsed) ? parsed : [value];
      } catch {
        return value === 'Aucune' ? [] : [value];
      }
    }
    return [];
  };
  
  const allergies = parseList(profile.allergies);
  const chronicDiseases = parseList(profile.chronic_diseases);
  
  // Check if user is a patient (has patient-specific data)
  const isPatient = user.role?.name === 'patient' || user.role_id === 1;

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#111827" />
        </Pressable>
        <Text style={styles.headerTitle}>Mon Profil</Text>
        <Pressable onPress={onRefresh} style={styles.refreshButton}>
          <Ionicons name="refresh" size={20} color="#2563EB" />
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Profile Card */}
        <View style={styles.profileCard}>
          <View style={styles.avatarLarge}>
            <Text style={styles.avatarText}>{initials}</Text>
          </View>
          <Text style={styles.name}>{fullName}</Text>
          {!!user.email && <Text style={styles.email}>{user.email}</Text>}
        </View>

        {/* Personal Info Card */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Informations personnelles</Text>
          
          {!!user.name && (
            <View style={styles.infoRow}>
              <View style={styles.iconCircle}>
                <Ionicons name="person" size={20} color="#2563EB" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.infoLabel}>Nom complet</Text>
                <Text style={styles.infoText}>{user.name}</Text>
              </View>
            </View>
          )}
          
          {!!user.email && (
            <View style={styles.infoRow}>
              <View style={styles.iconCircle}>
                <Ionicons name="mail" size={20} color="#2563EB" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.infoLabel}>Email</Text>
                <Text style={styles.infoText}>{user.email}</Text>
              </View>
            </View>
          )}

          {!!user.phone && (
            <View style={styles.infoRow}>
              <View style={styles.iconCircle}>
                <Ionicons name="call" size={20} color="#2563EB" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.infoLabel}>Téléphone</Text>
                <Text style={styles.infoText}>{user.phone}</Text>
              </View>
            </View>
          )}

          {!!user.date_naissance && (
            <View style={styles.infoRow}>
              <View style={styles.iconCircle}>
                <Ionicons name="calendar" size={20} color="#2563EB" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.infoLabel}>Date de naissance</Text>
                <Text style={styles.infoText}>{user.date_naissance}</Text>
              </View>
            </View>
          )}

          {!!user.ville && (
            <View style={styles.infoRow}>
              <View style={styles.iconCircle}>
                <Ionicons name="location" size={20} color="#2563EB" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.infoLabel}>Ville</Text>
                <Text style={styles.infoText}>{user.ville}</Text>
              </View>
            </View>
          )}
        </View>

        {/* Health Info Card - Only for patients */}
        {isPatient && (age || gender || bloodType || allergies.length > 0 || chronicDiseases.length > 0) && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Informations de santé</Text>
            
            {!!age && (
              <View style={styles.infoRow}>
                <View style={styles.iconCircle}>
                  <Ionicons name="calendar" size={20} color="#10B981" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.infoLabel}>Âge</Text>
                  <Text style={styles.infoText}>{age} ans</Text>
                </View>
              </View>
            )}

            {!!gender && (
              <View style={styles.infoRow}>
                <View style={styles.iconCircle}>
                  <Ionicons name={gender === 'male' || gender === 'homme' ? 'male' : 'female'} size={20} color="#10B981" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.infoLabel}>Genre</Text>
                  <Text style={styles.infoText}>
                    {gender === 'male' || gender === 'homme' ? 'Homme' : gender === 'female' || gender === 'femme' ? 'Femme' : gender}
                  </Text>
                </View>
              </View>
            )}

            {!!bloodType && (
              <View style={styles.infoRow}>
                <View style={styles.iconCircle}>
                  <Ionicons name="water" size={20} color="#EF4444" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.infoLabel}>Groupe sanguin</Text>
                  <Text style={styles.infoText}>{bloodType}</Text>
                </View>
              </View>
            )}

            {allergies.length > 0 && (
              <View style={styles.infoRow}>
                <View style={styles.iconCircle}>
                  <Ionicons name="warning" size={20} color="#F59E0B" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.infoLabel}>Allergies</Text>
                  <Text style={styles.infoText}>{allergies.join(', ')}</Text>
                </View>
              </View>
            )}

            {chronicDiseases.length > 0 && (
              <View style={styles.infoRow}>
                <View style={styles.iconCircle}>
                  <Ionicons name="medkit" size={20} color="#8B5CF6" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.infoLabel}>Maladies chroniques</Text>
                  <Text style={styles.infoText}>{chronicDiseases.join(', ')}</Text>
                </View>
              </View>
            )}
          </View>
        )}

        {/* Actions Card */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Actions</Text>
          
          <Pressable style={styles.actionRow}>
            <Ionicons name="create" size={20} color="#2563EB" />
            <Text style={styles.actionText}>Modifier mon profil</Text>
            <Ionicons name="chevron-forward" size={20} color="#9CA3AF" style={{ marginLeft: 'auto' }} />
          </Pressable>

          <Pressable style={styles.actionRow}>
            <Ionicons name="lock-closed" size={20} color="#2563EB" />
            <Text style={styles.actionText}>Changer le mot de passe</Text>
            <Ionicons name="chevron-forward" size={20} color="#9CA3AF" style={{ marginLeft: 'auto' }} />
          </Pressable>

          <Pressable style={styles.actionRow}>
            <Ionicons name="notifications" size={20} color="#2563EB" />
            <Text style={styles.actionText}>Notifications</Text>
            <Ionicons name="chevron-forward" size={20} color="#9CA3AF" style={{ marginLeft: 'auto' }} />
          </Pressable>
        </View>

        {/* Logout Button */}
        <Pressable style={styles.logoutButton}>
          <Ionicons name="log-out" size={20} color="#EF4444" />
          <Text style={styles.logoutButtonText}>Se déconnecter</Text>
        </Pressable>

        <View style={{ height: 32 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
  },
  refreshButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#EFF6FF',
    borderRadius: 10,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
    marginTop: 16,
  },
  emptyText: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    marginTop: 8,
    marginBottom: 24,
  },
  loginButton: {
    backgroundColor: '#2563EB',
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  loginButtonText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 15,
  },
  scrollContent: {
    padding: 16,
  },
  profileCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
    marginBottom: 16,
  },
  avatarLarge: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#2563EB',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  avatarText: {
    color: '#FFFFFF',
    fontSize: 28,
    fontWeight: '800',
  },
  name: {
    fontSize: 22,
    fontWeight: '800',
    color: '#111827',
    textAlign: 'center',
  },
  email: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 4,
    textAlign: 'center',
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 16,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    marginBottom: 12,
  },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6B7280',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  infoText: {
    fontSize: 15,
    color: '#111827',
    fontWeight: '600',
    lineHeight: 22,
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  actionText: {
    fontSize: 15,
    color: '#111827',
    fontWeight: '600',
  },
  logoutButton: {
    backgroundColor: '#FEE2E2',
    paddingVertical: 14,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: '#FCA5A5',
  },
  logoutButtonText: {
    color: '#EF4444',
    fontWeight: '700',
    fontSize: 15,
  },
});
