
'use server';
/**
 * @fileOverview Generación de Avatar Realista de Alta Fidelidad usando gpt-image-2.
 * Procesa b64_json, sube a Firebase Storage y devuelve URL pública.
 * Optimizado para realismo fotográfico y análisis de silueta profesional.
 */

import { z } from 'genkit';
import OpenAI from 'openai';
import { getOpenAIKey } from '@/ai/genkit';
import { adminStorage } from '@/lib/firebase-admin';

const GenerateStylizedAvatarInputSchema = z.object({
  biometricData: z.any(),
  openaiApiKey: z.string().optional(),
  userId: z.string().optional(),
  finalAvatar: z.boolean().optional(),
});

export async function generateStylizedAvatar(input: z.infer<typeof GenerateStylizedAvatarInputSchema>) {
  const apiKey = getOpenAIKey(input.openaiApiKey);
  
  if (!apiKey || apiKey.trim() === '') {
    throw new Error("Error 401: No se detectó una API Key de OpenAI válida.");
  }

  const openai = new OpenAI({ apiKey });
  const data = input.biometricData || {};
  
  // Extracción de rasgos para personalización del prompt realista
  const personType = data.genero || 'Femenino';
  const hairColor = data.rostro?.cabello?.color_natural || 'natural';
  const hairDetail = data.rostro?.cabello?.color_detalle || '';
  const skinTone = data.colorimetria?.tono_piel || 'natural skin tone';
  const eyeColor = data.rostro?.ojos?.color_detalle || 'natural eyes';
  const facialStructure = data.rostro?.forma_rostro || 'natural facial structure';
  const bodySilhouette = data.cuerpo?.figure_geometrica || 'natural silhouette';
  
  const userId = input.userId || 'anonymous';

  // Estabilización: Calidad media para asegurar respuesta < 45s
  const targetQuality = "medium"; 

  // Prompt Editorial de Alta Fidelidad (Actualizado para eliminar estilos animados)
  const finalPrompt = `Create a highly realistic full-body editorial fashion avatar for a ${personType}.

IDENTITY CONTEXT:
- Facial Features: ${facialStructure}, ${hairDetail} (${hairColor} hair), ${eyeColor}.
- Physical Build: ${bodySilhouette} silhouette.
- Skin Tone: ${skinTone}.

The avatar must look like a realistic fashion studio photograph, not a cartoon, not a 3D toy, not an animated character, not anime, not illustration, and not a generic fashion model.

Preserve the person’s natural appearance and identity cues. Do not change gender presentation. Do not make the person thinner, taller, younger, older, more muscular, more glamorous, or more conventionally attractive than shown in the reference traits.

Keep realistic facial proportions, realistic body proportions, natural skin tone, realistic skin texture, realistic hair detail, believable eyes, natural posture, and accurate overall silhouette.

Generate the avatar wearing simple neutral fitted clothing suitable for fashion analysis: plain fitted top, simple pants, and neutral shoes. The clothing should help evaluate the body silhouette without being revealing, exaggerated, distracting, or overly fashionable.

Use soft studio lighting, neutral background, full-body framing, front-facing or slightly natural posture, and realistic camera perspective.

The final image must be suitable for:
- colorimetry analysis
- body shape analysis
- outfit recommendations
- personalized fashion capsule suggestions
- wardrobe advisory workflows

Avoid: cartoon face, oversized eyes, plastic skin, doll-like appearance, toy-like body, generic fashion model, unrealistic proportions, fantasy character, beauty filter, changed face, changed body, changed gender presentation, anime style, flat illustration.`;

  const startTime = Date.now();
  console.log(">>> Avatar generation process started (Realistic Mode)");

  try {
    console.log(`>>> Calling OpenAI (model: gpt-image-2, quality: ${targetQuality}, size: 1024x1536)...`);
    
    const response = await openai.images.generate({
      model: "gpt-image-2" as any, 
      prompt: finalPrompt,
      n: 1,
      size: "1024x1536" as any,
      quality: targetQuality as any,
      // @ts-ignore
      output_format: "png"
    });

    console.log(`>>> OpenAI response received in ${Date.now() - startTime}ms`);
    
    const b64Data = response.data[0].b64_json;

    if (!b64Data) {
      console.error(">>> OpenAI Error: b64_json is missing.");
      throw new Error("La IA no devolvió datos de imagen (b64_json) válidos.");
    }

    console.log(">>> Creating image buffer...");
    const buffer = Buffer.from(b64Data, 'base64');
    console.log(`>>> Buffer created. Total elapsed: ${Date.now() - startTime}ms`);

    try {
      console.log(">>> Uploading realistic avatar to Firebase Storage...");
      const timestamp = Date.now();
      const fileName = `avatars/${userId}/${timestamp}.png`;
      const bucket = adminStorage.bucket();
      const file = bucket.file(fileName);

      await file.save(buffer, {
        metadata: { contentType: 'image/png' },
        public: true
      });
      
      console.log(`>>> Firebase upload completed in ${Date.now() - startTime}ms`);

      const downloadURL = `https://storage.googleapis.com/${bucket.name}/${fileName}`;
      
      console.log(`>>> Avatar flow successfully finished in ${Date.now() - startTime}ms`);
      
      return { 
        avatarDataUri: downloadURL,
        imageUrl: downloadURL 
      };
    } catch (storageError: any) {
      console.error(">>> Storage Fallback Error:", storageError.message);
      // Fallback a Data URI si el almacenamiento falla
      return { 
        avatarDataUri: `data:image/png;base64,${b64Data}`,
        imageUrl: `data:image/png;base64,${b64Data}`
      };
    }
  } catch (error: any) {
    console.error(">>> Image Generation Error (gpt-image-2):", error);
    
    const errorMsg = error.message?.toLowerCase() || "";
    if (
      errorMsg.includes("timeout") ||
      errorMsg.includes("network") ||
      errorMsg.includes("unexpected response")
    ) {
      throw new Error("La generación del avatar tardó demasiado debido a la alta complejidad. Por favor, intenta nuevamente.");
    }

    if (error.status === 401) throw new Error("Error 401: API Key de OpenAI inválida.");
    if (error.status === 429) throw new Error("Error 429: Cuota de OpenAI excedida o límite de velocidad.");
    
    throw new Error(error.message || "Error al conectar con el motor gpt-image-2.");
  }
}
