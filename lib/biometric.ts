import * as LocalAuthentication from 'expo-local-authentication';
import * as SecureStore from 'expo-secure-store';

const BIOMETRIC_KEY = 'vi_sante_biometric_enabled';
const CREDENTIALS_KEY = 'vi_sante_credentials';

interface BiometricResult {
    success: boolean;
    error?: string;
}

interface StoredCredentials {
    email: string;
    password: string;
}

/**
 * Check if device supports biometric authentication
 */
export async function isBiometricAvailable(): Promise<boolean> {
    const hasHardware = await LocalAuthentication.hasHardwareAsync();
    const isEnrolled = await LocalAuthentication.isEnrolledAsync();
    return hasHardware && isEnrolled;
}

/**
 * Get the type of biometric available (Face ID, Touch ID, etc.)
 */
export async function getBiometricType(): Promise<string> {
    const types = await LocalAuthentication.supportedAuthenticationTypesAsync();

    if (types.includes(LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION)) {
        return 'Face ID';
    }
    if (types.includes(LocalAuthentication.AuthenticationType.FINGERPRINT)) {
        return 'Touch ID';
    }
    if (types.includes(LocalAuthentication.AuthenticationType.IRIS)) {
        return 'Iris';
    }
    return 'Biométrie';
}

/**
 * Authenticate using biometrics
 */
export async function authenticateWithBiometrics(promptMessage?: string): Promise<BiometricResult> {
    try {
        const result = await LocalAuthentication.authenticateAsync({
            promptMessage: promptMessage || 'Authentifiez-vous pour continuer',
            cancelLabel: 'Annuler',
            disableDeviceFallback: false,
            fallbackLabel: 'Utiliser le code',
        });

        if (result.success) {
            return { success: true };
        } else {
            return {
                success: false,
                error: result.error === 'user_cancel' ? 'Annulé' : 'Échec de l\'authentification'
            };
        }
    } catch (error) {
        console.error('Biometric auth error:', error);
        return { success: false, error: 'Erreur biométrique' };
    }
}

/**
 * Check if biometric login is enabled for this device
 */
export async function isBiometricLoginEnabled(): Promise<boolean> {
    try {
        const enabled = await SecureStore.getItemAsync(BIOMETRIC_KEY);
        return enabled === 'true';
    } catch {
        return false;
    }
}

/**
 * Enable biometric login and store credentials securely
 */
export async function enableBiometricLogin(email: string, password: string): Promise<boolean> {
    try {
        // First verify biometric works
        const authResult = await authenticateWithBiometrics('Confirmez pour activer la connexion biométrique');
        if (!authResult.success) {
            return false;
        }

        // Store credentials securely
        const credentials = JSON.stringify({ email, password });
        await SecureStore.setItemAsync(CREDENTIALS_KEY, credentials);
        await SecureStore.setItemAsync(BIOMETRIC_KEY, 'true');

        return true;
    } catch (error) {
        console.error('Error enabling biometric login:', error);
        return false;
    }
}

/**
 * Disable biometric login and clear stored credentials
 */
export async function disableBiometricLogin(): Promise<void> {
    try {
        await SecureStore.deleteItemAsync(CREDENTIALS_KEY);
        await SecureStore.deleteItemAsync(BIOMETRIC_KEY);
    } catch (error) {
        console.error('Error disabling biometric login:', error);
    }
}

/**
 * Get stored credentials after biometric authentication
 */
export async function getBiometricCredentials(): Promise<StoredCredentials | null> {
    try {
        // First authenticate
        const authResult = await authenticateWithBiometrics('Connexion avec biométrie');
        if (!authResult.success) {
            return null;
        }

        // Get stored credentials
        const credentials = await SecureStore.getItemAsync(CREDENTIALS_KEY);
        if (!credentials) {
            return null;
        }

        return JSON.parse(credentials) as StoredCredentials;
    } catch (error) {
        console.error('Error getting biometric credentials:', error);
        return null;
    }
}
