/**
 * Professional Registration - Multi-Step Wizard
 * 4 Steps: Identity → Professional Info → Contact → Security
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
  Modal,
  FlatList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
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
const TOTAL_STEPS = 4;

// Medical specialties list
const SPECIALTIES = [
  'Médecine générale',
  'Cardiologie',
  'Dermatologie',
  'Gynécologie',
  'Ophtalmologie',
  'Orthopédie',
  'Pédiatrie',
  'Psychiatrie',
  'Radiologie',
  'Chirurgie',
  'Endocrinologie',
  'Gastro-entérologie',
  'Neurologie',
  'ORL',
  'Pneumologie',
  'Rhumatologie',
  'Urologie',
  'Dentiste',
  'Kinésithérapeute',
  'Nutritionniste',
  'Ostéopathe',
  'Podologue',
  'Psychologue',
  'Sage-femme',
  'Autre',
];

interface FormData {
  // Step 1: Identity
  firstName: string;
  lastName: string;

  // Step 2: Professional
  specialty: string;
  inpe: string; // Optional
  cabinetName: string;

  // Step 3: Contact
  email: string;
  phone: string;

  // Step 4: Security
  password: string;
  passwordConfirm: string;
  acceptTerms: boolean;
}

interface FormErrors {
  firstName?: string;
  lastName?: string;
  specialty?: string;
  inpe?: string;
  cabinetName?: string;
  email?: string;
  phone?: string;
  password?: string;
  passwordConfirm?: string;
  acceptTerms?: string;
}

interface TouchedFields {
  [key: string]: boolean;
}

export default function ProfessionalRegistrationScreen() {
  const router = useRouter();
  const scrollViewRef = useRef<ScrollView>(null);

  // Step management
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);

  // Specialty picker modal
  const [showSpecialtyPicker, setShowSpecialtyPicker] = useState(false);
  const [specialtySearch, setSpecialtySearch] = useState('');

  // Form state
  const [formData, setFormData] = useState<FormData>({
    firstName: '',
    lastName: '',
    specialty: '',
    inpe: '',
    cabinetName: '',
    email: '',
    phone: '',
    password: '',
    passwordConfirm: '',
    acceptTerms: false,
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const [touched, setTouched] = useState<TouchedFields>({});

  // Animation
  const fadeAnim = useRef(new Animated.Value(1)).current;

  // Form field update handler
  const updateField = (field: keyof FormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setTouched(prev => ({ ...prev, [field]: true }));

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
        break;

      case 2:
        if (!formData.specialty) {
          newErrors.specialty = 'Veuillez sélectionner une spécialité';
        }
        if (formData.inpe && !validation.inpe(formData.inpe)) {
          newErrors.inpe = 'Numéro INPE invalide (11 chiffres)';
        }
        break;

      case 3:
        if (!validation.email(formData.email)) {
          newErrors.email = errorMessages.email;
        }
        if (!validation.phone(formData.phone)) {
          newErrors.phone = errorMessages.phone;
        }
        break;

      case 4:
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
    if (!validateStep(4)) return;

    try {
      setLoading(true);

      // Combine firstName and lastName into name field
      const fullName = `${formData.firstName} ${formData.lastName}`.trim();

      await api.registerProfessional({
        name: fullName,
        email: formData.email,
        phone: formData.phone,
        password: formData.password,
        password_confirmation: formData.passwordConfirm,
        role_id: 2, // Professional role
        specialty: [formData.specialty], // API expects array
        numero_carte_professionnelle: formData.inpe || undefined,
        adresse: formData.cabinetName || undefined,
      });

      await AsyncStorage.setItem(ONBOARDING_KEY, 'true');

      // Auto-login: API already set the token via setAuth in registerProfessional
      // Navigate to the correct route based on role
      const route = getPostAuthRoute(res?.user || {}, 'professionnel_sante');

      Alert.alert(
        'Bienvenue !',
        'Votre compte professionnel a été créé avec succès.',
        [{ text: 'Continuer', onPress: () => router.replace(route as any) }]
      );
    } catch (error: any) {
      const message = error?.response?.data?.message || 'Une erreur est survenue';
      Alert.alert('Erreur', message);
    } finally {
      setLoading(false);
    }
  };

  // Filter specialties based on search
  const filteredSpecialties = SPECIALTIES.filter(s =>
    s.toLowerCase().includes(specialtySearch.toLowerCase())
  );

  // Render step content
  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <>
            <Text style={styles.stepTitle}>Vos informations</Text>
            <Text style={styles.stepDescription}>
              Commençons par quelques informations de base pour créer votre compte professionnel.
            </Text>

            <AuthInput
              label="Prénom *"
              value={formData.firstName}
              onChangeText={(v) => updateField('firstName', v)}
              error={errors.firstName}
              touched={touched.firstName}
              leftIcon="person-outline"
              placeholder="Marie"
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
              placeholder="Curie"
              autoCapitalize="words"
              autoComplete="family-name"
              textContentType="familyName"
            />
          </>
        );

      case 2:
        return (
          <>
            <Text style={styles.stepTitle}>Votre pratique</Text>
            <Text style={styles.stepDescription}>
              Ces informations aideront les patients à vous trouver.
            </Text>

            {/* Specialty Picker */}
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Spécialité *</Text>
              <Pressable
                style={[
                  styles.pickerButton,
                  errors.specialty && touched.specialty && styles.pickerError,
                ]}
                onPress={() => setShowSpecialtyPicker(true)}
              >
                <Ionicons
                  name="medical-outline"
                  size={20}
                  color={AUTH_COLORS.text.tertiary}
                />
                <Text
                  style={[
                    styles.pickerText,
                    !formData.specialty && styles.pickerPlaceholder,
                  ]}
                >
                  {formData.specialty || 'Sélectionner une spécialité'}
                </Text>
                <Ionicons
                  name="chevron-down"
                  size={20}
                  color={AUTH_COLORS.text.tertiary}
                />
              </Pressable>
              {errors.specialty && touched.specialty && (
                <Text style={styles.errorText}>{errors.specialty}</Text>
              )}
            </View>

            <AuthInput
              label="Numéro INPE (optionnel)"
              value={formData.inpe}
              onChangeText={(v) => updateField('inpe', v)}
              error={errors.inpe}
              touched={touched.inpe}
              leftIcon="card-outline"
              placeholder="12345678901"
              keyboardType="number-pad"
            />

            <AuthInput
              label="Nom du cabinet (optionnel)"
              value={formData.cabinetName}
              onChangeText={(v) => updateField('cabinetName', v)}
              leftIcon="business-outline"
              placeholder="Cabinet Médical Centre"
              autoCapitalize="words"
            />
          </>
        );

      case 3:
        return (
          <>
            <Text style={styles.stepTitle}>Vos coordonnées</Text>
            <Text style={styles.stepDescription}>
              Ces informations permettront aux patients de vous contacter.
            </Text>

            <AuthInput
              label="Email professionnel *"
              value={formData.email}
              onChangeText={(v) => updateField('email', v)}
              error={errors.email}
              touched={touched.email}
              leftIcon="mail-outline"
              placeholder="dr.curie@cabinet.com"
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
              placeholder="0522123456"
              keyboardType="phone-pad"
              autoComplete="tel"
              textContentType="telephoneNumber"
            />
          </>
        );

      case 4:
        return (
          <>
            <Text style={styles.stepTitle}>Sécurisez votre compte</Text>
            <Text style={styles.stepDescription}>
              Choisissez un mot de passe fort pour protéger votre compte et les données de vos patients.
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
                {' '}pour les professionnels de santé
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
                <View style={styles.proBadge}>
                  <Ionicons name="shield-checkmark" size={16} color={AUTH_COLORS.success} />
                  <Text style={styles.proBadgeText}>Compte Professionnel</Text>
                </View>
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

        {/* Specialty Picker Modal */}
        <Modal
          visible={showSpecialtyPicker}
          animationType="slide"
          transparent
          onRequestClose={() => setShowSpecialtyPicker(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Sélectionner une spécialité</Text>
                <Pressable onPress={() => setShowSpecialtyPicker(false)}>
                  <Ionicons name="close" size={24} color={AUTH_COLORS.text.primary} />
                </Pressable>
              </View>

              <AuthInput
                label=""
                value={specialtySearch}
                onChangeText={setSpecialtySearch}
                leftIcon="search-outline"
                placeholder="Rechercher..."
              />

              <FlatList
                data={filteredSpecialties}
                keyExtractor={(item) => item}
                renderItem={({ item }) => (
                  <Pressable
                    style={[
                      styles.specialtyItem,
                      formData.specialty === item && styles.specialtyItemSelected,
                    ]}
                    onPress={() => {
                      updateField('specialty', item);
                      setShowSpecialtyPicker(false);
                      setSpecialtySearch('');
                    }}
                  >
                    <Text
                      style={[
                        styles.specialtyItemText,
                        formData.specialty === item && styles.specialtyItemTextSelected,
                      ]}
                    >
                      {item}
                    </Text>
                    {formData.specialty === item && (
                      <Ionicons name="checkmark" size={20} color={AUTH_COLORS.primary} />
                    )}
                  </Pressable>
                )}
                style={styles.specialtyList}
              />
            </View>
          </View>
        </Modal>
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
  proBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'center',
    backgroundColor: AUTH_COLORS.successSurface,
    paddingVertical: AUTH_SPACING.sm,
    paddingHorizontal: AUTH_SPACING.md,
    borderRadius: 20,
    gap: AUTH_SPACING.xs,
    marginBottom: AUTH_SPACING.lg,
  },
  proBadgeText: {
    fontSize: 14,
    fontWeight: '600',
    color: AUTH_COLORS.success,
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
  pickerButton: {
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
  pickerError: {
    borderColor: AUTH_COLORS.error,
    backgroundColor: AUTH_COLORS.errorSurface,
  },
  pickerText: {
    flex: 1,
    fontSize: 16,
    color: AUTH_COLORS.text.primary,
  },
  pickerPlaceholder: {
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

  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: AUTH_COLORS.background,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: AUTH_SPACING.lg,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: AUTH_SPACING.md,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: AUTH_COLORS.text.primary,
  },
  specialtyList: {
    flexGrow: 0,
  },
  specialtyItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: AUTH_SPACING.md,
    paddingHorizontal: AUTH_SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: AUTH_COLORS.border,
  },
  specialtyItemSelected: {
    backgroundColor: AUTH_COLORS.primarySurface,
    borderRadius: 8,
    marginVertical: 2,
  },
  specialtyItemText: {
    fontSize: 16,
    color: AUTH_COLORS.text.primary,
  },
  specialtyItemTextSelected: {
    fontWeight: '600',
    color: AUTH_COLORS.primary,
  },
});
