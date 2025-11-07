import React, { useCallback, useState } from 'react';
import { View, Text, ActivityIndicator, Pressable, StyleSheet, ScrollView, TextInput, Alert, Switch } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { api } from '../../../lib/api';

export default function NewAnnonceScreen() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);

  // Required fields
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState<'general' | 'urgent' | 'info' | 'maintenance' | 'service' | 'consultation'>('general');
  const [price, setPrice] = useState('');
  const [address, setAddress] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [isActive, setIsActive] = useState(true);

  // Optional
  const [content, setContent] = useState('');
  const [pourcentage, setPourcentage] = useState('');

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
    if (err) {
      Alert.alert('Erreur', err);
      return;
    }

    setSaving(true);
    try {
      await api.createAnnonce({
        title: title.trim(),
        description: description.trim(),
        content: content.trim() || undefined,
        type,
        price: Number(price),
        address: address.trim(),
        phone: phone.trim(),
        email: email.trim(),
        is_active: isActive,
        pourcentage_reduction: pourcentage ? Number(pourcentage) : 0,
      });
      Alert.alert('Succès', 'Annonce créée avec succès', [
        { text: 'OK', onPress: () => router.replace('/doctor/annonces' as any) }
      ]);
    } catch (e: any) {
      const msg = e?.response?.data?.message || e?.message || 'Impossible de créer l\'annonce';
      Alert.alert('Erreur', msg);
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#111827" />
        </Pressable>
        <Text style={styles.headerTitle}>Nouvelle annonce</Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 32 }}>
        <View style={styles.section}>
          <View style={styles.card}>
            <Text style={styles.label}>Titre *</Text>
            <TextInput value={title} onChangeText={setTitle} placeholder="Titre" placeholderTextColor="#9CA3AF" style={styles.input} />

            <Text style={styles.label}>Description *</Text>
            <TextInput value={description} onChangeText={setDescription} placeholder="Description" placeholderTextColor="#9CA3AF" multiline numberOfLines={4} style={[styles.input, styles.textArea]} />

            <Text style={styles.label}>Type *</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 8 }}>
              {(['general','urgent','info','maintenance','service','consultation'] as const).map((t) => (
                <Pressable key={t} onPress={() => setType(t)} style={[styles.chip, type===t && styles.chipActive]}>
                  <Text style={[styles.chipText, type===t && styles.chipTextActive]}>{t}</Text>
                </Pressable>
              ))}
            </ScrollView>

            <Text style={styles.label}>Prix (DH) *</Text>
            <TextInput value={price} onChangeText={setPrice} keyboardType="numeric" placeholder="0" placeholderTextColor="#9CA3AF" style={styles.input} />

            <Text style={styles.label}>Adresse *</Text>
            <TextInput value={address} onChangeText={setAddress} placeholder="Adresse" placeholderTextColor="#9CA3AF" style={styles.input} />

            <Text style={styles.label}>Téléphone *</Text>
            <TextInput value={phone} onChangeText={setPhone} keyboardType="phone-pad" placeholder="+212 6XX XX XX XX" placeholderTextColor="#9CA3AF" style={styles.input} />

            <Text style={styles.label}>Email *</Text>
            <TextInput value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" placeholder="email@example.com" placeholderTextColor="#9CA3AF" style={styles.input} />

            <View style={styles.row}>
              <Text style={styles.label}>Active</Text>
              <Switch value={isActive} onValueChange={setIsActive} trackColor={{ false: '#E5E7EB', true: '#DCFCE7' }} thumbColor={isActive ? '#10B981' : '#F9FAFB'} />
            </View>

            <Text style={styles.label}>Réduction (%)</Text>
            <TextInput value={pourcentage} onChangeText={setPourcentage} keyboardType="numeric" placeholder="0" placeholderTextColor="#9CA3AF" style={styles.input} />
          </View>
        </View>

        {/* Save Button */}
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
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  header: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 20, backgroundColor: '#FFFFFF', borderBottomWidth: 1, borderBottomColor: '#E5E7EB', flexDirection: 'row', alignItems: 'center', gap: 16 },
  backButton: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#F9FAFB', alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 20, fontWeight: '700', color: '#111827' },
  section: { paddingHorizontal: 20, paddingTop: 20 },
  card: { backgroundColor: '#FFFFFF', borderRadius: 16, padding: 16, gap: 12, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 8, shadowOffset: { width: 0, height: 2 }, elevation: 2 },
  label: { fontSize: 14, color: '#374151', fontWeight: '600' },
  input: { backgroundColor: '#F9FAFB', borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, fontSize: 16, color: '#111827' },
  textArea: { minHeight: 100, textAlignVertical: 'top' },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  chip: { paddingHorizontal: 12, paddingVertical: 8, backgroundColor: '#F3F4F6', borderRadius: 16, marginRight: 8 },
  chipActive: { backgroundColor: '#EFF6FF' },
  chipText: { color: '#6B7280', fontWeight: '600' },
  chipTextActive: { color: '#2563EB' },
  saveButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: '#2563EB', paddingVertical: 16, borderRadius: 12 },
  saveButtonDisabled: { opacity: 0.6 },
  saveButtonText: { fontSize: 16, fontWeight: '700', color: '#FFFFFF' },
});
