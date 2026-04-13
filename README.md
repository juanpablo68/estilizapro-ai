
# EstilizaPro AI - Manual de Producción Móvil (Costo Cero)

Este proyecto es el asesor de imagen personal diseñado por **Pilar Cifuentes Catalán**.

## 💰 Guía de Costo Cero (Sin Tarjeta de Crédito)
Para este demo académico, si no deseas activar el Plan Blaze de Firebase, utilizaremos el **Método del Túnel**. Esto permite que tu celular acceda a la IA de forma segura:

### 1. Obtener una URL Pública Gratis
1. Abre una **Terminal** en Firebase Studio.
2. Instala la herramienta de túnel:
   ```bash
   npm install -g localtunnel
   ```
3. Inicia tu servidor de desarrollo (si no está corriendo):
   ```bash
   npm run dev
   ```
4. En una **nueva pestaña** de la terminal, crea el túnel (Next.js usa el puerto 9002 aquí):
   ```bash
   lt --port 9002
   ```
5. Verás una URL como `https://heavy-cats-cry.loca.lt`. **Copia esa URL**.

### 2. Configurar el Móvil
1. Abre el archivo `capacitor.config.ts`.
2. En la propiedad `url`, pega la dirección que copiaste arriba.
3. Guarda el archivo.

---

## 📱 Guía para Generar APK (Android)

### 1. Preparación
Ejecuta estos comandos en la terminal:
```bash
npm install
npm run build
npx cap add android
```

### 2. Generación del APK
Cada vez que hagas cambios y quieras verlos en el celular:
1. Sincroniza:
   ```bash
   npm run build
   npx cap copy android
   ```
2. Abre el proyecto en Android Studio (debes tenerlo instalado en tu PC local):
   ```bash
   npx cap open android
   ```
3. En Android Studio: Ve a `Build > Build Bundle(s) / APK(s) > Build APK(s)`.
4. El archivo final estará en: `android/app/build/outputs/apk/debug/app-debug.apk`.

### 3. Distribución (Sin Tiendas)
Sube el archivo `app-debug.apk` a **Firebase App Distribution** en tu consola de Firebase (Menú: Release & Monitor). Añade los correos de tus evaluadores y ellos podrán instalar la app gratis.

---
© 2024 EstilizaPro AI - Pilar Cifuentes Catalán.
