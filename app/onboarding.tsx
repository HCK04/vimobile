import React, { useRef, useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  Pressable,
  StyleSheet,
  Dimensions,
  StatusBar,
  Platform,
  Animated,
  TextInput,
  LayoutAnimation,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

const COLORS = {
  primary: '#2563EB',
  primaryDark: '#1D4ED8',
  primaryLight: '#60A5FA',
  primarySurface: '#EFF6FF',
  success: '#10B981',
  background: '#FFFFFF',
  text: {
    primary: '#111827',
    secondary: '#6B7280',
    tertiary: '#9CA3AF',
  },
  border: '#E5E7EB',
};

const SPACING = {
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
};

const ONBOARDING_KEY = '@vi-sante:onboarding_completed';

export default function OnboardingScreen() {
  const router = useRouter();
  const flatListRef = useRef<FlatList>(null);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [selectedRole, setSelectedRole] = useState<'patient' | 'professional'>('patient');

  // Animation Values
  const scrollX = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const demoSearchAnim = useRef(new Animated.Value(0)).current;

  // Search Demo Text Animation
  const [searchText, setSearchText] = useState('');
  useEffect(() => {
    if (currentSlide === 0) {
      // Typewriter effect simulation
      let text = "Cardiologue...";
      let currentIndex = 0;
      const interval = setInterval(() => {
        if (currentIndex <= text.length) {
          setSearchText(text.slice(0, currentIndex));
          currentIndex++;
        } else {
          clearInterval(interval);
        }
      }, 150);
      return () => clearInterval(interval);
    }
  }, [currentSlide]);

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 800,
      useNativeDriver: true,
    }).start();
  }, []);

  const handleNext = () => {
    if (currentSlide < 2) {
      flatListRef.current?.scrollToIndex({ index: currentSlide + 1 });
    } else {
      completeOnboarding();
    }
  };

  const completeOnboarding = async () => {
    try {
      await AsyncStorage.setItem(ONBOARDING_KEY, 'true');
      if (selectedRole === 'patient') {
        router.replace('/auth/patient');
      } else {
        router.replace('/auth/professional');
      }
    } catch (error) {
      console.error('Error', error);
    }
  };

  const SlideOne = () => (
    <View style={styles.slideContent}>
      <View style={styles.iconContainer}>
        <LinearGradient
          colors={[COLORS.primarySurface, '#FFFFFF']}
          style={styles.iconBackground}
        >
          <Ionicons name="search" size={60} color={COLORS.primary} />
        </LinearGradient>
      </View>

      <Text style={styles.title}>Trouvez votre{"\n"}spécialiste</Text>
      <Text style={styles.subtitle}>Plus de 10 000 praticiens disponibles</Text>

      {/* Interactive Feature: Fake Search Bar */}
      <View style={styles.demoSearchContainer}>
        <Ionicons name="search-outline" size={20} color={COLORS.text.tertiary} />
        <Text style={styles.demoSearchText}>{searchText}|</Text>
        <View style={styles.demoSearchButton}>
          <Ionicons name="arrow-forward" size={16} color="#FFF" />
        </View>
      </View>

      <View style={styles.featuresRow}>
        <View style={styles.miniFeature}>
          <Ionicons name="calendar-outline" size={20} color={COLORS.primary} />
          <Text style={styles.miniFeatureText}>24h/24</Text>
        </View>
        <View style={styles.verticalDivider} />
        <View style={styles.miniFeature}>
          <Ionicons name="location-outline" size={20} color={COLORS.primary} />
          <Text style={styles.miniFeatureText}>Proche</Text>
        </View>
        <View style={styles.verticalDivider} />
        <View style={styles.miniFeature}>
          <Ionicons name="videocam-outline" size={20} color={COLORS.primary} />
          <Text style={styles.miniFeatureText}>Vidéo</Text>
        </View>
      </View>
    </View>
  );

  const SlideTwo = () => (
    <View style={styles.slideContent}>
      <View style={styles.iconContainer}>
        <LinearGradient
          colors={['#ECFDF5', '#FFFFFF']}
          style={styles.iconBackground}
        >
          <Ionicons name="shield-checkmark" size={60} color={COLORS.success} />
        </LinearGradient>
      </View>

      <Text style={styles.title}>Vos données{"\n"}sécurisées</Text>
      <Text style={styles.subtitle}>Chiffrement de bout en bout</Text>

      {/* Visual Feature: Security Shield */}
      <View style={styles.securityCardContainer}>
        <View style={styles.securityCard}>
          <View style={styles.securityRow}>
            <Ionicons name="lock-closed" size={18} color={COLORS.success} />
            <Text style={styles.securityText}>Documents chiffrés</Text>
          </View>
          <View style={styles.securityRow}>
            <Ionicons name="finger-print" size={18} color={COLORS.success} />
            <Text style={styles.securityText}>Accès biométrique</Text>
          </View>
          <View style={styles.securityRow}>
            <Ionicons name="server" size={18} color={COLORS.success} />
            <Text style={styles.securityText}>Hébergement agréé</Text>
          </View>
        </View>
      </View>
    </View>
  );

  const SlideThree = () => (
    <View style={styles.slideContent}>
      <View style={styles.iconContainer}>
        <LinearGradient
          colors={['#FFF7ED', '#FFFFFF']}
          style={styles.iconBackground}
        >
          <Ionicons name="person" size={60} color="#F59E0B" />
        </LinearGradient>
      </View>

      <Text style={styles.title}>Vous êtes ?</Text>
      <Text style={styles.subtitle}>Sélectionnez votre profil pour continuer</Text>

      {/* Interactive Feature: Role Selector */}
      <View style={styles.roleSelectorContainer}>
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() => setSelectedRole('patient')}
          style={[styles.roleCard, selectedRole === 'patient' && styles.roleCardActive]}
        >
          <View style={[styles.roleIcon, selectedRole === 'patient' ? { backgroundColor: COLORS.primary } : { backgroundColor: COLORS.primarySurface }]}>
            <Ionicons name="person" size={24} color={selectedRole === 'patient' ? '#FFF' : COLORS.primary} />
          </View>
          <Text style={[styles.roleTitle, selectedRole === 'patient' && styles.roleTitleActive]}>Patient</Text>
        </TouchableOpacity>

        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() => setSelectedRole('professional')}
          style={[styles.roleCard, selectedRole === 'professional' && styles.roleCardActiveSuccess]}
        >
          <View style={[styles.roleIcon, selectedRole === 'professional' ? { backgroundColor: COLORS.success } : { backgroundColor: '#ECFDF5' }]}>
            <Ionicons name="medkit" size={24} color={selectedRole === 'professional' ? '#FFF' : COLORS.success} />
          </View>
          <Text style={[styles.roleTitle, selectedRole === 'professional' && styles.roleTitleActive]}>Professionnel</Text>
        </TouchableOpacity>
      </View>

      {/* Dynamic Description based on selection */}
      <View style={styles.roleDescriptionContainer}>
        <Text style={styles.roleDescriptionText}>
          {selectedRole === 'patient'
            ? "Prenez rendez-vous, gérez vos documents et suivez votre santé."
            : "Gérez votre agenda, vos patients et votre téléconsultation."}
        </Text>
      </View>
    </View>
  );

  const slides = [
    { id: '1', component: <SlideOne /> },
    { id: '2', component: <SlideTwo /> },
    { id: '3', component: <SlideThree /> },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.brand}>Vi-Santé</Text>
        {currentSlide < 2 && (
          <TouchableOpacity onPress={() => router.replace('/auth/login')}>
            <Text style={styles.skipText}>Connexion</Text>
          </TouchableOpacity>
        )}
      </View>

      <FlatList
        ref={flatListRef}
        data={slides}
        renderItem={({ item }) => <View style={styles.slideWrapper}>{item.component}</View>}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { x: scrollX } } }],
          {
            useNativeDriver: false, listener: (e: any) => {
              const index = Math.round(e.nativeEvent.contentOffset.x / SCREEN_WIDTH);
              setCurrentSlide(index);
            }
          }
        )}
        scrollEventThrottle={16}
        bounces={false}
        keyExtractor={item => item.id}
      />

      {/* Bottom Action Area */}
      <View style={styles.bottomArea}>
        {/* Pagination Dots */}
        <View style={styles.pagination}>
          {[0, 1, 2].map((_, i) => {
            const inputRange = [(i - 1) * SCREEN_WIDTH, i * SCREEN_WIDTH, (i + 1) * SCREEN_WIDTH];
            const dotWidth = scrollX.interpolate({
              inputRange,
              outputRange: [8, 24, 8],
              extrapolate: 'clamp',
            });
            const opacity = scrollX.interpolate({
              inputRange,
              outputRange: [0.3, 1, 0.3],
              extrapolate: 'clamp',
            });
            return <Animated.View key={i} style={[styles.dot, { width: dotWidth, opacity }]} />;
          })}
        </View>

        {/* Dynamic Main Button */}
        <TouchableOpacity
          style={[
            styles.mainButton,
            currentSlide === 2 && selectedRole === 'professional' && { backgroundColor: COLORS.success }
          ]}
          onPress={handleNext}
          activeOpacity={0.9}
        >
          <Text style={styles.mainButtonText}>
            {currentSlide === 2
              ? (selectedRole === 'patient' ? "Créer mon compte Patient" : "Créer mon compte Pro")
              : "Continuer"}
          </Text>
          <Ionicons name="arrow-forward" size={20} color="#FFF" />
        </TouchableOpacity>

        {currentSlide === 2 && (
          <TouchableOpacity style={styles.loginLink} onPress={() => router.replace('/auth/login')}>
            <Text style={styles.loginLinkText}>J'ai déjà un compte <Text style={{ fontWeight: '700' }}>Se connecter</Text></Text>
          </TouchableOpacity>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
  },
  brand: {
    fontSize: 20,
    fontWeight: '800',
    color: COLORS.primary,
  },
  skipText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text.secondary,
  },
  slideWrapper: {
    width: SCREEN_WIDTH,
    flex: 1, // Fill available space
    justifyContent: 'center', // Center vertically
    paddingBottom: 40, // Offset for bottom area
  },
  slideContent: {
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
    width: '100%',
  },
  iconContainer: {
    marginBottom: SPACING.xl,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 10,
  },
  iconBackground: {
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: COLORS.text.primary,
    textAlign: 'center',
    marginBottom: SPACING.sm,
    lineHeight: 36,
  },
  subtitle: {
    fontSize: 16,
    color: COLORS.text.secondary,
    textAlign: 'center',
    marginBottom: SPACING.xl,
    paddingHorizontal: SPACING.xl,
  },

  // Slide 1 Features
  demoSearchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 16,
    width: '100%',
    marginBottom: SPACING.xl,
  },
  demoSearchText: {
    flex: 1,
    marginLeft: 10,
    fontSize: 16,
    color: COLORS.text.primary,
    fontWeight: '500',
  },
  demoSearchButton: {
    backgroundColor: COLORS.primary,
    width: 28,
    height: 28,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  featuresRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    width: '100%',
  },
  miniFeature: {
    alignItems: 'center',
  },
  miniFeatureText: {
    marginTop: 6,
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.text.secondary,
  },
  verticalDivider: {
    width: 1,
    height: 24,
    backgroundColor: COLORS.border,
  },

  // Slide 2 Features
  securityCardContainer: {
    width: '100%',
  },
  securityCard: {
    backgroundColor: '#FFF',
    borderRadius: 20,
    padding: SPACING.lg,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
  },
  securityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  securityText: {
    marginLeft: 12,
    fontSize: 15,
    fontWeight: '500',
    color: COLORS.text.secondary,
  },

  // Slide 3 Features (Interactive)
  roleSelectorContainer: {
    flexDirection: 'row',
    gap: SPACING.md,
    width: '100%',
    marginBottom: SPACING.lg,
  },
  roleCard: {
    flex: 1,
    backgroundColor: '#FFF',
    borderRadius: 20,
    padding: SPACING.md,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#F3F4F6',
    height: 120,
    justifyContent: 'center',
  },
  roleCardActive: {
    borderColor: COLORS.primary,
    backgroundColor: '#EFF6FF',
  },
  roleCardActiveSuccess: {
    borderColor: COLORS.success,
    backgroundColor: '#ECFDF5',
  },
  roleIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  roleTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.text.secondary,
  },
  roleTitleActive: {
    color: COLORS.text.primary,
    fontWeight: '700',
  },
  roleDescriptionContainer: {
    backgroundColor: '#F9FAFB',
    padding: SPACING.md,
    borderRadius: 12,
    width: '100%',
  },
  roleDescriptionText: {
    textAlign: 'center',
    color: COLORS.text.secondary,
    fontSize: 14,
    lineHeight: 20,
  },

  // Bottom Area
  bottomArea: {
    paddingHorizontal: SPACING.lg,
    paddingBottom: SPACING.xl,
  },
  pagination: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: SPACING.lg,
  },
  dot: {
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.primary,
    marginHorizontal: 4,
  },
  mainButton: {
    flexDirection: 'row',
    backgroundColor: COLORS.primary,
    borderRadius: 16,
    height: 56,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  mainButtonText: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: '700',
    marginRight: 8,
  },
  loginLink: {
    marginTop: SPACING.md,
    alignItems: 'center',
  },
  loginLinkText: {
    fontSize: 14,
    color: COLORS.text.secondary,
  },
});
