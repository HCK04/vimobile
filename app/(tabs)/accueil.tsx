import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Alert,
  FlatList,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, FontAwesome5 } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { apiClient } from '../../lib/apiClient';
import { getAuth } from '../../lib/api';
import { useSearch } from '../../lib/useSearch';
import { DevTools } from '@/components/DevTools';
import { PersonalizedHeader } from '@/components/PersonalizedHeader';
import { NextAppointmentCard } from '@/components/NextAppointmentCard';
import { QuickActionsGrid } from '@/components/QuickActionsGrid';
import { UserStatsRow } from '@/components/UserStatsRow';
import CityBottomSheet from '@/components/CityBottomSheet';
import FiltersChipRow from '@/components/FiltersChipRow';

const MOROCCAN_CITIES = [
  'Casablanca', 'Rabat', 'Fès', 'Marrakech', 'Agadir', 'Tanger',
  'Meknès', 'Oujda', 'Kenitra', 'Tétouan', 'Safi', 'Mohammedia',
  'Khouribga', 'Beni Mellal', 'El Jadida', 'Nador', 'Settat',
  'Laâyoune', 'Salé', 'Temara', 'Berrechid', 'Khémisset', 'Inezgane',
];

function createSlug(name: string) {
  if (!name) return '';
  return name
    .toLowerCase()
    .trim()
    .replace(/[àáâãäå]/g, 'a')
    .replace(/[èéêë]/g, 'e')
    .replace(/[ìíîï]/g, 'i')
    .replace(/[òóôõö]/g, 'o')
    .replace(/[ùúûü]/g, 'u')
    .replace(/[ç]/g, 'c')
    .replace(/[ñ]/g, 'n')
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

export default function AccueilScreen() {
  const router = useRouter();
  const { getSuggestions } = useSearch();
  
  // Search state
  const [query, setQuery] = useState('');
  const [cityQuery, setCityQuery] = useState('Toutes les villes');
  const [selectedCity, setSelectedCity] = useState<string | null>('Toutes les villes');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const [citySheetVisible, setCitySheetVisible] = useState(false);

  // Real data from backend
  const [appointments, setAppointments] = useState<any[]>([]);
  const [loadingAppointments, setLoadingAppointments] = useState(false);
  const [unreadNotifications, setUnreadNotifications] = useState(0);

  // Get next upcoming appointment
  const nextAppointment = appointments.find((apt: any) => {
    const aptDate = new Date(`${apt.date}T${apt.time}`);
    return aptDate > new Date() && apt.status !== 'cancelled';
  });

  // Calculate stats
  const upcomingAppointments = appointments.filter((apt: any) => {
    const aptDate = new Date(`${apt.date}T${apt.time}`);
    return aptDate > new Date() && apt.status !== 'cancelled';
  }).length;
  // Unread notifications are fetched from backend
  const unreadMessages = unreadNotifications;
  const favoriteDoctors = 0; // Favorites not implemented yet

  const filteredCities = useMemo(() => {
    const q = (cityQuery || '').toLowerCase();
    if (!q || q === 'toutes les villes') return MOROCCAN_CITIES;
    return MOROCCAN_CITIES.filter((c) => c.toLowerCase().includes(q));
  }, [cityQuery]);

  // Load user from backend
  useEffect(() => {
    const loadUser = async () => {
      try {
        const { data } = await apiClient.get('/user/profile');
        setUser(data);
      } catch (error) {
        console.error('Failed to load user:', error);
        // Fallback to auth state
        const { user: u } = getAuth();
        if (u) setUser(u);
      }
    };
    loadUser();
  }, []);

  // Load appointments from backend
  useEffect(() => {
    const loadAppointments = async () => {
      try {
        setLoadingAppointments(true);
        const { data } = await apiClient.get('/appointments');
        setAppointments(data || []);
      } catch (error) {
        console.error('Failed to load appointments:', error);
        setAppointments([]);
      } finally {
        setLoadingAppointments(false);
      }
    };
    loadAppointments();
  }, []);

  // Load unread notifications count
  useEffect(() => {
    const loadNotifications = async () => {
      try {
        const { data } = await apiClient.get('/notifications');
        const count = Array.isArray(data) ? data.filter((n: any) => !n?.read_at).length : 0;
        setUnreadNotifications(count);
      } catch (error) {
        // Silent fail, keep 0
        setUnreadNotifications(0);
      }
    };
    loadNotifications();
  }, []);

  // Build suggestions using backend search
  useEffect(() => {
    const timeoutId = setTimeout(async () => {
      const q = query.trim();
      if (!q) {
        setSuggestions([]);
        setShowSuggestions(false);
        return;
      }

      setLoadingSuggestions(true);
      try {
        const results = await getSuggestions(q, 15);
        
        const formattedSuggestions = results.map((item: any) => {
          const name = item.name || 'Professionnel';
          const specialty = item.specialty || item.profile_data?.specialty || 'Médecine générale';
          const location = item.ville || item.profile_data?.ville || '';
          
          return {
            id: item.id,
            name,
            specialty: typeof specialty === 'string' ? specialty : 'Médecine générale',
            location,
            profile: item,
          };
        });

        setSuggestions(formattedSuggestions);
        setShowSuggestions(formattedSuggestions.length > 0);
      } catch (error) {
        console.error('Error fetching suggestions:', error);
        setSuggestions([]);
        setShowSuggestions(false);
      } finally {
        setLoadingSuggestions(false);
      }
    }, 300);
    
    return () => clearTimeout(timeoutId);
  }, [query, getSuggestions]);

  const onSearch = () => {
    const city = (selectedCity || cityQuery || '').trim();
    const searchQuery = query.trim();
    
    // Navigate to search page with parameters
    router.push({ 
      pathname: '/recherche', 
      params: { 
        query: searchQuery || undefined,
        city: city && city.toLowerCase() !== 'toutes les villes' ? city : undefined,
      } 
    } as any);
  };

  const onUseLocation = () => {
    Alert.alert('Proximité', "La recherche par proximité n'est pas encore activée.");
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Personalized Header */}
      <PersonalizedHeader 
        userName={user?.prenom || user?.first_name || user?.name?.split(' ')[0]} 
        unreadCount={unreadMessages} 
      />

      <ScrollView 
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Search Card */}
        <View style={styles.searchSection}>
          <Text style={styles.searchTitle}>Rechercher un médecin</Text>
          
          <View style={styles.searchCard}>
            {/* Query input */}
            <View style={styles.inputWrap}>
              <Ionicons name="search" size={20} color="#6B7280" style={styles.inputIcon} />
              <TextInput
                value={query}
                onChangeText={(t) => {
                  setQuery(t);
                  setShowSuggestions(true);
                }}
                onFocus={() => setShowSuggestions(true)}
                placeholder="Nom, spécialité..."
                placeholderTextColor="#9CA3AF"
                style={styles.textInput}
                returnKeyType="search"
                onSubmitEditing={onSearch}
              />

              {showSuggestions && suggestions.length > 0 && (
                <View style={styles.suggestions}>
                  <ScrollView keyboardShouldPersistTaps="handled" style={{ maxHeight: 240 }}>
                    {suggestions.map((item, idx) => (
                      <View key={String(item.id) + '-' + idx}>
                        <Pressable
                          onPress={() => {
                            try {
                              const nameSlug = createSlug(item.name);
                              router.push({ 
                                pathname: '/recherche/profil/[nameSlug]', 
                                params: { nameSlug } 
                              } as any);
                            } catch {}
                            setQuery(item.name);
                            setShowSuggestions(false);
                          }}
                          style={styles.suggestionItem}
                        >
                          <View style={styles.suggestionIcon}>
                            <FontAwesome5 name="user-md" size={16} color="#2563EB" />
                          </View>
                          <View style={{ flex: 1 }}>
                            <Text style={styles.suggestionTitle} numberOfLines={1}>
                              {item.name}
                            </Text>
                            <Text style={styles.suggestionSub} numberOfLines={1}>
                              {item.specialty}
                            </Text>
                            {!!item.location && (
                              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 }}>
                                <Ionicons name="location" size={12} color="#9CA3AF" />
                                <Text style={styles.suggestionLoc} numberOfLines={1}>
                                  {item.location}
                                </Text>
                              </View>
                            )}
                          </View>
                        </Pressable>
                        {idx < suggestions.length - 1 && <View style={styles.divider} />}
                      </View>
                    ))}
                  </ScrollView>
                </View>
              )}
            </View>

            {/* City input -> opens bottom sheet */}
            <View style={[styles.inputWrap, { marginTop: 12 }]}>
              <Ionicons name="location-outline" size={20} color="#6B7280" style={styles.inputIcon} />
              <Pressable onPress={() => setCitySheetVisible(true)}>
                <View pointerEvents="none">
                  <TextInput
                    value={cityQuery}
                    editable={false}
                    placeholder="Ville"
                    placeholderTextColor="#9CA3AF"
                    style={styles.textInput}
                  />
                </View>
              </Pressable>
            </View>

            {/* Search buttons */}
            <View style={styles.searchButtons}>
              <Pressable onPress={onUseLocation} style={styles.locationBtn}>
                <Ionicons name="navigate" size={20} color="#3B82F6" />
              </Pressable>
              <Pressable onPress={onSearch} style={styles.searchCta}>
                <Text style={styles.searchCtaText}>Rechercher</Text>
                <Ionicons name="arrow-forward" size={18} color="#fff" />
              </Pressable>
            </View>
          </View>
          {/* Quick filter chips */}
          <FiltersChipRow
            onSelect={(chip) => {
              const city = (selectedCity || cityQuery || '').trim();
              router.push({
                pathname: '/recherche',
                params: {
                  query: chip.label,
                  city: city && city.toLowerCase() !== 'toutes les villes' ? city : undefined,
                },
              } as any);
            }}
          />
        </View>

        {/* Dashboard Components */}
        <NextAppointmentCard appointment={nextAppointment ? {
          id: String(nextAppointment.id),
          doctorName: nextAppointment.doctor_name,
          specialty: nextAppointment.reason || 'Consultation',
          date: new Date(`${nextAppointment.date}T${nextAppointment.time}`).toLocaleDateString('fr-FR', { 
            weekday: 'long', 
            day: 'numeric', 
            month: 'long' 
          }),
          time: nextAppointment.time,
          location: nextAppointment.provider_type || 'Cabinet médical',
        } : undefined} />
        <QuickActionsGrid />
        <UserStatsRow 
          upcomingAppointments={upcomingAppointments}
          unreadMessages={unreadMessages}
          favoriteDoctors={favoriteDoctors}
        />

        {/* Category Shortcuts */}
        <View style={styles.categorySection}>
          <Text style={styles.sectionTitle}>Catégories populaires</Text>
          <View style={styles.categoryGrid}>
            {[
              { icon: 'medical', label: 'Médecin', color: '#3B82F6', bg: '#EFF6FF' },
              { icon: 'fitness', label: 'Dentiste', color: '#10B981', bg: '#D1FAE5' },
              { icon: 'heart', label: 'Cardiologue', color: '#EC4899', bg: '#FCE7F3' },
              { icon: 'body', label: 'Kiné', color: '#F59E0B', bg: '#FEF3C7' },
            ].map((cat) => (
              <Pressable 
                key={cat.label}
                style={styles.categoryCard}
                onPress={() => router.push('/recherche' as any)}
              >
                <View style={[styles.categoryIcon, { backgroundColor: cat.bg }]}>
                  <Ionicons name={cat.icon as any} size={24} color={cat.color} />
                </View>
                <Text style={styles.categoryLabel}>{cat.label}</Text>
              </Pressable>
            ))}
          </View>
        </View>

        {/* Bottom spacing */}
        <View style={{ height: 32 }} />
      </ScrollView>

      <DevTools />
      {/* City bottom sheet */}
      <CityBottomSheet
        visible={citySheetVisible}
        cities={MOROCCAN_CITIES}
        selectedCity={selectedCity || 'Toutes les villes'}
        onSelect={(city) => {
          setSelectedCity(city);
          setCityQuery(city);
        }}
        onClose={() => setCitySheetVisible(false)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  scrollView: {
    flex: 1,
  },
  searchSection: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
  },
  searchTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 16,
  },
  searchCard: {
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
  },
  inputWrap: {
    position: 'relative',
  },
  inputIcon: {
    position: 'absolute',
    left: 12,
    top: 14,
    zIndex: 1,
  },
  textInput: {
    paddingLeft: 40,
    paddingRight: 12,
    paddingVertical: 14,
    borderRadius: 12,
    fontSize: 15,
    color: '#111827',
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  suggestions: {
    position: 'absolute',
    top: 56,
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 6,
    zIndex: 50,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 5,
  },
  suggestionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 10,
    paddingHorizontal: 6,
  },
  suggestionIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  suggestionTitle: {
    color: '#111827',
    fontWeight: '600',
    fontSize: 14,
  },
  suggestionSub: {
    color: '#6B7280',
    fontSize: 12,
    marginTop: 2,
  },
  suggestionLoc: {
    color: '#9CA3AF',
    fontSize: 11,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: '#E5E7EB',
  },
  searchButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 16,
  },
  locationBtn: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchCta: {
    flex: 1,
    backgroundColor: '#2563EB',
    paddingVertical: 14,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    shadowColor: '#1D4ED8',
    shadowOpacity: 0.2,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  searchCtaText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 15,
  },
  categorySection: {
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 12,
  },
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  categoryCard: {
    width: '48%',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  categoryIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  categoryLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#374151',
  },
});
