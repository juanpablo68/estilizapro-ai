
import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.estilizapro.ai',
  appName: 'EstilizaPro AI',
  webDir: 'out',
  server: {
    androidScheme: 'https',
    // REEMPLAZA ESTA URL con la que te dé 'lt --port 9002' para el demo
    url: 'https://tu-url-de-localtunnel.loca.lt',
    cleartext: true
  },
  android: {
    allowMixedContent: true
  }
};

export default config;
