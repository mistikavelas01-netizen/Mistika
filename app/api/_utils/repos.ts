import * as baseRepos from "@/firebase/repos";
import type { FirebaseRepository } from "@/firebase/repository";
import { withDependency } from "./dependencies";

type RepoBaseEntity = {
  _id?: string;
  createdAt?: Date | number;
  updatedAt?: Date | number;
};

const wrapRepo = <T extends RepoBaseEntity>(repo: FirebaseRepository<T>, name: string) => {
  return {
    create: (data: T) =>
      withDependency({ name: "firestore", operation: `${name}.create` }, () => repo.create(data)),
    getById: (id: string) =>
      withDependency({ name: "firestore", operation: `${name}.getById` }, () => repo.getById(id)),
    getAll: () =>
      withDependency({ name: "firestore", operation: `${name}.getAll` }, () => repo.getAll()),
    update: (id: string, data: Partial<T>) =>
      withDependency({ name: "firestore", operation: `${name}.update` }, () => repo.update(id, data)),
    remove: (id: string) =>
      withDependency({ name: "firestore", operation: `${name}.remove` }, () => repo.remove(id)),
    where: <K extends keyof T>(field: K, operator: Parameters<FirebaseRepository<T>["where"]>[1], value: T[K]) =>
      withDependency({ name: "firestore", operation: `${name}.where` }, () => repo.where(field, operator, value)),
  };
};

export const adminsRepo = wrapRepo(baseRepos.adminsRepo, "admins");
export const categoriesRepo = wrapRepo(baseRepos.categoriesRepo, "categories");
export const productsRepo = wrapRepo(baseRepos.productsRepo, "products");
export const ordersRepo = wrapRepo(baseRepos.ordersRepo, "orders");
export const orderItemsRepo = wrapRepo(baseRepos.orderItemsRepo, "order_items");
export const orderDraftsRepo = wrapRepo(baseRepos.orderDraftsRepo, "order_drafts");
export const checkoutOrdersRepo = wrapRepo(baseRepos.checkoutOrdersRepo, "checkout_orders");
export const paymentAttemptsRepo = wrapRepo(baseRepos.paymentAttemptsRepo, "payment_attempts");
export const webhookEventsRepo = wrapRepo(baseRepos.webhookEventsRepo, "webhook_events");
export const paymentsRepo = wrapRepo(baseRepos.paymentsRepo, "payments");

export const toApiEntity = baseRepos.toApiEntity;
export const toApiEntityList = baseRepos.toApiEntityList;
export type {
  AdminEntity,
  CategoryEntity,
  ProductEntity,
  OrderEntity,
  OrderItemEntity,
  OrderDraftEntity,
  CheckoutOrderEntity,
  PaymentAttemptEntity,
  WebhookEventEntity,
  PaymentEntity,
} from "@/firebase/repos";
