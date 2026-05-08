
# 🚀 EstilizaPro AI - Guía de Lanzamiento Final

Sigue estos pasos en la **Terminal** para publicar tu app. 

### 🛑 SI TE DIO ERROR "REJECTED" O "FETCH FIRST":
Copia y pega este comando y presiona Enter:
```bash
git push -f origin main
```
*(Esto obligará a GitHub a aceptar todo tu código de Firebase).*

## 📦 Proceso Completo (Si empiezas de cero)
1. **Prepara los archivos:**
   ```bash
   git add .
   ```
2. **Guarda los cambios:**
   ```bash
   git commit -m "Versión Final EstilizaPro"
   ```
3. **Sube el código (Forzado para evitar errores):**
   ```bash
   git push -f origin main
   ```

## 🌐 Paso Final: Activar en Vercel
1. Ve a [Vercel.com](https://vercel.com) e importa el proyecto `estilizapro-ai`.
2. En la sección **Environment Variables**, añade estas 2 (Cópialas de tu archivo .env):
   - `OPENAI_API_KEY`: Tu llave de OpenAI.
   - `UNSPLASH_ACCESS_KEY`: jMm7V8GtuOEx0iPBVpBJymtek10li8jbAcopWV8FbY4
3. Dale a **Deploy**.
