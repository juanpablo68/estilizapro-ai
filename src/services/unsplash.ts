
'use server';
/**
 * @fileOverview Servicio de búsqueda visual de moda optimizado para Unsplash.
 * Prioriza la visualización de producto puro para evitar humanos en las imágenes.
 */

export interface UnsplashImage {
  id: string;
  url: string;
  description: string;
}

export async function searchUnsplashImages(query: string, accessKey?: string, itemType?: string): Promise<UnsplashImage[]> {
  // 1. Prioridad Máxima: Llave del entorno (Servidor)
  // 2. Prioridad Secundaria: Llave manual (Ajustes de usuario)
  const key = process.env.UNSPLASH_ACCESS_KEY || accessKey;
  
  if (!key || key === 'undefined' || key.trim() === '' || key.includes('tu-llave')) {
    console.warn('Unsplash: Llave de API no configurada. Las imágenes externas se omitirán.');
    return [];
  }

  // Refinamos la búsqueda para que sean fotos de producto limpias
  const refinedQuery = `${query} fashion clothing product isolated`.trim();

  try {
    const response = await fetch(
      `https://api.unsplash.com/search/photos?query=${encodeURIComponent(refinedQuery)}&per_page=3&orientation=portrait&content_filter=high`,
      {
        headers: { Authorization: `Client-ID ${key}` },
        next: { revalidate: 86400 } // Cache por 24h
      }
    );

    if (!response.ok) {
      console.error('Error en Unsplash API:', response.statusText);
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
    console.error('Error de conectividad con Unsplash:', error);
    return [];
  }
}
