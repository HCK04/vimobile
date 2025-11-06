import React, { useEffect, useState } from 'react';
import { View, Text, ActivityIndicator, StyleSheet, Pressable, Alert, ScrollView, Modal } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { apiClient } from '../../../lib/apiClient';
import { api } from '../../../lib/api';

export default function AppointmentDetailsScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id?: string }>();
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState(false);
  const [item, setItem] = useState<any>(null);
  const [rescheduleOpen, setRescheduleOpen] = useState(false);
  const [newDate, setNewDate] = useState<string>('');
  const [newTime, setNewTime] = useState<string>('');
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [slots, setSlots] = useState<any[]>([]);

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

  const openReschedule = async () => {
    const d = String(item?.date || '');
    setNewDate(d);
    setNewTime('');
    setRescheduleOpen(true);
    if (item?.target_user_id && d) {
      await loadSlots(String(item.target_user_id), d);
    }
  };

  const generateDates = () => {
    const dates: { date: string; day: string; dayNum: number; month: string; isToday: boolean }[] = [];
    const today = new Date();
    const dayNames = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];
    for (let i = 0; i < 14; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      dates.push({
        date: date.toISOString().split('T')[0],
        day: dayNames[date.getDay()],
        dayNum: date.getDate(),
        month: date.toLocaleDateString('fr-FR', { month: 'short' }),
        isToday: i === 0,
      });
    }
    return dates;
  };

  const loadSlots = async (doctorId: string, date: string) => {
    try {
      setSlotsLoading(true);
      const res = await api.getAvailableHours(doctorId, date);
      setSlots(Array.isArray(res) ? res : []);
    } catch (e) {
      setSlots([]);
    } finally {
      setSlotsLoading(false);
    }
  };

  const confirmReschedule = async () => {
    if (!newDate || !newTime) return;
    try {
      await api.updateAppointment(String(id), { date: newDate, time: newTime });
      const { data } = await apiClient.get(`/appointments/${encodeURIComponent(String(id || ''))}`);
      setItem(data);
      setRescheduleOpen(false);
      Alert.alert('Succès', 'Rendez-vous reprogrammé');
    } catch (e: any) {
      const msg = e?.response?.data?.message || e?.message || 'Impossible de reprogrammer ce rendez-vous';
      Alert.alert('Erreur', msg);
    }
  };

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
      case 'scheduled': return { bg: '#DBEAFE', text: '#1E40AF', icon: 'calendar' };
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
  const statusNote = (() => {
    const s = String(item.status || '').toLowerCase();
    if (s === 'confirmed') return 'Confirmé automatiquement. Le professionnel peut ajuster le statut.';
    if (s === 'pending') return 'En attente de confirmation par le professionnel.';
    if (s === 'scheduled') return 'Rendez-vous planifié.';
    if (s === 'cancelled' || s === 'canceled') return 'Ce rendez-vous est annulé.';
    if (s === 'completed') return 'Rendez-vous terminé.';
    if (s === 'missed') return 'Rendez-vous manqué.';
    return '';
  })();
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

        {statusNote ? (
          <View style={styles.infoBanner}>
            <Ionicons name="information-circle" size={18} color="#2563EB" />
            <Text style={styles.infoBannerText}>{statusNote}</Text>
          </View>
        ) : null}

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

        <Pressable 
          onPress={openReschedule} 
          style={[styles.rescheduleButton, (!item?.target_user_id) && styles.rescheduleButtonDisabled]}
          disabled={!item?.target_user_id}
        >
          <Ionicons name="time" size={20} color="#FFFFFF" />
          <Text style={styles.rescheduleButtonText}>Reprogrammer</Text>
        </Pressable>

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

      <Modal visible={rescheduleOpen} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
              <Text style={{ fontSize: 18, fontWeight: '700', color: '#111827' }}>Reprogrammer</Text>
              <Pressable onPress={() => setRescheduleOpen(false)}><Ionicons name="close" size={24} color="#111827" /></Pressable>
            </View>

            <Text style={styles.sectionTitle}>Date</Text>
            <View style={styles.dateGrid}>
              {generateDates().map((d) => (
                <Pressable
                  key={d.date}
                  onPress={() => { setNewDate(d.date); if (item?.target_user_id) loadSlots(String(item.target_user_id), d.date); }}
                  style={[styles.dateCard, newDate === d.date && styles.dateCardActive]}
                >
                  <Text style={[styles.dateDay, newDate === d.date && styles.dateDayActive]}>{d.day}</Text>
                  <Text style={[styles.dateDayNum, newDate === d.date && styles.dateDayNumActive]}>{d.dayNum}</Text>
                  <Text style={[styles.dateMonth, newDate === d.date && styles.dateMonthActive]}>{d.month}</Text>
                </Pressable>
              ))}
            </View>

            <Text style={[styles.sectionTitle, { marginTop: 8 }]}>Heure</Text>
            {slotsLoading ? (
              <View style={{ alignItems: 'center', paddingVertical: 16 }}><ActivityIndicator color="#2563EB" /></View>
            ) : (
              <View style={styles.timeGrid}>
                {slots.map((s, i) => {
                  const time = typeof s === 'string' ? s : s.time;
                  const available = typeof s === 'string' ? true : !!s.available;
                  const selected = newTime === time;
                  return (
                    <Pressable
                      key={`slot-${time}-${i}`}
                      disabled={!available}
                      onPress={() => available && setNewTime(time)}
                      style={[styles.timeSlot, selected && styles.timeSlotSelected, !available && styles.timeSlotBooked]}
                    >
                      <Text style={[styles.timeSlotText, selected && styles.timeSlotTextSelected, !available && styles.timeSlotTextBooked]}>{time}</Text>
                    </Pressable>
                  );
                })}
              </View>
            )}

            <Pressable
              onPress={confirmReschedule}
              disabled={!newDate || !newTime}
              style={[styles.confirmButton, (!newDate || !newTime) && styles.confirmButtonDisabled]}
            >
              <Ionicons name="checkmark-circle" size={20} color="#FFFFFF" />
              <Text style={styles.confirmButtonText}>Confirmer</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
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
  rescheduleButton: {
    backgroundColor: '#2563EB',
    paddingVertical: 14,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 12,
  },
  rescheduleButtonDisabled: {
    opacity: 0.6,
  },
  rescheduleButtonText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 15,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.3)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
  },
  modalCard: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 8,
  },
  dateGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 8,
  },
  dateCard: {
    width: '23%',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingVertical: 8,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#E5E7EB',
  },
  dateCardActive: { backgroundColor: '#2563EB', borderColor: '#2563EB' },
  dateDay: { fontSize: 11, fontWeight: '600', color: '#6B7280', marginBottom: 2 },
  dateDayActive: { color: '#FFFFFF' },
  dateDayNum: { fontSize: 18, fontWeight: '700', color: '#111827', marginBottom: 1 },
  dateDayNumActive: { color: '#FFFFFF' },
  dateMonth: { fontSize: 10, color: '#9CA3AF' },
  dateMonthActive: { color: '#DBEAFE' },
  timeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  timeSlot: {
    width: '31%',
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#E5E7EB',
  },
  timeSlotSelected: { backgroundColor: '#2563EB', borderColor: '#2563EB' },
  timeSlotBooked: { opacity: 0.5 },
  timeSlotText: { fontSize: 14, fontWeight: '700', color: '#111827' },
  timeSlotTextSelected: { color: '#FFFFFF' },
  timeSlotTextBooked: { color: '#9CA3AF' },
  confirmButton: {
    backgroundColor: '#10B981',
    paddingVertical: 14,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  confirmButtonDisabled: { opacity: 0.5 },
  confirmButtonText: { color: '#FFFFFF', fontWeight: '700', fontSize: 15 },
  infoBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#EFF6FF',
    borderColor: '#DBEAFE',
    borderWidth: 1,
    padding: 12,
    borderRadius: 10,
    marginBottom: 12,
  },
  infoBannerText: {
    color: '#1F2937',
    fontSize: 13,
    flex: 1,
  },
});
