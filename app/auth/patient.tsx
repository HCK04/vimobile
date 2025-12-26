/**
 * Patient Registration - Multi-Step Wizard
 * 3 Steps: Identity → Contact → Security
 */

import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Alert,
  Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import AsyncStorage from '@react-native-async-storage/async-storage';

import {
  AuthInput,
  AuthButton,
  StepIndicator,
  PasswordStrengthMeter,
  SocialLoginButtons,
  Divider,
  AUTH_COLORS,
  AUTH_SPACING,
} from '../../lib/auth-components';
import { validation, errorMessages } from '../../lib/validation';
import { api } from '../../lib/api';
import { getPostAuthRoute } from '../../lib/authHelpers';

const ONBOARDING_KEY = '@vi-sante:onboarding_completed';
const TOTAL_STEPS = 3;

interface FormData {
  // Step 1: Identity
  firstName: string;
  lastName: string;
  dateOfBirth: Date | null;

  // Step 2: Contact
  email: string;
  phone: string;

  // Step 3: Security
  password: string;
  passwordConfirm: string;
  acceptTerms: boolean;
}

interface FormErrors {
  firstName?: string;
  lastName?: string;
  dateOfBirth?: string;
  email?: string;
  phone?: string;
  password?: string;
  passwordConfirm?: string;
  acceptTerms?: string;
}

interface TouchedFields {
  [key: string]: boolean;
}

export default function PatientRegistrationScreen() {
  const router = useRouter();
  const scrollViewRef = useRef<ScrollView>(null);

  // Step management
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);

  // Form state
  const [formData, setFormData] = useState<FormData>({
    firstName: '',
    lastName: '',
    dateOfBirth: null,
    email: '',
    phone: '',
    password: '',
    passwordConfirm: '',
    acceptTerms: false,
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const [touched, setTouched] = useState<TouchedFields>({});

  // Date picker state
  const [showDatePicker, setShowDatePicker] = useState(false);

  // Animation
  const fadeAnim = useRef(new Animated.Value(1)).current;

  // Form field update handler
  const updateField = (field: keyof FormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setTouched(prev => ({ ...prev, [field]: true }));

    // Clear error when user starts typing
    if (errors[field as keyof FormErrors]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  // Validate current step
  const validateStep = (step: number): boolean => {
    const newErrors: FormErrors = {};

    switch (step) {
      case 1:
        if (!validation.name(formData.firstName)) {
          newErrors.firstName = errorMessages.name;
        }
        if (!validation.name(formData.lastName)) {
          newErrors.lastName = errorMessages.name;
        }
        if (!validation.dateOfBirth(formData.dateOfBirth)) {
          newErrors.dateOfBirth = errorMessages.dateOfBirth;
        }
        break;

      case 2:
        if (!validation.email(formData.email)) {
          newErrors.email = errorMessages.email;
        }
        if (!validation.phone(formData.phone)) {
          newErrors.phone = errorMessages.phone;
        }
        break;

      case 3:
        if (!validation.password.isValid(formData.password)) {
          newErrors.password = 'Le mot de passe ne respecte pas les critères';
        }
        if (formData.password !== formData.passwordConfirm) {
          newErrors.passwordConfirm = errorMessages.password.mismatch;
        }
        if (!formData.acceptTerms) {
          newErrors.acceptTerms = 'Vous devez accepter les conditions';
        }
        break;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Navigate between steps with animation
  const animateTransition = (callback: () => void) => {
    Animated.sequence([
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 150,
        useNativeDriver: true,
      }),
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 150,
        useNativeDriver: true,
      }),
    ]).start();

    setTimeout(callback, 150);
  };

  const goToNextStep = () => {
    if (validateStep(currentStep)) {
      if (currentStep < TOTAL_STEPS) {
        animateTransition(() => {
          setCurrentStep(prev => prev + 1);
          scrollViewRef.current?.scrollTo({ y: 0, animated: false });
        });
      } else {
        handleSubmit();
      }
    }
  };

  const goToPrevStep = () => {
    if (currentStep > 1) {
      animateTransition(() => {
        setCurrentStep(prev => prev - 1);
        scrollViewRef.current?.scrollTo({ y: 0, animated: false });
      });
    } else {
      router.back();
    }
  };

  // Handle final submission
  const handleSubmit = async () => {
    if (!validateStep(3)) return;

    try {
      setLoading(true);

      // Calculate age in years from date of birth
      let age: number | undefined;
      if (formData.dateOfBirth) {
        const today = new Date();
        const birthDate = formData.dateOfBirth;
        age = today.getFullYear() - birthDate.getFullYear();
        const monthDiff = today.getMonth() - birthDate.getMonth();
        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
          age--;
        }
      }

      // Combine firstName and lastName into name field
      const fullName = `${formData.firstName} ${formData.lastName}`.trim();

      const res = await api.registerPatient({
        name: fullName,
        email: formData.email,
        phone: formData.phone,
        password: formData.password,
        password_confirmation: formData.passwordConfirm,
        age: age, // Backend expects age as integer (years)
      });

      await AsyncStorage.setItem(ONBOARDING_KEY, 'true');

      // Auto-login: API already set the token via setAuth in registerPatient
      // Navigate to the correct route based on role
      const route = getPostAuthRoute(res?.user || {});

      Alert.alert(
        'Bienvenue !',
        'Votre compte a été créé avec succès.',
        [{ text: 'Continuer', onPress: () => router.replace(route as any) }]
      );
    } catch (error: any) {
      const message = error?.response?.data?.message || 'Une erreur est survenue';
      Alert.alert('Erreur', message);
    } finally {
      setLoading(false);
    }
  };

  // Handle date selection
  const handleDateChange = (event: any, selectedDate?: Date) => {
    setShowDatePicker(Platform.OS === 'ios');
    if (selectedDate) {
      updateField('dateOfBirth', selectedDate);
    }
  };

  // Format date for display
  const formatDate = (date: Date | null): string => {
    if (!date) return '';
    return date.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  // Render step content
  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <>
            <Text style={styles.stepTitle}>Vos informations</Text>
            <Text style={styles.stepDescription}>
              Nous avons besoin de quelques informations pour créer votre compte patient.
            </Text>

            <AuthInput
              label="Prénom *"
              value={formData.firstName}
              onChangeText={(v) => updateField('firstName', v)}
              error={errors.firstName}
              touched={touched.firstName}
              leftIcon="person-outline"
              placeholder="Jean"
              autoCapitalize="words"
              autoComplete="given-name"
              textContentType="givenName"
            />

            <AuthInput
              label="Nom *"
              value={formData.lastName}
              onChangeText={(v) => updateField('lastName', v)}
              error={errors.lastName}
              touched={touched.lastName}
              leftIcon="person-outline"
              placeholder="Dupont"
              autoCapitalize="words"
              autoComplete="family-name"
              textContentType="familyName"
            />

            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Date de naissance *</Text>
              <Pressable
                style={[
                  styles.datePickerButton,
                  errors.dateOfBirth && touched.dateOfBirth && styles.datePickerError,
                ]}
                onPress={() => setShowDatePicker(true)}
              >
                <Ionicons
                  name="calendar-outline"
                  size={20}
                  color={AUTH_COLORS.text.tertiary}
                />
                <Text
                  style={[
                    styles.datePickerText,
                    !formData.dateOfBirth && styles.datePickerPlaceholder,
                  ]}
                >
                  {formData.dateOfBirth ? formatDate(formData.dateOfBirth) : 'JJ/MM/AAAA'}
                </Text>
              </Pressable>
              {errors.dateOfBirth && touched.dateOfBirth && (
                <Text style={styles.errorText}>{errors.dateOfBirth}</Text>
              )}
            </View>

            {showDatePicker && (
              <DateTimePicker
                value={formData.dateOfBirth || new Date(2000, 0, 1)}
                mode="date"
                display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                onChange={handleDateChange}
                maximumDate={new Date()}
                minimumDate={new Date(1900, 0, 1)}
              />
            )}
          </>
        );

      case 2:
        return (
          <>
            <Text style={styles.stepTitle}>Vos coordonnées</Text>
            <Text style={styles.stepDescription}>
              Ces informations nous permettront de vous contacter et de sécuriser votre compte.
            </Text>

            <AuthInput
              label="Email *"
              value={formData.email}
              onChangeText={(v) => updateField('email', v)}
              error={errors.email}
              touched={touched.email}
              leftIcon="mail-outline"
              placeholder="vous@exemple.com"
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="email"
              textContentType="emailAddress"
            />

            <AuthInput
              label="Téléphone *"
              value={formData.phone}
              onChangeText={(v) => updateField('phone', v)}
              error={errors.phone}
              touched={touched.phone}
              leftIcon="call-outline"
              placeholder="0612345678"
              keyboardType="phone-pad"
              autoComplete="tel"
              textContentType="telephoneNumber"
            />
          </>
        );

      case 3:
        return (
          <>
            <Text style={styles.stepTitle}>Sécurisez votre compte</Text>
            <Text style={styles.stepDescription}>
              Choisissez un mot de passe fort pour protéger votre compte.
            </Text>

            <AuthInput
              label="Mot de passe *"
              value={formData.password}
              onChangeText={(v) => updateField('password', v)}
              error={errors.password}
              touched={touched.password}
              leftIcon="lock-closed-outline"
              placeholder="••••••••"
              isPassword
              autoComplete="password-new"
              textContentType="newPassword"
            />

            <PasswordStrengthMeter password={formData.password} />

            <AuthInput
              label="Confirmer le mot de passe *"
              value={formData.passwordConfirm}
              onChangeText={(v) => updateField('passwordConfirm', v)}
              error={errors.passwordConfirm}
              touched={touched.passwordConfirm}
              leftIcon="lock-closed-outline"
              placeholder="••••••••"
              isPassword
              autoComplete="password-new"
              textContentType="newPassword"
              containerStyle={{ marginTop: AUTH_SPACING.lg }}
            />

            {/* Terms Checkbox */}
            <Pressable
              style={styles.termsContainer}
              onPress={() => updateField('acceptTerms', !formData.acceptTerms)}
            >
              <View
                style={[
                  styles.checkbox,
                  formData.acceptTerms && styles.checkboxChecked,
                ]}
              >
                {formData.acceptTerms && (
                  <Ionicons name="checkmark" size={14} color="#FFF" />
                )}
              </View>
              <Text style={styles.termsText}>
                J'accepte les{' '}
                <Text style={styles.termsLink}>conditions d'utilisation</Text>
                {' '}et la{' '}
                <Text style={styles.termsLink}>politique de confidentialité</Text>
              </Text>
            </Pressable>
            {errors.acceptTerms && (
              <Text style={styles.errorText}>{errors.acceptTerms}</Text>
            )}
          </>
        );

      default:
        return null;
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
        style={{ flex: 1 }}
      >
        {/* Header */}
        <View style={styles.header}>
          <Pressable onPress={goToPrevStep} style={styles.backButton}>
            <Ionicons name="chevron-back" size={24} color={AUTH_COLORS.text.primary} />
          </Pressable>
          <StepIndicator currentStep={currentStep} totalSteps={TOTAL_STEPS} />
          <View style={{ width: 40 }} />
        </View>

        <ScrollView
          ref={scrollViewRef}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <Animated.View style={{ opacity: fadeAnim }}>
            {/* Social Login on first step */}
            {currentStep === 1 && (
              <>
                <SocialLoginButtons
                  onApplePress={() => Alert.alert('Apple Sign In', 'Coming soon')}
                  onGooglePress={() => Alert.alert('Google Sign In', 'Coming soon')}
                />
                <Divider text="ou inscrivez-vous avec" />
              </>
            )}

            {renderStepContent()}

            {/* Bottom Actions - Inside ScrollView */}
            <View style={styles.bottomActionsInner}>
              <AuthButton
                title={currentStep === TOTAL_STEPS ? 'Créer mon compte' : 'Continuer'}
                onPress={goToNextStep}
                loading={loading}
              />

              {currentStep === 1 && (
                <Pressable
                  style={styles.loginLink}
                  onPress={() => router.replace('/auth/login')}
                >
                  <Text style={styles.loginLinkText}>
                    Déjà un compte ? <Text style={styles.loginLinkBold}>Se connecter</Text>
                  </Text>
                </Pressable>
              )}
            </View>
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: AUTH_COLORS.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: AUTH_SPACING.md,
    paddingVertical: AUTH_SPACING.sm,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: AUTH_COLORS.backgroundSecondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: AUTH_SPACING.lg,
    paddingTop: AUTH_SPACING.md,
  },
  stepTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: AUTH_COLORS.text.primary,
    marginBottom: AUTH_SPACING.sm,
  },
  stepDescription: {
    fontSize: 15,
    color: AUTH_COLORS.text.secondary,
    lineHeight: 22,
    marginBottom: AUTH_SPACING.xl,
  },
  inputContainer: {
    marginBottom: AUTH_SPACING.md,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: AUTH_COLORS.text.primary,
    marginBottom: AUTH_SPACING.sm,
  },
  datePickerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: AUTH_COLORS.backgroundSecondary,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: AUTH_COLORS.border,
    paddingHorizontal: AUTH_SPACING.md,
    height: 56,
    gap: AUTH_SPACING.sm,
  },
  datePickerError: {
    borderColor: AUTH_COLORS.error,
    backgroundColor: AUTH_COLORS.errorSurface,
  },
  datePickerText: {
    fontSize: 16,
    color: AUTH_COLORS.text.primary,
  },
  datePickerPlaceholder: {
    color: AUTH_COLORS.text.placeholder,
  },
  errorText: {
    fontSize: 12,
    color: AUTH_COLORS.error,
    marginTop: AUTH_SPACING.xs,
    marginLeft: AUTH_SPACING.xs,
  },
  termsContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginTop: AUTH_SPACING.xl,
    gap: AUTH_SPACING.sm,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: AUTH_COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  checkboxChecked: {
    backgroundColor: AUTH_COLORS.primary,
    borderColor: AUTH_COLORS.primary,
  },
  termsText: {
    flex: 1,
    fontSize: 14,
    color: AUTH_COLORS.text.secondary,
    lineHeight: 20,
  },
  termsLink: {
    color: AUTH_COLORS.primary,
    fontWeight: '600',
  },
  bottomActionsInner: {
    marginTop: AUTH_SPACING.xl,
    paddingTop: AUTH_SPACING.xl,
    paddingBottom: AUTH_SPACING.xl,
  },
  loginLink: {
    marginTop: AUTH_SPACING.md,
    alignItems: 'center',
  },
  loginLinkText: {
    fontSize: 14,
    color: AUTH_COLORS.text.secondary,
  },
  loginLinkBold: {
    fontWeight: '700',
    color: AUTH_COLORS.primary,
  },
});
