import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, ActivityIndicator, Pressable, StyleSheet, ScrollView, Alert, Switch } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { apiClient } from '../../../lib/apiClient';
import { DatePickerInput } from '../../../components/DatePickerInput';

export default function GuardScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  // Guard duty state
  const [guardEnabled, setGuardEnabled] = useState(false);
  const [guardStartDate, setGuardStartDate] = useState('');
  const [guardEndDate, setGuardEndDate] = useState('');

  const loadProfile = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await apiClient.get('/professional/profile');
      const profile = data.pharmacieProfile || {};
      
      setGuardEnabled(profile.guard || false);
      setGuardStartDate(profile.guard_start_date || '');
      setGuardEndDate(profile.guard_end_date || '');
    } catch (e) {
      Alert.alert('Erreur', 'Impossible de charger les informations de garde');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  const handleToggleGuard = async (value: boolean) => {
    setGuardEnabled(value);
    setSaving(true);
    try {
      const payload: any = { guard: value };
      
      // If enabling guard, include dates or use defaults
      if (value) {
        if (guardStartDate) payload.guard_start_date = guardStartDate;
        if (guardEndDate) payload.guard_end_date = guardEndDate;
      }
      
      // Use the organization update endpoint
      const userId = (await apiClient.get('/user')).data.id;
      await apiClient.put(`/organizations/${userId}`, payload);
      
      // Reload to get backend-computed defaults
      await loadProfile();
      
      Alert.alert(
        'Succès',
        value 
          ? 'Service de garde activé' 
          : 'Service de garde désactivé'
      );
    } catch (e: any) {
      setGuardEnabled(!value);
      const msg = e?.response?.data?.message || 'Impossible de modifier le service de garde';
      Alert.alert('Erreur', msg);
    } finally {
      setSaving(false);
    }
  };

  const handleSaveDates = async () => {
    if (!guardStartDate || !guardEndDate) {
      Alert.alert('Erreur', 'Veuillez sélectionner les dates de début et de fin');
      return;
    }

    if (new Date(guardStartDate) > new Date(guardEndDate)) {
      Alert.alert('Erreur', 'La date de début doit être avant la date de fin');
      return;
    }

    setSaving(true);
    try {
      const userId = (await apiClient.get('/user')).data.id;
      await apiClient.put(`/organizations/${userId}`, {
        guard: guardEnabled,
        guard_start_date: guardStartDate,
        guard_end_date: guardEndDate,
      });
      
      Alert.alert('Succès', 'Dates de garde enregistrées');
      await loadProfile();
    } catch (e: any) {
      const msg = e?.response?.data?.message || 'Impossible d\'enregistrer les dates';
      Alert.alert('Erreur', msg);
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
          <Text style={styles.headerTitle}>Service de garde</Text>
          <Text style={styles.headerSubtitle}>Gérer votre disponibilité en garde</Text>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Guard Status Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionIconContainer}>
              <Ionicons name="medical" size={24} color="#EF4444" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.sectionTitle}>Statut de garde</Text>
              <Text style={styles.sectionDescription}>
                Activez votre service de garde pour être visible aux patients en urgence
              </Text>
            </View>
          </View>

          <View style={styles.card}>
            <View style={styles.switchRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.switchLabel}>Service de garde actif</Text>
                <Text style={styles.switchDescription}>
                  {guardEnabled 
                    ? 'Votre pharmacie est en garde' 
                    : 'Votre pharmacie n\'est pas en garde'}
                </Text>
              </View>
              <Switch
                value={guardEnabled}
                onValueChange={handleToggleGuard}
                disabled={saving}
                trackColor={{ false: '#E5E7EB', true: '#FCA5A5' }}
                thumbColor={guardEnabled ? '#EF4444' : '#F9FAFB'}
              />
            </View>

            {guardEnabled && (
              <>
                <View style={styles.divider} />
                
                <View style={styles.infoBox}>
                  <Ionicons name="information-circle" size={20} color="#EF4444" />
                  <Text style={styles.infoText}>
                    Votre pharmacie apparaîtra dans les résultats de recherche "Pharmacies de garde"
                  </Text>
                </View>
              </>
            )}
          </View>
        </View>

        {/* Guard Period Section */}
        {guardEnabled && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <View style={[styles.sectionIconContainer, { backgroundColor: '#FEF3C7' }]}>
                <Ionicons name="calendar" size={24} color="#F59E0B" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.sectionTitle}>Période de garde</Text>
                <Text style={styles.sectionDescription}>
                  Définissez la période pendant laquelle vous êtes de garde
                </Text>
              </View>
            </View>

            <View style={styles.card}>
              <DatePickerInput
                label="Date de début"
                value={guardStartDate}
                onChange={setGuardStartDate}
              />

              <DatePickerInput
                label="Date de fin"
                value={guardEndDate}
                onChange={setGuardEndDate}
              />

              <Pressable
                onPress={handleSaveDates}
                style={styles.saveButton}
                disabled={saving}
              >
                {saving ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <>
                    <Ionicons name="checkmark-circle" size={20} color="#fff" />
                    <Text style={styles.saveButtonText}>Enregistrer les dates</Text>
                  </>
                )}
              </Pressable>

              {guardStartDate && guardEndDate && (
                <View style={[styles.infoBox, { backgroundColor: '#EFF6FF' }]}>
                  <Ionicons name="information-circle" size={20} color="#2563EB" />
                  <Text style={[styles.infoText, { color: '#1E40AF' }]}>
                    Garde du {new Date(guardStartDate).toLocaleDateString('fr-FR')} au {new Date(guardEndDate).toLocaleDateString('fr-FR')}
                  </Text>
                </View>
              )}
            </View>
          </View>
        )}

        {/* Info Section */}
        <View style={styles.section}>
          <View style={styles.tipsCard}>
            <View style={styles.tipItem}>
              <Ionicons name="bulb" size={20} color="#F59E0B" />
              <Text style={styles.tipText}>
                <Text style={styles.tipBold}>Important :</Text> Le service de garde vous rend visible aux patients cherchant une pharmacie d'urgence
              </Text>
            </View>
            <View style={styles.tipItem}>
              <Ionicons name="bulb" size={20} color="#F59E0B" />
              <Text style={styles.tipText}>
                <Text style={styles.tipBold}>Conseil :</Text> Mettez à jour vos dates de garde régulièrement pour refléter votre planning
              </Text>
            </View>
            <View style={styles.tipItem}>
              <Ionicons name="bulb" size={20} color="#F59E0B" />
              <Text style={styles.tipText}>
                <Text style={styles.tipBold}>Note :</Text> Le service de garde se désactive automatiquement après la date de fin
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
    backgroundColor: '#FEE2E2',
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
  infoBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    backgroundColor: '#FEE2E2',
    padding: 16,
    borderRadius: 12,
  },
  infoText: {
    flex: 1,
    fontSize: 14,
    color: '#991B1B',
    lineHeight: 20,
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
  tipsCard: {
    backgroundColor: '#FFFBEB',
    borderRadius: 16,
    padding: 20,
    gap: 16,
    marginBottom: 32,
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
});
