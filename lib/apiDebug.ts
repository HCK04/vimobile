// API Debug Helper - Use this to diagnose network issues
import { Platform } from 'react-native';
import Constants from 'expo-constants';

export function getApiDebugInfo() {
  const anyConstants: any = Constants as any;
  const hostUri: string | undefined =
    anyConstants?.expoConfig?.hostUri ||
    anyConstants?.manifest2?.extra?.expoClient?.hostUri ||
    anyConstants?.manifest?.hostUri ||
    anyConstants?.manifest?.debuggerHost;

  let host = hostUri ? String(hostUri).split(':')[0] : 'localhost';

  // Android emulator special case
  if (Platform.OS === 'android') {
    if (host === 'localhost' || host === '127.0.0.1') host = '10.0.2.2';
  }

  const devUrl = `http://${host}:8000/api`;
  const envUrl = process.env.EXPO_PUBLIC_API_URL;
  const finalUrl = envUrl || devUrl;

  return {
    platform: Platform.OS,
    isDev: __DEV__,
    hostUri,
    resolvedHost: host,
    devUrl,
    envUrl,
    finalUrl,
    constants: {
      expoConfig: anyConstants?.expoConfig?.hostUri,
      manifest2: anyConstants?.manifest2?.extra?.expoClient?.hostUri,
      manifest: anyConstants?.manifest?.hostUri,
      debuggerHost: anyConstants?.manifest?.debuggerHost,
    },
  };
}

export function logApiDebugInfo() {
  const info = getApiDebugInfo();
  console.log('=== API DEBUG INFO ===');
  console.log('Platform:', info.platform);
  console.log('Is Dev:', info.isDev);
  console.log('Host URI:', info.hostUri);
  console.log('Resolved Host:', info.resolvedHost);
  console.log('Dev URL:', info.devUrl);
  console.log('Env URL:', info.envUrl);
  console.log('Final URL:', info.finalUrl);
  console.log('=====================');
  return info;
}
