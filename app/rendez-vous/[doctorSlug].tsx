import React, { useEffect, useState } from 'react';
import { View, Text, TextInput, Pressable, StyleSheet, ActivityIndicator, Alert, ScrollView } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { apiClient } from '../../lib/apiClient';

export default function RendezVousSlugScreen() {
  const { doctorSlug } = useLocalSearchParams<{ doctorSlug?: string }>();
  const [loading, setLoading] = useState(true);
  const [doctorId, setDoctorId] = useState<string | null>(null);
  const [doctor, setDoctor] = useState<any>(null);
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [reason, setReason] = useState('');

  useEffect(() => {
    let cancelled = false;
    const resolveId = async () => {
      setLoading(true);
      try {
        const safe = encodeURIComponent(String(doctorSlug || ''));
        try {
          const resp = await apiClient.get(`/profiles/slug/${safe}`);
          const payload = resp?.data?.data ?? resp?.data;
          if (payload?.id) setDoctorId(String(payload.id));
        } catch (_) {}
        if (!cancelled && !doctorId) {
          for (const base of ['pharmacies', 'parapharmacies']) {
            try {
              const r = await apiClient.get(`/${base}/slug/${encodeURIComponent(String(doctorSlug || ''))}`);
              const p = r?.data?.data ?? r?.data;
              if (p?.id) { setDoctorId(String(p.id)); break; }
            } catch (_) {}
          }
        }
      } catch (_) {
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    resolveId();
    return () => { cancelled = true; };
  }, [doctorSlug]);

  useEffect(() => {
    if (!doctorId) return;
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      try {
        const response = await apiClient.get(`/rendezvous/professional/${doctorId}`);
        if (!cancelled) setDoctor(response.data);
      } catch (e) {
        if (!cancelled) setDoctor(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => { cancelled = true; };
  }, [doctorId]);

  const onBook = async () => {
    try {
      if (!doctorId) return;
      await apiClient.post('/rendezvous', { professional_id: doctorId, date, time, reason });
      Alert.alert('Succès', 'Rendez-vous confirmé');
      setDate(''); setTime(''); setReason('');
    } catch (e) {
      Alert.alert('Erreur', "Impossible de créer le rendez-vous");
    }
  };

  if (loading) return <View style={styles.center}><ActivityIndicator /></View>;

  return (
    <ScrollView contentContainerStyle={{ padding: 16 }}>
      <Text style={styles.title}>Rendez-vous</Text>
      {!!doctor && <Text style={styles.sub}>Avec: {doctor?.name || doctor?.nom || 'Professionnel'}</Text>}
      <View style={styles.form}>
        <TextInput value={date} onChangeText={setDate} placeholder="Date (YYYY-MM-DD)" style={styles.input} />
        <TextInput value={time} onChangeText={setTime} placeholder="Heure (HH:MM)" style={styles.input} />
        <TextInput value={reason} onChangeText={setReason} placeholder="Motif" style={styles.input} />
        <Pressable onPress={onBook} style={styles.cta}><Text style={styles.ctaText}>Confirmer</Text></Pressable>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 22, fontWeight: '800', color: '#111827' },
  sub: { color: '#6B7280', marginTop: 4 },
  form: { marginTop: 16 },
  input: { backgroundColor: '#F8FAFC', paddingHorizontal: 12, paddingVertical: 12, borderRadius: 10, marginBottom: 10 },
  cta: { backgroundColor: '#2563EB', paddingVertical: 12, borderRadius: 10, alignItems: 'center' },
  ctaText: { color: '#fff', fontWeight: '700' },
});
