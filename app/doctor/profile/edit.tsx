import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, ActivityIndicator, Pressable, StyleSheet, ScrollView, Alert, TextInput, KeyboardAvoidingView, Platform, Image, Linking } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import * as Application from 'expo-application';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { apiClient } from '../../../lib/apiClient';
import { getAuth } from '../../../lib/api';
import { clearAuth } from '../../../lib/auth';
import { Palette } from '../../../constants/Colors';

const ONBOARDING_KEY = '@vi-sante:onboarding_completed';

const PAYMENT_OPTIONS = [
  { key: 'especes', label: 'Espèces' },
  { key: 'carte', label: 'Carte bancaire' },
  { key: 'cheque', label: 'Chèque' },
  { key: 'virement', label: 'Virement' },
];

const DAYS_OPTIONS = [
  { key: 'lundi', label: 'Lun' },
  { key: 'mardi', label: 'Mar' },
  { key: 'mercredi', label: 'Mer' },
  { key: 'jeudi', label: 'Jeu' },
  { key: 'vendredi', label: 'Ven' },
  { key: 'samedi', label: 'Sam' },
  { key: 'dimanche', label: 'Dim' },
];

export default function ProfileEditScreen() {
  const router = useRouter();
  const { user } = getAuth();
  const roleName = (user?.role?.name || (user as any)?.role_name || '').toLowerCase();
  const isOrg = ['clinique', 'pharmacie', 'parapharmacie', 'labo_analyse', 'centre_radiologie'].includes(roleName);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);

  // User fields
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');

  // Profile image
  const [profileImage, setProfileImage] = useState<string | null>(null);

  // Common professional/org fields
  const [presentation, setPresentation] = useState('');
  const [adresse, setAdresse] = useState('');
  const [ville, setVille] = useState('');
  const [horaireStart, setHoraireStart] = useState('');
  const [horaireEnd, setHoraireEnd] = useState('');
  const [informationsPratiques, setInformationsPratiques] = useState('');
  const [contactUrgence, setContactUrgence] = useState('');

  // New fields
  const [diplomas, setDiplomas] = useState('');
  const [moyensPaiement, setMoyensPaiement] = useState<string[]>([]);
  const [joursDisponibles, setJoursDisponibles] = useState<string[]>([]);

  // Professional-specific fields
  const [specialty, setSpecialty] = useState('');
  const [experienceYears, setExperienceYears] = useState('');

  // Organization-specific fields
  const [nomEtablissement, setNomEtablissement] = useState('');
  const [responsableName, setResponsableName] = useState('');
  const [orgPresentation, setOrgPresentation] = useState('');
  const [servicesDescription, setServicesDescription] = useState('');

  const loadProfile = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await apiClient.get('/professional/profile');

      // User fields
      setName(data.name || '');
      setEmail(data.email || '');
      setPhone(data.phone || '');

      // Get the appropriate profile based on role
      const profile =
        data.medecinProfile ||
        data.kineProfile ||
        data.orthophonisteProfile ||
        data.psychologueProfile ||
        data.cliniqueProfile ||
        data.pharmacieProfile ||
        data.parapharmacieProfile ||
        data.laboAnalyseProfile ||
        data.centreRadiologieProfile || {};

      // Profile image
      const imgField = isOrg ? profile.etablissement_image : profile.profile_image;
      setProfileImage(imgField || null);

      // Common fields
      setPresentation(profile.presentation || '');
      setAdresse(profile.adresse || '');
      setVille(profile.ville || '');
      setHoraireStart(profile.horaire_start || '');
      setHoraireEnd(profile.horaire_end || '');
      setInformationsPratiques(profile.informations_pratiques || '');
      setContactUrgence(profile.contact_urgence || '');

      // New fields
      setDiplomas(profile.diplomes || profile.diplomas || '');

      // Parse payment methods
      try {
        const pm = profile.moyens_paiement;
        if (pm) {
          const parsed = typeof pm === 'string' ? JSON.parse(pm) : pm;
          setMoyensPaiement(Array.isArray(parsed) ? parsed : []);
        }
      } catch { setMoyensPaiement([]); }

      // Parse available days
      try {
        const jd = profile.jours_disponibles;
        if (jd) {
          const parsed = typeof jd === 'string' ? JSON.parse(jd) : jd;
          setJoursDisponibles(Array.isArray(parsed) ? parsed : []);
        }
      } catch { setJoursDisponibles([]); }

      // Professional fields
      if (!isOrg) {
        // Parse specialty if JSON
        let spec = profile.specialty || '';
        try {
          const parsed = JSON.parse(spec);
          spec = Array.isArray(parsed) ? parsed.join(', ') : spec;
        } catch {
          // Keep as-is if not JSON
        }
        setSpecialty(spec);
        setExperienceYears(String(profile.experience_years || ''));
      }

      // Organization fields
      if (isOrg) {
        setNomEtablissement(
          profile.nom_clinique ||
          profile.nom_pharmacie ||
          profile.nom_parapharmacie ||
          profile.nom_labo ||
          profile.nom_centre ||
          ''
        );
        setResponsableName(profile.responsable_name || profile.gerant_name || '');
        setOrgPresentation(profile.org_presentation || profile.clinic_presentation || '');
        setServicesDescription(profile.services_description || profile.clinic_services_description || '');
      }
    } catch (e) {
      Alert.alert('Erreur', 'Impossible de charger le profil');
    } finally {
      setLoading(false);
    }
  }, [isOrg]);

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert('Erreur', 'Le nom est requis');
      return;
    }
    if (!email.trim()) {
      Alert.alert('Erreur', 'L\'email est requis');
      return;
    }

    setSaving(true);
    try {
      const payload: any = {
        name: name.trim(),
        email: email.trim(),
        phone: phone.trim(),
        presentation: presentation.trim(),
        address: adresse.trim(),
        ville: ville.trim(),
        horaire_start: horaireStart.trim(),
        horaire_end: horaireEnd.trim(),
        informations_pratiques: informationsPratiques.trim(),
        contact_urgence: contactUrgence.trim(),
        // New fields
        diplomes: diplomas.trim(),
        moyens_paiement: JSON.stringify(moyensPaiement),
        jours_disponibles: JSON.stringify(joursDisponibles),
      };

      // Add professional-specific fields
      if (!isOrg) {
        if (specialty.trim()) payload.specialty = specialty.trim();
        if (experienceYears.trim()) payload.experience_years = experienceYears.trim();
      }

      // Add organization-specific fields
      if (isOrg) {
        // Map to correct field name based on role
        if (roleName === 'clinique') {
          payload.nom_clinique = nomEtablissement.trim();
          payload.clinic_presentation = orgPresentation.trim();
          payload.clinic_services_description = servicesDescription.trim();
        } else if (roleName === 'pharmacie') {
          payload.nom_pharmacie = nomEtablissement.trim();
        } else if (roleName === 'parapharmacie') {
          payload.nom_parapharmacie = nomEtablissement.trim();
        } else if (roleName === 'labo_analyse') {
          payload.nom_labo = nomEtablissement.trim();
        } else if (roleName === 'centre_radiologie') {
          payload.nom_centre = nomEtablissement.trim();
        }
        payload.responsable_name = responsableName.trim();
        payload.org_presentation = orgPresentation.trim();
        payload.services_description = servicesDescription.trim();
      }

      await apiClient.post('/professional/profile/update', payload);
      Alert.alert('Succès', 'Profil mis à jour avec succès', [
        { text: 'OK', onPress: () => router.back() }
      ]);
    } catch (e: any) {
      const msg = e?.response?.data?.message || e?.message || 'Impossible de mettre à jour le profil';
      Alert.alert('Erreur', msg);
    } finally {
      setSaving(false);
    }
  };

  const pickImage = async () => {
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permissionResult.granted) {
      Alert.alert('Permission requise', 'Veuillez autoriser l\'accès à la galerie photo.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      setUploadingImage(true);
      try {
        const formData = new FormData();
        const uri = result.assets[0].uri;
        const filename = uri.split('/').pop() || 'photo.jpg';
        formData.append('image', {
          uri,
          type: 'image/jpeg',
          name: filename,
        } as any);

        const response = await apiClient.post('/professional/profile/image', formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });

        if (response.data?.path) {
          setProfileImage(response.data.path);
          Alert.alert('Succès', 'Photo de profil mise à jour');
        }
      } catch (e: any) {
        Alert.alert('Erreur', e?.response?.data?.error || 'Impossible de télécharger l\'image');
      } finally {
        setUploadingImage(false);
      }
    }
  };

  const togglePayment = (key: string) => {
    setMoyensPaiement(prev =>
      prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key]
    );
  };

  const toggleDay = (key: string) => {
    setJoursDisponibles(prev =>
      prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key]
    );
  };

  const handleLogout = () => {
    Alert.alert(
      'Déconnexion',
      'Êtes-vous sûr de vouloir vous déconnecter ?',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Déconnecter',
          style: 'destructive',
          onPress: async () => {
            await clearAuth();
            await AsyncStorage.removeItem(ONBOARDING_KEY);
            router.replace('/onboarding');
          },
        },
      ]
    );
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      'Supprimer mon compte',
      'Cette action est irréversible. Toutes vos données seront définitivement supprimées.',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Supprimer définitivement',
          style: 'destructive',
          onPress: async () => {
            try {
              await apiClient.delete('/user');
              await clearAuth();
              await AsyncStorage.removeItem(ONBOARDING_KEY);
              Alert.alert('Compte supprimé', 'Votre compte a été supprimé avec succès.');
              router.replace('/onboarding');
            } catch (error: any) {
              const msg = error?.response?.data?.message || 'Impossible de supprimer le compte';
              Alert.alert('Erreur', msg);
            }
          },
        },
      ]
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#2563EB" />
          <Text style={styles.loadingText}>Chargement...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={Palette.text} />
        </Pressable>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle}>Modifier le profil</Text>
          <Text style={styles.headerSubtitle}>Informations {isOrg ? 'de l\'établissement' : 'professionnelles'}</Text>
        </View>
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 25}
        style={{ flex: 1 }}
      >
        <ScrollView
          showsVerticalScrollIndicator={false}
          style={styles.scrollView}
          keyboardShouldPersistTaps="handled"
        >
          {/* Profile Image Section */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <View style={[styles.sectionIconContainer, { backgroundColor: '#ECFDF5' }]}>
                <Ionicons name="camera" size={24} color="#059669" />
              </View>
              <Text style={styles.sectionTitle}>Photo de profil</Text>
            </View>

            <View style={styles.card}>
              <View style={styles.imageSection}>
                <Pressable onPress={pickImage} disabled={uploadingImage} style={styles.avatarContainer}>
                  {profileImage ? (
                    <Image
                      source={{ uri: profileImage.startsWith('http') ? profileImage : `${process.env.EXPO_PUBLIC_API_URL?.replace('/api', '')}${profileImage}` }}
                      style={styles.avatar}
                    />
                  ) : (
                    <View style={styles.avatarPlaceholder}>
                      <Ionicons name="person" size={40} color={Palette.textSecondary} />
                    </View>
                  )}
                  <View style={styles.avatarEditBadge}>
                    {uploadingImage ? (
                      <ActivityIndicator size="small" color="#FFFFFF" />
                    ) : (
                      <Ionicons name="camera" size={14} color="#FFFFFF" />
                    )}
                  </View>
                </Pressable>
                <View style={styles.imageInfo}>
                  <Text style={styles.imageInfoTitle}>
                    {isOrg ? 'Photo de l\'établissement' : 'Photo professionnelle'}
                  </Text>
                  <Text style={styles.imageInfoSubtitle}>
                    Appuyez pour changer
                  </Text>
                </View>
              </View>
            </View>
          </View>

          {/* User Info Section */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionIconContainer}>
                <Ionicons name="person" size={24} color="#2563EB" />
              </View>
              <Text style={styles.sectionTitle}>Informations de compte</Text>
            </View>

            <View style={styles.card}>
              <View style={styles.formGroup}>
                <Text style={styles.label}>Nom complet *</Text>
                <TextInput
                  value={name}
                  onChangeText={setName}
                  placeholder="Nom complet"
                  placeholderTextColor="#9CA3AF"
                  style={styles.input}
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>Email *</Text>
                <TextInput
                  value={email}
                  onChangeText={setEmail}
                  placeholder="email@example.com"
                  placeholderTextColor="#9CA3AF"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  style={styles.input}
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>Téléphone</Text>
                <TextInput
                  value={phone}
                  onChangeText={setPhone}
                  placeholder="+212 6XX XXX XXX"
                  placeholderTextColor="#9CA3AF"
                  keyboardType="phone-pad"
                  style={styles.input}
                />
              </View>
            </View>
          </View>

          {/* Professional-specific Section */}
          {!isOrg && (
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <View style={[styles.sectionIconContainer, { backgroundColor: '#DCFCE7' }]}>
                  <Ionicons name="medical" size={24} color="#10B981" />
                </View>
                <Text style={styles.sectionTitle}>Informations professionnelles</Text>
              </View>

              <View style={styles.card}>
                <View style={styles.formGroup}>
                  <Text style={styles.label}>Spécialité</Text>
                  <TextInput
                    value={specialty}
                    onChangeText={setSpecialty}
                    placeholder="Ex: Cardiologie, Kinésithérapie..."
                    placeholderTextColor="#9CA3AF"
                    style={styles.input}
                  />
                </View>

                <View style={styles.formGroup}>
                  <Text style={styles.label}>Années d'expérience</Text>
                  <TextInput
                    value={experienceYears}
                    onChangeText={setExperienceYears}
                    placeholder="Ex: 10"
                    placeholderTextColor="#9CA3AF"
                    keyboardType="numeric"
                    style={styles.input}
                  />
                </View>
              </View>
            </View>
          )}

          {/* Organization-specific Section */}
          {isOrg && (
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <View style={[styles.sectionIconContainer, { backgroundColor: '#F3E8FF' }]}>
                  <Ionicons name="business" size={24} color="#8B5CF6" />
                </View>
                <Text style={styles.sectionTitle}>Informations de l'établissement</Text>
              </View>

              <View style={styles.card}>
                <View style={styles.formGroup}>
                  <Text style={styles.label}>Nom de l'établissement</Text>
                  <TextInput
                    value={nomEtablissement}
                    onChangeText={setNomEtablissement}
                    placeholder="Nom de votre établissement"
                    placeholderTextColor="#9CA3AF"
                    style={styles.input}
                  />
                </View>

                <View style={styles.formGroup}>
                  <Text style={styles.label}>Responsable</Text>
                  <TextInput
                    value={responsableName}
                    onChangeText={setResponsableName}
                    placeholder="Nom du responsable"
                    placeholderTextColor="#9CA3AF"
                    style={styles.input}
                  />
                </View>

                <View style={styles.formGroup}>
                  <Text style={styles.label}>Présentation de l'établissement</Text>
                  <TextInput
                    value={orgPresentation}
                    onChangeText={setOrgPresentation}
                    placeholder="Décrivez votre établissement..."
                    placeholderTextColor="#9CA3AF"
                    multiline
                    numberOfLines={4}
                    style={[styles.input, styles.textArea]}
                  />
                </View>

                <View style={styles.formGroup}>
                  <Text style={styles.label}>Description des services</Text>
                  <TextInput
                    value={servicesDescription}
                    onChangeText={setServicesDescription}
                    placeholder="Décrivez vos services..."
                    placeholderTextColor="#9CA3AF"
                    multiline
                    numberOfLines={4}
                    style={[styles.input, styles.textArea]}
                  />
                </View>
              </View>
            </View>
          )}

          {/* Location & Contact Section */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <View style={[styles.sectionIconContainer, { backgroundColor: '#FEF3C7' }]}>
                <Ionicons name="location" size={24} color="#F59E0B" />
              </View>
              <Text style={styles.sectionTitle}>Localisation & Contact</Text>
            </View>

            <View style={styles.card}>
              <View style={styles.formGroup}>
                <Text style={styles.label}>Adresse</Text>
                <TextInput
                  value={adresse}
                  onChangeText={setAdresse}
                  placeholder="Adresse complète"
                  placeholderTextColor="#9CA3AF"
                  style={styles.input}
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>Ville</Text>
                <TextInput
                  value={ville}
                  onChangeText={setVille}
                  placeholder="Ville"
                  placeholderTextColor="#9CA3AF"
                  style={styles.input}
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>Contact d'urgence</Text>
                <TextInput
                  value={contactUrgence}
                  onChangeText={setContactUrgence}
                  placeholder="+212 6XX XXX XXX"
                  placeholderTextColor="#9CA3AF"
                  keyboardType="phone-pad"
                  style={styles.input}
                />
              </View>
            </View>
          </View>

          {/* Schedule & Practical Info Section */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <View style={[styles.sectionIconContainer, { backgroundColor: '#EFF6FF' }]}>
                <Ionicons name="time" size={24} color="#2563EB" />
              </View>
              <Text style={styles.sectionTitle}>Horaires</Text>
            </View>

            <View style={styles.card}>
              {!isOrg && (
                <View style={styles.formGroup}>
                  <Text style={styles.label}>Présentation</Text>
                  <TextInput
                    value={presentation}
                    onChangeText={setPresentation}
                    placeholder="Présentez-vous..."
                    placeholderTextColor="#9CA3AF"
                    multiline
                    numberOfLines={4}
                    style={[styles.input, styles.textArea]}
                  />
                </View>
              )}

              <View style={styles.formRow}>
                <View style={[styles.formGroup, { flex: 1 }]}>
                  <Text style={styles.label}>Heure d'ouverture</Text>
                  <TextInput
                    value={horaireStart}
                    onChangeText={setHoraireStart}
                    placeholder="08:00"
                    placeholderTextColor="#9CA3AF"
                    style={styles.input}
                  />
                </View>

                <View style={[styles.formGroup, { flex: 1 }]}>
                  <Text style={styles.label}>Heure de fermeture</Text>
                  <TextInput
                    value={horaireEnd}
                    onChangeText={setHoraireEnd}
                    placeholder="18:00"
                    placeholderTextColor="#9CA3AF"
                    style={styles.input}
                  />
                </View>
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>Informations pratiques</Text>
                <TextInput
                  value={informationsPratiques}
                  onChangeText={setInformationsPratiques}
                  placeholder="Accès, parking, étage..."
                  placeholderTextColor="#9CA3AF"
                  multiline
                  numberOfLines={3}
                  style={[styles.input, styles.textArea]}
                />
              </View>
            </View>
          </View>

          {/* Credentials Section */}
          {!isOrg && (
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <View style={[styles.sectionIconContainer, { backgroundColor: '#FEF3C7' }]}>
                  <Ionicons name="school" size={24} color="#D97706" />
                </View>
                <Text style={styles.sectionTitle}>Diplômes & Formations</Text>
              </View>

              <View style={styles.card}>
                <View style={styles.formGroup}>
                  <Text style={styles.label}>Diplômes et certifications</Text>
                  <TextInput
                    value={diplomas}
                    onChangeText={setDiplomas}
                    placeholder="Ex: Doctorat en médecine, Spécialisation en cardiologie..."
                    placeholderTextColor="#9CA3AF"
                    multiline
                    numberOfLines={4}
                    style={[styles.input, styles.textArea]}
                  />
                </View>
              </View>
            </View>
          )}

          {/* Payment Methods Section */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <View style={[styles.sectionIconContainer, { backgroundColor: '#DCFCE7' }]}>
                <Ionicons name="card" size={24} color="#16A34A" />
              </View>
              <Text style={styles.sectionTitle}>Moyens de paiement</Text>
            </View>

            <View style={styles.card}>
              <View style={styles.chipContainer}>
                {PAYMENT_OPTIONS.map(option => (
                  <Pressable
                    key={option.key}
                    style={[styles.chip, moyensPaiement.includes(option.key) && styles.chipActive]}
                    onPress={() => togglePayment(option.key)}
                  >
                    <Text style={[styles.chipText, moyensPaiement.includes(option.key) && styles.chipTextActive]}>
                      {option.label}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>
          </View>

          {/* Available Days Section */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <View style={[styles.sectionIconContainer, { backgroundColor: '#F3E8FF' }]}>
                <Ionicons name="calendar" size={24} color="#9333EA" />
              </View>
              <Text style={styles.sectionTitle}>Jours de disponibilité</Text>
            </View>

            <View style={styles.card}>
              <View style={styles.chipContainer}>
                {DAYS_OPTIONS.map(option => (
                  <Pressable
                    key={option.key}
                    style={[styles.chip, joursDisponibles.includes(option.key) && styles.chipActive]}
                    onPress={() => toggleDay(option.key)}
                  >
                    <Text style={[styles.chipText, joursDisponibles.includes(option.key) && styles.chipTextActive]}>
                      {option.label}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>
          </View>

          {/* Account Actions Section */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <View style={[styles.sectionIconContainer, { backgroundColor: '#FEE2E2' }]}>
                <Ionicons name="settings" size={24} color="#DC2626" />
              </View>
              <Text style={styles.sectionTitle}>Compte</Text>
            </View>

            <View style={styles.card}>
              <Pressable
                style={styles.accountActionRow}
                onPress={() => Linking.openURL('https://vi-sante.ma/confidentialite')}
              >
                <View style={styles.accountActionLeft}>
                  <Ionicons name="shield-checkmark" size={20} color="#2563EB" />
                  <Text style={styles.accountActionText}>Confidentialité</Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
              </Pressable>

              <View style={styles.accountDivider} />

              <Pressable style={styles.accountActionRow} onPress={handleLogout}>
                <View style={styles.accountActionLeft}>
                  <Ionicons name="log-out" size={20} color="#EF4444" />
                  <Text style={[styles.accountActionText, { color: '#EF4444' }]}>Déconnexion</Text>
                </View>
              </Pressable>

              <View style={styles.accountDivider} />

              <Pressable style={styles.accountActionRow} onPress={handleDeleteAccount}>
                <View style={styles.accountActionLeft}>
                  <Ionicons name="trash" size={20} color="#EF4444" />
                  <Text style={[styles.accountActionText, { color: '#EF4444' }]}>Supprimer mon compte</Text>
                </View>
              </Pressable>
            </View>

            <Text style={styles.versionText}>
              Vi-Santé v{Application.nativeApplicationVersion || '1.0.0'}
            </Text>
          </View>

          {/* Save Button */}
          <View style={styles.section}>
            <Pressable
              onPress={handleSave}
              disabled={saving}
              style={[styles.saveButton, saving && styles.saveButtonDisabled]}
            >
              {saving ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <>
                  <Ionicons name="checkmark-circle" size={20} color="#fff" />
                  <Text style={styles.saveButtonText}>Enregistrer les modifications</Text>
                </>
              )}
            </Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Palette.background,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: Palette.textSecondary,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 20,
    backgroundColor: Palette.surface,
    borderBottomWidth: 1,
    borderBottomColor: Palette.border,
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Palette.background,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: Palette.text,
  },
  headerSubtitle: {
    fontSize: 14,
    color: Palette.textSecondary,
    marginTop: 2,
  },
  scrollView: {
    flex: 1,
  },
  section: {
    paddingHorizontal: 20,
    paddingTop: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Palette.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Palette.text,
  },
  card: {
    backgroundColor: Palette.surface,
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  formGroup: {
    marginBottom: 16,
  },
  formRow: {
    flexDirection: 'row',
    gap: 12,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: Palette.text,
    marginBottom: 8,
  },
  input: {
    backgroundColor: Palette.background,
    borderWidth: 1,
    borderColor: Palette.border,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: Palette.text,
  },
  textArea: {
    minHeight: 100,
    textAlignVertical: 'top',
  },
  // Profile Image styles
  imageSection: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarContainer: {
    position: 'relative',
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Palette.background,
  },
  avatarPlaceholder: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Palette.background,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: Palette.border,
    borderStyle: 'dashed',
  },
  avatarEditBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Palette.primary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: Palette.surface,
  },
  imageInfo: {
    marginLeft: 16,
    flex: 1,
  },
  imageInfoTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Palette.text,
  },
  imageInfoSubtitle: {
    fontSize: 13,
    color: Palette.textSecondary,
    marginTop: 4,
  },
  // Chip styles for payment methods and days
  chipContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: Palette.background,
    borderWidth: 1,
    borderColor: Palette.border,
  },
  chipActive: {
    backgroundColor: Palette.primaryLight,
    borderColor: Palette.primary,
  },
  chipText: {
    fontSize: 14,
    color: Palette.textSecondary,
  },
  chipTextActive: {
    color: Palette.primary,
    fontWeight: '600',
  },
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Palette.primary,
    paddingVertical: 16,
    borderRadius: 12,
    marginBottom: 32,
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: Palette.surface,
    marginLeft: 8,
  },
  // Account actions styles
  accountActionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 14,
  },
  accountActionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  accountActionText: {
    fontSize: 15,
    fontWeight: '600',
    color: Palette.text,
  },
  accountDivider: {
    height: 1,
    backgroundColor: Palette.border,
    marginHorizontal: 14,
  },
  versionText: {
    textAlign: 'center',
    color: Palette.textSecondary,
    fontSize: 12,
    marginTop: 16,
  },
});
