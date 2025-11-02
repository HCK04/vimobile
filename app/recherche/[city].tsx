import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, Pressable, StyleSheet, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { apiClient } from '../../lib/apiClient';

function createSlug(name: string) {
  return name
    .toLowerCase()
    .trim()
    .replace(/[àáâãäå]/g, 'a')
    .replace(/[èéêë]/g, 'e')
    .replace(/[ìíîï]/g, 'i')
    .replace(/[òóôõö]/g, 'o')
    .replace(/[ùúûü]/g, 'u')
    .replace(/[ç]/g, 'c')
    .replace(/[ñ]/g, 'n')
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

export default function CitySearchScreen() {
  const { city } = useLocalSearchParams<{ city?: string }>();
  const router = useRouter();
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const run = async () => {
      setLoading(true);
      try {
        const [usersRes, orgsRes] = await Promise.all([
          apiClient.get('/users'),
          apiClient.get('/organizations', { params: { include_unverified: true } }),
        ]);
        const users = Array.isArray(usersRes.data?.data) ? usersRes.data.data : (Array.isArray(usersRes.data) ? usersRes.data : []);
        const orgs = Array.isArray(orgsRes.data?.data) ? orgsRes.data.data : (Array.isArray(orgsRes.data) ? orgsRes.data : []);
        const cityQ = String(city || '').toLowerCase();
        const items: any[] = [];
        users.forEach((u: any) => {
          const roleName = u.role?.name || u.role || '';
          const roleId = u.role_id;
          const roleLower = String(roleName).toLowerCase();
          const isPatient = roleId === 1 || roleLower.includes('patient');
          const isAdmin = roleId === 3 || roleLower.includes('admin');
          if (isPatient || isAdmin) return;
          const name = u.name || `${u.first_name || ''} ${u.last_name || ''}`.trim();
          const ville = u.ville || u.profile_data?.ville || '';
          if (!cityQ || String(ville).toLowerCase().includes(cityQ)) {
            items.push({ id: u.id, name, ville, isOrganization: false, type: u.role?.name || 'medecin' });
          }
        });
        orgs.forEach((o: any) => {
          const name = o.name || o.nom || o.nom_clinique || o.nom_pharmacie || o.nom_parapharmacie || o.nom_labo || o.nom_centre;
          const ville = o.ville || '';
          if (!cityQ || String(ville).toLowerCase().includes(cityQ)) {
            items.push({ id: o.id, name, ville, isOrganization: true, type: o.type || 'organization' });
          }
        });
        setResults(items);
      } catch (e) {
        setResults([]);
      } finally {
        setLoading(false);
      }
    };
    run();
  }, [city]);

  const onOpen = (item: any) => {
    const slug = createSlug(item.name);
    router.push({ pathname: '/recherche/profil/[nameSlug]', params: { nameSlug: slug, id: String(item.id), type: String(item.type) } });
  };

  if (loading) return <View style={styles.center}><ActivityIndicator /></View>;

  return (
    <View style={styles.wrap}>
      <Text style={styles.title}>Résultats pour {String(city || '').toUpperCase()}</Text>
      <FlatList
        data={results}
        keyExtractor={(it) => `${it.isOrganization ? 'org' : 'pro'}-${it.id}`}
        renderItem={({ item }) => (
          <Pressable onPress={() => onOpen(item)} style={styles.item}>
            <Text style={styles.itemName}>{item.name}</Text>
            <Text style={styles.itemSub}>{item.ville} • {item.isOrganization ? 'Établissement' : 'Professionnel'}</Text>
          </Pressable>
        )}
        ItemSeparatorComponent={() => <View style={styles.sep} />}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  wrap: { padding: 16 },
  title: { fontSize: 18, fontWeight: '800', marginBottom: 10 },
  item: { paddingVertical: 12 },
  itemName: { fontWeight: '700', color: '#111827' },
  itemSub: { color: '#6B7280', marginTop: 2 },
  sep: { height: StyleSheet.hairlineWidth, backgroundColor: '#E5E7EB' },
});
