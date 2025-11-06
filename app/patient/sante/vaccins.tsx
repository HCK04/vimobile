import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, ActivityIndicator, Alert, TextInput, Modal } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { apiClient } from '../../../lib/apiClient';
import { EnhancedTextInput } from '../../../components/EnhancedTextInput';
import { DatePickerInput } from '../../../components/DatePickerInput';

export default function VaccinsScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [vaccins, setVaccins] = useState<any[]>([]);
  const [hasNone, setHasNone] = useState(false);
  const [catalog, setCatalog] = useState<string[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedVaccine, setSelectedVaccine] = useState('');
  const [customVaccine, setCustomVaccine] = useState('');
  const [vaccineDate, setVaccineDate] = useState('');

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const [santeRes, catalogRes] = await Promise.all([
        apiClient.get('/patient/sante'),
        apiClient.get('/patient/sante/vaccins/catalog'),
      ]);
      const vaccinsData = santeRes.data.sante?.vaccins || {};
      setVaccins(vaccinsData.items || []);
      setHasNone(vaccinsData.none || false);
      setCatalog(catalogRes.data.catalog || []);
    } catch (error) {
      console.error('Failed to load vaccines:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData])
  );

  const handleAddVaccine = async () => {
    const name = selectedVaccine === 'Autre' ? customVaccine : selectedVaccine;
    if (!name || !vaccineDate) {
      Alert.alert('Erreur', 'Veuillez remplir tous les champs');
      return;
    }

    try {
      setSaving(true);
      const { data } = await apiClient.post('/patient/sante/vaccins/add', {
        name,
        date: vaccineDate,
      });
      setVaccins(data.vaccins || []);
      setModalVisible(false);
      setSelectedVaccine('');
      setCustomVaccine('');
      setVaccineDate('');
      Alert.alert('Succès', 'Vaccin ajouté avec succès');
    } catch (error: any) {
      Alert.alert('Erreur', error?.response?.data?.message || 'Impossible d\'ajouter le vaccin');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteVaccine = async (id: string) => {
    Alert.alert(
      'Supprimer',
      'Êtes-vous sûr de vouloir supprimer ce vaccin ?',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: async () => {
            try {
              const { data } = await apiClient.delete(`/patient/sante/vaccins/${id}`);
              setVaccins(data.vaccins || []);
            } catch (error) {
              Alert.alert('Erreur', 'Impossible de supprimer le vaccin');
            }
          },
        },
      ]
    );
  };

  const handleToggleNone = async () => {
    try {
      const newValue = !hasNone;
      await apiClient.post('/patient/sante/vaccins/none', { none: newValue });
      setHasNone(newValue);
      if (newValue) {
        setVaccins([]);
      }
    } catch (error) {
      Alert.alert('Erreur', 'Impossible de mettre à jour');
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#111827" />
          </Pressable>
          <Text style={styles.headerTitle}>Vaccins</Text>
          <View style={{ width: 40 }} />
        </View>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator size="large" color="#2563EB" />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#111827" />
        </Pressable>
        <Text style={styles.headerTitle}>Vaccins</Text>
        <Pressable onPress={() => setModalVisible(true)} style={styles.addButton}>
          <Ionicons name="add" size={20} color="#FFFFFF" />
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* None Toggle */}
        <Pressable style={styles.noneCard} onPress={handleToggleNone}>
          <View style={{ flex: 1 }}>
            <Text style={styles.noneTitle}>Aucun vaccin</Text>
            <Text style={styles.noneText}>Je n'ai reçu aucun vaccin</Text>
          </View>
          <View style={[styles.checkbox, hasNone && styles.checkboxActive]}>
            {hasNone && <Ionicons name="checkmark" size={16} color="#FFFFFF" />}
          </View>
        </Pressable>

        {/* Vaccines List */}
        {!hasNone && vaccins.length === 0 && (
          <View style={styles.emptyState}>
            <View style={styles.emptyIcon}>
              <Ionicons name="medical" size={48} color="#D1D5DB" />
            </View>
            <Text style={styles.emptyTitle}>Aucun vaccin enregistré</Text>
            <Text style={styles.emptyText}>Ajoutez vos vaccins pour garder un historique complet</Text>
          </View>
        )}

        {!hasNone && vaccins.map((vaccine) => (
          <View key={vaccine.id} style={styles.vaccineCard}>
            <View style={styles.vaccineIcon}>
              <Ionicons name="medical" size={20} color="#10B981" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.vaccineName}>{vaccine.name}</Text>
              <Text style={styles.vaccineDate}>
                {new Date(vaccine.date).toLocaleDateString('fr-FR', {
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric',
                })}
              </Text>
            </View>
            <Pressable onPress={() => handleDeleteVaccine(vaccine.id)} style={styles.deleteButton}>
              <Ionicons name="trash-outline" size={20} color="#EF4444" />
            </Pressable>
          </View>
        ))}

        <View style={{ height: 32 }} />
      </ScrollView>

      {/* Add Vaccine Modal */}
      <Modal visible={modalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Ajouter un vaccin</Text>
              <Pressable onPress={() => setModalVisible(false)}>
                <Ionicons name="close" size={24} color="#6B7280" />
              </Pressable>
            </View>

            <ScrollView style={styles.modalBody}>
              <Text style={styles.label}>Vaccin</Text>
              <View style={styles.catalogGrid}>
                {catalog.map((vac) => (
                  <Pressable
                    key={vac}
                    style={[styles.catalogChip, selectedVaccine === vac && styles.catalogChipActive]}
                    onPress={() => setSelectedVaccine(vac)}
                  >
                    <Text style={[styles.catalogChipText, selectedVaccine === vac && styles.catalogChipTextActive]}>
                      {vac}
                    </Text>
                  </Pressable>
                ))}
                <Pressable
                  style={[styles.catalogChip, selectedVaccine === 'Autre' && styles.catalogChipActive]}
                  onPress={() => setSelectedVaccine('Autre')}
                >
                  <Text style={[styles.catalogChipText, selectedVaccine === 'Autre' && styles.catalogChipTextActive]}>
                    Autre
                  </Text>
                </Pressable>
              </View>

              {selectedVaccine === 'Autre' && (
                <EnhancedTextInput
                  label="Nom du vaccin"
                  value={customVaccine}
                  onChangeText={setCustomVaccine}
                  placeholder="Ex: Vaccin contre la grippe"
                  autoCapitalize="words"
                  maxLength={100}
                  showCharCount
                  icon="medical"
                />
              )}

              <DatePickerInput
                label="Date de vaccination"
                value={vaccineDate}
                onChange={setVaccineDate}
                maxDate={new Date()}
              />

              <Pressable
                style={[styles.saveButton, saving && styles.saveButtonDisabled]}
                onPress={handleAddVaccine}
                disabled={saving}
              >
                {saving ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <Text style={styles.saveButtonText}>Ajouter</Text>
                )}
              </Pressable>
            </ScrollView>
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
  addButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#10B981',
    borderRadius: 10,
  },
  scrollContent: {
    padding: 16,
  },
  noneCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    marginBottom: 16,
  },
  noneTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 4,
  },
  noneText: {
    fontSize: 13,
    color: '#6B7280',
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#D1D5DB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxActive: {
    backgroundColor: '#10B981',
    borderColor: '#10B981',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 48,
  },
  emptyIcon: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
  },
  vaccineCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    marginBottom: 12,
  },
  vaccineIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#D1FAE5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  vaccineName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 4,
  },
  vaccineDate: {
    fontSize: 13,
    color: '#6B7280',
  },
  deleteButton: {
    padding: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
  },
  modalBody: {
    padding: 20,
  },
  label: {
    fontSize: 15,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 12,
  },
  catalogGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  catalogChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    backgroundColor: '#FFFFFF',
  },
  catalogChipActive: {
    backgroundColor: '#10B981',
    borderColor: '#10B981',
  },
  catalogChipText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#374151',
  },
  catalogChipTextActive: {
    color: '#FFFFFF',
  },
  saveButton: {
    backgroundColor: '#10B981',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 24,
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
});
