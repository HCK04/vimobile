import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  Dimensions,
  Animated,
  Easing,
  Image,
  useColorScheme,
} from 'react-native';
import { Ionicons, FontAwesome5, MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { apiClient } from '../../lib/apiClient';
import { getAuth } from '../../lib/api';
import { DevTools } from '@/components/DevTools';

// Simple number formatter with fr-FR fallback
function formatNumber(n: number) {
  try {
    return new Intl.NumberFormat('fr-FR').format(n);
  } catch {
    return String(n);
  }
}

// Animated counter with lightweight animation and optional auto-increment
function AnimatedCounter({
  initial = 0,
  target,
  duration = 800,
  autoIncrementEveryMs,
}: {
  initial?: number;
  target: number;
  duration?: number;
  autoIncrementEveryMs?: number;
}) {
  const [value, setValue] = useState(initial);
  const targetRef = useRef(target);
  const animatingRef = useRef(false);
 
  useEffect(() => {
    let raf: number | undefined;
    const start = Date.now();
    const startVal = value;
    const endVal = target;
    const diff = endVal - startVal;
    animatingRef.current = true;

    const tick = () => {
      const t = Math.min(1, (Date.now() - start) / duration);
      const eased = 1 - Math.pow(1 - t, 3); // easeOutCubic
      setValue(Math.round(startVal + diff * eased));
      if (t < 1) {
        raf = requestAnimationFrame(tick);
      } else {
        animatingRef.current = false;
      }
    };
    raf = requestAnimationFrame(tick);
    return () => {
      if (raf !== undefined) {
        cancelAnimationFrame(raf);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [target]);

  // Auto increment
  useEffect(() => {
    if (!autoIncrementEveryMs) return;
    const id = setInterval(() => {
      setValue((v) => v + 1);
    }, autoIncrementEveryMs);
    return () => clearInterval(id);
  }, [autoIncrementEveryMs]);

  return <Text style={styles.counterNumber}>{formatNumber(value)}</Text>;
}

const MOROCCAN_CITIES = [
  'Casablanca', 'Rabat', 'Fès', 'Marrakech', 'Agadir', 'Tanger',
  'Meknès', 'Oujda', 'Kenitra', 'Tétouan', 'Safi', 'Mohammedia',
  'Khouribga', 'Beni Mellal', 'El Jadida', 'Nador', 'Settat',
  'Laâyoune', 'Salé', 'Temara', 'Berrechid', 'Khémisset', 'Inezgane',
  'Ksar El Kebir', 'Larache', 'Guelmim', 'Berkane', 'Taourirt', 'Tiznit',
  'Tan-Tan', 'Ouarzazate', 'Errachidia', 'Zagora', 'Midelt',
];

// Web parity helpers
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

function resolveMediaUrl(path?: any) {
  if (!path) return '';
  let p = typeof path === 'string' ? path : String(path);
  p = p.trim().replace(/\\/g, '/');
  if (!p) return '';
  if (/^(https?:)?\/\//i.test(p)) return p.startsWith('//') ? `https:${p}` : p;
  const baseURL = (apiClient?.defaults?.baseURL || '').replace(/\/api\/?$/, '');
  const origin = baseURL || 'http://localhost:8000';
  if (!p.startsWith('/')) p = `/${p}`;
  if (/^\/public\//i.test(p)) p = p.replace(/^\/public\//i, '/storage/');
  if (/^\/storage\/public\//i.test(p)) p = p.replace(/^\/storage\/public\//i, '/storage/');
  if (/^\/storage\//i.test(p) || /\/storage\//i.test(p)) {
    return `${origin}${p}`;
  }
  const needsStoragePrefix = /^\/(imgs|images|uploads|upload|profiles|etablissements|clinic|clinique|clinics|parapharmacie|parapharmacies|parapharmacie_profiles|pharmacie|pharmacies|pharmacy|pharmacie_profiles|labo|labo_analyse|laboratoire|radiologie|centre_radiologie|etablissement_images|gallery)\//i.test(p);
  if (needsStoragePrefix) return `${origin}/storage${p}`;
  return `${origin}${p}`;
}

function pickProfileImageSrc(obj?: any) {
  if (!obj) return '';
  const asStringPath = (val: any): string => {
    if (!val) return '';
    if (typeof val === 'string') return val.trim();
    if (Array.isArray(val)) {
      for (const item of val) {
        const s = asStringPath(item);
        if (s) return s;
      }
      return '';
    }
    if (typeof val === 'object') {
      const candidates = [val.url, val.path, val.src, val.image, val.file, (val as any)[0]];
      for (const c of candidates) {
        const s = asStringPath(c);
        if (s) return s;
      }
      try {
        const str = String(val);
        if (str && str !== '[object Object]') return str;
      } catch {}
      return '';
    }
    return '';
  };
  const parseArrayish = (val: any) => {
    if (!val) return [] as any[];
    if (Array.isArray(val)) return val;
    if (typeof val === 'string') {
      const s = val.trim();
      if (!s) return [];
      try {
        const parsed = JSON.parse(s);
        return Array.isArray(parsed) ? parsed : [];
      } catch {
        return s.includes(',') ? s.split(',').map((x) => x.trim()).filter(Boolean) : [s];
      }
    }
    return [];
  };
  const candidates = [
    obj.profile_image,
    obj.etablissement_image,
    obj.clinic_image,
    obj.logo,
    obj.avatar,
    obj.photo,
    ...parseArrayish(obj.imgs),
    ...parseArrayish(obj.gallery),
  ]
    .map(asStringPath)
    .map((x) => (typeof x === 'string' ? x.trim() : ''))
    .filter(Boolean);
  if (candidates.length === 0) return '';
  return resolveMediaUrl(candidates[0]);
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
  const [isPatient, setIsPatient] = useState(false);
  const [doctors, setDoctors] = useState<any[]>([]);
  const [establishments, setEstablishments] = useState<any[]>([]);
  const orgCacheRef = useRef<Record<string, any>>({});
  const [orgCacheTick, setOrgCacheTick] = useState(0);
  const profCacheRef = useRef<Record<string, any>>({});
  const [profCacheTick, setProfCacheTick] = useState(0);
  const [suggestions, setSuggestions] = useState<any[]>([]);

  // Counters targets
  const [patientsCount, setPatientsCount] = useState(0);
  const [doctorsCount, setDoctorsCount] = useState(0);
  const [pharmaciesCount, setPharmaciesCount] = useState(0);

  const systemScheme = useColorScheme();
  const [theme, setTheme] = useState<'light' | 'dark'>(systemScheme === 'dark' ? 'dark' : 'light');
  const themeColors = useMemo(() => {
    if (theme === 'dark') {
      return {
        bg: '#0F172A',
        headerBg: '#0F172A',
        footerBg: '#0F172A',
        text: '#F8FAFC',
        textMuted: '#94A3B8',
        card: '#111827',
        border: '#334155',
        inputBg: '#0B1220',
        glassBg: 'rgba(17,24,39,0.6)',
        glassBorder: 'rgba(148,163,184,0.2)',
        primary: '#3B82F6',
        placeholder: '#94A3B8',
      } as const;
    }
    return {
      bg: '#FFFFFF',
      headerBg: '#FFFFFF',
      footerBg: '#F8FAFC',
      text: '#111827',
      textMuted: '#6B7280',
      card: '#F8FAFC',
      border: '#E5E7EB',
      inputBg: '#F8FAFC',
      glassBg: 'rgba(255,255,255,0.72)',
      glassBorder: 'rgba(255,255,255,0.42)',
      primary: '#3B82F6',
      placeholder: '#9CA3AF',
    } as const;
  }, [theme]);

  const bgAnims = useRef(Array.from({ length: 5 }, () => new Animated.Value(0))).current;
  useEffect(() => {
    bgAnims.forEach((val, idx) => {
      Animated.loop(
        Animated.sequence([
          Animated.timing(val, {
            toValue: 1,
            duration: 5000 + idx * 700,
            easing: Easing.inOut(Easing.quad),
            useNativeDriver: true,
          }),
          Animated.timing(val, {
            toValue: 0,
            duration: 5000 + idx * 700,
            easing: Easing.inOut(Easing.quad),
            useNativeDriver: true,
          }),
        ])
      ).start();
    });
  }, [bgAnims]);

  const filteredCities = useMemo(() => {
    const q = (cityQuery || '').toLowerCase();
    if (!q || q === 'toutes les villes' || q === 'proximité') return MOROCCAN_CITIES;
    return MOROCCAN_CITIES.filter((c) => c.toLowerCase().includes(q));
  }, [cityQuery]);

  // Load auth user (memory) to reflect My Space header state
  useEffect(() => {
    const { user: u } = getAuth();
    if (u) {
      setUser(u);
      const roleName = u?.role?.name || u?.role || u?.role_name || '';
      setIsPatient(String(roleName).toLowerCase() === 'patient');
    }
  }, []);

  // Fetch counters from backend (web parity)
  useEffect(() => {
    let mounted = true;
    const fetchStats = async () => {
      try {
        // Patients from /site-stats
        const res = await apiClient.get('/site-stats');
        const baseline = typeof res.data?.baseline === 'number' && !isNaN(res.data.baseline) ? res.data.baseline : 0;
        const startTime = res.data?.start_time ? new Date(res.data.start_time) : new Date();
        const secondsElapsed = Math.floor((Date.now() - startTime.getTime()) / 1000);
        const usersAdded = Math.floor(secondsElapsed / 10); // same growth heuristic as web
        const initialCount = baseline + usersAdded;
        if (mounted) setPatientsCount(initialCount);
      } catch {}
      try {
        const res2 = await apiClient.get('/statistics');
        if (res2.data?.success) {
          if (mounted) {
            setDoctorsCount(Number(res2.data.data?.doctors || 0));
            setPharmaciesCount(Number(res2.data.data?.pharmacies || 0));
          }
        }
      } catch {}
    };
    fetchStats();
    return () => {
      mounted = false;
    };
  }, []);

  // Fetch searchable users/orgs (web parity)
  useEffect(() => {
    const fetchData = async () => {
      try {
        let medicalStaff: any[] = [];
        let allEstablishments: any[] = [];
        try {
          const usersRes = await apiClient.get('/users');
          const allUsers: any[] = Array.isArray(usersRes.data?.data) ? usersRes.data.data : Array.isArray(usersRes.data) ? usersRes.data : [];
          const searchableUsers = allUsers.filter((user: any) => {
            if (!user) return false;
            const roleName = user.role?.name || user.role || '';
            const roleId = user.role_id;
            const roleNameLower = typeof roleName === 'string' ? roleName.toLowerCase() : '';
            const isPatientById = roleId === 1;
            const isAdminById = roleId === 3;
            const isPatientByName = roleNameLower.includes('patient') || roleNameLower === 'patient';
            const isAdminByName = roleNameLower.includes('admin') || roleNameLower === 'admin';
            const shouldExclude = isPatientById || isAdminById || isPatientByName || isAdminByName;
            return !shouldExclude;
          });
          medicalStaff = searchableUsers;
          allEstablishments = searchableUsers;
        } catch {}
        try {
          const orgsRes = await apiClient.get('/organizations', { params: { include_unverified: true } });
          const orgs: any[] = Array.isArray(orgsRes.data?.data) ? orgsRes.data.data : Array.isArray(orgsRes.data) ? orgsRes.data : [];
          if (Array.isArray(orgs) && orgs.length) {
            allEstablishments = orgs;
          }
        } catch {}
        setDoctors(medicalStaff);
        setEstablishments(allEstablishments);
      } catch {
        setDoctors([]);
        setEstablishments([]);
      }
    };
    fetchData();
  }, []);

  // Suggestion builder (web logic adapted)
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      const q = query.trim().toLowerCase();
      if (!q) {
        setSuggestions([]);
        setShowSuggestions(false);
        return;
      }
      const suggestionsLocal: any[] = [];
      const allUsers = [...establishments, ...doctors];
      const uniqueUsers = allUsers.filter((user, index, self) => user && self.findIndex((u) => u && u.id === user.id) === index);

      const matchingUsers = uniqueUsers
        .filter((user: any) => {
          if (!user) return false;
          const firstName = typeof user.prenom === 'string' ? user.prenom.toLowerCase() : '';
          const lastName = typeof user.nom === 'string' ? user.nom.toLowerCase() : '';
          const fullName = `${firstName} ${lastName}`.trim();
          const name = typeof user.name === 'string' ? user.name.toLowerCase() : '';
          const userRoleName = user.role?.name || user.role || '';
          const role = typeof userRoleName === 'string' ? userRoleName.toLowerCase() : '';
          const city = typeof user.ville === 'string' ? user.ville.toLowerCase() : '';
          return firstName.includes(q) || lastName.includes(q) || fullName.includes(q) || name.includes(q) || role.includes(q) || city.includes(q);
        })
        .slice(0, 40);

      const looksLikePersonName = (s?: string) => {
        if (!s || typeof s !== 'string') return false;
        const lower = s.toLowerCase();
        const orgMarkers = ['clinique','pharmacie','parapharmacie','laboratoire','labo','centre','hopital','hospital','cabinet'];
        if (orgMarkers.some((m) => lower.includes(m))) return false;
        const parts = s.trim().split(/\s+/);
        return parts.length >= 2;
      };

      matchingUsers.forEach((user: any) => {
        let category = 'Professionnel';
        let icon = 'doctor';
        let title = '';
        const userRoleName = user.role?.name || user.role || user.type || user.role_name || '';
        const userRoleStr = typeof userRoleName === 'string' ? userRoleName.toLowerCase() : '';
        const userTypeStr = typeof user?.type === 'string' ? user.type.toLowerCase() : '';
        if (userRoleStr === 'doctor' || userRoleStr === 'medecin') { category = 'Médecin'; icon = 'doctor'; title = 'Dr.'; }
        else if (userRoleStr === 'dentist' || userRoleStr === 'dentiste') { category = 'Dentiste'; icon = 'dentist'; title = 'Dr.'; }
        else if (userRoleStr === 'specialist' || userRoleStr === 'specialiste') { category = 'Spécialiste'; icon = 'specialist'; title = 'Dr.'; }
        else if (userRoleStr === 'nurse' || userRoleStr === 'infirmier') { category = 'Infirmier'; icon = 'nurse'; title = ''; }
        else if (userRoleStr === 'pharmacy' || userRoleStr === 'pharmacie') { category = 'Pharmacie'; icon = 'pharmacy'; }
        else if (userRoleStr === 'parapharmacie' || userRoleStr === 'para-pharmacie' || userRoleStr === 'parapharmacy') { category = 'Parapharmacie'; icon = 'pharmacy'; }
        else if (userRoleStr === 'clinic' || userRoleStr === 'clinique') { category = 'Clinique'; icon = 'clinic'; }
        else if (userRoleStr === 'hospital' || userRoleStr === 'hopital') { category = 'Hôpital'; icon = 'hospital'; }
        else if (userRoleStr === 'laboratory' || userRoleStr === 'laboratoire' || userRoleStr === 'labo_analyse') { category = 'Laboratoire'; icon = 'lab'; }
        else if (userRoleStr === 'centre_radiologie') { category = 'Centre de radiologie'; icon = 'lab'; }
        else { const roleName = user.role?.name || user.role || 'Professionnel'; category = typeof roleName === 'string' ? roleName.charAt(0).toUpperCase() + roleName.slice(1) : 'Professionnel'; icon = 'doctor'; title = ''; }

        const orgRoles = ['clinique','clinic','pharmacie','pharmacy','parapharmacie','centre','centre_radiologie','hospital','hopital','laboratory','laboratoire','labo_analyse','organization','organisation'];
        const isOrganization = orgRoles.includes(userRoleStr) || orgRoles.includes(userTypeStr);
        const fullName = `${user.prenom || user.first_name || ''} ${user.nom || user.last_name || ''}`.trim();
        const cachedOrg = orgCacheRef.current[user.id] || {};
        const orgName = user.nom_clinique || user.nom_pharmacie || user.nom_parapharmacie || user.nom_centre || user.nom_labo || user.org_name || user.organization_name || user.organisation_name || cachedOrg.nom_clinique || cachedOrg.nom_pharmacie || cachedOrg.nom_parapharmacie || cachedOrg.nom_centre || cachedOrg.nom_labo || cachedOrg.org_name || cachedOrg.name || (isOrganization ? user.name : null);
        const baseName = isOrganization ? (orgName || user.org_name || user.organization_name || user.organisation_name || user.name || 'Établissement') : (fullName || user.name || '');
        const finalName = (!isOrganization && title) ? `${title} ${baseName}` : baseName;
        const usedOrgName = Boolean(isOrganization && orgName);
        if (isOrganization && !usedOrgName) {
          const hasCached = Boolean(cachedOrg && (cachedOrg.nom_clinique || cachedOrg.nom_pharmacie || cachedOrg.nom_parapharmacie || cachedOrg.nom_centre || cachedOrg.nom_labo || cachedOrg.org_name || cachedOrg.name));
          const personalLike = looksLikePersonName(user.name || '');
          if (!hasCached && personalLike) {
            return; // skip until enrichment fills org name
          }
        }

        const normalizeSpec = (val: any): string => {
          if (!val) return '';
          if (Array.isArray(val)) { const first = val.find(Boolean); return first ? String(first).trim() : ''; }
          if (typeof val === 'string') {
            let s = val.trim();
            if (!s) return '';
            if ((s.startsWith('[') && s.endsWith(']')) || (s.startsWith('{') && s.endsWith('}'))) {
              try { const parsed = JSON.parse(s); if (Array.isArray(parsed)) { const first = parsed.find(Boolean); return first ? String(first).trim() : ''; } } catch {}
            }
            if (s.includes(',')) return s.split(',')[0].trim();
            return s;
          }
          if (typeof val === 'object' && (val as any).name) return String((val as any).name).trim();
          try { return String(val).trim(); } catch { return ''; }
        };
        const beautifySpec = (s: string) => {
          if (!s) return '';
          let t = String(s).trim();
          const lower = t.toLowerCase();
          if (lower === 'psychiaterie' || lower === 'psychiatrie' || lower === 'psychiatrìe') return 'Psychiatrie';
          if (lower === 'kine') return 'Kinésithérapie';
          return t.charAt(0).toUpperCase() + t.slice(1);
        };
        const rawSpecCandidates = [
          user.specialite, user.specialty, user.specialites, user.specialities, user.specialties,
          user.profile?.specialite, user.profile?.speciality, user.profile?.specialty, user.profile?.specialites, user.profile?.specialities, user.profile?.specialties,
          user.medecinProfile?.specialite, user.medecinProfile?.specialty, user.medecinProfile?.specialites, user.medecinProfile?.specialities, user.medecinProfile?.specialties,
          user.kineProfile?.specialite, user.kineProfile?.specialty,
          user.orthophonisteProfile?.specialite, user.orthophonisteProfile?.specialty,
          user.psychologueProfile?.specialite, user.psychologueProfile?.specialty,
          profCacheRef.current[user.id]?.specialty,
        ];
        let specialtyCandidate = '';
        for (const c of rawSpecCandidates) { const sc = normalizeSpec(c); if (sc) { specialtyCandidate = sc; break; } }
        const roleId = user.role_id;
        const professionSpecialtyLabel = (
          roleId === 6 || userRoleStr === 'psychologue' ? 'Psychologue' :
          roleId === 5 || userRoleStr === 'orthophoniste' ? 'Orthophoniste' :
          roleId === 3 || userRoleStr === 'kine' || userRoleStr === 'kiné' || userRoleStr === 'kinesitherapeute' || userRoleStr === 'kinésithérapeute' ? 'Kinésithérapeute' :
          'Médecine générale'
        );
        suggestionsLocal.push({
          name: finalName,
          specialty: beautifySpec(specialtyCandidate) || professionSpecialtyLabel,
          location: user.ville || user.city || user.adresse || user.address || '',
          category,
          type: icon,
          id: user.id,
          profile: user,
          isOrganization,
          usedOrgName,
        });
      });

      suggestionsLocal.sort((a, b) => {
        const aOrgName = a.usedOrgName ? 1 : 0;
        const bOrgName = b.usedOrgName ? 1 : 0;
        if (bOrgName - aOrgName !== 0) return bOrgName - aOrgName;
        const aOrg = a.isOrganization ? 1 : 0;
        const bOrg = b.isOrganization ? 1 : 0;
        if (bOrg - aOrg !== 0) return bOrg - aOrg;
        const ql = q;
        const aName = (a.name || '').toLowerCase();
        const bName = (b.name || '').toLowerCase();
        const aStarts = aName.startsWith(ql) ? 1 : 0;
        const bStarts = bName.startsWith(ql) ? 1 : 0;
        if (bStarts - aStarts !== 0) return bStarts - aStarts;
        const aIdx = aName.indexOf(ql);
        const bIdx = bName.indexOf(ql);
        if (aIdx !== bIdx) return aIdx - bIdx;
        return a.name.localeCompare(b.name, 'fr', { sensitivity: 'base' as any });
      });
      setSuggestions(suggestionsLocal);
      setShowSuggestions(suggestionsLocal.length > 0);
    }, 150);
    return () => clearTimeout(timeoutId);
  }, [query, doctors, establishments, orgCacheTick, profCacheTick]);

  const onUseLocation = () => {
    Alert.alert(
      'Proximité',
      "La recherche par proximité n'est pas encore activée dans cette démo.",
    );
  };

  const onSearch = () => {
    const city = (selectedCity || cityQuery || '').trim();
    if (city && city.toLowerCase() !== 'toutes les villes') {
      router.push({ pathname: '/recherche/[city]', params: { city } } as any);
      return;
    }
    router.push('/recherche' as any);
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: themeColors.bg }}>
      <View pointerEvents="none" style={styles.bgShapes}>
        <Animated.View
          style={[
            styles.shapeTR,
            {
              transform: [
                { translateX: bgAnims[0].interpolate({ inputRange: [0, 1], outputRange: [0, 10] }) },
                { translateY: bgAnims[0].interpolate({ inputRange: [0, 1], outputRange: [0, -8] }) },
                { scale: bgAnims[0].interpolate({ inputRange: [0, 1], outputRange: [0.98, 1.04] }) },
              ],
              opacity: bgAnims[0].interpolate({ inputRange: [0, 1], outputRange: [0.9, 1] }),
            },
          ]}
        />
        <Animated.View
          style={[
            styles.shapeCL,
            {
              transform: [
                { translateX: bgAnims[1].interpolate({ inputRange: [0, 1], outputRange: [0, -10] }) },
                { translateY: bgAnims[1].interpolate({ inputRange: [0, 1], outputRange: [0, 10] }) },
                { scale: bgAnims[1].interpolate({ inputRange: [0, 1], outputRange: [1.0, 1.06] }) },
              ],
              opacity: bgAnims[1].interpolate({ inputRange: [0, 1], outputRange: [0.85, 1] }),
            },
          ]}
        />
        <Animated.View
          style={[
            styles.shapeBR,
            {
              transform: [
                { translateX: bgAnims[2].interpolate({ inputRange: [0, 1], outputRange: [0, 8] }) },
                { translateY: bgAnims[2].interpolate({ inputRange: [0, 1], outputRange: [0, 8] }) },
                { scale: bgAnims[2].interpolate({ inputRange: [0, 1], outputRange: [0.96, 1.03] }) },
              ],
              opacity: bgAnims[2].interpolate({ inputRange: [0, 1], outputRange: [0.85, 0.98] }),
            },
          ]}
        />
        <Animated.View
          style={[
            styles.shapeX1,
            {
              transform: [
                { translateX: bgAnims[3].interpolate({ inputRange: [0, 1], outputRange: [0, -12] }) },
                { translateY: bgAnims[3].interpolate({ inputRange: [0, 1], outputRange: [0, -6] }) },
                { scale: bgAnims[3].interpolate({ inputRange: [0, 1], outputRange: [0.97, 1.05] }) },
              ],
              opacity: bgAnims[3].interpolate({ inputRange: [0, 1], outputRange: [0.8, 0.95] }),
            },
          ]}
        />
        <Animated.View
          style={[
            styles.shapeX2,
            {
              transform: [
                { translateX: bgAnims[4].interpolate({ inputRange: [0, 1], outputRange: [0, 10] }) },
                { translateY: bgAnims[4].interpolate({ inputRange: [0, 1], outputRange: [0, -10] }) },
                { scale: bgAnims[4].interpolate({ inputRange: [0, 1], outputRange: [0.98, 1.05] }) },
              ],
              opacity: bgAnims[4].interpolate({ inputRange: [0, 1], outputRange: [0.82, 0.96] }),
            },
          ]}
        />
      </View>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          {/* Header */}
          <View style={[styles.header, { backgroundColor: themeColors.headerBg }] }>
            <View style={styles.brandLeft}>
              <Image source={require('../../assets/images/visante.png')} style={styles.logoImage} />
              <Text style={[styles.brandText, { color: themeColors.text }]}>Vi-Santé</Text>
            </View>
            <View style={styles.headerActions}>
              <Pressable style={styles.headerIcon} onPress={() => setTheme((t) => (t === 'light' ? 'dark' : 'light'))}>
                <Ionicons name={theme === 'dark' ? 'sunny-outline' : 'moon-outline'} size={22} color={themeColors.primary} />
              </Pressable>
              <Pressable style={styles.headerIcon} onPress={() => router.push('/auth/patient' as any)}>
                <Ionicons name="person-circle-outline" size={28} color={themeColors.primary} />
              </Pressable>
            </View>
          </View>

          {/* Hero */}
          <View style={styles.hero}>
            <View style={styles.badge}>
              <Ionicons name="star" size={14} color="#FCD34D" />
              <Text style={styles.badgeText}>N°1 au Maroc</Text>
            </View>
            <Text style={styles.heroTitle}>Trouvez votre{`\n`}médecin facilement</Text>
            <Text style={styles.heroSubtitle}>Prenez rendez-vous en quelques clics</Text>
            <Image source={require('../../assets/images/visante.png')} style={styles.heroLogo} />
          </View>

          {/* Floating Search Card */}
          <View style={styles.searchCardContainer}>
            <View style={[styles.searchCard, { backgroundColor: themeColors.glassBg, borderColor: themeColors.glassBorder }]}>
              {/* Query input */}
              <View style={styles.inputWrap}>
                <Ionicons name="search" size={20} color="#9CA3AF" style={styles.inputIcon} />
                <TextInput
                  value={query}
                  onChangeText={(t) => {
                    setQuery(t);
                    setShowSuggestions(true);
                  }}
                  onFocus={() => setShowSuggestions(true)}
                  placeholder="Rechercher un médecin..."
                  placeholderTextColor={themeColors.placeholder}
                  style={[styles.textInput, { backgroundColor: themeColors.inputBg, color: themeColors.text }]}
                  returnKeyType="search"
                  onSubmitEditing={onSearch}
                />

                {showSuggestions && suggestions.length > 0 && (
                  <View style={[styles.suggestions, { backgroundColor: themeColors.card, borderColor: themeColors.border }]}>
                    <FlatList
                      data={suggestions}
                      keyExtractor={(item) => String(item.id)}
                      keyboardShouldPersistTaps="handled"
                      renderItem={({ item }) => (
                        <Pressable
                          onPress={() => {
                            try {
                              const nameSlug = createSlug(item.name);
                              router.push({ pathname: '/recherche/profil/[nameSlug]', params: { nameSlug } } as any);
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
                            <Text style={[styles.suggestionTitle, { color: themeColors.text }]} numberOfLines={1}>{item.name}</Text>
                            {!!item.specialty && (
                              <Text style={[styles.suggestionSub, { color: themeColors.textMuted }]} numberOfLines={1}>{item.specialty}</Text>
                            )}
                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                              <Ionicons name="location" size={12} color={themeColors.textMuted} />
                              <Text style={[styles.suggestionLoc, { color: themeColors.textMuted }]} numberOfLines={1}>{item.location || ''}</Text>
                            </View>
                          </View>
                          <View style={styles.suggestionBadge}>
                            <Text style={styles.suggestionBadgeText}>{item.isOrganization ? (item.category || 'Établissement') : 'Profil'}</Text>
                          </View>
                        </Pressable>
                      )}
                      ItemSeparatorComponent={() => <View style={[styles.divider, { backgroundColor: themeColors.border }]} />}
                      style={{ maxHeight: 240 }}
                    />
                  </View>
                )}
              </View>

              {/* City input */}
              <View style={[styles.inputWrap, { marginTop: 10 }]}>
                <Ionicons name="location-outline" size={20} color="#9CA3AF" style={styles.inputIcon} />
                <TextInput
                  value={cityQuery}
                  onChangeText={(t) => {
                    setCityQuery(t);
                    setShowCityList(true);
                  }}
                  onFocus={() => setShowCityList(true)}
                  placeholder={selectedCity || 'Ville'}
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
                      <Text style={[styles.suggestionTitle, { color: '#111827' }]}>Toutes les villes</Text>
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
                          <Text style={[styles.suggestionTitle, { color: '#111827' }]}>{item}</Text>
                        </Pressable>
                      )}
                      style={{ maxHeight: 180 }}
                    />
                  </View>
                )}
              </View>

              {/* Buttons */}
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

          {/* Quick Stats */}
          <View style={[styles.section, styles.zLeft]}>
            <View style={styles.statsRow}>
              <View style={styles.statItem}>
                <View style={[styles.statIconCircle, { backgroundColor: '#DBEAFE' }]}> 
                  <Ionicons name="people" size={24} color="#3B82F6" />
                </View>
                <AnimatedCounter target={patientsCount} duration={1200} autoIncrementEveryMs={10000} />
                <Text style={styles.statLabel}>Patients</Text>
              </View>
              <View style={styles.statItem}>
                <View style={[styles.statIconCircle, { backgroundColor: '#D1FAE5' }]}> 
                  <FontAwesome5 name="user-md" size={20} color="#10B981" />
                </View>
                <AnimatedCounter target={doctorsCount} duration={1200} autoIncrementEveryMs={600000} />
                <Text style={styles.statLabel}>Médecins</Text>
              </View>
              <View style={styles.statItem}>
                <View style={[styles.statIconCircle, { backgroundColor: '#FCE7F3' }]}> 
                  <Ionicons name="medkit" size={22} color="#EC4899" />
                </View>
                <AnimatedCounter target={pharmaciesCount} duration={1200} autoIncrementEveryMs={3600000} />
                <Text style={styles.statLabel}>Pharmacies</Text>
              </View>
            </View>
          </View>

          {/* Services */}
          <View style={[styles.section, styles.zRight]}>
            <Text style={[styles.sectionTitle, { color: themeColors.text }]}>Nos Services</Text>
            <View style={styles.timeline}>
              {[
                { key: 'Recherche', icon: 'search' as const, bg: '#EFF6FF', color: '#3B82F6', text: 'Trouvez facilement des professionnels' },
                { key: 'Rendez-vous', icon: 'calendar' as const, bg: '#F0FDF4', color: '#10B981', text: 'Prenez RDV en ligne' },
                { key: 'Messages', icon: 'chatbubbles' as const, bg: '#FEF3C7', color: '#F59E0B', text: 'Communiquez directement' },
              ].map((s, idx) => (
                <View key={s.key} style={[styles.timelineItem, idx % 2 === 0 ? styles.alignLeft : styles.alignRight]}>
                  <View style={[styles.timelineCard, { backgroundColor: themeColors.card }]}>
                    <View style={[styles.serviceIcon, { backgroundColor: s.bg }]}>
                      <Ionicons name={s.icon} size={26} color={s.color} />
                    </View>
                    <Text style={[styles.serviceTitle, { color: themeColors.text }]}>{s.key}</Text>
                    <Text style={[styles.serviceText, { color: themeColors.textMuted }]}>{s.text}</Text>
                  </View>
                </View>
              ))}
            </View>
          </View>

          {/* How it works */}
          <View style={[styles.section, styles.zLeft]}>
            <Text style={[styles.sectionTitle, { color: themeColors.text }]}>Comment ça marche</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.stepsHorizontal}>
              <View style={[styles.stepRow, { backgroundColor: themeColors.card }]}>
                <View style={[styles.stepBadge, { backgroundColor: '#3B82F6' }]}>
                  <Text style={styles.stepNumber}>1</Text>
                </View>
                <View style={styles.stepContent}>
                  <Text style={styles.stepTitle}>Créez votre compte</Text>
                  <Text style={styles.stepText}>Inscription gratuite en quelques secondes</Text>
                </View>
              </View>
              <View style={[styles.stepRow, { backgroundColor: themeColors.card }]}>
                <View style={[styles.stepBadge, { backgroundColor: '#10B981' }]}>
                  <Text style={styles.stepNumber}>2</Text>
                </View>
                <View style={styles.stepContent}>
                  <Text style={styles.stepTitle}>Recherchez un professionnel</Text>
                  <Text style={styles.stepText}>Parcourez notre réseau de médecins</Text>
                </View>
              </View>
              <View style={[styles.stepRow, { backgroundColor: themeColors.card }]}>
                <View style={[styles.stepBadge, { backgroundColor: '#F59E0B' }]}>
                  <Text style={styles.stepNumber}>3</Text>
                </View>
                <View style={styles.stepContent}>
                  <Text style={styles.stepTitle}>Prenez rendez-vous</Text>
                  <Text style={styles.stepText}>Choisissez votre créneau et confirmez</Text>
                </View>
              </View>
            </ScrollView>
          </View>

          {/* Testimonials */}
          <View style={[styles.section, styles.zRight, { backgroundColor: theme === 'dark' ? '#0B1220' : '#F9FAFB', marginHorizontal: 0, paddingHorizontal: 16, paddingVertical: 24, marginTop: 12 }]}>
            <Text style={[styles.sectionTitle, { color: themeColors.text }]}>Témoignages</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 16, paddingHorizontal: 4 }}>
              {[
                {
                  name: 'Sarah M.',
                  location: 'Casablanca',
                  rating: 5,
                  text:
                    "Excellent service ! J'ai pu prendre rendez-vous avec un cardiologue en quelques clics. L'interface est très intuitive.",
                  specialty: 'Cardiologie',
                },
                {
                  name: 'Ahmed K.',
                  location: 'Rabat',
                  rating: 5,
                  text:
                    "Vi-santé m'a fait économiser beaucoup d'argent sur mes consultations. Le système de réduction fonctionne parfaitement.",
                  specialty: 'Médecine générale',
                },
                {
                  name: 'Fatima L.',
                  location: 'Marrakech',
                  rating: 5,
                  text:
                    'Très pratique pour prendre des rendez-vous pour toute la famille. Les médecins sont professionnels et à l\'écoute.',
                  specialty: 'Pédiatrie',
                },
              ].map((t, i) => (
                <View key={i} style={[styles.testimonialCard, { backgroundColor: themeColors.card }]}>
                  <Text style={[styles.testimonialText, { color: themeColors.textMuted }]}>"{t.text}"</Text>
                  <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 12 }}>
                    <View style={styles.avatar}>
                      <Text style={styles.avatarText}>{t.name.charAt(0)}</Text>
                    </View>
                    <View style={{ marginLeft: 8, flex: 1 }}>
                      <Text style={{ fontWeight: '600', color: themeColors.text, fontSize: 12 }}>{t.name}</Text>
                      <Text style={{ color: themeColors.textMuted, fontSize: 11 }}>{t.location}</Text>
                    </View>
                  </View>
                </View>
              ))}
            </ScrollView>
          </View>

          {/* Data protection */}
          <View style={[styles.section, styles.zLeft]}>
            <Text style={[styles.sectionTitle, { color: themeColors.text }]}>Vos données protégées</Text>
            <View style={styles.protectionGrid}>
              <View style={[styles.protectionCard, { backgroundColor: themeColors.card }]}>
                <Ionicons name="shield-checkmark" size={24} color="#10B981" />
                <Text style={[styles.protectionTitle, { color: themeColors.text }]}>Sécurisé</Text>
              </View>
              <View style={[styles.protectionCard, { backgroundColor: themeColors.card }]}>
                <Ionicons name="lock-closed" size={24} color="#3B82F6" />
                <Text style={[styles.protectionTitle, { color: themeColors.text }]}>Privé</Text>
              </View>
            </View>
          </View>

          {/* Footer */}
          <View style={[styles.footer, { backgroundColor: themeColors.footerBg }]}>
            <View style={styles.footerBrand}>
              <Image source={require('../../assets/images/visante.png')} style={styles.footerLogo} />
              <Text style={[styles.footerBrandText, { color: themeColors.text }]}>Vi-Santé</Text>
            </View>
            <Text style={[styles.footerText, { color: themeColors.textMuted }]}>Votre santé, notre priorité</Text>
            <Text style={[styles.footerCopy, { color: themeColors.textMuted }]}>© 2025 Vi-Santé. Tous droits réservés.</Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
      <DevTools />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingBottom: 56,
  },
  bgShapes: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 0,
  },
  shapeTR: {
    position: 'absolute',
    top: -80,
    right: -60,
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: 'rgba(59,130,246,0.06)',
  },
  shapeCL: {
    position: 'absolute',
    top: 320,
    left: -80,
    width: 240,
    height: 240,
    borderRadius: 120,
    backgroundColor: 'rgba(16,185,129,0.05)',
  },
  shapeBR: {
    position: 'absolute',
    bottom: -120,
    right: -100,
    width: 300,
    height: 300,
    borderRadius: 150,
    backgroundColor: 'rgba(168,85,247,0.04)',
  },
  shapeX1: {
    position: 'absolute',
    top: 140,
    right: -60,
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: 'rgba(37,99,235,0.05)',
  },
  shapeX2: {
    position: 'absolute',
    bottom: 120,
    left: -70,
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: 'rgba(16,185,129,0.05)',
  },
  zLeft: {
    paddingLeft: 20,
    paddingRight: 36,
    marginTop: 4,
    marginBottom: 4,
  },
  zRight: {
    paddingLeft: 36,
    paddingRight: 20,
    marginTop: 4,
    marginBottom: 4,
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#fff',
  },
  brandLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  brandLogo: {
    width: 24,
    height: 24,
  },
  logoImage: {
    width: 28,
    height: 28,
    resizeMode: 'contain',
  },
  logoCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#3B82F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  brandText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  headerIcon: {
    padding: 4,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerLink: {
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: '#EFF6FF',
  },
  headerLinkText: {
    color: '#2563EB',
    fontWeight: '600',
  },
  headerCta: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: '#2563EB',
  },
  headerCtaText: {
    color: '#fff',
    fontWeight: '700',
  },
  hero: {
    backgroundColor: '#3B82F6',
    paddingHorizontal: 24,
    paddingTop: 32,
    paddingBottom: 88,
    alignItems: 'center',
  },
  zMark: {
    position: 'absolute',
    right: 12,
    top: 0,
    opacity: 0.06,
  },
  zMarkText: {
    color: '#fff',
    fontSize: 180,
    fontWeight: '900',
    lineHeight: 180,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 12,
    marginBottom: 12,
  },
  badgeText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 12,
  },
  heroTitle: {
    color: '#fff',
    textAlign: 'center',
    fontSize: 28,
    fontWeight: '700',
    lineHeight: 34,
    marginBottom: 8,
  },
  heroSubtitle: {
    color: 'rgba(255,255,255,0.8)',
    textAlign: 'center',
    fontSize: 14,
    fontWeight: '400',
  },
  heroLogo: {
    width: 120,
    height: 36,
    resizeMode: 'contain',
    marginTop: 12,
    opacity: 0.9,
  },
  searchCardContainer: {
    paddingHorizontal: 20,
    marginTop: -40,
    marginBottom: 32,
  },
  searchCard: {
    backgroundColor: 'rgba(255,255,255,0.72)',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.42)',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 2,
  },
  inputWrap: {
    position: 'relative',
  },
  inputIcon: {
    position: 'absolute',
    left: 12,
    top: 12,
  },
  textInput: {
    paddingLeft: 40,
    paddingRight: 12,
    paddingVertical: 14,
    borderRadius: 12,
    fontSize: 15,
    color: '#111827',
    backgroundColor: '#F8FAFC',
    borderWidth: 0,
  },
  suggestions: {
    position: 'absolute',
    top: 48 + 8,
    left: 0,
    right: 0,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 6,
    zIndex: 50,
  },
  suggestionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
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
  },
  suggestionSub: {
    color: '#6B7280',
    fontSize: 12,
  },
  suggestionLoc: {
    color: '#9CA3AF',
    fontSize: 11,
  },
  suggestionBadge: {
    marginLeft: 8,
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
  },
  suggestionBadgeText: {
    color: '#2563EB',
    fontSize: 12,
    fontWeight: '600',
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
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  roundBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchCta: {
    flex: 1,
    backgroundColor: '#3B82F6',
    paddingVertical: 12,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  searchCtaText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 15,
  },
  section: {
    paddingHorizontal: 20,
    paddingTop: 40,
    paddingBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 20,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 4,
  },
  statItem: {
    alignItems: 'center',
    gap: 6,
  },
  statIconCircle: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statLabel: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '500',
  },
  grid3: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    justifyContent: 'space-between',
  },
  grid4: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    justifyContent: 'space-between',
  },
  card: {
    flexBasis: '48%',
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    padding: 12,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 4,
    color: '#111827',
  },
  cardText: {
    color: '#6B7280',
    textAlign: 'center',
    fontSize: 13,
  },
  statCard: {
    flexBasis: '48%',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  counterPrefix: {
    fontSize: 24,
    fontWeight: '900',
  },
  counterNumber: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111827',
  },
  servicesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  timeline: {
    position: 'relative',
    gap: 16,
  },
  timelineItem: {
    width: '82%',
    marginVertical: 6,
  },
  alignLeft: {
    alignSelf: 'flex-start',
  },
  alignRight: {
    alignSelf: 'flex-end',
  },
  timelineCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  serviceCard: {
    flexBasis: '48%',
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
  },
  serviceIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  serviceTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
    textAlign: 'center',
  },
  serviceText: {
    fontSize: 12,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 16,
  },
  cardSubTitle: {
    marginTop: 4,
    color: '#374151',
    fontWeight: '600',
    textAlign: 'center',
  },
  stepsContainer: {
    gap: 12,
  },
  stepsHorizontal: {
    paddingHorizontal: 4,
    gap: 12,
  },
  stepRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 16,
  },
  stepBadge: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepNumber: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  stepContent: {
    flex: 1,
  },
  stepTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 2,
  },
  stepText: {
    fontSize: 12,
    color: '#64748B',
    lineHeight: 16,
  },
  testimonialCard: {
    width: 280,
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 20,
  },
  testimonialText: {
    color: '#475569',
    fontSize: 13,
    lineHeight: 18,
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#3B82F6',
  },
  avatarText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 12,
  },
  protectionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  protectionCard: {
    flexBasis: '48%',
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
  },
  protectionTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#111827',
    marginTop: 8,
    textAlign: 'center',
  },
  stepCard: {
    flexBasis: '48%',
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    padding: 12,
  },
  stepHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  stepCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 1,
  },
  stepNum: {
    color: '#fff',
    fontWeight: '800',
  },
  stepIconWrap: {
    marginLeft: 10,
    padding: 8,
    backgroundColor: '#DBEAFE',
    borderRadius: 999,
  },
  dpCard: {
    flexBasis: '48%',
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    padding: 12,
  },
  dpIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ECFDF5',
    marginBottom: 8,
  },
  dpTitle: {
    fontWeight: '700',
    color: '#111827',
    marginBottom: 4,
  },
  dpText: {
    color: '#6B7280',
    fontSize: 13,
  },
  footer: {
    paddingVertical: 40,
    paddingHorizontal: 20,
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    marginTop: 32,
  },
  footerBrand: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  footerLogo: {
    width: 28,
    height: 28,
    resizeMode: 'contain',
  },
  footerBrandText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  footerText: {
    fontSize: 13,
    color: '#64748B',
    marginBottom: 8,
    textAlign: 'center',
  },
  footerCopy: {
    fontSize: 11,
    color: '#94A3B8',
    textAlign: 'center',
  },
});
