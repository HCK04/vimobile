/**
 * Shared UI components for authentication screens
 * Following 2024 best practices for mobile auth UX
 */

import React, { useState } from 'react';
import {
    View,
    Text,
    TextInput,
    Pressable,
    StyleSheet,
    TextInputProps,
    ActivityIndicator,
    Platform,
    Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { validation } from './validation';

// Design System Constants
export const AUTH_COLORS = {
    primary: '#2563EB',
    primaryDark: '#1D4ED8',
    primaryLight: '#60A5FA',
    primarySurface: '#EFF6FF',
    success: '#10B981',
    successSurface: '#F0FDF4',
    warning: '#F59E0B',
    warningSurface: '#FEF3C7',
    error: '#EF4444',
    errorSurface: '#FEF2F2',
    background: '#FFFFFF',
    backgroundSecondary: '#F8FAFC',
    text: {
        primary: '#111827',
        secondary: '#6B7280',
        tertiary: '#9CA3AF',
        placeholder: '#9CA3AF',
    },
    border: '#E5E7EB',
    borderFocus: '#2563EB',
};

export const AUTH_SPACING = {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
};

// ============================================
// AuthInput Component
// ============================================

interface AuthInputProps extends Omit<TextInputProps, 'style'> {
    label: string;
    value: string;
    onChangeText: (text: string) => void;
    error?: string;
    touched?: boolean;
    leftIcon?: keyof typeof Ionicons.glyphMap;
    rightIcon?: keyof typeof Ionicons.glyphMap;
    onRightIconPress?: () => void;
    isPassword?: boolean;
    containerStyle?: object;
}

export const AuthInput: React.FC<AuthInputProps> = ({
    label,
    value,
    onChangeText,
    error,
    touched,
    leftIcon,
    rightIcon,
    onRightIconPress,
    isPassword,
    containerStyle,
    ...textInputProps
}) => {
    const [isFocused, setIsFocused] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    const showError = touched && error;
    const borderColor = showError
        ? AUTH_COLORS.error
        : isFocused
            ? AUTH_COLORS.borderFocus
            : AUTH_COLORS.border;

    return (
        <View style={[styles.inputContainer, containerStyle]}>
            <Text style={styles.inputLabel}>{label}</Text>
            <View
                style={[
                    styles.inputWrapper,
                    { borderColor },
                    isFocused && styles.inputWrapperFocused,
                    showError && styles.inputWrapperError,
                ]}
            >
                {leftIcon && (
                    <Ionicons
                        name={leftIcon}
                        size={20}
                        color={isFocused ? AUTH_COLORS.primary : AUTH_COLORS.text.tertiary}
                        style={styles.inputIconLeft}
                    />
                )}
                <TextInput
                    value={value}
                    onChangeText={onChangeText}
                    onFocus={() => setIsFocused(true)}
                    onBlur={() => setIsFocused(false)}
                    secureTextEntry={isPassword && !showPassword}
                    placeholderTextColor={AUTH_COLORS.text.placeholder}
                    style={styles.textInput}
                    {...textInputProps}
                />
                {isPassword && (
                    <Pressable
                        onPress={() => setShowPassword(!showPassword)}
                        style={styles.inputIconRight}
                        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                    >
                        <Ionicons
                            name={showPassword ? 'eye-outline' : 'eye-off-outline'}
                            size={20}
                            color={AUTH_COLORS.text.tertiary}
                        />
                    </Pressable>
                )}
                {rightIcon && !isPassword && (
                    <Pressable
                        onPress={onRightIconPress}
                        style={styles.inputIconRight}
                        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                    >
                        <Ionicons name={rightIcon} size={20} color={AUTH_COLORS.text.tertiary} />
                    </Pressable>
                )}
            </View>
            {showError && <Text style={styles.errorText}>{error}</Text>}
        </View>
    );
};

// ============================================
// PasswordStrengthMeter Component
// ============================================

interface PasswordStrengthMeterProps {
    password: string;
}

export const PasswordStrengthMeter: React.FC<PasswordStrengthMeterProps> = ({
    password,
}) => {
    const strength = validation.password.strength(password);
    const level = validation.password.strengthLevel(password);
    const requirements = validation.password.validate(password);

    const getColor = () => {
        switch (level) {
            case 'weak':
                return AUTH_COLORS.error;
            case 'medium':
                return AUTH_COLORS.warning;
            case 'strong':
                return AUTH_COLORS.success;
        }
    };

    const getLabel = () => {
        switch (level) {
            case 'weak':
                return 'Faible';
            case 'medium':
                return 'Moyen';
            case 'strong':
                return 'Fort';
        }
    };

    if (!password) return null;

    return (
        <View style={styles.strengthContainer}>
            {/* Progress Bar */}
            <View style={styles.strengthBarContainer}>
                <View
                    style={[
                        styles.strengthBar,
                        { width: `${strength}%`, backgroundColor: getColor() },
                    ]}
                />
            </View>
            <Text style={[styles.strengthLabel, { color: getColor() }]}>{getLabel()}</Text>

            {/* Requirements Checklist */}
            <View style={styles.requirementsList}>
                <RequirementItem
                    met={requirements.minLength}
                    text="8 caractères minimum"
                />
                <RequirementItem
                    met={requirements.hasUppercase}
                    text="Une majuscule"
                />
                <RequirementItem
                    met={requirements.hasLowercase}
                    text="Une minuscule"
                />
                <RequirementItem
                    met={requirements.hasNumber}
                    text="Un chiffre"
                />
            </View>
        </View>
    );
};

const RequirementItem: React.FC<{ met: boolean; text: string }> = ({ met, text }) => (
    <View style={styles.requirementItem}>
        <Ionicons
            name={met ? 'checkmark-circle' : 'ellipse-outline'}
            size={16}
            color={met ? AUTH_COLORS.success : AUTH_COLORS.text.tertiary}
        />
        <Text
            style={[
                styles.requirementText,
                met && { color: AUTH_COLORS.success },
            ]}
        >
            {text}
        </Text>
    </View>
);

// ============================================
// AuthButton Component
// ============================================

interface AuthButtonProps {
    title: string;
    onPress: () => void;
    loading?: boolean;
    disabled?: boolean;
    variant?: 'primary' | 'secondary' | 'outline';
    icon?: keyof typeof Ionicons.glyphMap;
    style?: object;
}

export const AuthButton: React.FC<AuthButtonProps> = ({
    title,
    onPress,
    loading,
    disabled,
    variant = 'primary',
    icon,
    style,
}) => {
    const isPrimary = variant === 'primary';
    const isSecondary = variant === 'secondary';
    const isOutline = variant === 'outline';

    return (
        <Pressable
            onPress={onPress}
            disabled={loading || disabled}
            style={({ pressed }) => [
                styles.button,
                isPrimary && styles.buttonPrimary,
                isSecondary && styles.buttonSecondary,
                isOutline && styles.buttonOutline,
                (loading || disabled) && styles.buttonDisabled,
                pressed && styles.buttonPressed,
                style,
            ]}
        >
            {loading ? (
                <ActivityIndicator size="small" color={isPrimary ? '#FFF' : AUTH_COLORS.primary} />
            ) : (
                <>
                    {icon && (
                        <Ionicons
                            name={icon}
                            size={20}
                            color={isPrimary ? '#FFF' : AUTH_COLORS.primary}
                            style={{ marginRight: AUTH_SPACING.sm }}
                        />
                    )}
                    <Text
                        style={[
                            styles.buttonText,
                            isPrimary && styles.buttonTextPrimary,
                            (isSecondary || isOutline) && styles.buttonTextSecondary,
                        ]}
                    >
                        {title}
                    </Text>
                    {isPrimary && (
                        <Ionicons
                            name="arrow-forward"
                            size={20}
                            color="#FFF"
                            style={{ marginLeft: AUTH_SPACING.sm }}
                        />
                    )}
                </>
            )}
        </Pressable>
    );
};

// ============================================
// StepIndicator Component
// ============================================

interface StepIndicatorProps {
    currentStep: number;
    totalSteps: number;
}

export const StepIndicator: React.FC<StepIndicatorProps> = ({
    currentStep,
    totalSteps,
}) => {
    return (
        <View style={styles.stepContainer}>
            <Text style={styles.stepText}>
                Étape {currentStep} sur {totalSteps}
            </Text>
            <View style={styles.stepDots}>
                {Array.from({ length: totalSteps }).map((_, index) => (
                    <View
                        key={index}
                        style={[
                            styles.stepDot,
                            index < currentStep && styles.stepDotCompleted,
                            index === currentStep - 1 && styles.stepDotActive,
                        ]}
                    />
                ))}
            </View>
        </View>
    );
};

// ============================================
// SocialLoginButtons Component
// ============================================

interface SocialLoginButtonsProps {
    onApplePress?: () => void;
    onGooglePress?: () => void;
}

export const SocialLoginButtons: React.FC<SocialLoginButtonsProps> = ({
    onApplePress,
    onGooglePress,
}) => {
    return (
        <View style={styles.socialContainer}>
            <Pressable
                style={({ pressed }) => [
                    styles.socialButton,
                    pressed && styles.buttonPressed,
                ]}
                onPress={onApplePress}
            >
                <Ionicons name="logo-apple" size={24} color="#000" />
                <Text style={styles.socialButtonText}>Apple</Text>
            </Pressable>

            <Pressable
                style={({ pressed }) => [
                    styles.socialButton,
                    pressed && styles.buttonPressed,
                ]}
                onPress={onGooglePress}
            >
                <Ionicons name="logo-google" size={24} color="#DB4437" />
                <Text style={styles.socialButtonText}>Google</Text>
            </Pressable>
        </View>
    );
};

// ============================================
// Divider Component
// ============================================

interface DividerProps {
    text?: string;
}

export const Divider: React.FC<DividerProps> = ({ text = 'ou' }) => (
    <View style={styles.divider}>
        <View style={styles.dividerLine} />
        <Text style={styles.dividerText}>{text}</Text>
        <View style={styles.dividerLine} />
    </View>
);

// ============================================
// Styles
// ============================================

const styles = StyleSheet.create({
    // Input Styles
    inputContainer: {
        marginBottom: AUTH_SPACING.md,
    },
    inputLabel: {
        fontSize: 14,
        fontWeight: '600',
        color: AUTH_COLORS.text.primary,
        marginBottom: AUTH_SPACING.sm,
    },
    inputWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: AUTH_COLORS.backgroundSecondary,
        borderRadius: 14,
        borderWidth: 1.5,
        paddingHorizontal: AUTH_SPACING.md,
        height: 56,
    },
    inputWrapperFocused: {
        backgroundColor: AUTH_COLORS.background,
    },
    inputWrapperError: {
        backgroundColor: AUTH_COLORS.errorSurface,
    },
    inputIconLeft: {
        marginRight: AUTH_SPACING.sm,
    },
    inputIconRight: {
        marginLeft: AUTH_SPACING.sm,
        padding: AUTH_SPACING.xs,
    },
    textInput: {
        flex: 1,
        fontSize: 16,
        color: AUTH_COLORS.text.primary,
        height: '100%',
    },
    errorText: {
        fontSize: 12,
        color: AUTH_COLORS.error,
        marginTop: AUTH_SPACING.xs,
        marginLeft: AUTH_SPACING.xs,
    },

    // Password Strength Styles
    strengthContainer: {
        marginTop: AUTH_SPACING.sm,
    },
    strengthBarContainer: {
        height: 4,
        backgroundColor: AUTH_COLORS.border,
        borderRadius: 2,
        overflow: 'hidden',
    },
    strengthBar: {
        height: '100%',
        borderRadius: 2,
    },
    strengthLabel: {
        fontSize: 12,
        fontWeight: '600',
        marginTop: AUTH_SPACING.xs,
        textAlign: 'right',
    },
    requirementsList: {
        marginTop: AUTH_SPACING.md,
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: AUTH_SPACING.sm,
    },
    requirementItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    requirementText: {
        fontSize: 12,
        color: AUTH_COLORS.text.tertiary,
    },

    // Button Styles
    button: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        height: 56,
        borderRadius: 14,
        paddingHorizontal: AUTH_SPACING.lg,
    },
    buttonPrimary: {
        backgroundColor: AUTH_COLORS.primary,
        ...Platform.select({
            ios: {
                shadowColor: AUTH_COLORS.primaryDark,
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.3,
                shadowRadius: 8,
            },
            android: {
                elevation: 4,
            },
        }),
    },
    buttonSecondary: {
        backgroundColor: AUTH_COLORS.primarySurface,
    },
    buttonOutline: {
        backgroundColor: 'transparent',
        borderWidth: 2,
        borderColor: AUTH_COLORS.primary,
    },
    buttonDisabled: {
        opacity: 0.6,
    },
    buttonPressed: {
        opacity: 0.85,
        transform: [{ scale: 0.98 }],
    },
    buttonText: {
        fontSize: 16,
        fontWeight: '700',
    },
    buttonTextPrimary: {
        color: '#FFFFFF',
    },
    buttonTextSecondary: {
        color: AUTH_COLORS.primary,
    },

    // Step Indicator Styles
    stepContainer: {
        alignItems: 'center',
        marginBottom: AUTH_SPACING.lg,
    },
    stepText: {
        fontSize: 14,
        fontWeight: '500',
        color: AUTH_COLORS.text.secondary,
        marginBottom: AUTH_SPACING.sm,
    },
    stepDots: {
        flexDirection: 'row',
        gap: AUTH_SPACING.sm,
    },
    stepDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: AUTH_COLORS.border,
    },
    stepDotCompleted: {
        backgroundColor: AUTH_COLORS.primary,
    },
    stepDotActive: {
        width: 24,
        backgroundColor: AUTH_COLORS.primary,
    },

    // Social Login Styles
    socialContainer: {
        flexDirection: 'row',
        gap: AUTH_SPACING.md,
    },
    socialButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        height: 52,
        backgroundColor: AUTH_COLORS.background,
        borderRadius: 14,
        borderWidth: 1,
        borderColor: AUTH_COLORS.border,
        gap: AUTH_SPACING.sm,
    },
    socialButtonText: {
        fontSize: 15,
        fontWeight: '600',
        color: AUTH_COLORS.text.primary,
    },

    // Divider Styles
    divider: {
        flexDirection: 'row',
        alignItems: 'center',
        marginVertical: AUTH_SPACING.lg,
    },
    dividerLine: {
        flex: 1,
        height: 1,
        backgroundColor: AUTH_COLORS.border,
    },
    dividerText: {
        paddingHorizontal: AUTH_SPACING.md,
        fontSize: 14,
        color: AUTH_COLORS.text.tertiary,
    },
});
