# EstilizaPro AI - Guía de Lanzamiento en Vercel 🚀

Este proyecto está listo para ser publicado. Sigue estos pasos para obtener tu link público y que la IA funcione para todos.

## 📦 1. Subir tu código a GitHub
1. Crea un repositorio **Público** o **Privado** en [GitHub](https://github.com) llamado `estilizapro-ai`.
2. Abre la terminal aquí en Firebase Studio y ejecuta estos comandos uno por uno:
   ```bash
   git init
   git add .
   git commit -m "feat: versión final de lanzamiento"
   git branch -M main
   git remote add origin https://github.com/TU_USUARIO/estilizapro-ai.git
   git push -u origin main
   ```
   *(Reemplaza TU_USUARIO por tu nombre real de GitHub).*

## 🌐 2. Desplegar en Vercel (Tu Link Público)
1. Entra a [Vercel](https://vercel.com) y conecta tu cuenta de GitHub.
2. Haz clic en **"Add New"** > **"Project"** y selecciona `estilizapro-ai`.
3. **PASO CRÍTICO (Configurar la IA)**: Antes de darle al botón "Deploy", busca la sección **"Environment Variables"** y añade estas dos llaves:
   *   **Nombre:** `OPENAI_API_KEY` | **Valor:** (Pega tu llave sk-...)
   *   **Nombre:** `UNSPLASH_ACCESS_KEY` | **Valor:** (Pega tu llave de Unsplash)
4. Haz clic en **Deploy**.

## 📱 3. ¡Listo!
Vercel te dará una URL (ej: `https://estilizapro.vercel.app`). Este link es el que puedes compartir con cualquier usuario. La IA funcionará automáticamente gracias a las variables que configuraste en el paso anterior.

---
© 2024 EstilizaPro AI - Pilar Cifuentes Catalán.
