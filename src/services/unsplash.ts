'use server';
/**
 * @fileOverview Servicio de búsqueda visual de moda optimizado para Unsplash.
 * Utiliza descriptores de producto e-commerce para evitar resultados irrelevantes.
 */

export interface UnsplashImage {
  id: string;
  url: string;
  description: string;
}

export async function searchUnsplashImages(query: string, accessKey?: string, itemType?: string): Promise<UnsplashImage[]> {
  const key = accessKey || process.env.UNSPLASH_ACCESS_KEY;
  
  // Si no hay llave, devolvemos vacío para que el sistema use iconos genéricos en lugar de paisajes.
  if (!key || key === 'undefined' || key.trim() === '') {
    return [];
  }

  // Refinamiento de búsqueda: Forzamos fotografía de producto e-commerce.
  // Usamos términos positivos potentes en lugar de negativos restrictivos.
  const typeContext = itemType ? `${itemType} ` : '';
  const refinedQuery = `${typeContext}${query} fashion product photography, studio shot, high quality, white background`;

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
      // Retornamos el primer resultado que sea relevante.
      // Unsplash ya filtra por 'high' content_filter, lo que reduce drásticamente el ruido.
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
