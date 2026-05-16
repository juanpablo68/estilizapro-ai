
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

  // Estabilización: Calidad media para asegurar respuesta < 45s y evitar timeouts
  const targetQuality = "medium"; 

  // Prompt de Máxima Fidelidad Editorial (Sustituye cualquier estilo animado)
  const finalPrompt = `Create a highly realistic full-body editorial fashion avatar based strictly on the provided reference images.

The face reference image is the primary identity source. Preserve the person’s facial identity cues as closely as possible: face shape, forehead proportion, ${facialStructure} structure, jawline shape, chin shape, nose shape, mouth shape, lip proportion, eyebrow shape, eye shape (${eyeColor}), eye spacing, skin tone (${skinTone}), hair color (${hairColor}), hairstyle (${hairDetail}), hair volume, hair length, and natural expression.

The body reference image is the primary body-shape source. Preserve the person’s natural body proportions, posture, shoulder proportion, torso proportion, waist proportion, hip proportion, leg proportion, general ${bodySilhouette} silhouette, and stance.

Do not invent a new face. Do not create a generic fashion model. Do not replace the person with an idealized character. Do not change gender presentation (${personType}). Do not change age impression. Do not alter natural facial structure. Do not make the person thinner, taller, younger, older, more muscular, or more stylized than shown in the reference images.

The avatar must look like the same person represented as a realistic fashion studio avatar. Prioritize likeness over beauty, stylization, glamour, or artistic interpretation.

Generate a realistic full-body fashion studio image with soft neutral lighting, neutral background, realistic camera perspective, natural skin texture, believable hair detail, realistic eyes, natural facial proportions, and accurate body silhouette.

The avatar should wear simple neutral fitted clothing suitable for fashion analysis: plain fitted top, simple pants, and neutral shoes. The clothing must not hide the general silhouette and must not be revealing, exaggerated, distracting, or overly fashionable.

The final result must be suitable for:
- visual user profile
- fashion advisory
- colorimetry support
- body shape reference
- outfit recommendation
- personalized capsule suggestions

Avoid:
- generic model face
- changed face
- changed body
- exaggerated beauty filter
- cartoon
- Pixar style
- animated feature film
- animated character
- 3D toy
- anime
- toy-like appearance
- doll-like skin
- oversized eyes
- unrealistic proportions
- fantasy character
- plastic skin
- excessive glamour
- heavy makeup unless present in the reference photo

Important:
The avatar should resemble the reference person more than it resembles a stock model.`;

  const startTime = Date.now();
  console.log(">>> Avatar generation process started (High Likeness Mode)");

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
      console.log(">>> Uploading high-likeness avatar to Firebase Storage...");
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
      throw new Error("La generación del avatar tardó demasiado. Por favor, intenta nuevamente en unos momentos.");
    }

    if (error.status === 401) throw new Error("Error 401: API Key de OpenAI inválida.");
    if (error.status === 429) throw new Error("Error 429: Cuota de OpenAI excedida o límite de velocidad.");
    
    throw new Error(error.message || "Error al conectar con el motor gpt-image-2.");
  }
}
