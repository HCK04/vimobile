import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, ActivityIndicator, Pressable, Alert, StyleSheet } from 'react-native';
import { apiClient } from '../../lib/apiClient';

export default function MesRDVScreen() {
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState<any[]>([]);

  const load = async () => {
    setLoading(true);
    try {
      const { data } = await apiClient.get('/appointments');
      setItems(Array.isArray(data) ? data : []);
    } catch (e) {
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const cancel = async (id: number) => {
    try {
      await apiClient.post(`/appointments/${id}/cancel`);
      setItems((prev) => prev.map(a => a.id === id ? { ...a, status: 'cancelled' } : a));
    } catch (e) {
      Alert.alert('Erreur', "Impossible d'annuler ce rendez-vous");
    }
  };

  if (loading) return <View style={styles.center}><ActivityIndicator /></View>;

  return (
    <View style={{ padding: 16 }}>
      <Text style={styles.title}>Mes rendez-vous</Text>
      <FlatList
        data={items}
        keyExtractor={(it) => String(it.id)}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <Text style={styles.name}>{item.doctor_name || 'Professionnel'}</Text>
            <Text style={styles.sub}>{item.date} • {item.time}</Text>
            <Text style={styles.sub}>{item.reason || ''}</Text>
            {['pending','confirmed','scheduled'].includes(String(item.status)) && (
              <Pressable onPress={() => cancel(item.id)} style={styles.cancel}><Text style={styles.cancelText}>Annuler</Text></Pressable>
            )}
          </View>
        )}
        ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 20, fontWeight: '800', marginBottom: 12 },
  card: { backgroundColor: '#fff', borderRadius: 12, padding: 12, borderWidth: 1, borderColor: '#E5E7EB' },
  name: { fontWeight: '700', color: '#111827' },
  sub: { color: '#6B7280', marginTop: 2 },
  cancel: { marginTop: 8, alignSelf: 'flex-start', backgroundColor: '#FEE2E2', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8 },
  cancelText: { color: '#B91C1C', fontWeight: '700' },
});
