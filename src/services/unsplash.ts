'use server';
/**
 * @fileOverview Servicio de búsqueda de imágenes de moda en Unsplash.
 */

export interface UnsplashImage {
  id: string;
  url: string;
  description: string;
}

/**
 * Busca imágenes de moda en Unsplash basadas en palabras clave de la IA.
 * @param query Palabras clave generadas por la IA (ej: "vintage denim jacket")
 * @param accessKey Llave de acceso de Unsplash (opcional, usa env por defecto)
 */
export async function searchUnsplashImages(query: string, accessKey?: string): Promise<UnsplashImage[]> {
  const key = accessKey || process.env.UNSPLASH_ACCESS_KEY;
  
  if (!key) {
    // Si no hay llave, devolvemos un placeholder de alta calidad basado en picsum con la semilla del query
    return [{
      id: `mock-${Date.now()}`,
      url: `https://picsum.photos/seed/${encodeURIComponent(query)}/600/800`,
      description: `Sugerencia: ${query}`
    }];
  }

  try {
    const response = await fetch(
      `https://api.unsplash.com/search/photos?query=${encodeURIComponent(query + ' fashion garment')}&per_page=3&orientation=portrait`,
      {
        headers: {
          Authorization: `Client-ID ${key}`
        }
      }
    );

    if (!response.ok) throw new Error('Error al conectar con Unsplash');
    
    const data = await response.json();
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
