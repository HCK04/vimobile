/**
 * Analytics & Tracking Transparency wrapper
 * Required for App Store compliance (iOS 14.5+)
 */
import { Platform } from 'react-native';
import * as Application from 'expo-application';
import {
    requestTrackingPermissionsAsync,
    getTrackingPermissionsAsync,
    PermissionStatus,
} from 'expo-tracking-transparency';

// App info for analytics
export const getAppInfo = () => ({
    appName: Application.applicationName,
    appVersion: Application.nativeApplicationVersion,
    buildVersion: Application.nativeBuildVersion,
    bundleId: Application.applicationId,
});

/**
 * Request iOS App Tracking Transparency permission
 * Must be called before any tracking/analytics
 */
export async function requestTrackingPermission(): Promise<boolean> {
    if (Platform.OS !== 'ios') {
        // Android doesn't require ATT prompt
        return true;
    }

    try {
        const { status } = await requestTrackingPermissionsAsync();
        return status === PermissionStatus.GRANTED;
    } catch (error) {
        console.warn('Tracking permission request failed:', error);
        return false;
    }
}

/**
 * Check current tracking permission status
 */
export async function getTrackingPermission(): Promise<boolean> {
    if (Platform.OS !== 'ios') {
        return true;
    }

    try {
        const { status } = await getTrackingPermissionsAsync();
        return status === PermissionStatus.GRANTED;
    } catch (error) {
        console.warn('Tracking permission check failed:', error);
        return false;
    }
}

/**
 * Track a custom event (placeholder for future analytics SDK)
 * Can be connected to Firebase Analytics, Mixpanel, etc.
 */
export function trackEvent(eventName: string, params?: Record<string, any>) {
    if (__DEV__) {
        console.log('[Analytics]', eventName, params);
    }
    // TODO: Add actual analytics SDK calls here
    // Examples:
    // - Firebase: analytics().logEvent(eventName, params)
    // - Mixpanel: mixpanel.track(eventName, params)
}

/**
 * Track screen view
 */
export function trackScreen(screenName: string) {
    trackEvent('screen_view', { screen_name: screenName });
}

/**
 * Track user action
 */
export function trackAction(action: string, category: string, label?: string) {
    trackEvent('user_action', { action, category, label });
}
