/**
 * Order types
 * Available globally without import
 */

declare global {
  /**
   * Order status
   */
  type OrderStatus =
    | "pending"
    | "processing"
    | "shipped"
    | "delivered"
    | "cancelled";

  /**
   * Payment status
   */
  type PaymentStatus =
    | "pending"
    | "paid"
    | "failed"
    | "refunded";

  /**
   * Payment method
   */
  type PaymentMethod =
    | "card"
    | "cash"
    | "transfer"
    | "other";

  /**
   * Shipping method
   */
  type ShippingMethod =
    | "standard"
    | "express";

  /**
   * Address for shipping/billing
   */
  type Address = {
    street: string;
    city: string;
    state: string;
    zip: string;
    country?: string;
  };

  /**
   * Order item (product in order)
   */
  type OrderItem = {
    id: string;
    orderId: string;
    productId: string;
    quantity: number;
    unitPrice: number;
    totalPrice: number;
    productName: string;
    createdAt: Date | number;
    product?: {
      id: string;
      name: string;
      imageUrl: string | null;
      category?: string;
    };
  };

  /**
   * Order model from database (Firebase)
   */
  type Order = {
    id: string;
    orderNumber: string;
    status: OrderStatus;
    /** Mercado Pago preference ID */
    mpPreferenceId?: string | null;
    /** Mercado Pago payment ID (para idempotencia) */
    mpPaymentId?: string | null;
    externalReference?: string | null;
    currency?: string | null;
    totalAmount: number;
    subtotal: number;
    shippingCost: number;
    tax: number;
    customerName: string;
    customerEmail: string;
    customerPhone: string | null;
    shippingStreet: string;
    shippingCity: string;
    shippingState: string;
    shippingZip: string;
    shippingCountry: string;
    billingStreet: string | null;
    billingCity: string | null;
    billingState: string | null;
    billingZip: string | null;
    billingCountry: string | null;
    shippingMethod: ShippingMethod;
    paymentMethod: PaymentMethod | null;
    paymentStatus: PaymentStatus;
    notes: string | null;
    createdAt: Date | number;
    updatedAt: Date | number;
    items?: OrderItem[];
  };

  /**
   * Order input for creating order (productId can be number from form or string from API)
   */
  type OrderInput = {
    customerName: string;
    customerEmail: string;
    customerPhone?: string;
    shippingAddress: Address;
    billingAddress?: Address;
    shippingMethod?: ShippingMethod;
    paymentMethod?: PaymentMethod;
    notes?: string;
    items: {
      productId: number | string;
      quantity: number;
      unitPrice: number;
      productName?: string;
    }[];
  };

  /**
   * Order update input
   */
  type OrderUpdateInput = {
    status?: OrderStatus;
    paymentStatus?: PaymentStatus;
    shippingMethod?: ShippingMethod;
    notes?: string;
  };

  /**
   * Checkout form data
   */
  type CheckoutFormData = {
    // Customer info
    customerName: string;
    customerEmail: string;
    customerPhone: string;
    
    // Shipping address
    shippingStreet: string;
    shippingCity: string;
    shippingState: string;
    shippingZip: string;
    shippingCountry: string;
    
    // Billing address (optional)
    useBillingAddress: boolean;
    billingStreet?: string;
    billingCity?: string;
    billingState?: string;
    billingZip?: string;
    billingCountry?: string;
    
    // Shipping method
    shippingMethod: ShippingMethod;
    
    // Payment method
    paymentMethod: PaymentMethod;
    
    // Notes
    notes?: string;
  };
}

export {};
