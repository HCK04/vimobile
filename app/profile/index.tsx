import React, { useEffect, useState } from 'react';
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { apiClient } from '../../lib/apiClient';

export default function ProfileScreen() {
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      try {
        const { data } = await apiClient.get('/user/profile');
        if (!cancelled) setUser(data);
      } catch (e) {
        if (!cancelled) setUser(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => { cancelled = true; };
  }, []);

  if (loading) return <View style={styles.center}><ActivityIndicator /></View>;
  if (!user) return <View style={styles.center}><Text>Profil introuvable</Text></View>;

  return (
    <View style={{ padding: 16 }}>
      <Text style={styles.title}>Mon Profil</Text>
      <Text style={styles.line}>Nom: {user.name || `${user.first_name || ''} ${user.last_name || ''}`}</Text>
      <Text style={styles.line}>Email: {user.email}</Text>
      {!!user.phone && <Text style={styles.line}>Téléphone: {user.phone}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 22, fontWeight: '800', marginBottom: 10 },
  line: { color: '#374151', marginTop: 6 },
});
