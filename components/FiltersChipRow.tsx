import React from 'react';
import { View, Text, ScrollView, Pressable, StyleSheet } from 'react-native';

type Chip = { label: string; value: string };

export default function FiltersChipRow({
  onSelect,
  chips = [
    { label: 'Médecin généraliste', value: 'medecin' },
    { label: 'Cardiologue', value: 'cardiologue' },
    { label: 'Kiné', value: 'kine' },
    { label: 'Pharmacie', value: 'pharmacie' },
    { label: 'Clinique', value: 'clinique' },
  ],
}: {
  onSelect: (chip: Chip) => void;
  chips?: Chip[];
}) {
  return (
    <View style={styles.wrap}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
        {chips.map((chip) => (
          <Pressable key={chip.value} style={styles.chip} onPress={() => onSelect(chip)}>
            <Text style={styles.chipText}>{chip.label}</Text>
          </Pressable>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginTop: 12 },
  row: { paddingHorizontal: 2, gap: 8 },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#EFF6FF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#DBEAFE',
  },
  chipText: { color: '#2563EB', fontWeight: '600', fontSize: 12 },
});
