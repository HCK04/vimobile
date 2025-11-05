import React, { useEffect, useState } from 'react';
import { View, Text, ActivityIndicator, StyleSheet, Pressable, Alert, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { apiClient } from '../../../lib/apiClient';

export default function AppointmentDetailsScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id?: string }>();
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState(false);
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
    Alert.alert(
      'Annuler le rendez-vous',
      'Êtes-vous sûr de vouloir annuler ce rendez-vous ?',
      [
        { text: 'Non', style: 'cancel' },
        {
          text: 'Oui, annuler',
          style: 'destructive',
          onPress: async () => {
            setCancelling(true);
            try {
              await apiClient.post(`/appointments/${id}/cancel`);
              setItem((prev: any) => ({ ...prev, status: 'cancelled' }));
              Alert.alert('Succès', 'Rendez-vous annulé');
            } catch (e) {
              Alert.alert('Erreur', "Impossible d'annuler ce rendez-vous");
            } finally {
              setCancelling(false);
            }
          },
        },
      ]
    );
  };

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'confirmed': return { bg: '#D1FAE5', text: '#065F46', icon: 'checkmark-circle' };
      case 'pending': return { bg: '#FEF3C7', text: '#92400E', icon: 'time' };
      case 'cancelled': return { bg: '#FEE2E2', text: '#991B1B', icon: 'close-circle' };
      case 'completed': return { bg: '#DBEAFE', text: '#1E40AF', icon: 'checkmark-done-circle' };
      default: return { bg: '#F3F4F6', text: '#6B7280', icon: 'help-circle' };
    }
  };

  if (loading) return (
    <SafeAreaView style={styles.container}>
      <View style={styles.center}><ActivityIndicator size="large" color="#2563EB" /></View>
    </SafeAreaView>
  );
  
  if (!item) return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#111827" />
        </Pressable>
        <Text style={styles.headerTitle}>Rendez-vous</Text>
        <View style={{ width: 40 }} />
      </View>
      <View style={styles.center}>
        <Ionicons name="calendar-outline" size={64} color="#D1D5DB" />
        <Text style={styles.emptyTitle}>Rendez-vous introuvable</Text>
        <Text style={styles.emptyText}>Ce rendez-vous n'existe pas ou a été supprimé</Text>
      </View>
    </SafeAreaView>
  );

  const statusInfo = getStatusColor(item.status);
  const canCancel = ['pending', 'confirmed', 'scheduled'].includes(String(item.status)?.toLowerCase());

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#111827" />
        </Pressable>
        <Text style={styles.headerTitle}>Détails du rendez-vous</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Status Badge */}
        <View style={[styles.statusBadge, { backgroundColor: statusInfo.bg }]}>
          <Ionicons name={statusInfo.icon as any} size={20} color={statusInfo.text} />
          <Text style={[styles.statusText, { color: statusInfo.text }]}>
            {item.status?.toUpperCase() || 'INCONNU'}
          </Text>
        </View>

        {/* Doctor Info Card */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Professionnel</Text>
          <View style={styles.infoRow}>
            <View style={styles.iconCircle}>
              <Ionicons name="person" size={20} color="#2563EB" />
            </View>
            <Text style={styles.infoText}>{item.doctor_name || 'Non renseigné'}</Text>
          </View>
        </View>

        {/* Appointment Details Card */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Informations</Text>
          
          <View style={styles.infoRow}>
            <View style={styles.iconCircle}>
              <Ionicons name="calendar" size={20} color="#2563EB" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.infoLabel}>Date</Text>
              <Text style={styles.infoText}>{item.date || '—'}</Text>
            </View>
          </View>

          <View style={styles.infoRow}>
            <View style={styles.iconCircle}>
              <Ionicons name="time" size={20} color="#2563EB" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.infoLabel}>Heure</Text>
              <Text style={styles.infoText}>{item.time || '—'}</Text>
            </View>
          </View>

          {!!item.reason && (
            <View style={styles.infoRow}>
              <View style={styles.iconCircle}>
                <Ionicons name="document-text" size={20} color="#2563EB" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.infoLabel}>Motif</Text>
                <Text style={styles.infoText}>{item.reason}</Text>
              </View>
            </View>
          )}
        </View>

        {/* Cancel Button */}
        {canCancel && (
          <Pressable 
            onPress={cancel} 
            style={[styles.cancelButton, cancelling && styles.cancelButtonDisabled]}
            disabled={cancelling}
          >
            {cancelling ? (
              <ActivityIndicator color="#B91C1C" />
            ) : (
              <>
                <Ionicons name="close-circle" size={20} color="#B91C1C" />
                <Text style={styles.cancelButtonText}>Annuler ce rendez-vous</Text>
              </>
            )}
          </Pressable>
        )}

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
    padding: 32,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
    marginTop: 16,
  },
  emptyText: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    marginTop: 8,
  },
  scrollContent: {
    padding: 16,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  statusText: {
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  card: {
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
  cardTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 16,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    marginBottom: 12,
  },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
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
    marginBottom: 4,
  },
  infoText: {
    fontSize: 15,
    color: '#111827',
    fontWeight: '600',
    lineHeight: 22,
  },
  cancelButton: {
    backgroundColor: '#FEE2E2',
    paddingVertical: 14,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: '#FCA5A5',
  },
  cancelButtonDisabled: {
    backgroundColor: '#FEE2E2',
    opacity: 0.6,
  },
  cancelButtonText: {
    color: '#B91C1C',
    fontWeight: '700',
    fontSize: 15,
  },
});
