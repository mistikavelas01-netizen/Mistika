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
  ORDER_DRAFTS: "order_drafts",
  CHECKOUT_ORDERS: "checkout_orders",
  PAYMENT_ATTEMPTS: "payment_attempts",
  WEBHOOK_EVENTS: "webhook_events",
  PAYMENTS: "payments",
} as const;

/** Estados del flujo de pago (Checkout Pro) */
export type CheckoutOrderStatus =
  | "CREATED"
  | "CHECKOUT_STARTED"
  | "PENDING"
  | "APPROVED"
  | "REJECTED"
  | "CANCELLED"
  | "EXPIRED"
  | "FAILED";

/** Orden de checkout: se crea al generar la preferencia MP; external_reference = este id */
export interface CheckoutOrderEntity extends FirebaseEntity {
  draftId: string;
  status: CheckoutOrderStatus;
  preferenceId: string | null;
  initPoint: string | null;
  /** ID de la orden final (orders) cuando status = APPROVED */
  convertedOrderId: string | null;
  orderNumber: string | null;
  currency: string;
  totalAmount: number;
}

/** Intento de pago (MP); idempotencia por paymentId */
export interface PaymentAttemptEntity extends FirebaseEntity {
  checkoutOrderId: string;
  orderId: string | null;
  preferenceId: string | null;
  paymentId: string;
  merchantOrderId: string | null;
  status: string;
  raw: Record<string, unknown> | null;
}

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
  /** Mercado Pago preference ID (Checkout Pro) */
  mpPreferenceId?: string | null;
  /** Mercado Pago payment ID - usado para idempotencia en webhooks */
  mpPaymentId?: string | null;
  /** Referencia externa enviada a MP (normalmente orderId) */
  externalReference?: string | null;
  /** Moneda (ej. MXN) */
  currency?: string | null;
  /** Logs de webhooks para auditoría (payload raw) */
  mpWebhookLogs?: { topic: string; paymentId?: string; timestamp: number }[];
}

/** Estado de evento de webhook (auditoría) */
export type WebhookEventStatus = "received" | "processed" | "failed";

/** Evento de webhook guardado para idempotencia y auditoría */
export interface WebhookEventEntity extends FirebaseEntity {
  provider: string;
  eventId: string;
  topic: string;
  action: string;
  resourceId: string;
  actionCreatedAtBucket?: string | null;
  status: WebhookEventStatus;
  retryCount: number;
  lastError?: string | null;
  rawPayloadTruncated?: string | null;
  processedAt?: number | null;
}

/** Estado de pago MP en nuestra entidad Payment */
export type PaymentStatus =
  | "approved"
  | "pending"
  | "rejected"
  | "cancelled"
  | "refunded"
  | "charged_back"
  | "in_process"
  | "in_mediation"
  | "expired";

/** Pago sincronizado desde MP (BillingService, acceso) */
export interface PaymentEntity extends FirebaseEntity {
  mpPaymentId: string;
  status: PaymentStatus;
  amount: number;
  currency: string;
  payerEmail?: string | null;
  payerId?: string | null;
  externalReference?: string | null;
  metadata?: Record<string, unknown> | null;
  accessActive: boolean;
  riskFlagged?: boolean | null;
  lastMpStatus?: string | null;
  lastSyncedAt?: number | null;
}

/** Borrador de orden: se crea antes del pago y se convierte en Order cuando MP aprueba */
export interface OrderDraftEntity extends FirebaseEntity {
  status: "pending" | "converted" | "expired";
  /** ID de la orden creada tras pago exitoso */
  convertedOrderId?: string | null;
  orderNumber?: string | null;
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
  notes?: string | null;
  /** Items del borrador (productId, quantity, unitPrice, totalPrice, productName) */
  items: { productId: string; quantity: number; unitPrice: number; totalPrice: number; productName: string }[];
}

// Repository instances
export const adminsRepo = new FirebaseRepository<AdminEntity>(COLLECTIONS.ADMINS);
export const categoriesRepo = new FirebaseRepository<CategoryEntity>(COLLECTIONS.CATEGORIES);
export const productsRepo = new FirebaseRepository<ProductEntity>(COLLECTIONS.PRODUCTS);
export const ordersRepo = new FirebaseRepository<OrderEntity>(COLLECTIONS.ORDERS);
export const orderItemsRepo = new FirebaseRepository<OrderItemEntity>(COLLECTIONS.ORDER_ITEMS);
export const orderDraftsRepo = new FirebaseRepository<OrderDraftEntity>(COLLECTIONS.ORDER_DRAFTS);
export const checkoutOrdersRepo = new FirebaseRepository<CheckoutOrderEntity>(COLLECTIONS.CHECKOUT_ORDERS);
export const paymentAttemptsRepo = new FirebaseRepository<PaymentAttemptEntity>(COLLECTIONS.PAYMENT_ATTEMPTS);
export const webhookEventsRepo = new FirebaseRepository<WebhookEventEntity>(COLLECTIONS.WEBHOOK_EVENTS);
export const paymentsRepo = new FirebaseRepository<PaymentEntity>(COLLECTIONS.PAYMENTS);
