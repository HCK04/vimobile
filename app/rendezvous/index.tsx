import React, { useState } from 'react';
import { View, Text, TextInput, Pressable, StyleSheet, Alert } from 'react-native';
import { apiClient } from '../../lib/apiClient';

export default function RendezVousScreen() {
  const [professionalId, setProfessionalId] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [reason, setReason] = useState('');

  const onBook = async () => {
    try {
      if (!professionalId) return Alert.alert('Info', 'Veuillez renseigner l\'identifiant du professionnel');
      await apiClient.post('/rendezvous', { professional_id: professionalId, date, time, reason });
      Alert.alert('Succès', 'Rendez-vous créé');
      setProfessionalId(''); setDate(''); setTime(''); setReason('');
    } catch (e) {
      Alert.alert('Erreur', "Impossible de créer le rendez-vous");
    }
  };

  return (
    <View style={{ padding: 16 }}>
      <Text style={styles.title}>Rendez-vous</Text>
      <TextInput value={professionalId} onChangeText={setProfessionalId} placeholder="ID professionnel" style={styles.input} />
      <TextInput value={date} onChangeText={setDate} placeholder="Date (YYYY-MM-DD)" style={styles.input} />
      <TextInput value={time} onChangeText={setTime} placeholder="Heure (HH:MM)" style={styles.input} />
      <TextInput value={reason} onChangeText={setReason} placeholder="Motif" style={styles.input} />
      <Pressable onPress={onBook} style={styles.cta}><Text style={styles.ctaText}>Confirmer</Text></Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  title: { fontSize: 22, fontWeight: '800', marginBottom: 12 },
  input: { backgroundColor: '#F8FAFC', paddingHorizontal: 12, paddingVertical: 12, borderRadius: 10, marginBottom: 10 },
  cta: { backgroundColor: '#2563EB', paddingVertical: 12, borderRadius: 10, alignItems: 'center' },
  ctaText: { color: '#fff', fontWeight: '700' },
});
