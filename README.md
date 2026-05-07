# 🚀 EstilizaPro AI - Guía de Lanzamiento Directo

Sigue estos pasos en orden para tener tu app funcionando en un link público.

## 📦 Paso 1: Subir a GitHub (Vía Terminal)
Ignora los mensajes amarillos o de error de "bash prompt", lo importante es ejecutar estos comandos:

1. **Prepara los archivos:**
   ```bash
   git add .
   ```
2. **Crea el punto de guardado:**
   ```bash
   git commit -m "Versión Final EstilizaPro"
   ```
3. **Conecta con tu GitHub:** *(Crea un repo vacío en GitHub llamado `estilizapro-ai` y usa SU link aquí)*
   ```bash
   git remote add origin https://github.com/TU_USUARIO/estilizapro-ai.git
   ```
4. **Sube el código:**
   ```bash
   git push -u origin main
   ```

## 🌐 Paso 2: Desplegar en Vercel (La "Energía" de la App)
1. Ve a [Vercel.com](https://vercel.com) e importa tu repositorio de GitHub.
2. **CRÍTICO (Variables de Entorno):** Antes de dar clic en "Deploy", busca la sección **Environment Variables** y añade estas dos:
   - **Key:** `OPENAI_API_KEY` | **Value:** (Tu clave sk-...)
   - **Key:** `UNSPLASH_ACCESS_KEY` | **Value:** (Tu clave jMm...)
3. Haz clic en **Deploy**.

¡Listo! Vercel te dará un link profesional.
