import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.chezosi.app',
  appName: 'Chez OSI',
  webDir: 'out',
  server: {
    androidScheme: 'https'
  }
};

export default config;
