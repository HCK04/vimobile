import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Alert, Animated, KeyboardAvoidingView, Platform, Pressable, SafeAreaView, ScrollView, StyleSheet, Text, TextInput, View, Modal, TouchableWithoutFeedback, FlatList, Keyboard } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { api } from '../../lib/api';
import { getPostAuthRoute } from '../../lib/authHelpers';

const ONBOARDING_KEY = '@vi-sante:onboarding_completed';

const roleMap: Record<string, { id: number; title: string }[]> = {
  professionnel_sante: [
    { id: 2, title: 'Médecin' },
    { id: 3, title: 'Kinésithérapeute' },
    { id: 4, title: 'Orthophoniste' },
    { id: 5, title: 'Psychologue' },
  ],
  organisation: [
    { id: 6, title: 'Clinique' },
    { id: 7, title: 'Pharmacie' },
    { id: 8, title: 'Parapharmacie' },
    { id: 9, title: "Laboratoire d'analyses" },
    { id: 10, title: 'Centre de radiologie' },
  ],
};

const PAYMENT_OPTIONS = ['Espèces', 'Cartes bancaires', 'Chèques', 'Virements', 'Paiement mobile'];
const TRANSPORT_OPTIONS = ['Métro', 'Bus', 'Tramway', 'Parking public', 'Parking privé', 'Station de taxi', 'Vélib/Vélos en libre-service'];
const DAYS_OPTIONS = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche'];

// Simplified list of Moroccan cities for selection (can be extended or fetched later)
const CITIES = [
  'Casablanca','Rabat','Fès','Marrakech','Tanger','Agadir','Meknès','Oujda','Kénitra','Tétouan',
  'Safi','El Jadida','Nador','Béni Mellal','Khouribga','Taza','Mohammédia','Guelmim','Laâyoune','Dakhla'
];

// Generate 24h time slots in 15-min increments
const generateTimes = () => {
  const t: string[] = [];
  for (let h = 0; h < 24; h++) {
    for (let m = 0; m < 60; m += 15) {
      const hh = String(h).padStart(2, '0');
      const mm = String(m).padStart(2, '0');
      t.push(`${hh}:${mm}`);
    }
  }
  return t;
};
const TIMES = generateTimes();

const specialtyOptions = {
  Médecin: [
    'Médecine générale',
    'Pédiatrie',
    'Gynécologie',
    'Dermatologie',
    'Psychiatrie',
    'Autres',
  ],
  Kinésithérapeute: [
    'Kinésithérapie respiratoire',
    'Kinésithérapie orthopédique',
    'Kinésithérapie neurologique',
    'Autres',
  ],
  Orthophoniste: ['Orthophonie', 'Autres'],
  Psychologue: ['Psychologie clinique', 'Psychologie du travail', 'Autres'],
};

const serviceOptions = {
  Clinique: [
    'Consultations médicales',
    'Chirurgie ambulatoire',
    'Imagerie médicale',
    'Analyses biologiques',
    'Urgences',
    'Hospitalisation',
    'Autres',
  ],
  Pharmacie: [
    'Médicaments sur ordonnance',
    'Médicaments sans ordonnance',
    'Parapharmacie',
    'Conseil pharmaceutique',
    'Préparations magistrales',
    'Matériel médical',
    'Autres',
  ],
  Parapharmacie: [
    'Produits de beauté',
    'Compléments alimentaires',
    'Produits d\'hygiène',
    'Matériel médical',
    'Produits bébé',
    'Cosmétiques',
    'Autres',
  ],
  "Laboratoire d'analyses": [
    'Analyses sanguines',
    'Analyses urinaires',
    'Microbiologie',
    'Biochimie',
    'Hématologie',
    'Immunologie',
    'Autres',
  ],
  'Centre de radiologie': [
    'Radiographie',
    'Échographie',
    'Scanner (CT)',
    'IRM',
    'Mammographie',
    'Doppler',
    'Autres',
  ],
};

// Validation helpers
const validatePassword = (pwd: string) => {
  return {
    length: pwd.length >= 8,
    uppercase: /[A-Z]/.test(pwd),
    lowercase: /[a-z]/.test(pwd),
    number: /\d/.test(pwd),
    special: /[@$!%*?&]/.test(pwd),
  };
};

const validatePhone = (phone: string) => {
  // Moroccan phone format: 06XXXXXXXX or 07XXXXXXXX
  return /^0[67]\d{8}$/.test(phone);
};

export default function ProfessionalAuthScreen() {
  const router = useRouter();
  const [tab, setTab] = useState<'login' | 'register'>('register');
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const slideAnim = useRef(new Animated.Value(0)).current;
  const [loading, setLoading] = useState(false);

  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [showLoginPassword, setShowLoginPassword] = useState(false);

  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [password2, setPassword2] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showPassword2, setShowPassword2] = useState(false);

  const [category, setCategory] = useState<'professionnel_sante' | 'organisation' | ''>('');
  const [roleTitle, setRoleTitle] = useState<string>('');

  const [name, setName] = useState('');
  const [adresse, setAdresse] = useState('');
  const [ville, setVille] = useState('');
  const [horaireStart, setHoraireStart] = useState('08:00');
  const [horaireEnd, setHoraireEnd] = useState('18:00');

  const [numeroCarte, setNumeroCarte] = useState('');
  const [specialty, setSpecialty] = useState<string[]>([]);
  const [otherSpecialty, setOtherSpecialty] = useState('');
  const [experienceYears, setExperienceYears] = useState('');
  const [presentation, setPresentation] = useState('');
  const [diplomes, setDiplomes] = useState('');
  const [experiences, setExperiences] = useState('');

  const [nomEtablissement, setNomEtablissement] = useState('');
  const [responsableName, setResponsableName] = useState('');
  const [services, setServices] = useState<string[]>([]);
  const [otherService, setOtherService] = useState('');
  const [servicesDescription, setServicesDescription] = useState('');
  const [additionalInfo, setAdditionalInfo] = useState('');
  const [informationsPratiques, setInformationsPratiques] = useState('');
  const [contactUrgence, setContactUrgence] = useState('');
  const [guard, setGuard] = useState(false);
  const [clinicPresentation, setClinicPresentation] = useState('');
  const [clinicServicesDescription, setClinicServicesDescription] = useState('');
  const [moyensPaiement, setMoyensPaiement] = useState<string[]>([]);
  const [moyensTransport, setMoyensTransport] = useState<string[]>([]);
  const [joursDisponibles, setJoursDisponibles] = useState<string[]>([]);
  const [rdvSuivisUniquement, setRdvSuivisUniquement] = useState(false);

  // Selectors state
  const [cityModalVisible, setCityModalVisible] = useState(false);
  const [cityQuery, setCityQuery] = useState('');
  const filteredCities = useMemo(() => {
    const q = cityQuery.trim().toLowerCase();
    if (!q) return CITIES;
    return CITIES.filter(c => c.toLowerCase().includes(q));
  }, [cityQuery]);
  const [timeModalVisible, setTimeModalVisible] = useState(false);
  const [timePicking, setTimePicking] = useState<'' | 'start' | 'end'>('');

  // Validation states
  const passwordValidation = useMemo(() => validatePassword(password), [password]);
  const isPasswordValid = useMemo(() => Object.values(passwordValidation).every(v => v), [passwordValidation]);
  const isPhoneValid = useMemo(() => validatePhone(phone), [phone]);
  const isEmailValid = useMemo(() => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email), [email]);

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 220, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 220, useNativeDriver: true }),
    ]).start();
  }, [step, fadeAnim, slideAnim]);

  const toggleMulti = (arr: string[], setArr: (s: string[]) => void, val: string) => {
    if (val === 'Aucune') {
      if (arr.length === 1 && arr[0] === 'Aucune') setArr([]); else setArr(['Aucune']);
      return;
    }
    const next = arr.filter((x) => x !== 'Aucune');
    const has = next.includes(val);
    setArr(has ? next.filter((x) => x !== val) : [...next, val]);
  };

  // Selector helpers
  const openCityModal = () => { setCityQuery(''); setCityModalVisible(true); };
  const selectCity = (c: string) => { setVille(c); setCityModalVisible(false); };
  const openTimeModal = (which: 'start' | 'end') => { setTimePicking(which); setTimeModalVisible(true); };
  const selectTime = (t: string) => {
    if (timePicking === 'start') setHoraireStart(t);
    if (timePicking === 'end') setHoraireEnd(t);
    setTimeModalVisible(false);
    setTimePicking('');
  };

  const onLogin = async () => {
    if (!loginEmail || !loginPassword) {
      Alert.alert('Connexion', 'Veuillez saisir votre email et mot de passe.');
      return;
    }
    try {
      setLoading(true);
      const res = await api.login({ email: loginEmail, password: loginPassword });
      // Mark onboarding as completed
      await AsyncStorage.setItem(ONBOARDING_KEY, 'true');
      const route = getPostAuthRoute(res?.user || {});
      router.replace(route as any);
    } catch (e: any) {
      const msg = e?.response?.data?.message || e?.message || 'Une erreur est survenue';
      Alert.alert('Connexion', msg);
    } finally {
      setLoading(false);
    }
  };

  const validateStep1 = () => {
    if (!email) { Alert.alert('Étape 1', 'Email requis.'); return false; }
    if (!isEmailValid) { Alert.alert('Étape 1', 'Email invalide.'); return false; }
    if (!phone) { Alert.alert('Étape 1', 'Téléphone requis.'); return false; }
    if (!isPhoneValid) { Alert.alert('Étape 1', 'Format de téléphone invalide. Utilisez le format: 06XXXXXXXX ou 07XXXXXXXX'); return false; }
    if (!password || !password2) { Alert.alert('Étape 1', 'Mot de passe et confirmation requis.'); return false; }
    if (!isPasswordValid) { Alert.alert('Étape 1', 'Le mot de passe ne respecte pas les critères de sécurité.'); return false; }
    if (password !== password2) { Alert.alert('Étape 1', 'Les mots de passe ne correspondent pas.'); return false; }
    return true;
  };

  const validateStep2 = () => {
    if (!category) { Alert.alert('Étape 2', 'Veuillez choisir une catégorie.'); return false; }
    if (!roleTitle) { Alert.alert('Étape 2', 'Veuillez choisir un rôle.'); return false; }
    return true;
  };

  const validateStep3 = () => {
    if (category === 'professionnel_sante') {
      if (!name) { Alert.alert('Étape 3', 'Nom requis.'); return false; }
      if (!numeroCarte) { Alert.alert('Étape 3', 'Numéro de carte professionnelle requis.'); return false; }
      if (!adresse) { Alert.alert('Étape 3', 'Adresse requise.'); return false; }
      if (!ville) { Alert.alert('Étape 3', 'Ville requise.'); return false; }
      return true;
    }
    if (category === 'organisation') {
      if (!nomEtablissement) { Alert.alert('Étape 3', "Nom de l'établissement requis."); return false; }
      if (!responsableName) { Alert.alert('Étape 3', 'Nom du responsable requis.'); return false; }
      if (!adresse) { Alert.alert('Étape 3', 'Adresse requise.'); return false; }
      if (!ville) { Alert.alert('Étape 3', 'Ville requise.'); return false; }
      return true;
    }
    return false;
  };

  const onNext = async () => {
    if (step === 1) {
      if (!validateStep1()) return;
      try {
        setLoading(true);
        await api.checkAvailability({ email, phone });
      } catch (e: any) {
        const msg = e?.response?.data?.message || e?.message || 'Erreur de vérification';
        Alert.alert('Disponibilité', msg);
        setLoading(false);
        return;
      }
      Animated.parallel([
        Animated.timing(fadeAnim, { toValue: 0, duration: 150, useNativeDriver: true }),
        Animated.timing(slideAnim, { toValue: 8, duration: 150, useNativeDriver: true }),
      ]).start(() => { setStep(2); setLoading(false); });
      return;
    }
    if (step === 2) {
      if (!validateStep2()) return;
      Animated.parallel([
        Animated.timing(fadeAnim, { toValue: 0, duration: 150, useNativeDriver: true }),
        Animated.timing(slideAnim, { toValue: 8, duration: 150, useNativeDriver: true }),
      ]).start(() => setStep(3));
      return;
    }
  };

  const onBack = () => {
    if (step > 1) {
      Animated.parallel([
        Animated.timing(fadeAnim, { toValue: 0, duration: 150, useNativeDriver: true }),
        Animated.timing(slideAnim, { toValue: 8, duration: 150, useNativeDriver: true }),
      ]).start(() => setStep((s) => (s - 1) as 1 | 2 | 3));
    }
  };

  const onSubmit = async () => {
    if (!validateStep3()) return;
    try {
      setLoading(true);
      const selected = Object.values(roleMap[category] || {}).find((r) => r.title === roleTitle);
      const role_id = selected?.id || 0;
      if (category === 'professionnel_sante') {
        const spec = specialty.includes('Autres') && otherSpecialty ? specialty.filter((s) => s !== 'Autres').concat(otherSpecialty) : specialty;
        const data = await api.registerProfessional({
          name,
          email,
          password,
          password_confirmation: password2,
          phone,
          role_id,
          specialty: spec,
          other_specialty: otherSpecialty,
          experience_years: experienceYears,
          horaire_start: horaireStart,
          horaire_end: horaireEnd,
          presentation,
          adresse,
          ville,
          numero_carte_professionnelle: numeroCarte,
          diplomes: diplomes ? diplomes.split('\n').map((s) => s.trim()).filter(Boolean) : [],
          experiences: experiences ? experiences.split('\n').map((s) => s.trim()).filter(Boolean) : [],
          services_description: servicesDescription,
          additional_info: additionalInfo,
          informations_pratiques: informationsPratiques,
          moyens_paiement: moyensPaiement,
          moyens_transport: moyensTransport,
          jours_disponibles: joursDisponibles,
          contact_urgence: contactUrgence,
          rdv_patients_suivis_uniquement: rdvSuivisUniquement,
        });
        // Mark onboarding as completed
        await AsyncStorage.setItem(ONBOARDING_KEY, 'true');
        const route = getPostAuthRoute(data?.user || { role_id }, category);
        router.replace(route as any);
      } else {
        const srv = services.includes('Autres') && otherService ? services.filter((s) => s !== 'Autres').concat(otherService) : services;
        const data = await api.registerOrganization({
          name,
          email,
          password,
          password_confirmation: password2,
          phone,
          role_id,
          nom_etablissement: nomEtablissement || name,
          responsable_name: responsableName,
          adresse,
          ville,
          services: srv,
          other_service: otherService,
          services_description: servicesDescription,
          additional_info: additionalInfo,
          informations_pratiques: informationsPratiques,
          contact_urgence: contactUrgence,
          guard,
          horaire_start: horaireStart,
          horaire_end: horaireEnd,
          clinic_presentation: clinicPresentation,
          clinic_services_description: clinicServicesDescription,
          moyens_paiement: moyensPaiement,
          moyens_transport: moyensTransport,
          jours_disponibles: joursDisponibles,
        });
        // Mark onboarding as completed
        await AsyncStorage.setItem(ONBOARDING_KEY, 'true');
        const route = getPostAuthRoute(data?.user || { role_id }, category);
        router.replace(route as any);
      }
    } catch (e: any) {
      const msg = e?.response?.data?.message || e?.message || 'Une erreur est survenue';
      Alert.alert('Inscription', msg);
    } finally {
      setLoading(false);
    }
  };

  const rolesForCategory = useMemo(() => (category ? roleMap[category] : []), [category]);
  const optionsForRole = useMemo(() => (
    category === 'professionnel_sante' ? (specialtyOptions[roleTitle as keyof typeof specialtyOptions] || []) : (serviceOptions[roleTitle as keyof typeof serviceOptions] || [])
  ), [category, roleTitle]);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#F8FAFC' }}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} keyboardVerticalOffset={Platform.OS === 'ios' ? 80 : 0} style={{ flex: 1 }}>
        <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
          <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
          <View style={styles.header}>
            <View style={styles.brandLeft}>
              <Ionicons name="medkit" size={24} color="#2563EB" />
              <Text style={styles.brandText}>Vi-Santé Pro</Text>
            </View>
            <View style={styles.headerActions}>
              <Pressable onPress={() => setTab(tab === 'login' ? 'register' : 'login')} style={styles.headerLink}>
                <Text style={styles.headerLinkText}>{tab === 'login' ? "S'inscrire" : 'Se connecter'}</Text>
              </Pressable>
            </View>
          </View>

          <View style={{ paddingHorizontal: 16, paddingTop: 8, paddingBottom: 4 }}>
            <Text style={styles.screenTitle}>{tab === 'login' ? 'Connexion' : 'Inscription Pro'}</Text>
            <Text style={styles.screenSubtitle}>{tab === 'login' ? 'Professionnels et Organisations' : 'Compte, Rôle, Profil'}</Text>
          </View>

          {tab === 'login' ? (
            <View style={styles.card}>
              <View style={styles.formRow}>
                <Text style={styles.label}>Email</Text>
                <View style={styles.inputContainer}>
                  <Ionicons name="mail-outline" size={20} color="#9CA3AF" style={styles.inputIcon} />
                  <TextInput 
                    value={loginEmail} 
                    onChangeText={setLoginEmail} 
                    autoCapitalize="none" 
                    keyboardType="email-address" 
                    placeholder="vous@exemple.com" 
                    placeholderTextColor="#9CA3AF" 
                    style={styles.inputWithIcon} 
                  />
                </View>
              </View>
              <View style={styles.formRow}>
                <Text style={styles.label}>Mot de passe</Text>
                <View style={styles.inputContainer}>
                  <Ionicons name="lock-closed-outline" size={20} color="#9CA3AF" style={styles.inputIcon} />
                  <TextInput 
                    value={loginPassword} 
                    onChangeText={setLoginPassword} 
                    secureTextEntry={!showLoginPassword}
                    placeholder="••••••••" 
                    placeholderTextColor="#9CA3AF" 
                    style={styles.inputWithIcon} 
                  />
                  <Pressable onPress={() => setShowLoginPassword(!showLoginPassword)} style={styles.eyeIcon}>
                    <Ionicons name={showLoginPassword ? "eye-outline" : "eye-off-outline"} size={20} color="#9CA3AF" />
                  </Pressable>
                </View>
              </View>
              <Pressable disabled={loading} onPress={onLogin} style={[styles.primaryBtn, loading && { opacity: 0.7 }]}>
                <Text style={styles.primaryBtnText}>{loading ? 'Connexion...' : 'Se connecter'}</Text>
              </Pressable>
            </View>
          ) : (
            <View style={styles.card}>
              <View style={styles.stepperWrap}>
                <View style={styles.stepperRow}>
                  <View style={styles.stepperItem}>
                    <View style={[styles.stepperCircle, step >= 1 && styles.stepperCircleActive]}><Text style={[styles.stepperNum, step >= 1 && styles.stepperNumActive]}>1</Text></View>
                    <Text style={[styles.stepperLabel, step >= 1 && styles.stepperLabelActive]}>Compte</Text>
                  </View>
                  <View style={[styles.stepperConnector, step >= 2 && styles.stepperConnectorActive]} />
                  <View style={styles.stepperItem}>
                    <View style={[styles.stepperCircle, step >= 2 && styles.stepperCircleActive]}><Text style={[styles.stepperNum, step >= 2 && styles.stepperNumActive]}>2</Text></View>
                    <Text style={[styles.stepperLabel, step >= 2 && styles.stepperLabelActive]}>Rôle</Text>
                  </View>
                  <View style={[styles.stepperConnector, step >= 3 && styles.stepperConnectorActive]} />
                  <View style={styles.stepperItem}>
                    <View style={[styles.stepperCircle, step >= 3 && styles.stepperCircleActive]}><Text style={[styles.stepperNum, step >= 3 && styles.stepperNumActive]}>3</Text></View>
                    <Text style={[styles.stepperLabel, step >= 3 && styles.stepperLabelActive]}>Profil</Text>
                  </View>
                </View>
                <View style={styles.progressOuter}><View style={[styles.progressInner, { width: `${(step / 3) * 100}%` }]} /></View>
              </View>

              <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
                {step === 1 && (
                  <View>
                    {/* Email */}
                    <View style={styles.formRow}>
                      <Text style={styles.label}>Email</Text>
                      <View style={[styles.inputContainer, email && !isEmailValid && styles.inputError, email && isEmailValid && styles.inputSuccess]}>
                        <Ionicons name="mail-outline" size={20} color="#9CA3AF" style={styles.inputIcon} />
                        <TextInput 
                          value={email} 
                          onChangeText={setEmail} 
                          autoCapitalize="none" 
                          keyboardType="email-address" 
                          placeholder="vous@exemple.com" 
                          placeholderTextColor="#9CA3AF" 
                          style={styles.inputWithIcon} 
                        />
                        {email && isEmailValid && <Ionicons name="checkmark-circle" size={20} color="#10B981" style={styles.validationIcon} />}
                      </View>
                      {email && !isEmailValid && <Text style={styles.helperError}>Email invalide</Text>}
                    </View>

                    {/* Phone */}
                    <View style={styles.formRow}>
                      <Text style={styles.label}>Téléphone</Text>
                      <View style={[styles.inputContainer, phone && !isPhoneValid && styles.inputError, phone && isPhoneValid && styles.inputSuccess]}>
                        <Ionicons name="call-outline" size={20} color="#9CA3AF" style={styles.inputIcon} />
                        <TextInput 
                          value={phone} 
                          onChangeText={setPhone} 
                          keyboardType="phone-pad" 
                          placeholder="06XXXXXXXX" 
                          placeholderTextColor="#9CA3AF" 
                          style={styles.inputWithIcon}
                          maxLength={10}
                        />
                        {phone && isPhoneValid && <Ionicons name="checkmark-circle" size={20} color="#10B981" style={styles.validationIcon} />}
                      </View>
                      <Text style={styles.helper}>Format: 06XXXXXXXX ou 07XXXXXXXX</Text>
                      {phone && !isPhoneValid && <Text style={styles.helperError}>Format invalide</Text>}
                    </View>

                    {/* Password */}
                    <View style={styles.formRow}>
                      <Text style={styles.label}>Mot de passe</Text>
                      <View style={[styles.inputContainer, password && !isPasswordValid && styles.inputError, password && isPasswordValid && styles.inputSuccess]}>
                        <Ionicons name="lock-closed-outline" size={20} color="#9CA3AF" style={styles.inputIcon} />
                        <TextInput 
                          value={password} 
                          onChangeText={setPassword} 
                          secureTextEntry={!showPassword}
                          placeholder="••••••••" 
                          placeholderTextColor="#9CA3AF" 
                          style={styles.inputWithIcon} 
                        />
                        <Pressable onPress={() => setShowPassword(!showPassword)} style={styles.eyeIcon}>
                          <Ionicons name={showPassword ? "eye-outline" : "eye-off-outline"} size={20} color="#9CA3AF" />
                        </Pressable>
                      </View>
                      {password && (
                        <View style={styles.passwordRequirements}>
                          <Text style={styles.requirementsTitle}>Le mot de passe doit contenir:</Text>
                          <View style={styles.requirementItem}>
                            <Ionicons name={passwordValidation.length ? "checkmark-circle" : "close-circle"} size={16} color={passwordValidation.length ? "#10B981" : "#EF4444"} />
                            <Text style={[styles.requirementText, passwordValidation.length && styles.requirementMet]}>Au moins 8 caractères</Text>
                          </View>
                          <View style={styles.requirementItem}>
                            <Ionicons name={passwordValidation.uppercase ? "checkmark-circle" : "close-circle"} size={16} color={passwordValidation.uppercase ? "#10B981" : "#EF4444"} />
                            <Text style={[styles.requirementText, passwordValidation.uppercase && styles.requirementMet]}>Une lettre majuscule</Text>
                          </View>
                          <View style={styles.requirementItem}>
                            <Ionicons name={passwordValidation.lowercase ? "checkmark-circle" : "close-circle"} size={16} color={passwordValidation.lowercase ? "#10B981" : "#EF4444"} />
                            <Text style={[styles.requirementText, passwordValidation.lowercase && styles.requirementMet]}>Une lettre minuscule</Text>
                          </View>
                          <View style={styles.requirementItem}>
                            <Ionicons name={passwordValidation.number ? "checkmark-circle" : "close-circle"} size={16} color={passwordValidation.number ? "#10B981" : "#EF4444"} />
                            <Text style={[styles.requirementText, passwordValidation.number && styles.requirementMet]}>Un chiffre</Text>
                          </View>
                          <View style={styles.requirementItem}>
                            <Ionicons name={passwordValidation.special ? "checkmark-circle" : "close-circle"} size={16} color={passwordValidation.special ? "#10B981" : "#EF4444"} />
                            <Text style={[styles.requirementText, passwordValidation.special && styles.requirementMet]}>Un caractère spécial (@$!%*?&)</Text>
                          </View>
                        </View>
                      )}
                    </View>

                    {/* Password Confirmation */}
                    <View style={styles.formRow}>
                      <Text style={styles.label}>Confirmation du mot de passe</Text>
                      <View style={[styles.inputContainer, password2 && password !== password2 && styles.inputError, password2 && password === password2 && styles.inputSuccess]}>
                        <Ionicons name="lock-closed-outline" size={20} color="#9CA3AF" style={styles.inputIcon} />
                        <TextInput 
                          value={password2} 
                          onChangeText={setPassword2} 
                          secureTextEntry={!showPassword2}
                          placeholder="••••••••" 
                          placeholderTextColor="#9CA3AF" 
                          style={styles.inputWithIcon} 
                        />
                        <Pressable onPress={() => setShowPassword2(!showPassword2)} style={styles.eyeIcon}>
                          <Ionicons name={showPassword2 ? "eye-outline" : "eye-off-outline"} size={20} color="#9CA3AF" />
                        </Pressable>
                      </View>
                      {password2 && password !== password2 && <Text style={styles.helperError}>Les mots de passe ne correspondent pas</Text>}
                      {password2 && password === password2 && <Text style={styles.helperSuccess}>✓ Les mots de passe correspondent</Text>}
                    </View>
                  </View>
                )}

                {step === 2 && (
                  <View>
                    <Text style={styles.label}>Catégorie</Text>
                    <View style={styles.chipsRow}>
                      {['professionnel_sante','organisation'].map((c) => (
                        <Pressable key={c} onPress={() => { setCategory(c as any); setRoleTitle(''); }} style={[styles.chip, category === c && styles.chipActive]}>
                          <Text style={[styles.chipText, category === c && styles.chipTextActive]}>{c === 'professionnel_sante' ? 'Professionnel de santé' : 'Organisation'}</Text>
                        </Pressable>
                      ))}
                    </View>
                    {!!category && (
                      <>
                        <Text style={styles.label}>Rôle</Text>
                        <View style={styles.chipsRow}>
                          {rolesForCategory.map((r) => (
                            <Pressable key={r.id} onPress={() => setRoleTitle(r.title)} style={[styles.chip, roleTitle === r.title && styles.chipActive]}>
                              <Text style={[styles.chipText, roleTitle === r.title && styles.chipTextActive]}>{r.title}</Text>
                            </Pressable>
                          ))}
                        </View>
                      </>
                    )}
                  </View>
                )}

                {step === 3 && (
                  <View>
                    {category === 'professionnel_sante' ? (
                      <View>
                        <View style={styles.formRow}><Text style={styles.label}>Nom</Text><TextInput value={name} onChangeText={setName} placeholder="Votre nom" placeholderTextColor="#9CA3AF" style={styles.input} /></View>
                        <View style={styles.twoCols}>
                          <View style={{ flex: 1 }}>
                            <Text style={styles.label}>Adresse</Text>
                            <TextInput value={adresse} onChangeText={setAdresse} placeholder="Adresse" placeholderTextColor="#9CA3AF" style={styles.input} />
                          </View>
                          <View style={{ width: 12 }} />
                          <View style={{ flex: 1 }}>
                            <Text style={styles.label}>Ville</Text>
                            <Pressable onPress={openCityModal} style={[styles.input, styles.selectRow]}>
                              <Text style={[styles.selectText, !ville && { color: '#9CA3AF' }]}>{ville || 'Choisir une ville'}</Text>
                              <Ionicons name="chevron-down" size={18} color="#9CA3AF" />
                            </Pressable>
                          </View>
                        </View>
                        <View style={styles.twoCols}>
                          <View style={{ flex: 1 }}>
                            <Text style={styles.label}>Heure début</Text>
                            <Pressable onPress={() => openTimeModal('start')} style={[styles.input, styles.selectRow]}>
                              <Text style={styles.selectText}>{horaireStart || 'Choisir'}</Text>
                              <Ionicons name="time-outline" size={18} color="#9CA3AF" />
                            </Pressable>
                          </View>
                          <View style={{ width: 12 }} />
                          <View style={{ flex: 1 }}>
                            <Text style={styles.label}>Heure fin</Text>
                            <Pressable onPress={() => openTimeModal('end')} style={[styles.input, styles.selectRow]}>
                              <Text style={styles.selectText}>{horaireEnd || 'Choisir'}</Text>
                              <Ionicons name="time-outline" size={18} color="#9CA3AF" />
                            </Pressable>
                          </View>
                        </View>
                        <View style={styles.formRow}><Text style={styles.label}>Numéro de carte professionnelle</Text><TextInput value={numeroCarte} onChangeText={setNumeroCarte} placeholder="Numéro" placeholderTextColor="#9CA3AF" style={styles.input} /></View>
                        <Text style={styles.label}>Spécialités</Text>
                        <View style={styles.chipsRow}>
                          {optionsForRole.map((opt) => (
                            <Pressable key={opt} onPress={() => toggleMulti(specialty, setSpecialty, opt)} style={[styles.chip, specialty.includes(opt) && styles.chipActive]}>
                              <Text style={[styles.chipText, specialty.includes(opt) && styles.chipTextActive]}>{opt}</Text>
                            </Pressable>
                          ))}
                        </View>
                        {specialty.includes('Autres') && (
                          <View style={styles.formRow}><Text style={styles.label}>Autre spécialité</Text><TextInput value={otherSpecialty} onChangeText={setOtherSpecialty} placeholder="Précisez" placeholderTextColor="#9CA3AF" style={styles.input} /></View>
                        )}
                        <View style={styles.formRow}><Text style={styles.label}>Années d'expérience</Text><TextInput value={experienceYears} onChangeText={setExperienceYears} keyboardType="number-pad" placeholder="Ex. 5" placeholderTextColor="#9CA3AF" style={styles.input} /></View>
                        <View style={styles.formRow}><Text style={styles.label}>Présentation</Text><TextInput value={presentation} onChangeText={setPresentation} placeholder="Présentation" placeholderTextColor="#9CA3AF" style={[styles.input, { height: 92 }]} multiline /></View>
                        <View style={styles.formRow}><Text style={styles.label}>Diplômes (un par ligne)</Text><TextInput value={diplomes} onChangeText={setDiplomes} placeholder="Diplôme 1\nDiplôme 2" placeholderTextColor="#9CA3AF" style={[styles.input, { height: 92 }]} multiline /></View>
                        <View style={styles.formRow}><Text style={styles.label}>Expériences (une par ligne)</Text><TextInput value={experiences} onChangeText={setExperiences} placeholder="Expérience 1\nExpérience 2" placeholderTextColor="#9CA3AF" style={[styles.input, { height: 92 }]} multiline /></View>

                        <Text style={styles.label}>Moyens de paiement</Text>
                        <View style={styles.chipsRow}>
                          {PAYMENT_OPTIONS.map((opt) => (
                            <Pressable key={opt} onPress={() => toggleMulti(moyensPaiement, setMoyensPaiement, opt)} style={[styles.chip, moyensPaiement.includes(opt) && styles.chipActive]}>
                              <Text style={[styles.chipText, moyensPaiement.includes(opt) && styles.chipTextActive]}>{opt}</Text>
                            </Pressable>
                          ))}
                        </View>

                        <Text style={styles.label}>Moyens de transport</Text>
                        <View style={styles.chipsRow}>
                          {TRANSPORT_OPTIONS.map((opt) => (
                            <Pressable key={opt} onPress={() => toggleMulti(moyensTransport, setMoyensTransport, opt)} style={[styles.chip, moyensTransport.includes(opt) && styles.chipActive]}>
                              <Text style={[styles.chipText, moyensTransport.includes(opt) && styles.chipTextActive]}>{opt}</Text>
                            </Pressable>
                          ))}
                        </View>

                        <View style={styles.formRow}><Text style={styles.label}>Informations pratiques</Text><TextInput value={informationsPratiques} onChangeText={setInformationsPratiques} placeholder="Accès, étage..." placeholderTextColor="#9CA3AF" style={[styles.input, { height: 72 }]} multiline /></View>

                        <Text style={styles.label}>Jours disponibles</Text>
                        <View style={styles.chipsRow}>
                          {DAYS_OPTIONS.map((d) => (
                            <Pressable key={d} onPress={() => toggleMulti(joursDisponibles, setJoursDisponibles, d)} style={[styles.chip, joursDisponibles.includes(d) && styles.chipActive]}>
                              <Text style={[styles.chipText, joursDisponibles.includes(d) && styles.chipTextActive]}>{d}</Text>
                            </Pressable>
                          ))}
                        </View>

                        <View style={styles.formRow}><Text style={styles.label}>Contact d'urgence</Text><TextInput value={contactUrgence} onChangeText={setContactUrgence} placeholder="Contact" placeholderTextColor="#9CA3AF" style={styles.input} /></View>

                        <View style={styles.chipsRow}>
                          <Pressable onPress={() => setRdvSuivisUniquement((v) => !v)} style={[styles.chip, rdvSuivisUniquement && styles.chipActive]}>
                            <Text style={[styles.chipText, rdvSuivisUniquement && styles.chipTextActive]}>RDV patients suivis uniquement</Text>
                          </Pressable>
                        </View>
                      </View>
                    ) : (
                      <View>
                        <View style={styles.formRow}><Text style={styles.label}>Nom de l'établissement</Text><TextInput value={nomEtablissement} onChangeText={setNomEtablissement} placeholder="Nom" placeholderTextColor="#9CA3AF" style={styles.input} /></View>
                        <View style={styles.formRow}><Text style={styles.label}>Responsable</Text><TextInput value={responsableName} onChangeText={setResponsableName} placeholder="Responsable" placeholderTextColor="#9CA3AF" style={styles.input} /></View>
                        <View style={styles.twoCols}>
                          <View style={{ flex: 1 }}><Text style={styles.label}>Adresse</Text><TextInput value={adresse} onChangeText={setAdresse} placeholder="Adresse" placeholderTextColor="#9CA3AF" style={styles.input} /></View>
                          <View style={{ width: 12 }} />
                          <View style={{ flex: 1 }}><Text style={styles.label}>Ville</Text><TextInput value={ville} onChangeText={setVille} placeholder="Ville" placeholderTextColor="#9CA3AF" style={styles.input} /></View>
                        </View>
                        <View style={styles.twoCols}>
                          <View style={{ flex: 1 }}><Text style={styles.label}>Heure début</Text><TextInput value={horaireStart} onChangeText={setHoraireStart} placeholder="08:00" placeholderTextColor="#9CA3AF" style={styles.input} /></View>
                          <View style={{ width: 12 }} />
                          <View style={{ flex: 1 }}><Text style={styles.label}>Heure fin</Text><TextInput value={horaireEnd} onChangeText={setHoraireEnd} placeholder="18:00" placeholderTextColor="#9CA3AF" style={styles.input} /></View>
                        </View>
                        <Text style={styles.label}>Services</Text>
                        <View style={styles.chipsRow}>
                          {optionsForRole.map((opt) => (
                            <Pressable key={opt} onPress={() => toggleMulti(services, setServices, opt)} style={[styles.chip, services.includes(opt) && styles.chipActive]}>
                              <Text style={[styles.chipText, services.includes(opt) && styles.chipTextActive]}>{opt}</Text>
                            </Pressable>
                          ))}
                        </View>
                        {services.includes('Autres') && (
                          <View style={styles.formRow}><Text style={styles.label}>Service personnalisé</Text><TextInput value={otherService} onChangeText={setOtherService} placeholder="Précisez" placeholderTextColor="#9CA3AF" style={styles.input} /></View>
                        )}
                        <View style={styles.formRow}><Text style={styles.label}>Présentation</Text><TextInput value={clinicPresentation} onChangeText={setClinicPresentation} placeholder="Présentation" placeholderTextColor="#9CA3AF" style={[styles.input, { height: 92 }]} multiline /></View>
                        <View style={styles.formRow}><Text style={styles.label}>Description des services</Text><TextInput value={clinicServicesDescription} onChangeText={setClinicServicesDescription} placeholder="Description" placeholderTextColor="#9CA3AF" style={[styles.input, { height: 92 }]} multiline /></View>
                        <View style={styles.formRow}><Text style={styles.label}>Informations complémentaires</Text><TextInput value={additionalInfo} onChangeText={setAdditionalInfo} placeholder="Informations" placeholderTextColor="#9CA3AF" style={[styles.input, { height: 72 }]} multiline /></View>
                        <View style={styles.formRow}><Text style={styles.label}>Informations pratiques</Text><TextInput value={informationsPratiques} onChangeText={setInformationsPratiques} placeholder="Pratiques" placeholderTextColor="#9CA3AF" style={[styles.input, { height: 72 }]} multiline /></View>
                        <View style={styles.formRow}><Text style={styles.label}>Contact d'urgence</Text><TextInput value={contactUrgence} onChangeText={setContactUrgence} placeholder="Contact" placeholderTextColor="#9CA3AF" style={styles.input} /></View>

                        <Text style={styles.label}>Moyens de paiement</Text>
                        <View style={styles.chipsRow}>
                          {PAYMENT_OPTIONS.map((opt) => (
                            <Pressable key={opt} onPress={() => toggleMulti(moyensPaiement, setMoyensPaiement, opt)} style={[styles.chip, moyensPaiement.includes(opt) && styles.chipActive]}>
                              <Text style={[styles.chipText, moyensPaiement.includes(opt) && styles.chipTextActive]}>{opt}</Text>
                            </Pressable>
                          ))}
                        </View>

                        <Text style={styles.label}>Moyens de transport</Text>
                        <View style={styles.chipsRow}>
                          {TRANSPORT_OPTIONS.map((opt) => (
                            <Pressable key={opt} onPress={() => toggleMulti(moyensTransport, setMoyensTransport, opt)} style={[styles.chip, moyensTransport.includes(opt) && styles.chipActive]}>
                              <Text style={[styles.chipText, moyensTransport.includes(opt) && styles.chipTextActive]}>{opt}</Text>
                            </Pressable>
                          ))}
                        </View>

                        <Text style={styles.label}>Jours disponibles</Text>
                        <View style={styles.chipsRow}>
                          {DAYS_OPTIONS.map((d) => (
                            <Pressable key={d} onPress={() => toggleMulti(joursDisponibles, setJoursDisponibles, d)} style={[styles.chip, joursDisponibles.includes(d) && styles.chipActive]}>
                              <Text style={[styles.chipText, joursDisponibles.includes(d) && styles.chipTextActive]}>{d}</Text>
                            </Pressable>
                          ))}
                        </View>

                        {(roleTitle === 'Pharmacie' || roleTitle === 'Parapharmacie') && (
                          <View style={styles.chipsRow}>
                            <Pressable onPress={() => setGuard((v) => !v)} style={[styles.chip, guard && styles.chipActive]}>
                              <Text style={[styles.chipText, guard && styles.chipTextActive]}>Pharmacie de garde</Text>
                            </Pressable>
                          </View>
                        )}
                      </View>
                    )}
                  </View>
                )}
              </Animated.View>

              <View style={styles.controlsRow}>
                {step > 1 ? (
                  <Pressable disabled={loading} onPress={onBack} style={[styles.secondaryBtn, loading && { opacity: 0.6 }]}>
                    <Text style={styles.secondaryBtnText}>Retour</Text>
                  </Pressable>
                ) : <View style={{ flex: 1 }} />}

                {step < 3 ? (
                  <Pressable disabled={loading} onPress={onNext} style={[styles.primaryBtn, { flex: 1 }, loading && { opacity: 0.7 }]}>
                    <Text style={styles.primaryBtnText}>{loading ? 'Veuillez patienter...' : 'Suivant'}</Text>
                  </Pressable>
                ) : (
                  <Pressable disabled={loading} onPress={onSubmit} style={[styles.primaryBtn, { flex: 1 }, loading && { opacity: 0.7 }]}>
                    <Text style={styles.primaryBtnText}>{loading ? 'Création...' : 'Créer mon compte'}</Text>
                  </Pressable>
                )}
              </View>
            </View>
          )}

          <View style={{ paddingVertical: 24, alignItems: 'center' }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8 }}>
              <Ionicons name="heart" size={18} color="#2563EB" />
              <Text style={{ color: '#2563EB', fontWeight: '700', fontSize: 16 }}>Vi-Santé</Text>
            </View>
            <Text style={{ color: '#6B7280', fontSize: 12 }}>&copy; 2025 Vi-Santé. Tous droits réservés.</Text>
          </View>
          </ScrollView>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
      {/* City Selector Modal */}
      <Modal
        visible={cityModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setCityModalVisible(false)}
      >
        <TouchableWithoutFeedback onPress={() => setCityModalVisible(false)}>
          <View style={styles.modalOverlay}>
            <TouchableWithoutFeedback>
              <View style={styles.modalSheet}>
                <View style={styles.modalHandle} />
                <Text style={styles.modalTitle}>Choisir une ville</Text>
                <TextInput
                  value={cityQuery}
                  onChangeText={setCityQuery}
                  placeholder="Rechercher..."
                  placeholderTextColor="#9CA3AF"
                  style={styles.modalSearch}
                />
                <FlatList
                  data={filteredCities}
                  keyExtractor={(item) => item}
                  renderItem={({ item }) => (
                    <Pressable onPress={() => selectCity(item)} style={styles.modalListItem}>
                      <Text style={styles.modalListItemText}>{item}</Text>
                    </Pressable>
                  )}
                />
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>

      {/* Time Selector Modal */}
      <Modal
        visible={timeModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setTimeModalVisible(false)}
      >
        <TouchableWithoutFeedback onPress={() => setTimeModalVisible(false)}>
          <View style={styles.modalOverlay}>
            <TouchableWithoutFeedback>
              <View style={styles.modalSheet}>
                <View style={styles.modalHandle} />
                <Text style={styles.modalTitle}>
                  {timePicking === 'start' ? "Heure de début" : timePicking === 'end' ? "Heure de fin" : "Sélectionner l'heure"}
                </Text>
                <FlatList
                  data={TIMES}
                  initialNumToRender={48}
                  keyExtractor={(item) => item}
                  renderItem={({ item }) => (
                    <Pressable onPress={() => selectTime(item)} style={styles.modalListItem}>
                      <Text style={styles.modalListItemText}>{item}</Text>
                    </Pressable>
                  )}
                />
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { paddingBottom: 24 },
  header: { paddingHorizontal: 16, paddingVertical: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#fff', borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: '#E5E7EB' },
  brandLeft: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  brandText: { fontSize: 20, fontWeight: '800', color: '#2563EB' },
  headerActions: { flexDirection: 'row', alignItems: 'center' },
  headerLink: { paddingHorizontal: 10, paddingVertical: 8, borderRadius: 10, backgroundColor: '#EFF6FF' },
  headerLinkText: { color: '#2563EB', fontWeight: '600' },
  screenTitle: { fontSize: 24, fontWeight: '800', color: '#111827' },
  screenSubtitle: { marginTop: 2, color: '#6B7280' },
  card: { backgroundColor: 'rgba(255,255,255,0.9)', borderRadius: 20, padding: 16, marginHorizontal: 16, marginTop: 12, borderWidth: 1, borderColor: 'rgba(255,255,255,0.6)', shadowColor: '#0F172A', shadowOpacity: 0.12, shadowRadius: 20, shadowOffset: { width: 0, height: 8 }, elevation: 2 },
  formRow: { marginBottom: 10 },
  label: { marginBottom: 6, color: '#374151', fontWeight: '700' },
  input: { paddingHorizontal: 12, paddingVertical: 10, borderRadius: 12, borderWidth: 1, borderColor: '#E5E7EB', color: '#111827', backgroundColor: 'transparent' },
  twoCols: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 10 },
  chipsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 10 },
  chip: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 999, backgroundColor: '#F3F4F6', borderWidth: 1, borderColor: '#E5E7EB' },
  chipActive: { backgroundColor: '#DBEAFE', borderColor: '#93C5FD' },
  chipText: { color: '#374151', fontWeight: '700' },
  chipTextActive: { color: '#2563EB' },
  primaryBtn: { backgroundColor: '#2563EB', paddingVertical: 12, borderRadius: 14, alignItems: 'center', shadowColor: '#1D4ED8', shadowOpacity: 0.2, shadowRadius: 12, shadowOffset: { width: 0, height: 6 }, elevation: 2 },
  primaryBtnText: { color: '#fff', fontWeight: '800' },
  secondaryBtn: { flex: 1, backgroundColor: '#EFF6FF', paddingVertical: 12, borderRadius: 12, alignItems: 'center', borderWidth: 1, borderColor: '#BFDBFE' },
  secondaryBtnText: { color: '#2563EB', fontWeight: '800' },
  controlsRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 12 },
  stepperWrap: { marginBottom: 12 },
  stepperRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 },
  stepperItem: { alignItems: 'center', width: '28%' },
  stepperCircle: { width: 28, height: 28, borderRadius: 14, borderWidth: 2, borderColor: '#E5E7EB', alignItems: 'center', justifyContent: 'center', backgroundColor: '#fff', shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 4, shadowOffset: { width: 0, height: 2 }, elevation: 1 },
  stepperCircleActive: { borderColor: '#2563EB', backgroundColor: '#DBEAFE' },
  stepperNum: { color: '#6B7280', fontWeight: '800' },
  stepperNumActive: { color: '#1D4ED8' },
  stepperLabel: { marginTop: 4, color: '#6B7280', fontSize: 12, fontWeight: '700' },
  stepperLabelActive: { color: '#1F2937' },
  stepperConnector: { flex: 1, height: 2, backgroundColor: '#E5E7EB', marginHorizontal: 6, borderRadius: 2 },
  stepperConnectorActive: { backgroundColor: '#93C5FD' },
  progressOuter: { height: 6, backgroundColor: '#EEF2FF', borderRadius: 999, overflow: 'hidden' },
  progressInner: { height: '100%', backgroundColor: '#2563EB' },
  
  // New input styles with icons
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  inputError: {
    borderColor: '#EF4444',
    borderWidth: 2,
  },
  inputSuccess: {
    borderColor: '#10B981',
    borderWidth: 2,
  },
  inputWithIcon: {
    flex: 1,
    fontSize: 16,
    color: '#111827',
    marginLeft: 8,
    paddingVertical: 0,
  },
  inputIcon: {
    marginRight: 4,
  },
  eyeIcon: {
    padding: 4,
    marginLeft: 4,
  },
  validationIcon: {
    marginLeft: 8,
  },
  
  // Helper text styles
  helper: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 4,
    marginLeft: 4,
  },
  helperError: {
    fontSize: 12,
    color: '#EF4444',
    marginTop: 4,
    marginLeft: 4,
    fontWeight: '500',
  },
  helperSuccess: {
    fontSize: 12,
    color: '#10B981',
    marginTop: 4,
    marginLeft: 4,
    fontWeight: '500',
  },
  
  // Password requirements styles
  passwordRequirements: {
    marginTop: 8,
    padding: 12,
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  requirementsTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  requirementItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
    gap: 8,
  },
  requirementText: {
    fontSize: 12,
    color: '#6B7280',
  },
  requirementMet: {
    color: '#10B981',
    fontWeight: '500',
  },
  // Selectors
  selectRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  selectText: {
    color: '#111827',
  },
  // Modals
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    maxHeight: '70%',
  },
  modalHandle: {
    alignSelf: 'center',
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#E5E7EB',
    marginBottom: 10,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#111827',
    marginBottom: 10,
  },
  modalSearch: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: '#111827',
    marginBottom: 10,
  },
  modalListItem: {
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#E5E7EB',
  },
  modalListItemText: {
    color: '#111827',
    fontWeight: '600',
  },
});
