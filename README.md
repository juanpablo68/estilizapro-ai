
# EstilizaPro AI - Manual de Producción y Migración Móvil

Este proyecto es el asesor de imagen personal diseñado por **Pilar Cifuentes Catalán**. Utiliza una arquitectura híbrida con Next.js y Capacitor.

## 💰 Guía de Costo Cero (Spark Plan)
Para este demo académico, Firebase ofrece un nivel gratuito muy generoso:
- **Hosting**: 10GB de almacenamiento y 360MB de transferencia diaria gratis.
- **IA/Funciones**: El procesamiento de Server Actions entra dentro de la cuota gratuita de Google Cloud.
- **Importante**: Solo pagarás por los tokens de OpenAI que consumas (usualmente centavos por muchas pruebas).

## 📱 Guía para Generar APK (Android)

Sigue estos pasos para convertir tu proyecto web en una aplicación instalable:

### 1. Preparación en Firebase Console
1. Entra a tu proyecto en [console.firebase.google.com](https://console.firebase.google.com).
2. Ve a la sección **Hosting** o **App Hosting**.
3. Realiza tu primer despliegue para obtener tu **URL pública** (ej. `https://tu-proyecto.web.app`).
4. **Copia esa URL** y pégala en el archivo `capacitor.config.ts` en la propiedad `url`.

### 2. Configuración del Código
1. En la terminal de Firebase Studio, ejecuta:
```bash
npm install
npm run build
npx cap add android
```

### 3. Generación del APK
1. Cada vez que hagas cambios en el código, sincroniza el móvil:
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
4. Añade los correos de tus evaluadores. Ellos recibirán un link para instalar la app directamente en sus teléfonos sin costo alguno.

---
© 2024 EstilizaPro AI - Pilar Cifuentes Catalán.
