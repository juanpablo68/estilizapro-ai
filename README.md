# 🚀 EstilizaPro AI - Lanzamiento a Producción

Sigue estos pasos para tener tu app funcionando en un link público y seguro.

## 📦 Paso 1: Subir a GitHub
1. Crea un repositorio **Público o Privado** en tu cuenta de GitHub llamado `estilizapro-ai`.
2. Abre la **Terminal** en este editor y pega estos comandos (reemplaza `TU_USUARIO` con tu nombre real de GitHub):

```bash
git init
git add .
git commit -m "Versión estable EstilizaPro"
git branch -M main
git remote add origin https://github.com/TU_USUARIO/estilizapro-ai.git
git push -u origin main
```

## 🌐 Paso 2: Desplegar en Vercel
1. Entra en [Vercel.com](https://vercel.com).
2. Haz clic en **"Add New"** > **"Project"**.
3. Importa el repositorio `estilizapro-ai`.
4. **IMPORTANTE (Tus Llaves)**: Antes de darle al botón "Deploy", busca la sección **Environment Variables** y añade estas dos:
   - `OPENAI_API_KEY`: (Tu clave sk-...)
   - `UNSPLASH_ACCESS_KEY`: (Tu clave de Unsplash)
5. ¡Haz clic en **"Deploy"** y listo!

---
*Nota: El archivo .gitignore incluido evitará que tus claves se filtren en GitHub. Vercel las manejará de forma segura en su propio panel.*
