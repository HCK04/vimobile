import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

interface Stat {
  icon: keyof typeof Ionicons.glyphMap;
  value: number;
  label: string;
  route: string;
  color: string;
  backgroundColor: string;
}

interface UserStatsRowProps {
  upcomingAppointments?: number;
  unreadMessages?: number;
  favoriteDoctors?: number;
}

export function UserStatsRow({ 
  upcomingAppointments = 0, 
  unreadMessages = 0, 
  favoriteDoctors = 0 
}: UserStatsRowProps) {
  const router = useRouter();

  const stats: Stat[] = [
    {
      icon: 'calendar',
      value: upcomingAppointments,
      label: 'RDV à venir',
      route: '/rendezvous',
      color: '#3B82F6',
      backgroundColor: '#EFF6FF',
    },
    {
      icon: 'chatbubbles',
      value: unreadMessages,
      label: 'Messages',
      route: '/messages',
      color: '#F59E0B',
      backgroundColor: '#FEF3C7',
    },
    {
      icon: 'heart',
      value: favoriteDoctors,
      label: 'Favoris',
      route: '/favorites',
      color: '#EC4899',
      backgroundColor: '#FCE7F3',
    },
  ];

  return (
    <View style={styles.container}>
      <Text style={styles.sectionTitle}>Mes statistiques</Text>
      <View style={styles.statsRow}>
        {stats.map((stat) => (
          <Pressable
            key={stat.label}
            style={styles.statCard}
            onPress={() => router.push(stat.route as any)}
          >
            <View style={[styles.iconCircle, { backgroundColor: stat.backgroundColor }]}>
              <Ionicons name={stat.icon} size={24} color={stat.color} />
            </View>
            <Text style={styles.statValue}>{stat.value}</Text>
            <Text style={styles.statLabel}>{stat.label}</Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 12,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOpacity: 0.03,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
  },
  iconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  statValue: {
    fontSize: 24,
    fontWeight: '800',
    color: '#111827',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6B7280',
    textAlign: 'center',
  },
});
