import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, TextInput, FlatList, Pressable, StyleSheet, ActivityIndicator, Modal } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSearch } from '../../lib/useSearch';
import { EnhancedTextInput } from '../../components/EnhancedTextInput';
import { PickerInput } from '../../components/PickerInput';

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

const MOROCCAN_CITIES = [
  'Toutes les villes',
  'Casablanca', 'Rabat', 'Fès', 'Marrakech', 'Agadir', 'Tanger',
  'Meknès', 'Oujda', 'Kenitra', 'Tétouan', 'Safi', 'Mohammedia',
  'Khouribga', 'Beni Mellal', 'El Jadida', 'Nador', 'Settat',
];

const SPECIALTIES = [
  'Toutes les spécialités',
  'Médecine générale',
  'Cardiologie',
  'Dermatologie',
  'Pédiatrie',
  'Gynécologie',
  'Ophtalmologie',
  'ORL',
  'Dentiste',
  'Psychiatrie',
  'Radiologie',
  'Kinésithérapie',
  'Orthopédie',
  'Neurologie',
  'Urologie',
];

export default function SearchScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { loading, error, results, search } = useSearch();
  
  const [q, setQ] = useState((params.query as string) || '');
  const [city, setCity] = useState((params.city as string) || 'Toutes les villes');
  const [specialty, setSpecialty] = useState('Toutes les spécialités');
  const [filtersExpanded, setFiltersExpanded] = useState(true);

  // Auto-search on mount if params provided
  useEffect(() => {
    if (params.query || params.city) {
      handleSearch();
    }
  }, []);

  const handleSearch = async () => {
    await search({
      query: q,
      city: city && city !== 'Toutes les villes' ? city : undefined,
      specialty: specialty && specialty !== 'Toutes les spécialités' ? specialty : undefined,
    });
    // Collapse filters after search to show more results
    setFiltersExpanded(false);
  };

  const handleClearFilters = () => {
    setQ('');
    setCity('Toutes les villes');
    setSpecialty('Toutes les spécialités');
  };

  const onOpen = (item: any) => {
    const slug = createSlug(item.name);
    router.push({ pathname: '/recherche/profil/[nameSlug]', params: { nameSlug: slug, id: String(item.id), type: String(item.type) } });
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Minimal Header - No redundant title */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#111827" />
        </Pressable>
        <View style={styles.headerCenter}>
          <Ionicons name="search" size={20} color="#6B7280" />
          <Text style={styles.headerSubtitle}>Recherche de professionnels</Text>
        </View>
        <View style={{ width: 40 }} />
      </View>

      {/* Compact Search Bar - No redundant label */}
      <View style={styles.searchBar}>
        <View style={styles.searchInputContainer}>
          <Ionicons name="search" size={20} color="#9CA3AF" style={styles.searchIcon} />
          <TextInput
            value={q}
            onChangeText={setQ}
            placeholder="Nom, spécialité..."
            placeholderTextColor="#9CA3AF"
            style={styles.searchInput}
            returnKeyType="search"
            onSubmitEditing={handleSearch}
          />
          {q.length > 0 && (
            <Pressable onPress={() => setQ('')} style={styles.clearIcon}>
              <Ionicons name="close-circle" size={20} color="#9CA3AF" />
            </Pressable>
          )}
        </View>
        <Pressable onPress={handleSearch} style={styles.searchButton} disabled={loading}>
          {loading ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <Ionicons name="search" size={22} color="#fff" />
          )}
        </Pressable>
      </View>
      
      {/* Active Filters Chips */}
      {(city !== 'Toutes les villes' || specialty !== 'Toutes les spécialités') && (
        <View style={styles.filtersChipsContainer}>
          {city !== 'Toutes les villes' && (
            <View style={styles.filterChip}>
              <Ionicons name="location" size={12} color="#2563EB" />
              <Text style={styles.filterChipText}>{city}</Text>
            </View>
          )}
          {specialty !== 'Toutes les spécialités' && (
            <View style={styles.filterChip}>
              <Ionicons name="medical" size={12} color="#2563EB" />
              <Text style={styles.filterChipText}>{specialty}</Text>
            </View>
          )}
        </View>
      )}


      {/* Error Message */}
      {error && (
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle" size={20} color="#EF4444" />
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

      {/* Sticky Results Count */}
      {!loading && results.length > 0 && (
        <View style={styles.stickyResultsHeader}>
          <Text style={styles.resultsCount}>
            {results.length} résultat{results.length > 1 ? 's' : ''}
          </Text>
          <Pressable onPress={() => setFiltersExpanded(true)} style={styles.filterButton}>
            <Ionicons name="options" size={18} color="#2563EB" />
            <Text style={styles.filterButtonText}>Filtres</Text>
          </Pressable>
        </View>
      )}

      {/* Results List */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#2563EB" />
          <Text style={styles.loadingText}>Recherche en cours...</Text>
        </View>
      ) : results.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="search-outline" size={64} color="#D1D5DB" />
          <Text style={styles.emptyTitle}>Aucun résultat</Text>
          <Text style={styles.emptyText}>
            Essayez de modifier vos critères de recherche
          </Text>
        </View>
      ) : (
        <FlatList
          data={results}
          keyExtractor={(item) => `${item.isOrganization ? 'org' : 'pro'}-${item.id}`}
          renderItem={({ item }) => (
            <Pressable onPress={() => onOpen(item)} style={styles.resultCard} android_ripple={{ color: '#E5E7EB' }}>
              <View style={styles.resultIcon}>
                <Ionicons 
                  name={item.isOrganization ? 'business' : 'person'} 
                  size={20} 
                  color="#2563EB" 
                />
              </View>
              <View style={styles.resultContent}>
                <Text style={styles.resultName} numberOfLines={2}>{item.name}</Text>
                <View style={styles.resultMetaRow}>
                  {item.ville && (
                    <>
                      <Ionicons name="location" size={12} color="#9CA3AF" />
                      <Text style={styles.metaText}>{item.ville}</Text>
                      <Text style={styles.metaDot}>•</Text>
                    </>
                  )}
                  <Ionicons 
                    name={item.isOrganization ? 'business' : 'person'} 
                    size={12} 
                    color="#9CA3AF" 
                  />
                  <Text style={styles.metaText}>
                    {item.isOrganization ? 'Établissement' : 'Professionnel'}
                  </Text>
                </View>
              </View>
              <Ionicons name="chevron-forward" size={18} color="#D1D5DB" />
            </Pressable>
          )}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      )}
      
      {/* Filters Modal */}
      <Modal visible={filtersExpanded} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <Pressable 
            style={StyleSheet.absoluteFill} 
            onPress={() => setFiltersExpanded(false)} 
          />
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Filtres de recherche</Text>
              <Pressable onPress={() => setFiltersExpanded(false)}>
                <Ionicons name="close" size={24} color="#6B7280" />
              </Pressable>
            </View>
            
            <View style={styles.modalBody}>
              <PickerInput
                label="Ville"
                value={city}
                onChange={setCity}
                options={MOROCCAN_CITIES}
                icon="location"
                placeholder="Sélectionner une ville"
              />

              <PickerInput
                label="Spécialité"
                value={specialty}
                onChange={setSpecialty}
                options={SPECIALTIES}
                icon="medical"
                placeholder="Sélectionner une spécialité"
              />

              <View style={styles.modalButtons}>
                <Pressable onPress={handleClearFilters} style={styles.resetButton}>
                  <Text style={styles.resetButtonText}>Réinitialiser</Text>
                </Pressable>
                <Pressable 
                  onPress={() => { 
                    handleSearch(); 
                    setFiltersExpanded(false); 
                  }} 
                  style={styles.applyButton}
                >
                  <Text style={styles.applyButtonText}>Appliquer</Text>
                </Pressable>
              </View>
            </View>
          </View>
        </View>
      </Modal>
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
  headerCenter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerSubtitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
  },
  searchBar: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  searchInputContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    paddingHorizontal: 12,
    minHeight: 48,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#111827',
    paddingVertical: 12,
  },
  clearIcon: {
    padding: 4,
  },
  searchButton: {
    width: 48,
    height: 48,
    backgroundColor: '#2563EB',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#1D4ED8',
    shadowOpacity: 0.2,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
  filtersChipsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  compactSearch: {
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  compactSearchRow: {
    flexDirection: 'row',
    gap: 12,
  },
  compactSearchInput: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderWidth: 2,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    backgroundColor: '#F9FAFB',
    minHeight: 52,
  },
  compactSearchText: {
    flex: 1,
    fontSize: 16,
    color: '#111827',
  },
  compactSearchButton: {
    width: 52,
    height: 52,
    backgroundColor: '#2563EB',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#1D4ED8',
    shadowOpacity: 0.2,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  activeFiltersRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 12,
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#EFF6FF',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  filterChipText: {
    fontSize: 13,
    color: '#2563EB',
    fontWeight: '600',
  },
  filtersSection: {
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  clearButton: {
    flex: 1,
    backgroundColor: '#F3F4F6',
    paddingVertical: 16,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    minHeight: 56,
  },
  clearButtonText: {
    color: '#6B7280',
    fontWeight: '700',
    fontSize: 16,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 16,
    backgroundColor: '#FEE2E2',
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 12,
  },
  errorText: {
    flex: 1,
    color: '#991B1B',
    fontSize: 14,
  },
  stickyResultsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  resultsCount: {
    fontSize: 15,
    fontWeight: '700',
    color: '#111827',
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#EFF6FF',
    borderRadius: 8,
  },
  filterButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2563EB',
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
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
    marginTop: 16,
  },
  emptyText: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    marginTop: 8,
  },
  listContent: {
    padding: 16,
  },
  resultCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 12,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    minHeight: 72,
  },
  resultIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  resultContent: {
    flex: 1,
  },
  resultName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 6,
    lineHeight: 20,
  },
  resultMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    flexWrap: 'wrap',
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaText: {
    fontSize: 12,
    color: '#6B7280',
  },
  metaDot: {
    fontSize: 12,
    color: '#D1D5DB',
    marginHorizontal: 4,
  },
  separator: {
    height: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '70%',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
  },
  modalBody: {
    padding: 20,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 24,
  },
  resetButton: {
    flex: 1,
    backgroundColor: '#F3F4F6',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  resetButtonText: {
    color: '#6B7280',
    fontWeight: '700',
    fontSize: 16,
  },
  applyButton: {
    flex: 2,
    backgroundColor: '#2563EB',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  applyButtonText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 16,
  },
});
