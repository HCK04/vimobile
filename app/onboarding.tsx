import React, { useRef, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  StyleSheet,
  Dimensions,
  SafeAreaView,
  NativeScrollEvent,
  NativeSyntheticEvent,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

const ONBOARDING_KEY = '@vi-sante:onboarding_completed';

export default function OnboardingScreen() {
  const router = useRouter();
  const scrollViewRef = useRef<ScrollView>(null);
  const [currentSlide, setCurrentSlide] = useState(0);

  const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const slideIndex = Math.round(event.nativeEvent.contentOffset.x / SCREEN_WIDTH);
    setCurrentSlide(slideIndex);
  };

  const goToSlide = (index: number) => {
    scrollViewRef.current?.scrollTo({ x: SCREEN_WIDTH * index, animated: true });
    setCurrentSlide(index);
  };

  const completeOnboarding = async (userType: 'patient' | 'professional') => {
    try {
      await AsyncStorage.setItem(ONBOARDING_KEY, 'true');
      if (userType === 'patient') {
        router.replace('/auth/patient');
      } else {
        router.replace('/auth/professional');
      }
    } catch (error) {
      console.error('Error saving onboarding status:', error);
    }
  };

  const skipOnboarding = async () => {
    try {
      await AsyncStorage.setItem(ONBOARDING_KEY, 'true');
      router.replace('/(tabs)/accueil');
    } catch (error) {
      console.error('Error saving onboarding status:', error);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Skip Button */}
      {currentSlide < 2 && (
        <Pressable style={styles.skipButton} onPress={skipOnboarding}>
          <Text style={styles.skipText}>Passer</Text>
        </Pressable>
      )}

      {/* Slides */}
      <ScrollView
        ref={scrollViewRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        style={styles.scrollView}
      >
        {/* Slide 1: Welcome */}
        <View style={styles.slide}>
          <View style={styles.slideContent}>
            <View style={styles.iconContainer}>
              <Ionicons name="heart" size={80} color="#2563EB" />
            </View>
            <Text style={styles.title}>Bienvenue sur Vi-Santé</Text>
            <Text style={styles.subtitle}>
              La plateforme N°1 de santé au Maroc
            </Text>
            <Text style={styles.description}>
              Trouvez votre médecin et prenez rendez-vous en quelques clics
            </Text>
          </View>
        </View>

        {/* Slide 2: Trust & Security */}
        <View style={styles.slide}>
          <View style={styles.slideContent}>
            <View style={styles.iconContainer}>
              <Ionicons name="shield-checkmark" size={80} color="#10B981" />
            </View>
            <Text style={styles.title}>Vos données sont protégées</Text>
            <Text style={styles.subtitle}>
              Conforme à la loi marocaine CNDP 09-08
            </Text>
            
            <View style={styles.featuresContainer}>
              <View style={styles.featureItem}>
                <Ionicons name="lock-closed" size={24} color="#2563EB" />
                <Text style={styles.featureText}>Messagerie sécurisée</Text>
              </View>
              <View style={styles.featureItem}>
                <Ionicons name="shield" size={24} color="#2563EB" />
                <Text style={styles.featureText}>Données cryptées</Text>
              </View>
              <View style={styles.featureItem}>
                <Ionicons name="eye-off" size={24} color="#2563EB" />
                <Text style={styles.featureText}>Confidentialité garantie</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Slide 3: Get Started */}
        <View style={styles.slide}>
          <View style={styles.slideContent}>
            <View style={styles.iconContainer}>
              <Ionicons name="location" size={80} color="#F59E0B" />
            </View>
            <Text style={styles.title}>Prêt à commencer ?</Text>
            <Text style={styles.subtitle}>
              Choisissez votre profil pour continuer
            </Text>

            <View style={styles.buttonsContainer}>
              <Pressable
                style={styles.primaryButton}
                onPress={() => completeOnboarding('patient')}
              >
                <Ionicons name="person" size={20} color="#FFFFFF" style={styles.buttonIcon} />
                <Text style={styles.primaryButtonText}>Je suis un patient</Text>
              </Pressable>

              <Pressable
                style={styles.secondaryButton}
                onPress={() => completeOnboarding('professional')}
              >
                <Ionicons name="medkit" size={20} color="#2563EB" style={styles.buttonIcon} />
                <Text style={styles.secondaryButtonText}>Je suis un professionnel</Text>
              </Pressable>

              <Pressable onPress={skipOnboarding} style={styles.skipLinkButton}>
                <Text style={styles.skipLinkText}>Explorer sans compte</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Pagination Dots */}
      <View style={styles.pagination}>
        {[0, 1, 2].map((index) => (
          <Pressable
            key={index}
            onPress={() => goToSlide(index)}
            style={[
              styles.dot,
              currentSlide === index && styles.dotActive,
            ]}
          />
        ))}
      </View>

      {/* Next Button (for slides 0 and 1) */}
      {currentSlide < 2 && (
        <Pressable
          style={styles.nextButton}
          onPress={() => goToSlide(currentSlide + 1)}
        >
          <Text style={styles.nextButtonText}>Suivant</Text>
          <Ionicons name="arrow-forward" size={20} color="#FFFFFF" />
        </Pressable>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  skipButton: {
    position: 'absolute',
    top: 16,
    right: 16,
    zIndex: 10,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  skipText: {
    color: '#6B7280',
    fontSize: 16,
    fontWeight: '600',
  },
  scrollView: {
    flex: 1,
  },
  slide: {
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT - 200,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  slideContent: {
    alignItems: 'center',
    maxWidth: 400,
  },
  iconContainer: {
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: '#F0F9FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 32,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: '#111827',
    textAlign: 'center',
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2563EB',
    textAlign: 'center',
    marginBottom: 16,
  },
  description: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 24,
  },
  featuresContainer: {
    marginTop: 32,
    width: '100%',
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  featureText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginLeft: 16,
  },
  buttonsContainer: {
    marginTop: 32,
    width: '100%',
  },
  primaryButton: {
    backgroundColor: '#2563EB',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    shadowColor: '#1D4ED8',
    shadowOpacity: 0.2,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 4,
  },
  buttonIcon: {
    marginRight: 8,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
  },
  secondaryButton: {
    backgroundColor: '#FFFFFF',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    borderWidth: 2,
    borderColor: '#2563EB',
  },
  secondaryButtonText: {
    color: '#2563EB',
    fontSize: 16,
    fontWeight: '800',
  },
  skipLinkButton: {
    paddingVertical: 12,
    alignItems: 'center',
  },
  skipLinkText: {
    color: '#6B7280',
    fontSize: 14,
    fontWeight: '600',
  },
  pagination: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 20,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#D1D5DB',
    marginHorizontal: 4,
  },
  dotActive: {
    width: 24,
    backgroundColor: '#2563EB',
  },
  nextButton: {
    position: 'absolute',
    bottom: 80,
    right: 32,
    backgroundColor: '#2563EB',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 999,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#1D4ED8',
    shadowOpacity: 0.3,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  nextButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
    marginRight: 8,
  },
});
