
# 🚀 EstilizaPro AI - Publicación en 2 Pasos

Sigue esta ruta directa para tener tu app funcionando en un link público.

## 📦 Paso 1: Subir a GitHub
1. Crea un repositorio nuevo en tu cuenta de GitHub llamado `estilizapro-ai`.
2. Abre la **Terminal** en este editor (pestaña abajo) y pega estos comandos uno por uno:

```bash
git init
git add .
git commit -m "Versión Final"
git branch -M main
git remote add origin https://github.com/TU_USUARIO/estilizapro-ai.git
git push -u origin main
```
*(Reemplaza `TU_USUARIO` con tu nombre de GitHub)*

## 🌐 Paso 2: Lanzar en Vercel
1. Entra en [Vercel.com](https://vercel.com) e inicia sesión con GitHub.
2. Haz clic en **"Add New"** > **"Project"** e importa `estilizapro-ai`.
3. **CLAVE DEL ÉXITO**: Antes de darle a "Deploy", busca la sección **Environment Variables** y añade estas dos:
   - Nombre: `OPENAI_API_KEY` | Valor: (Pega tu sk-...)
   - Nombre: `UNSPLASH_ACCESS_KEY` | Valor: (Pega tu llave de Unsplash)
4. Haz clic en **"Deploy"**.

¡Listo! Vercel te dará un link tipo `estilizapro-ai.vercel.app` que podrás compartir con todos.
