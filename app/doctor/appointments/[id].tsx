import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  ActivityIndicator,
  Pressable,
  StyleSheet,
  ScrollView,
  RefreshControl,
  Alert,
  Linking
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { apiClient } from '../../../lib/apiClient';
import { Palette } from '../../../constants/Colors';

export default function AppointmentDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [appointment, setAppointment] = useState<any>(null);
  const [updating, setUpdating] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await apiClient.get(`/doctor/appointments/${id}`);
      setAppointment(data);
    } catch (e) {
      setAppointment(null);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { load(); }, [load]);

  const onRefresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  const getStatusInfo = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'confirmed':
        return { color: Palette.success, label: 'Confirmé', bg: '#ECFDF5', icon: 'checkmark-circle' };
      case 'pending':
        return { color: '#F59E0B', label: 'En attente', bg: '#FEF3C7', icon: 'time' };
      case 'completed':
        return { color: '#8B5CF6', label: 'Terminé', bg: '#F3E8FF', icon: 'checkmark-done' };
      case 'cancelled':
      case 'canceled':
        return { color: Palette.error, label: 'Annulé', bg: '#FEF2F2', icon: 'close-circle' };
      default:
        return { color: Palette.textPlaceholder, label: 'Inconnu', bg: '#F3F4F6', icon: 'help-circle' };
    }
  };

  const updateStatus = async (newStatus: string) => {
    setUpdating(true);
    try {
      await apiClient.post(`/doctor/appointments/${id}/status`, { status: newStatus });
      await load();
      Alert.alert('Succès', `Rendez-vous ${newStatus === 'confirmed' ? 'confirmé' : newStatus === 'cancelled' ? 'annulé' : 'mis à jour'}`);
    } catch (e) {
      Alert.alert('Erreur', 'Impossible de mettre à jour le statut');
    } finally {
      setUpdating(false);
    }
  };

  const confirmCancel = () => {
    Alert.alert(
      'Annuler le rendez-vous',
      'Êtes-vous sûr de vouloir annuler ce rendez-vous ?',
      [
        { text: 'Non', style: 'cancel' },
        { text: 'Oui, annuler', style: 'destructive', onPress: () => updateStatus('cancelled') },
      ]
    );
  };

  const callPatient = () => {
    const phone = appointment?.patient?.phone || appointment?.patient_phone;
    if (phone) {
      Linking.openURL(`tel:${phone}`);
    } else {
      Alert.alert('Information', 'Numéro de téléphone non disponible');
    }
  };

  const whatsappPatient = async () => {
    const phone = appointment?.patient?.phone || appointment?.patient_phone;
    if (!phone) {
      Alert.alert('Information', 'Numéro de téléphone non disponible');
      return;
    }

    // Format phone for WhatsApp (remove spaces, dashes, and ensure country code)
    let formattedPhone = phone.replace(/[\s-()]/g, '');

    // Add Morocco country code if not present (adjust based on your region)
    if (formattedPhone.startsWith('0')) {
      formattedPhone = '212' + formattedPhone.substring(1);
    } else if (!formattedPhone.startsWith('+') && !formattedPhone.startsWith('212')) {
      formattedPhone = '212' + formattedPhone;
    }
    formattedPhone = formattedPhone.replace('+', '');

    const patientName = appointment.patient?.name || appointment.patient_name || 'Patient';
    const appointmentDate = appointment.date_time
      ? new Date(appointment.date_time).toLocaleDateString('fr-FR')
      : appointment.date || '';

    // Pre-filled message
    const message = `Bonjour ${patientName},\n\nCeci est un rappel concernant votre rendez-vous${appointmentDate ? ` du ${appointmentDate}` : ''}.\n\nCordialement`;

    const whatsappUrl = `whatsapp://send?phone=${formattedPhone}&text=${encodeURIComponent(message)}`;

    try {
      const canOpen = await Linking.canOpenURL(whatsappUrl);
      if (canOpen) {
        await Linking.openURL(whatsappUrl);
      } else {
        // Fallback to web WhatsApp
        await Linking.openURL(`https://wa.me/${formattedPhone}?text=${encodeURIComponent(message)}`);
      }
    } catch (e) {
      Alert.alert('Erreur', 'Impossible d\'ouvrir WhatsApp. Vérifiez que l\'application est installée.');
    }
  };

  if (loading && !refreshing) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Palette.primary} />
          <Text style={styles.loadingText}>Chargement...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!appointment) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.headerContainer}>
          <View style={styles.header}>
            <Pressable onPress={() => router.back()} style={styles.backBtn}>
              <Ionicons name="arrow-back" size={22} color={Palette.text} />
            </Pressable>
            <Text style={styles.headerTitle}>Détails</Text>
          </View>
        </View>
        <View style={styles.errorContainer}>
          <View style={styles.errorIconContainer}>
            <Ionicons name="alert-circle-outline" size={48} color={Palette.error} />
          </View>
          <Text style={styles.errorTitle}>Rendez-vous introuvable</Text>
          <Text style={styles.errorSubtitle}>Ce rendez-vous n'existe pas ou a été supprimé</Text>
          <Pressable style={styles.retryButton} onPress={load}>
            <Ionicons name="refresh" size={18} color={Palette.surface} />
            <Text style={styles.retryButtonText}>Réessayer</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  const statusInfo = getStatusInfo(appointment.status);
  const patientName = appointment.patient?.name || appointment.patient_name || 'Patient';
  const patientPhone = appointment.patient?.phone || appointment.patient_phone;
  const patientEmail = appointment.patient?.email || appointment.patient_email;
  const isPending = appointment.status?.toLowerCase() === 'pending';
  const isActive = ['pending', 'confirmed'].includes(appointment.status?.toLowerCase());

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.headerContainer}>
        <View style={styles.header}>
          <Pressable
            onPress={() => router.back()}
            style={styles.backBtn}
            android_ripple={{ color: Palette.primaryLight, radius: 20 }}
          >
            <Ionicons name="arrow-back" size={22} color={Palette.text} />
          </Pressable>
          <View style={styles.headerTextContainer}>
            <Text style={styles.headerTitle}>Détails du rendez-vous</Text>
          </View>
        </View>
        <View style={styles.accentLine} />
      </View>

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
        {/* Status Card */}
        <View style={[styles.statusCard, { borderLeftColor: statusInfo.color }]}>
          <View style={[styles.statusIconContainer, { backgroundColor: statusInfo.bg }]}>
            <Ionicons name={statusInfo.icon as any} size={24} color={statusInfo.color} />
          </View>
          <View style={styles.statusTextContainer}>
            <Text style={styles.statusLabel}>Statut</Text>
            <Text style={[styles.statusValue, { color: statusInfo.color }]}>
              {statusInfo.label}
            </Text>
          </View>
        </View>

        {/* Patient Info Card */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <View style={styles.cardIconContainer}>
              <Ionicons name="person" size={20} color={Palette.primary} />
            </View>
            <Text style={styles.cardTitle}>Patient</Text>
          </View>
          <View style={styles.cardDivider} />

          <View style={styles.patientRow}>
            <View style={styles.avatarLarge}>
              <Text style={styles.avatarLargeText}>
                {patientName[0].toUpperCase()}
              </Text>
            </View>
            <View style={styles.patientInfo}>
              <Text style={styles.patientName}>{patientName}</Text>
              {patientPhone && (
                <View style={styles.infoRow}>
                  <Ionicons name="call-outline" size={14} color={Palette.textSecondary} />
                  <Text style={styles.infoText}>{patientPhone}</Text>
                </View>
              )}
              {patientEmail && (
                <View style={styles.infoRow}>
                  <Ionicons name="mail-outline" size={14} color={Palette.textSecondary} />
                  <Text style={styles.infoText}>{patientEmail}</Text>
                </View>
              )}
            </View>
          </View>

          {patientPhone && (
            <View style={styles.contactButtonsRow}>
              <Pressable style={styles.callButton} onPress={callPatient}>
                <Ionicons name="call" size={18} color={Palette.surface} />
                <Text style={styles.callButtonText}>Appeler</Text>
              </Pressable>
              <Pressable style={styles.whatsappButton} onPress={whatsappPatient}>
                <Ionicons name="logo-whatsapp" size={18} color={Palette.surface} />
                <Text style={styles.whatsappButtonText}>WhatsApp</Text>
              </Pressable>
            </View>
          )}
        </View>

        {/* Appointment Details Card */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <View style={[styles.cardIconContainer, { backgroundColor: '#FEF3C7' }]}>
              <Ionicons name="calendar" size={20} color="#F59E0B" />
            </View>
            <Text style={styles.cardTitle}>Détails</Text>
          </View>
          <View style={styles.cardDivider} />

          <View style={styles.detailsGrid}>
            <View style={styles.detailItem}>
              <Ionicons name="calendar-outline" size={18} color={Palette.textSecondary} />
              <View style={styles.detailContent}>
                <Text style={styles.detailLabel}>Date</Text>
                <Text style={styles.detailValue}>
                  {appointment.date_time
                    ? new Date(appointment.date_time).toLocaleDateString('fr-FR', {
                      weekday: 'long',
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric'
                    })
                    : appointment.date || '—'}
                </Text>
              </View>
            </View>

            <View style={styles.detailItem}>
              <Ionicons name="time-outline" size={18} color={Palette.textSecondary} />
              <View style={styles.detailContent}>
                <Text style={styles.detailLabel}>Heure</Text>
                <Text style={styles.detailValue}>
                  {appointment.date_time
                    ? new Date(appointment.date_time).toLocaleTimeString('fr-FR', {
                      hour: '2-digit',
                      minute: '2-digit'
                    })
                    : appointment.time || appointment.time_start || '—'}
                </Text>
              </View>
            </View>

            {appointment.service && (
              <View style={styles.detailItem}>
                <Ionicons name="medical-outline" size={18} color={Palette.textSecondary} />
                <View style={styles.detailContent}>
                  <Text style={styles.detailLabel}>Service</Text>
                  <Text style={styles.detailValue}>{appointment.service}</Text>
                </View>
              </View>
            )}

            {appointment.duration && (
              <View style={styles.detailItem}>
                <Ionicons name="hourglass-outline" size={18} color={Palette.textSecondary} />
                <View style={styles.detailContent}>
                  <Text style={styles.detailLabel}>Durée</Text>
                  <Text style={styles.detailValue}>{appointment.duration} min</Text>
                </View>
              </View>
            )}
          </View>
        </View>

        {/* Reason Card */}
        {appointment.reason && (
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <View style={[styles.cardIconContainer, { backgroundColor: '#F3E8FF' }]}>
                <Ionicons name="document-text" size={20} color="#8B5CF6" />
              </View>
              <Text style={styles.cardTitle}>Motif de consultation</Text>
            </View>
            <View style={styles.cardDivider} />
            <Text style={styles.reasonText}>{appointment.reason}</Text>
          </View>
        )}

        {/* Notes Card */}
        {appointment.notes && (
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <View style={[styles.cardIconContainer, { backgroundColor: Palette.successBg }]}>
                <Ionicons name="create" size={20} color={Palette.success} />
              </View>
              <Text style={styles.cardTitle}>Notes</Text>
            </View>
            <View style={styles.cardDivider} />
            <Text style={styles.reasonText}>{appointment.notes}</Text>
          </View>
        )}

        {/* Action Buttons */}
        {isActive && (
          <View style={styles.actionsContainer}>
            {isPending && (
              <Pressable
                style={[styles.actionButton, styles.confirmButton]}
                onPress={() => updateStatus('confirmed')}
                disabled={updating}
              >
                {updating ? (
                  <ActivityIndicator size="small" color={Palette.surface} />
                ) : (
                  <>
                    <Ionicons name="checkmark-circle" size={20} color={Palette.surface} />
                    <Text style={styles.actionButtonText}>Confirmer</Text>
                  </>
                )}
              </Pressable>
            )}
            <Pressable
              style={[styles.actionButton, styles.cancelButton]}
              onPress={confirmCancel}
              disabled={updating}
            >
              <Ionicons name="close-circle" size={20} color={Palette.error} />
              <Text style={[styles.actionButtonText, { color: Palette.error }]}>Annuler</Text>
            </Pressable>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Palette.background
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center'
  },
  loadingText: {
    marginTop: 16,
    fontSize: 15,
    color: Palette.textSecondary
  },

  // Header
  headerContainer: {
    backgroundColor: Palette.surface,
    borderBottomWidth: 1,
    borderBottomColor: Palette.border,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 12
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Palette.background,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    borderWidth: 1,
    borderColor: Palette.border,
  },
  headerTextContainer: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: Palette.text,
    letterSpacing: -0.3
  },
  accentLine: {
    height: 3,
    backgroundColor: Palette.primary,
    marginLeft: 68,
    marginBottom: 0,
    borderRadius: 2,
    width: 40
  },

  // Error state
  errorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  errorIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Palette.errorBg,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Palette.text,
    marginTop: 8
  },
  errorSubtitle: {
    fontSize: 14,
    color: Palette.textSecondary,
    marginTop: 6,
    textAlign: 'center',
  },
  retryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Palette.primary,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
    marginTop: 24,
  },
  retryButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: Palette.surface,
    marginLeft: 8,
  },

  // Scroll content
  scrollContent: {
    padding: 16,
    paddingBottom: 32,
  },

  // Status card
  statusCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Palette.surface,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: Palette.border,
    borderLeftWidth: 4,
  },
  statusIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  statusTextContainer: {
    flex: 1,
  },
  statusLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: Palette.textSecondary,
    marginBottom: 2,
  },
  statusValue: {
    fontSize: 18,
    fontWeight: '700',
  },

  // Card
  card: {
    backgroundColor: Palette.surface,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: Palette.border,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  cardIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: Palette.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Palette.text,
  },
  cardDivider: {
    height: 1,
    backgroundColor: Palette.border,
    marginVertical: 14,
  },

  // Patient
  patientRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarLarge: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Palette.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: Palette.primary,
    marginRight: 14,
  },
  avatarLargeText: {
    fontSize: 22,
    fontWeight: '700',
    color: Palette.primary,
  },
  patientInfo: {
    flex: 1,
  },
  patientName: {
    fontSize: 18,
    fontWeight: '700',
    color: Palette.text,
    marginBottom: 4,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  infoText: {
    fontSize: 13,
    color: Palette.textSecondary,
    marginLeft: 6,
  },
  callButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Palette.success,
    paddingVertical: 12,
    borderRadius: 12,
    marginRight: 8,
  },
  callButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: Palette.surface,
    marginLeft: 8,
  },
  contactButtonsRow: {
    flexDirection: 'row',
    marginTop: 16,
  },
  whatsappButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#25D366', // WhatsApp green
    paddingVertical: 12,
    borderRadius: 12,
  },
  whatsappButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: Palette.surface,
    marginLeft: 8,
  },

  // Details grid
  detailsGrid: {
    // No gap needed
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: Palette.border,
  },
  detailContent: {
    flex: 1,
    marginLeft: 12,
  },
  detailLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: Palette.textSecondary,
    marginBottom: 2,
  },
  detailValue: {
    fontSize: 15,
    fontWeight: '600',
    color: Palette.text,
  },

  // Reason
  reasonText: {
    fontSize: 15,
    color: Palette.text,
    lineHeight: 22,
  },

  // Actions
  actionsContainer: {
    marginTop: 8,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 12,
    marginBottom: 10,
  },
  confirmButton: {
    backgroundColor: Palette.success,
  },
  cancelButton: {
    backgroundColor: Palette.errorBg,
    borderWidth: 1.5,
    borderColor: Palette.error,
  },
  actionButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: Palette.surface,
    marginLeft: 8,
  },
});
