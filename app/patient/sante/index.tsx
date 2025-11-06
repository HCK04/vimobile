import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, ActivityIndicator, Alert, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { apiClient } from '../../../lib/apiClient';

export default function SanteIndexScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [santeData, setSanteData] = useState<any>(null);

  const loadData = useCallback(async (showLoader = true) => {
    try {
      if (showLoader) setLoading(true);
      const { data } = await apiClient.get('/patient/sante');
      setSanteData(data.sante || {});
    } catch (error: any) {
      console.error('Failed to load health data:', error);
      if (error?.response?.status === 403) {
        Alert.alert('Accès refusé', 'Cette fonctionnalité est réservée aux patients.');
        router.back();
      }
    } finally {
      if (showLoader) setLoading(false);
      setRefreshing(false);
    }
  }, [router]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useFocusEffect(
    useCallback(() => {
      loadData(false);
    }, [loadData])
  );

  const onRefresh = () => {
    setRefreshing(true);
    loadData(false);
  };

  const getItemCount = (section: any) => {
    if (!section) return 0;
    if (section.none) return 0;
    return section.items?.length || 0;
  };

  const sections = [
    {
      key: 'vaccins',
      title: 'Vaccins',
      icon: 'medical',
      color: '#10B981',
      bg: '#D1FAE5',
      route: '/patient/sante/vaccins',
    },
    {
      key: 'documents',
      title: 'Documents médicaux',
      icon: 'document-text',
      color: '#3B82F6',
      bg: '#DBEAFE',
      route: '/patient/sante/documents',
    },
    {
      key: 'allergies',
      title: 'Allergies',
      icon: 'warning',
      color: '#F59E0B',
      bg: '#FEF3C7',
      route: '/patient/sante/allergies',
    },
    {
      key: 'traitements_reguliers',
      title: 'Traitements réguliers',
      icon: 'medkit',
      color: '#8B5CF6',
      bg: '#EDE9FE',
      route: '/patient/sante/traitements',
    },
    {
      key: 'antecedents_medicaux',
      title: 'Antécédents médicaux',
      icon: 'pulse',
      color: '#EF4444',
      bg: '#FEE2E2',
      route: '/patient/sante/antecedents',
    },
    {
      key: 'operations_chirurgicales',
      title: 'Opérations chirurgicales',
      icon: 'cut',
      color: '#EC4899',
      bg: '#FCE7F3',
      route: '/patient/sante/operations',
    },
    {
      key: 'antecedents_familiaux',
      title: 'Antécédents familiaux',
      icon: 'people',
      color: '#06B6D4',
      bg: '#CFFAFE',
      route: '/patient/sante/familiaux',
    },
    {
      key: 'mesures',
      title: 'Mesures & Constantes',
      icon: 'stats-chart',
      color: '#14B8A6',
      bg: '#CCFBF1',
      route: '/patient/sante/mesures',
    },
  ];

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#111827" />
          </Pressable>
          <Text style={styles.headerTitle}>Mon Dossier Santé</Text>
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
        <Text style={styles.headerTitle}>Mon Dossier Santé</Text>
        <Pressable onPress={onRefresh} style={styles.refreshButton}>
          <Ionicons name="refresh" size={20} color="#2563EB" />
        </Pressable>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#2563EB']} />}
      >
        {/* Info Card */}
        <View style={styles.infoCard}>
          <View style={styles.infoIconCircle}>
            <Ionicons name="shield-checkmark" size={24} color="#10B981" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.infoTitle}>Données sécurisées</Text>
            <Text style={styles.infoText}>
              Vos informations médicales sont protégées et conformes CNDP
            </Text>
          </View>
        </View>

        {/* Sections Grid */}
        <View style={styles.sectionsGrid}>
          {sections.map((section) => {
            const count = getItemCount(santeData?.[section.key]);
            const hasNone = santeData?.[section.key]?.none;
            
            return (
              <Pressable
                key={section.key}
                style={styles.sectionCard}
                onPress={() => router.push(section.route as any)}
              >
                <View style={[styles.sectionIcon, { backgroundColor: section.bg }]}>
                  <Ionicons name={section.icon as any} size={24} color={section.color} />
                </View>
                <Text style={styles.sectionTitle} numberOfLines={2}>
                  {section.title}
                </Text>
                {hasNone ? (
                  <Text style={styles.sectionCount}>Aucun</Text>
                ) : count > 0 ? (
                  <View style={[styles.badge, { backgroundColor: section.color }]}>
                    <Text style={styles.badgeText}>{count}</Text>
                  </View>
                ) : (
                  <Text style={styles.sectionCount}>Vide</Text>
                )}
                <Ionicons name="chevron-forward" size={16} color="#9CA3AF" style={{ marginTop: 4 }} />
              </Pressable>
            );
          })}
        </View>

        <View style={{ height: 32 }} />
      </ScrollView>
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
  refreshButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#EFF6FF',
    borderRadius: 10,
  },
  scrollContent: {
    padding: 16,
  },
  infoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#ECFDF5',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#A7F3D0',
    marginBottom: 24,
  },
  infoIconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#D1FAE5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#065F46',
    marginBottom: 4,
  },
  infoText: {
    fontSize: 13,
    color: '#047857',
    lineHeight: 18,
  },
  sectionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  sectionCard: {
    width: '48%',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  sectionIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#374151',
    textAlign: 'center',
    marginBottom: 8,
    minHeight: 36,
  },
  sectionCount: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 4,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginBottom: 4,
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
});
