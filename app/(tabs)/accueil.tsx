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
import { DevTools } from '@/components/DevTools';
import { PersonalizedHeader } from '@/components/PersonalizedHeader';
import { NextAppointmentCard } from '@/components/NextAppointmentCard';
import { QuickActionsGrid } from '@/components/QuickActionsGrid';
import { UserStatsRow } from '@/components/UserStatsRow';

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
  
  // Search state
  const [query, setQuery] = useState('');
  const [cityQuery, setCityQuery] = useState('Toutes les villes');
  const [selectedCity, setSelectedCity] = useState<string | null>('Toutes les villes');
  const [showCityList, setShowCityList] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [doctors, setDoctors] = useState<any[]>([]);
  const [establishments, setEstablishments] = useState<any[]>([]);
  const [suggestions, setSuggestions] = useState<any[]>([]);

  // Mock data for dashboard (replace with real API data)
  const mockAppointment = undefined; // Will show empty state
  const upcomingAppointments = 0;
  const unreadMessages = 0;
  const favoriteDoctors = 0;

  const filteredCities = useMemo(() => {
    const q = (cityQuery || '').toLowerCase();
    if (!q || q === 'toutes les villes') return MOROCCAN_CITIES;
    return MOROCCAN_CITIES.filter((c) => c.toLowerCase().includes(q));
  }, [cityQuery]);

  // Load user
  useEffect(() => {
    const { user: u } = getAuth();
    if (u) setUser(u);
  }, []);

  // Fetch doctors/establishments
  useEffect(() => {
    const fetchData = async () => {
      try {
        const usersRes = await apiClient.get('/users');
        const allUsers: any[] = Array.isArray(usersRes.data?.data) 
          ? usersRes.data.data 
          : Array.isArray(usersRes.data) ? usersRes.data : [];
        
        const searchableUsers = allUsers.filter((user: any) => {
          if (!user) return false;
          const roleName = user.role?.name || user.role || '';
          const roleId = user.role_id;
          const roleNameLower = typeof roleName === 'string' ? roleName.toLowerCase() : '';
          const isPatient = roleId === 1 || roleNameLower.includes('patient');
          const isAdmin = roleId === 3 || roleNameLower.includes('admin');
          return !isPatient && !isAdmin;
        });
        
        setDoctors(searchableUsers);
        setEstablishments(searchableUsers);
      } catch {
        setDoctors([]);
        setEstablishments([]);
      }
    };
    fetchData();
  }, []);

  // Build suggestions
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      const q = query.trim().toLowerCase();
      if (!q) {
        setSuggestions([]);
        setShowSuggestions(false);
        return;
      }

      const allUsers = [...establishments, ...doctors];
      const uniqueUsers = allUsers.filter((user, index, self) => 
        user && self.findIndex((u) => u && u.id === user.id) === index
      );

      const matchingUsers = uniqueUsers
        .filter((user: any) => {
          if (!user) return false;
          const firstName = typeof user.prenom === 'string' ? user.prenom.toLowerCase() : '';
          const lastName = typeof user.nom === 'string' ? user.nom.toLowerCase() : '';
          const fullName = `${firstName} ${lastName}`.trim();
          const name = typeof user.name === 'string' ? user.name.toLowerCase() : '';
          const city = typeof user.ville === 'string' ? user.ville.toLowerCase() : '';
          return firstName.includes(q) || lastName.includes(q) || fullName.includes(q) || 
                 name.includes(q) || city.includes(q);
        })
        .slice(0, 20)
        .map((user: any) => {
          const fullName = `${user.prenom || ''} ${user.nom || ''}`.trim();
          const finalName = fullName || user.name || 'Professionnel';
          const specialty = user.specialite || user.specialty || 'Médecine générale';
          
          return {
            id: user.id,
            name: finalName,
            specialty: typeof specialty === 'string' ? specialty : 'Médecine générale',
            location: user.ville || user.city || '',
            profile: user,
          };
        });

      setSuggestions(matchingUsers);
      setShowSuggestions(matchingUsers.length > 0);
    }, 150);
    
    return () => clearTimeout(timeoutId);
  }, [query, doctors, establishments]);

  const onSearch = () => {
    const city = (selectedCity || cityQuery || '').trim();
    if (city && city.toLowerCase() !== 'toutes les villes') {
      router.push({ pathname: '/recherche/[city]', params: { city } } as any);
      return;
    }
    router.push('/recherche' as any);
  };

  const onUseLocation = () => {
    Alert.alert('Proximité', "La recherche par proximité n'est pas encore activée.");
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Personalized Header */}
      <PersonalizedHeader 
        userName={user?.prenom || user?.first_name} 
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
                  <FlatList
                    data={suggestions}
                    keyExtractor={(item) => String(item.id)}
                    keyboardShouldPersistTaps="handled"
                    renderItem={({ item }) => (
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
                    )}
                    ItemSeparatorComponent={() => <View style={styles.divider} />}
                    style={{ maxHeight: 240 }}
                  />
                </View>
              )}
            </View>

            {/* City input */}
            <View style={[styles.inputWrap, { marginTop: 12 }]}>
              <Ionicons name="location-outline" size={20} color="#6B7280" style={styles.inputIcon} />
              <TextInput
                value={cityQuery}
                onChangeText={(t) => {
                  setCityQuery(t);
                  setShowCityList(true);
                }}
                onFocus={() => setShowCityList(true)}
                placeholder="Ville"
                placeholderTextColor="#9CA3AF"
                style={styles.textInput}
                returnKeyType="done"
              />

              {showCityList && (
                <View style={styles.suggestions}>
                  <Pressable
                    onPress={() => {
                      setSelectedCity('Toutes les villes');
                      setCityQuery('Toutes les villes');
                      setShowCityList(false);
                    }}
                    style={[styles.suggestionItem, { paddingVertical: 12 }]}
                  >
                    <Text style={styles.suggestionTitle}>Toutes les villes</Text>
                  </Pressable>
                  <View style={styles.divider} />
                  <FlatList
                    data={filteredCities}
                    keyExtractor={(item, idx) => `${item}-${idx}`}
                    keyboardShouldPersistTaps="handled"
                    renderItem={({ item }) => (
                      <Pressable
                        onPress={() => {
                          setSelectedCity(item);
                          setCityQuery(item);
                          setShowCityList(false);
                        }}
                        style={[styles.suggestionItem, { paddingVertical: 12 }]}
                      >
                        <Text style={styles.suggestionTitle}>{item}</Text>
                      </Pressable>
                    )}
                    style={{ maxHeight: 180 }}
                  />
                </View>
              )}
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
        </View>

        {/* Dashboard Components */}
        <NextAppointmentCard appointment={mockAppointment} />
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
