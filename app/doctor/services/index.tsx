import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, ActivityIndicator, Pressable, StyleSheet, RefreshControl, ScrollView, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { apiClient } from '../../../lib/apiClient';
import { EmptyState } from '@/components/EmptyState';

interface Service {
  id: number;
  title: string;
  description: string;
  type: string;
  price: number;
  duration: number;
  address: string;
  phone: string;
  email: string;
  is_active: boolean;
  pourcentage_reduction: number;
  rdv_count: number;
  confirmed_rdv_count: number;
  discounted_price: number;
}

export default function ServicesScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [services, setServices] = useState<Service[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'active' | 'inactive'>('all');

  const loadServices = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await apiClient.get('/doctor/annonces');
      setServices(Array.isArray(data) ? data : []);
    } catch (e: any) {
      setServices([]);
      const msg = e?.response?.status === 401 ? 'Authentification requise' : 'Erreur de chargement';
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, []);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadServices();
    setRefreshing(false);
  }, [loadServices]);

  useEffect(() => {
    loadServices();
  }, [loadServices]);

  const toggleServiceStatus = async (id: number, currentStatus: boolean) => {
    try {
      await apiClient.put(`/doctor/annonces/${id}/toggle-status`, {
        is_active: !currentStatus,
      });
      // Update local state
      setServices(prev => prev.map(s => s.id === id ? { ...s, is_active: !currentStatus } : s));
    } catch (e) {
      Alert.alert('Erreur', 'Impossible de modifier le statut du service');
    }
  };

  const activateAll = async () => {
    try {
      await apiClient.post('/doctor/annonces/activate-all');
      await loadServices();
      Alert.alert('Succès', 'Tous les services ont été activés');
    } catch (e) {
      Alert.alert('Erreur', 'Impossible d\'activer tous les services');
    }
  };

  const deactivateAll = async () => {
    Alert.alert(
      'Confirmation',
      'Voulez-vous vraiment désactiver tous vos services ?',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Désactiver',
          style: 'destructive',
          onPress: async () => {
            try {
              await apiClient.post('/doctor/annonces/deactivate-all');
              await loadServices();
              Alert.alert('Succès', 'Tous les services ont été désactivés');
            } catch (e) {
              Alert.alert('Erreur', 'Impossible de désactiver tous les services');
            }
          },
        },
      ]
    );
  };

  const filteredServices = services.filter(s => {
    if (filter === 'active') return s.is_active;
    if (filter === 'inactive') return !s.is_active;
    return true;
  });

  const activeCount = services.filter(s => s.is_active).length;
  const inactiveCount = services.filter(s => !s.is_active).length;

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
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#111827" />
        </Pressable>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle}>Mes Services</Text>
          <Text style={styles.headerSubtitle}>{services.length} service{services.length > 1 ? 's' : ''}</Text>
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#2563EB']} />}
      >
        {/* Stats Cards */}
        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <View style={[styles.statIconContainer, { backgroundColor: '#DCFCE7' }]}>
              <Ionicons name="checkmark-circle" size={24} color="#10B981" />
            </View>
            <Text style={styles.statValue}>{activeCount}</Text>
            <Text style={styles.statLabel}>Actifs</Text>
          </View>
          <View style={styles.statCard}>
            <View style={[styles.statIconContainer, { backgroundColor: '#FEE2E2' }]}>
              <Ionicons name="close-circle" size={24} color="#EF4444" />
            </View>
            <Text style={styles.statValue}>{inactiveCount}</Text>
            <Text style={styles.statLabel}>Inactifs</Text>
          </View>
          <View style={styles.statCard}>
            <View style={[styles.statIconContainer, { backgroundColor: '#EFF6FF' }]}>
              <Ionicons name="calendar" size={24} color="#2563EB" />
            </View>
            <Text style={styles.statValue}>{services.reduce((acc, s) => acc + s.rdv_count, 0)}</Text>
            <Text style={styles.statLabel}>RDV Total</Text>
          </View>
        </View>

        {/* Bulk Actions */}
        <View style={styles.bulkActionsContainer}>
          <Text style={styles.sectionTitle}>Actions groupées</Text>
          <View style={styles.bulkActionsRow}>
            <Pressable style={styles.bulkActionBtn} onPress={activateAll}>
              <Ionicons name="checkmark-circle" size={20} color="#10B981" />
              <Text style={styles.bulkActionText}>Tout activer</Text>
            </Pressable>
            <Pressable style={styles.bulkActionBtn} onPress={deactivateAll}>
              <Ionicons name="close-circle" size={20} color="#EF4444" />
              <Text style={styles.bulkActionText}>Tout désactiver</Text>
            </Pressable>
          </View>
        </View>

        {/* Filters */}
        <View style={styles.filtersContainer}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {(['all', 'active', 'inactive'] as const).map((f) => (
              <Pressable
                key={f}
                onPress={() => setFilter(f)}
                style={[styles.filterChip, filter === f && styles.filterChipActive]}
              >
                <Text style={[styles.filterChipText, filter === f && styles.filterChipTextActive]}>
                  {f === 'all' ? 'Tous' : f === 'active' ? 'Actifs' : 'Inactifs'}
                </Text>
              </Pressable>
            ))}
          </ScrollView>
        </View>

        {/* Services List */}
        {error ? (
          <View style={styles.emptyContainer}>
            <EmptyState
              icon="lock-closed-outline"
              title="Authentification requise"
              description="Connectez-vous pour voir vos services."
              primaryAction={{ label: 'Se connecter', icon: 'log-in-outline', onPress: () => router.push('/auth/professional' as any) }}
            />
          </View>
        ) : filteredServices.length === 0 ? (
          <View style={styles.emptyContainer}>
            <EmptyState
              icon="medical-outline"
              title="Aucun service"
              description={filter === 'all' ? "Vous n'avez pas encore de services." : `Aucun service ${filter === 'active' ? 'actif' : 'inactif'}.`}
              primaryAction={{ label: 'Actualiser', icon: 'refresh', onPress: onRefresh }}
            />
          </View>
        ) : (
          <View style={styles.servicesList}>
            {filteredServices.map((service) => (
              <View key={service.id} style={styles.serviceCard}>
                <View style={styles.serviceHeader}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.serviceTitle}>{service.title}</Text>
                    <Text style={styles.serviceDescription} numberOfLines={2}>
                      {service.description}
                    </Text>
                  </View>
                  <Pressable
                    onPress={() => toggleServiceStatus(service.id, service.is_active)}
                    style={[styles.toggleSwitch, service.is_active && styles.toggleSwitchActive]}
                  >
                    <View style={[styles.toggleThumb, service.is_active && styles.toggleThumbActive]} />
                  </Pressable>
                </View>

                <View style={styles.serviceDetails}>
                  <View style={styles.serviceDetailRow}>
                    <Ionicons name="cash-outline" size={16} color="#6B7280" />
                    <Text style={styles.serviceDetailText}>
                      {service.discounted_price < service.price ? (
                        <>
                          <Text style={styles.originalPrice}>{service.price} DH</Text>
                          {' '}
                          <Text style={styles.discountedPrice}>{service.discounted_price} DH</Text>
                          {' '}
                          <Text style={styles.discountBadge}>-{service.pourcentage_reduction}%</Text>
                        </>
                      ) : (
                        `${service.price} DH`
                      )}
                    </Text>
                  </View>
                  <View style={styles.serviceDetailRow}>
                    <Ionicons name="time-outline" size={16} color="#6B7280" />
                    <Text style={styles.serviceDetailText}>{service.duration} min</Text>
                  </View>
                  <View style={styles.serviceDetailRow}>
                    <Ionicons name="calendar-outline" size={16} color="#6B7280" />
                    <Text style={styles.serviceDetailText}>
                      {service.rdv_count} RDV ({service.confirmed_rdv_count} confirmés)
                    </Text>
                  </View>
                </View>

                <View style={styles.serviceFooter}>
                  <View style={[styles.statusBadge, { backgroundColor: service.is_active ? '#DCFCE7' : '#FEE2E2' }]}>
                    <Text style={[styles.statusText, { color: service.is_active ? '#10B981' : '#EF4444' }]}>
                      {service.is_active ? 'Actif' : 'Inactif'}
                    </Text>
                  </View>
                  <Pressable
                    onPress={() => router.push({ pathname: '/doctor/services/[id]', params: { id: String(service.id) } } as any)}
                    style={styles.detailsButton}
                  >
                    <Text style={styles.detailsButtonText}>Détails</Text>
                    <Ionicons name="chevron-forward" size={16} color="#2563EB" />
                  </Pressable>
                </View>
              </View>
            ))}
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
  header: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 20,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F9FAFB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111827',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 2,
  },
  statsContainer: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
  },
  statCard: {
    flex: 1,
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
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
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
  bulkActionsContainer: {
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 12,
  },
  bulkActionsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  bulkActionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#FFFFFF',
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  bulkActionText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
  },
  filtersContainer: {
    paddingHorizontal: 20,
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
  emptyContainer: {
    paddingVertical: 40,
  },
  servicesList: {
    paddingHorizontal: 20,
    gap: 16,
    paddingBottom: 24,
  },
  serviceCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  serviceHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    marginBottom: 16,
  },
  serviceTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 4,
  },
  serviceDescription: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
  },
  toggleSwitch: {
    width: 52,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#E5E7EB',
    padding: 2,
    justifyContent: 'center',
  },
  toggleSwitchActive: {
    backgroundColor: '#10B981',
  },
  toggleThumb: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
  },
  toggleThumbActive: {
    alignSelf: 'flex-end',
  },
  serviceDetails: {
    gap: 8,
    marginBottom: 16,
  },
  serviceDetailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  serviceDetailText: {
    fontSize: 14,
    color: '#6B7280',
  },
  originalPrice: {
    textDecorationLine: 'line-through',
    color: '#9CA3AF',
  },
  discountedPrice: {
    fontWeight: '700',
    color: '#10B981',
  },
  discountBadge: {
    fontSize: 12,
    fontWeight: '700',
    color: '#10B981',
  },
  serviceFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  detailsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  detailsButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2563EB',
  },
});
