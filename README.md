# 🚀 EstilizaPro AI - Guía de Lanzamiento Directo

Sigue estos pasos en orden para tener tu app funcionando en un link público.

## 📦 Paso 1: Subir a GitHub (Vía Terminal)
En lugar de copiar y pegar a mano, abre la **Terminal** aquí abajo y ejecuta estos comandos uno por uno:

1. **Inicia el repositorio:**
   ```bash
   git init
   ```
2. **Prepara los archivos (el .gitignore protegerá tus llaves):**
   ```bash
   git add .
   ```
3. **Crea el primer punto de guardado:**
   ```bash
   git commit -m "Versión Final EstilizaPro"
   ```
4. **Conecta con tu GitHub:** *(Crea un repo vacío en GitHub llamado `estilizapro-ai` y usa ese link aquí)*
   ```bash
   git remote add origin https://github.com/TU_USUARIO/estilizapro-ai.git
   git branch -M main
   git push -u origin main
   ```

## 🌐 Paso 2: Desplegar en Vercel
1. Ve a [Vercel.com](https://vercel.com) e importa tu nuevo repositorio `estilizapro-ai`.
2. **IMPORTANTE (Variables de Entorno):** Antes de dar clic en "Deploy", busca la sección **Environment Variables** y añade estas dos:
   - **Nombre:** `OPENAI_API_KEY` | **Valor:** (Tu clave sk-...)
   - **Nombre:** `UNSPLASH_ACCESS_KEY` | **Valor:** (Tu clave jMm...)
3. Haz clic en **Deploy**.

¡Listo! Vercel te dará un link profesional que podrás compartir por WhatsApp o redes sociales.
