# 🚀 EstilizaPro AI - Guía de Lanzamiento Rápido

Sigue estos pasos en la **Terminal** (abajo en tu pantalla) para publicar tu app.

## 📦 Paso 1: Subir a GitHub
Copia y pega estos comandos uno por uno:

1. **Prepara todos los archivos:**
   ```bash
   git add .
   ```
2. **Crea el punto de guardado:**
   ```bash
   git commit -m "Versión Final con APIs configuradas"
   ```
3. **Conecta con tu GitHub:**
   ```bash
   git remote add origin https://github.com/juanpablo68/estilizapro-ai.git
   ```
4. **Sube el código:**
   ```bash
   git push -u origin main
   ```

## 🌐 Paso 2: Desplegar en Vercel
1. Ve a [Vercel.com](https://vercel.com) e importa tu repositorio `estilizapro-ai`.
2. **IMPORTANTE:** En la sección "Environment Variables" de Vercel, añade estas dos:
   - `OPENAI_API_KEY`: Tu clave completa de OpenAI.
   - `UNSPLASH_ACCESS_KEY`: Tu clave completa de Unsplash.
3. Haz clic en **Deploy**.

¡Listo! Tu app estará en un link público profesional.
