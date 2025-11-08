import { Platform } from 'react-native';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';
import { apiClient } from './apiClient';
import { getAuth } from './auth';

// Configure how notifications are handled when app is in foreground
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

/**
 * Request notification permissions and get Expo push token.
 * Returns null if permission denied or on simulator/emulator.
 */
export async function registerForPushNotificationsAsync(): Promise<string | null> {
  // Push notifications don't work on simulator/emulator
  if (!Device.isDevice) {
    console.log('[Push] Skipping: not a physical device');
    return null;
  }

  try {
    // Expo Go cannot receive push notifications
    const appOwnership = (Constants as any)?.appOwnership;
    if (appOwnership === 'expo') {
      console.warn('[Push] Expo Go detected. Skipping push token retrieval. Use a development build.');
      return null;
    }

    // Check existing permissions
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    // Request permission if not granted
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      console.log('[Push] Permission denied');
      return null;
    }

    // Get Expo push token
    // IMPORTANT: projectId is required for stable tokens across builds
    // Try multiple locations and only pass when defined
    const projectId = (Constants as any)?.expoConfig?.extra?.eas?.projectId
      || (Constants as any)?.easConfig?.projectId;

    if (!projectId) {
      console.warn('[Push] No EAS projectId found. Tokens may be unstable.');
    }

    let tokenData: Notifications.ExpoPushToken;
    if (projectId) {
      tokenData = await Notifications.getExpoPushTokenAsync({ projectId });
    } else {
      // Fallback for development before EAS init
      tokenData = await Notifications.getExpoPushTokenAsync();
    }

    const token = tokenData.data;
    console.log('[Push] Token obtained:', token);

    // Configure Android notification channel
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'Default',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#2563EB',
      });
    }

    return token;
  } catch (error: any) {
    console.error('[Push] Error getting token:', error);
    return null;
  }
}

/**
 * Register device token with backend.
 * Safe to call even if backend endpoint doesn't exist yet.
 */
export async function registerDeviceToken(token: string): Promise<boolean> {
  if (!token) return false;

  try {
    const platform = Platform.OS === 'ios' ? 'ios' : 'android';
    const appVersion = Constants.expoConfig?.version || '1.0.0';

    await apiClient.post('/devices', {
      token,
      platform,
      app_version: appVersion,
    });

    console.log('[Push] Device token registered with backend');
    return true;
  } catch (error: any) {
    // Silently fail if endpoint doesn't exist yet (404) or other errors
    // This allows gradual rollout without breaking the app
    const status = error?.response?.status;
    if (status === 404) {
      console.log('[Push] Backend endpoint not ready yet');
    } else {
      console.error('[Push] Failed to register token:', error?.message);
    }
    return false;
  }
}

/**
 * Unregister device token from backend.
 */
export async function unregisterDeviceToken(token: string): Promise<boolean> {
  if (!token) return false;

  try {
    await apiClient.delete(`/devices/${encodeURIComponent(token)}`);
    console.log('[Push] Device token unregistered');
    return true;
  } catch (error: any) {
    console.error('[Push] Failed to unregister token:', error?.message);
    return false;
  }
}

/**
 * Setup push notifications for the current user.
 * Call this after successful login.
 */
export async function setupPushNotifications(): Promise<void> {
  try {
    const token = await registerForPushNotificationsAsync();
    if (token) {
      await registerDeviceToken(token);
    }
  } catch (error) {
    console.error('[Push] Setup failed:', error);
  }
}

/**
 * Cleanup push notifications on logout.
 * Attempts to unregister token from backend.
 */
export async function cleanupPushNotifications(): Promise<void> {
  try {
    // Get current token to unregister
    if (!Device.isDevice) return;

    // Skip in Expo Go
    const appOwnership = (Constants as any)?.appOwnership;
    if (appOwnership === 'expo') return;

    // Try to resolve projectId from multiple places
    const projectId = (Constants as any)?.expoConfig?.extra?.eas?.projectId
      || (Constants as any)?.easConfig?.projectId;

    let tokenData: Notifications.ExpoPushToken | null = null;
    if (projectId) {
      tokenData = await Notifications.getExpoPushTokenAsync({ projectId });
    } else {
      tokenData = await Notifications.getExpoPushTokenAsync();
    }

    if (tokenData?.data) {
      await unregisterDeviceToken(tokenData.data);
    }
  } catch (error) {
    console.error('[Push] Cleanup failed:', error);
  }
}

/**
 * Add listener for notification taps (when app is in foreground/background).
 * Returns a subscription that should be removed on unmount.
 */
export function addNotificationResponseListener(
  handler: (response: Notifications.NotificationResponse) => void
) {
  return Notifications.addNotificationResponseReceivedListener(handler);
}

/**
 * Add listener for notifications received while app is in foreground.
 * Returns a subscription that should be removed on unmount.
 */
export function addNotificationReceivedListener(
  handler: (notification: Notifications.Notification) => void
) {
  return Notifications.addNotificationReceivedListener(handler);
}

/**
 * Navigate to the appropriate screen based on notification data.
 * Call this from notification response handler.
 */
export function handleNotificationNavigation(
  data: any,
  router: any
): void {
  if (!data || !router) return;

  const { type, appointment_id, doctor_id, patient_id } = data;

  // Determine user role from auth
  const { user } = getAuth();
  const userRole = user?.role?.name?.toLowerCase() || user?.role_name?.toLowerCase() || '';

  try {
    // Navigate based on notification type and user role
    if (type?.includes('appointment') && appointment_id) {
      if (userRole.includes('medecin') || userRole.includes('doctor') || 
          userRole.includes('kine') || userRole.includes('psycho') || 
          userRole.includes('ortho')) {
        // Professional user - go to doctor appointment detail
        router.push(`/doctor/appointments/${appointment_id}`);
      } else {
        // Patient user - go to patient appointment detail
        router.push(`/patient/appointment/${appointment_id}`);
      }
    } else {
      // Default: go to notifications screen
      if (userRole === 'patient') {
        router.push('/patient/notifications');
      } else {
        router.push('/doctor/dashboard');
      }
    }
  } catch (error) {
    console.error('[Push] Navigation failed:', error);
  }
}
