'use server';
/**
 * @fileOverview Servicio de búsqueda de imágenes de moda en Unsplash.
 * Prioriza fotos de producto aisladas (flat lay) y elimina fallbacks de paisajes.
 */

export interface UnsplashImage {
  id: string;
  url: string;
  description: string;
}

export async function searchUnsplashImages(query: string, accessKey?: string, itemType?: string): Promise<UnsplashImage[]> {
  const key = accessKey || process.env.UNSPLASH_ACCESS_KEY;
  
  if (!key || key === 'undefined' || key.trim() === '') {
    // Si no hay key, no devolvemos nada para que el sistema use iconos genéricos en lugar de paisajes
    return [];
  }

  // Filtro estricto para prendas: Producto aislado, flat lay, sin personas ni paisajes
  const productFocusedQuery = `${query} clothing product flat lay isolated white background -person -model -mannequin -landscape`;

  try {
    const response = await fetch(
      `https://api.unsplash.com/search/photos?query=${encodeURIComponent(productFocusedQuery)}&per_page=1&orientation=portrait`,
      {
        headers: { Authorization: `Client-ID ${key}` },
        next: { revalidate: 3600 }
      }
    );

    if (!response.ok) return [];
    
    const data = await response.json();
    
    if (data.results && data.results.length > 0) {
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
