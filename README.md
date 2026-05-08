
# 🚀 EstilizaPro AI - Guía de Lanzamiento Final

Sigue estos pasos en la **Terminal** para publicar tu app con un historial limpio. 

## 📦 Paso 1: Limpiar el historial de GitHub
Copia y pega este comando para que tu GitHub se vea profesional:
```bash
git add . && git commit -m "🚀 Versión Inicial EstilizaPro AI" && git push -f origin main
```

## 🌐 Paso 2: Activar en Vercel (Gratis)
1. Ve a [Vercel.com](https://vercel.com) e inicia sesión con tu cuenta de GitHub.
2. Haz clic en **"Add New"** -> **"Project"**.
3. Selecciona tu repositorio `estilizapro-ai` y dale a **"Import"**.
4. **IMPORTANTE (Configuración de IA)**:
   - Busca la sección **"Environment Variables"**.
   - Añade estas 2 variables (Copia los valores de tu archivo .env):
     - `OPENAI_API_KEY`: [Tu llave de OpenAI]
     - `UNSPLASH_ACCESS_KEY`: [Tu llave de Unsplash]
5. Haz clic en **"Deploy"**.

¡Listo! Vercel te dará un link público (ej: `estilizapro-ai.vercel.app`) que podrás compartir con todo el mundo.
