
import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.estilizapro.ai',
  appName: 'EstilizaPro AI',
  webDir: 'out',
  server: {
    androidScheme: 'https',
    // IMPORTANTE: Aquí debes colocar la URL real una vez que despliegues tu app en Firebase.
    // Ejemplo: 'https://estilizapro-ai.web.app'
    // Esto permite que los Server Actions (IA) funcionen desde el móvil.
    url: 'https://tu-app-en-firebase.web.app',
    cleartext: true
  },
  android: {
    allowMixedContent: true
  }
};

export default config;
