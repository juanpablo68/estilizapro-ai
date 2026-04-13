
import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.estilizapro.ai',
  appName: 'EstilizaPro AI',
  webDir: 'out',
  server: {
    androidScheme: 'https',
    // IMPORTANTE: Durante el demo, si la app está hosteada, 
    // puedes apuntar a la URL de Firebase App Hosting aquí para que funcionen los Server Actions
    url: 'https://tu-app-en-firebase.web.app',
    cleartext: true
  },
  android: {
    allowMixedContent: true
  }
};

export default config;
