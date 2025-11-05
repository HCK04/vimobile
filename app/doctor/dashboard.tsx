import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { View, Text, ActivityIndicator, FlatList, Pressable, StyleSheet, RefreshControl, TextInput } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { apiClient } from '../../lib/apiClient';
import { getAuth } from '../../lib/api';
import { EmptyState } from '@/components/EmptyState';

export default function DoctorDashboardScreen() {
  const router = useRouter();
  const { user } = getAuth();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [items, setItems] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'confirmed' | 'cancelled' | 'completed'>('all');

  const [statsLoading, setStatsLoading] = useState(false);
  const [stats, setStats] = useState<{ appointmentsUpcoming?: number; totalPatients?: number; totalAppointments?: number; revenue?: number } | null>(null);
  const [availability, setAvailability] = useState<boolean | null>(null);

  const loadStats = useCallback(async () => {
    setStatsLoading(true);
    try {
      const res = await apiClient.get('/doctor/stats');
      setStats(res.data || {});
    } catch (e: any) {
      // Non-fatal
    } finally {
      setStatsLoading(false);
    }
  }, []);

  const loadProfileAvailability = useCallback(async () => {
    try {
      const res = await apiClient.get('/professional/profile');
      const dispo = res?.data?.disponible;
      if (typeof dispo === 'boolean') setAvailability(dispo);
    } catch (_) {
      setAvailability(null);
    }
  }, []);

  const loadAppointments = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await apiClient.get('/doctor/appointments');
      setItems(Array.isArray(data) ? data : []);
    } catch (e: any) {
      setItems([]);
      const msg = e?.response?.status === 401 ? 'Authentification requise' : 'Erreur de chargement';
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, []);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([loadAppointments(), loadStats(), loadProfileAvailability()]);
    setRefreshing(false);
  }, [loadAppointments, loadStats, loadProfileAvailability]);

  useEffect(() => {
    loadAppointments();
    loadStats();
    loadProfileAvailability();
  }, [loadAppointments, loadStats, loadProfileAvailability]);

  const filteredItems = useMemo(() => {
    let list = items;
    if (statusFilter !== 'all') list = list.filter((it) => (it.status || '').toLowerCase() === statusFilter);
    if (query.trim()) list = list.filter((it) => String(it.patient_name || it.patient?.name || '')
      .toLowerCase().includes(query.trim().toLowerCase()));
    return list;
  }, [items, statusFilter, query]);

  const toggleAvailability = async () => {
    try {
      // Simple toggle endpoint; server flips availability
      await apiClient.post('/professional/profile/toggle-availability');
      // Re-fetch
      loadProfileAvailability();
    } catch (_) {}
  };

  if (!user) {
    return (
      <View style={styles.center}>
        <Text style={styles.text}>Espace professionnel sécurisé</Text>
        <Pressable onPress={() => router.push('/auth/professional' as any)} style={styles.cta}><Text style={styles.ctaText}>Se connecter</Text></Pressable>
      </View>
    );
  }

  if (loading && !refreshing) return <View style={styles.center}><ActivityIndicator /></View>;

  return (
    <View style={{ flex: 1 }}>
      {/* Header */}
      <View style={styles.headerBar}>
        <Text style={styles.headerTitle}>Tableau de bord</Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
          <Pressable onPress={() => router.push('/doctor/notifications' as any)} style={styles.iconBtn}>
            <Ionicons name="notifications-outline" size={18} color="#2563EB" />
          </Pressable>
          <Pressable onPress={onRefresh} style={styles.iconBtn}>
            <Ionicons name="refresh" size={18} color="#2563EB" />
          </Pressable>
        </View>
      </View>

      {/* Availability */}
      <View style={styles.availabilityCard}>
        <Text style={styles.availabilityText}>Disponibilité: {availability === null ? '—' : availability ? 'Disponible' : 'Indisponible'}</Text>
        <Pressable onPress={toggleAvailability} style={styles.availabilityBtn}>
          <Ionicons name="swap-horizontal" size={16} color="#fff" />
          <Text style={styles.availabilityBtnText}>Basculer</Text>
        </Pressable>
      </View>

      {/* Stats */}
      <View style={styles.statsRow}>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{statsLoading ? '…' : (stats?.appointmentsUpcoming ?? 0)}</Text>
          <Text style={styles.statLabel}>A venir</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{statsLoading ? '…' : (stats?.totalPatients ?? 0)}</Text>
          <Text style={styles.statLabel}>Patients</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{statsLoading ? '…' : (stats?.totalAppointments ?? 0)}</Text>
          <Text style={styles.statLabel}>Rendez-vous</Text>
        </View>
      </View>

      {/* Filters */}
      <View style={styles.filtersRow}>
        {(['all','pending','confirmed','cancelled','completed'] as const).map((st) => (
          <Pressable key={st} onPress={() => setStatusFilter(st)} style={[styles.filterChip, statusFilter === st && styles.filterChipActive]}>
            <Text style={[styles.filterChipText, statusFilter === st && styles.filterChipTextActive]}>
              {st === 'all' ? 'Tous' : (st.charAt(0).toUpperCase() + st.slice(1))}
            </Text>
          </Pressable>
        ))}
      </View>

      {/* Search */}
      <View style={styles.searchWrap}>
        <Ionicons name="search" size={16} color="#6B7280" />
        <TextInput value={query} onChangeText={setQuery} placeholder="Rechercher un patient…" placeholderTextColor="#9CA3AF" style={styles.searchInput} />
        {!!query && (
          <Pressable onPress={() => setQuery('')}>
            <Ionicons name="close" size={16} color="#9CA3AF" />
          </Pressable>
        )}
      </View>

      {/* List */}
      {error ? (
        <View style={{ flex: 1 }}>
          <EmptyState
            icon="lock-closed-outline"
            title="Authentification requise"
            description="Connectez-vous pour voir vos rendez-vous."
            primaryAction={{ label: 'Se connecter', icon: 'log-in-outline', onPress: () => router.push('/auth/professional' as any) }}
          />
        </View>
      ) : filteredItems.length === 0 ? (
        <View style={{ flex: 1 }}>
          <EmptyState
            icon="calendar-outline"
            title="Aucun rendez-vous"
            description="Aucun rendez-vous correspondant à votre filtre."
            primaryAction={{ label: 'Actualiser', icon: 'refresh', onPress: onRefresh }}
          />
        </View>
      ) : (
        <FlatList
          data={filteredItems}
          keyExtractor={(it) => String(it.id)}
          contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 6, paddingBottom: 24, gap: 10 }}
          renderItem={({ item }) => (
            <Pressable onPress={() => router.push({ pathname: '/doctor/appointments/[id]', params: { id: String(item.id) } } as any)} style={styles.card}>
              <View style={styles.cardIcon}><Ionicons name="person" size={18} color="#2563EB" /></View>
              <View style={{ flex: 1 }}>
                <Text style={styles.name}>{item.patient_name || item.patient?.name || 'Patient'}</Text>
                <Text style={styles.sub}>{item.date} • {item.time || item.time_start || '—'} • {String(item.status || '').toUpperCase()}</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color="#9CA3AF" />
            </Pressable>
          )}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 16 },
  text: { color: '#374151', marginBottom: 10 },
  cta: { backgroundColor: '#2563EB', paddingVertical: 12, paddingHorizontal: 16, borderRadius: 10 },
  ctaText: { color: '#fff', fontWeight: '700' },
  headerBar: { paddingHorizontal: 16, paddingTop: 14, paddingBottom: 10, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  headerTitle: { fontSize: 20, fontWeight: '800', color: '#111827' },
  iconBtn: { backgroundColor: '#EFF6FF', borderWidth: 1, borderColor: '#DBEAFE', padding: 8, borderRadius: 10 },
  availabilityCard: { marginHorizontal: 16, marginTop: 6, marginBottom: 10, backgroundColor: '#FFFFFF', borderRadius: 12, borderWidth: 1, borderColor: '#E5E7EB', padding: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  availabilityText: { color: '#111827', fontWeight: '600' },
  availabilityBtn: { backgroundColor: '#2563EB', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8, flexDirection: 'row', alignItems: 'center', gap: 6 },
  availabilityBtnText: { color: '#fff', fontWeight: '700', marginLeft: 6 },
  statsRow: { flexDirection: 'row', gap: 10, paddingHorizontal: 16, marginBottom: 10 },
  statCard: { flex: 1, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 12, padding: 12, alignItems: 'center' },
  statValue: { fontSize: 18, fontWeight: '800', color: '#111827' },
  statLabel: { fontSize: 12, color: '#6B7280', marginTop: 4 },
  filtersRow: { flexDirection: 'row', gap: 8, paddingHorizontal: 16, marginBottom: 8 },
  filterChip: { paddingHorizontal: 10, paddingVertical: 8, borderRadius: 16, borderWidth: 1, borderColor: '#E5E7EB', backgroundColor: '#FFFFFF' },
  filterChipActive: { backgroundColor: '#EFF6FF', borderColor: '#DBEAFE' },
  filterChipText: { color: '#6B7280', fontWeight: '600', fontSize: 12 },
  filterChipTextActive: { color: '#2563EB' },
  searchWrap: { marginHorizontal: 16, marginBottom: 8, borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 10, paddingHorizontal: 10, paddingVertical: 8, flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#FFFFFF' },
  searchInput: { flex: 1, color: '#111827', paddingVertical: 4 },
  card: { backgroundColor: '#fff', borderRadius: 12, padding: 12, borderWidth: 1, borderColor: '#E5E7EB', flexDirection: 'row', alignItems: 'center', gap: 12 },
  cardIcon: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#EFF6FF', alignItems: 'center', justifyContent: 'center' },
  name: { fontWeight: '700', color: '#111827' },
  sub: { color: '#6B7280', marginTop: 2 },
});
