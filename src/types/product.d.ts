/**
 * Product types
 * Available globally without import
 */

declare global {
  /**
   * Product model from database (matches Prisma schema)
   */
  type Product = {
    id: number;
    name: string;
    description: string | null;
    price: number | null; // Decimal from DB converted to number
    imageUrl: string | null;
    slug: string | null;
    category: string;
    stock: number;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
  };

  /**
   * Product input for creating/updating
   */
  type ProductInput = {
    name: string;
    description?: string | null;
    price?: number | null;
    imageUrl?: string | null;
    slug?: string | null;
    category?: string;
    stock?: number;
    isActive?: boolean;
  };

  /**
   * Product display props (for UI components)
   */
  type ProductDisplay = {
    id: number;
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
    id: number;
    name: string;
    price: number | string;
    imageUrl?: string | null;
  };
}

export {};
