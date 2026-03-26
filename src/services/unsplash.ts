'use server';
/**
 * @fileOverview Servicio de búsqueda de imágenes de moda en Unsplash.
 * Optimizado para devolver solo productos de moda reales.
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

  // Refinamiento de búsqueda: Moda, producto, estudio. Excluimos arquitectura y personas.
  const refinedQuery = `${query} fashion product studio shot -architecture -building -landscape -person`;

  try {
    const response = await fetch(
      `https://api.unsplash.com/search/photos?query=${encodeURIComponent(refinedQuery)}&per_page=1&orientation=portrait&content_filter=high`,
      {
        headers: { Authorization: `Client-ID ${key}` },
        next: { revalidate: 3600 }
      }
    );

    if (!response.ok) return [];
    
    const data = await response.json();
    
    if (data.results && data.results.length > 0) {
      // Verificamos que la descripción no contenga palabras clave no deseadas (filtro extra de seguridad)
      const desc = (data.results[0].alt_description || '').toLowerCase();
      const unwanted = ['building', 'architecture', 'landscape', 'mountain', 'car'];
      if (unwanted.some(word => desc.includes(word))) return [];

      return [{
        id: data.results[0].id,
        url: data.results[0].urls.regular,
        description: data.results[0].alt_description || query
      }];
    }

    return [];
  } catch (error) {
    console.error('Unsplash API Error:', error);
    return [];
  }
}
