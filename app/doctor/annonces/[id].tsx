import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, ActivityIndicator, Pressable, StyleSheet, ScrollView, TextInput, Alert, Switch } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { api } from '../../../lib/api';

export default function EditAnnonceScreen() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Fields
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [address, setAddress] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [pourcentage, setPourcentage] = useState('');

  const load = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    try {
      const data = await api.getAnnonce(id);
      setTitle(data.title || '');
      setDescription(data.description || '');
      setPrice(String(data.price ?? ''));
      setAddress(data.address || '');
      setPhone(data.phone || '');
      setEmail(data.email || '');
      setIsActive(!!data.is_active);
      setPourcentage(String(data.pourcentage_reduction ?? ''));
    } catch (e: any) {
      const msg = e?.response?.data?.message || e?.message || 'Impossible de charger l\'annonce';
      Alert.alert('Erreur', msg);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { load(); }, [load]);

  const validate = useCallback(() => {
    if (!title.trim()) return 'Le titre est requis';
    if (!description.trim()) return 'La description est requise';
    if (!price.trim() || isNaN(Number(price))) return 'Le prix est requis et doit être un nombre';
    if (!address.trim()) return 'L\'adresse est requise';
    if (!phone.trim()) return 'Le téléphone est requis';
    if (!email.trim()) return 'L\'email est requis';
    return null;
  }, [title, description, price, address, phone, email]);

  const handleSave = async () => {
    const err = validate();
    if (err) { Alert.alert('Erreur', err); return; }
    if (!id) return;

    setSaving(true);
    try {
      await api.updateAnnonce(id, {
        title: title.trim(),
        description: description.trim(),
        price: Number(price),
        address: address.trim(),
        phone: phone.trim(),
        email: email.trim(),
        is_active: isActive,
        pourcentage_reduction: pourcentage ? Number(pourcentage) : 0,
      });
      Alert.alert('Succès', 'Annonce mise à jour', [
        { text: 'OK', onPress: () => router.back() }
      ]);
    } catch (e: any) {
      const msg = e?.response?.data?.message || e?.message || 'Impossible de mettre à jour l\'annonce';
      Alert.alert('Erreur', msg);
    } finally {
      setSaving(false);
    }
  };

  const handleToggleActive = async () => {
    if (!id) return;
    try {
      setSaving(true);
      await api.toggleAnnonceStatus(id, !isActive);
      setIsActive(!isActive);
      Alert.alert('Succès', !isActive ? 'Annonce activée' : 'Annonce désactivée');
    } catch (e: any) {
      const msg = e?.response?.data?.message || e?.message || 'Impossible de changer le statut';
      Alert.alert('Erreur', msg);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!id) return;
    Alert.alert('Confirmation', 'Supprimer cette annonce ?', [
      { text: 'Annuler', style: 'cancel' },
      { text: 'Supprimer', style: 'destructive', onPress: async () => {
        try {
          setSaving(true);
          await api.deleteAnnonce(id);
          Alert.alert('Succès', 'Annonce supprimée', [
            { text: 'OK', onPress: () => router.replace('/doctor/annonces' as any) }
          ]);
        } catch (e: any) {
          const msg = e?.response?.data?.message || e?.message || 'Suppression impossible';
          Alert.alert('Erreur', msg);
        } finally {
          setSaving(false);
        }
      } }
    ]);
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
        <Text style={styles.headerTitle}>Modifier l'annonce</Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 32 }}>
        <View style={styles.section}>
          <View style={styles.card}>
            <View style={styles.statusRow}>
              <View style={[styles.badge, { backgroundColor: isActive ? '#DCFCE7' : '#FEE2E2' }]}>
                <Text style={[styles.badgeText, { color: isActive ? '#10B981' : '#EF4444' }]}>
                  {isActive ? 'Active' : 'Inactive'}
                </Text>
              </View>
              <Pressable disabled={saving} onPress={handleToggleActive} style={[styles.smallBtn, { backgroundColor: isActive ? '#FEE2E2' : '#DCFCE7' }]}>
                <Ionicons name={isActive ? 'close-circle' : 'checkmark-circle'} size={18} color={isActive ? '#EF4444' : '#10B981'} />
                <Text style={[styles.smallBtnText, { color: isActive ? '#EF4444' : '#10B981' }]}>
                  {isActive ? 'Désactiver' : 'Activer'}
                </Text>
              </Pressable>
            </View>

            <Text style={styles.label}>Titre *</Text>
            <TextInput value={title} onChangeText={setTitle} placeholder="Titre" placeholderTextColor="#9CA3AF" style={styles.input} />

            <Text style={styles.label}>Description *</Text>
            <TextInput value={description} onChangeText={setDescription} placeholder="Description" placeholderTextColor="#9CA3AF" multiline numberOfLines={4} style={[styles.input, styles.textArea]} />

            <Text style={styles.label}>Prix (DH) *</Text>
            <TextInput value={price} onChangeText={setPrice} keyboardType="numeric" placeholder="0" placeholderTextColor="#9CA3AF" style={styles.input} />

            <Text style={styles.label}>Adresse *</Text>
            <TextInput value={address} onChangeText={setAddress} placeholder="Adresse" placeholderTextColor="#9CA3AF" style={styles.input} />

            <Text style={styles.label}>Téléphone *</Text>
            <TextInput value={phone} onChangeText={setPhone} keyboardType="phone-pad" placeholder="+212 6XX XX XX XX" placeholderTextColor="#9CA3AF" style={styles.input} />

            <Text style={styles.label}>Email *</Text>
            <TextInput value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" placeholder="email@example.com" placeholderTextColor="#9CA3AF" style={styles.input} />

            <Text style={styles.label}>Réduction (%)</Text>
            <TextInput value={pourcentage} onChangeText={setPourcentage} keyboardType="numeric" placeholder="0" placeholderTextColor="#9CA3AF" style={styles.input} />
          </View>
        </View>

        {/* Footer Buttons */}
        <View style={styles.section}>
          <Pressable onPress={handleSave} disabled={saving} style={[styles.saveButton, saving && styles.saveButtonDisabled]}>
            {saving ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <Ionicons name="save" size={20} color="#fff" />
                <Text style={styles.saveButtonText}>Enregistrer</Text>
              </>
            )}
          </Pressable>

          <Pressable onPress={handleDelete} disabled={saving} style={[styles.deleteButton, saving && styles.saveButtonDisabled]}>
            {saving ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <Ionicons name="trash" size={20} color="#fff" />
                <Text style={styles.saveButtonText}>Supprimer</Text>
              </>
            )}
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  loadingContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 },
  loadingText: { marginTop: 16, fontSize: 16, color: '#6B7280' },
  header: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 20, backgroundColor: '#FFFFFF', borderBottomWidth: 1, borderBottomColor: '#E5E7EB', flexDirection: 'row', alignItems: 'center', gap: 16 },
  backButton: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#F9FAFB', alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 20, fontWeight: '700', color: '#111827' },
  section: { paddingHorizontal: 20, paddingTop: 20 },
  card: { backgroundColor: '#FFFFFF', borderRadius: 16, padding: 16, gap: 12, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 8, shadowOffset: { width: 0, height: 2 }, elevation: 2 },
  statusRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10 },
  badgeText: { fontSize: 12, fontWeight: '700' },
  label: { fontSize: 14, color: '#374151', fontWeight: '600' },
  input: { backgroundColor: '#F9FAFB', borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, fontSize: 16, color: '#111827' },
  textArea: { minHeight: 100, textAlignVertical: 'top' },
  smallBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10 },
  smallBtnText: { fontWeight: '700' },
  saveButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: '#2563EB', paddingVertical: 16, borderRadius: 12, marginBottom: 12 },
  deleteButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: '#EF4444', paddingVertical: 16, borderRadius: 12 },
  saveButtonDisabled: { opacity: 0.6 },
  saveButtonText: { fontSize: 16, fontWeight: '700', color: '#FFFFFF' },
});
