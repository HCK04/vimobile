/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://reactnativeunistyles.vercel.app), etc.
 */

// Tailwind-like palette for consistent usage across the app
export const Palette = {
  primary: '#2563EB',     // blue-600
  primaryLight: '#EFF6FF', // blue-50
  primaryBorder: '#BFDBFE', // blue-200
  background: '#F8FAFC',  // slate-50
  surface: '#FFFFFF',     // white
  text: '#111827',        // gray-900
  textSecondary: '#6B7280', // gray-500
  textPlaceholder: '#9CA3AF', // gray-400
  border: '#E5E7EB',      // gray-200
  error: '#EF4444',       // red-500
  errorBg: '#FEF2F2',     // red-50
  success: '#10B981',     // emerald-500
  successBg: '#F0FDF4',   // emerald-50
};

const tintColorLight = Palette.primary;
const tintColorDark = '#fff';

export const Colors = {
  light: {
    text: Palette.text,
    background: Palette.surface,
    tint: tintColorLight,
    icon: '#687076',
    tabIconDefault: '#687076',
    tabIconSelected: tintColorLight,
  },
  dark: {
    text: '#ECEDEE',
    background: '#151718',
    tint: tintColorDark,
    icon: '#9BA1A6',
    tabIconDefault: '#9BA1A6',
    tabIconSelected: tintColorDark,
  },
};
