import React, { useEffect, useState } from 'react';
import { View, Text, ActivityIndicator, StyleSheet, TextInput, Pressable, Alert, ScrollView } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { apiClient } from '../../lib/apiClient';
import { api, getAuth } from '../../lib/api';

export default function OrganizationDetailScreen() {
  const router = useRouter();
  const params = useLocalSearchParams() as { id?: string };
  const [loading, setLoading] = useState(true);
  const [org, setOrg] = useState<any>(null);
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [reason, setReason] = useState('');
  const [patientName, setPatientName] = useState('');
  const [patientPhone, setPatientPhone] = useState('');
  const [patientEmail, setPatientEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const nextDays = (() => {
    const arr: { key: string; label: string; iso: string }[] = [];
    const months = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc'];
    for (let i = 0; i < 14; i++) {
      const d = new Date();
      d.setDate(d.getDate() + i);
      const iso = d.toISOString().slice(0, 10);
      const label = `${d.getDate()} ${months[d.getMonth()]}`;
      arr.push({ key: String(i), label, iso });
    }
    return arr;
  })();

  const commonTimes = ['09:00', '09:30', '10:00', '11:00', '14:00', '15:00', '16:00'];

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

  useEffect(() => {
    const { user } = getAuth();
    if (user) {
      setPatientName(user.name || '');
      setPatientPhone(user.phone || '');
      setPatientEmail(user.email || '');
    }
  }, []);

  const onBook = async () => {
    // Validate min +30 minutes rule
    if (date && time) {
      try {
        const candidate = new Date(`${date}T${time}:00`);
        const min = new Date();
        min.setMinutes(min.getMinutes() + 30);
        if (candidate < min) {
          Alert.alert('Heure invalide', 'Veuillez sélectionner une date et heure au moins 30 minutes dans le futur');
          return;
        }
      } catch {}
    }
    if (!date || !time) {
      Alert.alert('Champs requis', 'Veuillez saisir la date et l\'heure');
      return;
    }
    if (!patientName || !patientPhone) {
      Alert.alert('Informations requises', 'Veuillez renseigner votre nom et téléphone');
      return;
    }
    try {
      setSubmitting(true);
      const res: any = await api.createAppointment({
        organization_id: params.id,
        date,
        time,
        reason,
        patientName,
        patientPhone,
        patientEmail,
      });
      Alert.alert('Succès', 'Rendez-vous créé avec succès');
      setDate(''); setTime(''); setReason('');
      router.replace('/rendezvous' as any);
    } catch (e: any) {
      const status = e?.response?.status;
      const msg = e?.message || 'Erreur lors de la création du rendez-vous';
      if (status === 409) {
        Alert.alert('Créneau indisponible', 'Ce créneau n\'est plus disponible. Veuillez choisir un autre horaire.');
      } else if (status === 400) {
        Alert.alert('Heure invalide', 'Veuillez sélectionner une date et heure au moins 30 minutes dans le futur');
      } else if (status === 422) {
        Alert.alert('Validation', 'Veuillez vérifier les informations saisies');
      } else {
        Alert.alert('Erreur', msg);
      }
    } finally {
      setSubmitting(false);
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
        {/* Quick Date Selector */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 10 }}>
          <View style={{ flexDirection: 'row', gap: 8 }}>
            {nextDays.map((d) => (
              <Pressable
                key={d.key}
                onPress={() => setDate(d.iso)}
                style={[styles.chip, date === d.iso && styles.chipActive]}
              >
                <Text style={[styles.chipText, date === d.iso && styles.chipTextActive]}>{d.label}</Text>
              </Pressable>
            ))}
          </View>
        </ScrollView>
        <TextInput value={date} onChangeText={setDate} placeholder="Date (YYYY-MM-DD)" style={styles.input} />
        {/* Quick Time Selector */}
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 10 }}>
          {commonTimes.map((t) => (
            <Pressable key={t} onPress={() => setTime(t)} style={[styles.chip, time === t && styles.chipActive]}>
              <Text style={[styles.chipText, time === t && styles.chipTextActive]}>{t}</Text>
            </Pressable>
          ))}
        </View>
        <TextInput value={time} onChangeText={setTime} placeholder="Heure (HH:MM)" style={styles.input} />
        <TextInput value={reason} onChangeText={setReason} placeholder="Motif" style={styles.input} />
        <TextInput value={patientName} onChangeText={setPatientName} placeholder="Votre nom" style={styles.input} />
        <TextInput value={patientPhone} onChangeText={setPatientPhone} placeholder="Téléphone" style={styles.input} keyboardType="phone-pad" />
        <TextInput value={patientEmail} onChangeText={setPatientEmail} placeholder="Email (optionnel)" style={styles.input} keyboardType="email-address" />
        <Pressable onPress={onBook} style={[styles.cta, submitting && { opacity: 0.6 }]} disabled={submitting}>
          <Text style={styles.ctaText}>{submitting ? 'En cours...' : 'Confirmer'}</Text>
        </Pressable>
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
  chip: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 999, backgroundColor: '#F3F4F6', borderWidth: 1, borderColor: '#E5E7EB' },
  chipActive: { backgroundColor: '#2563EB', borderColor: '#2563EB' },
  chipText: { color: '#374151', fontWeight: '700', fontSize: 12 },
  chipTextActive: { color: '#FFFFFF' },
  cta: { backgroundColor: '#10B981', paddingVertical: 12, borderRadius: 10, alignItems: 'center' },
  ctaText: { color: '#fff', fontWeight: '700' },
});
