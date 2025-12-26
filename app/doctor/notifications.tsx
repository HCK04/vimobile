import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, ActivityIndicator, FlatList, Pressable, StyleSheet, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { apiClient } from '../../lib/apiClient';
import { getAuth } from '../../lib/api';
import { EmptyState } from '@/components/EmptyState';
import { Palette } from '../../constants/Colors';

export default function DoctorNotificationsScreen() {
  const router = useRouter();
  const { user } = getAuth();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [items, setItems] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiClient.get('/notifications');
      const data = Array.isArray(res.data) ? res.data : [];
      setItems(data);
    } catch (e: any) {
      setItems([]);
      setError(e?.response?.status === 401 ? 'Authentification requise' : 'Erreur de chargement');
    } finally {
      setLoading(false);
    }
  }, []);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }, [load]);

  useEffect(() => { load(); }, [load]);

  const markAllRead = async () => {
    try {
      await apiClient.put('/notifications/read-all');
      onRefresh();
    } catch (_) { }
  };

  const markRead = async (id: string) => {
    try {
      await apiClient.put(`/notifications/${encodeURIComponent(id)}/read`);
      setItems((prev) => prev.map((n) => n.id === id ? { ...n, read_at: new Date().toISOString() } : n));
    } catch (_) { }
  };

  if (!user) {
    return (
      <SafeAreaView style={[styles.center, { backgroundColor: Palette.background }]}>
        <Text style={styles.text}>Espace professionnel sécurisé</Text>
        <Pressable onPress={() => router.push('/auth/professional' as any)} style={styles.cta}><Text style={styles.ctaText}>Se connecter</Text></Pressable>
      </SafeAreaView>
    );
  }

  if (loading && !refreshing) return <SafeAreaView style={[styles.center, { backgroundColor: Palette.background }]}><ActivityIndicator color={Palette.primary} /></SafeAreaView>;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: Palette.background }} edges={['top']}>
      {/* Header */}
      <View style={styles.headerBar}>
        <Text style={styles.headerTitle}>Notifications</Text>
        <Pressable onPress={markAllRead} style={styles.iconBtn}>
          <Ionicons name="checkmark-done" size={18} color={Palette.primary} />
        </Pressable>
      </View>

      {error ? (
        <View style={{ flex: 1 }}>
          <EmptyState
            icon="lock-closed-outline"
            title="Authentification requise"
            description="Connectez-vous pour voir vos notifications."
            primaryAction={{ label: 'Se connecter', icon: 'log-in-outline', onPress: () => router.push('/auth/professional' as any) }}
          />
        </View>
      ) : items.length === 0 ? (
        <View style={{ flex: 1 }}>
          <EmptyState
            icon="notifications-off-outline"
            title="Aucune notification"
            description="Vous serez notifié des rendez-vous et mises à jour."
            primaryAction={{ label: 'Actualiser', icon: 'refresh', onPress: onRefresh }}
          />
        </View>
      ) : (
        <FlatList
          data={items}
          keyExtractor={(it) => String(it.id)}
          contentContainerStyle={{ padding: 16 }}
          renderItem={({ item }) => {
            const isUnread = !item.read_at;
            return (
              <Pressable onPress={() => markRead(String(item.id))} style={[styles.card, isUnread && styles.cardUnread]}>
                <View style={styles.cardIcon}><Ionicons name={isUnread ? 'notifications' : 'notifications-outline'} size={18} color={isUnread ? Palette.primary : Palette.textPlaceholder} /></View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.title}>{item?.data?.title || 'Notification'}</Text>
                  {!!item?.data?.message && <Text style={styles.sub} numberOfLines={2}>{item.data.message}</Text>}
                </View>
                {isUnread && <View style={styles.badge} />}
              </Pressable>
            );
          }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[Palette.primary]} tintColor={Palette.primary} />}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 16 },
  text: { color: Palette.textSecondary, marginBottom: 10 },
  cta: { backgroundColor: Palette.primary, paddingVertical: 12, paddingHorizontal: 16, borderRadius: 10 },
  ctaText: { color: Palette.surface, fontWeight: '700' },
  headerBar: { paddingHorizontal: 16, paddingTop: 14, paddingBottom: 10, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: Palette.surface, borderBottomWidth: 1, borderBottomColor: Palette.border },
  headerTitle: { fontSize: 20, fontWeight: '800', color: Palette.text },
  iconBtn: { backgroundColor: Palette.background, borderWidth: 1, borderColor: Palette.border, padding: 8, borderRadius: 10 },
  card: { backgroundColor: Palette.surface, borderRadius: 12, padding: 12, borderWidth: 1, borderColor: Palette.border, flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  cardUnread: { borderColor: Palette.primary, backgroundColor: Palette.primaryLight },
  cardIcon: { width: 36, height: 36, borderRadius: 18, backgroundColor: Palette.background, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  title: { fontWeight: '700', color: Palette.text },
  sub: { color: Palette.textSecondary, marginTop: 2 },
  badge: { width: 10, height: 10, borderRadius: 5, backgroundColor: Palette.primary },
});
