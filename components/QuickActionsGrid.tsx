import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

interface QuickAction {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  route: string;
  color: string;
  backgroundColor: string;
  badge?: number;
}

export function QuickActionsGrid() {
  const router = useRouter();

  const actions: QuickAction[] = [
    {
      icon: 'search',
      label: 'Trouver un médecin',
      route: '/recherche',
      color: '#3B82F6',
      backgroundColor: '#EFF6FF',
    },
    {
      icon: 'calendar',
      label: 'Mes rendez-vous',
      route: '/rendezvous',
      color: '#10B981',
      backgroundColor: '#D1FAE5',
      badge: 3,
    },
    {
      icon: 'chatbubbles',
      label: 'Messages',
      route: '/messages',
      color: '#F59E0B',
      backgroundColor: '#FEF3C7',
      badge: 2,
    },
    {
      icon: 'person',
      label: 'Mon profil',
      route: '/profile',
      color: '#EC4899',
      backgroundColor: '#FCE7F3',
    },
  ];

  return (
    <View style={styles.container}>
      <Text style={styles.sectionTitle}>Actions rapides</Text>
      <View style={styles.grid}>
        {actions.map((action) => (
          <Pressable
            key={action.label}
            style={styles.actionCard}
            onPress={() => router.push(action.route as any)}
          >
            <View style={[styles.iconContainer, { backgroundColor: action.backgroundColor }]}>
              <Ionicons name={action.icon} size={28} color={action.color} />
              {action.badge && action.badge > 0 && (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>{action.badge}</Text>
                </View>
              )}
            </View>
            <Text style={styles.actionLabel}>{action.label}</Text>
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
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  actionCard: {
    width: '48%',
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
  iconContainer: {
    position: 'relative',
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  badge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: '#EF4444',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 6,
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
  },
  actionLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#374151',
    textAlign: 'center',
    lineHeight: 18,
  },
});
