
# 🚀 EstilizaPro AI - Guía de Lanzamiento Final

Sigue estos pasos en la **Terminal** (la ventana negra de abajo) para publicar tu app.

### 🛑 IMPORTANTE: Si ves el símbolo `>` en la terminal, presiona `Ctrl + C` para limpiar.

## 📦 Paso 1: Enviar a GitHub
Copia y pega estos comandos **uno por uno** y presiona Enter después de cada uno. **NO escribas la palabra "bash"**.

1. **Prepara todo el proyecto:**
   ```bash
   git add .
   ```
2. **Guarda los cambios:**
   ```bash
   git commit -m "Versión Final EstilizaPro"
   ```
3. **Asegura la rama principal:**
   ```bash
   git branch -M main
   ```
4. **Conecta con tu cuenta:** (Si sale error de que ya existe, ignóralo y sigue al paso 5)
   ```bash
   git remote add origin https://github.com/juanpablo68/estilizapro-ai.git
   ```
5. **Sube el código:**
   ```bash
   git push -u origin main
   ```
   *(Te pedirá tu usuario de GitHub y tu contraseña o Token)*

## 🌐 Paso 2: Activar en Vercel
1. Ve a [Vercel.com](https://vercel.com) e importa el proyecto `estilizapro-ai`.
2. En la sección **Environment Variables**, añade:
   - `OPENAI_API_KEY`: Pega tu llave de OpenAI.
   - `UNSPLASH_ACCESS_KEY`: Pega tu llave de Unsplash.
3. Dale a **Deploy**.
