import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, ActivityIndicator, Pressable, StyleSheet, ScrollView, Alert, Switch } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { apiClient } from '../../../lib/apiClient';
import { DatePickerInput } from '../../../components/DatePickerInput';

export default function AbsenceScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  // Absence dates
  const [absenceStartDate, setAbsenceStartDate] = useState('');
  const [absenceEndDate, setAbsenceEndDate] = useState('');
  
  // Vacation mode
  const [vacationMode, setVacationMode] = useState(false);
  const [vacationAutoReactivateDate, setVacationAutoReactivateDate] = useState('');

  const loadProfile = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await apiClient.get('/professional/profile');
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
      
      setAbsenceStartDate(profile.absence_start_date || '');
      setAbsenceEndDate(profile.absence_end_date || '');
      // Backend uses disponible inversely: vacation_mode = !disponible
      const vacMode = typeof profile.disponible === 'boolean' ? !profile.disponible : false;
      setVacationMode(vacMode);
      // Auto-reactivate date is stored in absence_end_date when vacation mode is on
      setVacationAutoReactivateDate(vacMode && profile.absence_end_date ? profile.absence_end_date : '');
    } catch (e) {
      Alert.alert('Erreur', 'Impossible de charger les informations');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  const handleSetAbsence = async () => {
    if (!absenceStartDate || !absenceEndDate) {
      Alert.alert('Erreur', 'Veuillez sélectionner les dates de début et de fin');
      return;
    }

    if (new Date(absenceStartDate) > new Date(absenceEndDate)) {
      Alert.alert('Erreur', 'La date de début doit être avant la date de fin');
      return;
    }

    setSaving(true);
    try {
      await apiClient.post('/professional/profile/set-absence', {
        absence_start_date: absenceStartDate,
        absence_end_date: absenceEndDate,
      });
      Alert.alert('Succès', 'Période d\'absence enregistrée');
      await loadProfile();
    } catch (e) {
      Alert.alert('Erreur', 'Impossible d\'enregistrer la période d\'absence');
    } finally {
      setSaving(false);
    }
  };

  const handleClearAbsence = async () => {
    Alert.alert(
      'Confirmation',
      'Voulez-vous vraiment supprimer la période d\'absence ?',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: async () => {
            setSaving(true);
            try {
              await apiClient.post('/professional/profile/set-absence', {
                absence_start_date: null,
                absence_end_date: null,
              });
              setAbsenceStartDate('');
              setAbsenceEndDate('');
              Alert.alert('Succès', 'Période d\'absence supprimée');
            } catch (e) {
              Alert.alert('Erreur', 'Impossible de supprimer la période d\'absence');
            } finally {
              setSaving(false);
            }
          },
        },
      ]
    );
  };

  const handleToggleVacationMode = async (value: boolean) => {
    setVacationMode(value);
    try {
      const payload: any = { vacation_mode: value };
      if (value && vacationAutoReactivateDate) {
        payload.vacation_auto_reactivate_date = vacationAutoReactivateDate;
      }
      await apiClient.post('/professional/profile/toggle-vacation-mode', payload);
      // Reload to sync state
      await loadProfile();
    } catch (e) {
      setVacationMode(!value);
      Alert.alert('Erreur', 'Impossible de modifier le mode vacances');
    }
  };

  const handleSetAutoReactivate = async () => {
    if (!vacationAutoReactivateDate) {
      Alert.alert('Erreur', 'Veuillez sélectionner une date de réactivation');
      return;
    }

    setSaving(true);
    try {
      await apiClient.post('/professional/profile/toggle-vacation-mode', {
        vacation_mode: vacationMode,
        vacation_auto_reactivate_date: vacationAutoReactivateDate,
      });
      Alert.alert('Succès', 'Date de réactivation automatique enregistrée');
      await loadProfile();
    } catch (e) {
      Alert.alert('Erreur', 'Impossible d\'enregistrer la date de réactivation');
    } finally {
      setSaving(false);
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

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#111827" />
        </Pressable>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle}>Absence & Vacances</Text>
          <Text style={styles.headerSubtitle}>Gérer vos périodes d'indisponibilité</Text>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Absence Period Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionIconContainer}>
              <Ionicons name="calendar-clear" size={24} color="#F59E0B" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.sectionTitle}>Période d'absence</Text>
              <Text style={styles.sectionDescription}>
                Définissez une période pendant laquelle vous ne serez pas disponible
              </Text>
            </View>
          </View>

          <View style={styles.card}>
            <DatePickerInput
              label="Date de début"
              value={absenceStartDate}
              onChange={setAbsenceStartDate}
            />

            <DatePickerInput
              label="Date de fin"
              value={absenceEndDate}
              onChange={setAbsenceEndDate}
            />

            <View style={styles.buttonRow}>
              {(absenceStartDate || absenceEndDate) && (
                <Pressable
                  onPress={handleClearAbsence}
                  style={styles.clearButton}
                  disabled={saving}
                >
                  <Ionicons name="trash-outline" size={20} color="#EF4444" />
                  <Text style={styles.clearButtonText}>Supprimer</Text>
                </Pressable>
              )}
              <Pressable
                onPress={handleSetAbsence}
                style={[styles.saveButton, { flex: (absenceStartDate || absenceEndDate) ? 2 : 1 }]}
                disabled={saving}
              >
                {saving ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <>
                    <Ionicons name="checkmark-circle" size={20} color="#fff" />
                    <Text style={styles.saveButtonText}>Enregistrer</Text>
                  </>
                )}
              </Pressable>
            </View>

            {absenceStartDate && absenceEndDate && (
              <View style={styles.infoBox}>
                <Ionicons name="information-circle" size={20} color="#2563EB" />
                <Text style={styles.infoText}>
                  Vous serez absent du {new Date(absenceStartDate).toLocaleDateString('fr-FR')} au {new Date(absenceEndDate).toLocaleDateString('fr-FR')}
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* Vacation Mode Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={[styles.sectionIconContainer, { backgroundColor: '#F3E8FF' }]}>
              <Ionicons name="airplane" size={24} color="#8B5CF6" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.sectionTitle}>Mode vacances</Text>
              <Text style={styles.sectionDescription}>
                Désactivez temporairement tous vos services
              </Text>
            </View>
          </View>

          <View style={styles.card}>
            <View style={styles.switchRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.switchLabel}>Activer le mode vacances</Text>
                <Text style={styles.switchDescription}>
                  Tous vos services seront désactivés
                </Text>
              </View>
              <Switch
                value={vacationMode}
                onValueChange={handleToggleVacationMode}
                trackColor={{ false: '#E5E7EB', true: '#BFDBFE' }}
                thumbColor={vacationMode ? '#2563EB' : '#F9FAFB'}
              />
            </View>

            {vacationMode && (
              <>
                <View style={styles.divider} />
                
                <View>
                  <DatePickerInput
                    label="Réactivation automatique (optionnel)"
                    value={vacationAutoReactivateDate}
                    onChange={setVacationAutoReactivateDate}
                  />
                  <Text style={styles.helperText}>
                    Vos services seront automatiquement réactivés à cette date
                  </Text>
                </View>

                {vacationAutoReactivateDate && (
                  <Pressable
                    onPress={handleSetAutoReactivate}
                    style={styles.saveButton}
                    disabled={saving}
                  >
                    {saving ? (
                      <ActivityIndicator color="#fff" />
                    ) : (
                      <>
                        <Ionicons name="checkmark-circle" size={20} color="#fff" />
                        <Text style={styles.saveButtonText}>Enregistrer la date</Text>
                      </>
                    )}
                  </Pressable>
                )}

                <View style={[styles.infoBox, { backgroundColor: '#FEF3C7' }]}>
                  <Ionicons name="warning" size={20} color="#F59E0B" />
                  <Text style={[styles.infoText, { color: '#92400E' }]}>
                    Le mode vacances désactive tous vos services. Les patients ne pourront pas prendre de rendez-vous.
                  </Text>
                </View>
              </>
            )}
          </View>
        </View>

        {/* Tips Section */}
        <View style={styles.section}>
          <View style={styles.tipsCard}>
            <View style={styles.tipItem}>
              <Ionicons name="bulb" size={20} color="#F59E0B" />
              <Text style={styles.tipText}>
                <Text style={styles.tipBold}>Conseil :</Text> Utilisez la période d'absence pour des absences courtes (quelques jours)
              </Text>
            </View>
            <View style={styles.tipItem}>
              <Ionicons name="bulb" size={20} color="#F59E0B" />
              <Text style={styles.tipText}>
                <Text style={styles.tipBold}>Conseil :</Text> Utilisez le mode vacances pour des absences prolongées (plusieurs semaines)
              </Text>
            </View>
            <View style={styles.tipItem}>
              <Ionicons name="bulb" size={20} color="#F59E0B" />
              <Text style={styles.tipText}>
                <Text style={styles.tipBold}>Conseil :</Text> La réactivation automatique vous évite d'oublier de réactiver vos services
              </Text>
            </View>
          </View>
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
  section: {
    paddingHorizontal: 20,
    paddingTop: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    marginBottom: 16,
  },
  sectionIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#FEF3C7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 4,
  },
  sectionDescription: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
    gap: 16,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
  },
  clearButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#FEE2E2',
    paddingVertical: 16,
    borderRadius: 12,
  },
  clearButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#EF4444',
  },
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#2563EB',
    paddingVertical: 16,
    borderRadius: 12,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    backgroundColor: '#EFF6FF',
    padding: 16,
    borderRadius: 12,
  },
  infoText: {
    flex: 1,
    fontSize: 14,
    color: '#1E40AF',
    lineHeight: 20,
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  switchLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  switchDescription: {
    fontSize: 14,
    color: '#6B7280',
  },
  divider: {
    height: 1,
    backgroundColor: '#E5E7EB',
  },
  tipsCard: {
    backgroundColor: '#FFFBEB',
    borderRadius: 16,
    padding: 20,
    gap: 16,
  },
  tipItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  tipText: {
    flex: 1,
    fontSize: 14,
    color: '#92400E',
    lineHeight: 20,
  },
  tipBold: {
    fontWeight: '700',
  },
  helperText: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 8,
  },
});
