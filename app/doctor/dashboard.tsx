import React, { useCallback, useEffect, useMemo, useState, useRef } from 'react';
import {
  View,
  Text,
  ActivityIndicator,
  Pressable,
  StyleSheet,
  RefreshControl,
  TextInput,
  ScrollView,
  Animated
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { apiClient } from '../../lib/apiClient';
import { getAuth } from '../../lib/api';
import { EmptyState } from '@/components/EmptyState';
import { Palette } from '../../constants/Colors';

const AVAILABILITY_OVERRIDE_KEY = 'doctor_availability_override';

// ============================================================================
// PHASE 1: FOUNDATION - Core structure, state management, data loading
// ============================================================================

export default function DoctorDashboardScreen() {
  const router = useRouter();
  const { user } = getAuth();
  const roleName = (user?.role?.name || (user as any)?.role_name || '').toLowerCase();
  const isOrg = ['clinique', 'pharmacie', 'parapharmacie', 'labo_analyse', 'centre_radiologie'].includes(roleName);

  // Loading states
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Data states
  const [appointments, setAppointments] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [availability, setAvailability] = useState<boolean | null>(null);
  const [profileData, setProfileData] = useState<any>(null);
  const [stats, setStats] = useState<{ upcoming?: number; patients?: number; total?: number } | null>(null);

  // UI states
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'confirmed' | 'cancelled'>('all');

  // Animation refs for enhanced section header
  const rotateAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;

  // Animation refs for enhanced availability card
  const dotPulse = useRef(new Animated.Value(1)).current;
  const cardScale = useRef(new Animated.Value(1)).current;
  const chevronTranslate = useRef(new Animated.Value(0)).current;

  // -------------------------------------------------------------------------
  // Data Loading Functions
  // -------------------------------------------------------------------------

  const loadProfile = useCallback(async () => {
    try {
      // Check for local override first
      const localOverride = await AsyncStorage.getItem(AVAILABILITY_OVERRIDE_KEY);

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

      // If local override exists, use it; otherwise use backend value
      if (localOverride !== null) {
        setAvailability(localOverride === 'true');
      } else {
        // Parse availability (handles boolean, int, string)
        let dispo = false;
        if (profile?.disponible !== undefined && profile?.disponible !== null) {
          if (typeof profile.disponible === 'boolean') dispo = profile.disponible;
          else if (typeof profile.disponible === 'number') dispo = profile.disponible === 1;
          else if (typeof profile.disponible === 'string') dispo = profile.disponible === '1' || profile.disponible === 'true';
        }
        setAvailability(dispo);
      }

      setProfileData(profile);
    } catch (_) {
      // On error, still check local override
      const localOverride = await AsyncStorage.getItem(AVAILABILITY_OVERRIDE_KEY);
      if (localOverride !== null) {
        setAvailability(localOverride === 'true');
      } else {
        setAvailability(null);
      }
      setProfileData(null);
    }
  }, []);

  // Calculate stats from appointments (no separate stats endpoint)
  const calculateStats = useCallback((appointmentsList: any[]) => {
    const now = new Date();

    // Upcoming = future appointments with pending or confirmed status
    const upcoming = appointmentsList.filter(apt => {
      const aptDate = apt.date_time ? new Date(apt.date_time) : (apt.date ? new Date(apt.date) : null);
      const status = (apt.status || '').toLowerCase();
      return aptDate && aptDate >= now && ['pending', 'confirmed'].includes(status);
    }).length;

    // Unique patients
    const uniquePatients = new Set(
      appointmentsList.map(apt => apt.patient_id || apt.patient?.id || apt.patient_name || apt.patient?.name)
        .filter(Boolean)
    ).size;

    // Total appointments
    const total = appointmentsList.length;

    setStats({ upcoming, patients: uniquePatients, total });
  }, []);

  const loadAppointments = useCallback(async () => {
    try {
      const { data } = await apiClient.get('/doctor/appointments');
      const list = Array.isArray(data) ? data : [];
      setAppointments(list);
      calculateStats(list); // Calculate stats from appointments
    } catch (e: any) {
      setAppointments([]);
      setStats({ upcoming: 0, patients: 0, total: 0 });
      const msg = e?.response?.status === 401 ? 'Authentification requise' : 'Erreur de chargement';
      setError(msg);
    }
  }, [calculateStats]);

  const loadAllData = useCallback(async () => {
    setLoading(true);
    setError(null);
    await Promise.all([loadProfile(), loadAppointments()]);
    setLoading(false);
  }, [loadProfile, loadAppointments]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadAllData();
    setRefreshing(false);
  }, [loadAllData]);

  useEffect(() => {
    loadAllData();
  }, [loadAllData]);

  // -------------------------------------------------------------------------
  // Availability Toggle
  // -------------------------------------------------------------------------

  const toggleAvailability = async () => {
    const newStatus = !(availability ?? false);

    // Save to AsyncStorage immediately (local override)
    await AsyncStorage.setItem(AVAILABILITY_OVERRIDE_KEY, String(newStatus));

    setAvailability(newStatus); // Optimistic update

    try {
      await apiClient.post('/professional/profile/toggle-availability', {
        disponible: newStatus ? 1 : 0
      });
    } catch (_) {
      // Keep local override even if backend fails
      // User can still toggle again if needed
    }
  };

  // Pulsing dot animation when available
  useEffect(() => {
    if (availability) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(dotPulse, {
            toValue: 1.3,
            duration: 1000,
            useNativeDriver: true,
          }),
          Animated.timing(dotPulse, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: true,
          }),
        ])
      ).start();
    } else {
      dotPulse.setValue(1);
    }
  }, [availability, dotPulse]);

  // -------------------------------------------------------------------------
  // Filtered Appointments
  // -------------------------------------------------------------------------

  const filteredAppointments = useMemo(() => {
    let list = appointments;

    // Status filter
    if (statusFilter !== 'all') {
      list = list.filter((apt) => {
        const status = (apt.status || '').toLowerCase();
        return status === statusFilter || (statusFilter === 'cancelled' && status === 'canceled');
      });
    }

    // Search filter
    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      list = list.filter((apt) =>
        String(apt.patient_name || apt.patient?.name || '').toLowerCase().includes(q)
      );
    }

    return list;
  }, [appointments, statusFilter, searchQuery]);

  // -------------------------------------------------------------------------
  // Render: Not logged in
  // -------------------------------------------------------------------------

  if (!user) {
    return (
      <SafeAreaView style={styles.centerContainer}>
        <Ionicons name="lock-closed-outline" size={48} color={Palette.textSecondary} />
        <Text style={styles.centerTitle}>Espace professionnel</Text>
        <Text style={styles.centerSubtitle}>Connectez-vous pour accéder à votre tableau de bord</Text>
        <Pressable
          onPress={() => router.push('/auth/professional' as any)}
          style={styles.primaryButton}
        >
          <Text style={styles.primaryButtonText}>Se connecter</Text>
        </Pressable>
      </SafeAreaView>
    );
  }

  // -------------------------------------------------------------------------
  // Render: Loading
  // -------------------------------------------------------------------------

  if (loading && !refreshing) {
    return (
      <SafeAreaView style={styles.centerContainer}>
        <ActivityIndicator size="large" color={Palette.primary} />
        <Text style={styles.loadingText}>Chargement...</Text>
      </SafeAreaView>
    );
  }

  // -------------------------------------------------------------------------
  // Render: Main Dashboard
  // -------------------------------------------------------------------------

  const greeting = isOrg
    ? (user?.name?.split(' ')[0] || 'Bienvenue')
    : `Dr. ${user?.name?.split(' ')[0] || 'Docteur'}`;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[Palette.primary]}
            tintColor={Palette.primary}
          />
        }
        contentContainerStyle={styles.scrollContent}
      >
        {/* ================================================================ */}
        {/* HEADER SECTION */}
        {/* ================================================================ */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>Bonjour, {greeting}</Text>
            <Text style={styles.subtitle}>Votre tableau de bord</Text>
          </View>
          <Pressable
            onPress={() => router.push('/doctor/notifications' as any)}
            style={styles.notificationButton}
          >
            <Ionicons name="notifications-outline" size={22} color={Palette.text} />
          </Pressable>
        </View>

        {/* ================================================================ */}
        {/* AVAILABILITY STATUS - Enhanced Animated */}
        {/* ================================================================ */}
        <Animated.View style={{ transform: [{ scale: cardScale }] }}>
          <Pressable
            style={[
              styles.availabilityCard,
              availability ? styles.availabilityAvailable : styles.availabilityUnavailable
            ]}
            onPress={toggleAvailability}
            onPressIn={() => {
              Animated.parallel([
                Animated.spring(cardScale, { toValue: 0.97, useNativeDriver: true }),
                Animated.timing(chevronTranslate, { toValue: 4, duration: 150, useNativeDriver: true }),
              ]).start();
            }}
            onPressOut={() => {
              Animated.parallel([
                Animated.spring(cardScale, { toValue: 1, friction: 4, tension: 50, useNativeDriver: true }),
                Animated.spring(chevronTranslate, { toValue: 0, friction: 4, tension: 50, useNativeDriver: true }),
              ]).start();
            }}
          >
            <View style={styles.availabilityContent}>
              <Animated.View
                style={[
                  styles.statusDot,
                  {
                    backgroundColor: availability ? Palette.success : Palette.error,
                    transform: [{ scale: dotPulse }],
                  },
                ]}
              >
                {availability && <View style={styles.dotInner} />}
              </Animated.View>
              <View style={styles.availabilityTextContainer}>
                <Text style={styles.availabilityTitle}>
                  {availability ? 'Disponible' : 'Indisponible'}
                </Text>
                <Text style={styles.availabilityHint}>
                  Appuyez pour {availability ? 'désactiver' : 'activer'}
                </Text>
              </View>
            </View>
            <Animated.View style={{ transform: [{ translateX: chevronTranslate }] }}>

            </Animated.View>
          </Pressable>
        </Animated.View>

        {/* ================================================================ */}
        {/* STATS ROW - Enhanced */}
        {/* ================================================================ */}
        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <View style={styles.statIndicator} />
            <View style={[styles.statIcon, { backgroundColor: Palette.primaryLight }]}>
              <Ionicons name="calendar" size={20} color={Palette.primary} />
            </View>
            <Text style={styles.statValue}>{stats?.upcoming ?? 0}</Text>
            <Text style={styles.statLabel}>À venir</Text>
          </View>
          <View style={styles.statCard}>
            <View style={styles.statIndicator} />
            <View style={[styles.statIcon, { backgroundColor: Palette.successBg }]}>
              <Ionicons name="people" size={20} color={Palette.success} />
            </View>
            <Text style={styles.statValue}>{stats?.patients ?? 0}</Text>
            <Text style={styles.statLabel}>Patients</Text>
          </View>
          <View style={styles.statCard}>
            <View style={styles.statIndicator} />
            <View style={[styles.statIcon, { backgroundColor: '#FEF3C7' }]}>
              <Ionicons name="checkmark-done" size={20} color="#F59E0B" />
            </View>
            <Text style={styles.statValue}>{stats?.total ?? 0}</Text>
            <Text style={styles.statLabel}>Total</Text>
          </View>
        </View>

        {/* ================================================================ */}
        {/* QUICK ACTIONS */}
        {/* ================================================================ */}
        <Text style={styles.sectionTitle}>Actions rapides</Text>
        <View style={styles.actionsGrid}>
          <Pressable
            style={styles.actionCard}
            onPress={() => router.push('/doctor/scan' as any)}
          >
            <View style={[styles.actionIcon, { backgroundColor: '#ECFDF5' }]}>
              <Ionicons name="qr-code" size={22} color="#059669" />
            </View>
            <Text style={styles.actionLabel}>Scanner QR</Text>
          </Pressable>
          <Pressable
            style={styles.actionCard}
            onPress={() => router.push('/doctor/profile/absence' as any)}
          >
            <View style={[styles.actionIcon, { backgroundColor: '#FEF3C7' }]}>
              <Ionicons name="calendar-clear" size={22} color="#F59E0B" />
            </View>
            <Text style={styles.actionLabel}>Absence</Text>
          </Pressable>
          <Pressable
            style={styles.actionCard}
            onPress={() => router.push('/doctor/profile/edit' as any)}
          >
            <View style={[styles.actionIcon, { backgroundColor: '#F3E8FF' }]}>
              <Ionicons name="person" size={22} color="#8B5CF6" />
            </View>
            <Text style={styles.actionLabel}>Profil</Text>
          </Pressable>
        </View>

        {/* ================================================================ */}
        {/* APPOINTMENTS SECTION - Enhanced Header */}
        {/* ================================================================ */}
        <View style={styles.enhancedSectionHeader}>
          <View style={styles.titleContainer}>
            <View style={styles.accent} />
            <Text style={styles.enhancedSectionTitle}>Rendez-vous</Text>
          </View>

          <Pressable
            onPress={() => {
              // Rotation animation
              Animated.sequence([
                Animated.timing(rotateAnim, {
                  toValue: 1,
                  duration: 600,
                  useNativeDriver: true,
                }),
                Animated.timing(rotateAnim, {
                  toValue: 0,
                  duration: 0,
                  useNativeDriver: true,
                }),
              ]).start();
              onRefresh();
            }}
            onPressIn={() => {
              Animated.spring(scaleAnim, {
                toValue: 0.85,
                useNativeDriver: true,
              }).start();
            }}
            onPressOut={() => {
              Animated.spring(scaleAnim, {
                toValue: 1,
                friction: 3,
                tension: 40,
                useNativeDriver: true,
              }).start();
            }}
            style={({ pressed }) => [
              styles.refreshButton,
              pressed && styles.refreshButtonPressed,
            ]}
          >
            <Animated.View
              style={[
                styles.iconContainer,
                {
                  transform: [
                    {
                      rotate: rotateAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: ['0deg', '360deg'],
                      })
                    },
                    { scale: scaleAnim }
                  ],
                },
              ]}
            >
              <Ionicons name="refresh" size={20} color={Palette.textSecondary} />
            </Animated.View>
          </Pressable>
        </View>

        {/* Filter chips */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.filtersContainer}
        >
          {(['all', 'pending', 'confirmed', 'cancelled'] as const).map((filter) => (
            <Pressable
              key={filter}
              onPress={() => setStatusFilter(filter)}
              style={[
                styles.filterChip,
                statusFilter === filter && styles.filterChipActive
              ]}
            >
              <Text style={[
                styles.filterChipText,
                statusFilter === filter && styles.filterChipTextActive
              ]}>
                {filter === 'all' ? 'Tous' :
                  filter === 'pending' ? 'En attente' :
                    filter === 'confirmed' ? 'Confirmés' : 'Annulés'}
              </Text>
            </Pressable>
          ))}
        </ScrollView>

        {/* Search */}
        <View style={styles.searchContainer}>
          <Ionicons name="search" size={18} color={Palette.textPlaceholder} />
          <TextInput
            style={styles.searchInput}
            placeholder="Rechercher un patient..."
            placeholderTextColor={Palette.textPlaceholder}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <Pressable onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={18} color={Palette.textPlaceholder} />
            </Pressable>
          )}
        </View>

        {/* Appointments List */}
        {error ? (
          <EmptyState
            icon="alert-circle-outline"
            title="Erreur"
            description={error}
            primaryAction={{ label: 'Réessayer', icon: 'refresh', onPress: onRefresh }}
          />
        ) : filteredAppointments.length === 0 ? (
          <EmptyState
            icon="calendar-outline"
            title="Aucun rendez-vous"
            description="Aucun rendez-vous ne correspond à vos critères."
            primaryAction={{ label: 'Actualiser', icon: 'refresh', onPress: onRefresh }}
          />
        ) : (
          <View style={styles.appointmentsList}>
            {filteredAppointments.map((apt) => {
              const status = (apt.status || '').toLowerCase();
              const statusNorm = status === 'canceled' ? 'cancelled' : status;

              return (
                <Pressable
                  key={apt.id}
                  style={styles.appointmentCard}
                  onPress={() => router.push({
                    pathname: '/doctor/appointments/[id]',
                    params: { id: String(apt.id) }
                  } as any)}
                >
                  <View style={styles.appointmentAvatar}>
                    <Ionicons name="person" size={18} color={Palette.primary} />
                  </View>
                  <View style={styles.appointmentContent}>
                    <Text style={styles.appointmentName}>
                      {apt.patient_name || apt.patient?.name || 'Patient'}
                    </Text>
                    <View style={styles.appointmentMeta}>
                      <Ionicons name="calendar-outline" size={12} color={Palette.textSecondary} />
                      <Text style={styles.appointmentMetaText}>{apt.date}</Text>
                      <Text style={styles.appointmentDot}>•</Text>
                      <Ionicons name="time-outline" size={12} color={Palette.textSecondary} />
                      <Text style={styles.appointmentMetaText}>{apt.time || apt.time_start || '—'}</Text>
                    </View>
                    <View style={[
                      styles.statusBadge,
                      statusNorm === 'confirmed' && styles.statusConfirmed,
                      statusNorm === 'pending' && styles.statusPending,
                      statusNorm === 'cancelled' && styles.statusCancelled,
                    ]}>
                      <Text style={[
                        styles.statusBadgeText,
                        statusNorm === 'confirmed' && { color: Palette.success },
                        statusNorm === 'pending' && { color: '#F59E0B' },
                        statusNorm === 'cancelled' && { color: Palette.error },
                      ]}>
                        {statusNorm === 'confirmed' ? 'Confirmé' :
                          statusNorm === 'pending' ? 'En attente' :
                            statusNorm === 'cancelled' ? 'Annulé' : apt.status}
                      </Text>
                    </View>
                  </View>
                  <Ionicons name="chevron-forward" size={18} color={Palette.textPlaceholder} />
                </Pressable>
              );
            })}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

// ============================================================================
// STYLES
// ============================================================================

const styles = StyleSheet.create({
  // Container styles
  container: {
    flex: 1,
    backgroundColor: Palette.background,
  },
  scrollContent: {
    paddingBottom: 32,
  },
  centerContainer: {
    flex: 1,
    backgroundColor: Palette.background,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  centerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: Palette.text,
    marginTop: 16,
  },
  centerSubtitle: {
    fontSize: 14,
    color: Palette.textSecondary,
    textAlign: 'center',
    marginTop: 8,
    marginBottom: 24,
  },
  loadingText: {
    fontSize: 14,
    color: Palette.textSecondary,
    marginTop: 12,
  },

  // Button styles
  primaryButton: {
    backgroundColor: Palette.primary,
    paddingVertical: 14,
    paddingHorizontal: 28,
    borderRadius: 12,
  },
  primaryButtonText: {
    color: Palette.surface,
    fontSize: 16,
    fontWeight: '600',
  },

  // Header styles
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 20,
  },
  greeting: {
    fontSize: 24,
    fontWeight: '700',
    color: Palette.text,
  },
  subtitle: {
    fontSize: 14,
    color: Palette.textSecondary,
    marginTop: 2,
  },
  notificationButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Palette.surface,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Palette.border,
  },

  // Availability card
  availabilityCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginHorizontal: 20,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
  },
  availabilityAvailable: {
    backgroundColor: Palette.successBg,
    borderColor: Palette.success,
  },
  availabilityUnavailable: {
    backgroundColor: Palette.errorBg,
    borderColor: Palette.error,
  },
  availabilityContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusDot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    marginRight: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dotInner: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
  },
  availabilityTextContainer: {
    flex: 1,
  },
  availabilityTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Palette.text,
  },
  availabilityHint: {
    fontSize: 12,
    color: Palette.textSecondary,
    marginTop: 2,
  },

  // Stats row
  statsRow: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginTop: 20,
  },
  statCard: {
    flex: 1,
    backgroundColor: Palette.surface,
    padding: 14,
    borderRadius: 12,
    alignItems: 'center',
    marginRight: 10,
    borderWidth: 1,
    borderColor: Palette.border,
    position: 'relative',
    overflow: 'hidden',
  },
  statIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  statValue: {
    fontSize: 20,
    fontWeight: '700',
    color: Palette.text,
  },
  statLabel: {
    fontSize: 11,
    color: Palette.textSecondary,
    marginTop: 2,
  },
  statIndicator: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 3,
    backgroundColor: 'rgba(0, 0, 0, 0.03)',
  },

  // Section styles
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Palette.text,
    marginTop: 24,
    marginBottom: 12,
    paddingHorizontal: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingRight: 20,
  },

  // Enhanced section header (animated)
  enhancedSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 20,
    marginTop: 24,
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  accent: {
    width: 4,
    height: 20,
    backgroundColor: Palette.primary,
    borderRadius: 2,
    marginRight: 10,
  },
  enhancedSectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Palette.text,
    letterSpacing: 0.3,
  },
  refreshButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.03)',
  },
  refreshButtonPressed: {
    backgroundColor: 'rgba(0, 0, 0, 0.08)',
  },
  iconContainer: {
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Quick actions grid
  actionsGrid: {
    flexDirection: 'row',
    paddingHorizontal: 20,
  },
  actionCard: {
    flex: 1,
    backgroundColor: Palette.surface,
    padding: 14,
    borderRadius: 12,
    alignItems: 'center',
    marginRight: 10,
    borderWidth: 1,
    borderColor: Palette.border,
  },
  actionIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  actionLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: Palette.text,
    textAlign: 'center',
  },

  // Filters
  filtersContainer: {
    paddingHorizontal: 20,
    marginBottom: 12,
  },
  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: Palette.surface,
    borderWidth: 1,
    borderColor: Palette.border,
    marginRight: 8,
  },
  filterChipActive: {
    backgroundColor: Palette.primaryLight,
    borderColor: Palette.primary,
  },
  filterChipText: {
    fontSize: 13,
    fontWeight: '600',
    color: Palette.textSecondary,
  },
  filterChipTextActive: {
    color: Palette.primary,
  },

  // Search
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Palette.surface,
    marginHorizontal: 20,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Palette.border,
    marginBottom: 16,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: Palette.text,
    marginLeft: 10,
    marginRight: 10,
  },

  // Appointments list
  appointmentsList: {
    paddingHorizontal: 20,
  },
  appointmentCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Palette.surface,
    padding: 14,
    borderRadius: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: Palette.border,
  },
  appointmentAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Palette.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  appointmentContent: {
    flex: 1,
  },
  appointmentName: {
    fontSize: 15,
    fontWeight: '600',
    color: Palette.text,
  },
  appointmentMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    marginBottom: 6,
  },
  appointmentMetaText: {
    fontSize: 12,
    color: Palette.textSecondary,
    marginLeft: 4,
  },
  appointmentDot: {
    fontSize: 12,
    color: Palette.textPlaceholder,
    marginHorizontal: 6,
  },
  statusBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    backgroundColor: Palette.background,
  },
  statusConfirmed: {
    backgroundColor: Palette.successBg,
  },
  statusPending: {
    backgroundColor: '#FEF3C7',
  },
  statusCancelled: {
    backgroundColor: Palette.errorBg,
  },
  statusBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: Palette.textSecondary,
  },
});
