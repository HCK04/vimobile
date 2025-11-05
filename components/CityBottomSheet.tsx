import React, { useMemo, useState } from 'react';
import { Modal, View, Text, TextInput, Pressable, StyleSheet, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function CityBottomSheet({
  visible,
  cities,
  selectedCity,
  onSelect,
  onClose,
}: {
  visible: boolean;
  cities: string[];
  selectedCity?: string | null;
  onSelect: (city: string) => void;
  onClose: () => void;
}) {
  const [q, setQ] = useState('');

  const filtered = useMemo(() => {
    const base = ['Toutes les villes', ...cities];
    const qq = q.trim().toLowerCase();
    if (!qq) return base;
    return base.filter((c) => c.toLowerCase().includes(qq));
  }, [q, cities]);

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose} />
      <View style={styles.sheet}>
        <View style={styles.handle} />
        <Text style={styles.title}>Choisir une ville</Text>
        <View style={styles.inputWrap}>
          <Ionicons name="search" size={18} color="#6B7280" style={styles.inputIcon} />
          <TextInput
            value={q}
            onChangeText={setQ}
            placeholder="Rechercher une ville"
            placeholderTextColor="#9CA3AF"
            style={styles.input}
          />
        </View>
        <ScrollView keyboardShouldPersistTaps="handled" style={{ maxHeight: 320 }}>
          {filtered.map((city, idx) => (
            <Pressable
              key={`${city}-${idx}`}
              onPress={() => {
                onSelect(city);
                onClose();
              }}
              style={[styles.row, selectedCity === city && styles.rowActive]}
            >
              <Text style={styles.rowText}>{city}</Text>
              {selectedCity === city && <Ionicons name="checkmark" size={18} color="#2563EB" />}
            </Pressable>
          ))}
        </ScrollView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.25)',
  },
  sheet: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: -4 },
    elevation: 8,
  },
  handle: {
    width: 36,
    height: 4,
    backgroundColor: '#E5E7EB',
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 12,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 12,
  },
  inputWrap: { position: 'relative', marginBottom: 12 },
  inputIcon: { position: 'absolute', left: 12, top: 12, zIndex: 1 },
  input: {
    paddingLeft: 36,
    paddingRight: 12,
    paddingVertical: 10,
    borderRadius: 10,
    fontSize: 14,
    color: '#111827',
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  row: {
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#E5E7EB',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  rowActive: {
    backgroundColor: '#F3F4F6',
  },
  rowText: { fontSize: 14, color: '#111827' },
});
