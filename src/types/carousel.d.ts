/**
 * Carousel types
 * Available globally without import
 */

declare global {
  /**
   * Carousel item model from database (Firebase)
   */
  type CarouselItem = {
    id: string;
    name?: string | null;
    imageUrl: string;
    isActive: boolean;
    createdAt: Date | number;
    updatedAt: Date | number;
  };

  /**
   * Carousel item input for creating
   */
  type CarouselItemInput = {
    name?: string | null;
    imageUrl: string;
    isActive?: boolean;
  };

  /**
   * Carousel item update input
   */
  type CarouselItemUpdateInput = {
    name?: string | null;
    imageUrl?: string;
    isActive?: boolean;
  };
}

export {};
