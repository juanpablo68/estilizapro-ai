'use server';
/**
 * @fileOverview Servicio de Shopify desactivado por restricciones de acceso.
 */

export interface ShopifyProduct {
  id: string;
  title: string;
  description: string;
  imageUrl: string;
  price: string;
  currency: string;
  url: string;
}

/**
 * Función dummy para evitar errores de compilación si hay referencias residuales.
 * No realiza ninguna petición a la API.
 */
export async function searchShopifyProducts(): Promise<ShopifyProduct[]> {
  console.log('Shopify API desactivada por el usuario.');
  return [];
}
