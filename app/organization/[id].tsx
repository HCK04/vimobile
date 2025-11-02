import React, { useEffect, useState } from 'react';
import { View, Text, ActivityIndicator, StyleSheet, TextInput, Pressable, Alert, ScrollView } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { apiClient } from '../../lib/apiClient';

export default function OrganizationDetailScreen() {
  const params = useLocalSearchParams() as { id?: string };
  const [loading, setLoading] = useState(true);
  const [org, setOrg] = useState<any>(null);
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [reason, setReason] = useState('');

  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      setLoading(true);
      try {
        const res = await apiClient.get(`/organizations/${encodeURIComponent(String(params.id || ''))}`);
        if (!cancelled) setOrg(res.data);
      } catch (e) {
        if (!cancelled) setOrg(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    run();
    return () => { cancelled = true; };
  }, [params.id]);

  const onBook = async () => {
    try {
      await apiClient.post('/appointments', { organization_id: params.id, date, time, reason });
      Alert.alert('Succès', 'Rendez-vous demandé');
      setDate(''); setTime(''); setReason('');
    } catch (e) {
      Alert.alert('Erreur', "Impossible de créer le rendez-vous");
    }
  };

  if (loading) return <View style={styles.center}><ActivityIndicator /></View>;
  if (!org) return <View style={styles.center}><Text>Établissement introuvable</Text></View>;

  return (
    <ScrollView contentContainerStyle={{ padding: 16 }}>
      <Text style={styles.title}>{org.name || org.nom_clinique || org.nom_pharmacie || org.nom_centre || 'Établissement'}</Text>
      {!!org.ville && <Text style={styles.sub}>{org.ville}</Text>}
      {!!org.description && <Text style={styles.line}>{org.description}</Text>}

      <View style={styles.form}>
        <Text style={styles.formTitle}>Prendre rendez-vous</Text>
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
  line: { color: '#374151', marginTop: 10 },
  form: { marginTop: 20, backgroundColor: '#fff', borderRadius: 12, padding: 12, borderWidth: 1, borderColor: '#E5E7EB' },
  formTitle: { fontWeight: '700', marginBottom: 8 },
  input: { backgroundColor: '#F8FAFC', paddingHorizontal: 12, paddingVertical: 12, borderRadius: 10, marginBottom: 10 },
  cta: { backgroundColor: '#10B981', paddingVertical: 12, borderRadius: 10, alignItems: 'center' },
  ctaText: { color: '#fff', fontWeight: '700' },
});
