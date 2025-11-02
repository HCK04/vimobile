import React, { useEffect, useState } from 'react';
import { View, Text, ActivityIndicator, FlatList, Pressable, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { apiClient } from '../../lib/apiClient';
import { getAuth } from '../../lib/api';

export default function DoctorDashboardScreen() {
  const router = useRouter();
  const { user } = getAuth();
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState<any[]>([]);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      try {
        const { data } = await apiClient.get('/doctor/appointments');
        if (!cancelled) setItems(Array.isArray(data) ? data : []);
      } catch (e) {
        if (!cancelled) setItems([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => { cancelled = true; };
  }, []);

  if (!user) {
    return (
      <View style={styles.center}>
        <Text style={styles.text}>Espace professionnel sécurisé</Text>
        <Pressable onPress={() => router.push('/auth/professional' as any)} style={styles.cta}><Text style={styles.ctaText}>Se connecter</Text></Pressable>
      </View>
    );
  }

  if (loading) return <View style={styles.center}><ActivityIndicator /></View>;

  return (
    <View style={{ padding: 16 }}>
      <Text style={styles.title}>Mes rendez-vous</Text>
      <FlatList
        data={items}
        keyExtractor={(it) => String(it.id)}
        renderItem={({ item }) => (
          <Pressable onPress={() => router.push({ pathname: '/doctor/appointments/[id]', params: { id: String(item.id) } } as any)} style={styles.card}>
            <Text style={styles.name}>{item.patient?.name || item.patient_name || 'Patient'}</Text>
            <Text style={styles.sub}>{item.date} • {item.time}</Text>
            <Text style={styles.sub}>Statut: {item.status}</Text>
          </Pressable>
        )}
        ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 16 },
  text: { color: '#374151', marginBottom: 10 },
  cta: { backgroundColor: '#2563EB', paddingVertical: 12, paddingHorizontal: 16, borderRadius: 10 },
  ctaText: { color: '#fff', fontWeight: '700' },
  title: { fontSize: 22, fontWeight: '800', marginBottom: 12 },
  card: { backgroundColor: '#fff', borderRadius: 12, padding: 12, borderWidth: 1, borderColor: '#E5E7EB' },
  name: { fontWeight: '700', color: '#111827' },
  sub: { color: '#6B7280', marginTop: 2 },
});
