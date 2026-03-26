'use server';
/**
 * @fileOverview Servicio de búsqueda de imágenes de moda en Unsplash.
 * Optimizado con filtros estrictos para evitar arquitectura, paisajes e interiores.
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

  // Refinamiento de búsqueda: Forzamos fotografía de producto e-commerce y aislamos el fondo.
  // Excluimos explícitamente términos arquitectónicos y de interiores.
  const typeContext = itemType ? `${itemType} ` : '';
  const refinedQuery = `${typeContext}${query} fashion product studio shot e-commerce white background isolated -door -wall -building -architecture -room -interior -furniture -landscape -nature -outdoor`;

  try {
    const response = await fetch(
      `https://api.unsplash.com/search/photos?query=${encodeURIComponent(refinedQuery)}&per_page=5&orientation=portrait&content_filter=high`,
      {
        headers: { Authorization: `Client-ID ${key}` },
        next: { revalidate: 3600 }
      }
    );

    if (!response.ok) return [];
    
    const data = await response.json();
    
    if (data.results && data.results.length > 0) {
      // Filtrado manual de seguridad para evitar falsos positivos (como puertas en lugar de bolsos rojos)
      const forbiddenWords = ['door', 'building', 'wall', 'architecture', 'interior', 'room', 'house', 'window', 'street', 'gate', 'nature', 'forest', 'mountain'];
      
      for (const result of data.results) {
        const desc = (result.alt_description || result.description || '').toLowerCase();
        const tags = (result.tags || []).map((t: any) => t.title.toLowerCase());
        
        const isUnwanted = forbiddenWords.some(word => desc.includes(word)) || 
                          tags.some((tag: string) => forbiddenWords.includes(tag));

        if (!isUnwanted) {
          return [{
            id: result.id,
            url: result.urls.regular,
            description: result.alt_description || query
          }];
        }
      }
    }

    return [];
  } catch (error) {
    console.error('Unsplash API Error:', error);
    return [];
  }
}
