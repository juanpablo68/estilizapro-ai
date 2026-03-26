'use server';
/**
 * @fileOverview Servicio de búsqueda visual de moda optimizado para Unsplash.
 * Utiliza términos de "flat lay" y "product photography" para evitar fotos de personas.
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

  // Refinamiento estricto para producto real sin personas. 
  // "Flat lay" y "Product photography" son claves.
  const refinedQuery = `${query} fashion product photography flat lay isolated on white background`.trim();

  try {
    const response = await fetch(
      `https://api.unsplash.com/search/photos?query=${encodeURIComponent(refinedQuery)}&per_page=5&orientation=portrait&content_filter=high`,
      {
        headers: { Authorization: `Client-ID ${key}` },
        next: { revalidate: 86400 } // Cache por 24 horas
      }
    );

    if (!response.ok) return [];
    
    const data = await response.json();
    
    if (data.results && data.results.length > 0) {
      // Filtrar resultados que mencionen personas o caras en sus metadatos si es posible
      const filteredResults = data.results.filter((result: any) => {
        const desc = (result.alt_description || "").toLowerCase();
        const tags = (result.tags || []).map((t: any) => t.title.toLowerCase());
        const forbidden = ['person', 'face', 'woman', 'man', 'girl', 'boy', 'model', 'people', 'portrait'];
        return !forbidden.some(word => desc.includes(word) || tags.includes(word));
      });

      const finalResults = filteredResults.length > 0 ? filteredResults : data.results;

      return finalResults.map((result: any) => ({
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
