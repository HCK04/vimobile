import React, { useEffect, useState } from 'react';
import { View, Text, ActivityIndicator, StyleSheet, Pressable, Alert, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { apiClient } from '../../../lib/apiClient';

export default function DoctorAppointmentDetailsScreen() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [item, setItem] = useState<any>(null);

  const load = async () => {
    setLoading(true);
    try {
      const { data } = await apiClient.get(`/doctor/appointments/${encodeURIComponent(String(id || ''))}`);
      setItem(data);
    } catch (e: any) {
      const msg = e?.response?.data?.message || e?.message || 'Impossible de charger le rendez-vous';
      Alert.alert('Erreur', msg);
      setItem(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [id]);

  const updateStatus = async (status: 'confirmed' | 'cancelled' | 'completed' | 'missed') => {
    try {
      setActionLoading(true);
      await apiClient.put(`/doctor/appointments/${encodeURIComponent(String(id || ''))}/status`, { status });
      // Reload appointment data to get updated status from backend
      await load();
      const messages: Record<string, string> = {
        confirmed: 'Rendez-vous confirmé avec succès',
        cancelled: 'Rendez-vous annulé',
        completed: 'Rendez-vous marqué comme terminé',
        missed: 'Rendez-vous marqué comme manqué'
      };
      Alert.alert('Succès', messages[status] || 'Statut mis à jour');
    } catch (e: any) {
      const msg = e?.response?.data?.message || e?.message || 'Impossible de mettre à jour le statut';
      Alert.alert('Erreur', msg);
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#2563EB" />
          <Text style={styles.loadingText}>Chargement...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!item) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#111827" />
          </Pressable>
          <Text style={styles.headerTitle}>Rendez-vous</Text>
        </View>
        <View style={styles.emptyContainer}>
          <Ionicons name="calendar-outline" size={64} color="#D1D5DB" />
          <Text style={styles.emptyText}>Rendez-vous introuvable</Text>
          <Pressable onPress={() => router.back()} style={styles.emptyButton}>
            <Text style={styles.emptyButtonText}>Retour</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  const statusConfig: Record<string, { color: string; bg: string; label: string; icon: any }> = {
    pending: { color: '#F59E0B', bg: '#FEF3C7', label: 'En attente', icon: 'time-outline' },
    confirmed: { color: '#10B981', bg: '#DCFCE7', label: 'Confirmé', icon: 'checkmark-circle' },
    cancelled: { color: '#EF4444', bg: '#FEE2E2', label: 'Annulé', icon: 'close-circle' },
    canceled: { color: '#EF4444', bg: '#FEE2E2', label: 'Annulé', icon: 'close-circle' },
    completed: { color: '#8B5CF6', bg: '#F3E8FF', label: 'Terminé', icon: 'checkmark-done-circle' },
    missed: { color: '#6B7280', bg: '#F3F4F6', label: 'Manqué', icon: 'alert-circle' },
  };

  const currentStatus = statusConfig[item.status?.toLowerCase()] || statusConfig.pending;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#111827" />
        </Pressable>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle}>Détails du rendez-vous</Text>
          <Text style={styles.headerSubtitle}>#{item.id}</Text>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Status Badge */}
        <View style={styles.section}>
          <View style={[styles.statusBanner, { backgroundColor: currentStatus.bg }]}>
            <Ionicons name={currentStatus.icon} size={24} color={currentStatus.color} />
            <Text style={[styles.statusBannerText, { color: currentStatus.color }]}>
              {currentStatus.label}
            </Text>
          </View>
        </View>

        {/* Date & Time Card */}
        <View style={styles.section}>
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <View style={styles.cardIconContainer}>
                <Ionicons name="calendar" size={24} color="#2563EB" />
              </View>
              <Text style={styles.cardTitle}>Date et heure</Text>
            </View>
            <View style={styles.cardContent}>
              <View style={styles.infoRow}>
                <Ionicons name="calendar-outline" size={20} color="#6B7280" />
                <Text style={styles.infoLabel}>Date</Text>
                <Text style={styles.infoValue}>{item.date || '—'}</Text>
              </View>
              <View style={styles.divider} />
              <View style={styles.infoRow}>
                <Ionicons name="time-outline" size={20} color="#6B7280" />
                <Text style={styles.infoLabel}>Heure</Text>
                <Text style={styles.infoValue}>{item.time || '—'}</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Patient Info Card */}
        <View style={styles.section}>
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <View style={[styles.cardIconContainer, { backgroundColor: '#DCFCE7' }]}>
                <Ionicons name="person" size={24} color="#10B981" />
              </View>
              <Text style={styles.cardTitle}>Informations patient</Text>
            </View>
            <View style={styles.cardContent}>
              <View style={styles.infoRow}>
                <Ionicons name="person-outline" size={20} color="#6B7280" />
                <Text style={styles.infoLabel}>Nom</Text>
                <Text style={styles.infoValue}>{item.patient?.name || item.patient_name || '—'}</Text>
              </View>
              {(item.patient_phone || item.patient?.phone) && (
                <>
                  <View style={styles.divider} />
                  <View style={styles.infoRow}>
                    <Ionicons name="call-outline" size={20} color="#6B7280" />
                    <Text style={styles.infoLabel}>Téléphone</Text>
                    <Text style={styles.infoValue}>{item.patient_phone || item.patient?.phone}</Text>
                  </View>
                </>
              )}
              {(item.patient_email || item.patient?.email) && (
                <>
                  <View style={styles.divider} />
                  <View style={styles.infoRow}>
                    <Ionicons name="mail-outline" size={20} color="#6B7280" />
                    <Text style={styles.infoLabel}>Email</Text>
                    <Text style={styles.infoValue}>{item.patient_email || item.patient?.email}</Text>
                  </View>
                </>
              )}
            </View>
          </View>
        </View>

        {/* Appointment Details Card */}
        <View style={styles.section}>
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <View style={[styles.cardIconContainer, { backgroundColor: '#FEF3C7' }]}>
                <Ionicons name="document-text" size={24} color="#F59E0B" />
              </View>
              <Text style={styles.cardTitle}>Détails de la consultation</Text>
            </View>
            <View style={styles.cardContent}>
              <View style={styles.infoRow}>
                <Ionicons name="clipboard-outline" size={20} color="#6B7280" />
                <Text style={styles.infoLabel}>Motif</Text>
                <Text style={[styles.infoValue, { flex: 2 }]}>{item.reason || 'Non spécifié'}</Text>
              </View>
              {item.notes && (
                <>
                  <View style={styles.divider} />
                  <View style={styles.infoRow}>
                    <Ionicons name="chatbox-outline" size={20} color="#6B7280" />
                    <Text style={styles.infoLabel}>Notes</Text>
                    <Text style={[styles.infoValue, { flex: 2 }]}>{item.notes}</Text>
                  </View>
                </>
              )}
              {item.price && (
                <>
                  <View style={styles.divider} />
                  <View style={styles.infoRow}>
                    <Ionicons name="cash-outline" size={20} color="#6B7280" />
                    <Text style={styles.infoLabel}>Prix</Text>
                    <Text style={styles.infoValue}>{item.price} DH</Text>
                  </View>
                </>
              )}
            </View>
          </View>
        </View>

        {/* Annonce Info (if exists) */}
        {item.annonce && (
          <View style={styles.section}>
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <View style={[styles.cardIconContainer, { backgroundColor: '#F3E8FF' }]}>
                  <Ionicons name="pricetag" size={24} color="#8B5CF6" />
                </View>
                <Text style={styles.cardTitle}>Offre associée</Text>
              </View>
              <View style={styles.cardContent}>
                <View style={styles.infoRow}>
                  <Ionicons name="megaphone-outline" size={20} color="#6B7280" />
                  <Text style={styles.infoLabel}>Titre</Text>
                  <Text style={[styles.infoValue, { flex: 2 }]}>{item.annonce.title}</Text>
                </View>
                {item.annonce.description && (
                  <>
                    <View style={styles.divider} />
                    <View style={styles.infoRow}>
                      <Ionicons name="information-circle-outline" size={20} color="#6B7280" />
                      <Text style={styles.infoLabel}>Description</Text>
                      <Text style={[styles.infoValue, { flex: 2 }]}>{item.annonce.description}</Text>
                    </View>
                  </>
                )}
                {item.annonce.pourcentage_reduction > 0 && (
                  <>
                    <View style={styles.divider} />
                    <View style={styles.infoRow}>
                      <Ionicons name="gift-outline" size={20} color="#6B7280" />
                      <Text style={styles.infoLabel}>Réduction</Text>
                      <Text style={styles.infoValue}>{item.annonce.pourcentage_reduction}%</Text>
                    </View>
                  </>
                )}
              </View>
            </View>
          </View>
        )}

        {/* Action Buttons */}
        <View style={styles.section}>
          {item.status === 'pending' && (
            <>
              <Text style={styles.actionsTitle}>Actions</Text>
              <View style={styles.actionsContainer}>
                <Pressable 
                  disabled={actionLoading} 
                  onPress={() => updateStatus('confirmed')} 
                  style={[styles.actionButton, styles.confirmButton, actionLoading && styles.actionButtonDisabled]}
                >
                  {actionLoading ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <>
                      <Ionicons name="checkmark-circle" size={20} color="#fff" />
                      <Text style={styles.actionButtonText}>Confirmer</Text>
                    </>
                  )}
                </Pressable>
                <Pressable 
                  disabled={actionLoading} 
                  onPress={() => updateStatus('cancelled')} 
                  style={[styles.actionButton, styles.cancelButton, actionLoading && styles.actionButtonDisabled]}
                >
                  {actionLoading ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <>
                      <Ionicons name="close-circle" size={20} color="#fff" />
                      <Text style={styles.actionButtonText}>Refuser</Text>
                    </>
                  )}
                </Pressable>
              </View>
            </>
          )}

          {item.status === 'confirmed' && (
            <>
              <Text style={styles.actionsTitle}>Marquer comme</Text>
              <View style={styles.actionsContainer}>
                <Pressable 
                  disabled={actionLoading} 
                  onPress={() => updateStatus('completed')} 
                  style={[styles.actionButton, styles.completeButton, actionLoading && styles.actionButtonDisabled]}
                >
                  {actionLoading ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <>
                      <Ionicons name="checkmark-done-circle" size={20} color="#fff" />
                      <Text style={styles.actionButtonText}>Terminé</Text>
                    </>
                  )}
                </Pressable>
                <Pressable 
                  disabled={actionLoading} 
                  onPress={() => updateStatus('missed')} 
                  style={[styles.actionButton, styles.missedButton, actionLoading && styles.actionButtonDisabled]}
                >
                  {actionLoading ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <>
                      <Ionicons name="alert-circle" size={20} color="#fff" />
                      <Text style={styles.actionButtonText}>Manqué</Text>
                    </>
                  )}
                </Pressable>
              </View>
            </>
          )}
        </View>
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
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#6B7280',
    marginTop: 16,
    marginBottom: 24,
  },
  emptyButton: {
    backgroundColor: '#2563EB',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  emptyButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
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
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 2,
  },
  section: {
    paddingHorizontal: 20,
    marginTop: 20,
  },
  statusBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 16,
  },
  statusBannerText: {
    fontSize: 18,
    fontWeight: '700',
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  cardIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
  },
  cardContent: {
    padding: 16,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 8,
  },
  infoLabel: {
    fontSize: 14,
    color: '#6B7280',
    flex: 1,
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
    flex: 1,
    textAlign: 'right',
  },
  divider: {
    height: 1,
    backgroundColor: '#F3F4F6',
    marginVertical: 8,
  },
  actionsTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 12,
  },
  actionsContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 32,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  actionButtonDisabled: {
    opacity: 0.6,
  },
  actionButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  confirmButton: {
    backgroundColor: '#10B981',
  },
  cancelButton: {
    backgroundColor: '#EF4444',
  },
  completeButton: {
    backgroundColor: '#8B5CF6',
  },
  missedButton: {
    backgroundColor: '#6B7280',
  },
});
