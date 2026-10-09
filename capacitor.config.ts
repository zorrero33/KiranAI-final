import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'ai.kiranai.app',
  appName: 'KiranAI',
  webDir: 'dist',
  server: {
    // Load the live web build from the production origin so the native shell
    // and the web app always share the same backend/API surface.
    url: process.env.CAPACITOR_SERVER_URL || 'https://kiranai.web.app',
    androidScheme: 'https',
    cleartext: false,
  },
  android: {
    allowMixedContent: false,
    captureInput: true,
    webContentsDebuggingEnabled: false,
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 1500,
      launchAutoHide: true,
      backgroundColor: '#09090e',
      androidSplashResourceName: 'splash',
      androidScaleType: 'CENTER_CROP',
      showSpinner: false,
    },
  },
};

export default config;
