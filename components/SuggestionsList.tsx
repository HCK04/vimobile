import React from 'react';
import { View, Text, ScrollView, Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { FontAwesome5 } from '@expo/vector-icons';

export type SuggestionItem = {
  id: string | number;
  name: string;
  specialty?: string;
  location?: string;
};

export function SuggestionsList({
  items,
  onSelect,
  maxHeight = 240,
}: {
  items: SuggestionItem[];
  onSelect: (item: SuggestionItem) => void;
  maxHeight?: number;
}) {
  if (!items?.length) return null;
  return (
    <View style={styles.container}>
      <ScrollView keyboardShouldPersistTaps="handled" style={{ maxHeight }}>
        {items.map((item, idx) => (
          <View key={String(item.id) + '-' + idx}>
            <Pressable onPress={() => onSelect(item)} style={styles.row}>
              <View style={styles.iconWrap}>
                <FontAwesome5 name="user-md" size={16} color="#2563EB" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.title} numberOfLines={1}>{item.name}</Text>
                {!!item.specialty && (
                  <Text style={styles.sub} numberOfLines={1}>{item.specialty}</Text>
                )}
                {!!item.location && (
                  <View style={styles.locRow}>
                    <Ionicons name="location" size={12} color="#9CA3AF" />
                    <Text style={styles.loc} numberOfLines={1}>{item.location}</Text>
                  </View>
                )}
              </View>
            </Pressable>
            {idx < items.length - 1 && <View style={styles.divider} />}
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 6,
    position: 'absolute',
    top: 56,
    left: 0,
    right: 0,
    zIndex: 50,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 5,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 10,
    paddingHorizontal: 6,
  },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: { color: '#111827', fontWeight: '600', fontSize: 14 },
  sub: { color: '#6B7280', fontSize: 12, marginTop: 2 },
  locRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 },
  loc: { color: '#9CA3AF', fontSize: 11 },
  divider: { height: StyleSheet.hairlineWidth, backgroundColor: '#E5E7EB' },
});
