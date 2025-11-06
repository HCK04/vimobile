import React, { useEffect, useState } from 'react';
import { View, Text, ActivityIndicator, StyleSheet, Pressable, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { apiClient } from '../../lib/apiClient';

export default function ProfileScreen() {
  const router = useRouter();
  const params = useLocalSearchParams() as { nameSlug?: string; id?: string; type?: string };
  const [loading, setLoading] = useState(true);
  const [entity, setEntity] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      setLoading(true);
      setError(null);
      try {
        let id = params.id ? String(params.id) : '';
        let type = params.type ? String(params.type) : '';
        const slug = params.nameSlug || '';
        if (!id && slug) {
          try {
            const r = await apiClient.get(`/profiles/slug/${encodeURIComponent(slug)}`);
            const p = r?.data?.data ?? r?.data;
            if (p?.id) id = String(p.id);
          } catch (_) {}
          if (!id) {
            const candidates = ['pharmacies', 'parapharmacies'];
            for (const c of candidates) {
              try {
                const r2 = await apiClient.get(`/${c}/slug/${encodeURIComponent(slug)}`);
                const p2 = r2?.data?.data ?? r2?.data;
                if (p2?.id) { id = String(p2.id); type = c; break; }
              } catch (_) {}
            }
          }
        }

        let data: any = null;
        if (id) {
          // Try professional first
          try {
            const res = await apiClient.get(`/professionals/${encodeURIComponent(id)}`);
            data = res.data;
          } catch (_) {
            // Generic profile by id
            try {
              const res2 = await apiClient.get(`/profile/${encodeURIComponent(id)}`);
              data = res2.data?.data ?? res2.data;
            } catch (_) {
              // Organizations fallback
              try {
                const res3 = await apiClient.get(`/organizations/${encodeURIComponent(id)}`);
                data = res3.data;
              } catch (e) {
                setError('Profil introuvable');
              }
            }
          }
        } else {
          setError('Profil introuvable');
        }
        if (!cancelled) setEntity(data);
      } catch (e: any) {
        if (!cancelled) setError('Erreur de chargement');
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    run();
    return () => { cancelled = true; };
  }, [params.id, params.nameSlug, params.type]);

  if (loading) return (
    <SafeAreaView style={styles.container}>
      <View style={styles.center}><ActivityIndicator size="large" color="#2563EB" /></View>
    </SafeAreaView>
  );
  
  if (error || !entity) return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#111827" />
        </Pressable>
        <Text style={styles.headerTitle}>Profil</Text>
        <View style={{ width: 40 }} />
      </View>
      <View style={styles.center}>
        <Ionicons name="business-outline" size={64} color="#D1D5DB" />
        <Text style={styles.emptyTitle}>{error || 'Profil introuvable'}</Text>
        <Text style={styles.emptyText}>Ce professionnel n'existe pas ou a été supprimé</Text>
      </View>
    </SafeAreaView>
  );

  const name = entity.name || entity.nom_clinique || entity.nom_pharmacie || entity.nom_parapharmacie || entity.nom_labo || entity.nom_centre || 'Profil';
  const ville = entity.ville || entity.profile_data?.ville || '';
  const specialty = entity.specialty ? (Array.isArray(entity.specialty) ? entity.specialty.join(', ') : String(entity.specialty)) : '';
  const services = entity.services ? (Array.isArray(entity.services) ? entity.services.join(', ') : String(entity.services)) : '';
  const phone = entity.phone || entity.profile_data?.phone || entity.telephone || '';
  const email = entity.email || entity.profile_data?.email || '';
  const address = entity.adresse || entity.profile_data?.adresse || '';

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#111827" />
        </Pressable>
        <Text style={styles.headerTitle}>Profil</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Profile Card */}
        <View style={styles.profileCard}>
          <View style={styles.avatarLarge}>
            <Ionicons name="business" size={40} color="#2563EB" />
          </View>
          <Text style={styles.name}>{name}</Text>
          {!!ville && (
            <View style={styles.locationRow}>
              <Ionicons name="location" size={16} color="#6B7280" />
              <Text style={styles.locationText}>{ville}</Text>
            </View>
          )}
        </View>

        {/* Details Card */}
        {(!!specialty || !!services) && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Détails</Text>
            {!!specialty && (
              <View style={styles.infoRow}>
                <Ionicons name="medical" size={20} color="#2563EB" />
                <View style={{ flex: 1 }}>
                  <Text style={styles.infoLabel}>Spécialité</Text>
                  <Text style={styles.infoText}>{specialty}</Text>
                </View>
              </View>
            )}
            {!!services && (
              <View style={styles.infoRow}>
                <Ionicons name="list" size={20} color="#2563EB" />
                <View style={{ flex: 1 }}>
                  <Text style={styles.infoLabel}>Services</Text>
                  <Text style={styles.infoText}>{services}</Text>
                </View>
              </View>
            )}
          </View>
        )}

        {/* Contact Card */}
        {(!!phone || !!email || !!address) && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Contact</Text>
            {!!phone && (
              <View style={styles.infoRow}>
                <Ionicons name="call" size={20} color="#2563EB" />
                <Text style={styles.infoText}>{phone}</Text>
              </View>
            )}
            {!!email && (
              <View style={styles.infoRow}>
                <Ionicons name="mail" size={20} color="#2563EB" />
                <Text style={styles.infoText}>{email}</Text>
              </View>
            )}
            {!!address && (
              <View style={styles.infoRow}>
                <Ionicons name="location" size={20} color="#2563EB" />
                <Text style={styles.infoText}>{address}</Text>
              </View>
            )}
          </View>
        )}

        {/* Action Buttons */}
        {entity.id && (
          <Pressable 
            onPress={() => router.push({ pathname: '/patient/book-appointment', params: { doctorId: String(entity.id), doctorName: name } } as any)} 
            style={styles.cta}
          >
            <Ionicons name="calendar" size={20} color="#FFFFFF" />
            <Text style={styles.ctaText}>Prendre rendez-vous</Text>
          </Pressable>
        )}
        <Pressable onPress={() => router.push('/rendezvous' as any)} style={styles.secondaryCta}>
          <Ionicons name="time" size={20} color="#2563EB" />
          <Text style={styles.secondaryCtaText}>Voir mes rendez-vous</Text>
        </Pressable>

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
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
    marginTop: 16,
  },
  emptyText: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    marginTop: 8,
  },
  scrollContent: {
    padding: 16,
  },
  profileCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
    marginBottom: 16,
  },
  avatarLarge: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  name: {
    fontSize: 22,
    fontWeight: '800',
    color: '#111827',
    textAlign: 'center',
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 8,
  },
  locationText: {
    fontSize: 14,
    color: '#6B7280',
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 16,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    marginBottom: 12,
  },
  infoLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6B7280',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  infoText: {
    flex: 1,
    fontSize: 15,
    color: '#374151',
    lineHeight: 22,
  },
  cta: {
    backgroundColor: '#2563EB',
    paddingVertical: 14,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    shadowColor: '#1D4ED8',
    shadowOpacity: 0.2,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
    marginBottom: 12,
  },
  ctaText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 15,
  },
  secondaryCta: {
    backgroundColor: '#EFF6FF',
    paddingVertical: 14,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: '#DBEAFE',
  },
  secondaryCtaText: {
    color: '#2563EB',
    fontWeight: '700',
    fontSize: 15,
  },
});
