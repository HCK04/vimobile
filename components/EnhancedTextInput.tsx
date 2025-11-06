import React from 'react';
import { View, Text, TextInput, StyleSheet, TextInputProps } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface EnhancedTextInputProps extends TextInputProps {
  label: string;
  error?: string;
  success?: boolean;
  helperText?: string;
  maxLength?: number;
  showCharCount?: boolean;
  icon?: keyof typeof Ionicons.glyphMap;
}

export function EnhancedTextInput({
  label,
  error,
  success,
  helperText,
  maxLength,
  showCharCount = false,
  icon,
  value,
  style,
  ...props
}: EnhancedTextInputProps) {
  const charCount = value?.length || 0;
  const hasError = !!error;
  const hasSuccess = success && !hasError;

  return (
    <View style={styles.container}>
      {/* Label */}
      <Text style={styles.label}>{label}</Text>

      {/* Input Container */}
      <View
        style={[
          styles.inputContainer,
          hasError && styles.inputContainerError,
          hasSuccess && styles.inputContainerSuccess,
        ]}
      >
        {icon && (
          <View style={styles.iconContainer}>
            <Ionicons
              name={icon}
              size={20}
              color={hasError ? '#EF4444' : hasSuccess ? '#10B981' : '#6B7280'}
            />
          </View>
        )}
        <TextInput
          value={value}
          maxLength={maxLength}
          placeholderTextColor="#9CA3AF"
          style={[styles.input, icon && { paddingLeft: 44 }, style]}
          {...props}
        />
      </View>

      {/* Helper Text / Error / Character Count */}
      <View style={styles.footer}>
        {hasError && (
          <View style={styles.errorContainer}>
            <Ionicons name="alert-circle" size={14} color="#EF4444" />
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}
        {!hasError && helperText && <Text style={styles.helperText}>{helperText}</Text>}
        {showCharCount && maxLength && (
          <Text style={[styles.charCount, charCount >= maxLength && styles.charCountMax]}>
            {charCount}/{maxLength}
          </Text>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 20,
  },
  label: {
    fontSize: 15,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  inputContainer: {
    position: 'relative',
    borderWidth: 2,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    backgroundColor: '#F9FAFB',
  },
  inputContainerError: {
    borderColor: '#EF4444',
    backgroundColor: '#FEF2F2',
  },
  inputContainerSuccess: {
    borderColor: '#10B981',
    backgroundColor: '#F0FDF4',
  },
  iconContainer: {
    position: 'absolute',
    left: 14,
    top: 16,
    zIndex: 1,
  },
  input: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    fontSize: 16,
    color: '#111827',
    minHeight: 56,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 6,
    paddingHorizontal: 4,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flex: 1,
  },
  errorText: {
    fontSize: 13,
    color: '#EF4444',
    fontWeight: '500',
  },
  helperText: {
    fontSize: 13,
    color: '#6B7280',
    flex: 1,
  },
  charCount: {
    fontSize: 12,
    color: '#9CA3AF',
    fontWeight: '500',
  },
  charCountMax: {
    color: '#EF4444',
  },
});
