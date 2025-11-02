import React, { useEffect, useState } from 'react';
import { View, Text, ActivityIndicator, StyleSheet, ScrollView, Pressable } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
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

  if (loading) return <View style={styles.center}><ActivityIndicator /></View>;
  if (!doctor) return <View style={styles.center}><Text>Profil introuvable</Text></View>;

  const name = doctor.name || `${doctor.prenom || ''} ${doctor.nom || ''}`.trim() || 'Médecin';
  const city = doctor.ville || doctor.profile_data?.ville || '';

  return (
    <ScrollView contentContainerStyle={{ padding: 16 }}>
      <Text style={styles.title}>{name}</Text>
      {!!city && <Text style={styles.sub}>{city}</Text>}
      {!!doctor.presentation && <Text style={styles.line}>{doctor.presentation}</Text>}
      <View style={{ height: 14 }} />
      {!!doctor.id && (
        <Pressable onPress={() => router.push({ pathname: '/rendez-vous/[doctorSlug]', params: { doctorSlug: String(doctor.slug || doctor.id) } })} style={styles.cta}>
          <Text style={styles.ctaText}>Prendre rendez-vous</Text>
        </Pressable>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 22, fontWeight: '800', color: '#111827' },
  sub: { color: '#6B7280', marginTop: 4 },
  line: { color: '#374151', marginTop: 10 },
  cta: { backgroundColor: '#2563EB', paddingVertical: 12, borderRadius: 10, alignItems: 'center' },
  ctaText: { color: '#fff', fontWeight: '700' },
});
