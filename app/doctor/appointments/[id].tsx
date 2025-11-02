import React, { useEffect, useState } from 'react';
import { View, Text, ActivityIndicator, StyleSheet, Pressable, Alert, ScrollView } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { apiClient } from '../../../lib/apiClient';

export default function DoctorAppointmentDetailsScreen() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [item, setItem] = useState<any>(null);

  const load = async () => {
    setLoading(true);
    try {
      const { data } = await apiClient.get(`/doctor/appointments/${encodeURIComponent(String(id || ''))}`);
      setItem(data);
    } catch (e) {
      setItem(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [id]);

  const updateStatus = async (status: 'confirmed' | 'cancelled') => {
    try {
      setActionLoading(true);
      await apiClient.put(`/doctor/appointments/${encodeURIComponent(String(id || ''))}/status`, { status });
      setItem((prev: any) => ({ ...prev, status }));
      Alert.alert('Succès', status === 'confirmed' ? 'Rendez-vous confirmé' : 'Rendez-vous refusé');
    } catch (e) {
      Alert.alert('Erreur', "Mise à jour impossible");
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) return <View style={styles.center}><ActivityIndicator /></View>;
  if (!item) return <View style={styles.center}><Text>Rendez-vous introuvable</Text></View>;

  return (
    <ScrollView contentContainerStyle={{ padding: 16 }}>
      <Text style={styles.title}>Détails du rendez-vous</Text>
      <Text style={styles.line}>Patient: {item.patient?.name || item.patient_name || '—'}</Text>
      <Text style={styles.line}>Téléphone: {item.patient_phone || item.patient?.phone || '—'}</Text>
      <Text style={styles.line}>Email: {item.patient_email || item.patient?.email || '—'}</Text>
      <Text style={styles.line}>Date: {item.date}</Text>
      <Text style={styles.line}>Heure: {item.time}</Text>
      <Text style={styles.line}>Motif: {item.reason || '—'}</Text>
      <Text style={styles.line}>Statut: {item.status}</Text>

      {item.status === 'pending' && (
        <View style={{ flexDirection: 'row', gap: 10, marginTop: 16 }}>
          <Pressable disabled={actionLoading} onPress={() => updateStatus('confirmed')} style={[styles.action, { backgroundColor: '#16A34A' }]}>
            <Text style={styles.actionText}>{actionLoading ? '...' : 'Confirmer'}</Text>
          </Pressable>
          <Pressable disabled={actionLoading} onPress={() => updateStatus('cancelled')} style={[styles.action, { backgroundColor: '#DC2626' }]}>
            <Text style={styles.actionText}>{actionLoading ? '...' : 'Refuser'}</Text>
          </Pressable>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 20, fontWeight: '800', marginBottom: 10 },
  line: { color: '#374151', marginTop: 6 },
  action: { paddingVertical: 10, paddingHorizontal: 14, borderRadius: 10 },
  actionText: { color: '#fff', fontWeight: '700' },
});
