import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { apiClient } from '../../lib/apiClient';
import * as ImagePicker from 'expo-image-picker';

const genderOptions = [
  { label: 'Non spécifié', value: '' },
  { label: 'Femme', value: 'femme' },
  { label: 'Homme', value: 'homme' },
  { label: 'Autre', value: 'autre' },
];

const bloodTypes = ['', 'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

type FormState = {
  name: string;
  email: string;
  phone: string;
  age: string;
  gender: string;
  blood_type: string;
  allergies: string;
  chronic_diseases: string;
};

export default function EditProfileScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [avatar, setAvatar] = useState<string | null>(null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [form, setForm] = useState<FormState>({
    name: '',
    email: '',
    phone: '',
    age: '',
    gender: '',
    blood_type: '',
    allergies: '',
    chronic_diseases: '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        const { data } = await apiClient.get('/user/profile');
        if (!mounted) return;
        setUser(data);
        const profile = data?.profile || {};
        setAvatar(profile?.profile_image || null);
        const allergiesValue = Array.isArray(profile.allergies)
          ? profile.allergies.join(', ')
          : profile.allergies || '';
        const chronicValue = Array.isArray(profile.chronic_diseases)
          ? profile.chronic_diseases.join(', ')
          : profile.chronic_diseases || '';
        setForm({
          name: data?.name || '',
          email: data?.email || '',
          phone: data?.phone || '',
          age: profile.age ? String(profile.age) : '',
          gender: profile.gender || '',
          blood_type: profile.blood_type || '',
          allergies: allergiesValue,
          chronic_diseases: chronicValue,
        });
      } catch (error) {
        Alert.alert('Erreur', 'Impossible de charger votre profil pour le moment.');
      } finally {
        if (mounted) setLoading(false);
      }
    };
    load();
    return () => {
      mounted = false;
    };
  }, []);

  const handleChange = (field: keyof FormState, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: '' }));
    }
  };

  const allergyPlaceholder = useMemo(
    () => 'Ex: Pollen, Arachide (séparez avec des virgules)',
    []
  );

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!form.name.trim()) newErrors.name = 'Le nom est obligatoire';
    if (!form.email.trim()) newErrors.email = "L'email est obligatoire";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim()))
      newErrors.email = 'Adresse email invalide';
    if (form.age) {
      const ageNum = Number(form.age);
      if (Number.isNaN(ageNum) || ageNum < 0 || ageNum > 120) {
        newErrors.age = 'Âge invalide';
      }
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const formatList = (value: string) =>
    value
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean);

  const handleSubmit = async () => {
    if (!validate()) return;
    setSaving(true);
    try {
      const payload: Record<string, any> = {
        name: form.name.trim(),
        email: form.email.trim().toLowerCase(),
        phone: form.phone.trim(),
        age: form.age ? Number(form.age) : undefined,
        gender: form.gender,
        blood_type: form.blood_type,
        allergies: formatList(form.allergies),
        chronic_diseases: formatList(form.chronic_diseases),
      };

      await apiClient.put('/user/profile', payload);
      Alert.alert('Succès', 'Votre profil a été mis à jour.', [{ text: 'OK', onPress: () => router.back() }]);
    } catch (error: any) {
      const apiErrors = error?.response?.data?.errors;
      if (apiErrors) {
        const normalized: Record<string, string> = {};
        Object.entries(apiErrors).forEach(([key, value]) => {
          const messages = Array.isArray(value) ? value : [value];
          normalized[key] = messages.join('\n');
        });
        setErrors((prev) => ({ ...prev, ...normalized }));
      } else {
        Alert.alert('Erreur', "Impossible d'enregistrer les modifications.");
      }
    } finally {
      setSaving(false);
    }
  };

  const renderInput = (
    field: keyof FormState,
    label: string,
    icon: keyof typeof Ionicons.glyphMap,
    options?: { multiline?: boolean; keyboardType?: 'default' | 'number-pad' | 'email-address'; placeholder?: string }
  ) => (
    <View style={styles.inputGroup}>
      <Text style={styles.inputLabel}>{label}</Text>
      <View style={[styles.inputWrapper, errors[field] ? styles.inputErrorBorder : null]}>
        <View style={styles.iconContainer}>
          <Ionicons name={icon} size={20} color="#2563EB" />
        </View>
        <TextInput
          value={form[field]}
          onChangeText={(text) => handleChange(field, text)}
          style={[styles.input, options?.multiline ? styles.inputMultiline : null]}
          placeholder={options?.placeholder}
          placeholderTextColor="#9CA3AF"
          multiline={options?.multiline}
          keyboardType={options?.keyboardType || 'default'}
          autoCapitalize={field === 'email' ? 'none' : 'sentences'}
          autoCorrect={false}
        />
      </View>
      {!!errors[field] && <Text style={styles.errorText}>{errors[field]}</Text>}
    </View>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#2563EB" />
        </View>
      </SafeAreaView>
    );
  }

  const handlePickAvatar = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission requise', 'Veuillez autoriser l’accès à votre galerie pour changer la photo.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (result.canceled || !result.assets?.length) {
        return;
      }

      const asset = result.assets[0];
      if (!asset.uri) return;

      setUploadingAvatar(true);

      const formData = new FormData();
      const fileName = asset.fileName || `avatar_${Date.now()}.jpg`;
      const mimeType = asset.mimeType || 'image/jpeg';

      formData.append('avatar', {
        uri: asset.uri,
        name: fileName,
        type: mimeType,
      } as any);

      const { data } = await apiClient.post('/user/profile/update-avatar', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      if (data?.path) {
        setAvatar(data.path);
        Alert.alert('Succès', 'Votre photo de profil a été mise à jour.');
      }
    } catch (error: any) {
      const message = error?.response?.data?.message || "Impossible de mettre à jour la photo.";
      Alert.alert('Erreur', message);
    } finally {
      setUploadingAvatar(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#111827" />
        </Pressable>
        <Text style={styles.headerTitle}>Modifier mon profil</Text>
        <View style={{ width: 40 }} />
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 80 : 0}
      >
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Photo de profil</Text>
            <View style={styles.avatarRow}>
              <View style={styles.avatarWrapper}>
                {avatar ? (
                  <Image source={{ uri: avatar }} style={styles.avatarImage} resizeMode="cover" />
                ) : (
                  <View style={styles.avatarPlaceholder}>
                    <Ionicons name="person" size={36} color="#9CA3AF" />
                  </View>
                )}
              </View>
              <Pressable
                style={[styles.secondaryButton, uploadingAvatar && styles.secondaryButtonDisabled]}
                onPress={handlePickAvatar}
                disabled={uploadingAvatar}
              >
                {uploadingAvatar ? (
                  <ActivityIndicator color="#2563EB" />
                ) : (
                  <>
                    <Ionicons name="camera" size={18} color="#2563EB" />
                    <Text style={styles.secondaryButtonText}>Changer la photo</Text>
                  </>
                )}
              </Pressable>
            </View>
          </View>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>Informations personnelles</Text>
            {renderInput('name', 'Nom complet', 'person', { placeholder: 'Votre nom et prénom' })}
            {renderInput('email', 'Adresse email', 'mail', {
              placeholder: 'exemple@email.com',
              keyboardType: 'email-address',
            })}
            {renderInput('phone', 'Téléphone', 'call', {
              placeholder: '+212 6 XX XX XX XX',
              keyboardType: 'number-pad',
            })}
            {renderInput('age', 'Âge', 'calendar', {
              placeholder: 'Votre âge',
              keyboardType: 'number-pad',
            })}
          </View>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>Santé</Text>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Genre</Text>
              <View style={styles.pillRow}>
                {genderOptions.map((option) => {
                  const active = form.gender === option.value;
                  return (
                    <Pressable
                      key={option.value}
                      onPress={() => handleChange('gender', option.value)}
                      style={[styles.pillButton, active ? styles.pillButtonActive : null]}
                    >
                      <Text style={[styles.pillText, active ? styles.pillTextActive : null]}>{option.label}</Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Groupe sanguin</Text>
              <View style={styles.pillRowScrollable}>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  <View style={styles.pillScrollContent}>
                    {bloodTypes.map((type) => {
                      const active = form.blood_type === type;
                      return (
                        <Pressable
                          key={type || 'none'}
                          onPress={() => handleChange('blood_type', type)}
                          style={[styles.pillButton, active ? styles.pillButtonActive : null]}
                        >
                          <Text style={[styles.pillText, active ? styles.pillTextActive : null]}>
                            {type || 'Non spécifié'}
                          </Text>
                        </Pressable>
                      );
                    })}
                  </View>
                </ScrollView>
              </View>
            </View>

            {renderInput('allergies', 'Allergies', 'leaf', {
              multiline: true,
              placeholder: allergyPlaceholder,
            })}
            {renderInput('chronic_diseases', 'Maladies chroniques', 'medkit', {
              multiline: true,
              placeholder: 'Ex: Diabète, Hypertension',
            })}
          </View>

          <Pressable
            onPress={handleSubmit}
            style={[styles.primaryButton, saving && styles.primaryButtonDisabled]}
            disabled={saving}
          >
            {saving ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <>
                <Ionicons name="save" size={20} color="#FFFFFF" />
                <Text style={styles.primaryButtonText}>Enregistrer les modifications</Text>
              </>
            )}
          </Pressable>

          <View style={{ height: 48 }} />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollContent: {
    padding: 16,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
    marginBottom: 16,
  },
  avatarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  avatarWrapper: {
    width: 84,
    height: 84,
    borderRadius: 42,
    borderWidth: 2,
    borderColor: '#BFDBFE',
    overflow: 'hidden',
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
  },
  avatarPlaceholder: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#E5E7EB',
  },
  secondaryButton: {
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#BFDBFE',
    backgroundColor: '#EFF6FF',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  secondaryButtonDisabled: {
    opacity: 0.6,
  },
  secondaryButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#2563EB',
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 16,
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#6B7280',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    overflow: 'hidden',
  },
  input: {
    flex: 1,
    paddingVertical: 14,
    paddingHorizontal: 12,
    color: '#111827',
    fontSize: 15,
  },
  inputMultiline: {
    minHeight: 96,
    textAlignVertical: 'top',
  },
  iconContainer: {
    width: 44,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#EFF6FF',
    borderRightWidth: 1,
    borderRightColor: '#E5E7EB',
  },
  errorText: {
    color: '#DC2626',
    fontSize: 12,
    marginTop: 4,
  },
  inputErrorBorder: {
    borderColor: '#F87171',
  },
  pillRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  pillRowScrollable: {
    marginTop: 4,
  },
  pillScrollContent: {
    flexDirection: 'row',
    gap: 8,
    paddingVertical: 4,
  },
  pillButton: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    backgroundColor: '#FFFFFF',
  },
  pillButtonActive: {
    backgroundColor: '#2563EB',
    borderColor: '#2563EB',
  },
  pillText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
  },
  pillTextActive: {
    color: '#FFFFFF',
  },
  primaryButton: {
    backgroundColor: '#2563EB',
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 10,
    shadowColor: '#2563EB',
    shadowOpacity: 0.25,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 8 },
    elevation: 4,
  },
  primaryButtonDisabled: {
    opacity: 0.6,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
});
