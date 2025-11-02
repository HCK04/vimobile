import React from 'react';
import { SafeAreaView, View, Text, StyleSheet, Pressable, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function ProfilScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Mon profil</Text>
      </View>
      <ScrollView contentContainerStyle={{ padding: 16, gap: 12 }}>
        <View style={styles.card}>
          <View style={styles.avatar}><Text style={styles.avatarText}>ME</Text></View>
          <View style={{ flex: 1 }}>
            <Text style={styles.name}>Utilisateur Vi-santé</Text>
            <Text style={styles.sub}>Email non renseigné</Text>
          </View>
          <Pressable style={styles.editBtn}>
            <Ionicons name="create" size={16} color="#2563EB" />
            <Text style={styles.editText}>Modifier</Text>
          </Pressable>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Paramètres</Text>
          <View style={styles.row}>
            <Ionicons name="notifications" size={20} color="#2563EB" />
            <Text style={styles.rowText}>Notifications</Text>
            <Ionicons name="chevron-forward" size={20} color="#9CA3AF" style={{ marginLeft: 'auto' }} />
          </View>
          <View style={styles.row}>
            <Ionicons name="shield-checkmark" size={20} color="#2563EB" />
            <Text style={styles.rowText}>Confidentialité</Text>
            <Ionicons name="chevron-forward" size={20} color="#9CA3AF" style={{ marginLeft: 'auto' }} />
          </View>
          <View style={styles.row}>
            <Ionicons name="help-circle" size={20} color="#2563EB" />
            <Text style={styles.rowText}>Aide</Text>
            <Ionicons name="chevron-forward" size={20} color="#9CA3AF" style={{ marginLeft: 'auto' }} />
          </View>
        </View>

        <Pressable style={styles.logout}>
          <Ionicons name="log-out" size={18} color="#EF4444" />
          <Text style={styles.logoutText}>Se déconnecter</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#E5E7EB',
  },
  headerTitle: { fontSize: 20, fontWeight: '800', color: '#111827' },
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
  avatar: { width: 48, height: 48, borderRadius: 24, backgroundColor: '#60A5FA', alignItems: 'center', justifyContent: 'center' },
  avatarText: { color: '#fff', fontWeight: '800' },
  name: { fontWeight: '800', color: '#111827' },
  sub: { color: '#6B7280', fontSize: 12 },
  editBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 10, backgroundColor: '#EFF6FF' },
  editText: { color: '#2563EB', fontWeight: '700' },
  section: { backgroundColor: '#fff', borderRadius: 12, borderWidth: 1, borderColor: '#E5E7EB', padding: 8 },
  sectionTitle: { fontWeight: '800', color: '#111827', padding: 8 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 12, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: '#F3F4F6' },
  rowText: { color: '#111827', fontWeight: '600' },
  logout: { flexDirection: 'row', alignItems: 'center', gap: 8, justifyContent: 'center', marginTop: 16, padding: 12, borderRadius: 10, backgroundColor: '#FEE2E2', borderWidth: 1, borderColor: '#FCA5A5' },
  logoutText: { color: '#EF4444', fontWeight: '800' },
});