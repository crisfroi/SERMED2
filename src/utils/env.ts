// Type-safe environment variables
export const env = {
  // API
  supabaseUrl: import.meta.env.VITE_SUPABASE_URL,
  supabaseAnonKey: import.meta.env.VITE_SUPABASE_ANON_KEY,
  apiUrl: import.meta.env.VITE_API_URL || 'http://localhost:3000/api',
  apiTimeout: parseInt(import.meta.env.VITE_API_TIMEOUT || '30000'),

  // App
  appName: import.meta.env.VITE_APP_NAME || 'HOSIX',
  appVersion: import.meta.env.VITE_APP_VERSION || '0.0.0',
  environment: import.meta.env.VITE_ENVIRONMENT || 'development',

  // Features
  enableDebug: import.meta.env.VITE_ENABLE_DEBUG === 'true',
  enableAnalytics: import.meta.env.VITE_ENABLE_ANALYTICS === 'true',
  enableSentry: import.meta.env.VITE_ENABLE_SENTRY === 'true',

  // External Services
  sentryDsn: import.meta.env.VITE_SENTRY_DSN,
  googleAnalyticsId: import.meta.env.VITE_GOOGLE_ANALYTICS_ID,

  // Storage
  storageBucket: import.meta.env.VITE_STORAGE_BUCKET || 'patient-documents',
  imageBucket: import.meta.env.VITE_IMAGE_BUCKET || 'profile-images',

  // Helpers
  isDev: import.meta.env.DEV,
  isProd: import.meta.env.PROD,
};

// Validation
export const validateEnv = () => {
  const requiredVars = [
    'supabaseUrl',
    'supabaseAnonKey',
  ];

  const missing = requiredVars.filter((key) => !env[key as keyof typeof env]);
  if (missing.length > 0) {
    console.error('Missing required environment variables:', missing);
  }
};
