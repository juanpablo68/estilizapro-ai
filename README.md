
# 🚀 EstilizaPro AI - Guía de Lanzamiento Final

Sigue estos pasos en la **Terminal** (búscala en el menú superior o presiona `Ctrl + \``) para publicar tu app.

## 📦 Paso 1: Subir código a GitHub
Copia y pega estos comandos **uno por uno** y presiona Enter:

1. **Prepara los archivos:**
   ```bash
   git add .
   ```
2. **Guarda los cambios:**
   ```bash
   git commit -m "Lanzamiento EstilizaPro AI"
   ```
3. **Cambia a la rama principal:**
   ```bash
   git branch -M main
   ```
4. **Conecta con tu repositorio:** (Si ya lo hiciste antes, puedes saltar este)
   ```bash
   git remote add origin https://github.com/juanpablo68/estilizapro-ai.git
   ```
5. **Sube el código:** (Te pedirá usuario y contraseña/token de GitHub)
   ```bash
   git push -u origin main
   ```

## 🌐 Paso 2: Desplegar en Vercel
1. Ve a [Vercel.com](https://vercel.com) e importa tu repositorio `estilizapro-ai`.
2. **IMPORTANTE:** En la sección "Environment Variables" de Vercel, añade estas dos:
   - `OPENAI_API_KEY`: Pega tu llave de OpenAI.
   - `UNSPLASH_ACCESS_KEY`: Pega tu llave de Unsplash.
3. Haz clic en **Deploy**.

¡Y listo! Tu app estará en internet.
