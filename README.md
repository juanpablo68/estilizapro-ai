# EstilizaPro AI - Manual de Producción y Migración

Este proyecto es el asesor de imagen personal diseñado por **Pilar Cifuentes Catalán**, desarrollado con una arquitectura de **IA Híbrida (GPT-4o + DALL-E 3)** sobre **Next.js 15**.

## 🚀 Guía de Instalación (Local / Antigravity)

Si has descargado este código y deseas ejecutarlo en un nuevo entorno, sigue estos pasos:

### 1. Requisitos Previos
- **Node.js**: Versión 18 o superior.
- **NPM**: Instalado globalmente.

### 2. Instalación de Dependencias
Ejecuta el siguiente comando en la raíz del proyecto:
```bash
npm install
```

### 3. Configuración de Variables de Entorno
Crea un archivo `.env` en la raíz con las siguientes llaves:
```env
OPENAI_API_KEY=tu_llave_aqui
# Opcional si usas Genkit
GOOGLE_GENAI_API_KEY=tu_llave_google
```

### 4. Ejecución en Desarrollo
```bash
npm run dev
```
La aplicación estará disponible en `http://localhost:9002`.

## 🧠 Arquitectura de IA (Pure OpenAI)

La aplicación utiliza tres flujos maestros definidos en `src/ai/flows/`:

1. **Esencia Biométrica (GPT-4o + DALL-E 3)**:
   - Realiza un análisis quirúrgico de fotos de rostro y cuerpo.
   - Genera un Avatar Pixar 3D con fidelidad de identidad real (piel, ojos, cabello).
2. **Probador Virtual (Pipeline de 2 Etapas)**:
   - **Etapa 1**: GPT-4o analiza la prenda real y su ajuste al avatar.
   - **Etapa 2**: DALL-E 3 realiza el renderizado visual del montaje.
3. **Capsulizador AI (Prioridad Armario)**:
   - Escanea los IDs del armario local del usuario.
   - Crea outfits combinando ropa real con sugerencias de tendencia.

## 📁 Estructura del Proyecto

- `src/app/`: Rutas y vistas de la aplicación (Next.js App Router).
- `src/ai/`: Lógica de los flujos de inteligencia artificial y Genkit.
- `src/lib/storage-hooks.ts`: Manejo de persistencia local (LocalStorage).
- `src/components/ui/`: Componentes visuales basados en ShadCN.

## 🛡️ Privacidad y Seguridad
Este desarrollo utiliza **LocalStorage**. Las fotos y perfiles de los usuarios se almacenan exclusivamente en sus navegadores, garantizando privacidad total. La comunicación con OpenAI se realiza mediante Server Actions protegidas con un límite de **20MB** para permitir el flujo de imágenes HD.

---
© 2024 EstilizaPro AI - Pilar Cifuentes Catalán.
