import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { View, Text, ActivityIndicator, Pressable, StyleSheet, ScrollView, RefreshControl, TextInput, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { api } from '../../../lib/api';

export default function AnnoncesListScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [items, setItems] = useState<any[]>([]);
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api.getAnnonces({ status: statusFilter === 'all' ? undefined : statusFilter, search: query || undefined });
      setItems(Array.isArray(data) ? data : []);
    } catch (e: any) {
      Alert.alert('Erreur', e?.message || "Impossible de charger les annonces");
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [statusFilter, query]);

  useEffect(() => { load(); }, [load]);

  const onRefresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  const filtered = useMemo(() => items, [items]);

  const toggleStatus = async (id: number, current: boolean) => {
    try {
      await api.toggleAnnonceStatus(id, !current);
      await load();
    } catch (e: any) {
      Alert.alert('Erreur', e?.message || "Impossible de modifier le statut");
    }
  };

  const remove = async (id: number) => {
    Alert.alert('Confirmation', 'Supprimer cette annonce ?', [
      { text: 'Annuler', style: 'cancel' },
      { text: 'Supprimer', style: 'destructive', onPress: async () => {
        try { await api.deleteAnnonce(id); await load(); }
        catch (e: any) { Alert.alert('Erreur', e?.message || 'Suppression impossible'); }
      }}
    ]);
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Mes annonces</Text>
        <Pressable onPress={() => router.push('/doctor/annonces/new' as any)} style={styles.addBtn}>
          <Ionicons name="add" size={22} color="#fff" />
          <Text style={styles.addBtnText}>Nouvelle</Text>
        </Pressable>
      </View>

      {/* Search & Filters */}
      <View style={styles.filters}>
        <View style={styles.searchBox}>
          <Ionicons name="search" size={18} color="#6B7280" />
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder="Rechercher une annonce..."
            placeholderTextColor="#9CA3AF"
            style={styles.searchInput}
            returnKeyType="search"
            onSubmitEditing={load}
          />
          {!!query && (
            <Pressable onPress={() => setQuery('')}>
              <Ionicons name="close" size={18} color="#9CA3AF" />
            </Pressable>
          )}
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {(['all','active','inactive'] as const).map((k) => (
            <Pressable key={k} onPress={() => setStatusFilter(k)} style={[styles.chip, statusFilter===k && styles.chipActive]}>
              <Text style={[styles.chipText, statusFilter===k && styles.chipTextActive]}>
                {k==='all'?'Tous':k==='active'?'Actives':'Inactives'}
              </Text>
            </Pressable>
          ))}
        </ScrollView>
      </View>

      {/* List */}
      {loading ? (
        <View style={styles.loading}><ActivityIndicator size="large" color="#2563EB" /></View>
      ) : (
        <ScrollView
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#2563EB']} />}
          contentContainerStyle={{ paddingBottom: 24 }}
        >
          {filtered.length === 0 && (
            <View style={styles.empty}> 
              <Ionicons name="pricetag-outline" size={56} color="#D1D5DB" />
              <Text style={styles.emptyTitle}>Aucune annonce</Text>
              <Text style={styles.emptySubtitle}>Créez votre première annonce pour promouvoir vos services</Text>
            </View>
          )}

          <View style={{ paddingHorizontal: 20, gap: 12 }}>
            {filtered.map((it) => (
              <Pressable key={it.id} onPress={() => router.push(`/doctor/annonces/${it.id}` as any)} style={styles.card}>
                <View style={styles.cardHeader}>
                  <View style={[styles.badge, { backgroundColor: it.is_active ? '#DCFCE7' : '#FEE2E2' }]}>
                    <Text style={[styles.badgeText, { color: it.is_active ? '#10B981' : '#EF4444' }]}>
                      {it.is_active ? 'Active' : 'Inactive'}
                    </Text>
                  </View>
                  <Text style={styles.dateText}>{new Date(it.created_at || it.updated_at || Date.now()).toLocaleDateString('fr-FR')}</Text>
                </View>
                <Text style={styles.title}>{it.title}</Text>
                <Text numberOfLines={2} style={styles.desc}>{it.description}</Text>

                <View style={styles.metaRow}>
                  <View style={styles.metaItem}>
                    <Ionicons name="cash-outline" size={16} color="#6B7280" />
                    <Text style={styles.metaText}>{it.discounted_price ?? it.price} DH</Text>
                  </View>
                  <View style={styles.metaItem}>
                    <Ionicons name="albums-outline" size={16} color="#6B7280" />
                    <Text style={styles.metaText}>{it.confirmed_rdv_count ?? 0} confirmés</Text>
                  </View>
                </View>

                <View style={styles.actionsRow}>
                  <Pressable onPress={() => router.push(`/doctor/annonces/${it.id}` as any)} style={[styles.smallBtn, { backgroundColor: '#F3F4F6' }]}>
                    <Ionicons name="create-outline" size={16} color="#111827" />
                    <Text style={[styles.smallBtnText, { color: '#111827' }]}>Modifier</Text>
                  </Pressable>
                  <Pressable onPress={() => toggleStatus(it.id, !!it.is_active)} style={[styles.smallBtn, { backgroundColor: it.is_active ? '#FEE2E2' : '#DCFCE7' }]}>
                    <Ionicons name={it.is_active ? 'close-circle' : 'checkmark-circle'} size={16} color={it.is_active ? '#EF4444' : '#10B981'} />
                    <Text style={[styles.smallBtnText, { color: it.is_active ? '#EF4444' : '#10B981' }]}>
                      {it.is_active ? 'Désactiver' : 'Activer'}
                    </Text>
                  </Pressable>
                  <Pressable onPress={() => remove(it.id)} style={[styles.smallBtn, { backgroundColor: '#FEE2E2' }]}>
                    <Ionicons name="trash" size={16} color="#EF4444" />
                    <Text style={[styles.smallBtnText, { color: '#EF4444' }]}>Supprimer</Text>
                  </Pressable>
                </View>
              </Pressable>
            ))}
          </View>
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  header: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 16, backgroundColor: '#FFF', borderBottomWidth: 1, borderBottomColor: '#E5E7EB', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  headerTitle: { fontSize: 20, fontWeight: '700', color: '#111827' },
  addBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#2563EB', paddingHorizontal: 14, paddingVertical: 10, borderRadius: 10 },
  addBtnText: { color: '#fff', fontWeight: '700' },
  filters: { paddingHorizontal: 20, paddingTop: 16, gap: 12 },
  searchBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF', borderRadius: 12, paddingHorizontal: 12, paddingVertical: 10, gap: 8, borderWidth: 1, borderColor: '#E5E7EB' },
  searchInput: { flex: 1, fontSize: 16, color: '#111827' },
  chip: { paddingHorizontal: 14, paddingVertical: 8, backgroundColor: '#F3F4F6', borderRadius: 18, marginRight: 8 },
  chipActive: { backgroundColor: '#EFF6FF' },
  chipText: { color: '#6B7280', fontWeight: '600' },
  chipTextActive: { color: '#2563EB' },
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 },
  empty: { alignItems: 'center', paddingTop: 40, paddingBottom: 24, gap: 8 },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: '#111827' },
  emptySubtitle: { fontSize: 14, color: '#6B7280' },
  card: { backgroundColor: '#FFF', borderRadius: 16, padding: 16, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 8, shadowOffset: { width: 0, height: 2 }, elevation: 2 },
  cardHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 },
  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10 },
  badgeText: { fontSize: 12, fontWeight: '700' },
  dateText: { fontSize: 12, color: '#6B7280' },
  title: { fontSize: 16, fontWeight: '700', color: '#111827', marginBottom: 4 },
  desc: { fontSize: 14, color: '#6B7280' },
  metaRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 12 },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  metaText: { fontSize: 12, color: '#6B7280', fontWeight: '600' },
  actionsRow: { flexDirection: 'row', gap: 8, marginTop: 14 },
  smallBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10 },
  smallBtnText: { fontWeight: '700' },
});
