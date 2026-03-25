'use server';
/**
 * @fileOverview Servicio de búsqueda de imágenes de moda en Unsplash.
 * Evita paisajes aleatorios devolviendo fallbacks controlados de moda.
 */

import { PlaceHolderImages } from '@/lib/placeholder-images';

export interface UnsplashImage {
  id: string;
  url: string;
  description: string;
}

export async function searchUnsplashImages(query: string, accessKey?: string, itemType?: string): Promise<UnsplashImage[]> {
  const key = accessKey || process.env.UNSPLASH_ACCESS_KEY;
  
  // Si no hay API KEY, usamos el placeholder de moda profesional del sistema
  if (!key || key === 'undefined' || key.trim() === '') {
    const fallback = PlaceHolderImages.find(img => img.id === `fashion-${itemType}`) || PlaceHolderImages[0];
    return [{
      id: `fallback-${Date.now()}`,
      url: fallback.imageUrl,
      description: `Sugerencia: ${query}`
    }];
  }

  // Filtro estricto para evitar modelos y paisajes: buscamos "ropa aislada"
  const productFocusedQuery = `${query} clothing garment flat lay isolated -person -model -landscape -nature`;

  try {
    const response = await fetch(
      `https://api.unsplash.com/search/photos?query=${encodeURIComponent(productFocusedQuery)}&per_page=1&orientation=portrait`,
      {
        headers: { Authorization: `Client-ID ${key}` },
        next: { revalidate: 3600 } // Cache por 1 hora
      }
    );

    if (!response.ok) throw new Error('Unsplash fail');
    
    const data = await response.json();
    
    if (data.results && data.results.length > 0) {
      return [{
        id: data.results[0].id,
        url: data.results[0].urls.regular,
        description: data.results[0].alt_description || query
      }];
    }

    // Si Unsplash no encuentra nada, usamos el placeholder de moda del sistema
    const fallback = PlaceHolderImages.find(img => img.id === `fashion-${itemType}`) || PlaceHolderImages[0];
    return [{
      id: `fallback-${Date.now()}`,
      url: fallback.imageUrl,
      description: query
    }];
  } catch (error) {
    const fallback = PlaceHolderImages.find(img => img.id === `fashion-${itemType}`) || PlaceHolderImages[0];
    return [{
      id: `error-${Date.now()}`,
      url: fallback.imageUrl,
      description: query
    }];
  }
}
