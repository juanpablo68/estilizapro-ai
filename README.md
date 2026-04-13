
# EstilizaPro AI - Manual de Producción y Migración Móvil

Este proyecto es el asesor de imagen personal diseñado por **Pilar Cifuentes Catalán**.

## 📱 Guía para Generar APK (Android)

Para generar la aplicación móvil y probarla en Android:

### 1. Preparación del Entorno
- Debes tener instalado **Android Studio**.
- En la raíz del proyecto, ejecuta:
```bash
npm install
npx cap add android
```

### 2. Sincronización del Código
Cada vez que hagas cambios en el código web:
```bash
npm run build
npx cap copy android
```

### 3. Generación del APK
1. Abre el proyecto en Android Studio: `npx cap open android`.
2. Ve a `Build > Build Bundle(s) / APK(s) > Build APK(s)`.
3. El archivo `.apk` generado se encuentra en `android/app/build/outputs/apk/debug/app-debug.apk`.

### 4. Firebase App Distribution
1. Ve a tu consola de Firebase.
2. En el menú lateral, busca **App Distribution**.
3. Sube el archivo `.apk` y añade los correos de tus evaluadores. Recibirán una invitación para instalar la app sin necesidad de Google Play.

---
© 2024 EstilizaPro AI - Pilar Cifuentes Catalán.
