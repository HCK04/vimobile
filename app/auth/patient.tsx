import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Alert,
  Animated,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  Image,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { api } from '../../lib/api';

export default function PatientAuthScreen() {
  const router = useRouter();
  const { sinscrire, next } = useLocalSearchParams<{ sinscrire?: string; next?: string }>();
  const [tab, setTab] = useState<'login' | 'register'>('login');
  const [registerStep, setRegisterStep] = useState<1 | 2 | 3>(1);
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const slideAnim = useRef(new Animated.Value(0)).current;
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (tab === 'register') setRegisterStep(1);
  }, [tab]);

  useEffect(() => {
    if (sinscrire) setTab('register');
  }, [sinscrire]);

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 220, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 220, useNativeDriver: true }),
    ]).start();
  }, [registerStep, fadeAnim, slideAnim]);

  // Login form
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  // Register form (patient)
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [password2, setPassword2] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [age, setAge] = useState('');
  const [gender, setGender] = useState<'homme' | 'femme' | 'autre' | ''>('');
  const [blood, setBlood] = useState('');

  const allergyOptions = useMemo(() => [
    'Aucune', 'Pollens', 'Acariens', 'Moisissures', 'Animaux', 'Aliments', 'Autres'
  ], []);
  const chronicOptions = useMemo(() => [
    'Aucune', 'Diabète', 'Hypertension', 'Asthme', 'Maladie cardiaque', 'Cancer', 'Thyroïde', 'Autres'
  ], []);

  const [allergies, setAllergies] = useState<string[]>([]);
  const [chronics, setChronics] = useState<string[]>([]);

  const toggleMulti = (arr: string[], setArr: (s: string[]) => void, val: string) => {
    if (val === 'Aucune') {
      // Selecting "Aucune" clears others; selecting again clears it
      if (arr.length === 1 && arr[0] === 'Aucune') {
        setArr([]);
      } else {
        setArr(['Aucune']);
      }
      return;
    }
    const next = arr.filter((x) => x !== 'Aucune');
    const has = next.includes(val);
    setArr(has ? next.filter((x) => x !== val) : [...next, val]);
  };

  const onSubmitLogin = async () => {
    if (!loginEmail || !loginPassword) {
      Alert.alert('Connexion', 'Veuillez saisir votre email et mot de passe.');
      return;
    }
    try {
      setLoading(true);
      const res = await api.login({ email: loginEmail, password: loginPassword });
      const roleName = res?.user?.role?.name || res?.user?.role_name || '';
      // Navigate based on role similar to web
      if (['medecin', 'kine', 'orthophoniste', 'psychologue'].includes(roleName)) {
        router.replace('/(tabs)/profil');
      } else if (roleName === 'patient') {
        const safeNext = typeof next === 'string' && next.startsWith('/') && !next.startsWith('//') ? next : null;
        router.replace((safeNext as any) || ('/(tabs)/accueil' as any));
      } else if (['clinique', 'pharmacie', 'parapharmacie', 'labo_analyse', 'centre_radiologie'].includes(roleName)) {
        router.replace('/(tabs)/profil');
      } else {
        router.replace('/(tabs)/accueil');
      }
    } catch (e: any) {
      const msg = e?.response?.data?.message || e?.message || "Une erreur est survenue";
      Alert.alert('Connexion', msg);
    } finally {
      setLoading(false);
    }
  };

  const onSubmitRegister = async () => {
    // Interface-only validation subset
    if (!email || !password || !password2) {
      Alert.alert('Inscription', 'Veuillez compléter votre compte (email et mot de passe).');
      setRegisterStep(1);
      return;
    }
    if (password.length < 8) {
      Alert.alert('Inscription', 'Le mot de passe doit contenir au moins 8 caractères.');
      setRegisterStep(1);
      return;
    }
    if (password !== password2) {
      Alert.alert('Inscription', 'Les mots de passe ne correspondent pas.');
      setRegisterStep(1);
      return;
    }
    if (!name || !phone || !age || !gender) {
      Alert.alert('Inscription', 'Veuillez compléter vos informations personnelles.');
      setRegisterStep(2);
      return;
    }
    try {
      setLoading(true);
      const res = await api.registerPatient({
        name,
        email,
        password,
        password_confirmation: password2,
        phone,
        age,
        gender,
        blood_type: blood,
        allergies,
        chronic_diseases: chronics,
        role_id: 1,
      });
      const roleName = res?.user?.role?.name || res?.user?.role_name || '';
      if (roleName === 'patient') {
        router.replace('/(tabs)/accueil');
      } else {
        router.replace('/(tabs)/profil');
      }
    } catch (e: any) {
      const data = e?.response?.data;
      const errMsg = (data && (data.message || data.error)) || e?.message || 'Une erreur est survenue';
      Alert.alert('Inscription', errMsg);
    } finally {
      setLoading(false);
    }
  };

  const validateStep1 = () => {
    if (!email) { Alert.alert('Étape 1', 'Email requis.'); return false; }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { Alert.alert('Étape 1', 'Email invalide.'); return false; }
    if (!phone) { Alert.alert('Étape 1', 'Téléphone requis.'); return false; }
    if (!password || !password2) { Alert.alert('Étape 1', 'Mot de passe et confirmation requis.'); return false; }
    if (password.length < 8) { Alert.alert('Étape 1', 'Le mot de passe doit contenir au moins 8 caractères.'); return false; }
    if (!/[a-z]/.test(password)) { Alert.alert('Étape 1', 'Le mot de passe doit contenir une lettre minuscule.'); return false; }
    if (!/[A-Z]/.test(password)) { Alert.alert('Étape 1', 'Le mot de passe doit contenir une lettre majuscule.'); return false; }
    if (!/\d/.test(password)) { Alert.alert('Étape 1', 'Le mot de passe doit contenir un chiffre.'); return false; }
    if (!/[@$!%*?&]/.test(password)) { Alert.alert('Étape 1', 'Le mot de passe doit contenir un caractère spécial (@$!%*?&).'); return false; }
    if (password !== password2) { Alert.alert('Étape 1', 'Les mots de passe ne correspondent pas.'); return false; }
    return true;
  };

  const validateStep2 = () => {
    if (!name) { Alert.alert('Étape 2', 'Nom complet requis.'); return false; }
    if (!phone) { Alert.alert('Étape 2', 'Téléphone requis.'); return false; }
    if (!age) { Alert.alert('Étape 2', 'Âge requis.'); return false; }
    if (!gender) { Alert.alert('Étape 2', 'Genre requis.'); return false; }
    return true;
  };

  const goNext = async () => {
    if (registerStep === 1) {
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
      ]).start(() => {
        setRegisterStep(2);
        setLoading(false);
      });
      return;
    }
    if (registerStep === 2) {
      if (!validateStep2()) return;
      Animated.parallel([
        Animated.timing(fadeAnim, { toValue: 0, duration: 150, useNativeDriver: true }),
        Animated.timing(slideAnim, { toValue: 8, duration: 150, useNativeDriver: true }),
      ]).start(() => setRegisterStep(3));
    }
  };

  const goBack = () => {
    if (registerStep > 1) {
      Animated.parallel([
        Animated.timing(fadeAnim, { toValue: 0, duration: 150, useNativeDriver: true }),
        Animated.timing(slideAnim, { toValue: 8, duration: 150, useNativeDriver: true }),
      ]).start(() => setRegisterStep((s) => (s - 1) as 1 | 2 | 3));
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#F8FAFC' }}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.brandLeft}>
              <Ionicons name="medkit" size={24} color="#2563EB" />
              <Text style={styles.brandText}>Vi-santé</Text>
            </View>
          </View>

          {/* Title */}
          <View style={{ paddingHorizontal: 16, paddingTop: 8, paddingBottom: 4 }}>
            <Text style={styles.screenTitle}>Portail Patient</Text>
            <Text style={styles.screenSubtitle}>Connectez-vous ou créez un compte</Text>
          </View>

          {/* Tabs */}
          <View style={styles.tabs}>
            <Pressable
              onPress={() => setTab('login')}
              style={[styles.tabBtn, tab === 'login' && styles.tabBtnActive]}
            >
              <Text style={[styles.tabText, tab === 'login' && styles.tabTextActive]}>Se connecter</Text>
            </Pressable>
            <Pressable
              onPress={() => setTab('register')}
              style={[styles.tabBtn, tab === 'register' && styles.tabBtnActive]}
            >
              <Text style={[styles.tabText, tab === 'register' && styles.tabTextActive]}>S'inscrire</Text>
            </Pressable>
          </View>

          {tab === 'login' ? (
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Connexion</Text>
              <View style={styles.formRow}>
                <Text style={styles.label}>Email</Text>
                <TextInput
                  value={loginEmail}
                  onChangeText={setLoginEmail}
                  autoCapitalize="none"
                  keyboardType="email-address"
                  placeholder="vous@exemple.com"
                  placeholderTextColor="#9CA3AF"
                  style={styles.input}
                />
              </View>
              <View style={styles.formRow}>
                <Text style={styles.label}>Mot de passe</Text>
                <TextInput
                  value={loginPassword}
                  onChangeText={setLoginPassword}
                  secureTextEntry
                  placeholder="••••••••"
                  placeholderTextColor="#9CA3AF"
                  style={styles.input}
                />
              </View>
              <Pressable onPress={onSubmitLogin} style={styles.primaryBtn}>
                <Text style={styles.primaryBtnText}>Se connecter</Text>
              </Pressable>
            </View>
          ) : (
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Créer un compte</Text>

              {/* Stepper */}
              <View style={styles.stepperWrap}>
                <View style={styles.stepperRow}>
                  <View style={styles.stepperItem}>
                    <View style={[styles.stepperCircle, registerStep >= 1 && styles.stepperCircleActive]}>
                      <Text style={[styles.stepperNum, registerStep >= 1 && styles.stepperNumActive]}>1</Text>
                    </View>
                    <Text style={[styles.stepperLabel, registerStep >= 1 && styles.stepperLabelActive]}>Compte</Text>
                  </View>
                  <View style={[styles.stepperConnector, registerStep >= 2 && styles.stepperConnectorActive]} />
                  <View style={styles.stepperItem}>
                    <View style={[styles.stepperCircle, registerStep >= 2 && styles.stepperCircleActive]}>
                      <Text style={[styles.stepperNum, registerStep >= 2 && styles.stepperNumActive]}>2</Text>
                    </View>
                    <Text style={[styles.stepperLabel, registerStep >= 2 && styles.stepperLabelActive]}>Identité</Text>
                  </View>
                  <View style={[styles.stepperConnector, registerStep >= 3 && styles.stepperConnectorActive]} />
                  <View style={styles.stepperItem}>
                    <View style={[styles.stepperCircle, registerStep >= 3 && styles.stepperCircleActive]}>
                      <Text style={[styles.stepperNum, registerStep >= 3 && styles.stepperNumActive]}>3</Text>
                    </View>
                    <Text style={[styles.stepperLabel, registerStep >= 3 && styles.stepperLabelActive]}>Médical</Text>
                  </View>
                </View>
                <View style={styles.progressOuter}>
                  <View style={[styles.progressInner, { width: `${(registerStep / 3) * 100}%` }]} />
                </View>
              </View>

              {/* Step content */}
              <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
              {registerStep === 1 && (
                <View>
                  <View style={styles.formRow}>
                    <Text style={styles.label}>Email</Text>
                    <TextInput value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" placeholder="vous@exemple.com" placeholderTextColor="#9CA3AF" style={styles.input} />
                  </View>
                  <View style={styles.formRow}>
                    <Text style={styles.label}>Téléphone</Text>
                    <TextInput value={phone} onChangeText={setPhone} keyboardType="phone-pad" placeholder="06XXXXXXXX" placeholderTextColor="#9CA3AF" style={styles.input} />
                  </View>
                  <View style={styles.twoCols}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.label}>Mot de passe</Text>
                      <TextInput value={password} onChangeText={setPassword} secureTextEntry placeholder="••••••••" placeholderTextColor="#9CA3AF" style={styles.input} />
                    </View>
                    <View style={{ width: 12 }} />
                    <View style={{ flex: 1 }}>
                      <Text style={styles.label}>Confirmation</Text>
                      <TextInput value={password2} onChangeText={setPassword2} secureTextEntry placeholder="••••••••" placeholderTextColor="#9CA3AF" style={styles.input} />
                    </View>
                  </View>
                </View>
              )}

              {registerStep === 2 && (
                <View>
                  <View style={styles.formRow}>
                    <Text style={styles.label}>Nom complet</Text>
                    <TextInput value={name} onChangeText={setName} placeholder="Votre nom" placeholderTextColor="#9CA3AF" style={styles.input} />
                  </View>
                  <View style={styles.twoCols}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.label}>Âge</Text>
                      <TextInput value={age} onChangeText={setAge} keyboardType="number-pad" placeholder="Ex. 30" placeholderTextColor="#9CA3AF" style={styles.input} />
                    </View>
                    <View style={{ width: 12 }} />
                    <View style={{ flex: 1 }}>
                      <Text style={styles.label}>Téléphone</Text>
                      <TextInput value={phone} onChangeText={setPhone} keyboardType="phone-pad" placeholder="06XXXXXXXX" placeholderTextColor="#9CA3AF" style={styles.input} />
                    </View>
                  </View>
                  <Text style={styles.label}>Genre</Text>
                  <View style={styles.chipsRow}>
                    {[
                      { key: 'homme', label: 'Homme' },
                      { key: 'femme', label: 'Femme' },
                      { key: 'autre', label: 'Autre' },
                    ].map((g) => (
                      <Pressable
                        key={g.key}
                        onPress={() => setGender(g.key as any)}
                        style={[styles.chip, gender === g.key && styles.chipActive]}
                      >
                        <Text style={[styles.chipText, gender === g.key && styles.chipTextActive]}>{g.label}</Text>
                      </Pressable>
                    ))}
                  </View>
                </View>
              )}

              {registerStep === 3 && (
                <View>
                  <Text style={styles.label}>Groupe sanguin</Text>
                  <View style={styles.chipsRow}>
                    {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map((b) => (
                      <Pressable key={b} onPress={() => setBlood(b)} style={[styles.chip, blood === b && styles.chipActive]}>
                        <Text style={[styles.chipText, blood === b && styles.chipTextActive]}>{b}</Text>
                      </Pressable>
                    ))}
                  </View>
                  <Text style={styles.label}>Allergies</Text>
                  <View style={styles.chipsRow}>
                    {allergyOptions.map((opt) => (
                      <Pressable key={opt} onPress={() => toggleMulti(allergies, setAllergies, opt)} style={[styles.chip, (allergies.includes(opt)) && styles.chipActive]}>
                        <Text style={[styles.chipText, (allergies.includes(opt)) && styles.chipTextActive]}>{opt}</Text>
                      </Pressable>
                    ))}
                  </View>
                  <Text style={styles.label}>Maladies chroniques</Text>
                  <View style={styles.chipsRow}>
                    {chronicOptions.map((opt) => (
                      <Pressable key={opt} onPress={() => toggleMulti(chronics, setChronics, opt)} style={[styles.chip, (chronics.includes(opt)) && styles.chipActive]}>
                        <Text style={[styles.chipText, (chronics.includes(opt)) && styles.chipTextActive]}>{opt}</Text>
                      </Pressable>
                    ))}
                  </View>
                </View>
              )}
              </Animated.View>

              {/* Controls */}
              <View style={styles.controlsRow}>
                {registerStep > 1 ? (
                  <Pressable disabled={loading} onPress={goBack} style={[styles.secondaryBtn, loading && { opacity: 0.6 }]}>
                    <Text style={styles.secondaryBtnText}>Retour</Text>
                  </Pressable>
                ) : <View style={{ flex: 1 }} />}

                {registerStep < 3 ? (
                  <Pressable disabled={loading} onPress={goNext} style={[styles.primaryBtn, { flex: 1 }, loading && { opacity: 0.7 }]}>
                    <Text style={styles.primaryBtnText}>{loading ? 'Veuillez patienter...' : 'Suivant'}</Text>
                  </Pressable>
                ) : (
                  <Pressable disabled={loading} onPress={onSubmitRegister} style={[styles.primaryBtn, { flex: 1 }, loading && { opacity: 0.7 }]}>
                    <Text style={styles.primaryBtnText}>{loading ? 'Création...' : 'Créer mon compte'}</Text>
                  </Pressable>
                )}
              </View>

              <Text style={styles.disclaimer}>
                En continuant, vous acceptez notre engagement de confidentialité (CNDP - Loi 09-08).
              </Text>
            </View>
          )}

          {/* Footer */}
          <View style={{ paddingVertical: 24, alignItems: 'center' }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8 }}>
              <Ionicons name="heart" size={18} color="#2563EB" />
              <Text style={{ color: '#2563EB', fontWeight: '700', fontSize: 16 }}>Vi-Santé</Text>
            </View>
            <Text style={{ color: '#6B7280', fontSize: 12 }}>&copy; 2025 Vi-Santé. Tous droits réservés.</Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingBottom: 24,
  },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#fff',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#E5E7EB',
  },
  brandLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  brandText: {
    fontSize: 20,
    fontWeight: '800',
    color: '#2563EB',
  },
  screenTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#111827',
  },
  screenSubtitle: {
    marginTop: 2,
    color: '#6B7280',
  },
  tabs: {
    marginTop: 12,
    paddingHorizontal: 16,
    flexDirection: 'row',
    backgroundColor: '#EEF2FF',
    marginHorizontal: 16,
    borderRadius: 12,
    padding: 4,
    alignSelf: 'stretch',
  },
  tabBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
  },
  tabBtnActive: {
    backgroundColor: '#fff',
  },
  tabText: {
    color: '#1F2937',
    fontWeight: '700',
  },
  tabTextActive: {
    color: '#2563EB',
  },
  card: {
    backgroundColor: 'rgba(255,255,255,0.9)',
    borderRadius: 20,
    padding: 16,
    marginHorizontal: 16,
    marginTop: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.6)',
    shadowColor: '#0F172A',
    shadowOpacity: 0.12,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 8 },
    elevation: 2,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#111827',
    marginBottom: 10,
  },
  formRow: {
    marginBottom: 10,
  },
  label: {
    marginBottom: 6,
    color: '#374151',
    fontWeight: '700',
  },
  input: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    color: '#111827',
    backgroundColor: 'transparent',
  },
  twoCols: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  chipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 10,
  },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  chipActive: {
    backgroundColor: '#DBEAFE',
    borderColor: '#93C5FD',
  },
  chipText: {
    color: '#374151',
    fontWeight: '700',
  },
  chipTextActive: {
    color: '#2563EB',
  },
  primaryBtn: {
    backgroundColor: '#2563EB',
    paddingVertical: 12,
    borderRadius: 14,
    alignItems: 'center',
    shadowColor: '#1D4ED8',
    shadowOpacity: 0.2,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 2,
  },
  primaryBtnText: {
    color: '#fff',
    fontWeight: '800',
  },
  disclaimer: {
    marginTop: 8,
    color: '#6B7280',
    fontSize: 12,
  },
  stepperWrap: {
    marginBottom: 12,
  },
  stepperRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  stepperItem: {
    alignItems: 'center',
    width: '28%',
  },
  stepperCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: '#E5E7EB',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
  },
  stepperCircleActive: {
    borderColor: '#2563EB',
    backgroundColor: '#DBEAFE',
  },
  stepperNum: {
    color: '#6B7280',
    fontWeight: '800',
  },
  stepperNumActive: {
    color: '#1D4ED8',
  },
  stepperLabel: {
    marginTop: 4,
    color: '#6B7280',
    fontSize: 12,
    fontWeight: '700',
  },
  stepperLabelActive: {
    color: '#1F2937',
  },
  stepperConnector: {
    flex: 1,
    height: 2,
    backgroundColor: '#E5E7EB',
    marginHorizontal: 6,
    borderRadius: 2,
  },
  stepperConnectorActive: {
    backgroundColor: '#93C5FD',
  },
  progressOuter: {
    height: 6,
    backgroundColor: '#EEF2FF',
    borderRadius: 999,
    overflow: 'hidden',
  },
  progressInner: {
    height: '100%',
    backgroundColor: '#2563EB',
  },
  controlsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 12,
  },
  secondaryBtn: {
    flex: 1,
    backgroundColor: '#EFF6FF',
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  secondaryBtnText: {
    color: '#2563EB',
    fontWeight: '800',
  },
});
