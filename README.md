
# EstilizaPro AI - Manual de Producción y Migración Móvil

Este proyecto es el asesor de imagen personal diseñado por **Pilar Cifuentes Catalán**. Utiliza una arquitectura híbrida con Next.js y Capacitor.

## 📱 Guía para Generar APK (Android)

Sigue estos pasos para convertir tu proyecto web en una aplicación instalable:

### 1. Preparación en Firebase Console
1. Entra a tu proyecto en [console.firebase.google.com](https://console.firebase.google.com).
2. Ve a **Configuración del proyecto** y obtén tu **ID de Proyecto**.
3. Realiza tu primer despliegue web para obtener tu URL pública (ej. `https://tu-proyecto.web.app`).

### 2. Configuración del Código
1. Abre el archivo `capacitor.config.ts`.
2. En la propiedad `url`, sustituye el placeholder por tu URL de Firebase real.
3. En la terminal de Firebase Studio, ejecuta:
```bash
npm install
npx cap add android
```

### 3. Generación del APK
1. Cada vez que hagas cambios, sincroniza:
```bash
npm run build
npx cap copy android
```
2. Abre el proyecto en Android Studio: `npx cap open android`.
3. Dentro de Android Studio, ve a: `Build > Build Bundle(s) / APK(s) > Build APK(s)`.
4. El archivo se generará en: `android/app/build/outputs/apk/debug/app-debug.apk`.

### 4. Distribución con Firebase App Distribution (Sin Tiendas)
1. En la consola de Firebase, ve al menú **Release & Monitor > App Distribution**.
2. Selecciona la plataforma **Android**.
3. Sube el archivo `app-debug.apk`.
4. Añade los correos de tus evaluadores. Ellos recibirán un link para instalar la app directamente en sus teléfonos.

---
© 2024 EstilizaPro AI - Pilar Cifuentes Catalán.
