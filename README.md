# 🚀 EstilizaPro AI - Guía de Lanzamiento Rápido

Sigue estos pasos para tener tu aplicación funcionando en un link público.

## 📦 Paso 1: Subir a GitHub
1. Abre la **Terminal** (la ventana negra al final de esta pantalla).
2. Copia y pega estos comandos uno por uno (reemplaza `TU_USUARIO` con tu nombre de GitHub):
   ```bash
   git init
   git add .
   git commit -m "Lanzamiento oficial EstilizaPro"
   git branch -M main
   git remote add origin https://github.com/TU_USUARIO/estilizapro-ai.git
   git push -u origin main
   ```

## 🌐 Paso 2: Desplegar en Vercel
1. Ve a [Vercel.com](https://vercel.com) e inicia sesión con tu cuenta de GitHub.
2. Haz clic en **"Add New"** > **"Project"**.
3. Selecciona el repositorio `estilizapro-ai`.
4. **IMPORTANTE (Variables de Entorno)**: Antes de darle a "Deploy", busca la sección **"Environment Variables"** y añade estas dos:
   *   `OPENAI_API_KEY` = (Pega tu sk-...)
   *   `UNSPLASH_ACCESS_KEY` = (Pega tu clave de Unsplash)
5. Haz clic en **"Deploy"**.

## ✅ Paso 3: ¡Listo!
Vercel te dará una URL (ej: `estilizapro.vercel.app`). ¡Ese es tu link para compartir con el mundo!

---
*Nota: Los cambios que hagas en Firebase Studio no se verán en Vercel hasta que vuelvas a usar los comandos `git add .`, `git commit` y `git push`.*
