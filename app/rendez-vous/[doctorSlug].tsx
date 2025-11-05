import React, { useEffect, useState } from 'react';
import { View, Text, TextInput, Pressable, StyleSheet, ActivityIndicator, Alert, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { apiClient } from '../../lib/apiClient';

export default function RendezVousSlugScreen() {
  const router = useRouter();
  const { doctorSlug } = useLocalSearchParams<{ doctorSlug?: string }>();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
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
    if (!doctorId || !date || !time || !reason) {
      Alert.alert('Champs requis', 'Veuillez remplir tous les champs');
      return;
    }
    
    setSubmitting(true);
    try {
      const dateTime = `${date} ${time}:00`;
      await apiClient.post('/patient/appointments', { 
        target_user_id: doctorId,
        target_role: 'medecin',
        date_time: dateTime,
        reason 
      });
      Alert.alert(
        'Succès', 
        'Votre rendez-vous a été confirmé',
        [
          { 
            text: 'Voir mes rendez-vous', 
            onPress: () => router.push('/patient/mes-rdv' as any) 
          },
          { text: 'OK', onPress: () => router.back() }
        ]
      );
      setDate(''); setTime(''); setReason('');
    } catch (e: any) {
      const msg = e?.response?.data?.message || "Impossible de créer le rendez-vous";
      Alert.alert('Erreur', msg);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return (
    <SafeAreaView style={styles.container}>
      <View style={styles.center}><ActivityIndicator size="large" color="#2563EB" /></View>
    </SafeAreaView>
  );

  const doctorName = doctor?.name || doctor?.nom || 'Professionnel';

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#111827" />
        </Pressable>
        <Text style={styles.headerTitle}>Nouveau rendez-vous</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Doctor Info Card */}
        {!!doctor && (
          <View style={styles.infoCard}>
            <View style={styles.doctorIcon}>
              <Ionicons name="person" size={24} color="#2563EB" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.infoLabel}>Rendez-vous avec</Text>
              <Text style={styles.doctorName}>{doctorName}</Text>
            </View>
          </View>
        )}

        {/* Form Card */}
        <View style={styles.formCard}>
          <Text style={styles.formTitle}>Détails du rendez-vous</Text>
          
          {/* Date Input */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Date</Text>
            <View style={styles.inputWrap}>
              <Ionicons name="calendar-outline" size={20} color="#6B7280" style={styles.inputIcon} />
              <TextInput 
                value={date} 
                onChangeText={setDate} 
                placeholder="YYYY-MM-DD (ex: 2025-11-10)" 
                placeholderTextColor="#9CA3AF"
                style={styles.input}
              />
            </View>
          </View>

          {/* Time Input */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Heure</Text>
            <View style={styles.inputWrap}>
              <Ionicons name="time-outline" size={20} color="#6B7280" style={styles.inputIcon} />
              <TextInput 
                value={time} 
                onChangeText={setTime} 
                placeholder="HH:MM (ex: 14:30)" 
                placeholderTextColor="#9CA3AF"
                style={styles.input}
              />
            </View>
          </View>

          {/* Reason Input */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Motif de consultation</Text>
            <View style={styles.inputWrap}>
              <Ionicons name="document-text-outline" size={20} color="#6B7280" style={styles.inputIcon} />
              <TextInput 
                value={reason} 
                onChangeText={setReason} 
                placeholder="Décrivez le motif de votre visite" 
                placeholderTextColor="#9CA3AF"
                style={[styles.input, styles.textArea]}
                multiline
                numberOfLines={3}
                textAlignVertical="top"
              />
            </View>
          </View>
        </View>

        {/* Info Banner */}
        <View style={styles.infoBanner}>
          <Ionicons name="information-circle" size={20} color="#2563EB" />
          <Text style={styles.infoBannerText}>
            Vous recevrez une confirmation par email une fois votre rendez-vous validé par le professionnel.
          </Text>
        </View>

        {/* Submit Button */}
        <Pressable 
          onPress={onBook} 
          style={[styles.cta, submitting && styles.ctaDisabled]}
          disabled={submitting}
        >
          {submitting ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <>
              <Ionicons name="checkmark-circle" size={20} color="#FFFFFF" />
              <Text style={styles.ctaText}>Confirmer le rendez-vous</Text>
            </>
          )}
        </Pressable>

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
  },
  scrollContent: {
    padding: 16,
  },
  infoCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
    marginBottom: 16,
  },
  doctorIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6B7280',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  doctorName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
    marginTop: 2,
  },
  formCard: {
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
  formTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 16,
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  inputWrap: {
    position: 'relative',
  },
  inputIcon: {
    position: 'absolute',
    left: 12,
    top: 14,
    zIndex: 1,
  },
  input: {
    paddingLeft: 40,
    paddingRight: 12,
    paddingVertical: 14,
    borderRadius: 12,
    fontSize: 15,
    color: '#111827',
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  textArea: {
    minHeight: 80,
    paddingTop: 14,
  },
  infoBanner: {
    backgroundColor: '#EFF6FF',
    borderRadius: 12,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#DBEAFE',
  },
  infoBannerText: {
    flex: 1,
    fontSize: 13,
    color: '#1E40AF',
    lineHeight: 18,
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
  ctaDisabled: {
    backgroundColor: '#93C5FD',
    shadowOpacity: 0,
  },
  ctaText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 15,
  },
});
