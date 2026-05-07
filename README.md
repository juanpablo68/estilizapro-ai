
# 🚀 EstilizaPro AI - Guía de Lanzamiento Directo

Sigue estos pasos en orden para tener tu app funcionando en un link público.

## 📦 Paso 1: Subir a GitHub (Vía Terminal)
Ejecuta estos comandos uno por uno en la terminal de Firebase Studio:

1. **Prepara todos los archivos:**
   ```bash
   git add .
   ```
2. **Crea el punto de guardado:**
   ```bash
   git commit -m "Versión Final EstilizaPro con APIs"
   ```
3. **Conecta con tu GitHub:**
   ```bash
   git remote add origin https://github.com/juanpablo68/estilizapro-ai.git
   ```
4. **Sube el código:**
   ```bash
   git push -u origin main
   ```

## 🌐 Paso 2: Desplegar en Vercel (La "Energía" de la App)
1. Ve a [Vercel.com](https://vercel.com) e inicia sesión con tu GitHub.
2. Importa tu repositorio `estilizapro-ai`.
3. **CRÍTICO (Variables de Entorno):** Antes de dar clic en "Deploy", busca la sección **Environment Variables** y añade estas dos:
   - **Key:** `OPENAI_API_KEY` | **Value:** `sk-proj-ehS1xd...` (Tu clave completa)
   - **Key:** `UNSPLASH_ACCESS_KEY` | **Value:** `jMm7V8GtuO...` (Tu clave completa)
4. Haz clic en **Deploy**.

¡Listo! Vercel te dará un link profesional para compartir tu app.
