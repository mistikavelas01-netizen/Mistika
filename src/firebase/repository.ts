import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  query,
  Timestamp,
  updateDoc,
  where,
  WhereFilterOp,
} from "firebase/firestore";
import { db } from "./firebase";

interface BaseEntity {
  _id?: string;
  createdAt?: Date | number;
  updatedAt?: Date | number;
}

const isTimestamp = (value: unknown): value is Timestamp =>
  value instanceof Timestamp;

const isPlainObject = (value: unknown): value is Record<string, unknown> => {
  if (!value || typeof value !== "object") return false;
  const proto = Object.getPrototypeOf(value);
  return proto === Object.prototype || proto === null;
};

const normalizeFirestoreData = <T>(value: T): T => {
  if (isTimestamp(value)) {
    return value.toMillis() as unknown as T;
  }
  if (value instanceof Date) {
    return value.getTime() as unknown as T;
  }
  if (Array.isArray(value)) {
    return value.map((item) => normalizeFirestoreData(item)) as unknown as T;
  }
  if (isPlainObject(value)) {
    const normalized: Record<string, unknown> = {};
    Object.entries(value).forEach(([key, entry]) => {
      normalized[key] = normalizeFirestoreData(entry);
    });
    return normalized as T;
  }
  return value;
};

/**
 * Repositorio genérico para Firestore.
 *
 * Proporciona operaciones CRUD comunes sin acoplar
 * la aplicación a una colección o entidad específica.
 *
 * @template T Tipo de entidad que extiende BaseEntity
 *
 * @example
 * interface Client extends BaseEntity {
 *   firstName: string;
 *   lastName: string;
 *   isActive: boolean;
 * }
 *
 * const clientRepo = new FirebaseRepository<Client>("clients");
 */
export class FirebaseRepository<T extends BaseEntity> {
  /**
   * Nombre de la colección en Firestore
   */
  private collectionName: string;

  /**
   * Crea una nueva instancia del repositorio.
   *
   * @param collectionName Nombre de la colección en Firestore
   *
   * @example
   * const userRepo = new FirebaseRepository<User>("users");
   */
  constructor(collectionName: string) {
    this.collectionName = collectionName;
  }

  /**
   * Obtiene la referencia a la colección de Firestore.
   *
   * @private
   * @returns Referencia a la colección
   */
  private colRef() {
    return collection(db, this.collectionName);
  }

  /**
   * Crea un nuevo documento en la colección.
   *
   * Agrega automáticamente:
   * - createdAt
   * - updatedAt
   *
   * @param data Datos de la entidad a crear
   * @returns La entidad creada con su ID generado
   *
   * @example
   * await repo.create({
   *   firstName: "Ana",
   *   lastName: "López",
   *   isActive: true
   * });
   */
  async create(data: T): Promise<T> {
    const now = Timestamp.now();

    const docRef = await addDoc(this.colRef(), {
      ...data,
      createdAt: now,
      updatedAt: now,
    });

    return normalizeFirestoreData({
      ...(data as T),
      _id: docRef.id,
      createdAt: now,
      updatedAt: now,
    }) as T;
  }

  /**
   * Obtiene un documento por su ID.
   *
   * @param id ID del documento
   * @returns La entidad encontrada o null si no existe
   *
   * @example
   * const client = await repo.getById("abc123");
   */
  async getById(id: string): Promise<T | null> {
    const snap = await getDoc(doc(this.colRef(), id));

    if (!snap.exists()) return null;

    return normalizeFirestoreData({ ...(snap.data() as T), _id: snap.id });
  }

  /**
   * Obtiene todos los documentos de la colección.
   *
   * ⚠️ Usar con cuidado en colecciones grandes.
   *
   * @returns Lista de entidades
   *
   * @example
   * const clients = await repo.getAll();
   */
  async getAll(): Promise<T[]> {
    const snap = await getDocs(this.colRef());

    return snap.docs.map((d) =>
      normalizeFirestoreData({ ...(d.data() as T), _id: d.id })
    );
  }

  /**
   * Actualiza parcialmente un documento por su ID.
   *
   * Actualiza automáticamente el campo updatedAt.
   *
   * @param id ID del documento
   * @param data Campos a actualizar
   *
   * @example
   * await repo.update("abc123", { isActive: false });
   */
  async update(id: string, data: Partial<T>): Promise<void> {
    await updateDoc(doc(this.colRef(), id), {
      ...data,
      updatedAt: Timestamp.now(),
    });
  }

  /**
   * Elimina un documento por su ID.
   *
   * ⚠️ Eliminación permanente.
   * Considera soft delete si necesitas auditoría.
   *
   * @param id ID del documento
   *
   * @example
   * await repo.remove("abc123");
   */
  async remove(id: string): Promise<void> {
    await deleteDoc(doc(this.colRef(), id));
  }

  /**
   * Realiza una consulta simple con `where`.
   *
   * Ideal para filtros básicos.
   *
   * @template K Clave de la entidad
   * @param field Campo a filtrar
   * @param operator Operador de comparación de Firestore
   * @param value Valor a comparar
   * @returns Lista de entidades que cumplen la condición
   *
   * @example
   * const actives = await repo.where("isActive", "==", true);
   */
  async where<K extends keyof T>(
    field: K,
    operator: WhereFilterOp,
    value: T[K]
  ): Promise<T[]> {
    const q = query(this.colRef(), where(field as string, operator, value));

    const snap = await getDocs(q);

    return snap.docs.map((d) =>
      normalizeFirestoreData({ ...(d.data() as T), _id: d.id })
    );
  }
}