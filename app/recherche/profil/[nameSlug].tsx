import React, { useEffect, useState } from 'react';
import { View, Text, ActivityIndicator, StyleSheet, Pressable, ScrollView } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { apiClient } from '../../../lib/apiClient';

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

  if (loading) return <View style={styles.center}><ActivityIndicator /></View>;
  if (error) return <View style={styles.center}><Text>{error}</Text></View>;
  if (!entity) return <View style={styles.center}><Text>Aucun résultat</Text></View>;

  const name = entity.name || entity.nom_clinique || entity.nom_pharmacie || entity.nom_parapharmacie || entity.nom_labo || entity.nom_centre || 'Profil';
  const ville = entity.ville || entity.profile_data?.ville || '';

  return (
    <ScrollView contentContainerStyle={styles.wrap}>
      <Text style={styles.title}>{name}</Text>
      {!!ville && <Text style={styles.sub}>{ville}</Text>}
      {entity.specialty && <Text style={styles.line}>Spécialité: {Array.isArray(entity.specialty) ? entity.specialty.join(', ') : String(entity.specialty)}</Text>}
      {entity.services && <Text style={styles.line}>Services: {Array.isArray(entity.services) ? entity.services.join(', ') : String(entity.services)}</Text>}

      <View style={{ height: 14 }} />
      <Pressable onPress={() => router.push('/patient/mes-rdv' as any)} style={styles.cta}>
        <Text style={styles.ctaText}>Voir mes rendez-vous</Text>
      </Pressable>
      {entity.id && (
        <Pressable onPress={() => router.push({ pathname: '/organization/[id]', params: { id: String(entity.id) } })} style={[styles.cta, { backgroundColor: '#10B981' }] }>
          <Text style={styles.ctaText}>Prendre rendez-vous</Text>
        </Pressable>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  wrap: { padding: 16 },
  title: { fontSize: 22, fontWeight: '800', color: '#111827' },
  sub: { color: '#6B7280', marginTop: 4 },
  line: { marginTop: 8, color: '#374151' },
  cta: { backgroundColor: '#2563EB', paddingVertical: 12, borderRadius: 10, alignItems: 'center', marginTop: 10 },
  ctaText: { color: '#fff', fontWeight: '700' },
});
