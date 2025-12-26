import React, { useEffect, useState, useRef } from 'react';
import {
    Alert,
    KeyboardAvoidingView,
    Platform,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    View,
    Modal,
    StatusBar,
    Animated,
    ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { api } from '../../lib/api';
import { getPostAuthRoute } from '../../lib/authHelpers';
import {
    isBiometricAvailable,
    isBiometricLoginEnabled,
    getBiometricType,
    getBiometricCredentials,
    enableBiometricLogin,
} from '../../lib/biometric';

// Design System
const COLORS = {
    primary: '#2563EB',
    primaryDark: '#1D4ED8',
    primaryLight: '#3B82F6',
    primarySurface: '#EFF6FF',
    primaryBorder: '#BFDBFE',
    success: '#10B981',
    successLight: '#34D399',
    successSurface: '#F0FDF4',
    successBorder: '#86EFAC',
    background: '#FFFFFF',
    backgroundSecondary: '#F8FAFC',
    surface: '#FFFFFF',
    text: {
        primary: '#111827',
        secondary: '#6B7280',
        tertiary: '#9CA3AF',
        placeholder: '#9CA3AF',
    },
    border: '#E5E7EB',
    borderFocus: '#2563EB',
    error: '#EF4444',
    errorSurface: '#FEF2F2',
};

const SPACING = {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
    xxl: 48,
};

const TYPOGRAPHY = {
    hero: {
        fontSize: 32,
        fontWeight: '800' as const,
        lineHeight: 40,
    },
    title: {
        fontSize: 24,
        fontWeight: '700' as const,
        lineHeight: 32,
    },
    subtitle: {
        fontSize: 16,
        fontWeight: '400' as const,
        lineHeight: 24,
    },
    label: {
        fontSize: 14,
        fontWeight: '600' as const,
        lineHeight: 20,
    },
    body: {
        fontSize: 16,
        fontWeight: '400' as const,
        lineHeight: 24,
    },
    bodyBold: {
        fontSize: 16,
        fontWeight: '600' as const,
        lineHeight: 24,
    },
    button: {
        fontSize: 16,
        fontWeight: '700' as const,
        lineHeight: 24,
    },
    caption: {
        fontSize: 14,
        fontWeight: '500' as const,
        lineHeight: 20,
    },
};

const ONBOARDING_KEY = '@vi-sante:onboarding_completed';

export default function LoginScreen() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);

    // Form state
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [rememberMe, setRememberMe] = useState(true);

    // Focus states for animated inputs
    const [emailFocused, setEmailFocused] = useState(false);
    const [passwordFocused, setPasswordFocused] = useState(false);

    // Role selection modal
    const [showRoleModal, setShowRoleModal] = useState(false);

    // Biometric state
    const [biometricAvailable, setBiometricAvailable] = useState(false);
    const [biometricEnabled, setBiometricEnabled] = useState(false);
    const [biometricType, setBiometricType] = useState('Biométrie');

    // Animation refs
    const fadeAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        checkBiometric();
        // Fade in animation
        Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 400,
            useNativeDriver: true,
        }).start();
    }, []);

    const checkBiometric = async () => {
        const available = await isBiometricAvailable();
        setBiometricAvailable(available);
        if (available) {
            const enabled = await isBiometricLoginEnabled();
            setBiometricEnabled(enabled);
            const type = await getBiometricType();
            setBiometricType(type);
        }
    };

    const onLogin = async () => {
        if (!email || !password) {
            Alert.alert('Connexion', 'Veuillez saisir votre email et mot de passe.');
            return;
        }

        try {
            setLoading(true);
            const res = await api.login({ email, password });

            await AsyncStorage.setItem(ONBOARDING_KEY, 'true');

            if (rememberMe) {
                await AsyncStorage.setItem('@vi-sante:remember_me', 'true');
            }

            const route = getPostAuthRoute(res?.user || {});

            if (biometricAvailable && rememberMe && !biometricEnabled) {
                Alert.alert(
                    'Connexion rapide',
                    `Voulez-vous activer ${biometricType} pour vos prochaines connexions ?`,
                    [
                        { text: 'Non merci', style: 'cancel', onPress: () => router.replace(route as any) },
                        {
                            text: 'Activer',
                            onPress: async () => {
                                await enableBiometricLogin(email, password);
                                router.replace(route as any);
                            }
                        },
                    ]
                );
            } else {
                router.replace(route as any);
            }
        } catch (e: any) {
            const msg = e?.response?.data?.message || e?.message || 'Une erreur est survenue';
            Alert.alert('Connexion', msg);
        } finally {
            setLoading(false);
        }
    };

    const onBiometricLogin = async () => {
        try {
            setLoading(true);
            const credentials = await getBiometricCredentials();
            if (!credentials) {
                Alert.alert('Erreur', 'Impossible de récupérer les identifiants. Veuillez vous connecter manuellement.');
                return;
            }

            const res = await api.login(credentials);
            await AsyncStorage.setItem(ONBOARDING_KEY, 'true');
            const route = getPostAuthRoute(res?.user || {});
            router.replace(route as any);
        } catch (e: any) {
            const msg = e?.response?.data?.message || e?.message || 'Une erreur est survenue';
            Alert.alert('Connexion', msg);
        } finally {
            setLoading(false);
        }
    };

    const handleCreateAccount = (role: 'patient' | 'professional') => {
        setShowRoleModal(false);
        if (role === 'patient') {
            router.push('/auth/patient');
        } else {
            router.push('/auth/professional');
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="dark-content" backgroundColor={COLORS.background} />

            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 25}
                style={{ flex: 1 }}
            >
                <ScrollView
                    contentContainerStyle={styles.scrollContent}
                    keyboardShouldPersistTaps="handled"
                    showsVerticalScrollIndicator={false}
                >
                    <Animated.View style={{ opacity: fadeAnim }}>
                        {/* Header */}
                        <View style={styles.header}>
                            <Pressable
                                onPress={() => router.replace('/onboarding')}
                                style={({ pressed }) => [styles.backButton, pressed && styles.buttonPressed]}
                            >
                                <Ionicons name="chevron-back" size={24} color={COLORS.text.primary} />
                            </Pressable>
                            <View style={styles.brandContainer}>
                                <View style={styles.brandIcon}>
                                    <Ionicons name="medical" size={20} color={COLORS.primary} />
                                </View>
                                <Text style={styles.brandText}>Vi-Santé</Text>
                            </View>
                            <View style={{ width: 44 }} />
                        </View>

                        {/* Welcome Section */}
                        <View style={styles.welcomeSection}>
                            <Text style={styles.welcomeTitle}>Connexion</Text>
                            <Text style={styles.welcomeSubtitle}>
                                Accédez à votre espace santé personnel
                            </Text>
                        </View>

                        {/* Biometric Quick Login */}
                        {biometricEnabled && (
                            <Pressable
                                style={({ pressed }) => [
                                    styles.biometricCard,
                                    pressed && styles.buttonPressed
                                ]}
                                onPress={onBiometricLogin}
                                disabled={loading}
                            >
                                <View style={styles.biometricIconContainer}>
                                    <Ionicons
                                        name={biometricType === 'Face ID' ? 'scan-outline' : 'finger-print-outline'}
                                        size={32}
                                        color={COLORS.primary}
                                    />
                                </View>
                                <View style={styles.biometricTextContainer}>
                                    <Text style={styles.biometricTitle}>Connexion rapide</Text>
                                    <Text style={styles.biometricSubtitle}>Utilisez {biometricType}</Text>
                                </View>
                                <Ionicons name="chevron-forward" size={24} color={COLORS.text.tertiary} />
                            </Pressable>
                        )}

                        {/* Divider if biometric enabled */}
                        {biometricEnabled && (
                            <View style={styles.divider}>
                                <View style={styles.dividerLine} />
                                <Text style={styles.dividerText}>ou</Text>
                                <View style={styles.dividerLine} />
                            </View>
                        )}

                        {/* Login Form */}
                        <View style={styles.formCard}>
                            {/* Email Input */}
                            <View style={styles.inputGroup}>
                                <Text style={styles.inputLabel}>Email</Text>
                                <View style={[
                                    styles.inputContainer,
                                    emailFocused && styles.inputContainerFocused
                                ]}>
                                    <Ionicons
                                        name="mail-outline"
                                        size={20}
                                        color={emailFocused ? COLORS.primary : COLORS.text.tertiary}
                                        style={styles.inputIcon}
                                    />
                                    <TextInput
                                        value={email}
                                        onChangeText={setEmail}
                                        onFocus={() => setEmailFocused(true)}
                                        onBlur={() => setEmailFocused(false)}
                                        autoCapitalize="none"
                                        keyboardType="email-address"
                                        placeholder="vous@exemple.com"
                                        placeholderTextColor={COLORS.text.placeholder}
                                        style={styles.textInput}
                                        autoComplete="email"
                                    />
                                </View>
                            </View>

                            {/* Password Input */}
                            <View style={styles.inputGroup}>
                                <Text style={styles.inputLabel}>Mot de passe</Text>
                                <View style={[
                                    styles.inputContainer,
                                    passwordFocused && styles.inputContainerFocused
                                ]}>
                                    <Ionicons
                                        name="lock-closed-outline"
                                        size={20}
                                        color={passwordFocused ? COLORS.primary : COLORS.text.tertiary}
                                        style={styles.inputIcon}
                                    />
                                    <TextInput
                                        value={password}
                                        onChangeText={setPassword}
                                        onFocus={() => setPasswordFocused(true)}
                                        onBlur={() => setPasswordFocused(false)}
                                        secureTextEntry={!showPassword}
                                        placeholder="••••••••"
                                        placeholderTextColor={COLORS.text.placeholder}
                                        style={styles.textInput}
                                        autoComplete="password"
                                    />
                                    <Pressable
                                        onPress={() => setShowPassword(!showPassword)}
                                        style={styles.eyeButton}
                                        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                                    >
                                        <Ionicons
                                            name={showPassword ? 'eye-outline' : 'eye-off-outline'}
                                            size={20}
                                            color={COLORS.text.tertiary}
                                        />
                                    </Pressable>
                                </View>
                            </View>

                            {/* Remember Me & Forgot Password */}
                            <View style={styles.optionsRow}>
                                <Pressable
                                    style={styles.rememberMeButton}
                                    onPress={() => setRememberMe(!rememberMe)}
                                >
                                    <View style={[
                                        styles.checkbox,
                                        rememberMe && styles.checkboxChecked
                                    ]}>
                                        {rememberMe && (
                                            <Ionicons name="checkmark" size={14} color="#FFFFFF" />
                                        )}
                                    </View>
                                    <Text style={styles.rememberMeText}>Se souvenir de moi</Text>
                                </Pressable>

                                <Pressable
                                    style={({ pressed }) => [pressed && { opacity: 0.7 }]}
                                >
                                    <Text style={styles.forgotPasswordText}>Mot de passe oublié ?</Text>
                                </Pressable>
                            </View>

                            {/* Login Button */}
                            <Pressable
                                style={({ pressed }) => [
                                    styles.primaryButton,
                                    pressed && styles.primaryButtonPressed,
                                    loading && styles.primaryButtonDisabled
                                ]}
                                onPress={onLogin}
                                disabled={loading}
                            >
                                {loading ? (
                                    <ActivityIndicator size="small" color="#FFFFFF" />
                                ) : (
                                    <>
                                        <Ionicons name="log-in-outline" size={22} color="#FFFFFF" style={styles.buttonIcon} />
                                        <Text style={styles.primaryButtonText}>Se connecter</Text>
                                    </>
                                )}
                            </Pressable>
                        </View>

                        {/* Create Account Section */}
                        <View style={styles.createAccountSection}>
                            <View style={styles.divider}>
                                <View style={styles.dividerLine} />
                                <Text style={styles.dividerText}>Nouveau sur Vi-Santé ?</Text>
                                <View style={styles.dividerLine} />
                            </View>

                            <Pressable
                                style={({ pressed }) => [
                                    styles.secondaryButton,
                                    pressed && styles.buttonPressed
                                ]}
                                onPress={() => setShowRoleModal(true)}
                            >
                                <Ionicons name="person-add-outline" size={22} color={COLORS.primary} style={styles.buttonIcon} />
                                <Text style={styles.secondaryButtonText}>Créer un compte</Text>
                            </Pressable>
                        </View>
                    </Animated.View>
                </ScrollView>
            </KeyboardAvoidingView>

            {/* Role Selection Modal */}
            <Modal
                visible={showRoleModal}
                animationType="slide"
                transparent
                onRequestClose={() => setShowRoleModal(false)}
            >
                <Pressable
                    style={styles.modalOverlay}
                    onPress={() => setShowRoleModal(false)}
                >
                    <View style={styles.modalContent}>
                        <View style={styles.modalHandle} />

                        <Text style={styles.modalTitle}>Créer un compte</Text>
                        <Text style={styles.modalSubtitle}>Choisissez votre profil</Text>

                        <Pressable
                            style={({ pressed }) => [
                                styles.roleCard,
                                pressed && styles.roleCardPressed
                            ]}
                            onPress={() => handleCreateAccount('patient')}
                        >
                            <View style={[styles.roleIconContainer, { backgroundColor: COLORS.primarySurface }]}>
                                <Ionicons name="person-outline" size={28} color={COLORS.primary} />
                            </View>
                            <View style={styles.roleTextContainer}>
                                <Text style={styles.roleTitle}>Patient</Text>
                                <Text style={styles.roleDescription}>Prenez rendez-vous avec des praticiens</Text>
                            </View>
                            <Ionicons name="chevron-forward" size={20} color={COLORS.text.tertiary} />
                        </Pressable>

                        <Pressable
                            style={({ pressed }) => [
                                styles.roleCard,
                                pressed && styles.roleCardPressed
                            ]}
                            onPress={() => handleCreateAccount('professional')}
                        >
                            <View style={[styles.roleIconContainer, { backgroundColor: COLORS.successSurface }]}>
                                <Ionicons name="medkit-outline" size={28} color={COLORS.success} />
                            </View>
                            <View style={styles.roleTextContainer}>
                                <Text style={styles.roleTitle}>Professionnel de santé</Text>
                                <Text style={styles.roleDescription}>Gérez votre cabinet et vos patients</Text>
                            </View>
                            <Ionicons name="chevron-forward" size={20} color={COLORS.text.tertiary} />
                        </Pressable>

                        <Pressable
                            style={styles.cancelButton}
                            onPress={() => setShowRoleModal(false)}
                        >
                            <Text style={styles.cancelButtonText}>Annuler</Text>
                        </Pressable>
                    </View>
                </Pressable>
            </Modal>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.backgroundSecondary,
    },
    scrollContent: {
        flexGrow: 1,
        paddingBottom: SPACING.xl,
    },

    // Header
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: SPACING.md,
        paddingVertical: SPACING.sm,
    },
    backButton: {
        width: 44,
        height: 44,
        borderRadius: 12,
        backgroundColor: COLORS.surface,
        alignItems: 'center',
        justifyContent: 'center',
        ...Platform.select({
            ios: {
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.06,
                shadowRadius: 8,
            },
            android: {
                elevation: 2,
            },
        }),
    },
    brandContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: SPACING.sm,
    },
    brandIcon: {
        width: 32,
        height: 32,
        borderRadius: 8,
        backgroundColor: COLORS.primarySurface,
        alignItems: 'center',
        justifyContent: 'center',
    },
    brandText: {
        ...TYPOGRAPHY.bodyBold,
        color: COLORS.text.primary,
        fontSize: 18,
    },

    // Welcome
    welcomeSection: {
        paddingHorizontal: SPACING.lg,
        paddingTop: SPACING.xl,
        paddingBottom: SPACING.lg,
    },
    welcomeTitle: {
        ...TYPOGRAPHY.hero,
        color: COLORS.text.primary,
        marginBottom: SPACING.xs,
    },
    welcomeSubtitle: {
        ...TYPOGRAPHY.subtitle,
        color: COLORS.text.secondary,
    },

    // Biometric Card
    biometricCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: COLORS.surface,
        marginHorizontal: SPACING.lg,
        padding: SPACING.md,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: COLORS.border,
        ...Platform.select({
            ios: {
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.04,
                shadowRadius: 8,
            },
            android: {
                elevation: 1,
            },
        }),
    },
    biometricIconContainer: {
        width: 56,
        height: 56,
        borderRadius: 14,
        backgroundColor: COLORS.primarySurface,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: SPACING.md,
    },
    biometricTextContainer: {
        flex: 1,
    },
    biometricTitle: {
        ...TYPOGRAPHY.bodyBold,
        color: COLORS.text.primary,
        marginBottom: 2,
    },
    biometricSubtitle: {
        ...TYPOGRAPHY.caption,
        color: COLORS.text.secondary,
    },

    // Divider
    divider: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: SPACING.lg,
        marginVertical: SPACING.lg,
    },
    dividerLine: {
        flex: 1,
        height: 1,
        backgroundColor: COLORS.border,
    },
    dividerText: {
        ...TYPOGRAPHY.caption,
        color: COLORS.text.tertiary,
        paddingHorizontal: SPACING.md,
    },

    // Form Card
    formCard: {
        backgroundColor: COLORS.surface,
        marginHorizontal: SPACING.lg,
        padding: SPACING.lg,
        borderRadius: 20,
        ...Platform.select({
            ios: {
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.08,
                shadowRadius: 16,
            },
            android: {
                elevation: 4,
            },
        }),
    },
    inputGroup: {
        marginBottom: SPACING.md,
    },
    inputLabel: {
        ...TYPOGRAPHY.label,
        color: COLORS.text.primary,
        marginBottom: SPACING.sm,
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: COLORS.backgroundSecondary,
        borderRadius: 14,
        borderWidth: 1.5,
        borderColor: COLORS.border,
        paddingHorizontal: SPACING.md,
        height: 54,
    },
    inputContainerFocused: {
        borderColor: COLORS.primary,
        backgroundColor: COLORS.surface,
    },
    inputIcon: {
        marginRight: SPACING.sm,
    },
    textInput: {
        flex: 1,
        ...TYPOGRAPHY.body,
        color: COLORS.text.primary,
        height: '100%',
    },
    eyeButton: {
        padding: SPACING.xs,
    },

    // Options Row
    optionsRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginTop: SPACING.sm,
        marginBottom: SPACING.lg,
    },
    rememberMeButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: SPACING.sm,
    },
    checkbox: {
        width: 22,
        height: 22,
        borderRadius: 6,
        borderWidth: 2,
        borderColor: COLORS.border,
        alignItems: 'center',
        justifyContent: 'center',
    },
    checkboxChecked: {
        backgroundColor: COLORS.primary,
        borderColor: COLORS.primary,
    },
    rememberMeText: {
        ...TYPOGRAPHY.caption,
        color: COLORS.text.secondary,
    },
    forgotPasswordText: {
        ...TYPOGRAPHY.caption,
        color: COLORS.primary,
        fontWeight: '600',
    },

    // Buttons
    primaryButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: COLORS.primary,
        paddingVertical: SPACING.md + 2,
        borderRadius: 14,
        gap: SPACING.sm,
        ...Platform.select({
            ios: {
                shadowColor: COLORS.primaryDark,
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.3,
                shadowRadius: 8,
            },
            android: {
                elevation: 4,
            },
        }),
    },
    primaryButtonPressed: {
        backgroundColor: COLORS.primaryDark,
        transform: [{ scale: 0.98 }],
    },
    primaryButtonDisabled: {
        opacity: 0.7,
    },
    primaryButtonText: {
        ...TYPOGRAPHY.button,
        color: '#FFFFFF',
    },
    buttonIcon: {
        marginRight: SPACING.xs,
    },

    secondaryButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: COLORS.surface,
        paddingVertical: SPACING.md + 2,
        borderRadius: 14,
        gap: SPACING.sm,
        borderWidth: 2,
        borderColor: COLORS.primary,
    },
    secondaryButtonText: {
        ...TYPOGRAPHY.button,
        color: COLORS.primary,
    },

    buttonPressed: {
        opacity: 0.8,
        transform: [{ scale: 0.98 }],
    },

    // Create Account Section
    createAccountSection: {
        paddingHorizontal: SPACING.lg,
        marginTop: SPACING.sm,
    },

    // Modal
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'flex-end',
    },
    modalContent: {
        backgroundColor: COLORS.surface,
        borderTopLeftRadius: 28,
        borderTopRightRadius: 28,
        padding: SPACING.lg,
        paddingBottom: Platform.OS === 'ios' ? SPACING.xl + SPACING.lg : SPACING.xl,
    },
    modalHandle: {
        width: 36,
        height: 4,
        borderRadius: 2,
        backgroundColor: COLORS.border,
        alignSelf: 'center',
        marginBottom: SPACING.lg,
    },
    modalTitle: {
        ...TYPOGRAPHY.title,
        color: COLORS.text.primary,
        textAlign: 'center',
        marginBottom: SPACING.xs,
    },
    modalSubtitle: {
        ...TYPOGRAPHY.subtitle,
        color: COLORS.text.secondary,
        textAlign: 'center',
        marginBottom: SPACING.lg,
    },
    roleCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: COLORS.backgroundSecondary,
        padding: SPACING.md,
        borderRadius: 16,
        marginBottom: SPACING.md,
        borderWidth: 1,
        borderColor: COLORS.border,
    },
    roleCardPressed: {
        backgroundColor: COLORS.border,
    },
    roleIconContainer: {
        width: 56,
        height: 56,
        borderRadius: 14,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: SPACING.md,
    },
    roleTextContainer: {
        flex: 1,
    },
    roleTitle: {
        ...TYPOGRAPHY.bodyBold,
        color: COLORS.text.primary,
        marginBottom: 2,
    },
    roleDescription: {
        ...TYPOGRAPHY.caption,
        color: COLORS.text.secondary,
    },
    cancelButton: {
        alignItems: 'center',
        paddingVertical: SPACING.md,
        marginTop: SPACING.sm,
    },
    cancelButtonText: {
        ...TYPOGRAPHY.bodyBold,
        color: COLORS.text.secondary,
    },
});
