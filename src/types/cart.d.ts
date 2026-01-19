/**
 * Cart types
 * Available globally without import
 */

declare global {
  /**
   * Cart item structure
   */
  type CartItem = {
    id?: number | string;
    name: string;
    imageUrl?: string | null;
    price: number | string;
    priceNumber: number;
    quantity: number;
  };

  /**
   * Cart item input (without computed fields)
   */
  type CartItemInput = {
    id?: number | string;
    name: string;
    imageUrl?: string | null;
    price: number | string;
  };

  /**
   * Cart context value
   */
  type CartContextValue = {
    cart: CartItem[];
    addToCart: (item: CartItemInput) => void;
    removeFromCart: (name: string) => void;
    updateQuantity: (name: string, quantity: number) => void;
    clearCart: () => void;
    totalQuantity: number;
    totalPrice: number;
  };
}

export {};
