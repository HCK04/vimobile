import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, ActivityIndicator, Pressable, StyleSheet, ScrollView, Alert, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { apiClient } from '../../../lib/apiClient';
import { getAuth } from '../../../lib/api';

export default function ProfileEditScreen() {
  const router = useRouter();
  const { user } = getAuth();
  const roleName = (user?.role?.name || (user as any)?.role_name || '').toLowerCase();
  const isOrg = ['clinique', 'pharmacie', 'parapharmacie', 'labo_analyse', 'centre_radiologie'].includes(roleName);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // User fields
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');

  // Common professional/org fields
  const [presentation, setPresentation] = useState('');
  const [adresse, setAdresse] = useState('');
  const [ville, setVille] = useState('');
  const [horaireStart, setHoraireStart] = useState('');
  const [horaireEnd, setHoraireEnd] = useState('');
  const [informationsPratiques, setInformationsPratiques] = useState('');
  const [contactUrgence, setContactUrgence] = useState('');

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

      // Common fields
      setPresentation(profile.presentation || '');
      setAdresse(profile.adresse || '');
      setVille(profile.ville || '');
      setHoraireStart(profile.horaire_start || '');
      setHoraireEnd(profile.horaire_end || '');
      setInformationsPratiques(profile.informations_pratiques || '');
      setContactUrgence(profile.contact_urgence || '');

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
          <Ionicons name="arrow-back" size={24} color="#111827" />
        </Pressable>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle}>Modifier le profil</Text>
          <Text style={styles.headerSubtitle}>Informations {isOrg ? 'de l\'établissement' : 'professionnelles'}</Text>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} style={styles.scrollView}>
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
            <Text style={styles.sectionTitle}>Horaires & Informations pratiques</Text>
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
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
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
    color: '#6B7280',
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 20,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F9FAFB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111827',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#6B7280',
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
    gap: 12,
    marginBottom: 16,
  },
  sectionIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
    gap: 16,
  },
  formGroup: {
    gap: 8,
  },
  formRow: {
    flexDirection: 'row',
    gap: 12,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
  },
  input: {
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: '#111827',
  },
  textArea: {
    minHeight: 100,
    textAlignVertical: 'top',
    paddingTop: 12,
  },
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#2563EB',
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
    color: '#FFFFFF',
  },
});
