import { useState, useCallback } from 'react';
import { apiClient } from './apiClient';

export interface SearchFilters {
  query?: string;
  city?: string;
  specialty?: string;
  type?: 'medecin' | 'kine' | 'orthophoniste' | 'psychologue' | 'clinique' | 'pharmacie' | 'parapharmacie' | 'labo_analyse' | 'centre_radiologie';
  latitude?: number;
  longitude?: number;
  radius?: number; // in km
}

export interface SearchResult {
  id: number;
  name: string;
  type: string;
  role?: string;
  specialty?: string;
  ville?: string;
  adresse?: string;
  profile_image?: string;
  etablissement_image?: string;
  rating?: number;
  disponible?: boolean;
  distance?: number;
  profile_data?: any;
  isOrganization?: boolean;
}

export interface SearchResponse {
  data: SearchResult[];
  count: number;
}

/**
 * Hook for searching healthcare professionals and organizations
 * Uses backend /api/users endpoint with filtering
 */
export function useSearch() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [results, setResults] = useState<SearchResult[]>([]);

  /**
   * Search for healthcare professionals and organizations
   */
  const search = useCallback(async (filters: SearchFilters = {}) => {
    setLoading(true);
    setError(null);

    try {
      // Build query parameters for /api/users endpoint
      const params: any = {};

      if (filters.latitude && filters.longitude) {
        params.lat = filters.latitude;
        params.lng = filters.longitude;
        params.radius = filters.radius || 5; // Default 5km radius
      }

      // Fetch from /api/users (returns all healthcare professionals + organizations)
      const response = await apiClient.get<SearchResponse>('/users', { params });

      let items: SearchResult[] = Array.isArray(response.data?.data)
        ? response.data.data
        : Array.isArray(response.data)
          ? response.data
          : [];

      // Client-side filtering for query, city, specialty, and type
      if (filters.query || filters.city || filters.specialty || filters.type) {
        const queryLower = (filters.query || '').trim().toLowerCase();
        const cityLower = (filters.city || '').trim().toLowerCase();
        const specialtyLower = (filters.specialty || '').trim().toLowerCase();
        const typeLower = (filters.type || '').trim().toLowerCase();

        items = items.filter((item) => {
          // Filter by query (name)
          if (queryLower) {
            const name = (item.name || '').toLowerCase();
            const firstName = (item.profile_data?.prenom || '').toLowerCase();
            const lastName = (item.profile_data?.nom || '').toLowerCase();
            const fullName = `${firstName} ${lastName}`.trim();

            const matchesName = name.includes(queryLower) ||
              firstName.includes(queryLower) ||
              lastName.includes(queryLower) ||
              fullName.includes(queryLower);

            if (!matchesName) return false;
          }

          // Filter by city
          if (cityLower && cityLower !== 'toutes les villes') {
            const ville = (item.ville || item.profile_data?.ville || '').toLowerCase();
            if (!ville.includes(cityLower)) return false;
          }

          // Filter by specialty
          if (specialtyLower) {
            const specialtyRaw = item.specialty || item.profile_data?.specialty || '';
            const specialty = (typeof specialtyRaw === 'string' ? specialtyRaw : String(specialtyRaw || '')).toLowerCase();
            if (!specialty.includes(specialtyLower)) return false;
          }

          // Filter by type/role
          if (typeLower) {
            const role = (item.role || item.type || item.profile_data?.type || '').toLowerCase();
            if (!role.includes(typeLower)) return false;
          }

          return true;
        });
      }

      setResults(items);
      return items;
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || err.message || 'Erreur lors de la recherche';
      setError(errorMessage);
      setResults([]);
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Search specifically for doctors (medecins)
   */
  const searchDoctors = useCallback(async (filters: Omit<SearchFilters, 'type'> = {}) => {
    setLoading(true);
    setError(null);

    try {
      // Use /api/medecins endpoint for doctors only
      const response = await apiClient.get('/medecins');

      let items: SearchResult[] = Array.isArray(response.data)
        ? response.data
        : [];

      // Client-side filtering
      if (filters.query || filters.city || filters.specialty) {
        const queryLower = (filters.query || '').trim().toLowerCase();
        const cityLower = (filters.city || '').trim().toLowerCase();
        const specialtyLower = (filters.specialty || '').trim().toLowerCase();

        items = items.filter((item) => {
          if (queryLower) {
            const name = (item.name || '').toLowerCase();
            if (!name.includes(queryLower)) return false;
          }

          if (cityLower && cityLower !== 'toutes les villes') {
            const ville = (item.ville || '').toLowerCase();
            if (!ville.includes(cityLower)) return false;
          }

          if (specialtyLower) {
            const specialty = (item.specialty || '').toLowerCase();
            if (!specialty.includes(specialtyLower)) return false;
          }

          return true;
        });
      }

      setResults(items);
      return items;
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || err.message || 'Erreur lors de la recherche';
      setError(errorMessage);
      setResults([]);
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Search for organizations (clinics, pharmacies, etc.)
   */
  const searchOrganizations = useCallback(async (filters: SearchFilters = {}) => {
    setLoading(true);
    setError(null);

    try {
      const params: any = {};

      if (filters.query) {
        params.q = filters.query;
      }
      if (filters.city) {
        params.city = filters.city;
      }

      const response = await apiClient.get('/organizations/search', { params });

      let items: SearchResult[] = Array.isArray(response.data?.data)
        ? response.data.data
        : Array.isArray(response.data)
          ? response.data
          : [];

      // Mark as organizations
      items = items.map(item => ({ ...item, isOrganization: true }));

      setResults(items);
      return items;
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || err.message || 'Erreur lors de la recherche';
      setError(errorMessage);
      setResults([]);
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Get autocomplete suggestions based on query
   */
  const getSuggestions = useCallback(async (query: string, limit: number = 10): Promise<SearchResult[]> => {
    if (!query.trim()) return [];

    try {
      const response = await apiClient.get<SearchResponse>('/users');

      let items: SearchResult[] = Array.isArray(response.data?.data)
        ? response.data.data
        : Array.isArray(response.data)
          ? response.data
          : [];

      const queryLower = query.trim().toLowerCase();

      // Filter and sort by relevance
      items = items
        .filter((item) => {
          const name = (item.name || '').toLowerCase();
          const specialtyRaw = item.specialty || item.profile_data?.specialty || '';
          const specialty = (typeof specialtyRaw === 'string' ? specialtyRaw : String(specialtyRaw || '')).toLowerCase();
          const villeRaw = item.ville || item.profile_data?.ville || '';
          const ville = (typeof villeRaw === 'string' ? villeRaw : String(villeRaw || '')).toLowerCase();

          return name.includes(queryLower) ||
            specialty.includes(queryLower) ||
            ville.includes(queryLower);
        })
        .slice(0, limit);

      return items;
    } catch (err) {
      console.error('Error getting suggestions:', err);
      return [];
    }
  }, []);

  /**
   * Clear search results
   */
  const clearResults = useCallback(() => {
    setResults([]);
    setError(null);
  }, []);

  return {
    loading,
    error,
    results,
    search,
    searchDoctors,
    searchOrganizations,
    getSuggestions,
    clearResults,
  };
}
