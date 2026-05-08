
# 🚀 EstilizaPro AI - Guía de Lanzamiento Directo

Sigue estos pasos en la **Terminal** (ábrela con `Ctrl + J`) para publicar tu app.

## 📦 Paso 1: Subir a GitHub
Copia y pega estos comandos **uno por uno** y dale a Enter:

1. **Prepara los archivos:**
   ```bash
   git add .
   ```
2. **Guarda los cambios:**
   ```bash
   git commit -m "Versión lista para Vercel"
   ```
3. **Sube el código:** (Si ya lo hiciste antes, solo corre este último)
   ```bash
   git push -u origin main
   ```

## 🌐 Paso 2: Desplegar en Vercel
1. Ve a [Vercel.com](https://vercel.com) e importa tu repositorio `estilizapro-ai`.
2. **IMPORTANTE:** En la sección "Environment Variables" de Vercel, añade estas dos para que la IA funcione en el link público:
   - `OPENAI_API_KEY`: Pega tu llave de OpenAI.
   - `UNSPLASH_ACCESS_KEY`: Pega tu llave de Unsplash.
3. Haz clic en **Deploy**.

¡Y listo! Tu app estará viva en internet.
