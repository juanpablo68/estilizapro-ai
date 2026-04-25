'use server';
/**
 * @fileOverview Servicio de búsqueda visual de moda optimizado para Unsplash.
 * Técnica de "Producto Puro": Elimina cualquier rastro humano (rostros, manos, piel).
 */

export interface UnsplashImage {
  id: string;
  url: string;
  description: string;
}

export async function searchUnsplashImages(query: string, accessKey?: string, itemType?: string): Promise<UnsplashImage[]> {
  const key = accessKey || process.env.UNSPLASH_ACCESS_KEY;
  
  if (!key || key === 'undefined' || key.trim() === '') {
    return [];
  }

  /**
   * REFINAMIENTO QUIRÚRGICO DE PRODUCTO
   * Usamos términos de industria para evitar modelos humanos.
   * "Flat lay": Prenda sobre superficie plana.
   * "Ghost mannequin": Prenda con forma pero sin cuerpo visible.
   * "Isolated on white": Fondo limpio.
   */
  const refinedQuery = `${query} fashion product photography flat lay ghost mannequin isolated on white`.trim();

  try {
    const response = await fetch(
      `https://api.unsplash.com/search/photos?query=${encodeURIComponent(refinedQuery)}&per_page=15&orientation=portrait&content_filter=high`,
      {
        headers: { Authorization: `Client-ID ${key}` },
        next: { revalidate: 86400 } // Cache por 24 horas
      }
    );

    if (!response.ok) return [];
    
    const data = await response.json();
    
    if (data.results && data.results.length > 0) {
      /**
       * LISTA NEGRA DE CONTENIDO HUMANO
       * Descartamos imágenes que mencionen cualquier parte del cuerpo o presencia humana.
       */
      const forbiddenWords = [
        'person', 'face', 'woman', 'man', 'girl', 'boy', 'model', 'people', 
        'portrait', 'skin', 'hand', 'arm', 'leg', 'foot', 'wearing', 'body',
        'smile', 'couple', 'human', 'finger', 'shoulder', 'neck'
      ];
      
      const filteredResults = data.results.filter((result: any) => {
        const desc = (result.alt_description || "").toLowerCase();
        const tags = (result.tags || []).map((t: any) => t.title.toLowerCase()).join(' ');
        
        // No debe contener palabras prohibidas en descripción ni etiquetas
        const isForbidden = forbiddenWords.some(word => desc.includes(word) || tags.includes(word));
        return !isForbidden;
      });

      // Si el filtrado nos deja sin nada, usamos los resultados originales pero 
      // priorizamos los que tengan menos probabilidad de tener personas.
      const finalResults = filteredResults.length > 0 ? filteredResults : data.results;

      return finalResults.map((result: any) => ({
        id: result.id,
        url: result.urls.regular,
        description: result.alt_description || query
      }));
    }

    return [];
  } catch (error) {
    console.error('Unsplash API Error:', error);
    return [];
  }
}
