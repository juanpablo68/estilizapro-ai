'use server';
/**
 * @fileOverview Servicio de búsqueda visual de moda optimizado para Unsplash.
 * Utiliza una técnica de búsqueda quirúrgica para evitar fotos de personas y paisajes.
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

  // Refinamiento quirúrgico para producto real. 
  // Priorizamos "product photography" y "white background" para evitar contextos irrelevantes.
  const refinedQuery = `${query} fashion product photography isolated`.trim();

  try {
    const response = await fetch(
      `https://api.unsplash.com/search/photos?query=${encodeURIComponent(refinedQuery)}&per_page=10&orientation=portrait&content_filter=high`,
      {
        headers: { Authorization: `Client-ID ${key}` },
        next: { revalidate: 86400 } // Cache por 24 horas
      }
    );

    if (!response.ok) return [];
    
    const data = await response.json();
    
    if (data.results && data.results.length > 0) {
      // Filtrado estricto: descartamos cualquier cosa que huela a personas, arquitectura o interiores.
      const forbiddenWords = ['person', 'face', 'woman', 'man', 'girl', 'boy', 'model', 'people', 'portrait', 'interior', 'room', 'building', 'wall', 'door', 'street'];
      
      const filteredResults = data.results.filter((result: any) => {
        const desc = (result.alt_description || "").toLowerCase();
        const tags = (result.tags || []).map((t: any) => t.title.toLowerCase()).join(' ');
        
        // No debe contener palabras prohibidas en descripción ni etiquetas
        const isForbidden = forbiddenWords.some(word => desc.includes(word) || tags.includes(word));
        return !isForbidden;
      });

      // Si el filtrado nos deja sin nada, usamos el primer resultado pero intentando ser selectivos.
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
