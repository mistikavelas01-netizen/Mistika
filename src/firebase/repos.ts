import "server-only";
import { FirebaseRepository } from "./repository";

/** Firebase entity with _id (document id) */
export interface FirebaseEntity {
  _id?: string;
  createdAt?: number;
  updatedAt?: number;
}

/** Map Firebase entity to API response shape: use `id` instead of `_id` */
export function toApiEntity<T extends FirebaseEntity>(
  entity: T | null
): (Omit<T, "_id"> & { id: string }) | null {
  if (!entity) return null;
  const { _id, ...rest } = entity;
  return { ...rest, id: _id ?? "" } as Omit<T, "_id"> & { id: string };
}

/** Map array of Firebase entities to API shape */
export function toApiEntityList<T extends FirebaseEntity>(
  list: T[]
): (Omit<T, "_id"> & { id: string })[] {
  return list.map((e) => toApiEntity(e)!);
}

// Collection names (must match Firestore)
export const COLLECTIONS = {
  ADMINS: "admins",
  CATEGORIES: "categories",
  PRODUCTS: "products",
  ORDERS: "orders",
  ORDER_ITEMS: "order_items",
} as const;

// Entity types for Firestore (use string ids and numbers for decimals/dates as stored)
export interface AdminEntity extends FirebaseEntity {
  username: string;
  passwordHash: string;
  passwordSalt: string;
  isActive: boolean;
}

export interface CategoryEntity extends FirebaseEntity {
  name: string;
  slug: string;
  description?: string | null;
  isActive: boolean;
}

export interface ProductEntity extends FirebaseEntity {
  name: string;
  description?: string | null;
  price?: number | null;
  discountPrice?: number | null;
  isOnSale: boolean;
  imageUrl?: string | null;
  slug?: string | null;
  categoryId: string;
  stock: number;
  isActive: boolean;
}

export interface OrderItemEntity extends FirebaseEntity {
  orderId: string;
  productId: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  productName: string;
}

export interface OrderEntity extends FirebaseEntity {
  orderNumber: string;
  status: string;
  totalAmount: number;
  subtotal: number;
  shippingCost: number;
  tax: number;
  customerName: string;
  customerEmail: string;
  customerPhone?: string | null;
  shippingStreet: string;
  shippingCity: string;
  shippingState: string;
  shippingZip: string;
  shippingCountry: string;
  billingStreet?: string | null;
  billingCity?: string | null;
  billingState?: string | null;
  billingZip?: string | null;
  billingCountry?: string | null;
  shippingMethod: string;
  paymentMethod?: string | null;
  paymentStatus: string;
  notes?: string | null;
}

// Repository instances
export const adminsRepo = new FirebaseRepository<AdminEntity>(COLLECTIONS.ADMINS);
export const categoriesRepo = new FirebaseRepository<CategoryEntity>(COLLECTIONS.CATEGORIES);
export const productsRepo = new FirebaseRepository<ProductEntity>(COLLECTIONS.PRODUCTS);
export const ordersRepo = new FirebaseRepository<OrderEntity>(COLLECTIONS.ORDERS);
export const orderItemsRepo = new FirebaseRepository<OrderItemEntity>(COLLECTIONS.ORDER_ITEMS);
