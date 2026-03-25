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
 * Filtra estrictamente para obtener fotos de producto (flat lay).
 */
export async function searchUnsplashImages(query: string, accessKey?: string, itemType?: string): Promise<UnsplashImage[]> {
  const key = accessKey || process.env.UNSPLASH_ACCESS_KEY;
  
  // Si no hay API KEY, usamos el placeholder de moda correspondiente
  if (!key || key === 'undefined' || key.trim() === '') {
    const fallback = PlaceHolderImages.find(img => img.id === `fashion-${itemType}`) || PlaceHolderImages[0];
    return [{
      id: `no-key-${Date.now()}`,
      url: fallback.imageUrl,
      description: `Configure su API KEY de Unsplash para ver prendas reales.`
    }];
  }

  // Query optimizado: Busca el producto aislado, evitando modelos, personas y rostros.
  const productFocusedQuery = `${query} clothing garment flat lay product shot -person -model -face -mannequin`;

  try {
    const response = await fetch(
      `https://api.unsplash.com/search/photos?query=${encodeURIComponent(productFocusedQuery)}&per_page=1&orientation=portrait&content_filter=high`,
      {
        headers: {
          Authorization: `Client-ID ${key}`
        }
      }
    );

    if (!response.ok) throw new Error('Error al conectar con Unsplash API');
    
    const data = await response.json();
    
    if (data.results && data.results.length > 0) {
      const img = data.results[0];
      return [{
        id: img.id,
        url: img.urls.regular,
        description: img.alt_description || query
      }];
    }

    // Si Unsplash no encuentra nada específico, devolvemos el placeholder de moda para no mostrar imágenes aleatorias
    const fallback = PlaceHolderImages.find(img => img.id === `fashion-${itemType}`) || PlaceHolderImages[0];
    return [{
      id: `fallback-${Date.now()}`,
      url: fallback.imageUrl,
      description: `Sugerencia: ${query}`
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
