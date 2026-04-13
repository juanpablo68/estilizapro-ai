
# EstilizaPro AI - Manual de Producción Móvil (Costo Cero)

Este proyecto es el asesor de imagen personal diseñado por **Pilar Cifuentes Catalán**.

## 💰 Guía de Costo Cero (Sin Tarjeta de Crédito)
Para este demo académico, si no deseas activar el Plan Blaze de Firebase, puedes usar el **Método del Túnel**:

### 1. Obtener una URL Pública Gratis
1. En la terminal de Firebase Studio, instala una herramienta de túnel:
   ```bash
   npm install -g localtunnel
   ```
2. Inicia tu servidor de desarrollo:
   ```bash
   npm run dev
   ```
3. En una nueva pestaña de la terminal, crea el túnel (Next.js usa el puerto 9002 en este entorno):
   ```bash
   lt --port 9002
   ```
4. Verás una URL como `https://heavy-cats-cry.loca.lt`. **Copia esa URL**.

### 2. Configurar el Móvil
1. Pega esa URL en `capacitor.config.ts` (en la propiedad `url`).
2. Sigue los pasos de generación de APK abajo.

---

## 📱 Guía para Generar APK (Android)

### 1. Preparación del Código
1. Ejecuta:
```bash
npm install
npm run build
npx cap add android
```

### 2. Generación del APK
1. Sincroniza los cambios:
```bash
npm run build
npx cap copy android
```
2. Abre el proyecto en Android Studio: `npx cap open android`.
3. En Android Studio: `Build > Build Bundle(s) / APK(s) > Build APK(s)`.
4. El archivo APK estará en: `android/app/build/outputs/apk/debug/app-debug.apk`.

### 3. Distribución (Sin Tiendas)
Sube el archivo `app-debug.apk` a **Firebase App Distribution** en la consola de Firebase (Menú: Release & Monitor). Añade los correos de tus evaluadores y ellos podrán instalar la app gratis.

---
© 2024 EstilizaPro AI - Pilar Cifuentes Catalán.
