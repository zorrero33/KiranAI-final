import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'ai.kiranai.app',
  appName: 'KiranAI',
  webDir: 'dist',
  server: {
 url: "https://ais-dev-6ygahfd6xl2xorvxmi7nyp-239401179834.europe-west2.run.app",
 url: "https://ais-dev-6ygahfd6xl2xorvxmi7nyp-239401179834.europe-west2.run.app",
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
