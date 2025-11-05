import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, TextInput, FlatList, Pressable, StyleSheet, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSearch } from '../../lib/useSearch';

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

export default function SearchScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { loading, error, results, search } = useSearch();
  
  const [q, setQ] = useState((params.query as string) || '');
  const [city, setCity] = useState((params.city as string) || '');
  const [specialty, setSpecialty] = useState('');

  // Auto-search on mount if params provided
  useEffect(() => {
    if (params.query || params.city) {
      handleSearch();
    }
  }, []);

  const handleSearch = async () => {
    await search({
      query: q,
      city: city && city.toLowerCase() !== 'toutes les villes' ? city : undefined,
      specialty: specialty || undefined,
    });
  };

  const onOpen = (item: any) => {
    const slug = createSlug(item.name);
    router.push({ pathname: '/recherche/profil/[nameSlug]', params: { nameSlug: slug, id: String(item.id), type: String(item.type) } });
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#111827" />
        </Pressable>
        <Text style={styles.title}>Recherche</Text>
        <View style={{ width: 40 }} />
      </View>

      {/* Search Filters */}
      <View style={styles.filtersSection}>
        <View style={styles.inputWrap}>
          <Ionicons name="search" size={20} color="#6B7280" style={styles.inputIcon} />
          <TextInput 
            value={q} 
            onChangeText={setQ} 
            placeholder="Nom, spécialité..." 
            placeholderTextColor="#9CA3AF"
            style={styles.input}
            returnKeyType="search"
            onSubmitEditing={handleSearch}
          />
        </View>

        <View style={styles.inputWrap}>
          <Ionicons name="location-outline" size={20} color="#6B7280" style={styles.inputIcon} />
          <TextInput 
            value={city} 
            onChangeText={setCity} 
            placeholder="Ville" 
            placeholderTextColor="#9CA3AF"
            style={styles.input}
            returnKeyType="search"
            onSubmitEditing={handleSearch}
          />
        </View>

        <View style={styles.inputWrap}>
          <Ionicons name="medical-outline" size={20} color="#6B7280" style={styles.inputIcon} />
          <TextInput 
            value={specialty} 
            onChangeText={setSpecialty} 
            placeholder="Spécialité (optionnel)" 
            placeholderTextColor="#9CA3AF"
            style={styles.input}
            returnKeyType="search"
            onSubmitEditing={handleSearch}
          />
        </View>

        <Pressable onPress={handleSearch} style={styles.searchButton}>
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <Ionicons name="search" size={20} color="#fff" />
              <Text style={styles.searchButtonText}>Rechercher</Text>
            </>
          )}
        </Pressable>
      </View>

      {/* Error Message */}
      {error && (
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle" size={20} color="#EF4444" />
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

      {/* Results Count */}
      {!loading && results.length > 0 && (
        <View style={styles.resultsHeader}>
          <Text style={styles.resultsCount}>
            {results.length} résultat{results.length > 1 ? 's' : ''} trouvé{results.length > 1 ? 's' : ''}
          </Text>
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
            <Pressable onPress={() => onOpen(item)} style={styles.resultCard}>
              <View style={styles.resultIcon}>
                <Ionicons 
                  name={item.isOrganization ? 'business' : 'person'} 
                  size={24} 
                  color="#2563EB" 
                />
              </View>
              <View style={styles.resultContent}>
                <Text style={styles.resultName} numberOfLines={1}>{item.name}</Text>
                {item.specialty && (
                  <Text style={styles.resultSpecialty} numberOfLines={1}>
                    {item.specialty}
                  </Text>
                )}
                <View style={styles.resultMeta}>
                  {item.ville && (
                    <View style={styles.metaItem}>
                      <Ionicons name="location" size={14} color="#6B7280" />
                      <Text style={styles.metaText}>{item.ville}</Text>
                    </View>
                  )}
                  <View style={styles.metaItem}>
                    <Ionicons 
                      name={item.isOrganization ? 'business' : 'person'} 
                      size={14} 
                      color="#6B7280" 
                    />
                    <Text style={styles.metaText}>
                      {item.isOrganization ? 'Établissement' : 'Professionnel'}
                    </Text>
                  </View>
                </View>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
            </Pressable>
          )}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
          contentContainerStyle={styles.listContent}
        />
      )}
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
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
  },
  filtersSection: {
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  inputWrap: {
    position: 'relative',
    marginBottom: 12,
  },
  inputIcon: {
    position: 'absolute',
    left: 12,
    top: 14,
    zIndex: 1,
  },
  input: {
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
  searchButton: {
    backgroundColor: '#2563EB',
    paddingVertical: 14,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 4,
  },
  searchButtonText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 15,
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
  resultsHeader: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  resultsCount: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
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
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  resultIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
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
    marginBottom: 4,
  },
  resultSpecialty: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 6,
  },
  resultMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
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
  separator: {
    height: 12,
  },
});
