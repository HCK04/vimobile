/**
 * Validation utilities for authentication forms
 * Following best practices for real-time validation feedback
 */

export const validation = {
    /**
     * Email validation
     * @returns true if valid email format
     */
    email: (value: string): boolean => {
        if (!value) return false;
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
    },

    /**
     * Phone validation (Morocco format)
     * Supports: +212XXXXXXXXX or 0XXXXXXXXX
     */
    phone: (value: string): boolean => {
        if (!value) return false;
        const cleaned = value.replace(/\s|-/g, '');
        return /^(\+212|0)[5-7]\d{8}$/.test(cleaned);
    },

    /**
     * Name validation (min 2 characters)
     */
    name: (value: string): boolean => {
        if (!value) return false;
        return value.trim().length >= 2;
    },

    /**
     * Password validation rules
     */
    password: {
        minLength: (value: string): boolean => value.length >= 8,
        hasUppercase: (value: string): boolean => /[A-Z]/.test(value),
        hasLowercase: (value: string): boolean => /[a-z]/.test(value),
        hasNumber: (value: string): boolean => /\d/.test(value),
        hasSpecial: (value: string): boolean => /[!@#$%^&*(),.?":{}|<>]/.test(value),

        /**
         * Check all password requirements
         * @returns object with all validation results
         */
        validate: (value: string) => ({
            minLength: value.length >= 8,
            hasUppercase: /[A-Z]/.test(value),
            hasLowercase: /[a-z]/.test(value),
            hasNumber: /\d/.test(value),
            hasSpecial: /[!@#$%^&*(),.?":{}|<>]/.test(value),
        }),

        /**
         * Check if password meets minimum requirements
         * Requires: 8+ chars, uppercase, lowercase, number
         */
        isValid: (value: string): boolean => {
            return (
                value.length >= 8 &&
                /[A-Z]/.test(value) &&
                /[a-z]/.test(value) &&
                /\d/.test(value)
            );
        },

        /**
         * Calculate password strength (0-100)
         */
        strength: (value: string): number => {
            let score = 0;
            if (!value) return 0;

            // Length score
            if (value.length >= 8) score += 20;
            if (value.length >= 12) score += 10;
            if (value.length >= 16) score += 10;

            // Character variety
            if (/[a-z]/.test(value)) score += 15;
            if (/[A-Z]/.test(value)) score += 15;
            if (/\d/.test(value)) score += 15;
            if (/[!@#$%^&*(),.?":{}|<>]/.test(value)) score += 15;

            return Math.min(100, score);
        },

        /**
         * Get strength level
         */
        strengthLevel: (value: string): 'weak' | 'medium' | 'strong' => {
            const score = validation.password.strength(value);
            if (score < 40) return 'weak';
            if (score < 70) return 'medium';
            return 'strong';
        },
    },

    /**
     * Date of birth validation
     * Must be at least 15 years old (Doctolib requirement)
     */
    dateOfBirth: (date: Date | null): boolean => {
        if (!date) return false;
        const today = new Date();
        const minAge = 15;
        const minDate = new Date(
            today.getFullYear() - minAge,
            today.getMonth(),
            today.getDate()
        );
        return date <= minDate;
    },

    /**
     * INPE (Professional ID) validation - optional field
     */
    inpe: (value: string): boolean => {
        if (!value) return true; // Optional
        return /^\d{11}$/.test(value.replace(/\s/g, ''));
    },
};

/**
 * Error messages in French
 */
export const errorMessages = {
    email: 'Veuillez saisir une adresse email valide',
    phone: 'Numéro de téléphone invalide (ex: 0612345678)',
    name: 'Ce champ doit contenir au moins 2 caractères',
    password: {
        minLength: 'Au moins 8 caractères',
        hasUppercase: 'Au moins une majuscule',
        hasLowercase: 'Au moins une minuscule',
        hasNumber: 'Au moins un chiffre',
        hasSpecial: 'Au moins un caractère spécial (recommandé)',
        mismatch: 'Les mots de passe ne correspondent pas',
    },
    dateOfBirth: 'Vous devez avoir au moins 15 ans',
    required: 'Ce champ est obligatoire',
};
