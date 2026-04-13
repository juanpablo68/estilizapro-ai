
import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.estilizapro.ai',
  appName: 'EstilizaPro AI',
  webDir: 'out',
  server: {
    androidScheme: 'https',
    // OPCIÓN A (Hosting Real): 'https://tu-proyecto.web.app'
    // OPCIÓN B (Túnel Gratis para Demo): 'https://tu-url-de-localtunnel.loca.lt'
    // IMPORTANTE: Para que la IA funcione en el APK, esta URL debe ser accesible públicamente.
    url: 'https://tu-app-en-firebase.web.app',
    cleartext: true
  },
  android: {
    allowMixedContent: true
  }
};

export default config;
