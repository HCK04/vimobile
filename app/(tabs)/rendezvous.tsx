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
  const [filter, setFilter] = useState<'all' | 'upcoming' | 'past'>('all');

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

  const filteredAppointments = (() => {
    if (filter === 'all') return appointments;
    const now = new Date();
    return appointments.filter((a) => {
      if (!a?.date || !a?.time) return true;
      const dt = new Date(`${a.date}T${a.time}:00`);
      return filter === 'upcoming' ? dt >= now : dt < now;
    });
  })();

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
      case 'cancelled':
      case 'canceled': return { bg: '#FEE2E2', text: '#EF4444', label: 'Annulé' };
      case 'scheduled': return { bg: '#DBEAFE', text: '#3B82F6', label: 'Planifié' };
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
        <Pressable style={styles.addBtn} onPress={() => router.push('/patient/book-appointment' as any)}>
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
            label: "Prendre rendez-vous",
            icon: "add-circle",
            onPress: () => router.push('/patient/book-appointment' as any),
          }}
          secondaryAction={{
            label: "Rechercher un médecin",
            onPress: () => router.push('/recherche' as any),
          }}
        />
      ) : (
        <FlatList
          ListHeaderComponent={
            <View style={styles.filterBar}>
              <Pressable onPress={() => setFilter('all')} style={[styles.filterChip, filter === 'all' && styles.filterChipActive]}>
                <Text style={[styles.filterChipText, filter === 'all' && styles.filterChipTextActive]}>Tous</Text>
              </Pressable>
              <Pressable onPress={() => setFilter('upcoming')} style={[styles.filterChip, filter === 'upcoming' && styles.filterChipActive]}>
                <Text style={[styles.filterChipText, filter === 'upcoming' && styles.filterChipTextActive]}>À venir</Text>
              </Pressable>
              <Pressable onPress={() => setFilter('past')} style={[styles.filterChip, filter === 'past' && styles.filterChipActive]}>
                <Text style={[styles.filterChipText, filter === 'past' && styles.filterChipTextActive]}>Passés</Text>
              </Pressable>
            </View>
          }
          data={filteredAppointments}
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
  filterBar: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  filterChip: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
  },
  filterChipActive: {
    backgroundColor: '#2563EB',
    borderColor: '#2563EB',
  },
  filterChipText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#6B7280',
  },
  filterChipTextActive: {
    color: '#FFFFFF',
  },
});