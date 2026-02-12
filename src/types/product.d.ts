/**
 * Product types
 * Available globally without import
 */

declare global {
  /**
   * Product model from database (Firebase)
   */
  type Product = {
    id: string;
    name: string;
    description: string | null;
    price: number | null;
    discountPrice: number | null;
    isOnSale: boolean;
    imageUrl: string | null;
    slug: string | null;
    categoryId: string;
    category?: Category | string;
    stock: number;
    isActive: boolean;
    createdAt: Date | number;
    updatedAt: Date | number;
  };

  /**
   * Product input for creating/updating
   */
  type ProductInput = {
    name: string;
    description?: string | null;
    price?: number | null;
    discountPrice?: number | null;
    isOnSale?: boolean;
    imageUrl?: string | null;
    slug?: string | null;
    categoryId?: string;
    category?: string; // Legacy support - will be converted to categoryId
    stock?: number;
    isActive?: boolean;
  };

  /**
   * Product display props (for UI components)
   */
  type ProductDisplay = {
    id: string;
    name: string;
    description?: string | null;
    price: number | string;
    imageUrl?: string | null;
    category?: string;
    stock?: number;
  };

  /**
   * Product card props (matches Product schema)
   */
  type ProductCardProps = {
    id: string;
    name: string;
    price: number | string;
    imageUrl?: string | null;
    stock?: number;
  };
}

export {};
