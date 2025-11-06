import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, ActivityIndicator, FlatList, Pressable, StyleSheet, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { apiClient } from '../../lib/apiClient';
import { EmptyState } from '@/components/EmptyState';

export default function PatientNotificationsScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [items, setItems] = useState<any[]>([]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiClient.get('/notifications');
      const data = Array.isArray(res.data) ? res.data : [];
      setItems(data);
    } catch (e: any) {
      console.error('Failed to load notifications:', e);
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }, [load]);

  useEffect(() => {
    load();
  }, [load]);

  const markAllRead = async () => {
    try {
      await apiClient.put('/notifications/read-all');
      onRefresh();
    } catch (_) {}
  };

  const markRead = async (id: string) => {
    try {
      await apiClient.put(`/notifications/${encodeURIComponent(id)}/read`);
      setItems((prev) => prev.map((n) => (n.id === id ? { ...n, read_at: new Date().toISOString() } : n)));
    } catch (_) {}
  };

  if (loading && !refreshing) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#111827" />
          </Pressable>
          <Text style={styles.headerTitle}>Notifications</Text>
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
        <Text style={styles.headerTitle}>Notifications</Text>
        {items.length > 0 && (
          <Pressable onPress={markAllRead} style={styles.iconBtn}>
            <Ionicons name="checkmark-done" size={18} color="#2563EB" />
          </Pressable>
        )}
        {items.length === 0 && <View style={{ width: 40 }} />}
      </View>

      {items.length === 0 ? (
        <View style={{ flex: 1 }}>
          <EmptyState
            icon="notifications-off-outline"
            title="Aucune notification"
            description="Vous serez notifié des rendez-vous et mises à jour importantes"
            primaryAction={{
              label: 'Actualiser',
              icon: 'refresh',
              onPress: onRefresh,
            }}
          />
        </View>
      ) : (
        <FlatList
          data={items}
          keyExtractor={(it) => String(it.id)}
          contentContainerStyle={{ padding: 16, gap: 10 }}
          renderItem={({ item }) => {
            const isUnread = !item.read_at;
            return (
              <Pressable onPress={() => markRead(String(item.id))} style={[styles.card, isUnread && styles.cardUnread]}>
                <View style={styles.cardIcon}>
                  <Ionicons
                    name={isUnread ? 'notifications' : 'notifications-outline'}
                    size={18}
                    color={isUnread ? '#2563EB' : '#6B7280'}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.title}>{item?.data?.title || 'Notification'}</Text>
                  {!!item?.data?.message && (
                    <Text style={styles.sub} numberOfLines={2}>
                      {item.data.message}
                    </Text>
                  )}
                  {!!item.created_at && (
                    <Text style={styles.time}>
                      {new Date(item.created_at).toLocaleDateString('fr-FR', {
                        day: 'numeric',
                        month: 'short',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </Text>
                  )}
                </View>
                {isUnread && <View style={styles.badge} />}
              </Pressable>
            );
          }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#2563EB']} />}
        />
      )}
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
  iconBtn: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#EFF6FF',
    borderRadius: 10,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  cardUnread: {
    borderColor: '#93C5FD',
    backgroundColor: '#F8FAFF',
  },
  cardIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontWeight: '700',
    color: '#111827',
    marginBottom: 4,
  },
  sub: {
    color: '#6B7280',
    fontSize: 13,
    marginBottom: 4,
  },
  time: {
    color: '#9CA3AF',
    fontSize: 11,
  },
  badge: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#2563EB',
  },
});
