import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { View, Text, ActivityIndicator, FlatList, Pressable, StyleSheet, RefreshControl, TextInput, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { apiClient } from '../../lib/apiClient';
import { getAuth } from '../../lib/api';
import { EmptyState } from '@/components/EmptyState';

export default function DoctorDashboardScreen() {
  const router = useRouter();
  const { user } = getAuth();
  const roleName = (user?.role?.name || (user as any)?.role_name || '').toLowerCase();
  const isOrg = ['clinique', 'pharmacie', 'parapharmacie', 'labo_analyse', 'centre_radiologie'].includes(roleName);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [items, setItems] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'confirmed' | 'cancelled' | 'completed'>('all');

  const [statsLoading, setStatsLoading] = useState(false);
  const [stats, setStats] = useState<{ appointmentsUpcoming?: number; totalPatients?: number; totalAppointments?: number; revenue?: number } | null>(null);
  const [availability, setAvailability] = useState<boolean | null>(null);
  const [profileData, setProfileData] = useState<any>(null);

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
      const data = res?.data || {};
      const profile =
        data.medecinProfile ||
        data.kineProfile ||
        data.orthophonisteProfile ||
        data.psychologueProfile ||
        data.cliniqueProfile ||
        data.pharmacieProfile ||
        data.parapharmacieProfile ||
        data.laboAnalyseProfile ||
        data.centreRadiologieProfile || {};
      const dispo = typeof profile?.disponible === 'boolean' ? profile.disponible : null;
      setAvailability(dispo);
      setProfileData(profile); // Store full profile for status indicators
    } catch (_) {
      setAvailability(null);
      setProfileData(null);
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
    const normalize = (s: string) => (s === 'canceled' ? 'cancelled' : s);
    let list = items;
    if (statusFilter !== 'all') list = list.filter((it) => normalize((it.status || '').toLowerCase()) === statusFilter);
    if (query.trim()) list = list.filter((it) => String(it.patient_name || it.patient?.name || '')
      .toLowerCase().includes(query.trim().toLowerCase()));
    return list;
  }, [items, statusFilter, query]);

  const toggleAvailability = async () => {
    try {
      await apiClient.post('/professional/profile/toggle-availability', { disponible: !(availability ?? false) });
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

  if (loading && !refreshing) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#2563EB" />
          <Text style={styles.loadingText}>Chargement...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Bonjour, {isOrg ? (user?.name?.split(' ')[0] || 'Professionnel') : `Dr. ${user?.name?.split(' ')[0] || 'Docteur'}`}</Text>
          <Text style={styles.subtitle}>Tableau de bord professionnel</Text>
        </View>
        <View style={styles.headerActions}>
          <Pressable onPress={() => router.push('/doctor/notifications' as any)} style={styles.notificationBtn}>
            <Ionicons name="notifications-outline" size={24} color="#111827" />
            {/* TODO: Add unread badge */}
          </Pressable>
        </View>
      </View>

      <ScrollView 
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#2563EB']} />}
      >
        {/* Status Indicators Section */}
        <View style={styles.statusSection}>
          <Text style={styles.sectionTitle}>Statut</Text>
          
          {/* Availability Status */}
          <Pressable 
            style={[styles.statusCard, availability ? styles.statusCardAvailable : styles.statusCardUnavailable]}
            onPress={toggleAvailability}
          >
            <View style={styles.statusCardContent}>
              <View style={[styles.statusBadge, availability ? styles.badgeGreen : styles.badgeRed]}>
                <Ionicons 
                  name={availability ? 'checkmark-circle' : 'close-circle'} 
                  size={20} 
                  color="#fff" 
                />
                <Text style={styles.badgeText}>
                  {availability === null ? 'Chargement...' : availability ? 'Disponible' : 'Indisponible'}
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
            </View>
            <Text style={styles.statusHint}>Appuyez pour changer</Text>
          </Pressable>

          {/* Vacation Mode Indicator */}
          {profileData?.vacation_mode && (
            <Pressable 
              style={[styles.statusCard, styles.statusCardWarning]}
              onPress={() => router.push('/doctor/profile/absence' as any)}
            >
              <View style={styles.statusCardContent}>
                <View style={[styles.statusBadge, styles.badgeYellow]}>
                  <Ionicons name="sunny" size={20} color="#fff" />
                  <Text style={styles.badgeText}>Mode vacances actif</Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
              </View>
              {profileData?.absence_end_date && (
                <Text style={styles.statusHint}>
                  Jusqu'au {new Date(profileData.absence_end_date).toLocaleDateString('fr-FR')}
                </Text>
              )}
            </Pressable>
          )}

          {/* Absence Period Indicator */}
          {!profileData?.vacation_mode && profileData?.absence_start_date && profileData?.absence_end_date && (
            <Pressable 
              style={[styles.statusCard, styles.statusCardWarning]}
              onPress={() => router.push('/doctor/profile/absence' as any)}
            >
              <View style={styles.statusCardContent}>
                <View style={[styles.statusBadge, styles.badgeOrange]}>
                  <Ionicons name="calendar-clear" size={20} color="#fff" />
                  <Text style={styles.badgeText}>Période d'absence</Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
              </View>
              <Text style={styles.statusHint}>
                Du {new Date(profileData.absence_start_date).toLocaleDateString('fr-FR')} au {new Date(profileData.absence_end_date).toLocaleDateString('fr-FR')}
              </Text>
            </Pressable>
          )}

          {/* Guard Status (Pharmacy only) */}
          {roleName === 'pharmacie' && profileData?.guard && (
            <Pressable 
              style={[styles.statusCard, styles.statusCardGuard]}
              onPress={() => router.push('/doctor/profile/guard' as any)}
            >
              <View style={styles.statusCardContent}>
                <View style={[styles.statusBadge, styles.badgeRed]}>
                  <Ionicons name="medical" size={20} color="#fff" />
                  <Text style={styles.badgeText}>Service de garde actif</Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
              </View>
              {profileData?.guard_start_date && profileData?.guard_end_date && (
                <Text style={styles.statusHint}>
                  Du {new Date(profileData.guard_start_date).toLocaleDateString('fr-FR')} au {new Date(profileData.guard_end_date).toLocaleDateString('fr-FR')}
                </Text>
              )}
            </Pressable>
          )}
        </View>

        {/* Stats Grid */}
        <View style={styles.statsContainer}>
          <Text style={styles.sectionTitle}>Statistiques</Text>
          <View style={styles.statsGrid}>
            <View style={styles.statCard}>
              <View style={styles.statIconContainer}>
                <Ionicons name="calendar" size={20} color="#2563EB" />
              </View>
              <Text style={styles.statValue}>{statsLoading ? '...' : (stats?.appointmentsUpcoming ?? 0)}</Text>
              <Text style={styles.statLabel}>À venir</Text>
            </View>
            <View style={styles.statCard}>
              <View style={styles.statIconContainer}>
                <Ionicons name="people" size={20} color="#10B981" />
              </View>
              <Text style={styles.statValue}>{statsLoading ? '...' : (stats?.totalPatients ?? 0)}</Text>
              <Text style={styles.statLabel}>Patients</Text>
            </View>
            <View style={styles.statCard}>
              <View style={styles.statIconContainer}>
                <Ionicons name="time" size={20} color="#F59E0B" />
              </View>
              <Text style={styles.statValue}>{statsLoading ? '...' : (stats?.totalAppointments ?? 0)}</Text>
              <Text style={styles.statLabel}>Total RDV</Text>
            </View>
          </View>
        </View>

        {/* Quick Actions */}
        <View style={styles.quickActionsContainer}>
          <Text style={styles.sectionTitle}>Actions rapides</Text>
          <View style={styles.quickActionsGrid}>
            <Pressable style={styles.quickActionCard} onPress={() => router.push('/doctor/services' as any)}>
              <View style={[styles.quickActionIcon, { backgroundColor: '#EFF6FF' }]}>
                <Ionicons name="medical" size={24} color="#2563EB" />
              </View>
              <Text style={styles.quickActionText}>Services</Text>
            </Pressable>
            <Pressable style={styles.quickActionCard} onPress={() => router.push('/doctor/profile/absence' as any)}>
              <View style={[styles.quickActionIcon, { backgroundColor: '#FEF3C7' }]}>
                <Ionicons name="calendar-clear" size={24} color="#F59E0B" />
              </View>
              <Text style={styles.quickActionText}>Absence</Text>
            </Pressable>
            {roleName === 'pharmacie' && (
              <Pressable style={styles.quickActionCard} onPress={() => router.push('/doctor/profile/guard' as any)}>
                <View style={[styles.quickActionIcon, { backgroundColor: '#FEE2E2' }]}>
                  <Ionicons name="medical" size={24} color="#EF4444" />
                </View>
                <Text style={styles.quickActionText}>Garde</Text>
              </Pressable>
            )}
            <Pressable style={styles.quickActionCard} onPress={() => router.push('/doctor/profile/edit' as any)}>
              <View style={[styles.quickActionIcon, { backgroundColor: '#F3E8FF' }]}>
                <Ionicons name="person" size={24} color="#8B5CF6" />
              </View>
              <Text style={styles.quickActionText}>Profil</Text>
            </Pressable>
            <Pressable style={styles.quickActionCard} onPress={() => router.push('/doctor/notifications' as any)}>
              <View style={[styles.quickActionIcon, { backgroundColor: '#DCFCE7' }]}>
                <Ionicons name="notifications" size={24} color="#10B981" />
              </View>
              <Text style={styles.quickActionText}>Notifications</Text>
            </Pressable>
          </View>
        </View>

        {/* Appointments Section */}
        <View style={styles.appointmentsSection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Rendez-vous</Text>
            <Pressable onPress={onRefresh}>
              <Ionicons name="refresh" size={20} color="#6B7280" />
            </Pressable>
          </View>

          {/* Filters */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filtersScroll}>
            {(['all','pending','confirmed','cancelled','completed'] as const).map((st) => (
              <Pressable 
                key={st} 
                onPress={() => setStatusFilter(st)} 
                style={[styles.filterChip, statusFilter === st && styles.filterChipActive]}
              >
                <Text style={[styles.filterChipText, statusFilter === st && styles.filterChipTextActive]}>
                  {st === 'all' ? 'Tous' : st === 'pending' ? 'En attente' : st === 'confirmed' ? 'Confirmés' : st === 'cancelled' ? 'Annulés' : 'Terminés'}
                </Text>
              </Pressable>
            ))}
          </ScrollView>

          {/* Search */}
          <View style={styles.searchContainer}>
            <Ionicons name="search" size={20} color="#9CA3AF" style={styles.searchIcon} />
            <TextInput 
              value={query} 
              onChangeText={setQuery} 
              placeholder="Rechercher un patient..." 
              placeholderTextColor="#9CA3AF" 
              style={styles.searchInput} 
            />
            {!!query && (
              <Pressable onPress={() => setQuery('')} style={styles.clearBtn}>
                <Ionicons name="close-circle" size={20} color="#9CA3AF" />
              </Pressable>
            )}
          </View>
        </View>

        {/* Appointments List */}
        {error ? (
          <View style={styles.emptyContainer}>
            <EmptyState
              icon="lock-closed-outline"
              title="Authentification requise"
              description="Connectez-vous pour voir vos rendez-vous."
              primaryAction={{ label: 'Se connecter', icon: 'log-in-outline', onPress: () => router.push('/auth/professional' as any) }}
            />
          </View>
        ) : filteredItems.length === 0 ? (
          <View style={styles.emptyContainer}>
            <EmptyState
              icon="calendar-outline"
              title="Aucun rendez-vous"
              description="Aucun rendez-vous correspondant à votre filtre."
              primaryAction={{ label: 'Actualiser', icon: 'refresh', onPress: onRefresh }}
            />
          </View>
        ) : (
          <View style={styles.appointmentsList}>
            {filteredItems.map((item) => {
              const st = (item.status || '').toLowerCase();
              const stNorm = st === 'canceled' ? 'cancelled' : st;
              return (
                <Pressable 
                  key={item.id}
                  onPress={() => router.push({ pathname: '/doctor/appointments/[id]', params: { id: String(item.id) } } as any)} 
                  style={styles.appointmentCard}
                >
                  <View style={styles.appointmentIcon}>
                    <Ionicons name="person" size={20} color="#2563EB" />
                  </View>
                  <View style={styles.appointmentContent}>
                    <Text style={styles.appointmentName}>{item.patient_name || item.patient?.name || 'Patient'}</Text>
                    <View style={styles.appointmentMeta}>
                      <Ionicons name="calendar" size={12} color="#6B7280" />
                      <Text style={styles.appointmentMetaText}>{item.date}</Text>
                      <Text style={styles.appointmentDot}>•</Text>
                      <Ionicons name="time" size={12} color="#6B7280" />
                      <Text style={styles.appointmentMetaText}>{item.time || item.time_start || '—'}</Text>
                    </View>
                    <View style={[styles.appointmentStatusBadge, { backgroundColor: stNorm === 'confirmed' ? '#DCFCE7' : stNorm === 'pending' ? '#FEF3C7' : stNorm === 'cancelled' ? '#FEE2E2' : '#F3F4F6' }]}>
                      <Text style={[styles.statusText, { color: stNorm === 'confirmed' ? '#10B981' : stNorm === 'pending' ? '#F59E0B' : stNorm === 'cancelled' ? '#EF4444' : '#6B7280' }]}>
                        {stNorm === 'confirmed' ? 'Confirmé' : stNorm === 'pending' ? 'En attente' : stNorm === 'cancelled' ? 'Annulé' : stNorm === 'completed' ? 'Terminé' : item.status}
                      </Text>
                    </View>
                  </View>
                  <Ionicons name="chevron-forward" size={20} color="#D1D5DB" />
                </Pressable>
              );
            })}
          </View>
        )}
    </ScrollView>
  </SafeAreaView>
);
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#6B7280',
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
  },
  text: {
    color: '#374151',
    marginBottom: 10,
  },
  cta: {
    backgroundColor: '#2563EB',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 10,
  },
  ctaText: {
    color: '#fff',
    fontWeight: '700',
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 20,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  greeting: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: '#6B7280',
  },
  headerActions: {
    flexDirection: 'row',
    gap: 12,
  },
  notificationBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#F9FAFB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusSection: {
    paddingHorizontal: 20,
    marginTop: 20,
    marginBottom: 24,
  },
  statusCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
    borderLeftWidth: 4,
    borderLeftColor: '#E5E7EB',
  },
  statusCardAvailable: {
    borderLeftColor: '#10B981',
  },
  statusCardUnavailable: {
    borderLeftColor: '#EF4444',
  },
  statusCardWarning: {
    borderLeftColor: '#F59E0B',
  },
  statusCardGuard: {
    borderLeftColor: '#EF4444',
  },
  statusCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  badgeGreen: {
    backgroundColor: '#10B981',
  },
  badgeRed: {
    backgroundColor: '#EF4444',
  },
  badgeYellow: {
    backgroundColor: '#F59E0B',
  },
  badgeOrange: {
    backgroundColor: '#F97316',
  },
  badgeText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  statusHint: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 4,
  },
  statsContainer: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 16,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  statCard: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  statIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F9FAFB',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  statValue: {
    fontSize: 24,
    fontWeight: '800',
    color: '#111827',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#6B7280',
    textAlign: 'center',
  },
  quickActionsContainer: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  quickActionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  quickActionCard: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  quickActionIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  quickActionText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
    textAlign: 'center',
  },
  appointmentsSection: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  filtersScroll: {
    marginBottom: 16,
  },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: '#F9FAFB',
    marginRight: 8,
  },
  filterChipActive: {
    backgroundColor: '#EFF6FF',
  },
  filterChipText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
  },
  filterChipTextActive: {
    color: '#2563EB',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  searchIcon: {
    marginRight: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#111827',
  },
  clearBtn: {
    padding: 4,
  },
  emptyContainer: {
    paddingVertical: 40,
  },
  appointmentsList: {
    gap: 12,
    paddingBottom: 24,
  },
  appointmentCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  appointmentIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  appointmentContent: {
    flex: 1,
  },
  appointmentName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 6,
  },
  appointmentMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 8,
  },
  appointmentMetaText: {
    fontSize: 12,
    color: '#6B7280',
  },
  appointmentDot: {
    fontSize: 12,
    color: '#D1D5DB',
    marginHorizontal: 4,
  },
  appointmentStatusBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
});
