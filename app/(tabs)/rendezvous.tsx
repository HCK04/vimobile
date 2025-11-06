import React, { useCallback, useEffect, useState } from 'react';
import { SafeAreaView, View, Text, StyleSheet, FlatList, Pressable, ActivityIndicator, RefreshControl } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import { EmptyState } from '@/components/EmptyState';
import { apiClient } from '../../lib/apiClient';

export default function RendezVousScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [appointments, setAppointments] = useState<any[]>([]);

  const loadAppointments = useCallback(async (showLoader = true) => {
    try {
      if (showLoader) setLoading(true);
      const { data } = await apiClient.get('/appointments');
      setAppointments(data || []);
    } catch (error) {
      console.error('Failed to load appointments:', error);
      setAppointments([]);
    } finally {
      if (showLoader) setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadAppointments();
  }, [loadAppointments]);

  // Reload when tab is focused
  useFocusEffect(
    useCallback(() => {
      loadAppointments(false);
    }, [loadAppointments])
  );

  const onRefresh = () => {
    setRefreshing(true);
    loadAppointments(false);
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    const months = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc'];
    return `${date.getDate()} ${months[date.getMonth()]}`;
  };

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'confirmed': return { bg: '#D1FAE5', text: '#10B981', label: 'Confirmé' };
      case 'pending': return { bg: '#FEF3C7', text: '#F59E0B', label: 'En attente' };
      case 'cancelled': return { bg: '#FEE2E2', text: '#EF4444', label: 'Annulé' };
      case 'completed': return { bg: '#DBEAFE', text: '#3B82F6', label: 'Terminé' };
      case 'missed': return { bg: '#F3F4F6', text: '#6B7280', label: 'Manqué' };
      default: return { bg: '#F3F4F6', text: '#6B7280', label: status };
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Mes rendez-vous</Text>
        </View>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator size="large" color="#2563EB" />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Mes rendez-vous</Text>
        <Pressable style={styles.addBtn} onPress={() => router.push('/recherche')}>
          <Ionicons name="add" size={20} color="#fff" />
          <Text style={styles.addText}>Nouveau</Text>
        </Pressable>
      </View>

      {appointments.length === 0 ? (
        <EmptyState
          icon="calendar-outline"
          title="Aucun rendez-vous"
          description="Prenez votre premier rendez-vous en quelques clics"
          primaryAction={{
            label: "Rechercher un médecin",
            icon: "search",
            onPress: () => router.push('/recherche'),
          }}
          secondaryAction={{
            label: "Comment ça marche ?",
            onPress: () => {
              // Could show a modal or navigate to help
            },
          }}
        />
      ) : (
        <FlatList
          data={appointments}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={{ padding: 16, gap: 12 }}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#2563EB']} />
          }
          renderItem={({ item }) => {
            const statusInfo = getStatusColor(item.status);
            return (
              <Pressable 
                style={styles.card}
                onPress={() => router.push(`/patient/appointment/${item.id}` as any)}
              >
                <View style={styles.cardIcon}>
                  <Ionicons name="calendar" size={20} color="#2563EB" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.cardTitle}>{item.reason || 'Consultation'}</Text>
                  <Text style={styles.cardSub}>
                    {formatDate(item.date)} à {item.time} · {item.doctor_name}
                  </Text>
                  <View style={[styles.statusBadge, { backgroundColor: statusInfo.bg, marginTop: 6 }]}>
                    <Text style={[styles.statusText, { color: statusInfo.text }]}>
                      {statusInfo.label}
                    </Text>
                  </View>
                </View>
                <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
              </Pressable>
            );
          }}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#fff',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#E5E7EB',
  },
  headerTitle: { fontSize: 20, fontWeight: '800', color: '#111827' },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#2563EB',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
  },
  addText: { color: '#fff', fontWeight: '700' },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  cardIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardTitle: { fontWeight: '700', color: '#111827' },
  cardSub: { color: '#6B7280', fontSize: 12 },
  statusBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '600',
  },
});