import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, TextInput, FlatList, Pressable, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { apiClient } from '../../lib/apiClient';

function createSlug(name: string) {
  if (!name) return '';
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

export default function SearchScreen() {
  const router = useRouter();
  const [q, setQ] = useState('');
  const [city, setCity] = useState('');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<any[]>([]);

  const onSearch = async () => {
    setLoading(true);
    try {
      const [usersRes, orgsRes] = await Promise.all([
        apiClient.get('/users'),
        apiClient.get('/organizations', { params: { include_unverified: true } }),
      ]);
      const users = Array.isArray(usersRes.data?.data) ? usersRes.data.data : (Array.isArray(usersRes.data) ? usersRes.data : []);
      const orgs = Array.isArray(orgsRes.data?.data) ? orgsRes.data.data : (Array.isArray(orgsRes.data) ? orgsRes.data : []);
      let items: any[] = [];
      const query = q.trim().toLowerCase();
      const cityQ = city.trim().toLowerCase();

      const filterBy = (name: string, ville: string) => {
        const okName = !query || (name || '').toLowerCase().includes(query);
        const okCity = !cityQ || (ville || '').toLowerCase().includes(cityQ);
        return okName && okCity;
      };

      users.forEach((u: any) => {
        const roleName = u.role?.name || u.role || '';
        const roleId = u.role_id;
        const roleLower = String(roleName).toLowerCase();
        const isPatient = roleId === 1 || roleLower.includes('patient');
        const isAdmin = roleId === 3 || roleLower.includes('admin');
        if (isPatient || isAdmin) return;
        const name = u.name || `${u.first_name || ''} ${u.last_name || ''}`.trim();
        if (!filterBy(name, u.ville || u.profile_data?.ville || '')) return;
        items.push({
          id: u.id,
          name,
          type: u.role?.name || u.type || 'medecin',
          ville: u.ville || u.profile_data?.ville || '',
          isOrganization: false,
        });
      });

      orgs.forEach((o: any) => {
        const name = o.name || o.nom || o.nom_clinique || o.nom_pharmacie || o.nom_parapharmacie || o.nom_labo || o.nom_centre;
        if (!filterBy(name, o.ville || '')) return;
        items.push({
          id: o.id,
          name,
          type: o.type || 'organization',
          ville: o.ville || '',
          isOrganization: true,
        });
      });

      setResults(items);
    } catch (e) {
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  const onOpen = (item: any) => {
    const slug = createSlug(item.name);
    router.push({ pathname: '/recherche/profil/[nameSlug]', params: { nameSlug: slug, id: String(item.id), type: String(item.type) } });
  };

  return (
    <View style={styles.wrap}>
      <Text style={styles.title}>Recherche</Text>
      <TextInput value={q} onChangeText={setQ} placeholder="Nom, spécialité..." style={styles.input} />
      <TextInput value={city} onChangeText={setCity} placeholder="Ville" style={styles.input} />
      <Pressable onPress={onSearch} style={styles.cta}><Text style={styles.ctaText}>{loading ? 'Recherche...' : 'Rechercher'}</Text></Pressable>
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
  wrap: { padding: 16 },
  title: { fontSize: 20, fontWeight: '700', marginBottom: 12 },
  input: { backgroundColor: '#F8FAFC', paddingHorizontal: 12, paddingVertical: 12, borderRadius: 10, marginBottom: 10 },
  cta: { backgroundColor: '#2563EB', paddingVertical: 12, borderRadius: 10, alignItems: 'center', marginBottom: 14 },
  ctaText: { color: '#fff', fontWeight: '700' },
  item: { paddingVertical: 12 },
  itemName: { fontWeight: '700', color: '#111827' },
  itemSub: { color: '#6B7280', marginTop: 2 },
  sep: { height: StyleSheet.hairlineWidth, backgroundColor: '#E5E7EB' },
});
