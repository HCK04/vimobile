import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, ActivityIndicator, Alert, TextInput, Modal } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { apiClient } from '../../../lib/apiClient';
import { EnhancedTextInput } from '../../../components/EnhancedTextInput';

export default function TraitementsScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [items, setItems] = useState<string[]>([]);
  const [hasNone, setHasNone] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [newItem, setNewItem] = useState('');

  const SECTION = 'traitements_reguliers';
  const TITLE = 'Traitements réguliers';
  const ICON = 'medkit';
  const COLOR = '#8B5CF6';

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const { data } = await apiClient.get('/patient/sante');
      const sectionData = data.sante?.[SECTION] || {};
      setItems(sectionData.items || []);
      setHasNone(sectionData.none || false);
    } catch (error) {
      console.error('Failed to load data:', error);
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

  const handleAddItem = async () => {
    if (!newItem.trim()) {
      Alert.alert('Erreur', 'Veuillez saisir un traitement');
      return;
    }

    try {
      setSaving(true);
      const updatedItems = [...items, newItem.trim()];
      const { data } = await apiClient.post(`/patient/sante/section/${SECTION}`, {
        items: updatedItems,
      });
      setItems(data.data.items || []);
      setHasNone(data.data.none || false);
      setModalVisible(false);
      setNewItem('');
    } catch (error: any) {
      Alert.alert('Erreur', error?.response?.data?.message || 'Impossible d\'ajouter');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteItem = async (index: number) => {
    Alert.alert(
      'Supprimer',
      'Êtes-vous sûr de vouloir supprimer cet élément ?',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: async () => {
            try {
              const updatedItems = items.filter((_, i) => i !== index);
              const { data } = await apiClient.post(`/patient/sante/section/${SECTION}`, {
                items: updatedItems,
              });
              setItems(data.data.items || []);
            } catch (error) {
              Alert.alert('Erreur', 'Impossible de supprimer');
            }
          },
        },
      ]
    );
  };

  const handleToggleNone = async () => {
    try {
      const newValue = !hasNone;
      const { data } = await apiClient.post(`/patient/sante/section/${SECTION}`, {
        none: newValue,
      });
      setHasNone(data.data.none || false);
      setItems(data.data.items || []);
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
          <Text style={styles.headerTitle}>{TITLE}</Text>
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
        <Text style={styles.headerTitle}>{TITLE}</Text>
        <Pressable onPress={() => setModalVisible(true)} style={[styles.addButton, { backgroundColor: COLOR }]}>
          <Ionicons name="add" size={20} color="#FFFFFF" />
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* None Toggle */}
        <Pressable style={styles.noneCard} onPress={handleToggleNone}>
          <View style={{ flex: 1 }}>
            <Text style={styles.noneTitle}>Aucun traitement</Text>
            <Text style={styles.noneText}>Je ne prends aucun traitement régulier</Text>
          </View>
          <View style={[styles.checkbox, hasNone && styles.checkboxActive]}>
            {hasNone && <Ionicons name="checkmark" size={16} color="#FFFFFF" />}
          </View>
        </Pressable>

        {/* Items List */}
        {!hasNone && items.length === 0 && (
          <View style={styles.emptyState}>
            <View style={styles.emptyIcon}>
              <Ionicons name={ICON as any} size={48} color="#D1D5DB" />
            </View>
            <Text style={styles.emptyTitle}>Aucun traitement enregistré</Text>
            <Text style={styles.emptyText}>Ajoutez vos traitements réguliers pour un suivi optimal</Text>
          </View>
        )}

        {!hasNone && items.map((item, index) => (
          <View key={index} style={styles.itemCard}>
            <View style={[styles.itemIcon, { backgroundColor: `${COLOR}20` }]}>
              <Ionicons name={ICON as any} size={20} color={COLOR} />
            </View>
            <Text style={styles.itemText}>{item}</Text>
            <Pressable onPress={() => handleDeleteItem(index)} style={styles.deleteButton}>
              <Ionicons name="trash-outline" size={20} color="#EF4444" />
            </Pressable>
          </View>
        ))}

        <View style={{ height: 32 }} />
      </ScrollView>

      {/* Add Item Modal */}
      <Modal visible={modalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Ajouter un traitement</Text>
              <Pressable onPress={() => setModalVisible(false)}>
                <Ionicons name="close" size={24} color="#6B7280" />
              </Pressable>
            </View>

            <View style={styles.modalBody}>
              <EnhancedTextInput
                label="Traitement"
                value={newItem}
                onChangeText={setNewItem}
                placeholder="Ex: Metformine 500mg, 2x par jour"
                autoCapitalize="sentences"
                maxLength={200}
                showCharCount
                icon="medkit"
                helperText="Saisissez un traitement à la fois"
                autoFocus
              />

              <Pressable
                style={[styles.saveButton, { backgroundColor: COLOR }, saving && styles.saveButtonDisabled]}
                onPress={handleAddItem}
                disabled={saving}
              >
                {saving ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <Text style={styles.saveButtonText}>Ajouter</Text>
                )}
              </Pressable>
            </View>
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
    paddingHorizontal: 32,
  },
  itemCard: {
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
  itemIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  itemText: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
    color: '#111827',
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
    maxHeight: '70%',
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
  saveButton: {
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
