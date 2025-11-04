import React from 'react';
import { SafeAreaView, View, Text, StyleSheet, FlatList, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { EmptyState } from '@/components/EmptyState';

export default function RendezVousScreen() {
  const router = useRouter();
  const data: any[] = [
    // Empty for now to show EmptyState
    // { id: '1', title: 'Consultation générale', date: 'Mar 24, 10:30', doctor: 'Dr. Sara Benali' },
    // { id: '2', title: 'Dentiste', date: 'Mar 26, 09:00', doctor: 'Dr. Amine El Idrissi' },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Mes rendez-vous</Text>
        <Pressable style={styles.addBtn} onPress={() => {}}>
          <Ionicons name="add" size={20} color="#fff" />
          <Text style={styles.addText}>Nouveau</Text>
        </Pressable>
      </View>

      {data.length === 0 ? (
        <EmptyState
          icon="calendar-outline"
          title="Aucun rendez-vous"
          description="Prenez votre premier rendez-vous en quelques clics"
          primaryAction={{
            label: "Rechercher un médecin",
            icon: "search",
            onPress: () => router.push('/recherche'),
          }}
          secondaryAction={{
            label: "Comment ça marche ?",
            onPress: () => {
              // Could show a modal or navigate to help
            },
          }}
        />
      ) : (
        <FlatList
          data={data}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ padding: 16, gap: 12 }}
          renderItem={({ item }) => (
            <View style={styles.card}>
              <View style={styles.cardIcon}>
                <Ionicons name="calendar" size={20} color="#2563EB" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.cardTitle}>{item.title}</Text>
                <Text style={styles.cardSub}>{item.date} · {item.doctor}</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
            </View>
          )}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#fff',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#E5E7EB',
  },
  headerTitle: { fontSize: 20, fontWeight: '800', color: '#111827' },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#2563EB',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
  },
  addText: { color: '#fff', fontWeight: '700' },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  cardIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardTitle: { fontWeight: '700', color: '#111827' },
  cardSub: { color: '#6B7280', fontSize: 12 },
});