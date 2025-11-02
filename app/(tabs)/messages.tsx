import React from 'react';
import { SafeAreaView, View, Text, StyleSheet, FlatList, TextInput, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function MessagesScreen() {
  const messages = [
    { id: '1', name: 'Dr. Sara Benali', last: 'Bonjour, vos résultats sont prêts.', time: '09:12' },
    { id: '2', name: 'Clinique Al Amal', last: 'Merci pour votre visite.', time: 'Hier' },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Messages</Text>
        <Ionicons name="ellipsis-horizontal" size={22} color="#6B7280" />
      </View>

      <View style={styles.searchWrap}>
        <Ionicons name="search" size={18} color="#9CA3AF" style={{ marginHorizontal: 8 }} />
        <TextInput placeholder="Rechercher" placeholderTextColor="#9CA3AF" style={styles.search} />
      </View>

      <FlatList
        data={messages}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ paddingHorizontal: 16, paddingVertical: 8, gap: 10 }}
        renderItem={({ item }) => (
          <Pressable style={styles.row}>
            <View style={styles.avatar}><Text style={styles.avatarText}>{item.name.split(' ').map(s => s[0]).slice(0,2).join('')}</Text></View>
            <View style={{ flex: 1 }}>
              <Text style={styles.rowTitle}>{item.name}</Text>
              <Text style={styles.rowSub} numberOfLines={1}>{item.last}</Text>
            </View>
            <Text style={styles.time}>{item.time}</Text>
          </Pressable>
        )}
      />
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
  searchWrap: {
    margin: 16,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  search: { flex: 1, paddingVertical: 10, color: '#111827' },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  avatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#60A5FA', alignItems: 'center', justifyContent: 'center' },
  avatarText: { color: '#fff', fontWeight: '800' },
  rowTitle: { fontWeight: '700', color: '#111827' },
  rowSub: { color: '#6B7280', fontSize: 12 },
  time: { color: '#9CA3AF', fontSize: 12 },
});