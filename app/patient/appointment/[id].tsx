import React, { useEffect, useState } from 'react';
import { View, Text, ActivityIndicator, StyleSheet, Pressable, Alert } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { apiClient } from '../../../lib/apiClient';

export default function AppointmentDetailsScreen() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const [loading, setLoading] = useState(true);
  const [item, setItem] = useState<any>(null);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      try {
        const { data } = await apiClient.get(`/appointments/${encodeURIComponent(String(id || ''))}`);
        if (!cancelled) setItem(data);
      } catch (e) {
        if (!cancelled) setItem(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => { cancelled = true; };
  }, [id]);

  const cancel = async () => {
    try {
      await apiClient.patch(`/appointments/${id}/cancel`);
      setItem((prev: any) => ({ ...prev, status: 'cancelled' }));
    } catch (e) {
      Alert.alert('Erreur', "Annulation impossible");
    }
  };

  if (loading) return <View style={styles.center}><ActivityIndicator /></View>;
  if (!item) return <View style={styles.center}><Text>RDV introuvable</Text></View>;

  return (
    <View style={{ padding: 16 }}>
      <Text style={styles.title}>Détails du rendez-vous</Text>
      <Text style={styles.line}>Médecin: {item.doctor_name || '—'}</Text>
      <Text style={styles.line}>Date: {item.date}</Text>
      <Text style={styles.line}>Heure: {item.time}</Text>
      <Text style={styles.line}>Motif: {item.reason || '—'}</Text>
      <Text style={styles.line}>Statut: {item.status}</Text>
      {['pending','confirmed','scheduled'].includes(String(item.status)) && (
        <Pressable onPress={cancel} style={styles.cta}><Text style={styles.ctaText}>Annuler</Text></Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 20, fontWeight: '800', marginBottom: 10 },
  line: { marginTop: 6, color: '#374151' },
  cta: { marginTop: 14, alignSelf: 'flex-start', backgroundColor: '#FEE2E2', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8 },
  ctaText: { color: '#B91C1C', fontWeight: '700' },
});
