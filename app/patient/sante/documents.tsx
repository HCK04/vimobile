import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import * as WebBrowser from 'expo-web-browser';
import { apiClient } from '../../../lib/apiClient';

function isImage(path?: string) {
  if (!path) return false;
  const lower = path.toLowerCase();
  return ['.jpg', '.jpeg', '.png', '.gif', '.webp'].some((ext) => lower.endsWith(ext));
}

function getFileNameFromUri(uri: string) {
  try {
    const parts = uri.split('/')
    return parts[parts.length - 1] || `document_${Date.now()}.jpg`;
  } catch {
    return `document_${Date.now()}.jpg`;
  }
}

export default function DocumentsScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [items, setItems] = useState<any[]>([]);
  const [hasNone, setHasNone] = useState(false);

  const baseURL = useMemo(() => {
    const b = (apiClient.defaults as any)?.baseURL || '';
    return typeof b === 'string' ? b.replace(/\/$/, '') : '';
  }, []);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const { data } = await apiClient.get('/patient/sante');
      const section = data?.sante?.documents || {};
      setItems(section.items || []);
      setHasNone(!!section.none);
    } catch (error) {
      console.error('Failed to load documents:', error);
      setItems([]);
      setHasNone(false);
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

  const openDoc = async (doc: any) => {
    const url = `${baseURL}${doc.path || ''}`;
    try {
      await WebBrowser.openBrowserAsync(url);
    } catch {
      Alert.alert('Erreur', "Impossible d'ouvrir le document");
    }
  };

  const onUpload = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission requise', "Nous avons besoin de l'accès à vos photos pour téléverser un document.");
        return;
      }

      const res = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, quality: 0.9 });
      if (res.canceled || !res.assets || res.assets.length === 0) return;

      const asset = res.assets[0];
      const uri = asset.uri;
      const name = getFileNameFromUri(uri);
      const type = asset.mimeType || 'image/jpeg';

      const formData = new FormData();
      (formData as any).append('file', {
        uri,
        name,
        type,
      });

      setUploading(true);
      const uploadRes = await apiClient.post('/patient/sante/documents/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      const docs = uploadRes?.data?.documents;
      if (Array.isArray(docs)) {
        setItems(docs);
        setHasNone(false);
      } else {
        // Fallback: reload section
        await loadData();
      }
    } catch (e: any) {
      const msg = e?.response?.data?.message || "Téléversement échoué";
      Alert.alert('Erreur', msg);
    } finally {
      setUploading(false);
    }
  };

  const onDelete = async (id: string) => {
    Alert.alert('Supprimer', 'Voulez-vous supprimer ce document ?', [
      { text: 'Annuler', style: 'cancel' },
      {
        text: 'Supprimer', style: 'destructive', onPress: async () => {
          try {
            const { data } = await apiClient.delete(`/patient/sante/documents/${encodeURIComponent(id)}`);
            const docs = data?.documents;
            if (Array.isArray(docs)) setItems(docs); else await loadData();
          } catch {
            Alert.alert('Erreur', 'Suppression impossible');
          }
        }
      }
    ]);
  };

  const onToggleNone = async () => {
    try {
      const newValue = !hasNone;
      const { data } = await apiClient.post('/patient/sante/section/documents', { none: newValue });
      const section = data?.data;
      setHasNone(!!section?.none);
      // Items are managed via upload/delete endpoints; keep existing list as-is
    } catch {
      Alert.alert('Erreur', 'Mise à jour impossible');
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#111827" />
          </Pressable>
          <Text style={styles.headerTitle}>Documents médicaux</Text>
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
        <Text style={styles.headerTitle}>Documents médicaux</Text>
        <Pressable onPress={onUpload} disabled={uploading} style={[styles.addButton, uploading && { opacity: 0.6 }] }>
          {uploading ? <ActivityIndicator color="#fff" /> : <Ionicons name="cloud-upload" size={20} color="#FFFFFF" />}
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* None Toggle */}
        <Pressable style={styles.noneCard} onPress={onToggleNone}>
          <View style={{ flex: 1 }}>
            <Text style={styles.noneTitle}>Aucun document</Text>
            <Text style={styles.noneText}>Je n'ai aucun document médical</Text>
          </View>
          <View style={[styles.checkbox, hasNone && styles.checkboxActive]}>
            {hasNone && <Ionicons name="checkmark" size={16} color="#FFFFFF" />}
          </View>
        </Pressable>

        {/* Empty State */}
        {!hasNone && items.length === 0 && (
          <View style={styles.emptyState}>
            <View style={styles.emptyIcon}>
              <Ionicons name="document-text" size={48} color="#D1D5DB" />
            </View>
            <Text style={styles.emptyTitle}>Aucun document enregistré</Text>
            <Text style={styles.emptyText}>Téléversez vos ordonnances, bilans, examens pour un meilleur suivi</Text>
          </View>
        )}

        {/* Documents List */}
        {!hasNone && items.map((doc) => {
          const img = isImage(doc?.path);
          const uri = `${baseURL}${doc?.path || ''}`;
          return (
            <View key={doc.id} style={styles.docCard}>
              <View style={styles.docPreview}>
                {img ? (
                  <Image source={{ uri }} style={{ width: 56, height: 56, borderRadius: 12 }} contentFit="cover" />
                ) : (
                  <View style={styles.docIcon}><Ionicons name="document-text" size={24} color="#2563EB" /></View>
                )}
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.docName} numberOfLines={1}>{doc?.name || 'Document'}</Text>
                {!!doc?.uploaded_at && (
                  <Text style={styles.docMeta}>
                    Ajouté le {new Date(doc.uploaded_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
                  </Text>
                )}
                <View style={{ flexDirection: 'row', gap: 12, marginTop: 8 }}>
                  <Pressable onPress={() => openDoc(doc)} style={styles.secondaryBtn}>
                    <Ionicons name="open-outline" size={16} color="#2563EB" />
                    <Text style={styles.secondaryBtnText}>Ouvrir</Text>
                  </Pressable>
                  <Pressable onPress={() => onDelete(doc.id)} style={styles.deleteBtn}>
                    <Ionicons name="trash-outline" size={16} color="#EF4444" />
                    <Text style={styles.deleteBtnText}>Supprimer</Text>
                  </Pressable>
                </View>
              </View>
            </View>
          );
        })}

        <View style={{ height: 32 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 12,
    backgroundColor: '#FFFFFF', borderBottomWidth: 1, borderBottomColor: '#E5E7EB'
  },
  backButton: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 20, fontWeight: '700', color: '#111827' },
  addButton: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center', backgroundColor: '#2563EB', borderRadius: 10 },
  scrollContent: { padding: 16 },
  noneCard: {
    flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: '#FFFFFF',
    borderRadius: 12, padding: 16, borderWidth: 1, borderColor: '#E5E7EB', marginBottom: 16,
  },
  noneTitle: { fontSize: 16, fontWeight: '700', color: '#111827', marginBottom: 4 },
  noneText: { fontSize: 13, color: '#6B7280' },
  checkbox: { width: 24, height: 24, borderRadius: 6, borderWidth: 2, borderColor: '#D1D5DB', alignItems: 'center', justifyContent: 'center' },
  checkboxActive: { backgroundColor: '#10B981', borderColor: '#10B981' },
  emptyState: { alignItems: 'center', paddingVertical: 48 },
  emptyIcon: { width: 96, height: 96, borderRadius: 48, backgroundColor: '#F3F4F6', alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: '#111827', marginBottom: 8 },
  emptyText: { fontSize: 14, color: '#6B7280', textAlign: 'center', paddingHorizontal: 16 },
  docCard: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: '#FFFFFF', borderRadius: 12, padding: 16, borderWidth: 1, borderColor: '#E5E7EB', marginBottom: 12 },
  docPreview: { width: 56, height: 56 },
  docIcon: { width: 56, height: 56, borderRadius: 12, backgroundColor: '#EFF6FF', alignItems: 'center', justifyContent: 'center' },
  docName: { fontWeight: '700', color: '#111827' },
  docMeta: { color: '#6B7280', fontSize: 12, marginTop: 2 },
  secondaryBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 10, paddingVertical: 8, borderRadius: 8, backgroundColor: '#F3F4F6' },
  secondaryBtnText: { color: '#2563EB', fontWeight: '700' },
  deleteBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 10, paddingVertical: 8, borderRadius: 8, backgroundColor: '#FEE2E2' },
  deleteBtnText: { color: '#EF4444', fontWeight: '700' },
});
