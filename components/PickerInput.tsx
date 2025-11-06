import React, { useState } from 'react';
import { View, Text, Pressable, StyleSheet, Modal, ScrollView, TextInput } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface PickerInputProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: string[];
  placeholder?: string;
  error?: string;
  icon?: keyof typeof Ionicons.glyphMap;
  searchable?: boolean;
}

export function PickerInput({
  label,
  value,
  onChange,
  options,
  placeholder = 'Sélectionner',
  error,
  icon,
  searchable = true,
}: PickerInputProps) {
  const [modalVisible, setModalVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const filteredOptions = searchable
    ? options.filter((opt) => opt.toLowerCase().includes(searchQuery.toLowerCase()))
    : options;

  const displayValue = value || placeholder;

  const handleSelect = (option: string) => {
    onChange(option);
    setModalVisible(false);
    setSearchQuery('');
  };

  return (
    <View style={styles.container}>
      <Text style={styles.label}>{label}</Text>
      <Pressable
        onPress={() => setModalVisible(true)}
        style={[styles.inputContainer, error && styles.inputContainerError]}
      >
        {icon && (
          <View style={styles.iconContainer}>
            <Ionicons name={icon} size={20} color={error ? '#EF4444' : '#6B7280'} />
          </View>
        )}
        <Text
          style={[
            styles.inputText,
            !value && styles.placeholder,
            icon && { paddingLeft: 44 },
          ]}
        >
          {displayValue}
        </Text>
        <Ionicons name="chevron-down" size={20} color="#9CA3AF" />
      </Pressable>

      {error && (
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle" size={14} color="#EF4444" />
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

      {/* Picker Modal */}
      <Modal visible={modalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{label}</Text>
              <Pressable onPress={() => setModalVisible(false)}>
                <Ionicons name="close" size={24} color="#6B7280" />
              </Pressable>
            </View>

            {/* Search Input */}
            {searchable && (
              <View style={styles.searchContainer}>
                <Ionicons name="search" size={20} color="#6B7280" style={styles.searchIcon} />
                <TextInput
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                  placeholder="Rechercher..."
                  placeholderTextColor="#9CA3AF"
                  style={styles.searchInput}
                  autoFocus
                />
                {searchQuery.length > 0 && (
                  <Pressable onPress={() => setSearchQuery('')} style={styles.clearButton}>
                    <Ionicons name="close-circle" size={20} color="#9CA3AF" />
                  </Pressable>
                )}
              </View>
            )}

            {/* Options List */}
            <ScrollView style={styles.optionsList}>
              {filteredOptions.length === 0 ? (
                <View style={styles.emptyState}>
                  <Text style={styles.emptyText}>Aucun résultat</Text>
                </View>
              ) : (
                filteredOptions.map((option, index) => (
                  <Pressable
                    key={index}
                    onPress={() => handleSelect(option)}
                    style={[
                      styles.optionItem,
                      value === option && styles.optionItemSelected,
                    ]}
                  >
                    <Text
                      style={[
                        styles.optionText,
                        value === option && styles.optionTextSelected,
                      ]}
                    >
                      {option}
                    </Text>
                    {value === option && (
                      <Ionicons name="checkmark" size={20} color="#2563EB" />
                    )}
                  </Pressable>
                ))
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { marginBottom: 20 },
  label: { fontSize: 15, fontWeight: '600', color: '#374151', marginBottom: 8 },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderWidth: 2,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    backgroundColor: '#F9FAFB',
    minHeight: 56,
  },
  inputContainerError: { borderColor: '#EF4444', backgroundColor: '#FEF2F2' },
  iconContainer: {
    position: 'absolute',
    left: 14,
    zIndex: 1,
  },
  inputText: { flex: 1, fontSize: 16, color: '#111827' },
  placeholder: { color: '#9CA3AF' },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 6,
    paddingHorizontal: 4,
  },
  errorText: { fontSize: 13, color: '#EF4444', fontWeight: '500' },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  modalTitle: { fontSize: 20, fontWeight: '700', color: '#111827' },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  searchIcon: { marginRight: 8 },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#111827',
    paddingVertical: 8,
  },
  clearButton: { padding: 4 },
  optionsList: { maxHeight: 400 },
  optionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
    minHeight: 56,
  },
  optionItemSelected: { backgroundColor: '#EFF6FF' },
  optionText: { fontSize: 16, color: '#374151', fontWeight: '500' },
  optionTextSelected: { color: '#2563EB', fontWeight: '700' },
  emptyState: { padding: 32, alignItems: 'center' },
  emptyText: { fontSize: 14, color: '#9CA3AF' },
});
