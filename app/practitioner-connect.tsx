import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { router } from 'expo-router';

export default function PractitionerConnectScreen() {
  return (
    <View style={{ padding: 16 }}>
      <Text style={styles.title}>Espace Professionnel</Text>
      <Text style={styles.text}>Connectez-vous ou créez un compte pour gérer votre profil et vos rendez-vous.</Text>
      <Pressable onPress={() => router.push('/auth/professional' as any)} style={styles.cta}><Text style={styles.ctaText}>Se connecter</Text></Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  title: { fontSize: 22, fontWeight: '800', marginBottom: 8 },
  text: { color: '#6B7280', marginBottom: 12 },
  cta: { backgroundColor: '#2563EB', paddingVertical: 12, borderRadius: 10, alignItems: 'center' },
  ctaText: { color: '#fff', fontWeight: '700' },
});
