'use server';
/**
 * @fileOverview Servicio de búsqueda visual de moda optimizado para Unsplash.
 * Utiliza términos de "flat lay" y "product photography" para evitar fotos de personas.
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

  // Refinamiento para producto real: "flat lay" es clave para evitar personas.
  const refinedQuery = `${query} fashion flat lay product studio shot`.trim();

  try {
    const response = await fetch(
      `https://api.unsplash.com/search/photos?query=${encodeURIComponent(refinedQuery)}&per_page=3&orientation=portrait&content_filter=high`,
      {
        headers: { Authorization: `Client-ID ${key}` },
        next: { revalidate: 86400 } // Cache por 24 horas
      }
    );

    if (!response.ok) return [];
    
    const data = await response.json();
    
    if (data.results && data.results.length > 0) {
      return data.results.map((result: any) => ({
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
