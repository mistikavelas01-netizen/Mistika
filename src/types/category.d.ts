/**
 * Category types
 * Available globally without import
 */

declare global {
  /**
   * Category model from database (Firebase)
   */
  type Category = {
    id: string;
    name: string;
    slug: string;
    description: string | null;
    isActive: boolean;
    createdAt: Date | number;
    updatedAt: Date | number;
  };

  /**
   * Category input for creating/updating
   */
  type CategoryInput = {
    name: string;
    slug?: string;
    description?: string | null;
    isActive?: boolean;
  };

  /**
   * Category update input
   */
  type CategoryUpdateInput = {
    name?: string;
    slug?: string;
    description?: string | null;
    isActive?: boolean;
  };
}

export {};
