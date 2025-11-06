import React, { useEffect, useState } from 'react';
import { View, Text, ActivityIndicator, StyleSheet, ScrollView, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { apiClient } from '../../lib/apiClient';

export default function DoctorDetailScreen() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [doctor, setDoctor] = useState<any>(null);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      let profileData: any = null;
      const safeId = encodeURIComponent(String(id || ''));
      try {
        // Try unified endpoint first
        const res = await apiClient.get(`/professionals/${safeId}`);
        profileData = res.data;
      } catch (_) {
        const endpoints = [
          `/profile/${safeId}`,
          `/profiles/${safeId}`,
          `/users/${safeId}`,
          `/medecins/${safeId}`,
        ];
        for (const ep of endpoints) {
          try {
            const r = await apiClient.get(ep);
            profileData = r.data?.data ?? r.data;
            if (profileData) break;
          } catch (_) {}
        }
      }
      if (!cancelled) setDoctor(profileData);
      setLoading(false);
    };
    load();
    return () => { cancelled = true; };
  }, [id]);

  if (loading) return (
    <SafeAreaView style={styles.container}>
      <View style={styles.center}><ActivityIndicator size="large" color="#2563EB" /></View>
    </SafeAreaView>
  );
  
  if (!doctor) return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#111827" />
        </Pressable>
        <Text style={styles.headerTitle}>Profil</Text>
        <View style={{ width: 40 }} />
      </View>
      <View style={styles.center}>
        <Ionicons name="person-circle-outline" size={64} color="#D1D5DB" />
        <Text style={styles.emptyTitle}>Profil introuvable</Text>
        <Text style={styles.emptyText}>Ce professionnel n'existe pas ou a été supprimé</Text>
      </View>
    </SafeAreaView>
  );

  const name = doctor.name || `${doctor.prenom || ''} ${doctor.nom || ''}`.trim() || 'Médecin';
  const city = doctor.ville || doctor.profile_data?.ville || '';
  const specialty = doctor.specialty || doctor.profile_data?.specialty || doctor.specialite || '';
  const phone = doctor.phone || doctor.profile_data?.phone || doctor.telephone || '';
  const email = doctor.email || doctor.profile_data?.email || '';
  const address = doctor.adresse || doctor.profile_data?.adresse || '';

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#111827" />
        </Pressable>
        <Text style={styles.headerTitle}>Profil</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Profile Card */}
        <View style={styles.profileCard}>
          <View style={styles.avatarLarge}>
            <Ionicons name="person" size={40} color="#2563EB" />
          </View>
          <Text style={styles.name}>{name}</Text>
          {!!specialty && <Text style={styles.specialty}>{specialty}</Text>}
          {!!city && (
            <View style={styles.locationRow}>
              <Ionicons name="location" size={16} color="#6B7280" />
              <Text style={styles.locationText}>{city}</Text>
            </View>
          )}
        </View>

        {/* Info Card */}
        {(!!doctor.presentation || !!phone || !!email || !!address) && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Informations</Text>
            {!!doctor.presentation && (
              <View style={styles.infoRow}>
                <Ionicons name="information-circle" size={20} color="#2563EB" />
                <Text style={styles.infoText}>{doctor.presentation}</Text>
              </View>
            )}
            {!!phone && (
              <View style={styles.infoRow}>
                <Ionicons name="call" size={20} color="#2563EB" />
                <Text style={styles.infoText}>{phone}</Text>
              </View>
            )}
            {!!email && (
              <View style={styles.infoRow}>
                <Ionicons name="mail" size={20} color="#2563EB" />
                <Text style={styles.infoText}>{email}</Text>
              </View>
            )}
            {!!address && (
              <View style={styles.infoRow}>
                <Ionicons name="location" size={20} color="#2563EB" />
                <Text style={styles.infoText}>{address}</Text>
              </View>
            )}
          </View>
        )}

        {/* CTA Button */}
        {!!doctor.id && (
          <Pressable 
            onPress={() => router.push({ pathname: '/patient/book-appointment', params: { doctorId: String(doctor.id), doctorName: name } } as any)} 
            style={styles.cta}
          >
            <Ionicons name="calendar" size={20} color="#FFFFFF" />
            <Text style={styles.ctaText}>Prendre rendez-vous</Text>
          </Pressable>
        )}

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
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  name: {
    fontSize: 22,
    fontWeight: '800',
    color: '#111827',
    textAlign: 'center',
  },
  specialty: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2563EB',
    marginTop: 4,
    textAlign: 'center',
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 8,
  },
  locationText: {
    fontSize: 14,
    color: '#6B7280',
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
  infoText: {
    flex: 1,
    fontSize: 15,
    color: '#374151',
    lineHeight: 22,
  },
  cta: {
    backgroundColor: '#2563EB',
    paddingVertical: 14,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    shadowColor: '#1D4ED8',
    shadowOpacity: 0.2,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  ctaText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 15,
  },
});
