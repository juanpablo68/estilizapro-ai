'use server';
/**
 * @fileOverview Servicio de búsqueda visual de moda optimizado para Unsplash.
 * Prioriza la visualización de producto puro.
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

  // Añadimos términos de producto para intentar evitar modelos, pero sin filtros agresivos que rompan la búsqueda
  const refinedQuery = `${query} fashion product flat lay`.trim();

  try {
    const response = await fetch(
      `https://api.unsplash.com/search/photos?query=${encodeURIComponent(refinedQuery)}&per_page=10&orientation=portrait&content_filter=high`,
      {
        headers: { Authorization: `Client-ID ${key}` },
        next: { revalidate: 86400 }
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
