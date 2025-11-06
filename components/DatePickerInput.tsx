import React, { useState } from 'react';
import { View, Text, Pressable, StyleSheet, Modal, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface DatePickerInputProps {
  label: string;
  value: string; // YYYY-MM-DD format
  onChange: (date: string) => void;
  error?: string;
  minDate?: Date;
  maxDate?: Date;
}

export function DatePickerInput({ label, value, onChange, error, minDate, maxDate }: DatePickerInputProps) {
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedDay, setSelectedDay] = useState<number>(1);
  const [selectedMonth, setSelectedMonth] = useState<number>(1);
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());

  const months = [
    'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
    'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
  ];

  // Parse current value
  React.useEffect(() => {
    if (value) {
      const parts = value.split('-');
      if (parts.length === 3) {
        setSelectedYear(parseInt(parts[0], 10));
        setSelectedMonth(parseInt(parts[1], 10));
        setSelectedDay(parseInt(parts[2], 10));
      }
    }
  }, [value]);

  const displayValue = value
    ? new Date(value).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })
    : 'Sélectionner une date';

  const handleConfirm = () => {
    const month = String(selectedMonth).padStart(2, '0');
    const day = String(selectedDay).padStart(2, '0');
    onChange(`${selectedYear}-${month}-${day}`);
    setModalVisible(false);
  };

  const days = Array.from({ length: 31 }, (_, i) => i + 1);
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 100 }, (_, i) => currentYear - i);

  return (
    <View style={styles.container}>
      <Text style={styles.label}>{label}</Text>
      <Pressable
        onPress={() => setModalVisible(true)}
        style={[styles.inputContainer, error && styles.inputContainerError]}
      >
        <Ionicons name="calendar" size={20} color={error ? '#EF4444' : '#6B7280'} />
        <Text style={[styles.inputText, !value && styles.placeholder]}>{displayValue}</Text>
        <Ionicons name="chevron-down" size={20} color="#9CA3AF" />
      </Pressable>

      {error && (
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle" size={14} color="#EF4444" />
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

      {/* Date Picker Modal */}
      <Modal visible={modalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Sélectionner la date</Text>
              <Pressable onPress={() => setModalVisible(false)}>
                <Ionicons name="close" size={24} color="#6B7280" />
              </Pressable>
            </View>

            <View style={styles.pickersContainer}>
              {/* Day Picker */}
              <View style={styles.pickerColumn}>
                <Text style={styles.pickerLabel}>Jour</Text>
                <ScrollView style={styles.picker} showsVerticalScrollIndicator={false}>
                  {days.map((day) => (
                    <Pressable
                      key={day}
                      onPress={() => setSelectedDay(day)}
                      style={[styles.pickerItem, selectedDay === day && styles.pickerItemSelected]}
                    >
                      <Text style={[styles.pickerItemText, selectedDay === day && styles.pickerItemTextSelected]}>
                        {day}
                      </Text>
                    </Pressable>
                  ))}
                </ScrollView>
              </View>

              {/* Month Picker */}
              <View style={styles.pickerColumn}>
                <Text style={styles.pickerLabel}>Mois</Text>
                <ScrollView style={styles.picker} showsVerticalScrollIndicator={false}>
                  {months.map((month, idx) => (
                    <Pressable
                      key={month}
                      onPress={() => setSelectedMonth(idx + 1)}
                      style={[styles.pickerItem, selectedMonth === idx + 1 && styles.pickerItemSelected]}
                    >
                      <Text style={[styles.pickerItemText, selectedMonth === idx + 1 && styles.pickerItemTextSelected]}>
                        {month}
                      </Text>
                    </Pressable>
                  ))}
                </ScrollView>
              </View>

              {/* Year Picker */}
              <View style={styles.pickerColumn}>
                <Text style={styles.pickerLabel}>Année</Text>
                <ScrollView style={styles.picker} showsVerticalScrollIndicator={false}>
                  {years.map((year) => (
                    <Pressable
                      key={year}
                      onPress={() => setSelectedYear(year)}
                      style={[styles.pickerItem, selectedYear === year && styles.pickerItemSelected]}
                    >
                      <Text style={[styles.pickerItemText, selectedYear === year && styles.pickerItemTextSelected]}>
                        {year}
                      </Text>
                    </Pressable>
                  ))}
                </ScrollView>
              </View>
            </View>

            <Pressable style={styles.confirmButton} onPress={handleConfirm}>
              <Text style={styles.confirmButtonText}>Confirmer</Text>
            </Pressable>
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
  inputText: { flex: 1, fontSize: 16, color: '#111827' },
  placeholder: { color: '#9CA3AF' },
  errorContainer: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 6, paddingHorizontal: 4 },
  errorText: { fontSize: 13, color: '#EF4444', fontWeight: '500' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.5)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: '#FFFFFF', borderTopLeftRadius: 24, borderTopRightRadius: 24, maxHeight: '80%' },
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
  pickersContainer: { flexDirection: 'row', padding: 20, gap: 12 },
  pickerColumn: { flex: 1 },
  pickerLabel: { fontSize: 14, fontWeight: '600', color: '#6B7280', marginBottom: 8, textAlign: 'center' },
  picker: { maxHeight: 240 },
  pickerItem: {
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 8,
    marginBottom: 4,
    alignItems: 'center',
  },
  pickerItemSelected: { backgroundColor: '#2563EB' },
  pickerItemText: { fontSize: 16, color: '#374151', fontWeight: '500' },
  pickerItemTextSelected: { color: '#FFFFFF', fontWeight: '700' },
  confirmButton: {
    backgroundColor: '#2563EB',
    paddingVertical: 16,
    marginHorizontal: 20,
    marginBottom: 20,
    borderRadius: 12,
    alignItems: 'center',
  },
  confirmButtonText: { color: '#FFFFFF', fontSize: 16, fontWeight: '700' },
});
