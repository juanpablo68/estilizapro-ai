'use server';
/**
 * @fileOverview Servicio de búsqueda de imágenes de moda en Unsplash optimizado para productos sin modelos.
 */

import { PlaceHolderImages } from '@/lib/placeholder-images';

export interface UnsplashImage {
  id: string;
  url: string;
  description: string;
}

/**
 * Busca imágenes de moda en Unsplash basadas en palabras clave de la IA.
 * Se han añadido filtros drásticos para asegurar que solo se vean prendas de ropa.
 */
export async function searchUnsplashImages(query: string, accessKey?: string, itemType?: string): Promise<UnsplashImage[]> {
  const key = accessKey || process.env.UNSPLASH_ACCESS_KEY;
  
  // Reforzamos el query para evitar modelos, caras y personas. 
  // Buscamos específicamente "flat lay product shot" para una estética limpia.
  const productFocusedQuery = `${query} clothing garment flat lay product shot -person -model -face -mannequin -landscape`;

  // Fallback a nuestros placeholders de moda si no hay key
  if (!key || key === 'undefined') {
    const fallback = PlaceHolderImages.find(img => img.id === `fashion-${itemType}`) || PlaceHolderImages[0];
    return [{
      id: `fallback-${Date.now()}`,
      url: fallback.imageUrl,
      description: `Sugerencia: ${query}`
    }];
  }

  try {
    const response = await fetch(
      `https://api.unsplash.com/search/photos?query=${encodeURIComponent(productFocusedQuery)}&per_page=1&orientation=portrait&content_filter=high`,
      {
        headers: {
          Authorization: `Client-ID ${key}`
        }
      }
    );

    if (!response.ok) throw new Error('Error al conectar con Unsplash');
    
    const data = await response.json();
    
    if (data.results && data.results.length > 0) {
      const img = data.results[0];
      return [{
        id: img.id,
        url: img.urls.regular,
        description: img.alt_description || query
      }];
    }

    // Intento relajado si el estricto falla
    const relaxedResponse = await fetch(
      `https://api.unsplash.com/search/photos?query=${encodeURIComponent(query + ' clothing product shot')}&per_page=1&orientation=portrait`,
      { headers: { Authorization: `Client-ID ${key}` } }
    );
    const relaxedData = await relaxedResponse.json();
    if (relaxedData.results && relaxedData.results.length > 0) {
      const img = relaxedData.results[0];
      return [{
        id: img.id,
        url: img.urls.regular,
        description: img.alt_description || query
      }];
    }

    // Si todo falla, usar placeholder de moda
    const fallback = PlaceHolderImages.find(img => img.id === `fashion-${itemType}`) || PlaceHolderImages[0];
    return [{
      id: `fallback-final-${Date.now()}`,
      url: fallback.imageUrl,
      description: query
    }];
  } catch (error) {
    console.error('Unsplash API Error:', error);
    const fallback = PlaceHolderImages.find(img => img.id === `fashion-${itemType}`) || PlaceHolderImages[0];
    return [{
      id: `error-fallback-${Date.now()}`,
      url: fallback.imageUrl,
      description: query
    }];
  }
}
