'use server';
/**
 * @fileOverview FASE 1: Análisis Estructurado Biométrico Quirúrgico utilizando OpenAI GPT-4o.
 * Utiliza paletas de referencia para ojos, piel, cabello y silueta para un diagnóstico infalible.
 */

import { z } from 'genkit';
import OpenAI from 'openai';

const BiometricDataSchema = z.object({
  genero: z.string(),
  edad_aproximada: z.string(),
  colorimetria: z.object({
    tono_piel: z.string().describe('Paleta: Pálido, Claro, Medio, Bronceado, Oscuro, Ébano'),
    subtono: z.string().describe('Paleta: Cálido (Amarillo/Dorado), Frío (Rosa/Azul), Neutro'),
    contraste_facial: z.string().describe('bajo, medio, alto'),
    hex_piel: z.string(),
    estacion_sugerida: z.string().describe('Una de las 12 estaciones (ej: Verano Suave, Invierno Brillante, Otoño Verdadero)')
  }),
  rostro: z.object({
    forma: z.string().describe('Paleta: Ovalado, Redondo, Cuadrado, Corazón, Diamante, Alargado'),
    ojos: z.object({
      color_detalle: z.string().describe('Paleta: Ámbar, Miel, Avellana, Verde Oliva, Verde Esmeralda, Azul Acero, Azul Grisáceo, Marrón Oscuro, Negro'),
      forma: z.string()
    }),
    cabello: z.object({
      color_natural: z.string().describe('Paleta: Rubio Platino, Rubio Dorado, Pelirrojo, Castaño Claro, Castaño Oscuro, Negro Azabache, Gris/Blanco'),
      textura: z.string()
    })
  }),
  cuerpo: z.object({
    complexion: z.string().describe('Paleta: Ectomorfo (Delgado), Mesomorfo (Atlético), Endomorfo (Robusto)'),
    figura_geometrica: z.string().describe('Paleta OBLIGATORIA: Reloj de Arena, Pera (Triángulo), Rectángulo, Triángulo Invertido, Manzana (Ovalo)'),
    proporcion_hombros_cadera: z.string()
  }),
  nivel_confianza: z.string()
});

const AnalyzeStyleInputSchema = z.object({
  facePhotoDataUri: z.string(),
  figurePhotoDataUri: z.string(),
  openaiApiKey: z.string().optional(),
});

const AnalyzeStyleOutputSchema = z.object({
  biometricData: z.any(),
  figureAnalysis: z.string(),
  colorimetryAnalysis: z.string(),
});

export async function analyzeStyleContext(input: z.infer<typeof AnalyzeStyleInputSchema>): Promise<z.infer<typeof AnalyzeStyleOutputSchema>> {
  const apiKey = input.openaiApiKey || process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error("API Key de OpenAI requerida.");

  const openai = new OpenAI({ apiKey });

  const response = await openai.chat.completions.create({
    model: "gpt-4o",
    messages: [
      {
        role: "system",
        content: `Actúa como un experto de élite en morfología y colorimetría profesional para PILAR CIFUENTES.
        
        REGLAS DE DIAGNÓSTICO QUIRÚRGICO:
        1. COMPARACIÓN DE PALETAS: Analiza los píxeles de las fotos y clasifícalos según estas paletas:
           - OJOS: Identifica matices específicos (Ámbar, Miel, Verde Oliva, Azul Acero, etc.).
           - PIEL: Determina categoría (Pálido a Ébano) y SUBTONO (Cálido vs Frío) analizando la saturación de hemoglobina (rosa) o caroteno (amarillo).
           - SILUETA: Mide visualmente la proporción hombro-cintura-cadera y asigna una de estas: Reloj de Arena, Pera, Rectángulo, Triángulo Invertido o Manzana.
        
        2. NO VALORES NULOS: Está prohibido responder "desconocido" o "no identificado". Debes asignar el valor más cercano de la paleta.
        
        3. FORMATO: Responde únicamente con el objeto JSON estructurado.`
      },
      {
        role: "user",
        content: [
          { type: "text", text: "Realiza el diagnóstico biométrico profundo comparando contra paletas profesionales para Pilar Cifuentes." },
          { type: "image_url", image_url: { url: input.facePhotoDataUri } },
          { type: "image_url", image_url: { url: input.figurePhotoDataUri } }
        ],
      },
    ],
    response_format: { type: "json_object" }
  });

  const rawContent = response.choices[0].message.content || "{}";
  const content = JSON.parse(rawContent);
  
  const figura = content.cuerpo?.figura_geometrica || 'Silueta por definir';
  const ojos = content.rostro?.ojos?.color_detalle || 'Color ojos';
  const cabello = content.rostro?.cabello?.color_natural || 'Color cabello';
  const estacion = content.colorimetria?.estacion_sugerida || 'Estación por definir';
  const subtono = content.colorimetria?.subtono || 'Neutro';

  const figureText = `Figura: ${figura}`;
  const colorText = `${estacion} (Ojos ${ojos}, Pelo ${cabello}, Subtono ${subtono})`;

  return {
    biometricData: content,
    figureAnalysis: figureText,
    colorimetryAnalysis: colorText
  };
}
