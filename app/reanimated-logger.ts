// Reanimated logger bootstrap for web: set a safe default config BEFORE any Reanimated module loads.
// Do NOT import 'react-native-reanimated' here.

// Define minimal log levels compatible with Reanimated's expectations
const ReanimatedLogLevel = {
  warn: 1,
  error: 2,
} as const;

type LoggerConfig = {
  logFunction: (data: { level: number; message: string }) => void;
  level: number;
  strict: boolean;
};

(function initReanimatedLogger() {
  const g: any = globalThis as any;
  if (g.__reanimatedLoggerConfig) return; // already set by native/init

  const logFunction = (data: { level: number; message: string }) => {
    if (data.level === ReanimatedLogLevel.warn) {
      console.warn(data.message);
    } else if (data.level === ReanimatedLogLevel.error) {
      console.error(data.message);
    } else {
      console.log(data.message);
    }
  };

  const config: LoggerConfig = {
    logFunction,
    level: ReanimatedLogLevel.warn,
    strict: true,
  };

  g.__reanimatedLoggerConfig = config;
})();