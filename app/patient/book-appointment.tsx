import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  ActivityIndicator,
  Alert,
  TextInput,
  Dimensions,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { api } from '../../lib/api';
import { apiClient } from '../../lib/apiClient';
import { Palette } from '../../constants/Colors';

const { width } = Dimensions.get('window');

type Step = 1 | 2 | 3 | 4;

type HourSlot = string | { time: string; available: boolean; booked: boolean; past: boolean };

export default function BookAppointmentScreen() {
  const router = useRouter();
  const { doctorId } = useLocalSearchParams<{ doctorId?: string }>();

  const [currentStep, setCurrentStep] = useState<Step>(1);
  const [loading, setLoading] = useState(false);
  const [booking, setBooking] = useState(false);

  // Step 1: Doctor selection
  const [selectedDoctor, setSelectedDoctor] = useState<any>(null);
  const [popularDoctors, setPopularDoctors] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searching, setSearching] = useState(false);
  const [showSearch, setShowSearch] = useState(false);

  // Step 2: Date selection
  const [selectedDate, setSelectedDate] = useState('');

  // Step 3: Time selection
  const [availableHours, setAvailableHours] = useState<HourSlot[]>([]);
  const [bookedSlots, setBookedSlots] = useState<string[]>([]);
  const [selectedTime, setSelectedTime] = useState('');
  const [loadingSlots, setLoadingSlots] = useState(false);

  // Step 4: Details
  const [reason, setReason] = useState('');

  const deriveTargetRole = (doctor: any) => {
    const r = (doctor?.role || '').toString().toLowerCase();
    if (r.includes('kin')) return 'kine';
    if (r.includes('orthophon')) return 'orthophoniste';
    if (r.includes('psych')) return 'psychologue';
    return 'medecin';
  };

  // Load doctor if provided via params
  useEffect(() => {
    if (doctorId) {
      loadDoctorInfo(doctorId);
    } else {
      loadPopularDoctors();
    }
  }, [doctorId]);

  const loadDoctorInfo = async (id: string) => {
    try {
      setLoading(true);
      const { data }: { data: any } = await apiClient.get(`/medecins/${id}`);
      setSelectedDoctor(data);
      setCurrentStep(2);
    } catch (e) {
      Alert.alert('Erreur', 'Impossible de charger les informations du professionnel');
    } finally {
      setLoading(false);
    }
  };

  const loadPopularDoctors = async () => {
    try {
      setLoading(true);
      const { data }: { data: any[] } = await apiClient.get('/medecins', { params: { limit: 6 } });
      setPopularDoctors(Array.isArray(data) ? data.slice(0, 6) : []);
    } catch (e) {
      setPopularDoctors([]);
    } finally {
      setLoading(false);
    }
  };

  const searchDoctors = async (query: string) => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }
    try {
      setSearching(true);
      const { data }: { data: any[] } = await apiClient.get('/medecins', { params: { search: query } });
      setSearchResults(Array.isArray(data) ? data : []);
    } catch (e) {
      setSearchResults([]);
    } finally {
      setSearching(false);
    }
  };

  const selectDoctor = (doctor: any) => {
    setSelectedDoctor(doctor);
    setCurrentStep(2);
    setShowSearch(false);
  };

  const generateDates = () => {
    const dates = [];
    const today = new Date();
    for (let i = 0; i < 14; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      const dayNames = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];
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

  const dates = generateDates();

  useEffect(() => {
    if (selectedDoctor && selectedDate && currentStep === 3) {
      loadTimeSlots();
    }
  }, [selectedDoctor, selectedDate, currentStep]);

  const loadTimeSlots = async () => {
    if (!selectedDoctor?.id || !selectedDate) return;
    try {
      setLoadingSlots(true);
      const availableRes: any = await api.getAvailableHours(selectedDoctor.id, selectedDate);
      const arr = Array.isArray(availableRes) ? availableRes : [];
      setAvailableHours(arr as HourSlot[]);
      // derive booked slots for fallback logic when entries are objects
      const derivedBooked = (arr as any[])
        .filter((s) => typeof s !== 'string' && (!s.available || s.booked))
        .map((s) => s.time);
      setBookedSlots(Array.isArray(derivedBooked) ? derivedBooked : []);
    } catch (e) {
      Alert.alert('Erreur', 'Impossible de charger les créneaux disponibles');
      setAvailableHours([]);
      setBookedSlots([]);
    } finally {
      setLoadingSlots(false);
    }
  };

  const isSlotAvailable = (slot: HourSlot) =>
    typeof slot === 'string' ? !bookedSlots.includes(slot) : !!slot.available;

  const handleNext = () => {
    if (currentStep === 1 && !selectedDoctor) {
      Alert.alert('Sélection requise', 'Veuillez sélectionner un professionnel');
      return;
    }
    if (currentStep === 2 && !selectedDate) {
      Alert.alert('Sélection requise', 'Veuillez sélectionner une date');
      return;
    }
    if (currentStep === 3 && !selectedTime) {
      Alert.alert('Sélection requise', 'Veuillez sélectionner une heure');
      return;
    }
    setCurrentStep((prev) => Math.min(prev + 1, 4) as Step);
  };

  const handleBack = () => {
    if (currentStep === 1) {
      router.back();
    } else {
      setCurrentStep((prev) => Math.max(prev - 1, 1) as Step);
    }
  };

  const handleBookAppointment = async () => {
    if (!reason.trim()) {
      Alert.alert('Motif requis', 'Veuillez indiquer le motif de consultation');
      return;
    }
    try {
      setBooking(true);
      const fresh: any = await api.getAvailableHours(selectedDoctor.id, selectedDate);
      const arr: any[] = Array.isArray(fresh) ? fresh : [];
      const found = arr.find((s) => (typeof s === 'string' ? s === selectedTime : s.time === selectedTime));
      const stillAvailable = found ? (typeof found === 'string' ? !bookedSlots.includes(selectedTime) : !!found.available) : false;
      if (!stillAvailable) {
        setAvailableHours(arr as HourSlot[]);
        const derivedBooked = (arr as any[]).filter((s) => typeof s !== 'string' && (!s.available || s.booked)).map((s) => s.time);
        setBookedSlots(derivedBooked);
        setCurrentStep(3 as Step);
        Alert.alert('Créneau indisponible', 'Ce créneau n\'est plus disponible. Les créneaux ont été actualisés.');
        setBooking(false);
        return;
      }
      await api.createAppointment({
        target_user_id: selectedDoctor.id,
        target_role: deriveTargetRole(selectedDoctor),
        date: selectedDate,
        time: selectedTime,
        reason: reason.trim(),
      });
      Alert.alert(
        'Rendez-vous confirmé ! 🎉',
        `Votre rendez-vous avec ${selectedDoctor.name} est confirmé pour le ${new Date(selectedDate).toLocaleDateString('fr-FR')} à ${selectedTime}.`,
        [{
          text: 'Voir mes rendez-vous',
          onPress: () => router.replace('/rendezvous' as any),
        }]
      );
    } catch (e: any) {
      const msg = e?.response?.data?.message || e?.message || 'Impossible de réserver le rendez-vous';
      Alert.alert('Erreur', msg);
    } finally {
      setBooking(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.center}>
          <ActivityIndicator size="large" color={Palette.primary} />
          <Text style={styles.loadingText}>Chargement...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Pressable onPress={handleBack} style={styles.backButton} hitSlop={12} accessibilityRole="button" accessibilityLabel="Retour">
          <Ionicons name="arrow-back" size={24} color={Palette.text} />
        </Pressable>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle}>Nouveau rendez-vous</Text>
          <Text style={styles.headerSubtitle}>Étape {currentStep}/4</Text>
        </View>
      </View>

      <View style={styles.progressContainer}>
        {[1, 2, 3, 4].map((step) => (
          <View key={step} style={[styles.progressBar, step <= currentStep && styles.progressBarActive]} />
        ))}
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
          {currentStep === 1 && (
            <View style={styles.stepContainer}>
              <View style={styles.stepHeader}>
                <View style={styles.stepIconContainer}>
                  <Ionicons name="person" size={24} color={Palette.primary} />
                </View>
                <View>
                  <Text style={styles.stepTitle}>Choisir un professionnel</Text>
                  <Text style={styles.stepDescription}>Sélectionnez parmi nos professionnels</Text>
                </View>
              </View>

              <Pressable onPress={() => setShowSearch(!showSearch)} style={styles.searchBar}>
                <Ionicons name="search" size={20} color={Palette.textSecondary} />
                <Text style={styles.searchPlaceholder}>Rechercher un médecin...</Text>
              </Pressable>

              {showSearch ? (
                <View style={styles.searchSection}>
                  <TextInput
                    value={searchQuery}
                    onChangeText={(text) => {
                      setSearchQuery(text);
                      searchDoctors(text);
                    }}
                    placeholder="Nom, spécialité, ville..."
                    placeholderTextColor={Palette.textPlaceholder}
                    style={styles.searchInput}
                    autoFocus
                  />
                  {searching && <ActivityIndicator style={{ marginTop: 16 }} color={Palette.primary} />}
                  {searchResults.map((doctor) => (
                    <Pressable key={doctor.id} onPress={() => selectDoctor(doctor)} style={styles.doctorCard} accessibilityRole="button" accessibilityLabel={`Sélectionner Dr ${doctor.name}`}>
                      <View style={styles.doctorAvatar}>
                        <Ionicons name="person" size={24} color={Palette.primary} />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.doctorName}>{doctor.name}</Text>
                        {doctor.specialty && <Text style={styles.doctorSpecialty}>{doctor.specialty}</Text>}
                        {doctor.ville && <Text style={styles.doctorLocation}><Ionicons name="location" size={12} /> {doctor.ville}</Text>}
                      </View>
                      <Ionicons name="chevron-forward" size={20} color="#D1D5DB" />
                    </Pressable>
                  ))}
                </View>
              ) : (
                <>
                  <Text style={styles.sectionLabel}>Professionnels populaires</Text>
                  {popularDoctors.map((doctor) => (
                    <Pressable key={doctor.id} onPress={() => selectDoctor(doctor)} style={styles.doctorCard}>
                      <View style={styles.doctorAvatar}>
                        <Ionicons name="person" size={24} color="#2563EB" />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.doctorName}>{doctor.name}</Text>
                        {doctor.specialty && <Text style={styles.doctorSpecialty}>{doctor.specialty}</Text>}
                        {doctor.ville && <Text style={styles.doctorLocation}><Ionicons name="location" size={12} /> {doctor.ville}</Text>}
                      </View>
                      <Ionicons name="chevron-forward" size={20} color="#D1D5DB" />
                    </Pressable>
                  ))}
                </>
              )}
            </View>
          )}

          {currentStep === 2 && (
            <View style={styles.stepContainer}>
              <View style={styles.stepHeader}>
                <View style={styles.stepIconContainer}>
                  <Ionicons name="calendar" size={24} color="#2563EB" />
                </View>
                <View>
                  <Text style={styles.stepTitle}>Choisir une date</Text>
                  <Text style={styles.stepDescription}>Rendez-vous avec {selectedDoctor?.name}</Text>
                </View>
              </View>

              <View style={styles.dateGrid}>
                {dates.map((d) => (
                  <Pressable key={d.date} onPress={() => setSelectedDate(d.date)} style={[styles.dateCard, selectedDate === d.date && styles.dateCardActive]}>
                    <Text style={[styles.dateDay, selectedDate === d.date && styles.dateDayActive]}>{d.day}</Text>
                    <Text style={[styles.dateDayNum, selectedDate === d.date && styles.dateDayNumActive]}>{d.dayNum}</Text>
                    <Text style={[styles.dateMonth, selectedDate === d.date && styles.dateMonthActive]}>{d.month}</Text>
                    {d.isToday && <View style={styles.todayDot} />}
                  </Pressable>
                ))}
              </View>

              <Pressable onPress={handleNext} disabled={!selectedDate} style={[styles.nextButton, !selectedDate && styles.nextButtonDisabled]}>
                <Text style={styles.nextButtonText}>Continuer</Text>
                <Ionicons name="arrow-forward" size={20} color="#FFFFFF" />
              </Pressable>
            </View>
          )}

          {currentStep === 3 && (
            <View style={styles.stepContainer}>
              <View style={styles.stepHeader}>
                <View style={styles.stepIconContainer}>
                  <Ionicons name="time" size={24} color="#2563EB" />
                </View>
                <View>
                  <Text style={styles.stepTitle}>Choisir l'heure</Text>
                  <Text style={styles.stepDescription}>{new Date(selectedDate).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}</Text>
                </View>
              </View>

              {loadingSlots ? (
                <View style={styles.center}>
                  <ActivityIndicator color="#2563EB" />
                  <Text style={styles.loadingText}>Chargement des créneaux...</Text>
                </View>
              ) : availableHours.length === 0 ? (
                <View style={styles.emptyState}>
                  <Ionicons name="time-outline" size={48} color="#D1D5DB" />
                  <Text style={styles.emptyStateText}>Aucun créneau disponible</Text>
                  <Pressable onPress={() => setCurrentStep(2)} style={styles.emptyStateButton}>
                    <Text style={styles.emptyStateButtonText}>Choisir une autre date</Text>
                  </Pressable>
                </View>
              ) : (
                <>
                  <View style={styles.timeGrid}>
                    {availableHours.map((slot, i) => {
                      const time = typeof slot === 'string' ? slot : slot.time;
                      const available = isSlotAvailable(slot);
                      const selected = selectedTime === time;
                      return (
                        <Pressable
                          key={`slot-${time}-${i}`}
                          onPress={() => available && setSelectedTime(time)}
                          disabled={!available}
                          style={[styles.timeSlot, !available && styles.timeSlotBooked, selected && styles.timeSlotSelected]}
                        >
                          <Text style={[styles.timeSlotText, !available && styles.timeSlotTextBooked, selected && styles.timeSlotTextSelected]}>
                            {time}
                          </Text>
                        </Pressable>
                      );
                    })}
                  </View>
                  <Pressable onPress={handleNext} disabled={!selectedTime} style={[styles.nextButton, !selectedTime && styles.nextButtonDisabled]}>
                    <Text style={styles.nextButtonText}>Continuer</Text>
                    <Ionicons name="arrow-forward" size={20} color="#FFFFFF" />
                  </Pressable>
                </>
              )}
            </View>
          )}

          {currentStep === 4 && (
            <View style={styles.stepContainer}>
              <View style={styles.stepHeader}>
                <View style={styles.stepIconContainer}>
                  <Ionicons name="checkmark-circle" size={24} color="#10B981" />
                </View>
                <View>
                  <Text style={styles.stepTitle}>Confirmation</Text>
                  <Text style={styles.stepDescription}>Vérifiez les détails de votre rendez-vous</Text>
                </View>
              </View>

              <View style={styles.summaryCard}>
                <View style={styles.summaryRow}>
                  <Ionicons name="person" size={20} color="#6B7280" />
                  <View style={{ flex: 1, marginLeft: 12 }}>
                    <Text style={styles.summaryLabel}>Professionnel</Text>
                    <Text style={styles.summaryValue}>{selectedDoctor?.name}</Text>
                    {selectedDoctor?.specialty && <Text style={styles.summarySubValue}>{selectedDoctor.specialty}</Text>}
                  </View>
                </View>
                <View style={styles.summaryDivider} />
                <View style={styles.summaryRow}>
                  <Ionicons name="calendar" size={20} color="#6B7280" />
                  <View style={{ flex: 1, marginLeft: 12 }}>
                    <Text style={styles.summaryLabel}>Date et heure</Text>
                    <Text style={styles.summaryValue}>{new Date(selectedDate).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</Text>
                    <Text style={styles.summarySubValue}>à {selectedTime}</Text>
                  </View>
                </View>
              </View>

              <Text style={styles.inputLabel}>Motif de consultation *</Text>
              <TextInput value={reason} onChangeText={setReason} placeholder="Ex: Consultation générale, contrôle, suivi..." placeholderTextColor="#9CA3AF" style={styles.reasonInput} multiline numberOfLines={4} maxLength={500} />
              <Text style={styles.charCount}>{reason.length}/500</Text>

              <Pressable onPress={handleBookAppointment} disabled={booking || !reason.trim()} style={[styles.confirmButton, (booking || !reason.trim()) && styles.confirmButtonDisabled]}>
                {booking ? <ActivityIndicator color="#FFFFFF" /> : (
                  <>
                    <Ionicons name="checkmark-circle" size={20} color="#FFFFFF" />
                    <Text style={styles.confirmButtonText}>Confirmer le rendez-vous</Text>
                  </>
                )}
              </Pressable>
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 },
  loadingText: { marginTop: 12, fontSize: 14, color: '#6B7280' },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, backgroundColor: '#FFFFFF', borderBottomWidth: 1, borderBottomColor: '#E5E7EB' },
  backButton: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center', marginRight: 8 },
  headerTitle: { fontSize: 18, fontWeight: '700', color: '#111827' },
  headerSubtitle: { fontSize: 13, color: '#6B7280', marginTop: 2 },
  progressContainer: { flexDirection: 'row', gap: 4, paddingHorizontal: 16, paddingVertical: 12, backgroundColor: '#FFFFFF' },
  progressBar: { flex: 1, height: 4, backgroundColor: '#E5E7EB', borderRadius: 2 },
  progressBarActive: { backgroundColor: '#2563EB' },
  scrollContent: { padding: 16 },
  stepContainer: { minHeight: 400 },
  stepHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 24 },
  stepIconContainer: { width: 48, height: 48, borderRadius: 24, backgroundColor: '#EFF6FF', alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  stepTitle: { fontSize: 20, fontWeight: '700', color: '#111827' },
  stepDescription: { fontSize: 14, color: '#6B7280', marginTop: 2 },
  searchBar: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: '#FFFFFF', borderRadius: 12, padding: 16, borderWidth: 1, borderColor: '#E5E7EB', marginBottom: 16 },
  searchPlaceholder: { fontSize: 15, color: '#9CA3AF' },
  searchSection: { marginBottom: 16 },
  searchInput: { backgroundColor: '#FFFFFF', borderRadius: 12, padding: 16, borderWidth: 1, borderColor: '#E5E7EB', fontSize: 15, color: '#111827', marginBottom: 16 },
  sectionLabel: { fontSize: 14, fontWeight: '600', color: '#6B7280', marginBottom: 12 },
  doctorCard: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: '#FFFFFF', borderRadius: 12, padding: 16, borderWidth: 1, borderColor: '#E5E7EB', marginBottom: 8 },
  doctorAvatar: { width: 48, height: 48, borderRadius: 24, backgroundColor: '#EFF6FF', alignItems: 'center', justifyContent: 'center' },
  doctorName: { fontSize: 16, fontWeight: '600', color: '#111827', marginBottom: 2 },
  doctorSpecialty: { fontSize: 13, color: '#6B7280', marginBottom: 2 },
  doctorLocation: { fontSize: 12, color: '#9CA3AF' },
  dateGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 24 },
  dateCard: { width: (width - 48) / 4, backgroundColor: '#FFFFFF', borderRadius: 12, padding: 12, alignItems: 'center', borderWidth: 2, borderColor: '#E5E7EB' },
  dateCardActive: { backgroundColor: '#2563EB', borderColor: '#2563EB' },
  dateDay: { fontSize: 12, fontWeight: '600', color: '#6B7280', marginBottom: 4 },
  dateDayActive: { color: '#FFFFFF' },
  dateDayNum: { fontSize: 20, fontWeight: '700', color: '#111827', marginBottom: 2 },
  dateDayNumActive: { color: '#FFFFFF' },
  dateMonth: { fontSize: 11, color: '#9CA3AF' },
  dateMonthActive: { color: '#DBEAFE' },
  todayDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#10B981', marginTop: 4 },
  timeGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 24 },
  timeSlot: { width: (width - 48) / 3, backgroundColor: '#FFFFFF', borderRadius: 10, padding: 14, alignItems: 'center', borderWidth: 2, borderColor: '#E5E7EB' },
  timeSlotBooked: { backgroundColor: '#F9FAFB', borderColor: '#E5E7EB', opacity: 0.5 },
  timeSlotSelected: { backgroundColor: '#2563EB', borderColor: '#2563EB' },
  timeSlotText: { fontSize: 15, fontWeight: '600', color: '#111827' },
  timeSlotTextBooked: { color: '#9CA3AF' },
  timeSlotTextSelected: { color: '#FFFFFF' },
  nextButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: '#2563EB', borderRadius: 12, padding: 16 },
  nextButtonDisabled: { opacity: 0.5 },
  nextButtonText: { fontSize: 16, fontWeight: '700', color: '#FFFFFF' },
  emptyState: { alignItems: 'center', paddingVertical: 48 },
  emptyStateText: { fontSize: 16, color: '#6B7280', marginTop: 12, marginBottom: 16 },
  emptyStateButton: { backgroundColor: '#EFF6FF', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 10 },
  emptyStateButtonText: { fontSize: 14, fontWeight: '600', color: '#2563EB' },
  summaryCard: { backgroundColor: '#FFFFFF', borderRadius: 12, padding: 16, borderWidth: 1, borderColor: '#E5E7EB', marginBottom: 24 },
  summaryRow: { flexDirection: 'row', alignItems: 'flex-start' },
  summaryDivider: { height: 1, backgroundColor: '#E5E7EB', marginVertical: 16 },
  summaryLabel: { fontSize: 12, fontWeight: '600', color: '#6B7280', marginBottom: 4 },
  summaryValue: { fontSize: 15, fontWeight: '600', color: '#111827' },
  summarySubValue: { fontSize: 13, color: '#6B7280', marginTop: 2 },
  inputLabel: { fontSize: 14, fontWeight: '600', color: '#374151', marginBottom: 8 },
  reasonInput: { backgroundColor: '#FFFFFF', borderRadius: 12, padding: 16, borderWidth: 1, borderColor: '#E5E7EB', fontSize: 15, color: '#111827', minHeight: 100, textAlignVertical: 'top' },
  charCount: { fontSize: 12, color: '#9CA3AF', textAlign: 'right', marginTop: 4, marginBottom: 16 },
  confirmButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: '#10B981', borderRadius: 12, padding: 16 },
  confirmButtonDisabled: { opacity: 0.5 },
  confirmButtonText: { fontSize: 16, fontWeight: '700', color: '#FFFFFF' },
});
