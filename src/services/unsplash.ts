
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
  // Priorizar llave manual (del usuario), luego llave del entorno
  const key = accessKey || process.env.UNSPLASH_ACCESS_KEY;
  
  // Validar que la llave exista y no sea el texto de ejemplo
  if (!key || key === 'undefined' || key.trim() === '' || key.includes('INGRESA_AQUI') || key.includes('tu-llave')) {
    console.warn('Unsplash: No se detectó una Access Key válida. Las imágenes externas no se cargarán.');
    return [];
  }

  // Búsqueda simplificada y estable enfocada en producto
  const refinedQuery = `${query} fashion product isolated`.trim();

  try {
    const response = await fetch(
      `https://api.unsplash.com/search/photos?query=${encodeURIComponent(refinedQuery)}&per_page=5&orientation=portrait`,
      {
        headers: { Authorization: `Client-ID ${key}` },
        next: { revalidate: 86400 } // Cache por 24 horas
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      console.error('Unsplash API Error Details:', errorData);
      return [];
    }
    
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
    console.error('Unsplash API Connectivity Error:', error);
    return [];
  }
}
