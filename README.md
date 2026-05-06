
# EstilizaPro AI - Guía de Lanzamiento Público 🚀

Este proyecto está optimizado para funcionar en la nube de forma gratuita. Sigue estos pasos para compartir tu link.

## 📦 1. Subir a GitHub (Tu Bóveda)
1. Crea un repositorio nuevo en [GitHub](https://github.com) llamado `estilizapro-ai`.
2. Abre la terminal aquí en Firebase Studio y ejecuta:
   ```bash
   git init
   git add .
   git commit -m "feat: versión de lanzamiento"
   git branch -M main
   git remote add origin https://github.com/TU_USUARIO/estilizapro-ai.git
   git push -u origin main
   ```
   *(Reemplaza TU_USUARIO por tu nombre real de GitHub).*

## 🌐 2. Desplegar en Vercel (Tu Link Público)
1. Entra a [Vercel](https://vercel.com) y conecta tu cuenta de GitHub.
2. Selecciona el repositorio `estilizapro-ai`.
3. **PASO CRÍTICO (Seguridad)**: En la configuración del proyecto, busca **"Environment Variables"** y añade:
   *   `OPENAI_API_KEY`: (Pega tu llave sk-...)
   *   `UNSPLASH_ACCESS_KEY`: (Pega tu llave de Unsplash)
4. Haz clic en **Deploy**.

## 📱 3. Actualizar tu App Móvil
Una vez que Vercel te dé tu URL (ej: `https://estilizapro.vercel.app`), recuerda actualizarla en tu archivo `capacitor.config.ts` en la propiedad `url` para que tu APK apunte al servidor real y no al túnel local.

---
© 2024 EstilizaPro AI - Pilar Cifuentes Catalán.
