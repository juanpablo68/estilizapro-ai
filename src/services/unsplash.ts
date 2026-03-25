'use server';
/**
 * @fileOverview Servicio de búsqueda de imágenes de moda en Unsplash optimizado para productos sin modelos.
 */

export interface UnsplashImage {
  id: string;
  url: string;
  description: string;
}

/**
 * Busca imágenes de moda en Unsplash basadas en palabras clave de la IA.
 * Se han añadido filtros para priorizar fotos de producto (flat lay) sin personas.
 * @param query Palabras clave generadas por la IA (ej: "vintage denim jacket")
 * @param accessKey Llave de acceso de Unsplash (opcional, usa env por defecto)
 */
export async function searchUnsplashImages(query: string, accessKey?: string): Promise<UnsplashImage[]> {
  const key = accessKey || process.env.UNSPLASH_ACCESS_KEY;
  
  // Reforzamos el query para evitar modelos y maniquíes
  const productFocusedQuery = `${query} product flat lay isolated -person -model -mannequin`;

  if (!key) {
    // Si no hay llave, devolvemos un placeholder estético basado en picsum
    return [{
      id: `mock-${Date.now()}`,
      url: `https://picsum.photos/seed/${encodeURIComponent(query)}/600/800`,
      description: `Sugerencia: ${query}`
    }];
  }

  try {
    const response = await fetch(
      `https://api.unsplash.com/search/photos?query=${encodeURIComponent(productFocusedQuery)}&per_page=3&orientation=portrait&content_filter=high`,
      {
        headers: {
          Authorization: `Client-ID ${key}`
        }
      }
    );

    if (!response.ok) throw new Error('Error al conectar con Unsplash');
    
    const data = await response.json();
    
    // Si no hay resultados con el query estricto, intentamos uno más relajado pero aún enfocado en producto
    if (!data.results || data.results.length === 0) {
      const relaxedResponse = await fetch(
        `https://api.unsplash.com/search/photos?query=${encodeURIComponent(query + ' clothing product shot')}&per_page=3&orientation=portrait`,
        { headers: { Authorization: `Client-ID ${key}` } }
      );
      const relaxedData = await relaxedResponse.json();
      return (relaxedData.results || []).map((img: any) => ({
        id: img.id,
        url: img.urls.regular,
        description: img.alt_description || query
      }));
    }

    return (data.results || []).map((img: any) => ({
      id: img.id,
      url: img.urls.regular,
      description: img.alt_description || query
    }));
  } catch (error) {
    console.error('Unsplash API Error:', error);
    return [];
  }
}
