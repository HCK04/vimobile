import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { router } from 'expo-router';

export default function PatientHomeScreen() {
  return (
    <View style={{ padding: 16 }}>
      <Text style={styles.title}>Espace Patient</Text>
      <Pressable onPress={() => router.push('/rendezvous' as any)} style={styles.cta}>
        <Text style={styles.ctaText}>Mes rendez-vous</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  title: { fontSize: 22, fontWeight: '800', marginBottom: 12 },
  cta: { backgroundColor: '#2563EB', paddingVertical: 12, borderRadius: 10, alignItems: 'center', marginTop: 8 },
  ctaText: { color: '#fff', fontWeight: '700' },
});
