'use server';
/**
 * @fileOverview Servicio de búsqueda de imágenes de moda en Unsplash.
 * Prioriza fotos de producto aisladas (flat lay) y elimina fallbacks de paisajes.
 */

import { PlaceHolderImages } from '@/lib/placeholder-images';

export interface UnsplashImage {
  id: string;
  url: string;
  description: string;
}

export async function searchUnsplashImages(query: string, accessKey?: string, itemType?: string): Promise<UnsplashImage[]> {
  const key = accessKey || process.env.UNSPLASH_ACCESS_KEY;
  
  // Fallback profesional si no hay API KEY: Usar nuestros propios placeholders de moda
  const fashionFallback = PlaceHolderImages.find(img => img.id === `fashion-${itemType}`) || PlaceHolderImages[0];
  
  if (!key || key === 'undefined' || key.trim() === '') {
    return [{
      id: `fallback-${Date.now()}`,
      url: fashionFallback.imageUrl,
      description: `Sugerencia: ${query}`
    }];
  }

  // Filtro estricto para prendas: Producto aislado, flat lay, sin personas
  const productFocusedQuery = `${query} clothing product flat lay isolated white background -person -model -mannequin`;

  try {
    const response = await fetch(
      `https://api.unsplash.com/search/photos?query=${encodeURIComponent(productFocusedQuery)}&per_page=1&orientation=portrait`,
      {
        headers: { Authorization: `Client-ID ${key}` },
        next: { revalidate: 3600 }
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

    // Si Unsplash no devuelve nada de ropa, usar nuestro placeholder de moda, NUNCA paisajes
    return [{
      id: `fallback-no-result-${Date.now()}`,
      url: fashionFallback.imageUrl,
      description: query
    }];
  } catch (error) {
    return [{
      id: `error-${Date.now()}`,
      url: fashionFallback.imageUrl,
      description: query
    }];
  }
}
